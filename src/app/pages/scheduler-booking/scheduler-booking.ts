// scheduler-booking.ts

import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { CalendarHeaderComponent } from '../../components/calendar/calendar-header/calendar-header';
import { CalendarGridComponent } from '../../components/calendar/calendar-grid/calendar-grid';
import { CalendarWeekComponent } from '../../components/calendar/calender-week/calender-week';
import { CalendarMonthComponent } from '../../components/calendar/calender-month/calender-month';
import { AppointmentDrawerComponent } from '../../components/calendar/appointment-drawer/appointment-drawer';
import { AppointmentDetailsDrawerComponent } from '../../components/calendar/appointment-details-drawer/appointment-details-drawer';
import { CheckoutDrawerComponent } from '../../components/calendar/checkout-drawer/checkout-drawer';
import { InvoiceDialogComponent, InvoiceDialogData } from '../../components/calendar/invoice-dialog/invoice-dialog';
import { AppointmentView, CalendarViewMode } from '../../models/calendar/models.model';
import { AppointmentsService } from '../../services/calendar/appointments';
import { ServicesService } from '../../services/calendar/services';
import { AppointmentsHttpService } from '../../services/calendar/appointments-http.service';
import { Subscription } from 'rxjs';

/** Which content the right sidenav is showing */
type DrawerMode = 'details' | 'create' | 'edit' | 'checkout';

