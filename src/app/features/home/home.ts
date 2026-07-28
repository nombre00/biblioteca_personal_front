import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibroService } from '../libros/libro.service';
import { RecomendacionesService } from '../estadisticas/recomendaciones.service'; // ajustar path real
import { LibroResponseDTO } from '../../core/models/libro';
import { SugerenciaLibroDTO } from '../../core/models/recomendacion';
import { PortadaLibro } from '../../shared/components/portada-libro/portada-libro';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PortadaLibro],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private libroService = inject(LibroService);
  private recomendacionesService = inject(RecomendacionesService);

  cargando = signal(true);
  error = signal<string | null>(null);

  leyendo = signal<LibroResponseDTO[]>([]);
  ultimosLeidos = signal<LibroResponseDTO[]>([]);
  ultimosIngresados = signal<LibroResponseDTO[]>([]);

  sugerencias = signal<SugerenciaLibroDTO[]>([]);

  ngOnInit(): void {
    this.libroService.listarTodos().subscribe({
      next: (libros) => {
        this.leyendo.set(
          libros.filter((l) => l.estado === 'LEYENDO')
        );

        this.ultimosLeidos.set(
          libros
            .filter((l) => l.estado === 'LEIDO')
            .sort((a, b) => this.compararLeidos(a, b))
            .slice(0, 5)
        );

        this.ultimosIngresados.set(
          [...libros].sort((a, b) => b.id - a.id).slice(0, 5)
        );

        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la información del home.');
        this.cargando.set(false);
      },
    });

    this.recomendacionesService.obtenerPorAutorPendiente().subscribe({
      next: (sugerencias) => this.sugerencias.set(sugerencias),
      // Sección no crítica: si falla, simplemente queda vacía y no se muestra nada,
      // sin afectar el resto del home.
      error: () => this.sugerencias.set([]),
    });
  }

  // Ordena por fechaTermino si existe; si no, por anioLectura como respaldo.
  private compararLeidos(a: LibroResponseDTO, b: LibroResponseDTO): number {
    const valorA = a.fechaTermino ?? (a.anioLectura ? `${a.anioLectura}-01-01` : null);
    const valorB = b.fechaTermino ?? (b.anioLectura ? `${b.anioLectura}-01-01` : null);

    if (!valorA && !valorB) return 0;
    if (!valorA) return 1;
    if (!valorB) return -1;

    return valorB.localeCompare(valorA);
  }
}