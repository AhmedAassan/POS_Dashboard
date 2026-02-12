// components/checkout-drawer/checkout-drawer.component.ts

import { Component, inject, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AppointmentView, PaymentType } from '../../../models/calendar/models.model';
import { AppointmentsService } from '../../../services/calendar/appointments';
import { ServicesService } from '../../../services/calendar/services';

/** Internal payment method option for the UI */
interface PaymentMethodOption {
  type: PaymentType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-checkout-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  template: `
    <div class="checkout-container">
      <!-- Header -->
      <div class="checkout-header">
        <div class="header-left">
          <button mat-icon-button (click)="onBack()" matTooltip="Back">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h2>{{ stepTitle() }}</h2>
        </div>
        <button mat-icon-button (click)="close.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Step indicator -->
      <div class="step-indicator">
        @for (step of steps; track step.number) {
          <div
            class="step-dot"
            [class.active]="currentStep() === step.number"
            [class.completed]="currentStep() > step.number">
            @if (currentStep() > step.number) {
              <mat-icon>check</mat-icon>
            } @else {
              {{ step.number }}
            }
          </div>
          @if (!$last) {
            <div class="step-line" [class.completed]="currentStep() > step.number"></div>
          }
        }
      </div>

      <!-- Content area -->
      <div class="checkout-content">
        @switch (currentStep()) {
          <!-- ===== STEP 1: PAYMENT ===== -->
          @case (1) {
            <!-- Customer summary -->
            <section class="section customer-section">
              <div class="customer-card">
                <div class="customer-avatar" [style.background-color]="apt().staff.color">
                  {{ apt().client.name.charAt(0) }}
                </div>
                <div class="customer-info">
                  <div class="customer-name-row">
                    <span class="customer-name">{{ apt().client.name }}</span>
                    @if (apt().client.isVIP) {
                      <span class="vip-badge">⭐ VIP</span>
                    }
                  </div>
                  <span class="customer-phone">{{ apt().client.phone }}</span>
                </div>
                @if (apt().client.unpaidAmount > 0) {
                  <div class="unpaid-chip">
                    {{ apt().client.currency }} {{ apt().client.unpaidAmount }} unpaid
                  </div>
                }
              </div>
            </section>

            <mat-divider></mat-divider>

            <!-- Amount due -->
            <section class="section">
              <div class="amount-due-row">
                <span class="amount-due-label">Amount Due</span>
                <span class="amount-due-value">
                  {{ apt().service.currency }} {{ liveRemaining().toFixed(2) }}
                </span>
              </div>
            </section>

            <mat-divider></mat-divider>

            <!-- Pay now amount -->
            <section class="section">
              <h4 class="section-label">PAY NOW</h4>
              <div class="pay-amount-control">
                <button
                  mat-icon-button
                  class="amount-btn"
                  (click)="adjustPayAmount(-1)"
                  [disabled]="payNowAmount() <= 0">
                  <mat-icon>remove</mat-icon>
                </button>

                <div class="amount-display">
                  <span class="currency">{{ apt().service.currency }}</span>
                  <input
                    type="number"
                    class="amount-input"
                    [ngModel]="payNowAmount()"
                    (ngModelChange)="onPayAmountChange($event)"
                    [min]="0"
                    [max]="liveRemaining()"
                    step="0.5">
                </div>

                <button
                  mat-icon-button
                  class="amount-btn"
                  (click)="adjustPayAmount(1)"
                  [disabled]="payNowAmount() >= liveRemaining()">
                  <mat-icon>add</mat-icon>
                </button>
              </div>

              <!-- Quick amount buttons -->
              <div class="quick-amounts">
                @for (pct of quickPercentages; track pct) {
                  <button
                    mat-stroked-button
                    class="quick-btn"
                    [class.active]="isQuickActive(pct)"
                    (click)="setPayPercentage(pct)">
                    {{ pct === 100 ? 'Full' : pct + '%' }}
                  </button>
                }
              </div>
            </section>

            <mat-divider></mat-divider>

            <!-- Payment method -->
            <section class="section">
              <h4 class="section-label">PAYMENT METHOD</h4>
              <div class="payment-methods">
                @for (method of paymentMethods; track method.type) {
                  <button
                    class="method-card"
                    [class.selected]="selectedPaymentType() === method.type"
                    (click)="selectedPaymentType.set(method.type)">
                    <mat-icon>{{ method.icon }}</mat-icon>
                    <span>{{ method.label }}</span>
                  </button>
                }
              </div>
            </section>

            <mat-divider></mat-divider>

            <!-- Voucher code -->
            <section class="section">
              <h4 class="section-label">VOUCHER CODE</h4>
              <div class="voucher-row">
                <mat-form-field appearance="outline" class="voucher-field">
                  <mat-label>Enter code</mat-label>
                  <input matInput [(ngModel)]="voucherCode" placeholder="e.g. SAVE10">
                </mat-form-field>
                <button
                  mat-stroked-button
                  class="voucher-apply-btn"
                  [disabled]="!voucherCode"
                  (click)="applyVoucher()">
                  Apply
                </button>
              </div>
              @if (voucherApplied()) {
                <div class="voucher-success">
                  <mat-icon>check_circle</mat-icon>
                  Voucher "{{ voucherCode }}" applied
                </div>
              }
            </section>

            <mat-divider></mat-divider>

            <!-- Apply payment button -->
            <section class="section">
              <button
                mat-raised-button
                color="primary"
                class="apply-btn"
                [disabled]="!canApplyPayment()"
                (click)="applyPayment()">
                <mat-icon>payments</mat-icon>
                Apply Payment — {{ apt().service.currency }} {{ payNowAmount().toFixed(2) }}
              </button>

              @if (paymentAppliedMessage()) {
                <div class="payment-applied-msg">
                  <mat-icon>check_circle</mat-icon>
                  {{ paymentAppliedMessage() }}
                </div>
              }
            </section>
          }

          <!-- ===== STEP 2: SALE SUMMARY ===== -->
          @case (2) {
            <section class="section">
              <h4 class="section-label">SERVICE</h4>
              <div class="line-item">
                <div class="line-item-left">
                  <span class="line-color-dot" [style.background-color]="apt().service.colorHex"></span>
                  <div class="line-item-info">
                    <span class="line-item-name">{{ apt().service.name }}</span>
                    <span class="line-item-staff">{{ apt().staff.name }}</span>
                    <span class="line-item-duration">{{ formatDuration(apt().service.duration) }}</span>
                  </div>
                </div>
                <div class="line-item-pricing">
                  @if (apt().service.discount > 0) {
                    <span class="line-original">{{ apt().service.currency }} {{ (apt().service.price * apt().numberOfPersons).toFixed(2) }}</span>
                  }
                  <span class="line-final">{{ apt().service.currency }} {{ apt().totalPrice.toFixed(2) }}</span>
                  @if (apt().service.discount > 0) {
                    <span class="line-discount">{{ apt().service.discount }}% off</span>
                  }
                </div>
              </div>

              @if (apt().numberOfPersons > 1) {
                <div class="persons-note">
                  <mat-icon>group</mat-icon>
                  {{ apt().numberOfPersons }} persons
                </div>
              }
            </section>

            <mat-divider></mat-divider>

            <!-- Totals -->
            <section class="section">
              <h4 class="section-label">TOTALS</h4>
              <div class="totals-grid">
                <div class="total-row">
                  <span>Total</span>
                  <span class="total-value">{{ apt().service.currency }} {{ liveTotal().toFixed(2) }}</span>
                </div>
                <div class="total-row paid">
                  <span>Paid</span>
                  <span class="total-value">{{ apt().service.currency }} {{ livePaid().toFixed(2) }}</span>
                </div>
                <mat-divider></mat-divider>
                <div class="total-row balance" [class.zero]="liveRemaining() <= 0">
                  <span>Balance</span>
                  <span class="total-value">{{ apt().service.currency }} {{ liveRemaining().toFixed(2) }}</span>
                </div>
              </div>
            </section>

            @if (liveRemaining() > 0) {
              <div class="balance-warning">
                <mat-icon>info</mat-icon>
                <span>There is an outstanding balance of {{ apt().service.currency }} {{ liveRemaining().toFixed(2) }}. You can go back to add more payment or proceed.</span>
              </div>
            }

            @if (apt().voucherCode) {
              <section class="section">
                <div class="voucher-applied-summary">
                  <mat-icon>confirmation_number</mat-icon>
                  <span>Voucher: {{ apt().voucherCode }}</span>
                </div>
              </section>
            }
          }

          <!-- ===== STEP 3: CONFIRM ===== -->
          @case (3) {
            <div class="confirm-content">
              <div class="confirm-icon-wrapper">
                <div class="confirm-icon" [class.fully-paid]="liveRemaining() <= 0">
                  @if (liveRemaining() <= 0) {
                    <mat-icon>check_circle</mat-icon>
                  } @else {
                    <mat-icon>info</mat-icon>
                  }
                </div>
              </div>

              <h3 class="confirm-title">
                @if (liveRemaining() <= 0) {
                  Full payment has been received
                } @else {
                  Partial payment applied
                }
              </h3>

              <p class="confirm-subtitle">
                @if (liveRemaining() <= 0) {
                  {{ apt().service.currency }} {{ livePaid().toFixed(2) }} has been collected for {{ apt().service.name }}
                } @else {
                  {{ apt().service.currency }} {{ livePaid().toFixed(2) }} of {{ apt().service.currency }} {{ liveTotal().toFixed(2) }} has been collected. Remaining balance: {{ apt().service.currency }} {{ liveRemaining().toFixed(2) }}
                }
              </p>

              <div class="confirm-details">
                <div class="confirm-detail-row">
                  <mat-icon>person</mat-icon>
                  <span>{{ apt().client.name }}</span>
                </div>
                <div class="confirm-detail-row">
                  <mat-icon>spa</mat-icon>
                  <span>{{ apt().service.name }}</span>
                </div>
                <div class="confirm-detail-row">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ formatTime(apt().startTime) }} – {{ formatTime(apt().endTime) }}</span>
                </div>
                @if (apt().paymentType) {
                  <div class="confirm-detail-row">
                    <mat-icon>credit_card</mat-icon>
                    <span>{{ apt().paymentType }}</span>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      <div class="checkout-footer">
        @switch (currentStep()) {
          @case (1) {
            <div class="footer-row">
              <button mat-stroked-button (click)="onBack()">
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                (click)="goToStep(2)"
                [disabled]="!canProceedToSummary()">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          }

          @case (2) {
            <div class="footer-row">
              <button mat-stroked-button (click)="goToStep(1)">
                <mat-icon>arrow_back</mat-icon>
                Back to Payment
              </button>
              <button
                mat-raised-button
                color="primary"
                (click)="goToStep(3)">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          }

          @case (3) {
            <div class="footer-col">
              <button
                mat-raised-button
                color="primary"
                class="confirm-sale-btn"
                (click)="confirmSale()">
                <mat-icon>check_circle</mat-icon>
                Confirm Sale
              </button>
              <button
                mat-button
                color="primary"
                (click)="goToStep(1)">
                Back to payments
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .checkout-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
    }

    /* ===== HEADER ===== */
    .checkout-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px 10px 8px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 4px;

      h2 {
        margin: 0;
        font-size: 17px;
        font-weight: 600;
        color: #1f2937;
      }
    }

    /* ===== STEP INDICATOR ===== */
    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 24px;
      gap: 0;
      flex-shrink: 0;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .step-dot {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      background: #e5e7eb;
      color: #6b7280;
      flex-shrink: 0;
      transition: all 0.2s ease;

      &.active {
        background: #3b82f6;
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }

      &.completed {
        background: #10b981;
        color: white;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .step-line {
      width: 60px;
      height: 3px;
      background: #e5e7eb;
      border-radius: 2px;
      transition: background-color 0.2s ease;

      &.completed {
        background: #10b981;
      }
    }

    /* ===== CONTENT ===== */
    .checkout-content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .section {
      padding: 16px 24px;
    }

    .section-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin: 0 0 12px 0;
    }

    /* ===== CUSTOMER CARD ===== */
    .customer-card {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .customer-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 17px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .customer-info {
      flex: 1;
      min-width: 0;
    }

    .customer-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .customer-name {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }

    .vip-badge {
      font-size: 11px;
      color: #ca8a04;
    }

    .customer-phone {
      font-size: 12px;
      color: #6b7280;
    }

    .unpaid-chip {
      font-size: 11px;
      font-weight: 600;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 4px 10px;
      border-radius: 12px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ===== AMOUNT DUE ===== */
    .amount-due-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .amount-due-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .amount-due-value {
      font-size: 22px;
      font-weight: 700;
      color: #1f2937;
    }

    /* ===== PAY AMOUNT CONTROL ===== */
    .pay-amount-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    .amount-btn {
      width: 40px;
      height: 40px;
      background: #f3f4f6;
      border-radius: 50%;

      &:not([disabled]):hover {
        background: #e5e7eb;
      }
    }

    .amount-display {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 8px 16px;
      min-width: 140px;
      justify-content: center;

      .currency {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .amount-input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 22px;
        font-weight: 700;
        color: #1f2937;
        width: 90px;
        text-align: center;
        -moz-appearance: textfield;

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }
    }

    .quick-amounts {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .quick-btn {
      font-size: 12px;
      font-weight: 600;
      min-width: 60px;
      height: 32px;
      border-radius: 8px;

      &.active {
        background: #dbeafe;
        border-color: #3b82f6;
        color: #1d4ed8;
      }
    }

    /* ===== PAYMENT METHODS ===== */
    .payment-methods {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .method-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 13px;
      font-weight: 500;
      color: #374151;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #6b7280;
      }

      &:hover {
        border-color: #93c5fd;
        background: #f0f9ff;
      }

      &.selected {
        border-color: #3b82f6;
        background: #eff6ff;
        color: #1d4ed8;

        mat-icon {
          color: #3b82f6;
        }
      }
    }

    /* ===== VOUCHER ===== */
    .voucher-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .voucher-field {
      flex: 1;

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }

    .voucher-apply-btn {
      height: 56px;
      margin-top: 0;
    }

    .voucher-success {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #16a34a;
      font-weight: 500;
      margin-top: 6px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    /* ===== APPLY BUTTON ===== */
    .apply-btn {
      width: 100%;
      height: 44px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .payment-applied-msg {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      padding: 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #16a34a;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* ===== SALE SUMMARY (STEP 2) ===== */
    .line-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .line-item-left {
      display: flex;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .line-color-dot {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 3px;
    }

    .line-item-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .line-item-name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .line-item-staff {
      font-size: 12px;
      color: #6b7280;
    }

    .line-item-duration {
      font-size: 11px;
      color: #9ca3af;
    }

    .line-item-pricing {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      flex-shrink: 0;
    }

    .line-original {
      font-size: 12px;
      color: #9ca3af;
      text-decoration: line-through;
    }

    .line-final {
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
    }

    .line-discount {
      font-size: 10px;
      font-weight: 600;
      color: #16a34a;
      background: #dcfce7;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .persons-note {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      font-size: 12px;
      color: #6b7280;
      padding: 6px 10px;
      background: #f3f4f6;
      border-radius: 6px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    /* Totals */
    .totals-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #374151;

      .total-value {
        font-weight: 600;
      }

      &.paid .total-value {
        color: #16a34a;
      }

      &.balance {
        font-size: 16px;
        font-weight: 600;

        .total-value {
          color: #dc2626;
          font-size: 18px;
        }

        &.zero .total-value {
          color: #16a34a;
        }
      }
    }

    .balance-warning {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 0 24px 16px;
      padding: 10px 14px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #f59e0b;
        flex-shrink: 0;
        margin-top: 1px;
      }
    }

    .voucher-applied-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #6b7280;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #9ca3af;
      }
    }

    /* ===== CONFIRM (STEP 3) ===== */
    .confirm-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 24px 24px;
      text-align: center;
    }

    .confirm-icon-wrapper {
      margin-bottom: 20px;
    }

    .confirm-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef3c7;
      color: #f59e0b;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }

      &.fully-paid {
        background: #dcfce7;
        color: #16a34a;
      }
    }

    .confirm-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
    }

    .confirm-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .confirm-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      max-width: 280px;
      text-align: left;
    }

    .confirm-detail-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #374151;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #9ca3af;
      }
    }

    /* ===== FOOTER ===== */
    .checkout-footer {
      padding: 14px 24px;
      border-top: 1px solid #e5e7eb;
      flex-shrink: 0;
      background: #f9fafb;
    }

    .footer-row {
      display: flex;
      gap: 10px;

      button {
        flex: 1;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .confirm-sale-btn {
        width: 100%;
        height: 46px;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
    }

    /* ===== SCROLLBAR ===== */
    .checkout-content::-webkit-scrollbar {
      width: 6px;
    }

    .checkout-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .checkout-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
  `]
})
export class CheckoutDrawerComponent {
  private appointmentsService = inject(AppointmentsService);
  private servicesService = inject(ServicesService);