@Component({
  selector: 'app-scheduler-booking',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatDialogModule,
    CalendarHeaderComponent,
    CalendarGridComponent,
    CalendarWeekComponent,
    CalendarMonthComponent,
    AppointmentDrawerComponent,
    AppointmentDetailsDrawerComponent,
    CheckoutDrawerComponent
  ],
  templateUrl: './scheduler-booking.html',
  styleUrl: './scheduler-booking.scss'
})
export class SchedulerBooking {
  private appointmentsService = inject(AppointmentsService);
  private servicesService = inject(ServicesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private appointmentsApi = inject(AppointmentsHttpService);
  private checkoutSub?: Subscription;
  private _pendingCheckoutApt: AppointmentView | null = null;

  private handleCheckoutResult(
    appointmentId: string,
    invoice: {
      invoiceNumber: string;
      invoiceId: number;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      currency: string;
      paymentTypeId?: number;
      paymentStatus: string;
    }
  ): void {
    this.showNotification('Sale confirmed — appointment checked out');

    // Get fresh appointment data
    const rawApt = this.appointmentsService.getAppointmentById(appointmentId);
    if (!rawApt) return;

    const service = this.servicesService.getServiceById(rawApt.serviceId);
    if (!service) return;

    const discountedPrice = this.servicesService.calculateDiscountedPrice(service);
    const total = discountedPrice * rawApt.numberOfPersons;
    const remaining = Math.max(0, total - rawApt.paidAmount);

    // Use the pending details apt or find from current appointments
    const detailsApt = this._pendingCheckoutApt
      ?? this.appointmentsService.appointmentsForSelectedDate()
          .find(a => a.id === appointmentId);

    this._pendingCheckoutApt = null;

    if (!detailsApt) return;

    const enrichedApt: AppointmentView = {
      ...detailsApt,
      ...rawApt,
      totalPrice: total,
      remainingAmount: remaining,
      discountedPrice
    };

    // ✅ Use REAL invoice data from the API — no more fake numbers
    const dialogData: InvoiceDialogData = {
      appointment: enrichedApt,
      invoiceNumber: invoice.invoiceNumber,        // ✅ real
      invoiceDate: new Date(),
      total: invoice.totalAmount,                  // ✅ real
      paid: invoice.paidAmount,                    // ✅ real
      remaining: invoice.remainingAmount,           // ✅ real
      currency: invoice.currency,                   // ✅ real
      paymentType: invoice.paymentTypeId,           // ✅ real
      paymentStatus: invoice.paymentStatus,         // ✅ real
      locationName: 'Main Branch — Kuwait City'
    };

    this.dialog.open(InvoiceDialogComponent, {
      data: dialogData,
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      panelClass: 'invoice-dialog-panel',
      autoFocus: false
    });
  }
  constructor() {
    // Subscribe to real checkout results from the API
    this.checkoutSub = this.appointmentsService.checkoutResult$.subscribe(result => {
      this.handleCheckoutResult(result.appointmentId, result);
    });
  }

  @ViewChild(CalendarGridComponent) calendarGrid!: CalendarGridComponent;

  readonly ViewMode = CalendarViewMode;

  // Drawer state
  isDrawerOpen = signal(false);
  drawerMode = signal<DrawerMode>('create');

  /** Appointment being viewed in details or checkout drawer */
  selectedAppointmentForDetails = signal<AppointmentView | null>(null);

  /** Appointment being edited in the form drawer */
  appointmentToEdit = signal<AppointmentView | null>(null);

  currentViewMode = computed(() => this.appointmentsService.selectedViewMode());

  // ── Drawer openers ──

  openDrawerForCreate(): void {
    this.drawerMode.set('create');
    this.appointmentToEdit.set(null);
    this.selectedAppointmentForDetails.set(null);
    this.isDrawerOpen.set(true);
  }

  /** Single-click on appointment → details */
  openDrawerForDetails(appointment: AppointmentView): void {
    this.drawerMode.set('details');
    this.selectedAppointmentForDetails.set(appointment);
    this.appointmentToEdit.set(null);
    this.isDrawerOpen.set(true);
  }

  /** Double-click on appointment → edit form */
  openDrawerForEdit(appointment: AppointmentView): void {
    this.drawerMode.set('edit');
    this.appointmentToEdit.set(appointment);
    this.selectedAppointmentForDetails.set(null);
    this.isDrawerOpen.set(true);
  }

  /** From details drawer "Edit" button */
  onEditRequestedFromDetails(appointmentId: string): void {
    const apt = this.selectedAppointmentForDetails();
    if (apt && apt.id === appointmentId) {
      this.openDrawerForEdit(apt);
    } else {
      const found = this.appointmentsService.appointmentsForSelectedDate()
        .find(a => a.id === appointmentId);
      if (found) {
        this.openDrawerForEdit(found);
      }
    }
  }

  /** From details drawer "Checkout" button → switch to checkout drawer */
  onStartCheckout(appointmentId: string): void {
    const apt = this.selectedAppointmentForDetails();
    if (apt && apt.id === appointmentId) {
      this.drawerMode.set('checkout');
    } else {
      const found = this.appointmentsService.appointmentsForSelectedDate()
        .find(a => a.id === appointmentId);
      if (found) {
        this.selectedAppointmentForDetails.set(found);
        this.drawerMode.set('checkout');
      }
    }
  }

  /** Checkout "Back" → return to details */
  onBackToDetailsFromCheckout(): void {
    this.drawerMode.set('details');
  }

  /**
   * Checkout confirmed → close drawer, then open invoice dialog.
   */
   onCheckoutConfirmed(appointmentId: string): void {
    // The drawer already called checkoutAppointment().
    // The actual dialog opening happens in handleCheckoutResult()
    // when the API responds via checkoutResult$.

    // For now, just close the drawer and show a notification
    const detailsApt = this.selectedAppointmentForDetails();
    this.closeDrawer();
    this.showNotification('Processing checkout...');

    // Store the details apt temporarily for use in handleCheckoutResult
    this._pendingCheckoutApt = detailsApt;
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.drawerMode.set('create');
    this.appointmentToEdit.set(null);
    this.selectedAppointmentForDetails.set(null);
  }

  onAppointmentCreated(): void {
    this.showNotification('Appointment created successfully');
  }

  onAppointmentUpdated(): void {
    this.showNotification('Appointment updated successfully');
  }

  onAppointmentDeleted(): void {
    this.showNotification('Appointment deleted', 'warn');
  }

  onScrollToNow(): void {
    if (this.currentViewMode() !== CalendarViewMode.DAY) return;
    if (this.calendarGrid) {
      this.calendarGrid.scrollToNow();
    }
  }

  onDaySelected(date: Date): void {
    this.appointmentsService.setSelectedDate(date);
    this.appointmentsService.setViewMode(CalendarViewMode.DAY);
  }

  onCreateForDate(date: Date): void {
    this.appointmentsService.setSelectedDate(date);
    this.openDrawerForCreate();
  }

  private showNotification(message: string, type: 'success' | 'warn' = 'success'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'warn' ? 'snack-warn' : 'snack-success'
    });
  }

  onViewInvoice(apt: AppointmentView): void {
    const backendId = parseInt(apt.id.replace('apt-', ''), 10);

    // Fetch real invoice from backend
    this.appointmentsApi.getInvoice(backendId).subscribe({
      next: (invoice) => {
        const rawApt = this.appointmentsService.getAppointmentById(apt.id);
        if (!rawApt) return;

        const service = this.servicesService.getServiceById(rawApt.serviceId);
        if (!service) return;

        const discountedPrice = this.servicesService.calculateDiscountedPrice(service);
        const total = discountedPrice * rawApt.numberOfPersons;
        const remaining = Math.max(0, total - rawApt.paidAmount);

        const enrichedApt: AppointmentView = {
          ...apt,
          ...rawApt,
          totalPrice: total,
          remainingAmount: remaining,
          discountedPrice
        };

        const dialogData: InvoiceDialogData = {
          appointment: enrichedApt,
          invoiceNumber: invoice.InvoiceNumber,      // ✅ real
          invoiceDate: new Date(invoice.CreatedAt),   // ✅ real
          total: invoice.TotalAmount,                 // ✅ real
          paid: invoice.PaidAmount,                   // ✅ real
          remaining: invoice.RemainingAmount,          // ✅ real
          currency: invoice.Currency,                  // ✅ real
          paymentType: invoice.PaymentTypeId,          // ✅ real
          paymentStatus: invoice.PaymentStatus,        // ✅ real
          locationName: 'Main Branch — Kuwait City'
        };

        this.dialog.open(InvoiceDialogComponent, {
          data: dialogData,
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          panelClass: 'invoice-dialog-panel',
          autoFocus: false
        });
      },
      error: (err) => {
        console.error('Failed to load invoice', err);
        this.showNotification('Failed to load invoice', 'warn');
      }
    });
  }
}