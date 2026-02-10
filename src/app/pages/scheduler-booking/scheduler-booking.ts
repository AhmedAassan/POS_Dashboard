// scheduler-booking.ts - PATCHED (scroll-to-now fix)

import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CalendarHeaderComponent } from '../../components/calendar/calendar-header/calendar-header';
import { CalendarGridComponent } from '../../components/calendar/calendar-grid/calendar-grid';
import { AppointmentDrawerComponent } from '../../components/calendar/appointment-drawer/appointment-drawer';
import { AppointmentView } from '../../models/calendar/models.model';

@Component({
  selector: 'app-scheduler-booking',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatSnackBarModule,
    CalendarHeaderComponent,
    CalendarGridComponent,
    AppointmentDrawerComponent
  ],
  templateUrl: './scheduler-booking.html',
  styleUrl: './scheduler-booking.scss'
})
export class SchedulerBooking {
  // Use static: false since the grid is always present but we want to wait for ngAfterViewInit
  @ViewChild(CalendarGridComponent) calendarGrid!: CalendarGridComponent;

  isDrawerOpen = signal(false);
  appointmentToEdit = signal<AppointmentView | null>(null);

  constructor(private snackBar: MatSnackBar) {}

  openDrawerForCreate(): void {
    this.appointmentToEdit.set(null);
    this.isDrawerOpen.set(true);
  }

  openDrawerForEdit(appointment: AppointmentView): void {
    this.appointmentToEdit.set(appointment);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.appointmentToEdit.set(null);
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

  /**
   * Scroll to current time - delegates to calendar grid
   */
  onScrollToNow(): void {
    if (this.calendarGrid) {
      this.calendarGrid.scrollToNow();
    } else {
      console.warn('Calendar grid not available');
    }
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