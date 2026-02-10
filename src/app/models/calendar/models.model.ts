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
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
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
}

// Time option for dropdowns
export interface TimeOption {
  value: string;   // HH:mm format
  label: string;   // Display format (e.g., "9:00 AM")
  disabled?: boolean;
}
