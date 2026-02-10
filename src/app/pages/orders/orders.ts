import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { UiTextService } from '../../core/services/ui-text';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders {
  private readonly uiTextService = inject(UiTextService);

  readonly texts = this.uiTextService.texts;

  readonly pageTitle = computed(() => this.texts().ordersTitle);
  readonly pageDescription = computed(() => this.texts().ordersDescription);

  readonly pageIcon = 'pi pi-list';
}