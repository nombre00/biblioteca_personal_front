import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField, submit, required } from '@angular/forms/signals';

import { BusquedaLibrosService, AutorResueltoFinal } from '../busqueda-libros.service';
import { GeneroService } from '../genero.service';
import { PaisService } from '../../autores/pais.service';
import { PortadaLibro } from '../../../shared/components/portada-libro/portada-libro';

import { EstadoLectura, LibroResponseDTO } from '../../../core/models/libro';
import { GeneroDTO } from '../../../core/models/genero';
import { PaisDTO } from '../../../core/models/pais';
import { ErrorResponseDTO } from '../../../core/models/error-response';
import {
  ImportarLibroRequest,
  GeneroImportSchema,
  GeneroResolucion,
  PaisResolucion,
  AutorCreateSchema,
} from '../../../core/models/busqueda-externa';

interface LibroConfirmModel {
  titulo: string;
  isbn: string;
  portadaUrl: string;
  anioPublicacion: string;
  estado: EstadoLectura;
}

// Campos "planos" del autor nuevo (todo lo que no sea país, que se maneja
// aparte porque es una unión discriminada, no un string simple — mismo
// criterio que en autor-form, donde paisId vive fuera de los campos de
// texto/fecha).
interface AutorNuevoModel {
  nombre: string;
  idioma: string;
  retratoUrl: string;
  fechaNacimiento: string;
  anioNacimientoAprox: string;
  fechaDefuncion: string;
  anioDefuncionAprox: string;
}

const AUTOR_NUEVO_VACIO: AutorNuevoModel = {
  nombre: '',
  idioma: '',
  retratoUrl: '',
  fechaNacimiento: '',
  anioNacimientoAprox: '',
  fechaDefuncion: '',
  anioDefuncionAprox: '',
};

@Component({
  selector: 'app-confirmar-importar',
  imports: [FormField, PortadaLibro],
  templateUrl: './confirmar-importar.html',
  styleUrl: './confirmar-importar.scss',
})
export class ConfirmarImportar implements OnInit {
  private busquedaLibrosService = inject(BusquedaLibrosService);
  private generoService = inject(GeneroService);
  private paisService = inject(PaisService);
  private router = inject(Router);

  // Autor ya decidido, tal cual llegó desde Buscar (existente o nuevo,
  // nunca "requiere_confirmacion" — eso ya se resolvió antes de navegar
  // acá).
  autor = signal<AutorResueltoFinal | null>(null);

  // Descripción original de Google Books, solo para contexto visual — no
  // es un campo editable del Libro (LibroDTO tampoco lo tiene hoy).
  descripcion = signal<string | undefined>(undefined);

  generosDisponiblesTodos = signal<GeneroDTO[]>([]);
  generosSeleccionados = signal<GeneroResolucion[]>([]);
  generoParaAgregar = signal<string>('');
  nombreGeneroNuevo = signal('');

  // --- Autor nuevo: solo se usa/carga si autor().tipo === 'nuevo' ---
  paisesDisponiblesTodos = signal<PaisDTO[]>([]);
  paisSeleccionado = signal<PaisResolucion | null>(null);
  paisIdParaSeleccionar = signal<string>('');
  nombrePaisNuevo = signal('');

  modoNacimiento = signal<'exacta' | 'aproximado'>('exacta');
  modoDefuncion = signal<'exacta' | 'aproximado'>('exacta');

  protected readonly autorNuevoModel = signal<AutorNuevoModel>({ ...AUTOR_NUEVO_VACIO });

  protected readonly autorNuevoForm = form(this.autorNuevoModel, (s) => {
    required(s.nombre, { message: 'El nombre del autor es obligatorio' });
  });

  cargando = signal(true);
  errorCarga = signal<string | null>(null);

  importando = signal(false);
  errorImportar = signal<string | null>(null);
  libroImportado = signal<LibroResponseDTO | null>(null);

  protected readonly model = signal<LibroConfirmModel>({
    titulo: '',
    isbn: '',
    portadaUrl: '',
    anioPublicacion: '',
    estado: 'POR_LEER',
  });

  protected readonly libroForm = form(this.model, (s) => {
    required(s.titulo, { message: 'El título es obligatorio' });
    required(s.estado, { message: 'El estado es obligatorio' });
  });

  esAutorNuevo = computed(() => this.autor()?.tipo === 'nuevo');

  // Géneros existentes que todavía no están seleccionados, para el select
  // de "agregar género existente". Compara por nombre (no por id) porque
  // los géneros "nuevo" sugeridos por la IA todavía no tienen id.
  generosDisponiblesParaAgregar = computed(() => {
    const nombresSeleccionados = new Set(
      this.generosSeleccionados().map((g) =>
        (g.tipo === 'existente' ? g.nombre : g.datos.nombre).toLowerCase()
      )
    );
    return this.generosDisponiblesTodos().filter(
      (g) => !nombresSeleccionados.has(g.nombre.toLowerCase())
    );
  });

