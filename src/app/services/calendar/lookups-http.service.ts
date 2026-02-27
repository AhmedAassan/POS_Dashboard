// services/calendar/lookups-http.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  BranchDto,
  CustomerDto,
  PaymentTypeDto,
  ServiceDto,
  StaffDto,
  AppointmentCategoryDto
} from './lookups.api';

interface ApiResponse<T> {
  Success: boolean;
  Data: T;
}
export interface AppointmentSettingsDto {
  StartHour: number;
  EndHour: number;
  SlotDuration: number;
  TimeZoneOffset: number;
}
@Injectable({ providedIn: 'root' })
export class LookupsHttpService {
  private http = inject(HttpClient);

  // بدل localhost: خليها من environment
  private readonly baseUrl = `${environment.apiBaseUrl}/lookups`;

  getBranches() {
    return this.http
      .get<ApiResponse<BranchDto[]>>(`${this.baseUrl}/branches`)
      .pipe(map(r => r.Data ?? []));
  }

  getStaff() {
    return this.http
      .get<ApiResponse<StaffDto[]>>(`${this.baseUrl}/staff`)
      .pipe(map(r => r.Data ?? []));
  }

  getServices() {
    return this.http
      .get<ApiResponse<ServiceDto[]>>(`${this.baseUrl}/services`)
      .pipe(map(r => r.Data ?? []));
  }

  getCustomers() {
    return this.http
      .get<ApiResponse<CustomerDto[]>>(`${this.baseUrl}/customers`)
      .pipe(map(r => r.Data ?? []));
  }

  getPaymentTypes() {
    return this.http
      .get<ApiResponse<PaymentTypeDto[]>>(`${this.baseUrl}/payment-types`)
      .pipe(map(r => r.Data ?? []));
  }
  getAppointmentSettings() {
  return this.http
    .get<ApiResponse<AppointmentSettingsDto>>(`${this.baseUrl}/appointment-settings`)
    .pipe(map(r => r.Data));
  }

  getAppointmentCategories() {
    return this.http
      .get<ApiResponse<AppointmentCategoryDto[]>>(`${this.baseUrl}/appointment-categories`)
      .pipe(map(r => r.Data ?? []));
  }
}