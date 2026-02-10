import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';

// ============================================
// Types / Interfaces
// ============================================

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: ProductReview[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: ProductMeta;
  images: string[];
  thumbnail: string;
}

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface ProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductsQueryParams {
  limit?: number;
  skip?: number;
  select?: string[];
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Empty response constant for error fallback
const EMPTY_PRODUCTS_RESPONSE: ProductsResponse = {
  products: [],
  total: 0,
  skip: 0,
  limit: 0
};

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/products`;

  /**
   * Get all products with pagination
   */
  getProducts(params?: ProductsQueryParams): Observable<ProductsResponse> {
    let httpParams = this.buildHttpParams(params);

    return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams }).pipe(
      catchError((error) => this.handleError<ProductsResponse>(error, EMPTY_PRODUCTS_RESPONSE))
    );
  }

  /**
   * Get single product by ID
   */
  getProductById(id: number): Observable<Product | null> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => this.handleError<Product | null>(error, null))
    );
  }

  /**
   * Search products by query
   */
  searchProducts(query: string, params?: ProductsQueryParams): Observable<ProductsResponse> {
    // Return empty results for empty queries
    if (!query || query.trim().length === 0) {
      return of(EMPTY_PRODUCTS_RESPONSE);
    }

    let httpParams = this.buildHttpParams(params).set('q', query.trim());

    return this.http.get<ProductsResponse>(`${this.apiUrl}/search`, { params: httpParams }).pipe(
      catchError((error) => this.handleError<ProductsResponse>(error, EMPTY_PRODUCTS_RESPONSE))
    );
  }

  /**
   * Get products by category
   */
  getProductsByCategory(category: string, params?: ProductsQueryParams): Observable<ProductsResponse> {
    // Return empty results for empty category
    if (!category || category.trim().length === 0) {
      return this.getProducts(params);
    }

    let httpParams = this.buildHttpParams(params);

    return this.http.get<ProductsResponse>(
      `${this.apiUrl}/category/${encodeURIComponent(category)}`, 
      { params: httpParams }
    ).pipe(
      catchError((error) => this.handleError<ProductsResponse>(error, EMPTY_PRODUCTS_RESPONSE))
    );
  }

  /**
   * Calculate discounted price
   */
  calculateDiscountedPrice(product: Product): number {
    if (!product || product.discountPercentage <= 0) {
      return product?.price ?? 0;
    }
    const discount = product.price * (product.discountPercentage / 100);
    return Math.round((product.price - discount) * 100) / 100;
  }

  /**
   * Check if products response is empty
   */
  isEmptyResponse(response: ProductsResponse): boolean {
    return !response || !response.products || response.products.length === 0;
  }

  /**
   * Build HTTP params from query params object
   */
  private buildHttpParams(params?: ProductsQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    if (params.limit !== undefined && params.limit > 0) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.skip !== undefined && params.skip >= 0) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.order) {
      httpParams = httpParams.set('order', params.order);
    }
    if (params.select?.length) {
      httpParams = httpParams.set('select', params.select.join(','));
    }

    return httpParams;
  }

  /**
   * Handle HTTP errors gracefully
   */
  private handleError<T>(error: HttpErrorResponse, fallback: T): Observable<T> {
    // Log error for debugging (can be removed in production or sent to monitoring service)
    if (error.status === 0) {
      // Network error
      console.error('Network error occurred:', error.message);
    } else if (error.status === 404) {
      // Resource not found - return fallback silently
      console.warn('Resource not found:', error.url);
    } else {
      // Server error
      console.error(`Server error ${error.status}:`, error.message);
    }

    // Return fallback value instead of throwing
    return of(fallback);
  }
}