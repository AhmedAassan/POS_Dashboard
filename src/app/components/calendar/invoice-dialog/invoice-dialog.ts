// components/invoice-dialog/invoice-dialog.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

import { AppointmentView, PaymentType } from '../../../models/calendar/models.model';

/** Data passed into the invoice dialog via MAT_DIALOG_DATA */
export interface InvoiceDialogData {
  appointment: AppointmentView;
  invoiceNumber: string;
  invoiceDate: Date;
  total: number;
  paid: number;
  remaining: number;
  currency: string;
  paymentType: PaymentType | undefined;
  paymentStatus: string;
  locationName: string;
}

@Component({
  selector: 'app-invoice-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule
  ],
  template: `
    <div class="invoice-dialog-container">
      <!-- Header bar -->
      <div class="dialog-header">
        <button mat-icon-button (click)="onClose()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="dialog-title">View Invoice</h2>
        <div class="header-spacer"></div>
      </div>

      <!-- Body: two columns -->
      <div class="dialog-body">
        <!-- LEFT: Invoice card -->
        <div class="invoice-card-wrapper">
          <div class="invoice-card">
            <!-- Salon header -->
            <div class="invoice-salon-header">
              <div class="salon-logo">
                <mat-icon>spa</mat-icon>
              </div>
              <div class="salon-info">
                <h3 class="salon-name">Glamour Beauty Salon</h3>
                <p class="salon-address">Block 5, Street 12, Kuwait City</p>
                <p class="salon-address">Tel: +965 2222 3333</p>
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Invoice meta -->
            <div class="invoice-meta">
              <div class="meta-row">
                <div class="meta-label">
                  <span class="label-en">Invoice</span>
                  <span class="label-ar">فاتورة</span>
                </div>
                <span class="meta-value">#{{ data.invoiceNumber }}</span>
              </div>
              <div class="meta-row">
                <div class="meta-label">
                  <span class="label-en">Date</span>
                  <span class="label-ar">تاريخ</span>
                </div>
                <span class="meta-value">{{ formattedInvoiceDate }}</span>
              </div>
              <div class="meta-row">
                <div class="meta-label">
                  <span class="label-en">Customer</span>
                  <span class="label-ar">عميل</span>
                </div>
                <span class="meta-value">{{ data.appointment.client.name }}</span>
              </div>
              <div class="meta-row">
                <div class="meta-label">
                  <span class="label-en">Tel No.</span>
                  <span class="label-ar">هاتف</span>
                </div>
                <span class="meta-value">{{ data.appointment.client.phone }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Line items table -->
            <div class="invoice-table">
              <div class="table-header">
                <div class="col-qty">
                  <span class="label-en">Qnt</span>
                  <span class="label-ar">كمية</span>
                </div>
                <div class="col-item">
                  <span class="label-en">Item name</span>
                  <span class="label-ar">اسم الصنف</span>
                </div>
                <div class="col-price">
                  <span class="label-en">Price</span>
                  <span class="label-ar">سعر</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="table-row">
                <div class="col-qty">{{ data.appointment.numberOfPersons }}</div>
                <div class="col-item">
                  <span class="item-name">{{ data.appointment.service.name }}</span>
                  <span class="item-subtitle">{{ formatDuration(data.appointment.service.duration) }} — {{ data.appointment.staff.name }}</span>
                </div>
                <div class="col-price">{{ data.currency }} {{ data.total.toFixed(2) }}</div>
              </div>

              @if (data.appointment.service.discount > 0) {
                <div class="table-row discount-row">
                  <div class="col-qty"></div>
                  <div class="col-item">
                    <span class="discount-label">Discount ({{ data.appointment.service.discount }}%)</span>
                  </div>
                  <div class="col-price discount-value">
                    -{{ data.currency }} {{ discountAmount.toFixed(2) }}
                  </div>
                </div>
              }
            </div>

            <mat-divider></mat-divider>

            <!-- Totals -->
            <div class="invoice-totals">
              <div class="totals-row">
                <span class="totals-label">Subtotal</span>
                <span class="totals-value">{{ data.currency }} {{ data.total.toFixed(2) }}</span>
              </div>

              @if (data.paid > 0) {
                <div class="totals-row payment-row">
                  <span class="totals-label">
                    Payment
                    @if (data.paymentType) {
                      ({{ data.paymentType }})
                    }
                  </span>
                  <span class="totals-value payment-value">- {{ data.currency }} {{ data.paid.toFixed(2) }}</span>
                </div>
              }

              <mat-divider></mat-divider>

              <div class="totals-row balance-row" [class.zero]="data.remaining <= 0">
                <span class="totals-label balance-label">Balance</span>
                <span class="totals-value balance-value">{{ data.currency }} {{ data.remaining.toFixed(2) }}</span>
              </div>
            </div>

            @if (data.appointment.voucherCode) {
              <div class="invoice-voucher">
                <mat-icon>confirmation_number</mat-icon>
                <span>Voucher: {{ data.appointment.voucherCode }}</span>
              </div>
            }

            <!-- Notes -->
            @if (data.appointment.notes) {
              <mat-divider></mat-divider>
              <div class="invoice-notes">
                <span class="notes-label">Notes</span>
                <p class="notes-text">{{ data.appointment.notes }}</p>
              </div>
            }

            <!-- Footer -->
            <div class="invoice-footer">
              <p>Thank you for your visit!</p>
              <p class="footer-ar">شكراً لزيارتكم</p>
            </div>
          </div>
        </div>

        <!-- RIGHT: Completion panel -->
        <div class="completion-panel">
          <div class="completion-content">
            <div class="completion-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h3 class="completion-title">Appointment is completed</h3>
            <p class="completion-subtitle">
              {{ completionMessage }}
            </p>

            <div class="completion-details">
              <div class="detail-chip">
                <mat-icon>person</mat-icon>
                {{ data.appointment.client.name }}
              </div>
              <div class="detail-chip">
                <mat-icon>spa</mat-icon>
                {{ data.appointment.service.name }}
              </div>
              <div class="detail-chip">
                <mat-icon>schedule</mat-icon>
                {{ formatTime(data.appointment.startTime) }} – {{ formatTime(data.appointment.endTime) }}
              </div>
              @if (data.appointment.serviceType === 'HOME') {
                <div class="detail-chip home">
                  <mat-icon>home</mat-icon>
                  Home Service
                </div>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="completion-actions">
            <button mat-stroked-button [matMenuTriggerFor]="moreMenu" class="more-btn">
              <mat-icon>more_horiz</mat-icon>
              More options
            </button>
            <mat-menu #moreMenu="matMenu">
              <button mat-menu-item>
                <mat-icon>print</mat-icon>
                <span>Print Invoice</span>
              </button>
              <button mat-menu-item>
                <mat-icon>email</mat-icon>
                <span>Email Invoice</span>
              </button>
              <button mat-menu-item>
                <mat-icon>share</mat-icon>
                <span>Share</span>
              </button>
            </mat-menu>

            <button mat-raised-button color="primary" (click)="onClose()" class="done-btn">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoice-dialog-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 90vh;
      background: #f1f5f9;
    }

    /* ===== HEADER ===== */
    .dialog-header {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .back-btn {
      color: #374151;
    }

    .dialog-title {
      flex: 1;
      text-align: center;
      margin: 0;
      font-size: 17px;
      font-weight: 600;
      color: #1f2937;
    }

    .header-spacer {
      width: 40px;
    }

    /* ===== BODY ===== */
    .dialog-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      gap: 0;
    }

    /* ===== LEFT: INVOICE CARD ===== */
    .invoice-card-wrapper {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      background: #f1f5f9;
    }

    .invoice-card {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 12px;
      box-shadow:
        0 4px 24px rgba(0, 0, 0, 0.08),
        0 1px 4px rgba(0, 0, 0, 0.04);
      padding: 28px;
    }

    .invoice-salon-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }

    .salon-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .salon-name {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }

    .salon-address {
      font-size: 12px;
      color: #6b7280;
      margin: 2px 0 0 0;
    }

    /* Meta rows */
    .invoice-meta {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meta-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .label-en {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .label-ar {
      font-size: 12px;
      color: #9ca3af;
      font-weight: 400;
    }

    .meta-value {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
    }

    /* Table */
    .invoice-table {
      padding: 12px 0;
    }

    .table-header {
      display: grid;
      grid-template-columns: 50px 1fr 100px;
      padding: 8px 0;
      gap: 8px;
    }

    .table-header > div {
      display: flex;
      flex-direction: column;
    }

    .col-qty {
      text-align: center;
    }

    .col-price {
      text-align: right;
    }

    .table-row {
      display: grid;
      grid-template-columns: 50px 1fr 100px;
      padding: 10px 0;
      gap: 8px;
      align-items: flex-start;

      .col-qty {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        padding-top: 2px;
      }

      .col-price {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        padding-top: 2px;
      }
    }

    .item-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      display: block;
    }

    .item-subtitle {
      font-size: 11px;
      color: #9ca3af;
      display: block;
      margin-top: 2px;
    }

    .discount-row {
      .discount-label {
        font-size: 12px;
        color: #16a34a;
        font-weight: 500;
      }

      .discount-value {
        color: #16a34a;
        font-weight: 600;
      }
    }

    /* Totals */
    .invoice-totals {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .totals-label {
      font-size: 13px;
      color: #6b7280;
    }

    .totals-value {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .payment-value {
      color: #16a34a;
    }

    .balance-row {
      margin-top: 4px;

      .balance-label {
        font-size: 15px;
        font-weight: 700;
        color: #1f2937;
      }

      .balance-value {
        font-size: 18px;
        font-weight: 700;
        color: #dc2626;
      }

      &.zero .balance-value {
        color: #16a34a;
      }
    }

    .invoice-voucher {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      font-size: 12px;
      color: #166534;
      font-weight: 500;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #16a34a;
      }
    }

    .invoice-notes {
      padding: 14px 0;

      .notes-label {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .notes-text {
        font-size: 12px;
        color: #374151;
        margin: 6px 0 0 0;
        line-height: 1.5;
      }
    }

    .invoice-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px dashed #e5e7eb;
      margin-top: 12px;

      p {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }

      .footer-ar {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 4px;
      }
    }

    /* ===== RIGHT: COMPLETION PANEL ===== */
    .completion-panel {
      width: 340px;
      flex-shrink: 0;
      background: white;
      border-left: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 0;
    }

    .completion-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 28px 28px;
      flex: 1;
    }

    .completion-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #dcfce7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;

      mat-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
        color: #16a34a;
      }
    }

    .completion-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 10px 0;
    }

    .completion-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 28px 0;
      line-height: 1.6;
    }

    .completion-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .detail-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      font-size: 13px;
      color: #374151;
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #9ca3af;
      }

      &.home {
        background: #fef3c7;
        border-color: #fde68a;
        color: #92400e;

        mat-icon { color: #d97706; }
      }
    }

    .completion-actions {
      display: flex;
      gap: 10px;
      padding: 20px 28px;
      border-top: 1px solid #e5e7eb;

      .more-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }

      .done-btn {
        flex: 1;
        height: 42px;
        font-size: 14px;
        font-weight: 600;
      }
    }

    /* ===== SCROLLBAR ===== */
    .invoice-card-wrapper::-webkit-scrollbar {
      width: 6px;
    }

    .invoice-card-wrapper::-webkit-scrollbar-track {
      background: transparent;
    }

    .invoice-card-wrapper::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .dialog-body {
        flex-direction: column;
      }

      .completion-panel {
        width: 100%;
        border-left: none;
        border-top: 1px solid #e5e7eb;
      }

      .invoice-card-wrapper {
        padding: 16px;
      }

      .completion-content {
        padding: 28px 20px 20px;
      }
    }
  `]
})
export class InvoiceDialogComponent {
  readonly dialogRef = inject(MatDialogRef<InvoiceDialogComponent>);
  readonly data: InvoiceDialogData = inject(MAT_DIALOG_DATA);

  get formattedInvoiceDate(): string {
    return this.data.invoiceDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /** Amount saved by discount (on original price × persons) */
  get discountAmount(): number {
    const svc = this.data.appointment.service;
    if (svc.discount <= 0) return 0;
    return (svc.price * svc.discount / 100) * this.data.appointment.numberOfPersons;
  }

  get completionMessage(): string {
    const apt = this.data.appointment;
    const dateStr = apt.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `Full payment received on ${dateStr} at ${this.data.locationName} by ${apt.staff.name}`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}