  // País existentes que no matchean el país ya seleccionado (por nombre) —
  // mismo criterio que géneros, para no ofrecer "seleccionar" el mismo
  // país que ya está elegido.
  paisesDisponiblesParaSeleccionar = computed(() => {
    const actual = this.paisSeleccionado();
    const nombreActual = actual
      ? (actual.tipo === 'existente' ? actual.nombre : actual.datos.nombre).toLowerCase()
      : null;
    return this.paisesDisponiblesTodos().filter((p) => p.nombre.toLowerCase() !== nombreActual);
  });

  ngOnInit(): void {
    const seleccion = this.busquedaLibrosService.obtenerSeleccion();

    if (!seleccion) {
      // Entrada directa a la ruta sin pasar por /libros/buscar (recarga de
      // página, link directo, etc.) — no hay nada que confirmar.
      this.router.navigate(['/libros/buscar']);
      return;
    }

    const { resolucion, autor } = seleccion;

    this.autor.set(autor);
    this.descripcion.set(resolucion.descripcion);
    this.generosSeleccionados.set(resolucion.generos);

    this.model.set({
      titulo: resolucion.titulo,
      isbn: resolucion.isbn ?? '',
      portadaUrl: resolucion.portada_url ?? '',
      anioPublicacion: resolucion.anio_publicacion != null ? String(resolucion.anio_publicacion) : '',
      estado: 'POR_LEER',
    });

    const cargas: Promise<void>[] = [
      new Promise((resolve) => {
        this.generoService.listarTodos().subscribe({
          next: (data) => {
            this.generosDisponiblesTodos.set(data);
            resolve();
          },
          error: () => {
            this.errorCarga.set('No se pudieron cargar los géneros existentes.');
            resolve();
          },
        });
      }),
    ];

    if (autor.tipo === 'nuevo') {
      // Prellenar los campos editables del autor nuevo con lo que resolvió
      // Wikidata/Gemini — el usuario los corrige acá si hace falta (ej. el
      // caso "Nasdas" de país corrupto en la fuente).
      const datos = autor.datos;

      this.autorNuevoModel.set({
        nombre: datos.nombre,
        idioma: datos.idioma ?? '',
        retratoUrl: datos.retrato_url ?? '',
        fechaNacimiento: datos.fecha_nacimiento ?? '',
        anioNacimientoAprox:
          datos.anio_nacimiento_aprox != null ? String(datos.anio_nacimiento_aprox) : '',
        fechaDefuncion: datos.fecha_defuncion ?? '',
        anioDefuncionAprox:
          datos.anio_defuncion_aprox != null ? String(datos.anio_defuncion_aprox) : '',
      });
      this.modoNacimiento.set(datos.anio_nacimiento_aprox != null ? 'aproximado' : 'exacta');
      this.modoDefuncion.set(datos.anio_defuncion_aprox != null ? 'aproximado' : 'exacta');
      this.paisSeleccionado.set(datos.pais ?? null);

      cargas.push(
        new Promise((resolve) => {
          this.paisService.listarTodos().subscribe({
            next: (data) => {
              this.paisesDisponiblesTodos.set(data);
              resolve();
            },
            error: () => {
              this.errorCarga.set('No se pudieron cargar los países existentes.');
              resolve();
            },
          });
        })
      );
    }

    Promise.all(cargas).then(() => this.cargando.set(false));
  }

  // ==========================================
  // Géneros (edición 100% local: nada se persiste hasta confirmar import)
  // ==========================================

  quitarGenero(index: number): void {
    this.generosSeleccionados.update((lista) => lista.filter((_, i) => i !== index));
  }

  agregarGeneroExistente(): void {
    const idStr = this.generoParaAgregar();
    if (!idStr) return;
    const genero = this.generosDisponiblesTodos().find((g) => g.id === Number(idStr));
    if (!genero) return;

    this.generosSeleccionados.update((lista) => [
      ...lista,
      { tipo: 'existente', genero_id: genero.id!, nombre: genero.nombre },
    ]);
    this.generoParaAgregar.set('');
  }

  agregarGeneroNuevo(): void {
    const nombre = this.nombreGeneroNuevo().trim();
    if (!nombre) return;

    this.generosSeleccionados.update((lista) => [
      ...lista,
      { tipo: 'nuevo', datos: { nombre } },
    ]);
    this.nombreGeneroNuevo.set('');
  }

  // ==========================================
  // Autor nuevo: país y fechas (edición 100% local)
  // ==========================================

