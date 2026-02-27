import { Injectable, signal, computed, inject } from '@angular/core';
import { ServiceItem } from '../../models/calendar/models.model';
import { LookupsHttpService } from './lookups-http.service';
import { mapServiceDtoToServiceItem } from './lookups.api';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private api = inject(LookupsHttpService);

  private readonly categoryColors: Record<string, string> = {
    'Hair': '#8B5CF6',
    'Spa': '#10B981',
    'Nails': '#EC4899',
    'Skin': '#F59E0B',
    'Beauty': '#6366F1',
    'Makeup': '#EF4444'
  };

  private servicesSignal = signal<ServiceItem[]>([]);
  private selectedServiceIdsSignal = signal<Set<string>>(new Set());

  // ❌ REMOVED: selectedCategoryIdsSignal
  // ❌ REMOVED: selectedCategoryIds
  // ❌ REMOVED: categories computed
  // ❌ REMOVED: isCategorySelected
  // ❌ REMOVED: toggleCategorySelection
  // ❌ REMOVED: setSelectedCategories
  // ❌ REMOVED: selectAllCategories
  // ❌ REMOVED: clearCategorySelection

  readonly services = this.servicesSignal.asReadonly();
  readonly selectedServiceIds = this.selectedServiceIdsSignal.asReadonly();

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
        this.selectedServiceIdsSignal.set(new Set(services.map(s => s.id)));
      },
      error: (err) => {
        console.error('Failed to load services lookups', err);
        this.servicesSignal.set([]);
        this.selectedServiceIdsSignal.set(new Set());
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

  calculateDiscountedPrice(service: ServiceItem): number {
    if (service.discount <= 0) return service.price;
    return service.price * (1 - service.discount / 100);
  }

  // ── Service filter methods (kept as-is) ──

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

  getServiceColor(service: ServiceItem): string {
    if (service.colorHex) return service.colorHex;
    return this.categoryColors[service.category] || '#6B7280';
  }
}