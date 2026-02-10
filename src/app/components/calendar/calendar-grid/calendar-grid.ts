// components/calendar-grid/calendar-grid.component.ts - FIXED v2

import {
  Component,
  inject,
  computed,
  output,
  signal,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffService } from '../../../services/calendar/staff';
import { AppointmentsService } from '../../../services/calendar/appointments';
import { AppointmentBlockComponent } from '../appointment-block/appointment-block';
import { AppointmentView } from '../../../models/calendar/models.model';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [CommonModule, AppointmentBlockComponent],
  template: `
    <div class="calendar-grid-container">
      <!-- Staff Header Row (sticky) -->
      <div class="grid-header">
        <div class="time-header-cell">
          <span class="time-label">Time</span>
        </div>

        <div class="staff-headers-scroll" #staffHeadersScroll>
          <div
            class="staff-headers-track"
            [style.width.px]="totalContentWidth()"
            [style.min-width.px]="totalContentWidth()"
          >
            @for (staff of displayedStaff(); track staff.id) {
              <div
                class="staff-header-cell"
                [style.width.px]="staffColumnWidth()"
                [style.min-width.px]="staffColumnWidth()"
                [style.max-width.px]="staffColumnWidth()"
              >
                <div class="staff-avatar" [style.background-color]="staff.color">
                  {{ staff.avatar }}
                </div>
                <div class="staff-info">
                  <span class="staff-name">{{ staff.name }}</span>
                  <span class="staff-appointments">
                    {{ getAppointmentCountForStaff(staff.id) }} appointments
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Scrollable Grid Body -->
      <div class="grid-body" #gridBody (scroll)="onGridScroll()">
        <!-- Grid Content Wrapper -->
        <div
          class="grid-content"
          [style.height.px]="gridHeight()"
          [style.width.px]="totalContentWidth() + 70"
          [style.min-width.px]="totalContentWidth() + 70"
        >
          <!-- Time Column (sticky left) -->
          <div class="time-column">
            @for (slot of timeSlots(); track slot.time) {
              <div
                class="time-slot-label"
                [style.height.px]="slotHeight()"
                [class.is-hour]="slot.isHour"
              >
                @if (slot.isHour) {
                  <span>{{ slot.label }}</span>
                }
              </div>
            }
          </div>

          <!-- Staff Columns Container -->
          <div
            class="staff-columns"
            [style.width.px]="totalContentWidth()"
            [style.min-width.px]="totalContentWidth()"
          >
            @for (staff of displayedStaff(); track staff.id) {
              <div
                class="staff-column"
                [style.width.px]="staffColumnWidth()"
                [style.min-width.px]="staffColumnWidth()"
                [style.max-width.px]="staffColumnWidth()"
              >
                <!-- Time slot grid lines -->
                @for (slot of timeSlots(); track slot.time) {
                  <div
                    class="time-slot"
                    [style.height.px]="slotHeight()"
                    [class.is-hour]="slot.isHour"
                  ></div>
                }

                <!-- Appointments overlay -->
                <div class="appointments-layer">
                  @for (apt of getAppointmentsForStaff(staff.id); track apt.id) {
                    <app-appointment-block
                      [appointment]="apt"
                      (editAppointment)="onEditAppointment($event)"
                      (selectAppointment)="onSelectAppointment($event)"
                    />
                  }
                </div>
              </div>
            }
          </div>

          <!-- Current time indicator -->
          @if (showCurrentTimeIndicator()) {
            <div
              class="current-time-indicator"
              [style.top.px]="currentTimePosition()"
            >
              <div class="indicator-label">{{ currentTimeLabel() }}</div>
              <div class="indicator-dot"></div>
              <div class="indicator-line"></div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ===== HOST ===== */
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        height: 100%;
        overflow: hidden;
      }

      .calendar-grid-container {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        height: 100%;
        background: #f9fafb;
        overflow: hidden;
      }

      /* ===== HEADER ROW (sticky, no vertical scroll) ===== */
      .grid-header {
        display: flex;
        background: white;
        border-bottom: 2px solid #e5e7eb;
        flex-shrink: 0;
        z-index: 30;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .time-header-cell {
        width: 70px;
        min-width: 70px;
        max-width: 70px;
        padding: 12px 8px;
        border-right: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        flex-shrink: 0;
        box-sizing: border-box;
      }

      .time-label {
        font-size: 11px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
      }

      .staff-headers-scroll {
        flex: 1;
        overflow: hidden;
        min-width: 0;
      }

      .staff-headers-track {
        display: flex;
        box-sizing: border-box;
        /* width & min-width set via inline binding */
      }

      .staff-header-cell {
        flex: 0 0 auto;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-right: 1px solid #e5e7eb;
        background: white;
        box-sizing: border-box;
        overflow: hidden;

        &:last-child {
          border-right: none;
        }
      }

      .staff-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 13px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .staff-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
        min-width: 0;
      }

      .staff-name {
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .staff-appointments {
        font-size: 11px;
        color: #6b7280;
      }

      /* ===== GRID BODY (scrollable) ===== */
      .grid-body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        position: relative;
        background: white;
      }

      /*
       * grid-content is the "canvas" inside the scrollable body.
       * Its explicit width + min-width (set via binding) prevents
       * the browser from collapsing the last column or adding
       * phantom space.
       */
      .grid-content {
        display: flex;
        position: relative;
        box-sizing: border-box;
      }

      /* ===== TIME COLUMN (sticky left) ===== */
      .time-column {
        width: 70px;
        min-width: 70px;
        max-width: 70px;
        background: white;
        border-right: 1px solid #e5e7eb;
        position: sticky;
        left: 0;
        z-index: 20;
        flex-shrink: 0;
        box-sizing: border-box;
      }

      .time-slot-label {
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        padding-right: 8px;
        transform: translateY(-7px);
        font-size: 10px;
        color: #9ca3af;
        font-weight: 500;
        border-bottom: 1px solid transparent;
        box-sizing: border-box;

        &.is-hour {
          color: #6b7280;
          font-weight: 600;
        }
      }

      /* ===== STAFF COLUMNS CONTAINER ===== */
      .staff-columns {
        display: flex;
        flex-shrink: 0;
        box-sizing: border-box;
        /* width & min-width set via inline binding */
      }

      .staff-column {
        flex: 0 0 auto;
        position: relative;
        background: white;
        border-right: 1px solid #f3f4f6;
        box-sizing: border-box;

        &:last-child {
          border-right: none;
        }
      }

      .time-slot {
        border-bottom: 1px solid #f3f4f6;
        box-sizing: border-box;

        &.is-hour {
          border-bottom: 1px solid #e5e7eb;
        }
      }

      /* ===== APPOINTMENTS LAYER ===== */
      .appointments-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        padding: 0 2px;

        app-appointment-block {
          pointer-events: auto;
        }
      }

      /* ===== CURRENT TIME INDICATOR ===== */
      .current-time-indicator {
        position: absolute;
        left: 70px;
        right: 0;
        display: flex;
        align-items: center;
        z-index: 25;
        pointer-events: none;
      }

      .indicator-label {
        position: absolute;
        left: -60px;
        font-size: 9px;
        font-weight: 600;
        color: #ef4444;
        background: white;
        padding: 2px 4px;
        border-radius: 3px;
      }

      .indicator-dot {
        width: 10px;
        height: 10px;
        background: #ef4444;
        border-radius: 50%;
        margin-left: -5px;
        box-shadow: 0 0 0 2px white;
        flex-shrink: 0;
      }

      .indicator-line {
        flex: 1;
        height: 2px;
        background: #ef4444;
      }

      /* ===== SCROLLBAR STYLING ===== */
      .grid-body::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      .grid-body::-webkit-scrollbar-track {
        background: #f1f5f9;
      }

      .grid-body::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 5px;

        &:hover {
          background: #94a3b8;
        }
      }

      .grid-body::-webkit-scrollbar-corner {
        background: #f1f5f9;
      }
    `,
  ],
})
export class CalendarGridComponent implements AfterViewInit, OnDestroy {
  private staffService = inject(StaffService);
  private appointmentsService = inject(AppointmentsService);
  private ngZone = inject(NgZone);

