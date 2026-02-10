import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { UiTextService } from '../../core/services/ui-text';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings {
  private readonly uiTextService = inject(UiTextService);

  readonly texts = this.uiTextService.texts;

  readonly pageTitle = computed(() => this.texts().settingsTitle);
  readonly pageDescription = computed(() => this.texts().settingsDescription);

  readonly pageIcon = 'pi pi-cog';
}