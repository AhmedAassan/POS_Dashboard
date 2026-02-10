// services/appointments.service.ts - FULL REPLACEMENT (significant overlap logic added)

import { Injectable, signal, computed, inject } from '@angular/core';
import { Appointment, AppointmentView, CalendarConfig, TimeOption } from '../../models/calendar/models.model';
import { StaffService } from './staff';
import { ClientsService } from './clients';
import { ServicesService } from './services';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private staffService = inject(StaffService);
  private clientsService = inject(ClientsService);
  private servicesService = inject(ServicesService);

  // Calendar configuration - easily changeable
  readonly config: CalendarConfig = {
    startHour: 6,         // 6:00 AM
    endHour: 22,          // 10:00 PM
    slotDuration: 15,     // 15-minute slots for finer granularity
    pixelsPerMinute: 1.5  // Height calculation: 1.5px per minute
  };

  // Mock appointments data
  private readonly mockAppointments: Appointment[] = [
    {
      id: 'apt-1',
      clientId: 'client-1',
      serviceId: 'service-1',
      staffId: 'staff-2',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      isOnlineBooking: true,
      notes: 'Regular client - prefers organic products',
      status: 'scheduled'
    },
    {
      id: 'apt-2',
      clientId: 'client-2',
      serviceId: 'service-3',
      staffId: 'staff-1',
      date: new Date(),
      startTime: '10:30',
      endTime: '12:00',
      isOnlineBooking: false,
      status: 'scheduled'
    },
    {
      id: 'apt-3',
      clientId: 'client-3',
      serviceId: 'service-4',
      staffId: 'staff-3',
      date: new Date(),
      startTime: '14:00',
      endTime: '15:15',
      isOnlineBooking: true,
      status: 'scheduled'
    },
    {
      id: 'apt-4',
      clientId: 'client-4',
      serviceId: 'service-2',
      staffId: 'staff-2',
      date: new Date(),
      startTime: '09:30',
      endTime: '10:15',
      isOnlineBooking: false,
      status: 'scheduled'
    },
    {
      id: 'apt-5',
      clientId: 'client-5',
      serviceId: 'service-5',
      staffId: 'staff-4',
      date: new Date(),
      startTime: '09:30',
      endTime: '10:30',
      isOnlineBooking: true,
      status: 'scheduled'
    },
    // Add overlapping appointment for testing
    {
      id: 'apt-6',
      clientId: 'client-1',
      serviceId: 'service-6',
      staffId: 'staff-2',
      date: new Date(),
      startTime: '09:15',
      endTime: '09:30',
      isOnlineBooking: false,
      status: 'scheduled'
    }
  ];

  // Reactive state
  private appointmentsSignal = signal<Appointment[]>(this.mockAppointments);
  private selectedDateSignal = signal<Date>(new Date());

  readonly appointments = this.appointmentsSignal.asReadonly();
  readonly selectedDate = this.selectedDateSignal.asReadonly();

  /**
   * Generate time options for dropdowns based on config
   */
  generateTimeOptions(): TimeOption[] {
    const options: TimeOption[] = [];
    
    for (let hour = this.config.startHour; hour <= this.config.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += this.config.slotDuration) {
        // Skip if past end hour
        if (hour === this.config.endHour && minute > 0) break;
        
        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
        
        options.push({ value, label });
      }
    }
    
    return options;
  }

  /**
   * Get enriched appointments for a specific date with positioning and lane calculation
   * Filtered by selected services
   */
  readonly appointmentsForSelectedDate = computed(() => {
    const date = this.selectedDate();
    const appointments = this.appointments();
    const selectedServiceIds = this.servicesService.selectedServiceIds();
    
    // Filter appointments for the selected date and selected services
    const dateAppointments = appointments.filter(apt => 
      this.isSameDay(apt.date, date) && 
      apt.status !== 'cancelled' &&
      selectedServiceIds.has(apt.serviceId)
    );

    // Enrich with view data
    const enrichedAppointments = dateAppointments.map(apt => this.enrichAppointment(apt));

    // Calculate lane positions for overlapping appointments
    return this.calculateLanes(enrichedAppointments);
  });

  /**
   * Enrich appointment with resolved references and calculated positioning
   */
  private enrichAppointment(appointment: Appointment): AppointmentView {
    const client = this.clientsService.getClientById(appointment.clientId)!;
    const service = this.servicesService.getServiceById(appointment.serviceId)!;
    const staff = this.staffService.getStaffById(appointment.staffId)!;

    const topPosition = this.calculateTopPosition(appointment.startTime);
    const height = this.calculateHeight(appointment.startTime, appointment.endTime);
    const discountedPrice = this.servicesService.calculateDiscountedPrice(service);

    return {
      ...appointment,
      client,
      service,
      staff,
      topPosition,
      height,
      discountedPrice,
      laneIndex: 0,  // Will be calculated in calculateLanes
      laneCount: 1   // Will be calculated in calculateLanes
    };
  }

  /**
   * Calculate lane positions for overlapping appointments within each staff column
   * Uses a greedy algorithm to assign lanes, then propagates lane count to overlap groups
   */
  private calculateLanes(appointments: AppointmentView[]): AppointmentView[] {
    // Group appointments by staff
    const byStaff = new Map<string, AppointmentView[]>();
    
    for (const apt of appointments) {
      const staffApts = byStaff.get(apt.staffId) || [];
      staffApts.push(apt);
      byStaff.set(apt.staffId, staffApts);
    }

    const result: AppointmentView[] = [];

    // Process each staff's appointments
    for (const [staffId, staffApts] of byStaff) {
      // Sort by start time, then by end time
      staffApts.sort((a, b) => {
        const startDiff = this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
        if (startDiff !== 0) return startDiff;
        return this.timeToMinutes(a.endTime) - this.timeToMinutes(b.endTime);
      });

      // Greedy lane assignment
      // lanes[i] contains the end time of the last appointment in lane i
      const lanes: number[] = [];
      const laneAssignments = new Map<string, number>();

      for (const apt of staffApts) {
        const startMinutes = this.timeToMinutes(apt.startTime);
        
        // Find first lane where this appointment fits (no overlap)
        let assignedLane = -1;
        for (let i = 0; i < lanes.length; i++) {
          if (lanes[i] <= startMinutes) {
            assignedLane = i;
            break;
          }
        }

        // If no lane found, create a new one
        if (assignedLane === -1) {
          assignedLane = lanes.length;
          lanes.push(0);
        }

        // Update lane end time
        lanes[assignedLane] = this.timeToMinutes(apt.endTime);
        laneAssignments.set(apt.id, assignedLane);
      }

      // Now find overlap groups and propagate lane count
      // Build overlap graph: two appointments overlap if their time ranges intersect
      const overlapGroups = this.findOverlapGroups(staffApts);

      // For each group, find max lane index + 1 = lane count
      for (const group of overlapGroups) {
        let maxLane = 0;
        for (const apt of group) {
          maxLane = Math.max(maxLane, laneAssignments.get(apt.id) || 0);
        }
        const laneCount = maxLane + 1;

        // Update all appointments in this group
        for (const apt of group) {
          apt.laneIndex = laneAssignments.get(apt.id) || 0;
          apt.laneCount = laneCount;
        }
      }

      result.push(...staffApts);
    }

    return result;
  }

  /**
   * Find groups of overlapping appointments using Union-Find approach
   */
  private findOverlapGroups(appointments: AppointmentView[]): AppointmentView[][] {
    if (appointments.length === 0) return [];

    // Parent array for union-find
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

    // Check all pairs for overlap
    for (let i = 0; i < appointments.length; i++) {
      for (let j = i + 1; j < appointments.length; j++) {
        if (this.appointmentsOverlap(appointments[i], appointments[j])) {
          union(appointments[i].id, appointments[j].id);
        }
      }
    }

    // Group by root
    const groups = new Map<string, AppointmentView[]>();
    for (const apt of appointments) {
      const root = find(apt.id);
      const group = groups.get(root) || [];
      group.push(apt);
      groups.set(root, group);
    }

    return Array.from(groups.values());
  }

  /**
   * Check if two appointments overlap in time
   */
  private appointmentsOverlap(a: AppointmentView, b: AppointmentView): boolean {
    const aStart = this.timeToMinutes(a.startTime);
    const aEnd = this.timeToMinutes(a.endTime);
    const bStart = this.timeToMinutes(b.startTime);
    const bEnd = this.timeToMinutes(b.endTime);

    // Overlap: start1 < end2 AND end1 > start2
    return aStart < bEnd && aEnd > bStart;
  }

  calculateTopPosition(startTime: string): number {
    const [hours, minutes] = startTime.split(':').map(Number);
    const minutesFromDayStart = (hours - this.config.startHour) * 60 + minutes;
    return minutesFromDayStart * this.config.pixelsPerMinute;
  }

  calculateHeight(startTime: string, endTime: string): number {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const duration = endTotalMinutes - startTotalMinutes;
    
    return Math.max(duration * this.config.pixelsPerMinute, 30);
  }

  generateTimeSlots(): { time: string; label: string; isHour: boolean }[] {
    const slots: { time: string; label: string; isHour: boolean }[] = [];
    
    for (let hour = this.config.startHour; hour < this.config.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += this.config.slotDuration) {
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
    const totalMinutes = (this.config.endHour - this.config.startHour) * 60;
    return totalMinutes * this.config.pixelsPerMinute;
  }

  getSlotHeight(): number {
    return this.config.slotDuration * this.config.pixelsPerMinute;
  }

  setSelectedDate(date: Date): void {
    this.selectedDateSignal.set(date);
  }

  previousDay(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() - 1);
    this.selectedDateSignal.set(newDate);
  }

  nextDay(): void {
    const current = this.selectedDate();
    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() + 1);
    this.selectedDateSignal.set(newDate);
  }

  goToToday(): void {
    this.selectedDateSignal.set(new Date());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

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

  /**
   * Snap time to nearest increment based on config
   */
  snapToIncrement(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const snappedMinutes = Math.round(minutes / this.config.slotDuration) * this.config.slotDuration;
    const adjustedHours = hours + Math.floor(snappedMinutes / 60);
    const finalMinutes = snappedMinutes % 60;
    return `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  }

  createAppointment(data: Omit<Appointment, 'id' | 'status'>): Appointment {
    const newAppointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      status: 'scheduled'
    };

    this.appointmentsSignal.update(appointments => [...appointments, newAppointment]);
    return newAppointment;
  }

  updateAppointment(id: string, updates: Partial<Appointment>): void {
    this.appointmentsSignal.update(appointments =>
      appointments.map(apt => apt.id === id ? { ...apt, ...updates } : apt)
    );
  }

  deleteAppointment(id: string): void {
    this.appointmentsSignal.update(appointments =>
      appointments.filter(apt => apt.id !== id)
    );
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments().find(apt => apt.id === id);
  }

  /**
   * Get minutes position for scroll-to-time (e.g., 9 AM)
   */
  getScrollPositionForTime(time: string): number {
    return this.calculateTopPosition(time);
  }
}