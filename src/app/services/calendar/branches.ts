import { Injectable, signal, inject } from '@angular/core';
import { Location } from '../../models/calendar/models.model';
import { LookupsHttpService } from './lookups-http.service';
import { mapBranchToLocation } from './lookups.api';

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private api = inject(LookupsHttpService);

  private branchesSignal = signal<Location[]>([]);
  readonly branches = this.branchesSignal.asReadonly();

  constructor() {
    this.api.getBranches().subscribe(list => {
      this.branchesSignal.set(list.map(mapBranchToLocation));
    });
  }
}