// services/calendar/appointment-categories.service.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { LookupsHttpService } from './lookups-http.service';
import {
  AppointmentCategory,
  mapAppointmentCategoryDto
} from './lookups.api';

@Injectable({ providedIn: 'root' })
export class AppointmentCategoriesService {
  private api = inject(LookupsHttpService);

  private categoriesSignal = signal<AppointmentCategory[]>([]);
  private selectedCategoryIdsSignal = signal<Set<number>>(new Set());

  readonly categories = this.categoriesSignal.asReadonly();
  readonly selectedCategoryIds = this.selectedCategoryIdsSignal.asReadonly();

  /** Only selected categories */
  readonly filteredCategories = computed(() => {
    const ids = this.selectedCategoryIds();
    return this.categories().filter(c => ids.has(c.id));
  });

  constructor() {
    this.api.getAppointmentCategories().subscribe({
      next: (list) => {
        const cats = (list ?? [])
          .filter(x => !x.Deleted)
          .map(mapAppointmentCategoryDto);

        this.categoriesSignal.set(cats);
        // Default: select all
        this.selectedCategoryIdsSignal.set(new Set(cats.map(c => c.id)));
      },
      error: (err) => {
        console.error('Failed to load appointment categories', err);
        this.categoriesSignal.set([]);
        this.selectedCategoryIdsSignal.set(new Set());
      }
    });
  }

  getCategoryById(id: number): AppointmentCategory | undefined {
    return this.categories().find(c => c.id === id);
  }

  isCategorySelected(id: number): boolean {
    return this.selectedCategoryIds().has(id);
  }

  toggleCategorySelection(id: number): void {
    const current = new Set(this.selectedCategoryIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedCategoryIdsSignal.set(current);
  }

  selectAllCategories(): void {
    this.selectedCategoryIdsSignal.set(
      new Set(this.categories().map(c => c.id))
    );
  }

  clearCategorySelection(): void {
    this.selectedCategoryIdsSignal.set(new Set());
  }

  setSelectedCategories(ids: number[]): void {
    this.selectedCategoryIdsSignal.set(new Set(ids));
  }
}