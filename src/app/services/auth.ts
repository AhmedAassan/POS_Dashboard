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
}

export interface LoginApiResponse {
  Success: boolean;
  Error?: string | null;
  Data?: {
    AccessToken: string;
    AccessTokenExpiresAtUtc: string;
    Username: string;
  } | null;
}

/**
 * Minimal user model for navbar usage
 */
export interface AuthUser {
  username: string;
}

// ============================================
// Constants
// ============================================

const AUTH_TOKEN_KEY = 'pos-auth-token';
const AUTH_USER_KEY = 'pos-auth-user';
const AUTH_EXPIRES_KEY = 'pos-auth-expires';

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

  // Auth is token-based (your API returns token + username)
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  // Navbar-friendly computed props
  readonly userFullName = computed(() => this.userSignal()?.username ?? '');
  readonly userInitial = computed(() => (this.userSignal()?.username?.charAt(0) ?? '').toUpperCase());
  readonly userAvatar = computed(() => null);

  /**
   * Initialize auth state from localStorage on app startup
   */
  initialize(): void {
    const token = this.loadTokenFromStorage();
    const user = this.loadUserFromStorage();

    if (token) this.tokenSignal.set(token);
    if (user) this.userSignal.set(user);
  }

  /**
   * Login with username and password
   * Backend: POST /api/account/Login
   * Response: { Success, Data: { AccessToken, AccessTokenExpiresAtUtc, Username } }
   */
  login(credentials: LoginRequest): Observable<LoginApiResponse> {
    return this.http
      .post<LoginApiResponse>(`${this.apiUrl}/account/Login`, {
        username: credentials.username,
        password: credentials.password
      })
      .pipe(
        tap((res) => {
          if (!res?.Success || !res?.Data?.AccessToken) {
            // normalize "failed login" into an error so UI shows error message
            throw new Error(res?.Error || 'Invalid username or password');
          }
          this.handleLoginSuccess(res);
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
   * Get current token (sync)
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Get current user (sync)
   */
  getUser(): AuthUser | null {
    return this.userSignal();
  }

  /**
   * Check if user is authenticated (sync)
   * Uses token + (optional) expiry time if saved
   */
  checkAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const exp = this.loadExpiresFromStorage();
    if (!exp) return true;

    return new Date(exp).getTime() > Date.now();
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(res: LoginApiResponse): void {
    const token = res.Data!.AccessToken;
    const expiresAtUtc = res.Data!.AccessTokenExpiresAtUtc;
    const username = res.Data!.Username;

    const user: AuthUser = { username };

    // Update signals
    this.tokenSignal.set(token);
    this.userSignal.set(user);

    // Persist to localStorage
    this.saveToStorage(AUTH_TOKEN_KEY, token);
    this.saveToStorage(AUTH_EXPIRES_KEY, expiresAtUtc);
    this.saveToStorage(AUTH_USER_KEY, JSON.stringify(user));
  }

  /**
   * Clear all auth state
   */
  private clearAuthState(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);

    this.removeFromStorage(AUTH_TOKEN_KEY);
    this.removeFromStorage(AUTH_EXPIRES_KEY);
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
   * Load expires from localStorage
   */
  private loadExpiresFromStorage(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(AUTH_EXPIRES_KEY);
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