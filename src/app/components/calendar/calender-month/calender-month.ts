// components/calendar-month/calendar-month.component.ts

import { Component, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppointmentsService } from '../../../services/calendar/appointments';
import { AppointmentView, CalendarViewMode } from '../../../models/calendar/models.model';

/** Internal: one cell in the month grid */
interface MonthDayCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointments: AppointmentView[];
}

/** Internal: a row (week) of the month grid */
interface MonthWeekRow {
  days: MonthDayCell[];
}

@Component({
  selector: 'app-calendar-month',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="month-container">
      <!-- Weekday headers -->
      <div class="month-header">
        @for (dayName of weekdayLabels; track dayName) {
          <div class="month-header-cell">{{ dayName }}</div>
        }
      </div>

      <!-- Month grid -->
      <div class="month-body">
        @for (week of monthGrid(); track $index) {
          <div class="month-row">
            @for (day of week.days; track day.date.toISOString()) {
              <div
                class="month-cell"
                [class.other-month]="!day.isCurrentMonth"
                [class.is-today]="day.isToday"
                [class.is-selected]="day.isSelected"
                (click)="onDayClick(day.date)">

                <div class="cell-header">
                  <span class="cell-day-number" [class.today-badge]="day.isToday">
                    {{ day.dayNumber }}
                  </span>
                  @if (day.appointments.length > 0 && day.isCurrentMonth) {
                    <button
                      class="cell-add-btn"
                      (click)="onCreateForDate($event, day.date)"
                      matTooltip="New appointment">
                      <mat-icon>add</mat-icon>
                    </button>
                  }
                </div>

                @if (day.isCurrentMonth) {
                  <div class="cell-appointments">
                    @for (apt of day.appointments.slice(0, maxVisibleChips); track apt.id) {
                      <div
                        class="month-chip"
                        [style.background-color]="chipBg(apt.service.colorHex)"
                        [style.border-left-color]="apt.service.colorHex"
                        [matTooltip]="chipTooltip(apt)"
                        (click)="onAppointmentClick($event, apt)">
                        <span class="month-chip-time">{{ formatTimeShort(apt.startTime) }}</span>
                        <span class="month-chip-name">{{ apt.client.name }}</span>
                      </div>
                    }
                    @if (day.appointments.length > maxVisibleChips) {
                      <div class="month-more" (click)="onDayClick(day.date)">
                        +{{ day.appointments.length - maxVisibleChips }} more
                      </div>
                    }
                  </div>

                  @if (day.appointments.length === 0) {
                    <div class="empty-cell" (click)="onCreateForDate($event, day.date)">
                      <mat-icon>add</mat-icon>
                    </div>
                  }
                }
              </div>
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

    .month-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      height: 100%;
      background: #f9fafb;
    }

    /* ===== HEADER ===== */
    .month-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background: white;
      border-bottom: 2px solid #e5e7eb;
      flex-shrink: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .month-header-cell {
      text-align: center;
      padding: 10px 8px;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-right: 1px solid #e5e7eb;

      &:last-child {
        border-right: none;
      }
    }

    /* ===== BODY ===== */
    .month-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
    }

    .month-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
      min-height: 120px;
    }

    .month-cell {
      display: flex;
      flex-direction: column;
      border-right: 1px solid #f3f4f6;
      border-bottom: 1px solid #f3f4f6;
      background: white;
      padding: 4px;
      cursor: pointer;
      position: relative;
      transition: background-color 0.15s ease;
      overflow: hidden;

      &:last-child {
        border-right: none;
      }

      &:hover {
        background: #f8fafc;
      }

      &.other-month {
        background: #f9fafb;
        opacity: 0.5;
        cursor: default;

        &:hover {
          background: #f9fafb;
        }
      }

      &.is-today {
        background: #fffbeb;

        &:hover {
          background: #fef3c7;
        }
      }

      &.is-selected {
        background: #eff6ff;

        &:hover {
          background: #dbeafe;
        }
      }
    }

    .cell-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 4px;
      flex-shrink: 0;
    }

    .cell-day-number {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;

      &.today-badge {
        background-color: #3b82f6;
        color: white;
        font-weight: 700;
      }
    }

    .cell-add-btn {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: #d1d5db;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: all 0.15s ease;
      opacity: 0;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &:hover {
        background: #3b82f6;
        color: white;
      }
    }

    .month-cell:hover .cell-add-btn {
      opacity: 1;
    }

    /* ===== APPOINTMENT CHIPS ===== */
    .cell-appointments {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      overflow: hidden;
    }

    .month-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 4px;
      border-left: 3px solid #6b7280;
      font-size: 11px;
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      transition: all 0.15s ease;

      &:hover {
        filter: brightness(0.92);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }

      .month-chip-time {
        font-weight: 600;
        color: #374151;
        flex-shrink: 0;
      }

      .month-chip-name {
        color: #6b7280;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }
    }

    .month-more {
      font-size: 11px;
      font-weight: 600;
      color: #3b82f6;
      padding: 2px 6px;
      cursor: pointer;
      border-radius: 3px;

      &:hover {
        background: #dbeafe;
      }
    }

    .empty-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #e5e7eb;
      cursor: pointer;
      transition: color 0.15s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        color: #3b82f6;
      }
    }

    /* ===== SCROLLBAR ===== */
    .month-body::-webkit-scrollbar {
      width: 8px;
    }

    .month-body::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .month-body::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;

      &:hover {
        background: #94a3b8;
      }
    }
  `]
})
export class CalendarMonthComponent {
  private appointmentsService = inject(AppointmentsService);

  readonly maxVisibleChips = 3;

  /** Weekday column labels (Mon first — ISO week) */
  readonly weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  dayClick = output<Date>();
  createForDate = output<Date>();
  editAppointment = output<AppointmentView>();

  /**
   * Build the full month grid (up to 6 rows × 7 columns).
   * Includes leading/trailing days from adjacent months so rows
   * are always complete.
   */
  monthGrid = computed((): MonthWeekRow[] => {
    const selected = this.appointmentsService.selectedDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = selected.getFullYear();
    const month = selected.getMonth();

    // First day of the month
    const firstOfMonth = new Date(year, month, 1);
    // Last day of the month
    const lastOfMonth = new Date(year, month + 1, 0);

    // Day-of-week for first day (convert Sunday=0 to Monday=0 based index)
    const firstDow = (firstOfMonth.getDay() + 6) % 7; // 0=Mon, 6=Sun

    // Start from the Monday before (or on) the 1st
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstDow);

    const rows: MonthWeekRow[] = [];
    const cursor = new Date(gridStart);

    // Generate up to 6 rows
    for (let week = 0; week < 6; week++) {
      const days: MonthDayCell[] = [];

      for (let day = 0; day < 7; day++) {
        const d = new Date(cursor);
        d.setHours(0, 0, 0, 0);

        const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;

        days.push({
          date: d,
          dayNumber: d.getDate(),
          isCurrentMonth,
          isToday: d.getTime() === today.getTime(),
          isSelected: this.isSameDay(d, selected),
          // Only fetch appointments for current-month days (perf optimisation)
          appointments: isCurrentMonth
            ? this.appointmentsService.appointmentsForDate(d)
            : []
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      rows.push({ days });

      // Stop generating rows if we've passed the last day AND
      // the next row would be entirely in the next month
      if (cursor.getMonth() !== month && cursor.getDate() > 7) {
        break;
      }
    }

    return rows;
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

  formatTimeShort(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'p' : 'a';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
  }

  chipTooltip(apt: AppointmentView): string {
    const start = this.formatTimeFull(apt.startTime);
    const end = this.formatTimeFull(apt.endTime);
    return `${apt.client.name} — ${apt.service.name}\n${start} – ${end}\nStaff: ${apt.staff.name}`;
  }

  /** Light background from service hex color (~12% opacity) */
  chipBg(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }

  private formatTimeFull(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }
}