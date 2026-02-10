import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ThemeService } from '../../core/services/theme';
import { DirectionService } from '../../core/services/direction';
import { UiTextService } from '../../core/services/ui-text';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  private readonly themeService = inject(ThemeService);
  private readonly directionService = inject(DirectionService);
  private readonly uiTextService = inject(UiTextService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() sidebarCollapsed = false;
  @Output() logoutClick = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();

  searchQuery = '';

  // Expose reactive signals for template
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly isRtl = this.directionService.isRtl;
  readonly texts = this.uiTextService.texts;

  // User data from auth service
  readonly userName = this.authService.userFullName;
  readonly userInitial = this.authService.userInitial;
  readonly userAvatar = this.authService.userAvatar;
  readonly user = this.authService.user;

  // Computed values for template
  readonly companyName = computed(() => this.texts().companyName);
  readonly searchPlaceholder = computed(() => this.texts().searchPlaceholder);
  readonly darkModeTooltip = computed(() => this.texts().toggleDarkMode);
  readonly directionTooltip = computed(() => this.texts().toggleDirection);
  readonly logoutTooltip = computed(() => this.texts().logout);

  onDarkModeToggle(): void {
    this.themeService.toggleTheme();
  }

  onRtlToggle(): void {
    this.directionService.toggleDirection();
  }

  onLogout(): void {
    this.logoutClick.emit();
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.searchChange.emit(this.searchQuery.trim());
      // Navigate to POS page with search query if not already there
      this.router.navigate(['/pos'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }

  onSearchInput(): void {
    this.searchChange.emit(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchChange.emit('');
  }
}