  /** The appointment being checked out — must be a live-refreshable input */
  appointment = input.required<AppointmentView>();

  close = output<void>();
  backToDetails = output<void>();
  checkoutConfirmed = output<string>();

  currentStep = signal<number>(1);

  selectedPaymentType = signal<PaymentType | null>(null);
  payNowAmount = signal<number>(0);
  voucherCode = '';
  voucherApplied = signal(false);
  paymentAppliedMessage = signal('');

  readonly quickPercentages = [25, 50, 75, 100];

  readonly paymentMethods: PaymentMethodOption[] = [
    { type: 'CASH', label: 'Cash', icon: 'payments' },
    { type: 'LINK', label: 'Link', icon: 'link' },
    { type: 'KNET', label: 'K-Net', icon: 'account_balance' },
    { type: 'CARD', label: 'Card', icon: 'credit_card' }
  ];

  readonly steps = [
    { number: 1, label: 'Payment' },
    { number: 2, label: 'Summary' },
    { number: 3, label: 'Confirm' }
  ];

  /**
   * Resolve the live appointment from the service so we always
   * get up-to-date paidAmount / remaining after applyPayment().
   */
  apt = computed((): AppointmentView => {
    const inputApt = this.appointment();
    // Re-read from service for fresh data
    const freshRaw = this.appointmentsService.getAppointmentById(inputApt.id);
    if (!freshRaw) return inputApt;

    const service = this.servicesService.getServiceById(freshRaw.serviceId);
    if (!service) return inputApt;

    const discountedPrice = this.servicesService.calculateDiscountedPrice(service);
    const totalPrice = discountedPrice * freshRaw.numberOfPersons;
    const remainingAmount = Math.max(0, totalPrice - freshRaw.paidAmount);

    return {
      ...inputApt,
      ...freshRaw,
      totalPrice,
      remainingAmount,
      discountedPrice
    };
  });

