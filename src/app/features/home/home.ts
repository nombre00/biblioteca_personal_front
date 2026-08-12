import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibroService } from '../libros/libro.service';
import { ResumenService } from '../libros/resumen.service';
import { RecomendacionesService } from '../estadisticas/recomendaciones.service'; // ajustar path real
import { LibroResponseDTO } from '../../core/models/libro';
import { SugerenciaLibroDTO } from '../../core/models/recomendacion';
import { ResumenResponse } from '../../core/models/resumen';
import { PortadaLibro } from '../../shared/components/portada-libro/portada-libro';
import { CarruselLibros, CarruselItem } from '../../shared/components/carrusel-libros/carrusel-libros';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PortadaLibro, CarruselLibros],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private libroService = inject(LibroService);
  private resumenService = inject(ResumenService);
  private recomendacionesService = inject(RecomendacionesService);

  cargando = signal(true);
  error = signal<string | null>(null);

  leyendo = signal<LibroResponseDTO[]>([]);
  ultimosLeidos = signal<LibroResponseDTO[]>([]);
  ultimosIngresados = signal<LibroResponseDTO[]>([]);

  sugerencias = signal<SugerenciaLibroDTO[]>([]);

  resumenesLeyendo = signal<Map<number, ResumenResponse>>(new Map());
  resumenesCargando = signal<Set<number>>(new Set());

  // Mapeos a la forma normalizada que consume CarruselLibros — puramente
  // de presentación, no cambia nada del lado del backend. "Últimos
  // leídos"/"Últimos ingresados" no muestran autor hoy, así que se deja
  // subtitulo sin definir para no alterar el diseño actual.
  sugerenciasCarrusel = computed<CarruselItem[]>(() =>
    this.sugerencias().map((s) => ({
      id: s.libroId,
      portadaUrl: s.urlPortada,
      titulo: s.titulo,
      subtitulo: s.autorNombre,
    }))
  );

  ultimosLeidosCarrusel = computed<CarruselItem[]>(() =>
    this.ultimosLeidos().map((l) => ({
      id: l.id,
      portadaUrl: l.portadaUrl,
      titulo: l.titulo,
    }))
  );

  ultimosIngresadosCarrusel = computed<CarruselItem[]>(() =>
    this.ultimosIngresados().map((l) => ({
      id: l.id,
      portadaUrl: l.portadaUrl,
      titulo: l.titulo,
    }))
  );

  ngOnInit(): void {
    this.libroService.listarTodos().subscribe({
      next: (libros) => {
        const leyendoActual = libros.filter((l) => l.estado === 'LEYENDO');
        this.leyendo.set(leyendoActual);

        // Antes se recortaba acá mismo con .slice(0, 5) porque no había
        // forma de ver más. Ahora el recorte de "cuántos se ven a la vez"
        // lo maneja el carrusel (itemsPorPagina) — acá se guarda la lista
        // completa para que las flechas "siguiente" tengan qué mostrar.
        this.ultimosLeidos.set(
          libros
            .filter((l) => l.estado === 'LEIDO')
            .sort((a, b) => this.compararLeidos(a, b))
        );

        this.ultimosIngresados.set(
          [...libros].sort((a, b) => b.id - a.id)
        );

        this.cargando.set(false);
        this.cargarResumenesLeyendo(leyendoActual);
      },
      error: () => {
        this.error.set('No se pudo cargar la información del home.');
        this.cargando.set(false);
      },
    });

    this.recomendacionesService.obtenerPorAutorPendiente().subscribe({
      next: (sugerencias) => this.sugerencias.set(sugerencias),
      error: () => this.sugerencias.set([]),
    });
  }

  private cargarResumenesLeyendo(libros: LibroResponseDTO[]): void {
    this.resumenesCargando.set(new Set(libros.map((l) => l.id)));

    libros.forEach((libro) => {
      const datos = {
        titulo_libro: libro.titulo,
        nombre_autor: libro.autor.nombre,
        genero: libro.generos[0]?.nombre,
      };

      this.resumenService.obtener(libro.id, datos).subscribe({
        next: (data) => {
          this.resumenesLeyendo.update((map) => new Map(map).set(libro.id, data));
          this.quitarDeCargando(libro.id);
        },
        error: () => {
          // Fallo aislado por libro, no afecta a los demás ni al resto del home
          this.quitarDeCargando(libro.id);
        },
      });
    });
  }

  private quitarDeCargando(libroId: number): void {
    this.resumenesCargando.update((set) => {
      const nuevo = new Set(set);
      nuevo.delete(libroId);
      return nuevo;
    });
  }

  resumenDe(libroId: number): ResumenResponse | undefined {
    return this.resumenesLeyendo().get(libroId);
  }

  estaCargandoResumen(libroId: number): boolean {
    return this.resumenesCargando().has(libroId);
  }

  private compararLeidos(a: LibroResponseDTO, b: LibroResponseDTO): number {
    const valorA = a.fechaTermino ?? (a.anioLectura ? `${a.anioLectura}-01-01` : null);
    const valorB = b.fechaTermino ?? (b.anioLectura ? `${b.anioLectura}-01-01` : null);

    if (!valorA && !valorB) return 0;
    if (!valorA) return 1;
    if (!valorB) return -1;

    return valorB.localeCompare(valorA);
  }
}