import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// ============================================
// Types / Interfaces
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
  expiresInMins?: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

export interface LoginResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ============================================
// Constants
// ============================================

const AUTH_TOKEN_KEY = 'pos-auth-token';
const AUTH_USER_KEY = 'pos-auth-user';
const AUTH_REFRESH_TOKEN_KEY = 'pos-auth-refresh-token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiBaseUrl;

  // Signals for reactive state
  private readonly userSignal = signal<AuthUser | null>(this.loadUserFromStorage());
  private readonly tokenSignal = signal<string | null>(this.loadTokenFromStorage());

  // Public computed signals
  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());

  // Computed user display properties
  readonly userFullName = computed(() => {
    const user = this.userSignal();
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  });

  readonly userInitial = computed(() => {
    const user = this.userSignal();
    if (!user) return '';
    return user.firstName.charAt(0).toUpperCase();
  });

  readonly userAvatar = computed(() => {
    const user = this.userSignal();
    return user?.image || null;
  });

  /**
   * Initialize auth state from localStorage on app startup
   */
  initialize(): void {
    const token = this.loadTokenFromStorage();
    const user = this.loadUserFromStorage();

    if (token && user) {
      this.tokenSignal.set(token);
      this.userSignal.set(user);
    }
  }

  /**
   * Login with username and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, {
        username: credentials.username,
        password: credentials.password,
        expiresInMins: credentials.expiresInMins || 60
      })
      .pipe(
        tap((response) => {
          this.handleLoginSuccess(response);
        }),
        catchError((error) => {
          this.clearAuthState();
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout and clear all auth state
   */
  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  /**
   * Get current token (synchronous)
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Get current user (synchronous)
   */
  getUser(): AuthUser | null {
    return this.userSignal();
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  checkAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(response: LoginResponse): void {
    const { accessToken, refreshToken, ...user } = response;

    // Update signals
    this.tokenSignal.set(accessToken);
    this.userSignal.set(user);

    // Persist to localStorage
    this.saveToStorage(AUTH_TOKEN_KEY, accessToken);
    this.saveToStorage(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    this.saveToStorage(AUTH_USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear all auth state
   */
  private clearAuthState(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);

    this.removeFromStorage(AUTH_TOKEN_KEY);
    this.removeFromStorage(AUTH_REFRESH_TOKEN_KEY);
    this.removeFromStorage(AUTH_USER_KEY);
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;

    const userJson = localStorage.getItem(AUTH_USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      return null;
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  /**
   * Remove from localStorage
   */
  private removeFromStorage(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}