  liveTotal = computed(() => this.apt().totalPrice);
  livePaid = computed(() => this.apt().paidAmount);
  liveRemaining = computed(() => this.apt().remainingAmount);

  constructor() {
    // Initialise payNowAmount to remaining when appointment changes
    effect(() => {
      const remaining = this.liveRemaining();
      // Only auto-set if the user hasn't started paying yet
      if (this.payNowAmount() === 0 || this.payNowAmount() > remaining) {
        this.payNowAmount.set(remaining);
      }
    });
  }

  stepTitle = computed(() => {
    switch (this.currentStep()) {
      case 1: return 'Payment';
      case 2: return 'Sale Summary';
      case 3: return 'Confirm Sale';
      default: return 'Checkout';
    }
  });

  onBack(): void {
    if (this.currentStep() > 1) {
      this.goToStep(this.currentStep() - 1);
    } else {
      this.backToDetails.emit();
    }
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
    this.paymentAppliedMessage.set('');
  }

  onPayAmountChange(value: number): void {
    const remaining = this.liveRemaining();
    const clamped = Math.max(0, Math.min(value, remaining));
    this.payNowAmount.set(Math.round(clamped * 100) / 100);
  }

  adjustPayAmount(delta: number): void {
    this.onPayAmountChange(this.payNowAmount() + delta);
  }

