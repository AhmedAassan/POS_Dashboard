// services/staff.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { Staff } from '../../models/calendar/models.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  // Mock staff data
  private readonly mockStaff: Staff[] = [
    {
      id: 'staff-1',
      name: 'Hala Ahmad',
      color: '#7C3AED',
      avatar: 'HA',
      isActive: true
    },
    {
      id: 'staff-2',
      name: 'Basma Saleh',
      color: '#059669',
      avatar: 'BS',
      isActive: true
    },
    {
      id: 'staff-3',
      name: 'Nicole Johnson',
      color: '#DC2626',
      avatar: 'NJ',
      isActive: true
    },
    {
      id: 'staff-4',
      name: 'Sara Khalid',
      color: '#2563EB',
      avatar: 'SK',
      isActive: true
    },
    {
      id: 'staff-5',
      name: 'Maya Farah',
      color: '#D97706',
      avatar: 'MF',
      isActive: true
    }
  ];

  // Signals for reactive state
  private staffListSignal = signal<Staff[]>(this.mockStaff);
  private selectedStaffIdsSignal = signal<Set<string>>(new Set(this.mockStaff.map(s => s.id)));

  // Public readonly signals
  readonly staffList = this.staffListSignal.asReadonly();
  readonly selectedStaffIds = this.selectedStaffIdsSignal.asReadonly();

  // Computed signal for filtered staff
  readonly filteredStaff = computed(() => {
    const selectedIds = this.selectedStaffIds();
    return this.staffList().filter(s => selectedIds.has(s.id));
  });

  getStaffById(id: string): Staff | undefined {
    return this.staffList().find(s => s.id === id);
  }

  toggleStaffSelection(staffId: string): void {
    const current = new Set(this.selectedStaffIds());
    if (current.has(staffId)) {
      current.delete(staffId);
    } else {
      current.add(staffId);
    }
    this.selectedStaffIdsSignal.set(current);
  }

  setSelectedStaff(staffIds: string[]): void {
    this.selectedStaffIdsSignal.set(new Set(staffIds));
  }

  selectAllStaff(): void {
    this.selectedStaffIdsSignal.set(new Set(this.staffList().map(s => s.id)));
  }

  clearStaffSelection(): void {
    this.selectedStaffIdsSignal.set(new Set());
  }
}