  seleccionarPaisExistente(): void {
    const idStr = this.paisIdParaSeleccionar();
    if (!idStr) return;
    const pais = this.paisesDisponiblesTodos().find((p) => p.id === Number(idStr));
    if (!pais) return;

    this.paisSeleccionado.set({ tipo: 'existente', pais_id: pais.id!, nombre: pais.nombre });
    this.paisIdParaSeleccionar.set('');
  }

  usarPaisNuevo(): void {
    const nombre = this.nombrePaisNuevo().trim();
    if (!nombre) return;

    this.paisSeleccionado.set({ tipo: 'nuevo', datos: { nombre } });
    this.nombrePaisNuevo.set('');
  }

  cambiarModoNacimiento(modo: 'exacta' | 'aproximado'): void {
    this.modoNacimiento.set(modo);
    this.autorNuevoModel.update((m) => ({
      ...m,
      fechaNacimiento: modo === 'exacta' ? m.fechaNacimiento : '',
      anioNacimientoAprox: modo === 'aproximado' ? m.anioNacimientoAprox : '',
    }));
  }

  cambiarModoDefuncion(modo: 'exacta' | 'aproximado'): void {
    this.modoDefuncion.set(modo);
    this.autorNuevoModel.update((m) => ({
      ...m,
      fechaDefuncion: modo === 'exacta' ? m.fechaDefuncion : '',
      anioDefuncionAprox: modo === 'aproximado' ? m.anioDefuncionAprox : '',
    }));
  }

  // ==========================================
  // Confirmar importación
  // ==========================================

  onSubmit(): void {
    submit(this.libroForm, async () => {
      // Si el autor es nuevo, también hay que validar/leer autorNuevoForm.
      // submit() de Signal Forms no soporta validar dos forms en un solo
      // llamado, así que se chequea manualmente acá antes de armar el
      // payload — mismo resultado práctico (no deja enviar si el nombre
      // del autor nuevo está vacío).
      if (this.esAutorNuevo() && this.autorNuevoForm().invalid()) {
        return;
      }

      const autor = this.autor();
      if (!autor) return;

      const m = this.model();
      const request: ImportarLibroRequest = {
        titulo: m.titulo,
        anio_publicacion: m.anioPublicacion.trim() ? Number(m.anioPublicacion.trim()) : undefined,
        descripcion: this.descripcion(),
        portada_url: m.portadaUrl.trim() ? m.portadaUrl.trim() : undefined,
        isbn: m.isbn.trim() ? m.isbn.trim() : undefined,
        estado: m.estado,
        autor:
          autor.tipo === 'existente'
            ? { autor_id: autor.autor_id }
            : { datos: this.armarAutorCreateSchema() },
        generos: this.generosSeleccionados().map(this.mapearGeneroAImport),
      };

      this.errorImportar.set(null);
      this.importando.set(true);

      try {
        const libro = await firstValueFrom(this.busquedaLibrosService.importar(request));
        this.libroImportado.set(libro);
        this.busquedaLibrosService.limpiarSeleccion();
      } catch (err) {
        const errorDto = (err as HttpErrorResponse).error as ErrorResponseDTO;
        this.errorImportar.set(errorDto?.mensaje ?? 'No se pudo agregar el libro a la biblioteca.');
      } finally {
        this.importando.set(false);
      }
    });
  }

  private armarAutorCreateSchema(): AutorCreateSchema {
    const m = this.autorNuevoModel();
    return {
      nombre: m.nombre,
      idioma: m.idioma.trim() ? m.idioma.trim() : undefined,
      pais: this.paisSeleccionado(),
      retrato_url: m.retratoUrl.trim() ? m.retratoUrl.trim() : undefined,
      fecha_nacimiento: m.fechaNacimiento.trim() ? m.fechaNacimiento.trim() : undefined,
      anio_nacimiento_aprox: m.anioNacimientoAprox.trim()
        ? Number(m.anioNacimientoAprox.trim())
        : undefined,
      fecha_defuncion: m.fechaDefuncion.trim() ? m.fechaDefuncion.trim() : undefined,
      anio_defuncion_aprox: m.anioDefuncionAprox.trim()
        ? Number(m.anioDefuncionAprox.trim())
        : undefined,
    };
  }

  private mapearGeneroAImport(genero: GeneroResolucion): GeneroImportSchema {
    if (genero.tipo === 'existente') {
      return { genero_id: genero.genero_id };
    }
    return { datos: genero.datos };
  }

  cancelar(): void {
    this.busquedaLibrosService.limpiarSeleccion();
    this.router.navigate(['/libros/buscar']);
  }

  buscarOtro(): void {
    this.router.navigate(['/libros/buscar']);
  }
} 