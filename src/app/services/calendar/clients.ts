// services/clients.service.ts

import { Injectable, signal, inject } from '@angular/core';
import { Client } from '../../models/calendar/models.model';
import { LookupsHttpService } from './lookups-http.service';
import { mapCustomerDtoToClient } from './lookups.api';

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
        // Currency: easiest for now is to keep KWD (you can later derive it from selected branch)
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
   * Search clients by name or phone number
   * Returns matching clients (case-insensitive)
   */
  searchClients(query: string): Client[] {
    if (!query || query.trim().length === 0) {
      return this.clients();
    }

    const normalizedQuery = query.toLowerCase().trim();
    return this.clients().filter(client =>
      client.name.toLowerCase().includes(normalizedQuery) ||
      client.phone.replace(/\s/g, '').includes(normalizedQuery.replace(/\s/g, ''))
    );
  }

  /**
   * Local-only add (kept for compatibility with your current UI).
   * With real API, you’ll probably replace this with POST later.
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