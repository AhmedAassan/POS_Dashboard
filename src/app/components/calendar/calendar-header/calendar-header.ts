// components/calendar-header/calendar-header.component.ts
import { Component, inject, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { StaffService } from '../../../services/calendar/staff';
import { ServicesService } from '../../../services/calendar/services';
import { AppointmentsService } from '../../../services/calendar/appointments';
import { Location, CalendarViewMode } from '../../../models/calendar/models.model';
import { BranchesService } from '../../../services/calendar/branches';
import { AppointmentCategoriesService } from '../../../services/calendar/appointment-categories.service';
@Component({
  selector: 'app-calendar-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatMenuModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    MatButtonToggleModule
  ],
  template: `
    <div class="calendar-header">
      <!-- Left section: Location, Staff Filter, Service Filter, Category Filter -->
      <div class="header-left">
        <!-- Location Selector -->
        <mat-form-field appearance="outline" class="location-select">
          <mat-label>Location</mat-label>
          <mat-select [(value)]="selectedLocationId">
            @for (location of locations; track location.id) {
              <mat-option [value]="location.id">
                {{ location.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        <!-- Staff Multi-Select -->
        <div class="filter-dropdown">
          <button mat-stroked-button [matMenuTriggerFor]="staffMenu" class="filter-btn">
            <mat-icon>people</mat-icon>
            <span>Staff ({{ staffService.selectedStaffIds().size }}/{{ staffService.staffList().length }})</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
          <mat-menu #staffMenu="matMenu" class="filter-menu">
            <div class="menu-header" (click)="$event.stopPropagation()">
              <button mat-button color="primary" (click)="staffService.selectAllStaff()">
                All
              </button>
              <button mat-button (click)="staffService.clearStaffSelection()">
                None
              </button>
            </div>
            <mat-divider></mat-divider>
            @for (staff of staffService.staffList(); track staff.id) {
              <div class="filter-menu-item" (click)="$event.stopPropagation()">
                <mat-checkbox
                  [checked]="staffService.selectedStaffIds().has(staff.id)"
                  (change)="staffService.toggleStaffSelection(staff.id)">
                  <div class="staff-option">
                    <span class="color-dot" [style.background-color]="staff.color"></span>
                    <span>{{ staff.name }}</span>
                  </div>
                </mat-checkbox>
              </div>
            }
          </mat-menu>
        </div>
        <!-- Service Multi-Select Filter -->
        <div class="filter-dropdown">
          <button mat-stroked-button [matMenuTriggerFor]="serviceMenu" class="filter-btn">
            <mat-icon>spa</mat-icon>
            <span>Services ({{ servicesService.selectedServiceIds().size }}/{{ servicesService.services().length }})</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
          <mat-menu #serviceMenu="matMenu" class="filter-menu service-menu">
            <div class="menu-header" (click)="$event.stopPropagation()">
              <button mat-button color="primary" (click)="servicesService.selectAllServices()">
                All
              </button>
              <button mat-button (click)="servicesService.clearServiceSelection()">
                None
              </button>
            </div>
            <mat-divider></mat-divider>
            @for (service of servicesService.services(); track service.id) {
              <div class="filter-menu-item" (click)="$event.stopPropagation()">
                <mat-checkbox
                  [checked]="servicesService.selectedServiceIds().has(service.id)"
                  (change)="servicesService.toggleServiceSelection(service.id)">
                  <div class="service-option">
                    <span class="color-dot" [style.background-color]="service.colorHex"></span>
                    <span class="service-name">{{ service.name }}</span>
                    <span class="service-category">{{ service.category }}</span>
                  </div>
                </mat-checkbox>
              </div>
            }
          </mat-menu>
        </div>
        <!-- Category Multi-Select Filter -->
        <div class="filter-dropdown">
          <button mat-stroked-button [matMenuTriggerFor]="categoryMenu" class="filter-btn">
            <mat-icon>category</mat-icon>
            <span>Categories ({{ categoriesService.selectedCategoryIds().size }}/{{ categoriesService.categories().length }})</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
          <mat-menu #categoryMenu="matMenu" class="filter-menu">
            <div class="menu-header" (click)="$event.stopPropagation()">
              <button mat-button color="primary" (click)="categoriesService.selectAllCategories()">
                All
              </button>
              <button mat-button (click)="categoriesService.clearCategorySelection()">
                None
              </button>
            </div>
            <mat-divider></mat-divider>
            @for (cat of categoriesService.categories(); track cat.id) {
              <div class="filter-menu-item" (click)="$event.stopPropagation()">
                <mat-checkbox
                  [checked]="categoriesService.isCategorySelected(cat.id)"
                  (change)="categoriesService.toggleCategorySelection(cat.id)">
                  <div class="category-option">
                    <span>{{ cat.name }}</span>
                  </div>
                </mat-checkbox>
              </div>
            }
          </mat-menu>
        </div>
      </div>
      <!-- Center section: View Switcher + Date Navigation -->
      <div class="header-center">
        <!-- View mode toggle -->
        <mat-button-toggle-group
          [value]="appointmentsService.selectedViewMode()"
          (change)="onViewModeChange($event.value)"
          class="view-toggle"
          hideSingleSelectionIndicator>
          <mat-button-toggle [value]="ViewMode.DAY">Day</mat-button-toggle>
          <mat-button-toggle [value]="ViewMode.WEEK">Week</mat-button-toggle>
          <mat-button-toggle [value]="ViewMode.MONTH">Month</mat-button-toggle>
        </mat-button-toggle-group>
        <div class="date-nav">
          <button mat-icon-button (click)="appointmentsService.previous()" matTooltip="Previous">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <div class="date-display" (click)="picker.open()">
            <span class="date-text">{{ headerDateLabel }}</span>
            <mat-icon class="calendar-icon">calendar_today</mat-icon>
            <input
              matInput
              [matDatepicker]="picker"
              [value]="appointmentsService.selectedDate()"
              (dateChange)="onDateChange($event)"
              class="hidden-input">
            <mat-datepicker #picker></mat-datepicker>
          </div>
          <button mat-icon-button (click)="appointmentsService.next()" matTooltip="Next">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button mat-stroked-button (click)="appointmentsService.goToToday()" class="today-btn">
            Today
          </button>
        </div>
      </div>
      <!-- Right section: Actions -->
      <div class="header-right">
        <button
          mat-icon-button
          (click)="scrollToNow.emit()"
          matTooltip="Scroll to current time"
          class="scroll-now-btn">
          <mat-icon>schedule</mat-icon>
        </button>
        <button mat-raised-button color="primary" (click)="newAppointment.emit()" class="new-apt-btn">
          <mat-icon>add</mat-icon>
          New Appointment
        </button>
      </div>
    </div>
  `,
  styles: [`
    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      gap: 16px;
      flex-wrap: wrap;
      min-height: 64px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .location-select {
      width: 180px;
      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
      ::ng-deep .mat-mdc-text-field-wrapper {
        height: 40px;
      }
    }
    .filter-dropdown {
      position: relative;
    }
    .filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      height: 40px;
      font-size: 13px;
      mat-icon:first-child {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    .menu-header {
      display: flex;
      justify-content: space-between;
      padding: 4px 12px;
    }
    .filter-menu-item {
      padding: 4px 16px;
    }
    .staff-option, .service-option, .category-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .service-option {
      .service-name {
        flex: 1;
      }
      .service-category {
        font-size: 11px;
        color: #9ca3af;
        margin-left: 8px;
      }
    }
    .header-center {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .view-toggle {
      ::ng-deep .mat-button-toggle-label-content {
        padding: 0 14px;
        font-size: 13px;
        font-weight: 500;
        line-height: 34px;
      }
      ::ng-deep .mat-button-toggle {
        border-radius: 0;
      }
      ::ng-deep .mat-button-toggle-checked {
        background-color: #3b82f6;
        color: white;
      }
    }
    .date-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .date-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f3f4f6;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
      &:hover {
        background: #e5e7eb;
      }
    }
    .date-text {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      min-width: 180px;
      text-align: center;
    }
    .calendar-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #6b7280;
    }
    .hidden-input {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
    }
    .today-btn {
      margin-left: 8px;
      font-size: 13px;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .scroll-now-btn {
      color: #6b7280;
    }
    .new-apt-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }
    @media (max-width: 1024px) {
      .calendar-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      .header-left,
      .header-center,
      .header-right {
        justify-content: center;
      }
      .header-center {
        flex-wrap: wrap;
      }
    }
  `]
})
export class CalendarHeaderComponent {

