// models/models.ts

export interface Staff {
  id: string;
  name: string;
  nameAr: string;
  color: string;
  avatar?: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  isVIP: boolean;
  isNewCustomer: boolean;
  hasAlert: boolean;           // ✅ NEW — Custom notification is ON
  alertNote?: string;          // ✅ NEW — The notification note text
  totalBookings: number;
  unpaidAmount: number;
  currency: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  appointmentCategoryId: number;
  duration: number;
  price: number;
  discount: number;
  colorHex: string;
  currency: string;
  unitId: number;
}

/** Where the service is performed */
export type ServiceType = 'SALON' | 'HOME';

/** Payment collection status */
export type PaymentStatus = 'NONE' | 'DEPOSIT' | 'FULL';

/** Payment method used */
export type PaymentType = number;

/** Checkout workflow status */
export type CheckoutStatus = 'open' | 'checked_out';

/** Calendar view granularity */
export enum CalendarViewMode {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH'
}

export interface Appointment {
  id: string;
  backendId?: number;
  branchId?: number;
  clientId: string;
  serviceId: string;
  staffId: string;
  unitId?: number;
  itemId?: number;
  customerId?: number;
  staffBackendId?: number;
  date: Date;
  startTime: string;
  endTime: string;
  isOnlineBooking: boolean;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  checkoutStatus: CheckoutStatus;
  numberOfPersons: number;
  serviceType: ServiceType;
  paymentStatus: PaymentStatus;
  paymentType?: PaymentType;
  depositAmount: number;
  paidAmount: number;
  voucherCode?: string;
  invoiceId?: number;
  invoiceNumber?: string;
}

export interface AppointmentView extends Appointment {
  client: Client;
  service: ServiceItem;
  staff: Staff;
  topPosition: number;
  height: number;
  laneIndex: number;
  laneCount: number;
  discountedPrice: number;
  totalPrice: number;
  remainingAmount: number;
}

export interface Location {
  id: string;
  name: string;
  nameAr: string;
  address?: string;
}

export interface TimeSlot {
  time: string;
  label: string;
  isHour: boolean;
}

export interface CalendarConfig {
  startHour: number;
  endHour: number;
  slotDuration: number;
  pixelsPerMinute: number;
}

export interface CreateAppointmentForm {
  client: Client | null;
  service: ServiceItem | null;
  staff: Staff | null;
  date: Date;
  startTime: string;
  endTime: string;
  notes: string;
  numberOfPersons: number;
  serviceType: ServiceType;
}

export interface TimeOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ApplyPaymentPayload {
  amount: number;
  paymentType: PaymentType;
  as: 'DEPOSIT' | 'FULL';
  voucherCode?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}