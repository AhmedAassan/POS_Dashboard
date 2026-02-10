import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { UiTextService } from '../../core/services/ui-text';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private readonly uiTextService = inject(UiTextService);

  readonly texts = this.uiTextService.texts;

  readonly pageTitle = computed(() => this.texts().dashboardTitle);
  readonly pageDescription = computed(() => this.texts().dashboardDescription);

  readonly pageIcon = 'pi pi-th-large';
}