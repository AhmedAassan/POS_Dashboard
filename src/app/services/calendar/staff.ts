// services/staff.service.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { Staff } from '../../models/calendar/models.model';
import { LookupsHttpService } from './lookups-http.service';
import { mapStaffDtoToStaff } from './lookups.api';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private api = inject(LookupsHttpService);

  // Signals for reactive state
  private staffListSignal = signal<Staff[]>([]);
  private selectedStaffIdsSignal = signal<Set<string>>(new Set());

  // Public readonly signals
  readonly staffList = this.staffListSignal.asReadonly();
  readonly selectedStaffIds = this.selectedStaffIdsSignal.asReadonly();

  // Computed signal for filtered staff
  readonly filteredStaff = computed(() => {
    const selectedIds = this.selectedStaffIds();
    return this.staffList().filter(s => selectedIds.has(s.id));
  });

  constructor() {
    this.api.getStaff().subscribe({
      next: (list) => {
        const staff = (list ?? [])
          .filter(x => x.Active)
          .map(mapStaffDtoToStaff);

        this.staffListSignal.set(staff);

        // Default behavior: select all staff (same as your mock version)
        this.selectedStaffIdsSignal.set(new Set(staff.map(s => s.id)));
      },
      error: (err) => {
        // If API fails, keep empty list (no UI design changes)
        console.error('Failed to load staff lookups', err);
        this.staffListSignal.set([]);
        this.selectedStaffIdsSignal.set(new Set());
      }
    });
  }

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