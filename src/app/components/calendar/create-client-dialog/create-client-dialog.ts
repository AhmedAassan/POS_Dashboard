// components/calendar/create-client-dialog/create-client-dialog.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { ClientsService } from '../../../services/calendar/clients';
import { Client } from '../../../models/calendar/models.model';

export interface CreateClientDialogData {
  branchId: number;
  prefillPhone?: string;   // pre-fill from what the user typed in search
  prefillName?: string;
}

export interface CreateClientDialogResult {
  client: Client;
}

@Component({
  selector: 'app-create-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="create-client-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>person_add</mat-icon>
        </div>
        <div class="header-text">
          <h2>Create New Client</h2>
          <p>Add a new client to the system</p>
        </div>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="dialog-content">
        <!-- Name -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Client Name *</mat-label>
          <input matInput formControlName="customerName" placeholder="Enter full name">
          <mat-icon matPrefix>person</mat-icon>
          @if (form.get('customerName')?.hasError('required') && form.get('customerName')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <!-- Phone 1 -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone Number *</mat-label>
          <input matInput formControlName="customerPhone1" placeholder="e.g. 96512345678">
          <mat-icon matPrefix>phone</mat-icon>
          @if (form.get('customerPhone1')?.hasError('required') && form.get('customerPhone1')?.touched) {
            <mat-error>Phone number is required</mat-error>
          }
        </mat-form-field>

        <!-- Phone 2 (optional) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Secondary Phone (optional)</mat-label>
          <input matInput formControlName="customerPhone2" placeholder="e.g. 96587654321">
          <mat-icon matPrefix>phone_android</mat-icon>
        </mat-form-field>

        <!-- Birth Date -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Birth Date (optional)</mat-label>
          <input matInput [matDatepicker]="birthPicker" formControlName="birthDate">
          <mat-datepicker-toggle matIconSuffix [for]="birthPicker"></mat-datepicker-toggle>
          <mat-datepicker #birthPicker></mat-datepicker>
        </mat-form-field>

        <mat-divider></mat-divider>

        <!-- Custom Notification Toggle -->
        <div class="notification-section">
          <mat-checkbox
            formControlName="customNotification"
            color="warn"
            class="notification-checkbox">
            <div class="notification-label">
              <mat-icon class="notification-icon">notifications_active</mat-icon>
              <span>Custom notification</span>
            </div>
          </mat-checkbox>

          @if (form.get('customNotification')?.value) {
            <div class="notification-note-wrapper" @fadeIn>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Note</mat-label>
                <textarea
                  matInput
                  formControlName="blockReason"
                  rows="2"
                  placeholder="Enter notification note...">
                </textarea>
                <mat-icon matPrefix>edit_note</mat-icon>
              </mat-form-field>
            </div>
          }
        </div>

        <!-- Error message -->
        @if (errorMessage()) {
          <div class="error-banner">
            <mat-icon>error</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }
      </form>

      <mat-divider></mat-divider>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-stroked-button (click)="onCancel()" [disabled]="isSaving()">
          Cancel
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onSubmit()"
          [disabled]="!form.valid || isSaving()"
          class="save-btn">
          @if (isSaving()) {
            <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
            Creating...
          } @else {
            <mat-icon>person_add</mat-icon>
            
          }
          {{ isSaving() ? 'Creating...' : 'Create Client' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .create-client-dialog {
      display: flex;
      flex-direction: column;
      max-height: 85vh;
    }

    /* ===== HEADER ===== */
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px 16px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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

    .header-text {
      flex: 1;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }

      p {
        margin: 4px 0 0 0;
        font-size: 13px;
        color: #6b7280;
      }
    }

    .close-btn {
      color: #9ca3af;
    }

    /* ===== CONTENT ===== */
    .dialog-content {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    /* ===== NOTIFICATION SECTION ===== */
    .notification-section {
      padding: 12px 0;
    }

    .notification-checkbox {
      margin-bottom: 4px;
    }

    .notification-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #374151;
    }

    .notification-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #f59e0b;
    }

    .notification-note-wrapper {
      margin-top: 12px;
      padding-left: 8px;
      border-left: 3px solid #fcd34d;
    }

    /* ===== ERROR ===== */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-size: 13px;
      color: #dc2626;
      margin-top: 8px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
    }

    /* ===== FOOTER ===== */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;

      .save-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 140px;
        justify-content: center;
      }

      .btn-spinner {
        display: inline-flex;
      }
    }

    /* ===== SCROLLBAR ===== */
    .dialog-content::-webkit-scrollbar {
      width: 6px;
    }

    .dialog-content::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .dialog-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
  `]
})
export class CreateClientDialogComponent {
  private fb = inject(FormBuilder);
  private clientsService = inject(ClientsService);
  private dialogRef = inject(MatDialogRef<CreateClientDialogComponent>);
  private data: CreateClientDialogData = inject(MAT_DIALOG_DATA);

  isSaving = signal(false);
  errorMessage = signal('');

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      customerName: [this.data.prefillName || '', Validators.required],
      customerPhone1: [this.data.prefillPhone || '', Validators.required],
      customerPhone2: [''],
      birthDate: [null],
      customNotification: [false],
      blockReason: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (!this.form.valid || this.isSaving()) return;

    this.isSaving.set(true);
    this.errorMessage.set('');

    const formValue = this.form.value;

    const request = {
      CustomerName: formValue.customerName.trim(),
      CustomerPhone1: formValue.customerPhone1.trim(),
      CustomerPhone2: formValue.customerPhone2?.trim() || undefined,
      BirthDate: formValue.birthDate
        ? this.formatDate(formValue.birthDate)
        : undefined,
      CustomerIsBlock: formValue.customNotification ? 1 : 0,
      CustomerBlockReason: formValue.customNotification
        ? formValue.blockReason?.trim() || undefined
        : undefined,
      BranchId: this.data.branchId
    };

    this.clientsService.createCustomer(request).subscribe({
      next: (client) => {
        this.isSaving.set(false);
        this.dialogRef.close({ client } as CreateClientDialogResult);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          err?.message || 'Failed to create client. Please try again.'
        );
      }
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}