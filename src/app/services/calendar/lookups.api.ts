// services/calendar/lookups.api.ts
import { Client, Location, ServiceItem, Staff } from '../../models/calendar/models.model';

/** ===== API DTOs (from your backend) ===== */
export interface BranchDto {
  BranchId: number;
  BranchName1: string;
  BranchName2: string;
  BranchAddress?: string;
  ColorCode?: string;
  EnglishCurrencyName?: string;
}

export interface StaffDto {
  Id: number;
  EnglishName: string;
  ArabicName?: string;
  Active: boolean;
  BranchId: number;
}

export interface AppointmentCategoryDto {
  Id: number;
  ArabicName: string;
  EnglishName: string;
  Deleted: boolean;
  IsMakeup: boolean;
  IsPackage: boolean;
  Deposit: number;
}
export interface AppointmentCategory {
  id: number;
  name: string;
  nameAr: string;
  isMakeup: boolean;
  isPackage: boolean;
  deposit: number;
}

export interface ServiceDto {
  ItemId: number;
  ItemEnName: string;
  ItemArName: string;
  ItemIsActive: number;
  AppointmentCategoryId: number;
  AppointmentCategoryNameEn?: string;
  AppointmentCategoryNameAr?: string;
  CategoryId?: number;
  CategoryNameEn?: string;
  CategoryNameAr?: string;
  ItemUnitPrice: number;
  ItemUnitDuration: number;
  EnglishCurrencyName?: string;
  UnitEnName?: string;
  UnitArName?: string;
  ItemDocumentName?: string;
  MinimumPrice?: number;
  UnitId?: number;
  UnitActive?: boolean;
  BranchId?: number;
  BranchName1?: string;
  BranchName2?: string;
  BranchPhone?: string;
  ArabicCurrencyName?: string;
  RoundOfDigits?: number;
}

export interface CustomerDto {
  CustomerId: number;
  CustomerName: string;
  CustomerPhone1: string;
  CustomerPhone2?: string;
  CustomerNote?: string;
  CustomerIsBlock?: number;
  CustomerBlockReason?: string;
}

export interface PaymentTypeDto {
  Id: number;
  Name1: string;
  Name2: string;
}

// ✅ NEW: Create Customer
export interface CreateCustomerApiRequest {
  CustomerName: string;
  CustomerPhone1: string;
  CustomerPhone2?: string;
  BirthDate?: string;
  CustomerIsBlock?: number;
  CustomerBlockReason?: string;
  BranchId: number;
}

export interface CreateCustomerApiResponse {
  CustomerId: number;
  CustomerName: string;
  CustomerPhone1: string;
  CustomerPhone2?: string;
  BirthDate?: string;
  CustomerIsBlock?: number;
  CustomerBlockReason?: string;
  CustomerCreatedDate: string;
  BranchId: number;
  CustomerRefGuide: string;
}

/** ===== Color helpers ===== */
export function colorFromId(id: number): string {
  const hue = (id * 137) % 360;
  return hslToHex(hue, 70, 45);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function normalizeHex(hex?: string): string | undefined {
  if (!hex) return undefined;
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 6) return `#${cleaned}`;
  return undefined;
}

/** ===== Mappers ===== */
export function mapBranchToLocation(b: BranchDto): Location {
  return {
    id: `loc-${b.BranchId}`,
    name: b.BranchName1,
    nameAr: b.BranchName2 || b.BranchName1,
    address: b.BranchAddress
  };
}

export function mapStaffDtoToStaff(s: StaffDto): Staff {
  return {
    id: `staff-${s.Id}`,
    name: (s.EnglishName || s.ArabicName || '').trim(),
    nameAr: (s.ArabicName || s.EnglishName || '').trim(),
    color: colorFromId(s.Id),
    avatar: initialsFromName((s.EnglishName || s.ArabicName || '').trim()),
    isActive: !!s.Active
  };
}

export function mapServiceDtoToServiceItem(x: ServiceDto): ServiceItem {
  const category = (x.AppointmentCategoryNameEn || '').trim() || 'Service';
  const categoryAr = (x.AppointmentCategoryNameAr || category).trim();

  const duration = x.ItemUnitDuration && x.ItemUnitDuration > 0
    ? Math.round(x.ItemUnitDuration)
    : 30;

  return {
    id: `service-${x.ItemId}`,
    name: (x.ItemEnName || '').trim(),
    nameAr: (x.ItemArName || x.ItemEnName || '').trim(),
    category,
    categoryAr,
    appointmentCategoryId: x.AppointmentCategoryId,
    duration,
    price: Number(x.ItemUnitPrice ?? 0),
    discount: 0,
    colorHex: colorFromId(x.ItemId),
    currency: x.EnglishCurrencyName || 'KWD',
    unitId: x.UnitId || 0
  };
}

export function mapCustomerDtoToClient(c: CustomerDto, currency = 'KWD'): Client {
  return {
    id: `client-${c.CustomerId}`,
    name: (c.CustomerName || '').trim(),
    phone: c.CustomerPhone1,
    phone2: c.CustomerPhone2 || undefined,
    email: undefined,
    isVIP: false,
    isNewCustomer: false,
    hasAlert: (c.CustomerIsBlock ?? 0) === 1,        // ✅ NEW
    alertNote: c.CustomerBlockReason || undefined,    // ✅ NEW
    totalBookings: 0,
    unpaidAmount: 0,
    currency
  };
}

export function mapAppointmentCategoryDto(dto: AppointmentCategoryDto): AppointmentCategory {
  return {
    id: dto.Id,
    name: (dto.EnglishName || '').trim(),
    nameAr: (dto.ArabicName || dto.EnglishName || '').trim(),
    isMakeup: dto.IsMakeup,
    isPackage: dto.IsPackage,
    deposit: dto.Deposit
  };
}

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || 'NA';
}