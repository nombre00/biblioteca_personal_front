import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

import { BusquedaLibrosService } from '../busqueda-libros.service';
import { PortadaLibro } from '../../../shared/components/portada-libro/portada-libro';

import {
  LibroExternoResponse,
  ResolverLibroRequest,
  ResolverLibroResponse,
} from '../../../core/models/busqueda-externa';

// Los "pasos" del wizard. A partir de esta versión, el wizard solo cubre
// hasta tener un autor ya decidido (existente o nuevo, nunca "dudoso") —
// la revisión de datos del libro/autor y la confirmación de importación
// viven en la página /libros/buscar/importar (ver ConfirmarImportar).
//
// 'busqueda'              -> input de query + lista de candidatos.
// 'seleccion-autor'       -> solo si el candidato elegido trae más de un
//                            autor; el usuario elige cuál usar antes de
//                            poder resolver (el backend espera un único
//                            autor_nombre).
// 'confirmacion-autor'    -> solo si /resolver devolvió autor en banda
//                            "dudosa" (requiere_confirmacion): el usuario
//                            decide si es el mismo autor existente o uno
//                            distinto. Una vez decidido, se navega a
//                            /libros/buscar/importar.
type Paso = 'busqueda' | 'seleccion-autor' | 'confirmacion-autor';

@Component({
  selector: 'app-buscar',
  imports: [PortadaLibro],
  templateUrl: './buscar.html',
  styleUrl: './buscar.scss',
})
export class Buscar {
  private busquedaLibrosService = inject(BusquedaLibrosService);
  private router = inject(Router);

  // Tamaño de página fijo, tanto para max_results de Google Books como
  // para calcular start_index y el total de páginas.
  readonly resultadosPorPagina = 40;

  paso = signal<Paso>('busqueda');

  // --- Paso 1: búsqueda ---
  // El input de texto es local (lo que el usuario está tipeando, todavía
  // no buscado). Se inicializa con la última query buscada para que, al
  // volver desde /libros/buscar/importar, el campo no aparezca vacío.
  queryInput = signal(this.busquedaLibrosService.query());
  buscando = signal(false);
  errorBusqueda = signal<string | null>(null);