  setPayPercentage(pct: number): void {
    const remaining = this.liveRemaining();
    this.payNowAmount.set(Math.round(remaining * pct) / 100);
  }

  isQuickActive(pct: number): boolean {
    const remaining = this.liveRemaining();
    if (remaining <= 0) return false;
    const target = Math.round(remaining * pct) / 100;
    return Math.abs(this.payNowAmount() - target) < 0.01;
  }

  canApplyPayment = computed(() => {
    return this.payNowAmount() > 0 &&
           this.selectedPaymentType() !== null &&
           this.liveRemaining() > 0;
  });

  applyPayment(): void {
    if (!this.canApplyPayment()) return;

    const amount = this.payNowAmount();
    const paymentType = this.selectedPaymentType()!;
    const remaining = this.liveRemaining();
    const isFullPayment = amount >= remaining;

    this.appointmentsService.applyPayment(this.apt().id, {
      amount,
      paymentType,
      as: isFullPayment ? 'FULL' : 'DEPOSIT',
      voucherCode: this.voucherApplied() ? this.voucherCode : undefined
    });

    this.paymentAppliedMessage.set(
      `${this.apt().service.currency} ${amount.toFixed(2)} payment applied via ${paymentType}`
    );

    // Reset pay amount to new remaining (will be 0 if fully paid)
    const newRemaining = this.liveRemaining();
    this.payNowAmount.set(newRemaining);
  }

  applyVoucher(): void {
    if (!this.voucherCode) return;
    this.voucherApplied.set(true);
    // Store voucher code on the appointment
    this.appointmentsService.updateAppointment(this.apt().id, {
      voucherCode: this.voucherCode
    });
  }

  /** Can proceed from step 1 to step 2 */
  canProceedToSummary = computed(() => {
    const apt = this.apt();
    // Must have either: some payment made and method chosen, OR fully paid
    return (apt.paidAmount > 0 && apt.paymentType != null) || apt.remainingAmount <= 0;
  });

  confirmSale(): void {
    const aptId = this.apt().id;

    this.appointmentsService.updateAppointment(aptId, {
      checkoutStatus: 'checked_out',
      status: 'completed'
    });

    this.checkoutConfirmed.emit(aptId);
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
}