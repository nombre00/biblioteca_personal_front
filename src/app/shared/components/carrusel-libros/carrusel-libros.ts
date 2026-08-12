import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortadaLibro } from '../portada-libro/portada-libro';

// Forma normalizada mínima que necesita el carrusel — cada página
// consumidora mapea su propio DTO (LibroResponseDTO, SugerenciaLibroDTO,
// etc.) a esta forma antes de pasarla. El carrusel no conoce ningún DTO
// del dominio, solo esto.
export interface CarruselItem {
  id: number;
  portadaUrl?: string;
  titulo: string;
  subtitulo?: string; // ej. nombre del autor — opcional, se omite si no aplica
}

@Component({
  selector: 'app-carrusel-libros',
  imports: [RouterLink, PortadaLibro],
  templateUrl: './carrusel-libros.html',
})
export class CarruselLibros {
  items = input.required<CarruselItem[]>();
  itemsPorPagina = input<number>(5);
  titulo = input<string>('');
  // Clase de Tailwind para el encabezado — permite que cada página use su
  // propia jerarquía visual (home usa una, autor-detail/libro-detail otra)
  // sin bifurcar el componente.
  tituloClase = input<string>('text-grande font-semibold text-gray-800');

  paginaActual = signal(0);

  // Los items se agrupan en páginas de tamaño itemsPorPagina — cada
  // página se renderiza como un bloque de ancho completo dentro de un
  // track, y el desplazamiento entre páginas se hace moviendo el track
  // completo con transform (translateX + transition), lo que anima la
  // transición en vez de reemplazar el contenido de golpe.
  paginas = computed<CarruselItem[][]>(() => {
    const n = this.itemsPorPagina();
    const lista = this.items();
    const resultado: CarruselItem[][] = [];
    for (let i = 0; i < lista.length; i += n) {
      resultado.push(lista.slice(i, i + n));
    }
    return resultado.length > 0 ? resultado : [[]];
  });

  totalPaginas = computed(() => this.paginas().length);

  puedeAnterior = computed(() => this.paginaActual() > 0);
  puedeSiguiente = computed(() => this.paginaActual() < this.totalPaginas() - 1);

  constructor() {
    // Si la página cambia el arreglo completo de items (ej. al navegar
    // entre autores distintos reutilizando el mismo componente), volvemos
    // a la primera página en vez de quedar en una página que ya no existe.
    effect(() => {
      this.items();
      untracked(() => this.paginaActual.set(0));
    });
  }

  anterior(): void {
    if (this.puedeAnterior()) {
      this.paginaActual.update((p) => p - 1);
    }
  }

  siguiente(): void {
    if (this.puedeSiguiente()) {
      this.paginaActual.update((p) => p + 1);
    }
  }
}