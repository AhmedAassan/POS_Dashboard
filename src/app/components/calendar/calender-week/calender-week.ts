// components/calendar-week/calendar-week.component.ts

import { Component, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppointmentsService } from '../../../services/calendar/appointments';
import { AppointmentView, CalendarViewMode } from '../../../models/calendar/models.model';

/** Internal helper: one day cell in the week grid */
interface WeekDayCell {
  date: Date;
  dayLabel: string;       // e.g. "Mon"
  dateLabel: string;      // e.g. "15"
  fullLabel: string;      // e.g. "Mon, Jan 15"
  isToday: boolean;
  isSelected: boolean;
  appointments: AppointmentView[];
}

@Component({
  selector: 'app-calendar-week',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="week-container">
      <!-- Day headers -->
      <div class="week-header">
        @for (day of weekDays(); track day.date.toISOString()) {
          <div
            class="week-header-cell"
            [class.is-today]="day.isToday"
            [class.is-selected]="day.isSelected">
            <span class="day-name">{{ day.dayLabel }}</span>
            <span class="day-number">{{ day.dateLabel }}</span>
          </div>
        }
      </div>

      <!-- Day columns -->
      <div class="week-body">
        @for (day of weekDays(); track day.date.toISOString()) {
          <div
            class="week-day-column"
            [class.is-today]="day.isToday"
            [class.is-selected]="day.isSelected"
            (click)="onDayClick(day.date)">

            <!-- Appointment chips (show up to 3) -->
            @for (apt of day.appointments.slice(0, maxVisibleChips); track apt.id) {
              <div
                class="appointment-chip"
                [class.has-client-alert]="apt.client.hasAlert"
                [style.border-left-color]="apt.client.hasAlert ? '#f59e0b' : apt.service.colorHex"
                [matTooltip]="chipTooltip(apt)"
                (click)="onAppointmentClick($event, apt)">
                @if (apt.client.hasAlert) {
                  <mat-icon class="chip-alert-icon">warning</mat-icon>
                }
                <span class="chip-time">{{ formatTime(apt.startTime) }}</span>
                <span class="chip-client">{{ apt.client.name }}</span>
                @if (apt.client.isVIP) {
                  <span class="chip-vip">VIP</span>
                }
              </div>
            }

            <!-- "+X more" overflow indicator -->
            @if (day.appointments.length > maxVisibleChips) {
              <div class="more-indicator" (click)="onDayClick(day.date)">
                +{{ day.appointments.length - maxVisibleChips }} more
              </div>
            }

            <!-- Empty state: "+" button to create -->
            @if (day.appointments.length === 0) {
              <div class="empty-day" (click)="onCreateForDate($event, day.date)">
                <mat-icon>add</mat-icon>
              </div>
            } @else {
              <!-- Small add button in the corner for non-empty days -->
              <button
                class="add-btn"
                (click)="onCreateForDate($event, day.date)"
                matTooltip="New appointment">
                <mat-icon>add</mat-icon>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }

    .week-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      background: #f9fafb;
    }

    /* ===== HEADER ===== */
    .week-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: white;
      border-bottom: 2px solid #e5e7eb;
      flex-shrink: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .week-header-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 8px;
      border-right: 1px solid #e5e7eb;
      gap: 2px;

      &:last-child {
        border-right: none;
      }

      .day-name {
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .day-number {
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      &.is-today .day-number {
        background-color: #3b82f6;
        color: white;
      }

      &.is-selected {
        background: #eff6ff;
      }
    }

    /* ===== BODY ===== */
    .week-body {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    .week-day-column {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 6px;
      border-right: 1px solid #f3f4f6;
      background: white;
      cursor: pointer;
      position: relative;
      min-height: 200px;
      transition: background-color 0.15s ease;

      &:last-child {
        border-right: none;
      }

      &:hover {
        background: #f8fafc;
      }

      &.is-today {
        background: #fefce8;

        &:hover {
          background: #fef9c3;
        }
      }

      &.is-selected {
        background: #eff6ff;

        &:hover {
          background: #dbeafe;
        }
      }
    }

    /* ===== APPOINTMENT CHIPS ===== */
    .appointment-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #6b7280;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      overflow: hidden;

      &:hover {
        background: #e2e8f0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }

      .chip-time {
        font-weight: 600;
        color: #374151;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .chip-client {
        color: #6b7280;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }

      .chip-vip {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
        font-size: 8px;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 3px;
        flex-shrink: 0;
      }
    }

    .more-indicator {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #3b82f6;
      padding: 4px 0;
      cursor: pointer;
      border-radius: 4px;

      &:hover {
        background: #dbeafe;
      }
    }

    /* ===== EMPTY / ADD ===== */
    .empty-day {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      min-height: 80px;
      color: #d1d5db;
      cursor: pointer;
      border-radius: 8px;
      border: 2px dashed #e5e7eb;
      transition: all 0.15s ease;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      &:hover {
        color: #3b82f6;
        border-color: #93c5fd;
        background: #eff6ff;
      }
    }

    .add-btn {
      position: absolute;
      bottom: 6px;
      right: 6px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 0;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
      }
    }

    /* ===== SCROLLBAR ===== */
    .week-body::-webkit-scrollbar {
      width: 8px;
    }

    .week-body::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .week-body::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;

      &:hover {
        background: #94a3b8;
      }
    }
    .appointment-chip.has-client-alert {
      background: #fffbeb;
      border-color: #fcd34d;
    }

    .chip-alert-icon {
      font-size: 11px !important;
      width: 11px !important;
      height: 11px !important;
      color: #f59e0b;
      flex-shrink: 0;
    }
  `]
})
export class CalendarWeekComponent {
  private appointmentsService = inject(AppointmentsService);

  /** Max appointment chips shown per day before "+X more" */
  readonly maxVisibleChips = 3;

  dayClick = output<Date>();
  createForDate = output<Date>();
  editAppointment = output<AppointmentView>();

  /**
   * Build the 7-day array for the week containing the selected date.
   * Week starts on Monday (ISO convention).
   */
  weekDays = computed((): WeekDayCell[] => {
    const selected = this.appointmentsService.selectedDate();
    const range = this.appointmentsService.getVisibleDateRange(selected, CalendarViewMode.WEEK);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: WeekDayCell[] = [];
    const cursor = new Date(range.start);

    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor);
      d.setHours(0, 0, 0, 0);

      days.push({
        date: d,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateLabel: d.getDate().toString(),
        fullLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: d.getTime() === today.getTime(),
        isSelected: this.isSameDay(d, selected),
        appointments: this.appointmentsService.appointmentsForDate(d)
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  });

  onDayClick(date: Date): void {
    this.dayClick.emit(date);
  }

  onCreateForDate(event: Event, date: Date): void {
    event.stopPropagation();
    this.createForDate.emit(date);
  }

  onAppointmentClick(event: Event, apt: AppointmentView): void {
    event.stopPropagation();
    this.editAppointment.emit(apt);
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  chipTooltip(apt: AppointmentView): string {
    let tooltip = `${apt.client.name} — ${apt.service.name}\n${this.formatTime(apt.startTime)} – ${this.formatTime(apt.endTime)}\nStaff: ${apt.staff.name}`;
    if (apt.client.hasAlert) {
      tooltip += `\n⚠️ Custom Notification`;
      if (apt.client.alertNote) {
        tooltip += `\n📋 ${apt.client.alertNote}`;
      }
    }
    return tooltip;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }
}