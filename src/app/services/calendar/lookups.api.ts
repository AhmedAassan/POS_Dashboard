// services/calendar/lookups.api.ts
import { Client, Location, ServiceItem, Staff } from '../../models/calendar/models.model';

/** ===== API DTOs (from your backend) ===== */
export interface BranchDto {
  BranchId: number;
  BranchName1: string;
  BranchAddress?: string;
  ColorCode?: string; // "bae8e8"
  EnglishCurrencyName?: string; // "KWD"
}

export interface StaffDto {
  Id: number;
  EnglishName: string;
  ArabicName?: string;
  Active: boolean;
  BranchId: number;
}

export interface ServiceDto {
  ItemId: number;
  ItemEnName: string;          // ✅ renamed from ItemName1
  ItemArName: string;          // ✅ new
  ItemIsActive: number;
  CategoryNameEn?: string;     // ✅ renamed from CategoryName1
  CategoryNameAr?: string;     // ✅ new
  AppointmentCategoryNameEn?: string;
  AppointmentCategoryNameAr?: string;  // ✅ new
  ItemUnitPrice: number;
  ItemUnitDuration: number;
  EnglishCurrencyName?: string;
  UnitEnName?: string;         // ✅ new
  UnitArName?: string;         // ✅ new
}

export interface CustomerDto {
  CustomerId: number;
  CustomerName: string;
  CustomerPhone1: string;
  CustomerNote?: string;
  CustomerIsBlock?: number;
}

export interface PaymentTypeDto {
  Id: number;
  Name1: string; // "Cash", "K-Net", ...
  Name2: string;
}

/** ===== Color helpers =====
 * You asked “random colors”.
 * If we make them truly random on every fetch, colors will change on refresh and feel “buggy”.
 * So this gives a random-looking BUT STABLE color per id (no UI flicker).
 */
export function colorFromId(id: number): string {
  // simple deterministic hash -> hue
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

/** Backend branch ColorCode might come without '#'. */
export function normalizeHex(hex?: string): string | undefined {
  if (!hex) return undefined;
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 6) return `#${cleaned}`;
  return undefined;
}

/** ===== Mappers: DTO -> your existing UI models ===== */
export function mapBranchToLocation(b: BranchDto): Location {
  return {
    id: `loc-${b.BranchId}`,
    name: b.BranchName1,
    address: b.BranchAddress
  };
}

export function mapStaffDtoToStaff(s: StaffDto): Staff {
  return {
    id: `staff-${s.Id}`,
    name: (s.EnglishName || s.ArabicName || '').trim(),
    color: colorFromId(s.Id), // “random” but stable
    avatar: initialsFromName((s.EnglishName || s.ArabicName || '').trim()),
    isActive: !!s.Active
  };
}

export function mapServiceDtoToServiceItem(x: ServiceDto): ServiceItem {
  const category =
    (x.CategoryNameEn || '').trim() ||          // ✅ changed
    (x.AppointmentCategoryNameEn || '').trim() ||
    'Service';

  const duration = x.ItemUnitDuration && x.ItemUnitDuration > 0 ? Math.round(x.ItemUnitDuration) : 30;

  return {
    id: `service-${x.ItemId}`,
    name: (x.ItemEnName || '').trim(),           // ✅ changed
    category,
    duration,
    price: Number(x.ItemUnitPrice ?? 0),
    discount: 0,
    colorHex: colorFromId(x.ItemId),
    currency: x.EnglishCurrencyName || 'KWD'
  };
}

export function mapCustomerDtoToClient(c: CustomerDto, currency = 'KWD'): Client {
  return {
    id: `client-${c.CustomerId}`,
    name: (c.CustomerName || '').trim(),
    phone: c.CustomerPhone1,
    email: undefined,      // not provided
    isVIP: false,          // not provided
    totalBookings: 0,      // not provided
    unpaidAmount: 0,       // not provided
    currency
  };
}

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || 'NA';
}