  @ViewChild('gridBody', { static: false })
  gridBody!: ElementRef<HTMLDivElement>;
  @ViewChild('staffHeadersScroll', { static: false })
  staffHeadersScroll!: ElementRef<HTMLDivElement>;

  // Output events
  editAppointment = output<AppointmentView>();
  selectAppointment = output<AppointmentView>();

  // ── Column configuration (single source of truth) ──
  readonly columnMinWidth = 180;

  // ── Reactive data from services ──
  displayedStaff = this.staffService.filteredStaff;
  appointments = this.appointmentsService.appointmentsForSelectedDate;
  timeSlots = computed(() => this.appointmentsService.generateTimeSlots());
  slotHeight = computed(() => this.appointmentsService.getSlotHeight());

  // ── Layout signals ──
  /**
   * Available pixel width for staff columns = gridBody.clientWidth − 70 (time col).
   * Updated on init, resize, and staff-count change.
   */
  availableWidth = signal<number>(0);

  /**
   * Resolved column width: stretches to fill viewport when few staff,
   * but never shrinks below columnMinWidth.
   */
  staffColumnWidth = computed(() => {
    const count = this.displayedStaff().length;
    if (count === 0) return this.columnMinWidth;
    const stretched = Math.floor(this.availableWidth() / count);
    return Math.max(this.columnMinWidth, stretched);
  });

