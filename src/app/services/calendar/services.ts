// services/services.service.ts

import { Injectable, signal, computed, inject } from '@angular/core';
import { ServiceItem } from '../../models/calendar/models.model';
import { LookupsHttpService } from './lookups-http.service';
import { mapServiceDtoToServiceItem } from './lookups.api';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private api = inject(LookupsHttpService);

  // NOTE: kept for backwards compatibility with your existing helper getServiceColor()
  // but with the API mapping we always provide colorHex anyway (stable-random).
  private readonly categoryColors: Record<string, string> = {
    'Hair': '#8B5CF6',
    'Spa': '#10B981',
    'Nails': '#EC4899',
    'Skin': '#F59E0B',
    'Beauty': '#6366F1',
    'Makeup': '#EF4444'
  };

  private servicesSignal = signal<ServiceItem[]>([]);

  // Selected service IDs for filtering (default: all selected)
  private selectedServiceIdsSignal = signal<Set<string>>(new Set());

  // Category filter state (default: all categories selected)
  private selectedCategoryIdsSignal = signal<Set<string>>(new Set());

  readonly services = this.servicesSignal.asReadonly();
  readonly selectedServiceIds = this.selectedServiceIdsSignal.asReadonly();
  readonly selectedCategoryIds = this.selectedCategoryIdsSignal.asReadonly();

  /** All distinct category names derived from current service list */
  readonly categories = computed(() => {
    return [...new Set(this.services().map(s => s.category))];
  });

  // Computed: filtered services based on service-level selection
  readonly selectedServices = computed(() => {
    const ids = this.selectedServiceIds();
    return this.services().filter(s => ids.has(s.id));
  });

  constructor() {
    this.api.getServices().subscribe({
      next: (list) => {
        const services = (list ?? [])
          .filter(x => x.ItemIsActive === 1)
          .map(mapServiceDtoToServiceItem);

        this.servicesSignal.set(services);

        // Default behavior: select all services + all categories
        this.selectedServiceIdsSignal.set(new Set(services.map(s => s.id)));
        this.selectedCategoryIdsSignal.set(new Set(services.map(s => s.category)));
      },
      error: (err) => {
        console.error('Failed to load services lookups', err);
        this.servicesSignal.set([]);
        this.selectedServiceIdsSignal.set(new Set());
        this.selectedCategoryIdsSignal.set(new Set());
      }
    });
  }

  getServiceById(id: string): ServiceItem | undefined {
    return this.services().find(s => s.id === id);
  }

  searchServices(query: string): ServiceItem[] {
    if (!query || query.trim().length === 0) {
      return this.services();
    }

    const normalizedQuery = query.toLowerCase().trim();
    return this.services().filter(service =>
      service.name.toLowerCase().includes(normalizedQuery) ||
      service.category.toLowerCase().includes(normalizedQuery)
    );
  }

  getServicesByCategory(category: string): ServiceItem[] {
    return this.services().filter(s => s.category === category);
  }

  getCategories(): string[] {
    return this.categories();
  }

  calculateDiscountedPrice(service: ServiceItem): number {
    if (service.discount <= 0) return service.price;
    return service.price * (1 - service.discount / 100);
  }

  // ── Service filter methods ──

  toggleServiceSelection(serviceId: string): void {
    const current = new Set(this.selectedServiceIds());
    if (current.has(serviceId)) {
      current.delete(serviceId);
    } else {
      current.add(serviceId);
    }
    this.selectedServiceIdsSignal.set(current);
  }

  setSelectedServices(serviceIds: string[]): void {
    this.selectedServiceIdsSignal.set(new Set(serviceIds));
  }

  selectAllServices(): void {
    this.selectedServiceIdsSignal.set(new Set(this.services().map(s => s.id)));
  }

  clearServiceSelection(): void {
    this.selectedServiceIdsSignal.set(new Set());
  }

  isServiceSelected(serviceId: string): boolean {
    return this.selectedServiceIds().has(serviceId);
  }

  // ── Category filter methods ──

  isCategorySelected(category: string): boolean {
    return this.selectedCategoryIds().has(category);
  }

  toggleCategorySelection(category: string): void {
    const current = new Set(this.selectedCategoryIds());
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }
    this.selectedCategoryIdsSignal.set(current);
  }

  setSelectedCategories(categories: string[]): void {
    this.selectedCategoryIdsSignal.set(new Set(categories));
  }

  selectAllCategories(): void {
    this.selectedCategoryIdsSignal.set(new Set(this.categories()));
  }

  clearCategorySelection(): void {
    this.selectedCategoryIdsSignal.set(new Set());
  }

  /**
   * Generate a deterministic color for a service if not defined
   * (with API mapping, colorHex should already be present)
   */
  getServiceColor(service: ServiceItem): string {
    if (service.colorHex) return service.colorHex;
    return this.categoryColors[service.category] || '#6B7280';
  }
}