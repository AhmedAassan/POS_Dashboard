import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// ============================================
// Types / Interfaces
// ============================================

export interface Category {
  slug: string;
  name: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/products`;

  // Cache categories in a signal
  private readonly categoriesSignal = signal<Category[]>([]);
  readonly categories = this.categoriesSignal.asReadonly();

  /**
   * Get category list (slugs only)
   */
  getCategoryList(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/category-list`);
  }

  /**
   * Get categories with full details
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      tap(categories => this.categoriesSignal.set(categories))
    );
  }

  /**
   * Get category name by slug
   */
  getCategoryName(slug: string): string {
    const category = this.categoriesSignal().find(c => c.slug === slug);
    return category?.name || slug;
  }
}