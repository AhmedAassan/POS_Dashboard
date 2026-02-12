// components/appointment-details-drawer/appointment-details-drawer.component.ts

import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppointmentView } from '../../../models/calendar/models.model';
import { AppointmentsService } from '../../../services/calendar/appointments';

@Component({
  selector: 'app-appointment-details-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="details-container">
      <!-- Header -->
      <div class="details-header">
        <mat-form-field appearance="outline" class="status-select">
          <mat-select
            [value]="appointment().status"
            (selectionChange)="onStatusChange($event.value)">
            <mat-option value="scheduled">
              <div class="status-option">
                <span class="status-dot scheduled"></span>
                Confirmed
              </div>
            </mat-option>
            <mat-option value="completed">
              <div class="status-option">
                <span class="status-dot completed"></span>
                Completed
              </div>
            </mat-option>
            <mat-option value="no-show">
              <div class="status-option">
                <span class="status-dot no-show"></span>
                No Show
              </div>
            </mat-option>
            <mat-option value="cancelled">
              <div class="status-option">
                <span class="status-dot cancelled"></span>
                Cancelled
              </div>
            </mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-icon-button (click)="close.emit()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Title block -->
      <div class="details-title-block">
        <div class="title-date-line">
          <mat-icon class="title-icon">calendar_today</mat-icon>
          <span>{{ formattedDate() }}</span>
        </div>
        <div class="title-time-line">
          <mat-icon class="title-icon">schedule</mat-icon>
          <span>{{ formattedTimeRange() }}</span>
        </div>
        <div class="title-service-line">
          <span
            class="service-color-dot"
            [style.background-color]="appointment().service.colorHex">
          </span>
          <span class="service-name">{{ appointment().service.name }}</span>
        </div>
        <div class="title-duration-line">
          {{ formattedDuration() }}
          @if (appointment().numberOfPersons > 1) {
            <span class="persons-badge">
              <mat-icon>group</mat-icon>
              {{ appointment().numberOfPersons }} persons
            </span>
          }
          @if (appointment().serviceType === 'HOME') {
            <span class="home-badge">
              <mat-icon>home</mat-icon>
              Home Service
            </span>
          }
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Content sections -->
      <div class="details-content">
        <!-- Client info -->
        <section class="details-section">
          <h4 class="section-label">CLIENT</h4>
          <div class="client-info-row">
            <div class="client-avatar" [style.background-color]="appointment().staff.color">
              {{ appointment().client.name.charAt(0) }}
            </div>
            <div class="client-details">
              <div class="client-name-row">
                <span class="client-name">{{ appointment().client.name }}</span>
                @if (appointment().client.isVIP) {
                  <span class="vip-badge">⭐ VIP</span>
                }
              </div>
              <span class="client-phone">{{ appointment().client.phone }}</span>
              @if (appointment().client.email) {
                <span class="client-email">{{ appointment().client.email }}</span>
              }
            </div>
          </div>
          @if (appointment().client.unpaidAmount > 0) {
            <div class="client-unpaid-warning">
              <mat-icon>warning</mat-icon>
              <span>{{ appointment().client.currency }} {{ appointment().client.unpaidAmount }} unpaid balance</span>
            </div>
          }
        </section>

        <mat-divider></mat-divider>

        <!-- Staff info -->
        <section class="details-section">
          <h4 class="section-label">STAFF</h4>
          <div class="staff-info-row">
            <div class="staff-avatar-small" [style.background-color]="appointment().staff.color">
              {{ appointment().staff.avatar }}
            </div>
            <span class="staff-name">{{ appointment().staff.name }}</span>
          </div>
        </section>

        <mat-divider></mat-divider>

        <!-- Payment status -->
        <section class="details-section">
          <h4 class="section-label">PAYMENT</h4>
          <div class="payment-info">
            <div class="payment-row">
              <span class="payment-label">Status</span>
              <span class="payment-status-badge" [class]="'status-' + appointment().paymentStatus.toLowerCase()">
                {{ paymentStatusLabel() }}
              </span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Total</span>
              <span class="payment-value">{{ appointment().service.currency }} {{ appointment().totalPrice.toFixed(2) }}</span>
            </div>
            @if (appointment().paidAmount > 0) {
              <div class="payment-row">
                <span class="payment-label">Paid</span>
                <span class="payment-value paid">{{ appointment().service.currency }} {{ appointment().paidAmount.toFixed(2) }}</span>
              </div>
            }
            @if (appointment().remainingAmount > 0) {
              <div class="payment-row">
                <span class="payment-label">Remaining</span>
                <span class="payment-value remaining">{{ appointment().service.currency }} {{ appointment().remainingAmount.toFixed(2) }}</span>
              </div>
            }
            @if (appointment().paymentType) {
              <div class="payment-row">
                <span class="payment-label">Method</span>
                <span class="payment-value">{{ appointment().paymentType }}</span>
              </div>
            }
          </div>
        </section>

        <mat-divider></mat-divider>

        <!-- Checkout status -->
        @if (appointment().checkoutStatus === 'checked_out') {
          <section class="details-section">
            <div class="checkout-done-badge">
              <mat-icon>verified</mat-icon>
              <span>Checked Out</span>
            </div>
          </section>
          <mat-divider></mat-divider>
        }

        <!-- Appointment history -->
        <section class="details-section">
          <h4 class="section-label">APPOINTMENT HISTORY</h4>
          <div class="history-list">
            <div class="history-item">
              <mat-icon class="history-icon">add_circle_outline</mat-icon>
              <div class="history-content">
                <span class="history-text">
                  Created by {{ appointment().isOnlineBooking ? 'Online Booking' : 'Admin' }}
                </span>
                <span class="history-meta">
                  Ref #{{ appointment().id.toUpperCase() }} • {{ formattedDate() }}
                </span>
              </div>
            </div>
            @if (appointment().checkoutStatus === 'checked_out') {
              <div class="history-item">
                <mat-icon class="history-icon checked-out">check_circle</mat-icon>
                <div class="history-content">
                  <span class="history-text">Checked out</span>
                  <span class="history-meta">Payment completed</span>
                </div>
              </div>
            }
          </div>
        </section>

        <mat-divider></mat-divider>

        <!-- Notes -->
        <section class="details-section">
          <h4 class="section-label">APPOINTMENT NOTES</h4>
          @if (appointment().notes) {
            <p class="notes-text">{{ appointment().notes }}</p>
          } @else {
            <p class="notes-placeholder">No notes added</p>
          }
        </section>
      </div>

      <!-- Bottom summary -->
      <div class="details-summary">
        <div class="summary-row">
          <span class="summary-label">Total</span>
          <div class="summary-price">
            @if (appointment().service.discount > 0) {
              <span class="original-price">{{ appointment().service.currency }} {{ (appointment().service.price * appointment().numberOfPersons).toFixed(2) }}</span>
            }
            <span class="final-price">{{ appointment().service.currency }} {{ appointment().totalPrice.toFixed(2) }}</span>
          </div>
        </div>
        <div class="summary-meta">
          {{ formattedDuration() }}, 1 service
          @if (appointment().numberOfPersons > 1) {
            , {{ appointment().numberOfPersons }} persons
          }
        </div>
      </div>

      <!-- Footer -->
      <div class="details-footer">
        <button mat-stroked-button (click)="editRequested.emit(appointment().id)" class="edit-btn">
          <mat-icon>edit</mat-icon>
          Edit Appointment
        </button>

        <div class="footer-actions">
          <button mat-stroked-button (click)="close.emit()">
            Cancel
          </button>
          <button
            mat-raised-button
            color="primary"
            (click)="startCheckout.emit(appointment().id)"
            [disabled]="appointment().checkoutStatus === 'checked_out'"
            class="checkout-btn">
            <mat-icon>point_of_sale</mat-icon>
            {{ appointment().checkoutStatus === 'checked_out' ? 'Checked Out' : 'Checkout' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .details-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
    }

    .details-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .status-select {
      width: 160px;

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      ::ng-deep .mat-mdc-text-field-wrapper {
        height: 38px;
      }
    }

    .status-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;

      &.scheduled { background-color: #3b82f6; }
      &.completed { background-color: #10b981; }
      &.no-show { background-color: #f59e0b; }
      &.cancelled { background-color: #ef4444; }
    }

    .close-btn {
      color: #6b7280;
    }

    .details-title-block {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .title-date-line,
    .title-time-line {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    .title-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #6b7280;
    }

    .title-service-line {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;

      .service-color-dot {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .service-name {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }
    }

    .title-duration-line {
      font-size: 13px;
      color: #6b7280;
      margin-left: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .persons-badge,
    .home-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      background: #f3f4f6;
      color: #374151;

      mat-icon {
        font-size: 13px;
        width: 13px;
        height: 13px;
      }
    }

    .home-badge {
      background: #fef3c7;
      color: #92400e;
    }

    .details-content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .details-section {
      padding: 16px 24px;
    }

    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0 0 10px 0;
    }

    .client-info-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .client-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .client-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .client-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .client-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .vip-badge {
      font-size: 11px;
      color: #ca8a04;
    }

    .client-phone,
    .client-email {
      font-size: 12px;
      color: #6b7280;
    }

    .client-unpaid-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 8px 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-size: 12px;
      color: #dc2626;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
    }

    .staff-info-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .staff-avatar-small {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .staff-name {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }

    .payment-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .payment-label {
      font-size: 13px;
      color: #6b7280;
    }

    .payment-value {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;

      &.paid { color: #16a34a; }
      &.remaining { color: #dc2626; }
    }

    .payment-status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;

      &.status-none {
        background: #f3f4f6;
        color: #6b7280;
      }
      &.status-deposit {
        background: #fef3c7;
        color: #92400e;
      }
      &.status-full {
        background: #dcfce7;
        color: #166534;
      }
    }

    .checkout-done-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #dcfce7;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #166534;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #16a34a;
      }
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .history-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .history-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #9ca3af;
      margin-top: 1px;
      flex-shrink: 0;

      &.checked-out {
        color: #16a34a;
      }
    }

    .history-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .history-text {
      font-size: 13px;
      color: #374151;
      font-weight: 500;
    }

    .history-meta {
      font-size: 11px;
      color: #9ca3af;
    }

    .notes-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
    }

    .notes-placeholder {
      font-size: 13px;
      color: #d1d5db;
      font-style: italic;
      margin: 0;
    }

    .details-summary {
      padding: 12px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-label {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .summary-price {
      display: flex;
      align-items: center;
      gap: 8px;

      .original-price {
        text-decoration: line-through;
        color: #9ca3af;
        font-size: 13px;
      }

      .final-price {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }
    }

    .summary-meta {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .details-footer {
      padding: 14px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
    }

    .edit-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      height: 38px;
    }

    .footer-actions {
      display: flex;
      gap: 10px;

      button {
        flex: 1;
        height: 40px;
      }

      .checkout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
    }

    .details-content::-webkit-scrollbar {
      width: 6px;
    }

    .details-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .details-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
  `]
})
export class AppointmentDetailsDrawerComponent {
  private appointmentsService = inject(AppointmentsService);

  appointment = input.required<AppointmentView>();

  close = output<void>();
  editRequested = output<string>();
  startCheckout = output<string>();

  formattedDate = computed(() => {
    const apt = this.appointment();
    return apt.date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  formattedTimeRange = computed(() => {
    const apt = this.appointment();
    return `${this.formatTime(apt.startTime)} – ${this.formatTime(apt.endTime)}`;
  });

  formattedDuration = computed(() => {
    const apt = this.appointment();
    const duration = apt.service.duration;
    if (duration < 60) return `${duration}min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
  });

  paymentStatusLabel = computed(() => {
    switch (this.appointment().paymentStatus) {
      case 'NONE': return 'Unpaid';
      case 'DEPOSIT': return 'Deposit Paid';
      case 'FULL': return 'Fully Paid';
    }
  });

  onStatusChange(status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'): void {
    this.appointmentsService.updateAppointment(this.appointment().id, { status });
  }

  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
}