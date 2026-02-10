import { Injectable, signal, effect } from '@angular/core';

export type Direction = 'ltr' | 'rtl';
export type Language = 'en' | 'ar';

const DIRECTION_STORAGE_KEY = 'pos-direction';

@Injectable({
  providedIn: 'root'
})
export class DirectionService {
  private readonly directionSignal = signal<Direction>(this.getInitialDirection());

  readonly currentDirection = this.directionSignal.asReadonly();
  readonly isRtl = signal<boolean>(this.directionSignal() === 'rtl');
  readonly currentLanguage = signal<Language>(this.directionSignal() === 'rtl' ? 'ar' : 'en');

  constructor() {
    // Effect to apply direction changes to DOM
    effect(() => {
      const direction = this.directionSignal();
      this.applyDirectionToDOM(direction);
      this.isRtl.set(direction === 'rtl');
      this.currentLanguage.set(direction === 'rtl' ? 'ar' : 'en');
    });
  }

  /**
   * Initialize direction on app startup
   */
  initialize(): void {
    const savedDirection = this.getInitialDirection();
    this.directionSignal.set(savedDirection);
    this.applyDirectionToDOM(savedDirection);
  }

  /**
   * Get current direction
   */
  getDirection(): Direction {
    return this.directionSignal();
  }

  /**
   * Get current language based on direction
   */
  getLanguage(): Language {
    return this.currentLanguage();
  }

  /**
   * Set direction explicitly
   */
  setDirection(direction: Direction): void {
    this.directionSignal.set(direction);
    this.persistDirection(direction);
  }

  /**
   * Toggle between LTR and RTL
   */
  toggleDirection(): void {
    const newDirection = this.directionSignal() === 'ltr' ? 'rtl' : 'ltr';
    this.setDirection(newDirection);
  }

  /**
   * Get initial direction from localStorage
   */
  private getInitialDirection(): Direction {
    if (typeof window === 'undefined') {
      return 'ltr';
    }

    const savedDirection = localStorage.getItem(DIRECTION_STORAGE_KEY) as Direction | null;
    
    if (savedDirection && (savedDirection === 'ltr' || savedDirection === 'rtl')) {
      return savedDirection;
    }

    return 'ltr';
  }

  /**
   * Apply direction attribute to HTML element
   */
  private applyDirectionToDOM(direction: Direction): void {
    if (typeof document === 'undefined') {
      return;
    }

    const htmlElement = document.documentElement;
    htmlElement.setAttribute('dir', direction);
    htmlElement.setAttribute('lang', direction === 'rtl' ? 'ar' : 'en');
  }

  /**
   * Persist direction to localStorage
   */
  private persistDirection(direction: Direction): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DIRECTION_STORAGE_KEY, direction);
    }
  }
}