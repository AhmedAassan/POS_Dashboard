// services/services.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { ServiceItem } from '../../models/calendar/models.model';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  // Predefined service colors by category
  private readonly categoryColors: Record<string, string> = {
    'Hair': '#8B5CF6',
    'Spa': '#10B981',
    'Nails': '#EC4899',
    'Skin': '#F59E0B',
    'Beauty': '#6366F1',
    'Makeup': '#EF4444'
  };

  private readonly mockServices: ServiceItem[] = [
    {
      id: 'service-1',
      name: 'Hair Coloring',
      category: 'Hair',
      duration: 60,
      price: 25,
      discount: 15,
      colorHex: '#8B5CF6',
      currency: 'KWD'
    },
    {
      id: 'service-2',
      name: 'Haircut & Styling',
      category: 'Hair',
      duration: 45,
      price: 15,
      discount: 0,
      colorHex: '#7C3AED',
      currency: 'KWD'
    },
    {
      id: 'service-3',
      name: 'Full Body Massage',
      category: 'Spa',
      duration: 90,
      price: 45,
      discount: 10,
      colorHex: '#10B981',
      currency: 'KWD'
    },
    {
      id: 'service-4',
      name: 'Manicure & Pedicure',
      category: 'Nails',
      duration: 75,
      price: 20,
      discount: 0,
      colorHex: '#EC4899',
      currency: 'KWD'
    },
    {
      id: 'service-5',
      name: 'Facial Treatment',
      category: 'Skin',
      duration: 60,
      price: 35,
      discount: 20,
      colorHex: '#F59E0B',
      currency: 'KWD'
    },
    {
      id: 'service-6',
      name: 'Eyebrow Threading',
      category: 'Beauty',
      duration: 15,
      price: 5,
      discount: 0,
      colorHex: '#6366F1',
      currency: 'KWD'
    },
    {
      id: 'service-7',
      name: 'Bridal Makeup',
      category: 'Makeup',
      duration: 120,
      price: 80,
      discount: 5,
      colorHex: '#EF4444',
      currency: 'KWD'
    },
    {
      id: 'service-8',
      name: 'Deep Conditioning',
      category: 'Hair',
      duration: 30,
      price: 18,
      discount: 0,
      colorHex: '#A78BFA',
      currency: 'KWD'
    }
  ];

  private servicesSignal = signal<ServiceItem[]>(this.mockServices);

  // Selected service IDs for filtering (default: all selected)
  private selectedServiceIdsSignal = signal<Set<string>>(
    new Set(this.mockServices.map(s => s.id))
  );

  // ── Category filter state ──
  // Initialised with all distinct categories from mock data
  private selectedCategoryIdsSignal = signal<Set<string>>(
    new Set(this.mockServices.map(s => s.category))
  );

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
   */
  getServiceColor(service: ServiceItem): string {
    if (service.colorHex) return service.colorHex;
    return this.categoryColors[service.category] || '#6B7280';
  }
}