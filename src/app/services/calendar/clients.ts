// services/clients.service.ts

import { Injectable, signal } from '@angular/core';
import { Client } from '../../models/calendar/models.model';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly mockClients: Client[] = [
    {
      id: 'client-1',
      name: 'Lulu Sami',
      phone: '+965 9876 5432',
      email: 'lulu.sami@email.com',
      isVIP: true,
      totalBookings: 24,
      unpaidAmount: 50,
      currency: 'KWD'
    },
    {
      id: 'client-2',
      name: 'Fatima Al-Hassan',
      phone: '+965 5555 1234',
      email: 'fatima.h@email.com',
      isVIP: false,
      totalBookings: 8,
      unpaidAmount: 0,
      currency: 'KWD'
    },
    {
      id: 'client-3',
      name: 'Noor Khalil',
      phone: '+965 6666 7890',
      email: 'noor.k@email.com',
      isVIP: true,
      totalBookings: 45,
      unpaidAmount: 25,
      currency: 'KWD'
    },
    {
      id: 'client-4',
      name: 'Reem Abdullah',
      phone: '+965 7777 4321',
      email: 'reem.a@email.com',
      isVIP: false,
      totalBookings: 3,
      unpaidAmount: 0,
      currency: 'KWD'
    },
    {
      id: 'client-5',
      name: 'Dana Mahmoud',
      phone: '+965 8888 9999',
      email: 'dana.m@email.com',
      isVIP: false,
      totalBookings: 12,
      unpaidAmount: 15,
      currency: 'KWD'
    }
  ];

  private clientsSignal = signal<Client[]>(this.mockClients);
  readonly clients = this.clientsSignal.asReadonly();

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

  addClient(client: Omit<Client, 'id'>): Client {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`
    };
    this.clientsSignal.update(clients => [...clients, newClient]);
    return newClient;
  }
}