// services/appointments.service.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { effect } from '@angular/core';
import {
  Appointment,
  AppointmentView,
  CalendarConfig,
  CalendarViewMode,
  TimeOption,
  DateRange,
  ApplyPaymentPayload,
  ServiceItem
} from '../../models/calendar/models.model';
import { Subject } from 'rxjs';
import { StaffService } from './staff';
import { ClientsService } from './clients';
import { ServicesService } from './services';
import { NotificationService } from './notification.service';
import { LookupsHttpService } from './lookups-http.service';
import { AppointmentCategoriesService } from './appointment-categories.service';
import { AppointmentsHttpService } from './appointments-http.service';
import { AppointmentApiDto } from './appointments.api';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private staffService = inject(StaffService);
  private clientsService = inject(ClientsService);
  private servicesService = inject(ServicesService);
  private api = inject(LookupsHttpService); 
  private categoriesService = inject(AppointmentCategoriesService);
  private appointmentsApi = inject(AppointmentsHttpService);
  private notify = inject(NotificationService);
  private loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  // Calendar configuration - easily changeable

  private configSignal = signal<CalendarConfig>({
    startHour: 6,
    endHour: 22,
    slotDuration: 15,
    pixelsPerMinute: 1.5
  });

  readonly config = this.configSignal.asReadonly(); 

  constructor() {
    // ✅ existing: load settings from API
    this.api.getAppointmentSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.configSignal.update(c => ({
            ...c,
            startHour: settings.StartHour,
            endHour: settings.EndHour
          }));
        }
      },
      error: (err) => {
        console.error('Failed to load appointment settings', err);
      }
    });

    // ✅ NEW: Auto-load appointments whenever date or view mode changes
    effect(() => {
      const date = this.selectedDate();
      const viewMode = this.selectedViewMode();
      const branchId = 1; // TODO: make this reactive from selected branch

      const range = this.getVisibleDateRange(date, viewMode);

      if (viewMode === CalendarViewMode.DAY) {
        this.loadAppointments(branchId, range.start);
      } else {
        this.loadAppointmentsRange(branchId, range.start, range.end);
      }
    });
  }
  private mapApiDtoToAppointment(dto: AppointmentApiDto): Appointment {
    return {
      id: `apt-${dto.Id}`,
      backendId: dto.Id,
      branchId: dto.BranchId,
      clientId: `client-${dto.CustomerId}`,
      serviceId: `service-${dto.ItemId}`,
      staffId: `staff-${dto.StaffId}`,
      unitId: dto.UnitId,
      itemId: dto.ItemId,
      customerId: dto.CustomerId,
      staffBackendId: dto.StaffId,
      date: new Date(dto.AppointmentDate),
      startTime: dto.StartTime,
      endTime: dto.EndTime,
      isOnlineBooking: dto.IsOnlineBooking,
      notes: dto.Notes,
      status: dto.Status as any,
      checkoutStatus: dto.CheckoutStatus as any,
      numberOfPersons: dto.NumberOfPersons,
      serviceType: dto.ServiceType as any,
      paymentStatus: dto.PaymentStatus as any,
      paymentType: undefined,
      depositAmount: dto.DepositAmount,
      paidAmount: dto.PaidAmount,
      voucherCode: dto.VoucherCode,
      invoiceId: dto.InvoiceId,
      invoiceNumber: dto.InvoiceNumber
    };
  }
  /** Load appointments from API for a specific branch and date range */
  loadAppointments(branchId: number, date: Date): void {
    this.loadingSignal.set(true);
    const dateStr = this.formatDateForApi(date);
    
    this.appointmentsApi.getAll({ branchId, date: dateStr }).subscribe({
      next: (response) => {
        const appointments = response.Appointments.map(dto => this.mapApiDtoToAppointment(dto));
        this.appointmentsSignal.set(appointments);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
        this.loadingSignal.set(false);
      }
    });
  }

  /** Load appointments for a date range (week/month views) */
  loadAppointmentsRange(branchId: number, dateFrom: Date, dateTo: Date): void {
    const from = this.formatDateForApi(dateFrom);
    const to = this.formatDateForApi(dateTo);
    
    this.appointmentsApi.getAll({ branchId, dateFrom: from, dateTo: to }).subscribe({
      next: (response) => {
        const appointments = response.Appointments.map(dto => this.mapApiDtoToAppointment(dto));
        this.appointmentsSignal.set(appointments);
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
      }
    });
  }

  private formatDateForApi(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  

  private checkoutResultSubject = new Subject<{
    appointmentId: string;
    invoiceNumber: string;
    invoiceId: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    currency: string;
    paymentTypeId?: number;
    paymentStatus: string;
  }>();
  // ── Reactive state ──
  private appointmentsSignal = signal<Appointment[]>([]);
  private selectedDateSignal = signal<Date>(new Date());
  private selectedViewModeSignal = signal<CalendarViewMode>(CalendarViewMode.DAY);


  readonly appointments = this.appointmentsSignal.asReadonly();
  readonly selectedDate = this.selectedDateSignal.asReadonly();
  readonly selectedViewMode = this.selectedViewModeSignal.asReadonly();
  readonly checkoutResult$ = this.checkoutResultSubject.asObservable();
  // ── Time options ──

  generateTimeOptions(): TimeOption[] {
    const options: TimeOption[] = [];

    for (let hour = this.config().startHour; hour <= this.config().endHour; hour++) {
      for (let minute = 0; minute < 60; minute += this.config().slotDuration) {
        if (hour === this.config().endHour && minute > 0) break;

        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

        options.push({ value, label });
      }
    }

    return options;
  }

  // ── View mode ──

  setViewMode(mode: CalendarViewMode): void {
    this.selectedViewModeSignal.set(mode);
  }

  
   checkoutAppointment(id: string, paymentTypeId?: number): void {
    const backendId = parseInt(id.replace('apt-', ''), 10);

    this.appointmentsApi.checkout(backendId, { PaymentTypeId: paymentTypeId }).subscribe({
      next: (response) => {
        // Update local state
        this.appointmentsSignal.update(apts =>
          apts.map(apt => apt.id === id
            ? {
                ...apt,
                checkoutStatus: 'checked_out' as const,
                status: 'completed' as const,
                invoiceId: response.Invoice.Id,
                invoiceNumber: response.Invoice.InvoiceNumber
              }
            : apt
          )
        );

        // Emit the real invoice data
        this.checkoutResultSubject.next({
          appointmentId: id,
          invoiceNumber: response.Invoice.InvoiceNumber,
          invoiceId: response.Invoice.Id,
          totalAmount: response.Invoice.TotalAmount,
          paidAmount: response.Invoice.PaidAmount,
          remainingAmount: response.Invoice.RemainingAmount,
          currency: response.Invoice.Currency,
          paymentTypeId: response.Invoice.PaymentTypeId ?? undefined,
          paymentStatus: response.Invoice.PaymentStatus
        });
      },
      error: (err) => console.error('Failed to checkout', err)
    });
  }
  /**
   * Compute the visible date range for a given date and view mode.
   * Both start and end are inclusive.
   * Week starts on Monday (ISO convention).
   */
  getVisibleDateRange(date: Date, viewMode: CalendarViewMode): DateRange {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    switch (viewMode) {
      case CalendarViewMode.DAY:
        return { start: new Date(d), end: new Date(d) };

      case CalendarViewMode.WEEK: {
        // ISO week: Monday = 0 offset
        const jsDay = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
        const start = new Date(d);
        start.setDate(start.getDate() + mondayOffset);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
      }

      case CalendarViewMode.MONTH: {
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return { start, end };
      }
    }
  }

  // ── Navigation ──

  next(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);

    switch (this.selectedViewMode()) {
      case CalendarViewMode.DAY:
        newDate.setDate(newDate.getDate() + 1);
        break;
      case CalendarViewMode.WEEK:
        newDate.setDate(newDate.getDate() + 7);
        break;
      case CalendarViewMode.MONTH:
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    this.selectedDateSignal.set(newDate);
  }

  previous(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);

    switch (this.selectedViewMode()) {
      case CalendarViewMode.DAY:
        newDate.setDate(newDate.getDate() - 1);
        break;
      case CalendarViewMode.WEEK:
        newDate.setDate(newDate.getDate() - 7);
        break;
      case CalendarViewMode.MONTH:
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    this.selectedDateSignal.set(newDate);
  }

  previousDay(): void {
    this.previous();
  }

  nextDay(): void {
    this.next();
  }

  goToToday(): void {
    this.selectedDateSignal.set(new Date());
  }

  setSelectedDate(date: Date): void {
    this.selectedDateSignal.set(date);
  }

  // ── Appointment queries ──

  /**
   * Get enriched, lane-calculated appointments for a specific date.
   * Applies all active filters: staff, service IDs, category IDs;
   * excludes cancelled appointments.
   *
   * NOTE: This is a plain method (not a computed) so it can be called
   * with arbitrary dates from Week / Month views. The computed
   * `appointmentsForSelectedDate` delegates to this for the current date.
   * Because it reads signals internally (appointments, selectedStaffIds, etc.)
   * Angular will still track reactivity when called inside a computed context.
   */
  appointmentsForDate(date: Date): AppointmentView[] {
  const appointments = this.appointments();
  const selectedStaffIds = this.staffService.selectedStaffIds();
  const selectedServiceIds = this.servicesService.selectedServiceIds();
  const selectedCategoryIds = this.categoriesService.selectedCategoryIds();

  const dateAppointments = appointments.filter(apt => {
    if (!this.isSameDay(apt.date, date)) return false;
    if (apt.status === 'cancelled') return false;
    if (!selectedStaffIds.has(apt.staffId)) return false;
    if (!selectedServiceIds.has(apt.serviceId)) return false;

    // Category filter by AppointmentCategoryId
    const service = this.servicesService.getServiceById(apt.serviceId);
    if (!service) return false;

    if (!selectedCategoryIds.has(service.appointmentCategoryId)) return false;

    return true;
  });

  const enrichedAppointments = dateAppointments.map(apt => this.enrichAppointment(apt));
  return this.calculateLanes(enrichedAppointments);
}

  readonly appointmentsForSelectedDate = computed(() => {
    return this.appointmentsForDate(this.selectedDate());
  });

  readonly appointmentsByDate = computed(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of this.appointments()) {
      const key = this.formatDateForApi(apt.date);
      const list = map.get(key) || [];
      list.push(apt);
      map.set(key, list);
    }
    return map;
  });
  // ── Pricing helpers ──

  computeTotal(serviceOrAppointment: ServiceItem | AppointmentView): number {
    if ('service' in serviceOrAppointment && 'numberOfPersons' in serviceOrAppointment) {
      const apt = serviceOrAppointment as AppointmentView;
      const unitPrice = this.servicesService.calculateDiscountedPrice(apt.service);
      return unitPrice * apt.numberOfPersons;
    }

    const service = serviceOrAppointment as ServiceItem;
    return this.servicesService.calculateDiscountedPrice(service);
  }

  computeRemaining(apt: AppointmentView): number {
    const total = this.computeTotal(apt);
    return Math.max(0, total - apt.paidAmount);
  }

  applyPayment(appointmentId: string, payload: ApplyPaymentPayload): void {
    const backendId = parseInt(appointmentId.replace('apt-', ''), 10);
    
    const request = {
      Amount: payload.amount,
      PaymentTypeId: payload.paymentType,
      PaymentAs: payload.as,
      VoucherCode: payload.voucherCode
    };

    this.appointmentsApi.applyPayment(backendId, request).subscribe({
      next: (dto) => {
        const updated = this.mapApiDtoToAppointment(dto);
        this.appointmentsSignal.update(apts =>
          apts.map(apt => apt.id === appointmentId ? { ...apt, ...updated } : apt)
        );
      },
      error: (err) => console.error('Failed to apply payment', err)
    });
  }

  // ── Enrichment ──

  private enrichAppointment(appointment: Appointment): AppointmentView {
    const client = this.clientsService.getClientById(appointment.clientId)!;
    const service = this.servicesService.getServiceById(appointment.serviceId)!;
    const staff = this.staffService.getStaffById(appointment.staffId)!;

    const topPosition = this.calculateTopPosition(appointment.startTime);
    const height = this.calculateHeight(appointment.startTime, appointment.endTime);
    const discountedPrice = this.servicesService.calculateDiscountedPrice(service);
    const totalPrice = discountedPrice * appointment.numberOfPersons;
    const remainingAmount = Math.max(0, totalPrice - appointment.paidAmount);

    return {
      ...appointment,
      client,
      service,
      staff,
      topPosition,
      height,
      discountedPrice,
      totalPrice,
      remainingAmount,
      laneIndex: 0,
      laneCount: 1
    };
  }

  // ── Lane calculation ──

  private calculateLanes(appointments: AppointmentView[]): AppointmentView[] {
    const byStaff = new Map<string, AppointmentView[]>();

    for (const apt of appointments) {
      const staffApts = byStaff.get(apt.staffId) || [];
      staffApts.push(apt);
      byStaff.set(apt.staffId, staffApts);
    }

    const result: AppointmentView[] = [];

    for (const [_staffId, staffApts] of byStaff) {
      staffApts.sort((a, b) => {
        const startDiff = this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
        if (startDiff !== 0) return startDiff;
        return this.timeToMinutes(a.endTime) - this.timeToMinutes(b.endTime);
      });

      const lanes: number[] = [];
      const laneAssignments = new Map<string, number>();

      for (const apt of staffApts) {
        const startMinutes = this.timeToMinutes(apt.startTime);

        let assignedLane = -1;
        for (let i = 0; i < lanes.length; i++) {
          if (lanes[i] <= startMinutes) {
            assignedLane = i;
            break;
          }
        }

        if (assignedLane === -1) {
          assignedLane = lanes.length;
          lanes.push(0);
        }

        lanes[assignedLane] = this.timeToMinutes(apt.endTime);
        laneAssignments.set(apt.id, assignedLane);
      }

      const overlapGroups = this.findOverlapGroups(staffApts);

      for (const group of overlapGroups) {
        let maxLane = 0;
        for (const apt of group) {
          maxLane = Math.max(maxLane, laneAssignments.get(apt.id) || 0);
        }
        const laneCount = maxLane + 1;

        for (const apt of group) {
          apt.laneIndex = laneAssignments.get(apt.id) || 0;
          apt.laneCount = laneCount;
        }
      }

      result.push(...staffApts);
    }

    return result;
  }

  private findOverlapGroups(appointments: AppointmentView[]): AppointmentView[][] {
    if (appointments.length === 0) return [];

    const parent = new Map<string, string>();

    const find = (id: string): string => {
      if (!parent.has(id)) parent.set(id, id);
      if (parent.get(id) !== id) {
        parent.set(id, find(parent.get(id)!));
      }
      return parent.get(id)!;
    };

    const union = (id1: string, id2: string) => {
      const root1 = find(id1);
      const root2 = find(id2);
      if (root1 !== root2) {
        parent.set(root1, root2);
      }
    };

    for (let i = 0; i < appointments.length; i++) {
      for (let j = i + 1; j < appointments.length; j++) {
        if (this.appointmentsOverlap(appointments[i], appointments[j])) {
          union(appointments[i].id, appointments[j].id);
        }
      }
    }

    const groups = new Map<string, AppointmentView[]>();
    for (const apt of appointments) {
      const root = find(apt.id);
      const group = groups.get(root) || [];
      group.push(apt);
      groups.set(root, group);
    }

    return Array.from(groups.values());
  }

  private appointmentsOverlap(a: AppointmentView, b: AppointmentView): boolean {
    const aStart = this.timeToMinutes(a.startTime);
    const aEnd = this.timeToMinutes(a.endTime);
    const bStart = this.timeToMinutes(b.startTime);
    const bEnd = this.timeToMinutes(b.endTime);

    return aStart < bEnd && aEnd > bStart;
  }

  // ── Position / height helpers ──

  calculateTopPosition(startTime: string): number {
    const [hours, minutes] = startTime.split(':').map(Number);
    const minutesFromDayStart = (hours - this.config().startHour) * 60 + minutes;
    return minutesFromDayStart * this.config().pixelsPerMinute;
  }

  calculateHeight(startTime: string, endTime: string): number {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const duration = endTotalMinutes - startTotalMinutes;

    return Math.max(duration * this.config().pixelsPerMinute, 30);
  }

  generateTimeSlots(): { time: string; label: string; isHour: boolean }[] {
    const slots: { time: string; label: string; isHour: boolean }[] = [];

    for (let hour = this.config().startHour; hour < this.config().endHour; hour++) {
      for (let minute = 0; minute < 60; minute += this.config().slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isHour = minute === 0;

        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

        slots.push({ time: timeString, label, isHour });
      }
    }

    return slots;
  }

  getGridHeight(): number {
    const totalMinutes = (this.config().endHour - this.config().startHour) * 60;
    return totalMinutes * this.config().pixelsPerMinute;
  }

  getSlotHeight(): number {
    return this.config().slotDuration * this.config().pixelsPerMinute;
  }

  // ── Conflict detection ──

  checkConflict(staffId: string, date: Date, startTime: string, endTime: string, excludeId?: string): Appointment | null {
    const appointments = this.appointments().filter(apt =>
      apt.staffId === staffId &&
      this.isSameDay(apt.date, date) &&
      apt.status !== 'cancelled' &&
      apt.id !== excludeId
    );

    const newStart = this.timeToMinutes(startTime);
    const newEnd = this.timeToMinutes(endTime);

    for (const apt of appointments) {
      const aptStart = this.timeToMinutes(apt.startTime);
      const aptEnd = this.timeToMinutes(apt.endTime);

      if (newStart < aptEnd && newEnd > aptStart) {
        return apt;
      }
    }

    return null;
  }

  // ── Time utilities ──

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  snapToIncrement(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const snappedMinutes = Math.round(minutes / this.config().slotDuration) * this.config().slotDuration;
    const adjustedHours = hours + Math.floor(snappedMinutes / 60);
    const finalMinutes = snappedMinutes % 60;
    return `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  }

  // ── Date utilities ──

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isDateInRange(date: Date, range: DateRange): boolean {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(range.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  }

  // ── CRUD ──

  createAppointment(data: Omit<Appointment, 'id' | 'status' | 'checkoutStatus'>): void {
    // Extract backend IDs from the frontend IDs
    const customerId = parseInt(data.clientId.replace('client-', ''), 10);
    const itemId = parseInt(data.serviceId.replace('service-', ''), 10);
    const staffId = parseInt(data.staffId.replace('staff-', ''), 10);
    
    const request = {
      BranchId: data.branchId || 1,
      CustomerId: customerId,
      ItemId: itemId,
      UnitId: data.unitId || 0,
      StaffId: staffId,
      AppointmentDate: this.formatDateForApi(data.date),
      StartTime: data.startTime,
      EndTime: data.endTime,
      NumberOfPersons: data.numberOfPersons ?? 1,
      ServiceType: data.serviceType ?? 'SALON',
      IsOnlineBooking: data.isOnlineBooking || false,
      Notes: data.notes
    };

    this.appointmentsApi.create(request).subscribe({
      next: (dto) => {
        const newApt = this.mapApiDtoToAppointment(dto);
        this.appointmentsSignal.update(apts => [...apts, newApt]);
      },
      error: (err) => {
        console.error('Failed to create appointment', err);
        this.notify.error('Failed to create appointment. Please try again.');
      }
    });
  }

  updateAppointment(id: string, updates: Partial<Appointment>): void {
    const backendId = parseInt(id.replace('apt-', ''), 10);
    
    const request: any = {};
    
    if (updates.clientId) request.CustomerId = parseInt(updates.clientId.replace('client-', ''), 10);
    if (updates.serviceId) request.ItemId = parseInt(updates.serviceId.replace('service-', ''), 10);
    if (updates.staffId) request.StaffId = parseInt(updates.staffId.replace('staff-', ''), 10);
    if (updates.unitId) request.UnitId = updates.unitId;
    if (updates.date) request.AppointmentDate = this.formatDateForApi(updates.date);
    if (updates.startTime) request.StartTime = updates.startTime;
    if (updates.endTime) request.EndTime = updates.endTime;
    if (updates.numberOfPersons) request.NumberOfPersons = updates.numberOfPersons;
    if (updates.serviceType) request.ServiceType = updates.serviceType;
    if (updates.notes !== undefined) {
      if (updates.notes) request.Notes = updates.notes;
      else request.ClearNotes = true;
    }

    // Status-only update
    if (updates.status && Object.keys(request).length === 0) {
      this.appointmentsApi.updateStatus(backendId, { Status: updates.status }).subscribe({
        next: (dto) => {
          const updated = this.mapApiDtoToAppointment(dto);
          this.appointmentsSignal.update(apts =>
            apts.map(apt => apt.id === id ? { ...apt, ...updated } : apt)
          );
        },
        error: (err) => console.error('Failed to update status', err)
      });
      return;
    }

    // Checkout status update
    if (updates.checkoutStatus === 'checked_out') {
      // This is handled by checkout endpoint, just update locally
      this.appointmentsSignal.update(apts =>
        apts.map(apt => apt.id === id ? { ...apt, ...updates } : apt)
      );
      return;
    }

    if (Object.keys(request).length === 0) {
      // Local-only update (e.g., voucherCode)
      this.appointmentsSignal.update(apts =>
        apts.map(apt => apt.id === id ? { ...apt, ...updates } : apt)
      );
      return;
    }

    this.appointmentsApi.update(backendId, request).subscribe({
      next: (dto) => {
        const updated = this.mapApiDtoToAppointment(dto);
        this.appointmentsSignal.update(apts =>
          apts.map(apt => apt.id === id ? { ...apt, ...updated } : apt)
        );
      },
      error: (err) => console.error('Failed to update appointment', err)
    });
  }

  deleteAppointment(id: string): void {
    const backendId = parseInt(id.replace('apt-', ''), 10);
    
    this.appointmentsApi.delete(backendId).subscribe({
      next: () => {
        this.appointmentsSignal.update(apts => apts.filter(apt => apt.id !== id));
      },
      error: (err) => console.error('Failed to delete appointment', err)
    });
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments().find(apt => apt.id === id);
  }

  getScrollPositionForTime(time: string): number {
    return this.calculateTopPosition(time);
  }
}