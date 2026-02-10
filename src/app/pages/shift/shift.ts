import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { UiTextService } from '../../core/services/ui-text';

@Component({
  selector: 'app-shift',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './shift.html',
  styleUrl: './shift.scss'
})
export class Shift {
  private readonly uiTextService = inject(UiTextService);

  readonly texts = this.uiTextService.texts;

  readonly pageTitle = computed(() => this.texts().shiftTitle);
  readonly pageDescription = computed(() => this.texts().shiftDescription);

  readonly pageIcon = 'pi pi-clock';
}