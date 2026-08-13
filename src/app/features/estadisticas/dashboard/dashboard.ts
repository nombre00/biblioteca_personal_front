import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EstadisticaService } from '../estadistica.service';
import { ConteoDTO, ConteoDobleDTO, RitmoLecturaDTO } from '../../../core/models/estadistica';
import { EstadisticaPorAnio } from './tabs-dashboard/estadistica-por-anio/estadistica-por-anio';
import { EstadisticaPorGenero } from './tabs-dashboard/estadistica-por-genero/estadistica-por-genero';
import { EstadisticaPorAutor } from './tabs-dashboard/estadistica-por-autor/estadistica-por-autor';
import { EstadisticaPorPais } from './tabs-dashboard/estadistica-por-pais/estadistica-por-pais';

type TabEstadistica = 'anio' | 'genero' | 'autor' | 'pais';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, EstadisticaPorAnio, EstadisticaPorGenero, EstadisticaPorAutor, EstadisticaPorPais],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private estadisticaService = inject(EstadisticaService);

  cargando = signal(true);
  error = signal<string | null>(null);

  tabActiva = signal<TabEstadistica>('anio');

  ritmoLectura = signal<RitmoLecturaDTO | null>(null);
  porEstado = signal<ConteoDTO[]>([]);
  porAnioLectura = signal<ConteoDTO[]>([]);
  porGenero = signal<ConteoDTO[]>([]);
  porAutor = signal<ConteoDobleDTO[]>([]);
  porPais = signal<ConteoDobleDTO[]>([]);

  ngOnInit(): void {
    this.estadisticaService.obtenerConteoPorEstado().subscribe({
      next: (data) => this.porEstado.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por estado.'),
    });

    this.estadisticaService.obtenerConteoPorAnioLectura().subscribe({
      next: (data) => this.porAnioLectura.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por año.'),
    });

    this.estadisticaService.obtenerConteoPorGenero().subscribe({
      next: (data) => this.porGenero.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por género.'),
    });

    this.estadisticaService.obtenerConteoPorAutor().subscribe({
      next: (data) => this.porAutor.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por autor.'),
    });

    this.estadisticaService.obtenerConteoPorPais().subscribe({
      next: (data) => this.porPais.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por país.'),
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

  cambiarTab(tab: TabEstadistica): void {
    this.tabActiva.set(tab);
  }

  cambiarAnioGenero(valor: string): void {
    const anio = valor === 'todos' ? undefined : Number(valor);
    this.estadisticaService.obtenerConteoPorGenero(anio).subscribe({
      next: (data) => this.porGenero.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por género.'),
    });
  }

  cambiarAnioAutor(valor: string): void {
    const anio = valor === 'todos' ? undefined : Number(valor);
    this.estadisticaService.obtenerConteoPorAutor(anio).subscribe({
      next: (data) => this.porAutor.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por autor.'),
    });
  }

  cambiarAnioPais(valor: string): void {
    const anio = valor === 'todos' ? undefined : Number(valor);
    this.estadisticaService.obtenerConteoPorPais(anio).subscribe({
      next: (data) => this.porPais.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por país.'),
    });
  }
}