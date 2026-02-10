import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { UiTextService } from '../../core/services/ui-text';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './tables.html',
  styleUrl: './tables.scss'
})
export class Tables {
  private readonly uiTextService = inject(UiTextService);

  readonly texts = this.uiTextService.texts;

  readonly pageTitle = computed(() => this.texts().tablesTitle);
  readonly pageDescription = computed(() => this.texts().tablesDescription);

  readonly pageIcon = 'pi pi-table';
}