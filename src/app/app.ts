import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from './core/services/theme';
import { DirectionService } from './core/services/direction';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly directionService = inject(DirectionService);
  private readonly authService = inject(AuthService);

  title = 'pos-dashboard';

  ngOnInit(): void {
    // Initialize theme and direction from localStorage on app startup
    this.themeService.initialize();
    this.directionService.initialize();
    this.authService.initialize();
  }
}