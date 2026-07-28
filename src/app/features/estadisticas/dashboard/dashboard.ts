import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EstadisticaService } from '../estadistica.service';
import { GeneroService } from '../../libros/genero.service';
import { ConteoDTO, ConteoDobleDTO, RitmoLecturaDTO } from '../../../core/models/estadistica';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private estadisticaService = inject(EstadisticaService);
  private generoService = inject(GeneroService);

  // --- Estado general de carga de la página ---
  cargando = signal(true);
  error = signal<string | null>(null);

  // --- Ritmo de lectura (los 3 números destacados arriba del dashboard) ---
  ritmoLectura = signal<RitmoLecturaDTO | null>(null);

  // --- Por estado (sin filtro de año, no tiene selector) ---
  porEstado = signal<ConteoDTO[]>([]);

  // --- Por año de lectura (además de mostrarse sola, alimenta los <select> de año de las demás secciones) ---
  porAnioLectura = signal<ConteoDTO[]>([]);

  // --- Por género ---
  porGenero = signal<ConteoDTO[]>([]);
  anioGeneroSeleccionado = signal<number | null>(null); // null = "Todos"

  // Mapa nombre de género -> iconoSlug, cargado una sola vez desde /api/generos.
  // Se resuelve por separado de porGenero() porque ConteoDTO solo trae { etiqueta, cantidad },
  // sin el iconoSlug (EstadisticaService no se mete con datos de presentación).
  iconosPorGenero = signal<Map<string, string | undefined>>(new Map());

  // --- Por autor ---
  porAutor = signal<ConteoDobleDTO[]>([]);
  anioAutorSeleccionado = signal<number | null>(null); // null = "Todos"

  
  // Máximo de la lista de autores, usado para calcular el ancho de las barras.
  // Se recalcula solo cuando porAutor() cambia, gracias a computed().
  // Se usa cantidadTotal si existe (vista "Todos"), o cantidadLeidos si está filtrado por año (cantidadTotal es null).
  maximoAutor = computed(() => {
    const lista = this.porAutor();
    return Math.max(...lista.map((c) => c.cantidadTotal ?? c.cantidadLeidos), 1);
  });

  // --- Por país (misma lógica que por autor) ---
  porPais = signal<ConteoDobleDTO[]>([]);
  anioPaisSeleccionado = signal<number | null>(null); // null = "Todos"

  maximoPais = computed(() => {
    const lista = this.porPais();
    return Math.max(...lista.map((c) => c.cantidadTotal ?? c.cantidadLeidos), 1);
  });


  // ==========================================================
  // Carga inicial: pide todo en paralelo al entrar al dashboard
  // ==========================================================
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

    // Carga del mapa de íconos por género (una sola vez, no depende del año seleccionado).
    // Si falla, no rompe el dashboard: simplemente no se muestran íconos.
    this.generoService.listarTodos().subscribe({
      next: (generos) => {
        const mapa = new Map<string, string | undefined>();
        for (const g of generos) {
          mapa.set(g.nombre, g.iconoSlug);
        }
        this.iconosPorGenero.set(mapa);
      },
      error: () => this.iconosPorGenero.set(new Map()),
    });

    // El ritmo de lectura va al final porque es el que apaga "cargando":
    // se asume que si esta petición ya volvió, las demás (más livianas) también.
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


  // ==========================================================
  // Helpers de ancho de barra
  // ==========================================================

  // Para ConteoDTO (un solo número): usado en "por estado" y "por género".
  // Calcula qué porcentaje del máximo de la lista representa esta cantidad.
  anchoBarra(cantidad: number, lista: ConteoDTO[]): number {
    const maximo = Math.max(...lista.map((c) => c.cantidad), 1);
    return (cantidad / maximo) * 100;
  }

  // Para ConteoDobleDTO (dos números): usado en "por autor" y "por país".
  // Devuelve dos anchos porque la barra es bicolor (total de fondo, leídos superpuesta).
  // Si cantidadTotal es null (hay año filtrado), 'total' viene null y el template
  // debe dibujar una barra simple usando solo 'leidos'.
  anchoBarraDoble(item: ConteoDobleDTO, maximo: number): { total: number | null; leidos: number } {
    return {
      total: item.cantidadTotal !== null ? (item.cantidadTotal / maximo) * 100 : null,
      leidos: (item.cantidadLeidos / maximo) * 100,
    };
  }

  // Busca el iconoSlug de un género por nombre (etiqueta de ConteoDTO).
  // Devuelve undefined si el género no tiene ícono asignado o no se encontró.
  iconoGenero(nombreGenero: string): string | undefined {
    return this.iconosPorGenero().get(nombreGenero);
  }


  // ==========================================================
  // Cambios de año por sección (cada una con su propio selector,
  // independientes entre sí)
  // ==========================================================

  cambiarAnioGenero(valor: string): void {
    const anio = valor === 'todos' ? undefined : Number(valor);
    this.anioGeneroSeleccionado.set(anio ?? null);

    this.estadisticaService.obtenerConteoPorGenero(anio).subscribe({
      next: (data) => this.porGenero.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por género.'),
    });
  }

  cambiarAnioAutor(valor: string): void {
    const anio = valor === 'todos' ? undefined : Number(valor);
    this.anioAutorSeleccionado.set(anio ?? null);

    this.estadisticaService.obtenerConteoPorAutor(anio).subscribe({
      next: (data) => this.porAutor.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por autor.'),
    });
  }

  cambiarAnioPais(valor: string): void {
    const anio = valor === 'todos' ? undefined : Number(valor);
    this.anioPaisSeleccionado.set(anio ?? null);

    this.estadisticaService.obtenerConteoPorPais(anio).subscribe({
      next: (data) => this.porPais.set(data),
      error: () => this.error.set('No se pudo cargar el conteo por país.'),
    });
  }
}