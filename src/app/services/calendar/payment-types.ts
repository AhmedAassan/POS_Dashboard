// services/calendar/payment-types.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { LookupsHttpService } from './lookups-http.service';
import { PaymentType } from '../../models/calendar/models.model';

export interface PaymentMethodOption {
  type: PaymentType;  // number id
  label: string;      // Name1
  icon: string;       // material icon name
}

@Injectable({ providedIn: 'root' })
export class PaymentTypesService {
  private api = inject(LookupsHttpService);

  private methodsSignal = signal<PaymentMethodOption[]>([]);
  readonly methods = this.methodsSignal.asReadonly();

  constructor() {
    this.api.getPaymentTypes().subscribe({
      next: (list) => {
        const methods = (list ?? []).map(x => ({
          type: x.Id,
          label: x.Name1,
          icon: iconForPaymentName(x.Name1)
        }));

        this.methodsSignal.set(methods);
      },
      error: (err) => {
        console.error('Failed to load payment types', err);
        this.methodsSignal.set([]);
      }
    });
  }

  /** helper: get label by id for displaying in details/confirm */
  labelById(id: number | undefined): string {
    if (!id) return '';
    return this.methodsSignal().find(m => m.type === id)?.label ?? `#${id}`;
  }
}

function iconForPaymentName(name: string | undefined): string {
  const n = (name ?? '').toLowerCase();

  if (n.includes('cash')) return 'payments';
  if (n.includes('k-net') || n.includes('knet')) return 'account_balance';
  if (n.includes('link')) return 'link';
  if (n.includes('visa') || n.includes('master') || n.includes('card')) return 'credit_card';
  if (n.includes('online')) return 'language';
  if (n.includes('advance') || n.includes('deposit')) return 'savings';
  if (n.includes('loyalty')) return 'card_giftcard';

  return 'credit_card';
}