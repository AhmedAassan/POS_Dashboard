// services/calendar/lookups-http.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BranchDto,
  CustomerDto,
  PaymentTypeDto,
  ServiceDto,
  StaffDto,
  AppointmentCategoryDto,
  CreateCustomerApiRequest,
  CreateCustomerApiResponse
} from './lookups.api';

interface ApiResponse<T> {
  Success: boolean;
  Error?: string;
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

  // ✅ NEW
  createCustomer(request: CreateCustomerApiRequest): Observable<CreateCustomerApiResponse> {
    return this.http
      .post<ApiResponse<CreateCustomerApiResponse>>(`${this.baseUrl}/customers`, request)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to create customer');
        return r.Data;
      }));
  }
}