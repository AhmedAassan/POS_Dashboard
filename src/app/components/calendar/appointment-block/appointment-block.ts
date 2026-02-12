// components/appointment-block/appointment-block.component.ts

import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentView } from '../../../models/calendar/models.model';

@Component({
  selector: 'app-appointment-block',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIconModule],
  template: `
    <div
      class="appointment-block"
      [class.is-hovered]="isHovered()"
      [class.is-checked-out]="appointment().checkoutStatus === 'checked_out'"
      [style.top.px]="appointment().topPosition"
      [style.height.px]="appointment().height"
      [style.left]="leftPosition()"
      [style.width]="blockWidth()"
      [style.--service-color]="appointment().service.colorHex"
      [style.--service-color-light]="serviceColorLight()"
      [style.--service-color-medium]="serviceColorMedium()"
      [style.--staff-color]="appointment().staff.color"
      [matTooltip]="tooltipContent()"
      [matTooltipClass]="'appointment-tooltip multiline-tooltip'"
      matTooltipPosition="right"
      (mouseenter)="isHovered.set(true)"
      (mouseleave)="isHovered.set(false)"
      (dblclick)="editAppointment.emit(appointment())"
      (click)="selectAppointment.emit(appointment())">

      <!-- Staff color top bar -->
      <div class="staff-bar"></div>

      <!-- Service color left bar -->
      <div class="service-bar"></div>

      <div class="block-content" [class.compact]="isCompact()">
        <!-- Client Name -->
        <div class="client-name">
          <span class="name-text">{{ appointment().client.name }}</span>
          @if (appointment().client.isVIP) {
            <span class="vip-badge">VIP</span>
          }
        </div>

        <!-- Time Range -->
        @if (!isCompact()) {
          <div class="time-range">
            {{ formatTime(appointment().startTime) }} - {{ formatTime(appointment().endTime) }}
          </div>
        }

        <!-- Service Name -->
        <div class="service-name">
          {{ appointment().service.name }}
        </div>

        <!-- Status badges row -->
        @if (!isCompact()) {
          <div class="badges-row">
            @if (appointment().isOnlineBooking) {
              <div class="online-badge">
                <mat-icon>language</mat-icon>
                <span>Online</span>
              </div>
            }
            @if (appointment().checkoutStatus === 'checked_out') {
              <div class="checkout-badge">
                <mat-icon>verified</mat-icon>
              </div>
            }
            @if (appointment().serviceType === 'HOME') {
              <div class="home-badge">
                <mat-icon>home</mat-icon>
              </div>
            }
            @if (appointment().numberOfPersons > 1) {
              <div class="persons-badge-inline">
                <mat-icon>group</mat-icon>
                <span>{{ appointment().numberOfPersons }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .appointment-block {
      position: absolute;
      border-radius: 6px;
      cursor: pointer;
      overflow: hidden;
      z-index: 1;
      box-sizing: border-box;

      background-color: var(--service-color-light);
      border: 1px solid var(--service-color);
      border-left: 4px solid var(--service-color);

      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.2s ease,
        transform 0.15s ease;

      &:hover,
      &.is-hovered {
        background-color: var(--service-color-medium);
        border-color: var(--service-color);
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.15),
          0 2px 4px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
        z-index: 10;
      }

      &.is-checked-out {
        opacity: 0.75;
      }
    }

    .staff-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background-color: var(--staff-color);
      border-radius: 6px 6px 0 0;
    }

    .service-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 4px;
      background-color: var(--service-color);
    }

    .block-content {
      position: relative;
      padding: 8px 10px 8px 12px;
      padding-top: 10px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 3px;
      overflow: hidden;
      z-index: 1;
      line-height: 1.2;

      &.compact {
        padding: 6px 8px 6px 10px;
        padding-top: 8px;
        gap: 2px;
        line-height: 1.15;
      }
    }

    .client-name {
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 5px;
      min-width: 0;

      .name-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }
    }

    .vip-badge {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      font-size: 8px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .time-range {
      font-size: 10px;
      color: #4b5563;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .service-name {
      font-size: 11px;
      color: #374151;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badges-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: auto;
      flex-wrap: wrap;
    }

    .online-badge {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      color: #2563eb;
      font-weight: 500;

      mat-icon {
        font-size: 11px;
        width: 11px;
        height: 11px;
      }
    }

    .checkout-badge {
      display: flex;
      align-items: center;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
        color: #16a34a;
      }
    }

    .home-badge {
      display: flex;
      align-items: center;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
        color: #d97706;
      }
    }

    .persons-badge-inline {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 9px;
      color: #6b7280;
      font-weight: 500;

      mat-icon {
        font-size: 11px;
        width: 11px;
        height: 11px;
      }
    }
  `]
})
export class AppointmentBlockComponent {
  appointment = input.required<AppointmentView>();