  // Resultados, página actual y total de items viven en el service (no
  // acá) para sobrevivir la ida y vuelta a /libros/buscar/importar.
  resultados = this.busquedaLibrosService.resultados;
  totalItems = this.busquedaLibrosService.totalItems;
  paginaActual = this.busquedaLibrosService.paginaActual;
  yaSeBusco = this.busquedaLibrosService.busquedaRealizada;

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.resultadosPorPagina))
  );
  puedeIrAnterior = computed(() => this.paginaActual() > 1);
  puedeIrSiguiente = computed(() => this.paginaActual() < this.totalPaginas());

  // --- Selección de candidato y autor ---
  candidatoSeleccionado = signal<LibroExternoResponse | null>(null);
  autorElegido = signal<string>(''); // nombre del autor elegido, para /resolver

  // --- Paso 2: resolución (autor / géneros) ---
  resolviendo = signal(false);
  errorResolucion = signal<string | null>(null);
  resolucion = signal<ResolverLibroResponse | null>(null);

  puedeBuscar = computed(() => this.queryInput().trim().length > 0 && !this.buscando());

  // ==========================================
  // Paso 1: búsqueda
  // ==========================================

  buscar(): void {
    const query = this.queryInput().trim();
    if (!query) return;

    // Búsqueda nueva (no "cargar más"): siempre arranca en la página 1,
    // aunque la búsqueda anterior haya quedado en otra página.
    this.ejecutarBusqueda(query, 1);
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas() || pagina === this.paginaActual()) return;

    const query = this.busquedaLibrosService.query();
    if (!query) return;

    this.ejecutarBusqueda(query, pagina);
  }

  irAPrimeraPagina(): void {
    this.irAPagina(1);
  }

  irAPaginaAnterior(): void {
    this.irAPagina(this.paginaActual() - 1);
  }

  irASiguientePagina(): void {
    this.irAPagina(this.paginaActual() + 1);
  }

  irAUltimaPagina(): void {
    this.irAPagina(this.totalPaginas());
  }

  private ejecutarBusqueda(query: string, pagina: number): void {
    this.errorBusqueda.set(null);
    this.buscando.set(true);

    const startIndex = (pagina - 1) * this.resultadosPorPagina;

    this.busquedaLibrosService
      .buscar({ query, max_results: this.resultadosPorPagina, start_index: startIndex })
      .subscribe({
        next: (respuesta) => {
          this.busquedaLibrosService.guardarResultadosBusqueda(query, pagina, respuesta);
          this.buscando.set(false);
        },
        error: () => {
          this.errorBusqueda.set('No se pudo completar la búsqueda. Intenta de nuevo.');
          this.buscando.set(false);
        },
      });
  }

  // ==========================================
  // Selección de candidato
  // ==========================================

  elegirCandidato(libro: LibroExternoResponse): void {
    this.candidatoSeleccionado.set(libro);
    this.errorResolucion.set(null);

    if (libro.autores.length > 1) {
      // Varios autores: hay que preguntar antes de poder resolver, porque
      // el backend espera un único autor_nombre.
      this.autorElegido.set('');
      this.paso.set('seleccion-autor');
    } else {
      // Un solo autor (o ninguno, caso raro de Google Books): se resuelve
      // directo, sin pasar por el paso de selección.
      this.autorElegido.set(libro.autores[0] ?? '');
      this.resolver();
    }
  }

  confirmarAutorParaResolver(): void {
    if (!this.autorElegido()) return;
    this.resolver();
  }

  // ==========================================
  // Paso 2: resolución (/resolver)
  // ==========================================

  private resolver(): void {
    const libro = this.candidatoSeleccionado();
    if (!libro) return;

    const request: ResolverLibroRequest = {
      titulo: libro.titulo,
      autor_nombre: this.autorElegido(),
      idioma: libro.idioma,
      categorias: libro.categorias,
      anio_publicacion: libro.anio_publicacion,
      descripcion: libro.descripcion,
      portada_url: libro.portada_url,
      isbn: libro.isbn,
    };

    this.errorResolucion.set(null);
    this.resolviendo.set(true);

    this.busquedaLibrosService.resolver(request).subscribe({
      next: (respuesta) => {
        this.resolucion.set(respuesta);
        this.resolviendo.set(false);

        if (respuesta.autor.tipo === 'requiere_confirmacion') {
          // Banda "dudosa": no se puede seguir sin que el usuario decida.
          this.paso.set('confirmacion-autor');
        } else {
          // "existente" o "nuevo": ya se puede navegar a confirmar/importar. 
          this.irAConfirmar(respuesta, respuesta.autor);
        }
      },
      error: () => {
        this.errorResolucion.set('No se pudo resolver el libro. Intenta de nuevo.');
        this.resolviendo.set(false);
      },
    });
  }

  // ==========================================
  // Paso de confirmación de autor (banda "dudosa")
  // ==========================================

  confirmarEsMismoAutor(): void {
    const resolucion = this.resolucion();
    if (!resolucion || resolucion.autor.tipo !== 'requiere_confirmacion') return;

    this.irAConfirmar(resolucion, {
      tipo: 'existente',
      autor_id: resolucion.autor.autor_id_candidato,
      nombre: resolucion.autor.nombre_candidato,
    });
  }

  confirmarEsAutorDistinto(): void {
    const resolucion = this.resolucion();
    if (!resolucion || resolucion.autor.tipo !== 'requiere_confirmacion') return;

    this.irAConfirmar(resolucion, {
      tipo: 'nuevo',
      datos: resolucion.autor.datos_si_es_nuevo,
    });
  }

  // ==========================================
  // Navegación a la página de confirmación/importación
  // ==========================================

  private irAConfirmar(
    resolucion: ResolverLibroResponse,
    autor: Exclude<ResolverLibroResponse['autor'], { tipo: 'requiere_confirmacion' }>
  ): void {
    this.busquedaLibrosService.guardarSeleccion({ resolucion, autor });
    this.router.navigate(['/libros/buscar/importar']);
  }

  // ==========================================
  // Reinicio (volver a buscar otro libro)
  // ==========================================

  buscarOtro(): void {
    this.queryInput.set('');
    this.busquedaLibrosService.limpiarBusqueda();
    this.candidatoSeleccionado.set(null);
    this.autorElegido.set('');
    this.resolucion.set(null);
    this.errorBusqueda.set(null);
    this.errorResolucion.set(null);
    this.paso.set('busqueda');
  }
}