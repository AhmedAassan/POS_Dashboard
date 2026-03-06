// services/calendar/appointments.api.ts

export interface CreateAppointmentApiRequest {
  BranchId: number;
  CustomerId: number;
  ItemId: number;
  UnitId: number;
  StaffId: number;
  AppointmentDate: string;    // "yyyy-MM-dd"
  StartTime: string;          // "HH:mm"
  EndTime: string;            // "HH:mm"
  NumberOfPersons: number;
  ServiceType: string;        // "SALON" | "HOME"
  IsOnlineBooking: boolean;
  Notes?: string;
}

export interface UpdateAppointmentApiRequest {
  CustomerId?: number;
  ItemId?: number;
  UnitId?: number;
  StaffId?: number;
  AppointmentDate?: string;
  StartTime?: string;
  EndTime?: string;
  NumberOfPersons?: number;
  ServiceType?: string;
  Notes?: string;
  ClearNotes?: boolean;
}

export interface UpdateStatusApiRequest {
  Status: string;
}

export interface ApplyPaymentApiRequest {
  Amount: number;
  PaymentTypeId: number;
  PaymentAs: string;          // "DEPOSIT" | "FULL"
  VoucherCode?: string;
}

export interface CheckoutApiRequest {
  PaymentTypeId?: number;
}

export interface AppointmentApiDto {
  Id: number;
  BranchId: number;
  CustomerId: number;
  CustomerName: string;
  CustomerPhone: string;
  ItemId: number;
  ItemEnName: string;
  ItemArName: string;
  UnitId: number;
  StaffId: number;
  StaffEnName: string;
  StaffArName: string;
  AppointmentDate: string;    // "yyyy-MM-dd"
  StartTime: string;          // "HH:mm"
  EndTime: string;            // "HH:mm"
  NumberOfPersons: number;
  ServiceType: string;
  IsOnlineBooking: boolean;
  Notes?: string;
  UnitPrice: number;
  DiscountPercent: number;
  DiscountedUnitPrice: number;
  TotalPrice: number;
  PaidAmount: number;
  RemainingAmount: number;
  PaymentStatus: string;
  DepositAmount: number;
  VoucherCode?: string;
  Status: string;
  CheckoutStatus: string;
  InvoiceId?: number;
  InvoiceNumber?: string;
  CreatedAt: string;
}

export interface AppointmentListApiResponse {
  TotalCount: number;
  Appointments: AppointmentApiDto[];
}

export interface AppointmentPaymentApiDto {
  Id: number;
  Amount: number;
  PaymentTypeId: number;
  PaymentTypeName: string;
  PaymentAs: string;
  VoucherCode?: string;
  PaidAt: string;
}

export interface AppointmentDetailApiDto {
  Appointment: AppointmentApiDto;
  Payments: AppointmentPaymentApiDto[];
}

export interface InvoiceApiDto {
  Id: number;
  InvoiceNumber: string;
  AppointmentId: number;
  TotalAmount: number;
  PaidAmount: number;
  RemainingAmount: number;
  Currency: string;
  PaymentTypeId?: number;
  PaymentStatus: string;
  CreatedAt: string;
}

export interface CheckoutApiResponse {
  AppointmentId: number;
  Invoice: InvoiceApiDto;
}