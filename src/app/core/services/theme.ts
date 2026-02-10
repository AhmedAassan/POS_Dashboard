import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'pos-theme';
const DARK_MODE_CLASS = 'app-dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeSignal = signal<ThemeMode>(this.getInitialTheme());

  readonly isDarkMode = signal<boolean>(this.themeSignal() === 'dark');

  constructor() {
    // Effect to apply theme changes to DOM
    effect(() => {
      const theme = this.themeSignal();
      this.applyThemeToDOM(theme);
      this.isDarkMode.set(theme === 'dark');
    });
  }

  /**
   * Initialize theme on app startup
   */
  initialize(): void {
    const savedTheme = this.getInitialTheme();
    this.themeSignal.set(savedTheme);
    this.applyThemeToDOM(savedTheme);
  }

  /**
   * Get current theme
   */
  getTheme(): ThemeMode {
    return this.themeSignal();
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: ThemeMode): void {
    this.themeSignal.set(theme);
    this.persistTheme(theme);
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    const newTheme = this.themeSignal() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Apply theme class to HTML element
   */
  private applyThemeToDOM(theme: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
      htmlElement.classList.add(DARK_MODE_CLASS);
    } else {
      htmlElement.classList.remove(DARK_MODE_CLASS);
    }
  }

  /**
   * Persist theme to localStorage
   */
  private persistTheme(theme: ThemeMode): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }
}