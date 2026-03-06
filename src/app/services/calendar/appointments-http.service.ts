// services/calendar/appointments-http.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateAppointmentApiRequest,
  UpdateAppointmentApiRequest,
  UpdateStatusApiRequest,
  ApplyPaymentApiRequest,
  CheckoutApiRequest,
  AppointmentApiDto,
  AppointmentListApiResponse,
  AppointmentDetailApiDto,
  CheckoutApiResponse,
  InvoiceApiDto
} from './appointments.api';

interface ApiResponse<T> {
  Success: boolean;
  Error?: string;
  Data: T;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsHttpService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/appointments`;

  // POST /api/appointments
  create(request: CreateAppointmentApiRequest): Observable<AppointmentApiDto> {
    return this.http
      .post<ApiResponse<AppointmentApiDto>>(this.baseUrl, request)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to create appointment');
        return r.Data;
      }));
  }

  // GET /api/appointments?branchId=1&date=2025-01-15
  getAll(params: {
    branchId: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    staffId?: number;
    status?: string;
  }): Observable<AppointmentListApiResponse> {
    let httpParams = new HttpParams().set('branchId', params.branchId);

    if (params.date) httpParams = httpParams.set('date', params.date);
    if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    if (params.staffId) httpParams = httpParams.set('staffId', params.staffId);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http
      .get<ApiResponse<AppointmentListApiResponse>>(this.baseUrl, { params: httpParams })
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to load appointments');
        return r.Data;
      }));
  }

  // GET /api/appointments/{id}
  getById(id: number): Observable<AppointmentDetailApiDto> {
    return this.http
      .get<ApiResponse<AppointmentDetailApiDto>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Appointment not found');
        return r.Data;
      }));
  }

  // PUT /api/appointments/{id}
  update(id: number, request: UpdateAppointmentApiRequest): Observable<AppointmentApiDto> {
    return this.http
      .put<ApiResponse<AppointmentApiDto>>(`${this.baseUrl}/${id}`, request)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to update appointment');
        return r.Data;
      }));
  }

  // PATCH /api/appointments/{id}/status
  updateStatus(id: number, request: UpdateStatusApiRequest): Observable<AppointmentApiDto> {
    return this.http
      .patch<ApiResponse<AppointmentApiDto>>(`${this.baseUrl}/${id}/status`, request)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to update status');
        return r.Data;
      }));
  }

  // POST /api/appointments/{id}/payments
  applyPayment(id: number, request: ApplyPaymentApiRequest): Observable<AppointmentApiDto> {
    return this.http
      .post<ApiResponse<AppointmentApiDto>>(`${this.baseUrl}/${id}/payments`, request)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to apply payment');
        return r.Data;
      }));
  }

  // POST /api/appointments/{id}/checkout
  checkout(id: number, request?: CheckoutApiRequest): Observable<CheckoutApiResponse> {
    return this.http
      .post<ApiResponse<CheckoutApiResponse>>(`${this.baseUrl}/${id}/checkout`, request || {})
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to checkout');
        return r.Data;
      }));
  }

  // DELETE /api/appointments/{id}
  delete(id: number): Observable<{ DeletedId: number }> {
    return this.http
      .delete<ApiResponse<{ DeletedId: number }>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Failed to delete appointment');
        return r.Data;
      }));
  }

  // GET /api/appointments/{id}/invoice
  getInvoice(id: number): Observable<InvoiceApiDto> {
    return this.http
      .get<ApiResponse<InvoiceApiDto>>(`${this.baseUrl}/${id}/invoice`)
      .pipe(map(r => {
        if (!r.Success) throw new Error(r.Error || 'Invoice not found');
        return r.Data;
      }));
  }
}