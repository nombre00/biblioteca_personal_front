import { Component, signal } from '@angular/core';

import { Sinopsis } from './tabs-dashboard/sinopsis/sinopsis';
import { Biografias } from './tabs-dashboard/biografias/biografias';
import { TipoTareaIa } from '../../../core/models/gestion-ia';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Sinopsis, Biografias],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  tabActiva = signal<TipoTareaIa>('sinopsis');

  seleccionarTab(tab: TipoTareaIa): void {
    this.tabActiva.set(tab);
  }
}