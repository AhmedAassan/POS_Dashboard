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
    // Resolve the freshest appointment data before closing the drawer
    const rawApt = this.appointmentsService.getAppointmentById(appointmentId);
    const detailsApt = this.selectedAppointmentForDetails();

    // Close drawer first
    this.closeDrawer();
    this.showNotification('Sale confirmed — appointment checked out');

    // Build the enriched view for the dialog
    if (!rawApt) return;

    const service = this.servicesService.getServiceById(rawApt.serviceId);
    if (!service) return;

    const discountedPrice = this.servicesService.calculateDiscountedPrice(service);
    const total = discountedPrice * rawApt.numberOfPersons;
    const remaining = Math.max(0, total - rawApt.paidAmount);

    // Merge with the last known AppointmentView for client/staff/service refs
    const enrichedApt: AppointmentView = detailsApt
      ? {
          ...detailsApt,
          ...rawApt,
          totalPrice: total,
          remainingAmount: remaining,
          discountedPrice
        }
      : this.appointmentsService.appointmentsForSelectedDate()
          .find(a => a.id === appointmentId) ?? detailsApt!;

    if (!enrichedApt) return;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const dialogData: InvoiceDialogData = {
      appointment: enrichedApt,
      invoiceNumber,
      invoiceDate: new Date(),
      total,
      paid: rawApt.paidAmount,
      remaining,
      currency: service.currency,
      paymentType: rawApt.paymentType,
      paymentStatus: rawApt.paymentStatus,
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
}