  editAppointment = output<AppointmentView>();
  selectAppointment = output<AppointmentView>();

  isHovered = signal(false);

  leftPosition = computed(() => {
    const apt = this.appointment();
    const laneWidth = 100 / apt.laneCount;
    const gapPercent = 0.5;
    return `calc(${apt.laneIndex * laneWidth}% + ${gapPercent}%)`;
  });

  blockWidth = computed(() => {
    const apt = this.appointment();
    const laneWidth = 100 / apt.laneCount;
    const gapPercent = 1;
    return `calc(${laneWidth}% - ${gapPercent}%)`;
  });

  serviceColorLight = computed(() => {
    return this.hexToRgba(this.appointment().service.colorHex, 0.12);
  });

  serviceColorMedium = computed(() => {
    return this.hexToRgba(this.appointment().service.colorHex, 0.25);
  });

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  isCompact = computed(() => {
    return this.appointment().height < 55;
  });

  /**
   * Enhanced tooltip with all Stage 5 fields:
   * payment summary, numberOfPersons, serviceType, voucher
   */
  tooltipContent = computed(() => {
    const apt = this.appointment();
    const originalPrice = apt.service.price;
    const discountedPrice = apt.discountedPrice;
    const hasDiscount = apt.service.discount > 0;

    let priceText = `${apt.service.currency} ${discountedPrice.toFixed(2)}`;
    if (hasDiscount) {
      priceText = `${apt.service.currency} ${discountedPrice.toFixed(2)} (was ${originalPrice.toFixed(2)}, ${apt.service.discount}% off)`;
    }

    const lines: string[] = [
      `👤 ${apt.client.name}${apt.client.isVIP ? ' ⭐ VIP' : ''}`,
      `📞 ${apt.client.phone}`,
      ``
    ];

    // Service info
    lines.push(`💇 ${apt.service.name}`);
    lines.push(`👩‍💼 ${apt.staff.name}`);
    lines.push(`🕐 ${this.formatTime(apt.startTime)} - ${this.formatTime(apt.endTime)}`);

    // Service type
    if (apt.serviceType === 'HOME') {
      lines.push(`🏠 Home Service`);
    } else {
      lines.push(`💈 Salon Service`);
    }

    // Number of persons
    if (apt.numberOfPersons > 1) {
      lines.push(`👥 ${apt.numberOfPersons} persons`);
    }

    lines.push(``);

    // Pricing
    lines.push(`💰 Unit: ${priceText}`);
    if (apt.numberOfPersons > 1) {
      lines.push(`💰 Total: ${apt.service.currency} ${apt.totalPrice.toFixed(2)} (×${apt.numberOfPersons})`);
    } else {
      lines.push(`💰 Total: ${apt.service.currency} ${apt.totalPrice.toFixed(2)}`);
    }

    // Payment summary
    lines.push(``);
    const paymentStatusMap: Record<string, string> = {
      'NONE': '⬜ Unpaid',
      'DEPOSIT': '🟡 Deposit Paid',
      'FULL': '🟢 Fully Paid'
    };
    lines.push(paymentStatusMap[apt.paymentStatus] || apt.paymentStatus);

    if (apt.paidAmount > 0) {
      lines.push(`✅ Paid: ${apt.service.currency} ${apt.paidAmount.toFixed(2)}`);
    }
    if (apt.remainingAmount > 0) {
      lines.push(`⏳ Remaining: ${apt.service.currency} ${apt.remainingAmount.toFixed(2)}`);
    }
    if (apt.paymentType) {
      lines.push(`💳 Method: ${apt.paymentType}`);
    }

    // Voucher
    if (apt.voucherCode) {
      lines.push(`🎟️ Voucher: ${apt.voucherCode}`);
    }

    // Checkout status
    if (apt.checkoutStatus === 'checked_out') {
      lines.push(``);
      lines.push(`✅ Checked Out`);
    }

    // Notes
    if (apt.notes) {
      lines.push(``);
      lines.push(`📝 ${apt.notes}`);
    }

    return lines.join('\n');
  });

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
}