import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { UiTextService } from '../../core/services/ui-text';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss'
})
export class Transactions {
  private readonly uiTextService = inject(UiTextService);

  readonly texts = this.uiTextService.texts;

  readonly pageTitle = computed(() => this.texts().transactionsTitle);
  readonly pageDescription = computed(() => this.texts().transactionsDescription);

  readonly pageIcon = 'pi pi-credit-card';
}