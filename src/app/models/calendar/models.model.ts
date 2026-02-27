// models/models.ts

export interface Staff {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isVIP: boolean;
  totalBookings: number;
  unpaidAmount: number;
  currency: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: number; // in minutes
  price: number;
  discount: number; // percentage (0-100)
  colorHex: string; // service color for appointment blocks
  currency: string;
}

/** Where the service is performed */
export type ServiceType = 'SALON' | 'HOME';

/** Payment collection status */
export type PaymentStatus = 'NONE' | 'DEPOSIT' | 'FULL';

/** Payment method used */
export type PaymentType = number; // PaymentTypeId from API

/** Checkout workflow status — independent of appointment lifecycle status */
export type CheckoutStatus = 'open' | 'checked_out';

/** Calendar view granularity */
export enum CalendarViewMode {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH'
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  isOnlineBooking: boolean;
  notes?: string;

  // Lifecycle status
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';

  // Checkout workflow status (separate from lifecycle)
  checkoutStatus: CheckoutStatus;

  // Stage 1 additions
  numberOfPersons: number;   // min 1, default 1
  serviceType: ServiceType;  // default 'SALON'

  // Payment fields
  paymentStatus: PaymentStatus;      // default 'NONE'
  paymentType?: PaymentType;         // required only when paymentStatus !== 'NONE'
  depositAmount: number;             // meaningful only when paymentStatus === 'DEPOSIT'
  paidAmount: number;                // running total of payments collected, default 0
  voucherCode?: string;
}

// Enriched appointment with resolved references for display
export interface AppointmentView extends Appointment {
  client: Client;
  service: ServiceItem;
  staff: Staff;
  topPosition: number;    // calculated pixel position from top
  height: number;         // calculated height in pixels

  // overlap layout (side-by-side)
  laneIndex: number;      // for side-by-side overlap layout (0-based)
  laneCount: number;      // total lanes in overlap group

  discountedPrice: number;

  /** Total price (discounted unit price × numberOfPersons) */
  totalPrice: number;

  /** Remaining amount to be paid (totalPrice − paidAmount, never < 0) */
  remainingAmount: number;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
}

export interface TimeSlot {
  time: string;      // HH:mm
  label: string;     // Display label like "6:00 AM"
  isHour: boolean;   // true for full hours
}

export interface CalendarConfig {
  startHour: number;      // 6 for 6:00 AM
  endHour: number;        // 24 for midnight (12:00 AM next day)
  slotDuration: number;   // minutes per slot (15 or 30)
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

// Time option for dropdowns
export interface TimeOption {
  value: string;   // HH:mm format
  label: string;   // Display format (e.g., "9:00 AM")
  disabled?: boolean;
}

/** Payload for AppointmentsService.applyPayment() */
export interface ApplyPaymentPayload {
  amount: number;
  paymentType: PaymentType;
  as: 'DEPOSIT' | 'FULL';
  voucherCode?: string;
}

/** Result of getVisibleDateRange() */
export interface DateRange {
  /** First visible date (inclusive) */
  start: Date;
  /** Last visible date (inclusive) */
  end: Date;
}