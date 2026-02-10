// components/appointment-block/appointment-block.component.ts - PATCHED (hover styling)

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

        <!-- Online Booking Badge -->
        @if (appointment().isOnlineBooking && !isCompact()) {
          <div class="online-badge">
            <mat-icon>language</mat-icon>
            <span>Online</span>
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
      
      /* Default state: light service color fill */
      background-color: var(--service-color-light);
      border: 1px solid var(--service-color);
      border-left: 4px solid var(--service-color);
      
      /* Smooth transitions */
      transition: 
        background-color 0.15s ease,
        border-color 0.15s ease,
        box-shadow 0.2s ease,
        transform 0.15s ease;

      /* Hover state */
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
    }
    
    /* Staff color indicator bar at top */
    .staff-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background-color: var(--staff-color);
      border-radius: 6px 6px 0 0;
    }

    /* Service color indicator bar on left (behind content) */
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

    .online-badge {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      color: #2563eb;
      font-weight: 500;
      margin-top: auto;

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

  // Track hover state for explicit styling
  isHovered = signal(false);

  /**
   * Calculate left position based on lane index
   */
  leftPosition = computed(() => {
    const apt = this.appointment();
    const laneWidth = 100 / apt.laneCount;
    const gapPercent = 0.5;
    return `calc(${apt.laneIndex * laneWidth}% + ${gapPercent}%)`;
  });

  /**
   * Calculate width based on lane count
   */
  blockWidth = computed(() => {
    const apt = this.appointment();
    const laneWidth = 100 / apt.laneCount;
    const gapPercent = 1;
    return `calc(${laneWidth}% - ${gapPercent}%)`;
  });

  /**
   * Light version of service color for default background (~15% opacity)
   */
  serviceColorLight = computed(() => {
    return this.hexToRgba(this.appointment().service.colorHex, 0.12);
  });

  /**
   * Medium version of service color for hover state (~30% opacity)
   */
  serviceColorMedium = computed(() => {
    return this.hexToRgba(this.appointment().service.colorHex, 0.25);
  });

  /**
   * Convert hex color to rgba
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Determine if block should use compact layout
   */
  isCompact = computed(() => {
    return this.appointment().height < 55;
  });

  /**
   * Generate tooltip content
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

    const lines = [
      `👤 ${apt.client.name}${apt.client.isVIP ? ' ⭐ VIP' : ''}`,
      `📞 ${apt.client.phone}`,
      ``,
      `💇 ${apt.service.name}`,
      `👩‍💼 ${apt.staff.name}`,
      `🕐 ${this.formatTime(apt.startTime)} - ${this.formatTime(apt.endTime)}`,
      ``,
      `💰 ${priceText}`
    ];

    if (apt.notes) {
      lines.push(``, `📝 ${apt.notes}`);
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