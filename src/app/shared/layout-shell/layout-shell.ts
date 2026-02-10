import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Header, Sidebar],
  templateUrl: './layout-shell.html',
  styleUrl: './layout-shell.scss'
})
export class LayoutShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  sidebarCollapsed = false;

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  onLogout(): void {
    this.authService.logout();
  }

  onSearchChange(query: string): void {
    // Navigate to POS with query params
    // This triggers the router, and POS component will detect the change
    this.router.navigate(['/pos'], { 
      queryParams: { search: query || null }, // null removes the param if empty
      queryParamsHandling: 'merge' // Keep other params if any
    });
  }
}
