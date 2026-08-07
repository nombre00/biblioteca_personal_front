import { Component, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { BusquedaLibrosService } from '../busqueda-libros.service';
import { PortadaLibro } from '../../../shared/components/portada-libro/portada-libro'; // ajustar ruta real si es distinta

import {
  LibroExternoResponse,
  ResolverLibroRequest,
  ResolverLibroResponse,
  ImportarLibroRequest,
  AutorImportSchema,
  GeneroImportSchema,
  GeneroResolucion,
} from '../../../core/models/busqueda-externa';
import { EstadoLectura, LibroResponseDTO } from '../../../core/models/libro';
import { ErrorResponseDTO } from '../../../core/models/error-response';

// Los "pasos" del wizard. Cada uno tiene su propio bloque en el template
// (buscar.html), controlado con @switch(paso()).
//
// 'busqueda'              -> input de query + lista de candidatos.
// 'seleccion-autor'       -> solo si el candidato elegido trae más de un
//                            autor; el usuario elige cuál usar antes de
//                            poder resolver (el backend espera un único
//                            autor_nombre).
// 'confirmacion-autor'    -> solo si /resolver devolvió autor en banda
//                            "dudosa" (requiere_confirmacion): el usuario
//                            decide si es el mismo autor existente o uno
//                            distinto.
// 'revision'              -> resumen final (autor y géneros ya resueltos,
//                            selector de estado de lectura) antes de
//                            confirmar el alta.
// 'completado'            -> mensaje de éxito, con opción de buscar otro.
type Paso = 'busqueda' | 'seleccion-autor' | 'confirmacion-autor' | 'revision' | 'completado';

@Component({
  selector: 'app-buscar',
  imports: [PortadaLibro],
  templateUrl: './buscar.html',
  styleUrl: './buscar.scss',
})
export class Buscar {
  private busquedaLibrosService = inject(BusquedaLibrosService);

  paso = signal<Paso>('busqueda');

  // --- Paso 1: búsqueda ---
  // Un solo campo de texto: se maneja como signal simple en vez de con
  // Signal Forms (mismo patrón que "nombreGeneroNuevo" en libro-form.ts) —
  // no amerita la maquinaria de un form completo para un único input.
  query = signal('');
  buscando = signal(false);
  errorBusqueda = signal<string | null>(null);
  resultados = signal<LibroExternoResponse[]>([]);
  yaSeBusco = signal(false); // para distinguir "sin resultados" de "aún no buscaste"

  // --- Selección de candidato y autor ---
  candidatoSeleccionado = signal<LibroExternoResponse | null>(null);
  autorElegido = signal<string>(''); // nombre del autor elegido, para /resolver

  // --- Paso 2: resolución (autor / géneros) ---
  resolviendo = signal(false);
  errorResolucion = signal<string | null>(null);
  resolucion = signal<ResolverLibroResponse | null>(null);

  // Autor ya definido (existente o nuevo), listo para /importar. Se llena
  // directo si /resolver devolvió "existente"/"nuevo", o después de que
  // el usuario responda en el paso de confirmación si devolvió "dudoso".
  autorFinal = signal<AutorImportSchema | null>(null);

  // --- Paso final: revisión + importación ---
  estadoElegido = signal<EstadoLectura>('POR_LEER');
  importando = signal(false);
  errorImportar = signal<string | null>(null);
  libroImportado = signal<LibroResponseDTO | null>(null);

  puedeBuscar = computed(() => this.query().trim().length > 0 && !this.buscando());

  // ==========================================
  // Paso 1: búsqueda
  // ==========================================

  buscar(): void {
    const query = this.query().trim();
    if (!query) return;

    this.errorBusqueda.set(null);
    this.buscando.set(true);

    this.busquedaLibrosService.buscar({ query, max_results: 40 }).subscribe({
      next: (resultados) => {
        this.resultados.set(resultados);
        this.yaSeBusco.set(true);
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
          // "existente" o "nuevo": ya se puede armar el autor final y
          // saltar directo a la revisión.
          this.autorFinal.set(this.mapearAutorResueltoAImport(respuesta.autor));
          this.paso.set('revision');
        }
      },
      error: () => {
        this.errorResolucion.set('No se pudo resolver el libro. Intenta de nuevo.');
        this.resolviendo.set(false);
      },
    });
  }

  // Convierte un AutorResolucion ya confirmado (existente o nuevo, nunca
  // "requiere_confirmacion") al formato que espera /importar.
  private mapearAutorResueltoAImport(
    autor: Exclude<ResolverLibroResponse['autor'], { tipo: 'requiere_confirmacion' }>
  ): AutorImportSchema {
    if (autor.tipo === 'existente') {
      return { autor_id: autor.autor_id };
    }
    return { datos: autor.datos };
  }

  // ==========================================
  // Paso de confirmación de autor (banda "dudosa")
  // ==========================================

  confirmarEsMismoAutor(): void {
    const resolucion = this.resolucion();
    if (!resolucion || resolucion.autor.tipo !== 'requiere_confirmacion') return;

    this.autorFinal.set({ autor_id: resolucion.autor.autor_id_candidato });
    this.paso.set('revision');
  }

  confirmarEsAutorDistinto(): void {
    const resolucion = this.resolucion();
    if (!resolucion || resolucion.autor.tipo !== 'requiere_confirmacion') return;

    this.autorFinal.set({ datos: resolucion.autor.datos_si_es_nuevo });
    this.paso.set('revision');
  }

  // ==========================================
  // Paso final: importar (/importar)
  // ==========================================

  confirmarImportacion(): void {
    const resolucion = this.resolucion();
    const autor = this.autorFinal();
    if (!resolucion || !autor) return;

    const request: ImportarLibroRequest = {
      titulo: resolucion.titulo,
      anio_publicacion: resolucion.anio_publicacion,
      descripcion: resolucion.descripcion,
      portada_url: resolucion.portada_url,
      isbn: resolucion.isbn,
      estado: this.estadoElegido(),
      autor,
      generos: resolucion.generos.map(this.mapearGeneroAImport),
    };

    this.errorImportar.set(null);
    this.importando.set(true);

    this.busquedaLibrosService.importar(request).subscribe({
      next: (libro) => {
        this.libroImportado.set(libro);
        this.importando.set(false);
        this.paso.set('completado');
      },
      error: (err: HttpErrorResponse) => {
        const errorDto = err.error as ErrorResponseDTO;
        this.errorImportar.set(errorDto?.mensaje ?? 'No se pudo agregar el libro a la biblioteca.');
        this.importando.set(false);
      },
    });
  }

  private mapearGeneroAImport(genero: GeneroResolucion): GeneroImportSchema {
    if (genero.tipo === 'existente') {
      return { genero_id: genero.genero_id };
    }
    return { datos: genero.datos };
  }

  // ==========================================
  // Reinicio (volver a buscar otro libro)
  // ==========================================

  buscarOtro(): void {
    this.query.set('');
    this.resultados.set([]);
    this.yaSeBusco.set(false);
    this.candidatoSeleccionado.set(null);
    this.autorElegido.set('');
    this.resolucion.set(null);
    this.autorFinal.set(null);
    this.estadoElegido.set('POR_LEER');
    this.libroImportado.set(null);
    this.errorBusqueda.set(null);
    this.errorResolucion.set(null);
    this.errorImportar.set(null);
    this.paso.set('busqueda');
  }
}