  constructor() {
    effect(() => {
      const locs = this.branchesService.branches(); // ✅ اقرأ signal
      if (!locs.length) return;

      const exists = locs.some(l => l.id === this.selectedLocationId);
      if (!exists) this.selectedLocationId = locs[0].id;
    });
  }
  staffService = inject(StaffService);
  servicesService = inject(ServicesService);
  appointmentsService = inject(AppointmentsService);
  categoriesService = inject(AppointmentCategoriesService);
  branchesService = inject(BranchesService);
  get locations(): Location[] {
    return this.branchesService.branches();
  }
  /** Expose enum to template */
  readonly ViewMode = CalendarViewMode;
  newAppointment = output<void>();
  scrollToNow = output<void>();
  selectedLocationId = '';
  
  /**
   * Dynamic header label that adapts to the current view mode:
   * - DAY:   "Wed, Jan 15, 2025"
   * - WEEK:  "Mon, Jan 13 – Sun, Jan 19, 2025"
   * - MONTH: "January 2025"
   */
  get headerDateLabel(): string {
    const date = this.appointmentsService.selectedDate();
    const mode = this.appointmentsService.selectedViewMode();
    switch (mode) {
      case CalendarViewMode.DAY: {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      case CalendarViewMode.WEEK: {
        const range = this.appointmentsService.getVisibleDateRange(date, CalendarViewMode.WEEK);
        const startStr = range.start.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        const endStr = range.end.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        return `${startStr} – ${endStr}`;
      }
      case CalendarViewMode.MONTH: {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      }
    }
  }
  onViewModeChange(mode: CalendarViewMode): void {
    this.appointmentsService.setViewMode(mode);
  }
  onDateChange(event: { value: Date | null }): void {
    if (event.value) {
      this.appointmentsService.setSelectedDate(event.value);
    }
  }
  getSelectedBranchId(): number {
    const id = this.selectedLocationId;
    if (!id) return 1;
    return parseInt(id.replace('loc-', ''), 10) || 1;
  }
}