  /**
   * Total width of all staff columns combined (excluding the 70px time col).
   * Used by BOTH header track and body staff-columns container so they
   * are always identical.
   */
  totalContentWidth = computed(
    () => this.displayedStaff().length * this.staffColumnWidth()
  );

  /** Full-day grid height */
  gridHeight = computed(() => this.timeSlots().length * this.slotHeight());

  // Keep old property name so parent code that references `columnWidth` still compiles
  get columnWidth(): number {
    return this.staffColumnWidth();
  }

  // ── Resize handling ──
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Recalculate availableWidth whenever staff count changes.
   * We use an effect so it triggers reactively.
   */
  private staffCountEffect = effect(() => {
    // Read the signal so Angular tracks it
    const _count = this.displayedStaff().length;
    // Defer measurement to next frame so DOM has updated
    requestAnimationFrame(() => this.measureAvailableWidth());
  });

  // ── Lifecycle ──
  ngAfterViewInit(): void {
    this.measureAvailableWidth();

    // Use ResizeObserver for robust resize tracking (works for
    // container-query-like resizes, not just window resize)
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => this.measureAvailableWidth());
      });
      if (this.gridBody?.nativeElement) {
        this.resizeObserver.observe(this.gridBody.nativeElement);
      }
    });

    // Initial scroll to 09:00
    setTimeout(() => this.scrollToTime('09:00'), 150);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  // ── Helpers ──
  private measureAvailableWidth(): void {
    if (!this.gridBody?.nativeElement) return;
    const bodyWidth = this.gridBody.nativeElement.clientWidth;
    // Subtract time column (70px)
    const available = Math.max(0, bodyWidth - 70);
    this.availableWidth.set(available);
  }

  getAppointmentsForStaff(staffId: string): AppointmentView[] {
    return this.appointments().filter((apt) => apt.staffId === staffId);
  }

  getAppointmentCountForStaff(staffId: string): number {
    return this.getAppointmentsForStaff(staffId).length;
  }

  showCurrentTimeIndicator = computed(() => {
    const selectedDate = this.appointmentsService.selectedDate();
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  });

  currentTimePosition = computed(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return this.appointmentsService.calculateTopPosition(currentTime);
  });

  currentTimeLabel = computed(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours =
      hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  });

  /** Sync horizontal scroll between header and body */
  onGridScroll(): void {
    if (this.staffHeadersScroll?.nativeElement && this.gridBody?.nativeElement) {
      this.staffHeadersScroll.nativeElement.scrollLeft =
        this.gridBody.nativeElement.scrollLeft;
    }
  }

  /** Scroll to a specific time */
  scrollToTime(time: string): void {
    if (!this.gridBody?.nativeElement) return;
    const position =
      this.appointmentsService.getScrollPositionForTime(time);
    this.gridBody.nativeElement.scrollTo({
      top: Math.max(0, position - 60),
      behavior: 'smooth',
    });
  }

  /** Scroll to current time – PUBLIC, called from parent */
  scrollToNow(): void {
    if (!this.showCurrentTimeIndicator()) return;
    if (!this.gridBody?.nativeElement) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const position =
      this.appointmentsService.calculateTopPosition(currentTime);
    this.gridBody.nativeElement.scrollTo({
      top: Math.max(0, position - 100),
      behavior: 'smooth',
    });
  }

  onEditAppointment(apt: AppointmentView): void {
    this.editAppointment.emit(apt);
  }

  onSelectAppointment(apt: AppointmentView): void {
    this.selectAppointment.emit(apt);
  }
}