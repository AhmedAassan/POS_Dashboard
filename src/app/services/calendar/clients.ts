// services/clients.service.ts

import { Injectable, signal, inject } from '@angular/core';
import { Client } from '../../models/calendar/models.model';
import { LookupsHttpService } from './lookups-http.service';
import { mapCustomerDtoToClient, CreateCustomerApiRequest } from './lookups.api';
import { Observable, tap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private api = inject(LookupsHttpService);

  private clientsSignal = signal<Client[]>([]);
  readonly clients = this.clientsSignal.asReadonly();

  constructor() {
    this.api.getCustomers().subscribe({
      next: (list) => {
        const clients = (list ?? []).map(c => mapCustomerDtoToClient(c, 'KWD'));
        this.clientsSignal.set(clients);
      },
      error: (err) => {
        console.error('Failed to load customers lookups', err);
        this.clientsSignal.set([]);
      }
    });
  }

  getClientById(id: string): Client | undefined {
    return this.clients().find(c => c.id === id);
  }

  /**
   * Search clients by name, phone1, or phone2
   * Returns matching clients (case-insensitive)
   */
  searchClients(query: string): Client[] {
    if (!query || query.trim().length === 0) {
      return this.clients();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const stripped = normalizedQuery.replace(/\s/g, '');

    return this.clients().filter(client =>
      client.name.toLowerCase().includes(normalizedQuery) ||
      client.phone.replace(/\s/g, '').includes(stripped) ||
      (client.phone2 && client.phone2.replace(/\s/g, '').includes(stripped))
    );
  }

  /**
   * Create a customer via the API and add to local cache.
   * Returns Observable<Client> so the caller can react.
   */
    createCustomer(request: CreateCustomerApiRequest): Observable<Client> {
    return this.api.createCustomer(request).pipe(
      map(response => {
        const newClient: Client = {
          id: `client-${response.CustomerId}`,
          name: response.CustomerName,
          phone: response.CustomerPhone1,
          phone2: response.CustomerPhone2 || undefined,
          email: undefined,
          isVIP: false,
          isNewCustomer: true,
          hasAlert: (response.CustomerIsBlock ?? 0) === 1,    // ✅ NEW
          alertNote: response.CustomerBlockReason || undefined, // ✅ NEW
          totalBookings: 0,
          unpaidAmount: 0,
          currency: 'KWD'
        };
        this.clientsSignal.update(clients => [newClient, ...clients]);
        return newClient;
      })
    );
  }

  /**
   * @deprecated Use createCustomer() instead for API-backed creation
   */
  addClient(client: Omit<Client, 'id'>): Client {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`
    };
    this.clientsSignal.update(clients => [...clients, newClient]);
    return newClient;
  }
}