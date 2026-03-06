// components/appointment-drawer/appointment-drawer.component.ts

import { Component, inject, input, output, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

import { ClientsService } from '../../../services/calendar/clients';
import { ServicesService } from '../../../services/calendar/services';
import { StaffService } from '../../../services/calendar/staff';
import { AppointmentsService } from '../../../services/calendar/appointments';
import { BranchesService } from '../../../services/calendar/branches';
import {
  Client,
  ServiceItem,
  Staff,
  AppointmentView,
  TimeOption,
  ServiceType
} from '../../../models/calendar/models.model';
import {
  CreateClientDialogComponent,
  CreateClientDialogData,
  CreateClientDialogResult
} from '../create-client-dialog/create-client-dialog';

@Component({
  selector: 'app-appointment-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule
  ],
  template: `
    <div class="drawer-container">
      <!-- Header -->
      <div class="drawer-header">
        <h2>{{ isEditMode() ? 'Edit Appointment' : 'Create New Appointment' }}</h2>
        <button mat-icon-button (click)="close.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="drawer-content">
        <form [formGroup]="form">

          <!-- Client Selection -->
          <section class="form-section">
            <h3 class="section-title">
              <mat-icon>person</mat-icon>
              Client
            </h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Search client by name or phone</mat-label>
              <input
                matInput
                formControlName="clientSearch"
                [matAutocomplete]="clientAuto"
                placeholder="Start typing...">
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete
                #clientAuto="matAutocomplete"
                (optionSelected)="onClientSelected($event)"
                [displayWith]="displayClientFn">
                @for (client of filteredClients(); track client.id) {
                  <mat-option [value]="client">
                    <div class="client-option" [class.has-alert]="client.hasAlert">
                      <span class="client-name">
                        @if (client.hasAlert) {
                          <mat-icon class="client-alert-icon">warning</mat-icon>
                        }
                        {{ client.name }}
                        @if (client.isVIP) {
                          <span class="vip-chip">VIP</span>
                        }
                        @if (client.isNewCustomer) {
                          <span class="new-chip">NEW</span>
                        }
                      </span>
                      <span class="client-phone">
                        {{ client.phone }}
                        @if (client.phone2) {
                          &nbsp;/&nbsp;{{ client.phone2 }}
                        }
                      </span>
                      @if (client.hasAlert && client.alertNote) {
                        <span class="client-alert-note">
                          <mat-icon>info</mat-icon>
                          {{ client.alertNote }}
                        </span>
                      }
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            <!-- Create New Client button when no results -->
            @if (showCreateClientBtn()) {
              <button
                mat-stroked-button
                color="primary"
                class="create-client-btn"
                (click)="openCreateClientDialog()">
                <mat-icon>person_add</mat-icon>
                Create New Client
                @if (clientSearchQuery()) {
                  <span class="create-hint">"{{ clientSearchQuery() }}"</span>
                }
              </button>
            }

             @if (selectedClient()) {
              <div class="client-summary"
                   [class.is-new-customer]="selectedClient()!.isNewCustomer"
                   [class.has-alert]="selectedClient()!.hasAlert">
                
                <!-- Alert banner at top of summary -->
                @if (selectedClient()!.hasAlert) {
                  <div class="client-alert-banner">
                    <mat-icon>warning</mat-icon>
                    <div class="alert-banner-content">
                      <span class="alert-banner-title">Custom Notification</span>
                      @if (selectedClient()!.alertNote) {
                        <span class="alert-banner-note">{{ selectedClient()!.alertNote }}</span>
                      }
                    </div>
                  </div>
                }

                <div class="summary-header">
                  <span class="client-name">{{ selectedClient()!.name }}</span>
                  @if (selectedClient()!.isVIP) {
                    <span class="vip-badge">⭐ VIP</span>
                  }
                  @if (selectedClient()!.isNewCustomer) {
                    <span class="new-badge">🆕 New Client</span>
                  }
                  <button mat-icon-button (click)="clearClient()" class="clear-btn">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="summary-stats">
                  <div class="stat">
                    <mat-icon>phone</mat-icon>
                    <span>{{ selectedClient()!.phone }}</span>
                  </div>
                  @if (selectedClient()!.phone2) {
                    <div class="stat">
                      <mat-icon>phone_android</mat-icon>
                      <span>{{ selectedClient()!.phone2 }}</span>
                    </div>
                  }
                  <div class="stat">
                    <mat-icon>calendar_today</mat-icon>
                    <span>{{ selectedClient()!.totalBookings }} bookings</span>
                  </div>
                  @if (selectedClient()!.unpaidAmount > 0) {
                    <div class="stat unpaid">
                      <mat-icon>warning</mat-icon>
                      <span>{{ selectedClient()!.currency }} {{ selectedClient()!.unpaidAmount }} Unpaid</span>
                    </div>
                  }
                </div>
              </div>
            }
          </section>

          <mat-divider></mat-divider>

          <!-- Service Selection -->
          <section class="form-section">
            <h3 class="section-title">
              <mat-icon>spa</mat-icon>
              Service
            </h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Search service</mat-label>
              <input
                matInput
                formControlName="serviceSearch"
                [matAutocomplete]="serviceAuto"
                placeholder="Start typing...">
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete
                #serviceAuto="matAutocomplete"
                (optionSelected)="onServiceSelected($event)"
                [displayWith]="displayServiceFn"
                class="service-autocomplete-panel">
                @for (service of filteredServices(); track service.id) {
                  <mat-option [value]="service" class="service-option-item">
                    <div class="service-option-row">
                      <div class="service-color-bar"
                           [style.background-color]="service.colorHex">
                      </div>

                      <div class="service-left">
                        <div class="service-name-line">
                          <span class="service-name">{{ service.name }}</span>
                          <span class="service-category-badge">{{ service.category }}</span>
                        </div>

                        <div class="service-meta-row">
                          <span class="service-duration">
                            <mat-icon class="meta-icon">schedule</mat-icon>
                            {{ formatDuration(service.duration) }}
                          </span>
                          @if (service.discount > 0) {
                            <span class="service-discount-tag">
                              <mat-icon class="meta-icon">local_offer</mat-icon>
                              {{ service.discount }}% off
                            </span>
                          }
                        </div>
                      </div>

                      <div class="service-pricing">
                        <span class="service-final-price"
                              [class.has-discount]="service.discount > 0">
                          {{ service.currency }} {{ getServiceDiscountedPrice(service) }}
                        </span>
                        @if (service.discount > 0) {
                          <span class="service-original-price">
                            {{ service.currency }} {{ service.price }}
                          </span>
                          <span class="service-savings">
                            Save {{ service.currency }} {{ getAmountOff(service) }}
                          </span>
                        }
                      </div>
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            @if (selectedService()) {
              <div class="service-summary" [style.border-left-color]="selectedService()!.colorHex">
                <div class="summary-row">
                  <span class="service-name">{{ selectedService()!.name }}</span>
                  <button mat-icon-button (click)="clearService()" class="clear-btn">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="service-meta">
                  <span class="duration">
                    <mat-icon>schedule</mat-icon>
                    {{ selectedService()!.duration }} minutes
                  </span>
                  <span class="price">
                    <mat-icon>payments</mat-icon>
                    @if (selectedService()!.discount > 0) {
                      <span class="original-price">{{ selectedService()!.currency }} {{ selectedService()!.price }}</span>
                      <span class="discounted-price">{{ selectedService()!.currency }} {{ unitDiscountedPrice() }}</span>
                      <span class="discount-label">{{ selectedService()!.discount }}% off</span>
                    } @else {
                      {{ selectedService()!.currency }} {{ selectedService()!.price }}
                    }
                  </span>
                </div>
              </div>
            }
          </section>

          <mat-divider></mat-divider>

          <!-- Staff Selection -->
          <section class="form-section">
            <h3 class="section-title">
              <mat-icon>person_outline</mat-icon>
              Staff
            </h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select staff member</mat-label>
              <mat-select formControlName="staff" [compareWith]="compareStaff">
                @for (staff of staffList(); track staff.id) {
                  <mat-option [value]="staff">
                    <div class="staff-option">
                      <span class="staff-avatar" [style.background-color]="staff.color">
                        {{ staff.avatar }}
                      </span>
                      <span>{{ staff.name }}</span>
                    </div>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </section>

          <mat-divider></mat-divider>

          <!-- Date & Time Selection -->
          <section class="form-section">
            <h3 class="section-title">
              <mat-icon>schedule</mat-icon>
              Date & Time
            </h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Appointment Date</mat-label>
              <input matInput [matDatepicker]="datePicker" formControlName="date">
              <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
              <mat-datepicker #datePicker></mat-datepicker>
            </mat-form-field>

            <div class="time-inputs">
              <mat-form-field appearance="outline" class="time-field">
                <mat-label>Start Time</mat-label>
                <mat-select formControlName="startTime">
                  @for (option of timeOptions(); track option.value) {
                    <mat-option [value]="option.value">
                      {{ option.label }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-icon class="time-arrow">arrow_forward</mat-icon>

              <mat-form-field appearance="outline" class="time-field">
                <mat-label>End Time</mat-label>
                <mat-select formControlName="endTime">
                  @for (option of endTimeOptions(); track option.value) {
                    <mat-option [value]="option.value" [disabled]="option.disabled">
                      {{ option.label }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            @if (timeError()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                {{ timeError() }}
              </div>
            }

            @if (conflictWarning()) {
              <div class="conflict-warning">
                <mat-icon>warning</mat-icon>
                <span>{{ conflictWarning() }}</span>
              </div>
            }
          </section>

          <mat-divider></mat-divider>

          <!-- Service Type & Number of Persons -->
          <section class="form-section">
            <h3 class="section-title">
              <mat-icon>tune</mat-icon>
              Options
            </h3>

            <div class="option-row">
              <span class="option-label">Service Type</span>
              <mat-button-toggle-group
                formControlName="serviceType"
                class="service-type-toggle"
                hideSingleSelectionIndicator>
                <mat-button-toggle value="SALON">
                  <mat-icon>store</mat-icon>
                  Salon
                </mat-button-toggle>
                <mat-button-toggle value="HOME">
                  <mat-icon>home</mat-icon>
                  Home
                </mat-button-toggle>
              </mat-button-toggle-group>
            </div>

            <div class="option-row">
              <span class="option-label">Number of Persons</span>
              <div class="persons-control">
                <button
                  mat-icon-button
                  (click)="decrementPersons()"
                  [disabled]="form.get('numberOfPersons')!.value <= 1"
                  class="persons-btn">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="persons-value">{{ form.get('numberOfPersons')!.value }}</span>
                <button
                  mat-icon-button
                  (click)="incrementPersons()"
                  class="persons-btn">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </div>
          </section>

          <mat-divider></mat-divider>

          <!-- Notes -->
          <section class="form-section">
            <h3 class="section-title">
              <mat-icon>notes</mat-icon>
              Notes
            </h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Additional notes (optional)</mat-label>
              <textarea
                matInput
                formControlName="notes"
                rows="3"
                placeholder="Any special requests or information...">
              </textarea>
            </mat-form-field>
          </section>

        </form>
      </div>

      <!-- Footer -->
      <div class="drawer-footer">
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Total</span>
            <div class="total-price">
              @if (selectedService()?.discount && selectedService()!.discount > 0) {
                <span class="original-total">
                  {{ selectedService()!.currency }}
                  {{ (selectedService()!.price * form.get('numberOfPersons')!.value).toFixed(2) }}
                </span>
              }
              <span class="final-total">
                {{ selectedService()?.currency || 'KWD' }} {{ totalPrice() }}
              </span>
            </div>
          </div>
          <div class="summary-text">
            @if (selectedService()) {
              {{ formatDuration(selectedService()!.duration) }}, 1 service
              @if (form.get('numberOfPersons')!.value > 1) {
                , {{ form.get('numberOfPersons')!.value }} persons
              }
            } @else {
              No service selected
            }
          </div>
        </div>

        <div class="action-buttons">
          @if (isEditMode()) {
            <button mat-stroked-button color="warn" (click)="onDelete()" class="delete-btn">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          }

          <button mat-stroked-button (click)="onDiscard()">
            {{ isEditMode() ? 'Cancel' : 'Discard' }}
          </button>

          <button
            mat-raised-button
            color="primary"
            (click)="onSubmit()"
            [disabled]="!isFormValid()">
            {{ isEditMode() ? 'Save Changes' : 'Create Appointment' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .service-autocomplete-panel .mat-mdc-option .mdc-list-item__primary-text,
    ::ng-deep .service-autocomplete-panel .mat-mdc-option .mat-mdc-option-text {
      width: 100% !important;
      flex: 1 1 100% !important;
    }

    ::ng-deep .service-autocomplete-panel .mat-mdc-option {
      padding: 0 !important;
      height: auto !important;
      min-height: unset;
      border-bottom: 1px solid #f1f5f9;
      transition: background-color 0.15s ease;
    }

    ::ng-deep .service-autocomplete-panel .mat-mdc-option:last-child {
      border-bottom: none;
    }

    ::ng-deep .service-autocomplete-panel .mat-mdc-option:hover,
    ::ng-deep .service-autocomplete-panel .mat-mdc-option.mat-mdc-option-active {
      background-color: #f8fafc !important;
    }

    ::ng-deep .service-autocomplete-panel.mat-mdc-autocomplete-panel {
      border-radius: 12px !important;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08),
                  0 2px 8px rgba(0, 0, 0, 0.04) !important;
      border: 1px solid #e2e8f0;
      padding: 4px 0 !important;
      max-height: 340px !important;
    }

    .drawer-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: white;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }

    .form-section {
      padding: 16px 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 12px 0;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #6b7280;
      }
    }

    .full-width {
      width: 100%;
    }

    /* ===== CLIENT OPTION STYLES ===== */
    .client-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 0;

      .client-name {
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .client-phone {
        font-size: 12px;
        color: #6b7280;
      }
    }

    .vip-chip {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .new-chip {
      background: linear-gradient(135deg, #2dd4bf, #0d9488);
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ===== CREATE CLIENT BUTTON ===== */
    .create-client-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: -8px;
      margin-bottom: 8px;
      height: 42px;
      border-style: dashed;
      border-color: #93c5fd;
      color: #2563eb;
      font-weight: 500;
      font-size: 13px;
      transition: all 0.15s ease;

      &:hover {
        background: #eff6ff;
        border-color: #3b82f6;
      }

      .create-hint {
        font-size: 11px;
        color: #6b7280;
        font-weight: 400;
        margin-left: 4px;
      }
    }

    /* ===== CLIENT SUMMARY ===== */
    .client-summary {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 12px;
      transition: all 0.2s ease;

      &.is-new-customer {
        background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
        border-color: #5eead4;
        box-shadow: 0 0 0 1px #99f6e4 inset;
      }
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 8px;

      .client-name {
        font-weight: 600;
        color: #166534;
      }

      .vip-badge {
        font-size: 12px;
        color: #ca8a04;
      }

      .new-badge {
        font-size: 11px;
        font-weight: 600;
        color: #0d9488;
        background: #ccfbf1;
        border: 1px solid #99f6e4;
        padding: 2px 8px;
        border-radius: 10px;
      }

      .clear-btn {
        margin-left: auto;
        width: 24px;
        height: 24px;
        line-height: 24px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .summary-stats {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      flex-wrap: wrap;

      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #166534;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }

        &.unpaid {
          color: #dc2626;
        }
      }
    }

    /* ===== SERVICE OPTION STYLES (unchanged) ===== */
    .service-option-row {
      display: grid;
      grid-template-columns: 4px 1fr 100px;
      grid-template-areas: "bar left price";
      width: 100%;
      min-height: 56px;
      position: relative;
      overflow: hidden;
    }

    .service-color-bar {
      grid-area: bar;
      width: 4px;
      border-radius: 0 2px 2px 0;
      align-self: stretch;
    }

    .service-left {
      grid-area: left;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      padding: 10px 12px;
      min-width: 0;
    }

    .service-name-line {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .service-name-line .service-name {
      font-size: 13.5px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1 1 auto;
      min-width: 0;
    }

    .service-category-badge {
      display: inline-flex;
      align-items: center;
      font-size: 10.5px;
      font-weight: 500;
      color: #64748b;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 1px 7px;
      border-radius: 10px;
      white-space: nowrap;
      flex-shrink: 0;
      line-height: 1.5;
      letter-spacing: 0.01em;
    }

    .service-meta-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: nowrap;
    }

    .service-duration {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11.5px;
      color: #94a3b8;
      font-weight: 400;
      line-height: 1;
    }

    .service-discount-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      font-weight: 600;
      color: #16a34a;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
      line-height: 1.4;
    }

    .meta-icon {
      font-size: 13px !important;
      width: 13px !important;
      height: 13px !important;
      line-height: 13px;
    }

    .service-pricing {
      grid-area: price;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      gap: 2px;
      padding: 10px 14px 10px 0;
      width: 100px;
      flex-shrink: 0;
      background: linear-gradient(90deg, transparent 0%, #f8fafc 40%);
      position: relative;
    }

    .service-final-price {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      white-space: nowrap;
      letter-spacing: -0.01em;
    }

    .service-final-price.has-discount {
      color: #16a34a;
    }

    .service-original-price {
      font-size: 11px;
      font-weight: 400;
      color: #cbd5e1;
      text-decoration: line-through;
      line-height: 1.3;
      white-space: nowrap;
    }

    .service-savings {
      font-size: 9.5px;
      font-weight: 600;
      color: #16a34a;
      background: #dcfce7;
      padding: 1px 5px;
      border-radius: 3px;
      white-space: nowrap;
      line-height: 1.4;
      margin-top: 1px;
    }

    .service-summary {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-left: 4px solid #7c3aed;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 12px;

      .summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .service-name {
          font-weight: 600;
          color: #7c3aed;
        }
      }

      .service-meta {
        display: flex;
        gap: 16px;
        margin-top: 8px;

        .duration, .price {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }

        .original-price {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .discounted-price {
          color: #166534;
          font-weight: 600;
        }

        .discount-label {
          background: #dcfce7;
          color: #166534;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 3px;
        }
      }
    }

    .staff-option {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .staff-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: 600;
    }

    .time-inputs {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .time-field {
      flex: 1;
    }

    .time-arrow {
      color: #9ca3af;
      flex-shrink: 0;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #dc2626;
      font-size: 12px;
      margin-top: 8px;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .conflict-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      color: #92400e;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      margin-top: 12px;

      mat-icon {
        color: #f59e0b;
        flex-shrink: 0;
      }
    }

    .option-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .option-label {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .service-type-toggle {
      ::ng-deep .mat-button-toggle-label-content {
        padding: 0 12px;
        font-size: 12px;
        font-weight: 500;
        line-height: 32px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      ::ng-deep .mat-button-toggle-checked {
        background-color: #3b82f6;
        color: white;
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .persons-control {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 2px;
    }

    .persons-btn {
      width: 32px;
      height: 32px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .persons-value {
      min-width: 32px;
      text-align: center;
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }

    .drawer-footer {
      border-top: 1px solid #e5e7eb;
      padding: 16px 24px;
      background: #f9fafb;
    }

    .total-section {
      margin-bottom: 16px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .total-label {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }

      .total-price {
        display: flex;
        align-items: center;
        gap: 8px;

        .original-total {
          text-decoration: line-through;
          color: #9ca3af;
          font-size: 13px;
        }

        .final-total {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }
      }
    }

    .summary-text {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .action-buttons {
      display: flex;
      gap: 10px;

      button {
        flex: 1;
        height: 40px;
      }

      .delete-btn {
        flex: 0 0 auto;
        padding: 0 16px;
      }
    }

    .drawer-content::-webkit-scrollbar {
      width: 6px;
    }

    .drawer-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .drawer-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
        /* ===== CLIENT ALERT STYLES ===== */
    .client-option.has-alert {
      border-left: 3px solid #f59e0b;
      padding-left: 8px;
      background: #fffbeb;
    }

    .client-alert-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      color: #f59e0b;
      vertical-align: middle;
      margin-right: 2px;
    }

    .client-alert-note {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #92400e;
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: 4px;
      margin-top: 2px;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }

    .client-summary.has-alert {
      background: #fffbeb;
      border-color: #fcd34d;
      box-shadow: 0 0 0 1px #fde68a inset;
    }

    .client-alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 1px solid #fbbf24;
      border-radius: 8px;
      margin-bottom: 12px;
      animation: alertBannerPulse 3s ease-in-out infinite;

      > mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #d97706;
        flex-shrink: 0;
        margin-top: 1px;
      }
    }

    .alert-banner-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alert-banner-title {
      font-size: 13px;
      font-weight: 700;
      color: #92400e;
    }

    .alert-banner-note {
      font-size: 12px;
      color: #78350f;
      line-height: 1.4;
    }

    @keyframes alertBannerPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
      50% { box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2); }
    }
  `]
})
export class AppointmentDrawerComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private clientsService = inject(ClientsService);
  private servicesService = inject(ServicesService);
  private staffService = inject(StaffService);
  private appointmentsService = inject(AppointmentsService);
  private branchesService = inject(BranchesService);
  private dialog = inject(MatDialog);

  appointmentToEdit = input<AppointmentView | null>(null);

  close = output<void>();
  created = output<void>();
  updated = output<void>();
  deleted = output<void>();

  form!: FormGroup;

  selectedClient = signal<Client | null>(null);
  selectedService = signal<ServiceItem | null>(null);

  filteredClients = signal<Client[]>([]);
  filteredServices = signal<ServiceItem[]>([]);

  /** The raw string the user typed in the client search field */
  clientSearchQuery = signal<string>('');

  staffList = this.staffService.staffList;
  timeOptions = signal<TimeOption[]>([]);
  endTimeOptions = signal<TimeOption[]>([]);

  timeError = signal<string>('');
  conflictWarning = signal<string>('');

  isEditMode = computed(() => this.appointmentToEdit() !== null);

  /** Show "Create New Client" button when search has text but no results */
  showCreateClientBtn = computed(() => {
    const query = this.clientSearchQuery();
    const results = this.filteredClients();
    // Show button when user typed something (at least 2 chars) and got no results
    return query.length >= 2 && results.length === 0 && !this.selectedClient();
  });

  private subscriptions: Subscription[] = [];

  /** Get the numeric branchId from the header's selected location */
  private getSelectedBranchId(): number {
    const branches = this.branchesService.branches();
    if (branches.length > 0) {
      // For now, use the first branch. In future, get from header's selectedLocationId
      return parseInt(branches[0].id.replace('loc-', ''), 10) || 1;
    }
    return 1;
  }

  constructor() {
    this.initForm();

    effect(() => {
      const apt = this.appointmentToEdit();
      if (apt) {
        this.populateFormForEdit(apt);
      } else {
        this.resetForm();
      }
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      clientSearch: ['', Validators.required],
      serviceSearch: ['', Validators.required],
      staff: [null, Validators.required],
      date: [this.appointmentsService.selectedDate(), Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['10:00', Validators.required],
      notes: [''],
      serviceType: ['SALON' as ServiceType, Validators.required],
      numberOfPersons: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.timeOptions.set(this.appointmentsService.generateTimeOptions());
    this.updateEndTimeOptions();

    // Client search
    const clientSub = this.form.get('clientSearch')!.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.clientSearchQuery.set(value);
        this.filteredClients.set(this.clientsService.searchClients(value));
      }
    });
    this.subscriptions.push(clientSub);

    // Service search
    const serviceSub = this.form.get('serviceSearch')!.valueChanges.pipe(
      startWith(''),
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.filteredServices.set(this.servicesService.searchServices(value));
      }
    });
    this.subscriptions.push(serviceSub);

    const startTimeSub = this.form.get('startTime')!.valueChanges.subscribe(() => {
      this.updateEndTimeOptions();
      this.updateEndTimeFromDuration();
      this.validateTime();
      this.checkConflict();
    });
    this.subscriptions.push(startTimeSub);

    const endTimeSub = this.form.get('endTime')!.valueChanges.subscribe(() => {
      this.validateTime();
      this.checkConflict();
    });
    this.subscriptions.push(endTimeSub);

    const staffSub = this.form.get('staff')!.valueChanges.subscribe(() => {
      this.checkConflict();
    });
    this.subscriptions.push(staffSub);

    const dateSub = this.form.get('date')!.valueChanges.subscribe(() => {
      this.checkConflict();
    });
    this.subscriptions.push(dateSub);

    this.filteredClients.set(this.clientsService.clients());
    this.filteredServices.set(this.servicesService.services());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /** Open the Create Client dialog */
  openCreateClientDialog(): void {
    const query = this.clientSearchQuery();

    // Detect if query looks like a phone number
    const isPhone = /^\d{4,}$/.test(query.replace(/\s/g, ''));

    const dialogData: CreateClientDialogData = {
      branchId: this.getSelectedBranchId(),
      prefillPhone: isPhone ? query : undefined,
      prefillName: !isPhone ? query : undefined
    };

    const dialogRef = this.dialog.open(CreateClientDialogComponent, {
      data: dialogData,
      width: '480px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'create-client-dialog-panel',
      autoFocus: true,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: CreateClientDialogResult | null) => {
      if (result?.client) {
        // Auto-select the newly created client
        this.selectedClient.set(result.client);
        this.form.get('clientSearch')!.setValue(result.client);
        this.clientSearchQuery.set('');
        this.filteredClients.set(this.clientsService.clients());
      }
    });
  }

  private populateFormForEdit(apt: AppointmentView): void {
    this.selectedClient.set(apt.client);
    this.selectedService.set(apt.service);

    this.form.patchValue({
      clientSearch: apt.client,
      serviceSearch: apt.service,
      staff: apt.staff,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      notes: apt.notes || '',
      serviceType: apt.serviceType,
      numberOfPersons: apt.numberOfPersons
    }, { emitEvent: false });

    this.updateEndTimeOptions();
    this.validateTime();
    this.checkConflict();
  }

  private updateEndTimeOptions(): void {
    const startTime = this.form.get('startTime')?.value;
    const startMinutes = this.appointmentsService.timeToMinutes(startTime || '00:00');

    const options = this.timeOptions().map(opt => ({
      ...opt,
      disabled: this.appointmentsService.timeToMinutes(opt.value) <= startMinutes
    }));

    this.endTimeOptions.set(options);
  }

  displayClientFn = (client: Client): string => {
    return client ? client.name : '';
  };

  displayServiceFn = (service: ServiceItem): string => {
    return service ? service.name : '';
  };

  compareStaff = (s1: Staff, s2: Staff): boolean => {
    return s1 && s2 ? s1.id === s2.id : s1 === s2;
  };

  onClientSelected(event: { option: { value: Client } }): void {
    const client = event.option.value;
    this.selectedClient.set(client);
    this.clientSearchQuery.set('');
  }

  onServiceSelected(event: { option: { value: ServiceItem } }): void {
    const service = event.option.value;
    this.selectedService.set(service);
    this.updateEndTimeFromDuration();
  }

  clearClient(): void {
    this.selectedClient.set(null);
    this.form.get('clientSearch')!.setValue('');
    this.clientSearchQuery.set('');
  }

  clearService(): void {
    this.selectedService.set(null);
    this.form.get('serviceSearch')!.setValue('');
  }

  unitDiscountedPrice = computed(() => {
    const service = this.selectedService();
    if (!service) return '0.00';
    return this.servicesService.calculateDiscountedPrice(service).toFixed(2);
  });

  totalPrice = computed(() => {
    const service = this.selectedService();
    if (!service) return '0.00';
    const unit = this.servicesService.calculateDiscountedPrice(service);
    const persons = this.form?.get('numberOfPersons')?.value ?? 1;
    return (unit * persons).toFixed(2);
  });

  getServiceDiscountedPrice(service: ServiceItem): string {
    if (!service.discount || service.discount <= 0) {
      return service.price.toFixed(2);
    }
    const discounted = service.price * (1 - service.discount / 100);
    return discounted.toFixed(2);
  }

  getAmountOff(service: ServiceItem): string {
    if (!service.discount || service.discount <= 0) {
      return '0.00';
    }
    const discounted = service.price * (1 - service.discount / 100);
    return (service.price - discounted).toFixed(2);
  }

  incrementPersons(): void {
    const current = this.form.get('numberOfPersons')!.value as number;
    this.form.get('numberOfPersons')!.setValue(current + 1);
  }

  decrementPersons(): void {
    const current = this.form.get('numberOfPersons')!.value as number;
    if (current > 1) {
      this.form.get('numberOfPersons')!.setValue(current - 1);
    }
  }

  private updateEndTimeFromDuration(): void {
    const service = this.selectedService();
    const startTime = this.form.get('startTime')?.value;

    if (service && startTime) {
      let endTime = this.appointmentsService.calculateEndTime(startTime, service.duration);
      endTime = this.appointmentsService.snapToIncrement(endTime);
      this.form.get('endTime')!.setValue(endTime, { emitEvent: false });
      this.updateEndTimeOptions();
      this.validateTime();
      this.checkConflict();
    }
  }

  private validateTime(): void {
    const startTime = this.form.get('startTime')?.value;
    const endTime = this.form.get('endTime')?.value;

    if (startTime && endTime) {
      const startMinutes = this.appointmentsService.timeToMinutes(startTime);
      const endMinutes = this.appointmentsService.timeToMinutes(endTime);

      if (endMinutes <= startMinutes) {
        this.timeError.set('End time must be after start time');
      } else {
        this.timeError.set('');
      }
    }
  }

  private checkConflict(): void {
    const staff = this.form.get('staff')?.value as Staff;
    const startTime = this.form.get('startTime')?.value;
    const endTime = this.form.get('endTime')?.value;
    const formDate = this.form.get('date')?.value as Date;
    const editingId = this.appointmentToEdit()?.id;

    if (staff && startTime && endTime && formDate && !this.timeError()) {
      const conflict = this.appointmentsService.checkConflict(
        staff.id, formDate, startTime, endTime, editingId
      );
      if (conflict) {
        const client = this.clientsService.getClientById(conflict.clientId);
        this.conflictWarning.set(
          `Conflicts with ${client?.name}'s appointment (${conflict.startTime} - ${conflict.endTime})`
        );
      } else {
        this.conflictWarning.set('');
      }
    } else {
      this.conflictWarning.set('');
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}min`;
  }

  isFormValid(): boolean {
    return this.form.valid &&
           this.selectedClient() !== null &&
           this.selectedService() !== null &&
           !this.timeError();
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.conflictWarning()) {
      const confirmed = window.confirm(
        'There is a scheduling conflict. Do you want to proceed anyway?'
      );
      if (!confirmed) return;
    }

    const client = this.selectedClient()!;
    const service = this.selectedService()!;
    const staff = this.form.get('staff')!.value as Staff;
    const date = this.form.get('date')!.value as Date;
    const startTime = this.form.get('startTime')!.value as string;
    const endTime = this.form.get('endTime')!.value as string;
    const notes = this.form.get('notes')!.value as string;
    const serviceType = this.form.get('serviceType')!.value as ServiceType;
    const numberOfPersons = this.form.get('numberOfPersons')!.value as number;

    if (this.isEditMode()) {
      this.appointmentsService.updateAppointment(this.appointmentToEdit()!.id, {
        clientId: client.id,
        serviceId: service.id,
        staffId: staff.id,
        unitId: service.unitId,
        date,
        startTime,
        endTime,
        notes: notes || undefined,
        serviceType,
        numberOfPersons
      });
      this.updated.emit();
    } else {
      this.appointmentsService.createAppointment({
        clientId: client.id,
        serviceId: service.id,
        staffId: staff.id,
        branchId: this.getSelectedBranchId(),
        unitId: service.unitId,
        date,
        startTime,
        endTime,
        isOnlineBooking: false,
        notes: notes || undefined,
        serviceType,
        numberOfPersons,
        paymentStatus: 'NONE',
        depositAmount: 0,
        paidAmount: 0
      });
      this.created.emit();
    }

    this.resetForm();
    this.close.emit();
  }

  onDelete(): void {
    if (!this.isEditMode()) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this appointment? This action cannot be undone.'
    );
    if (!confirmed) return;

    this.appointmentsService.deleteAppointment(this.appointmentToEdit()!.id);
    this.deleted.emit();
    this.resetForm();
    this.close.emit();
  }

  onDiscard(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.form.reset({
      clientSearch: '',
      serviceSearch: '',
      staff: null,
      date: this.appointmentsService.selectedDate(),
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
      serviceType: 'SALON',
      numberOfPersons: 1
    });
    this.selectedClient.set(null);
    this.selectedService.set(null);
    this.clientSearchQuery.set('');
    this.timeError.set('');
    this.conflictWarning.set('');
  }
}