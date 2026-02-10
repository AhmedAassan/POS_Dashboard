import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../services/auth';
import { UiTextService } from '../../core/services/ui-text';
import { DirectionService } from '../../core/services/direction';
import { ThemeService } from '../../core/services/theme';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    MessageModule,
    FloatLabelModule,
    TooltipModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly uiTextService = inject(UiTextService);
  private readonly directionService = inject(DirectionService);
  private readonly themeService = inject(ThemeService);

  // Form
  loginForm: FormGroup;

  // State signals
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // UI Text signals
  readonly texts = this.uiTextService.texts;
  readonly isRtl = this.directionService.isRtl;
  readonly isDarkMode = this.themeService.isDarkMode;

  // Computed texts
  readonly loginTitle = computed(() => this.texts().loginTitle);
  readonly loginSubtitle = computed(() => this.texts().loginSubtitle);
  readonly usernameLabel = computed(() => this.texts().username);
  readonly passwordLabel = computed(() => this.texts().password);
  readonly usernameRequiredError = computed(() => this.texts().usernameRequired);
  readonly passwordRequiredError = computed(() => this.texts().passwordRequired);
  readonly loginButtonText = computed(() =>
    this.isLoading() ? this.texts().loggingIn : this.texts().loginButton
  );
  readonly demoCredentials = computed(() => this.texts().demoCredentials);
  readonly darkModeTooltip = computed(() => this.texts().toggleDarkMode);
  readonly directionTooltip = computed(() => this.texts().toggleDirection);

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.navigateAfterLogin();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.handleLoginError(error);
      }
    });
  }

  /**
   * Fill demo credentials
   */
  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      username: 'emilys',
      password: 'emilyspass'
    });
  }

  /**
   * Toggle dark mode
   */
  onToggleDarkMode(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Toggle direction (RTL/LTR)
   */
  onToggleDirection(): void {
    this.directionService.toggleDirection();
  }

  /**
   * Check if a form field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Navigate to dashboard or return URL after successful login
   */
  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.router.navigateByUrl(returnUrl);
  }

  /**
   * Handle login error
   */
  private handleLoginError(error: any): void {
    if (error.status === 400 || error.status === 401) {
      this.errorMessage.set(this.texts().invalidCredentials);
    } else {
      this.errorMessage.set(this.texts().loginError);
    }
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}