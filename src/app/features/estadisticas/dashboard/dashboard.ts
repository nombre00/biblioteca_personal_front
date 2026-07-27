import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EstadisticaService } from '../estadistica.service';
import { ConteoDTO, RitmoLecturaDTO } from '../../../core/models/estadistica';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private estadisticaService = inject(EstadisticaService);

  cargando = signal(true);
  error = signal<string | null>(null);

  porEstado = signal<ConteoDTO[]>([]);
  porGenero = signal<ConteoDTO[]>([]);
  porAnioLectura = signal<ConteoDTO[]>([]);
  ritmoLectura = signal<RitmoLecturaDTO | null>(null);

  ngOnInit(): void {
    this.estadisticaService.obtenerConteoPorEstado().subscribe({
      next: (data) => this.porEstado.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por estado.'),
    });

    this.estadisticaService.obtenerConteoPorGenero().subscribe({
      next: (data) => this.porGenero.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por género.'),
    });

    this.estadisticaService.obtenerConteoPorAnioLectura().subscribe({
      next: (data) => this.porAnioLectura.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por año.'),
    });

    this.estadisticaService.obtenerRitmoLectura().subscribe({
      next: (data) => {
        this.ritmoLectura.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el ritmo de lectura.');
        this.cargando.set(false);
      },
    });
  }

  // Ancho proporcional de la barra respecto al valor máximo de la lista (para las barras horizontales).
  anchoBarra(cantidad: number, lista: ConteoDTO[]): number {
    const maximo = Math.max(...lista.map((c) => c.cantidad), 1);
    return (cantidad / maximo) * 100;
  }
}