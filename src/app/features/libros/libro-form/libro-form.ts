import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField, submit, required, min } from '@angular/forms/signals';

import { LibroService } from '../libro.service';
import { GeneroService } from '../genero.service';
import { AutorService } from '../../autores/autor.service';

import { LibroDTO, LibroResponseDTO, EstadoLectura } from '../../../core/models/libro';
import { GeneroDTO } from '../../../core/models/genero';
import { AutorResponseDTO } from '../../../core/models/autor';
import { ErrorResponseDTO } from '../../../core/models/error-response';

interface LibroFormModel {
  titulo: string;
  isbn: string;
  portadaUrl: string;
  estado: EstadoLectura;
  autorId: number;
  generoIds: number[];
  generoParaAgregar: number;
}

const MODELO_VACIO: LibroFormModel = {
  titulo: '',
  isbn: '',
  portadaUrl: '',
  estado: 'POR_LEER',
  autorId: 0,
  generoIds: [],
  generoParaAgregar: 0,
};

@Component({
  selector: 'app-libro-form',
  imports: [FormField],
  templateUrl: './libro-form.html',
  styleUrl: './libro-form.scss',
})
export class LibroForm implements OnInit {
  private libroService = inject(LibroService);
  private generoService = inject(GeneroService);
  private autorService = inject(AutorService);

  // Libro que se está editando (0 = modo creación)
  libroSeleccionadoId = signal(0);

  libros = signal<LibroResponseDTO[]>([]);
  autores = signal<AutorResponseDTO[]>([]);
  generosDisponiblesTodos = signal<GeneroDTO[]>([]);

  cargando = signal(true);
  errorCarga = signal<string | null>(null);
  cargandoLibro = signal(false);

  enviando = signal(false);
  errorEnvio = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  eliminando = signal(false);
  errorEliminar = signal<string | null>(null);

  nombreGeneroNuevo = signal('');
  errorGenero = signal<string | null>(null);
  creandoGenero = signal(false);

  protected readonly model = signal<LibroFormModel>({ ...MODELO_VACIO });

  protected readonly libroForm = form(this.model, (s) => {
    required(s.titulo, { message: 'El título es obligatorio' });
    required(s.estado, { message: 'El estado es obligatorio' });
    min(s.autorId, 1, { message: 'Debes seleccionar un autor' });
  });

  generosSeleccionados = computed(() => {
    const ids = this.model().generoIds;
    return this.generosDisponiblesTodos().filter((g) => ids.includes(g.id!));
  });

  generosDisponibles = computed(() => {
    const ids = this.model().generoIds;
    return this.generosDisponiblesTodos().filter((g) => !ids.includes(g.id!));
  });

  ngOnInit(): void {
    Promise.all([this.cargarLibros(), this.cargarAutores(), this.cargarGeneros()]).then(() => {
      this.cargando.set(false);
    });
  }

  private cargarLibros(): Promise<void> {
    return new Promise((resolve) => {
      this.libroService.listarTodos().subscribe({
        next: (data) => {
          this.libros.set(data);
          resolve();
        },
        error: () => {
          this.errorCarga.set('No se pudieron cargar los libros.');
          resolve();
        },
      });
    });
  }

  private cargarAutores(): Promise<void> {
    return new Promise((resolve) => {
      this.autorService.listarTodos().subscribe({
        next: (data) => {
          this.autores.set(data);
          resolve();
        },
        error: () => {
          this.errorCarga.set('No se pudieron cargar los autores.');
          resolve();
        },
      });
    });
  }

  private cargarGeneros(): Promise<void> {
    return new Promise((resolve) => {
      this.generoService.listarTodos().subscribe({
        next: (data) => {
          this.generosDisponiblesTodos.set(data);
          resolve();
        },
        error: () => {
          this.errorCarga.set('No se pudieron cargar los géneros.');
          resolve();
        },
      });
    });
  }

  onSeleccionarLibro(idStr: string): void {
    const id = Number(idStr);
    this.libroSeleccionadoId.set(id);
    this.errorEnvio.set(null);
    this.mensajeExito.set(null);
    this.errorEliminar.set(null);

    if (id === 0) {
      this.model.set({ ...MODELO_VACIO });
      return;
    }

    this.cargandoLibro.set(true);
    this.libroService.buscarPorId(id).subscribe({
      next: (libro) => {
        this.model.set({
          titulo: libro.titulo,
          isbn: libro.isbn ?? '',
          portadaUrl: libro.portadaUrl ?? '',
          estado: libro.estado,
          autorId: libro.autor.id,
          generoIds: libro.generos.map((g) => g.id!),
          generoParaAgregar: 0,
        });
        this.cargandoLibro.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudo cargar el libro seleccionado.');
        this.cargandoLibro.set(false);
      },
    });
  }

  agregarGenero(): void {
    const id = this.model().generoParaAgregar;
    if (!id) return;
    this.model.update((m) => ({
      ...m,
      generoIds: [...m.generoIds, id],
      generoParaAgregar: 0,
    }));
  }

  quitarGenero(id: number): void {
    this.model.update((m) => ({
      ...m,
      generoIds: m.generoIds.filter((gid) => gid !== id),
    }));
  }

  crearGeneroNuevo(): void {
    const nombre = this.nombreGeneroNuevo().trim();
    if (!nombre) {
      this.errorGenero.set('Ingresa un nombre para el género.');
      return;
    }

    this.errorGenero.set(null);
    this.creandoGenero.set(true);

    this.generoService.crear({ nombre }).subscribe({
      next: (creado) => {
        this.generosDisponiblesTodos.update((lista) => [...lista, creado]);
        this.model.update((m) => ({
          ...m,
          generoIds: [...m.generoIds, creado.id!],
        }));
        this.nombreGeneroNuevo.set('');
        this.creandoGenero.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const errorDto = err.error as ErrorResponseDTO;
        this.errorGenero.set(errorDto?.mensaje ?? 'No se pudo crear el género.');
        this.creandoGenero.set(false);
      },
    });
  }

  onSubmit(): void {
    submit(this.libroForm, async () => {
      this.errorEnvio.set(null);
      this.mensajeExito.set(null);
      this.enviando.set(true);

      const m = this.model();
      const dto: LibroDTO = {
        titulo: m.titulo,
        isbn: m.isbn.trim() ? m.isbn.trim() : undefined,
        portadaUrl: m.portadaUrl.trim() ? m.portadaUrl.trim() : undefined,
        estado: m.estado,
        autorId: m.autorId,
        generoIds: m.generoIds,
      };

      try {
        const esEdicion = this.libroSeleccionadoId() !== 0;
        const libro = esEdicion
          ? await firstValueFrom(this.libroService.actualizar(this.libroSeleccionadoId(), dto))
          : await firstValueFrom(this.libroService.crear(dto));

        this.mensajeExito.set(esEdicion ? 'Libro actualizado.' : 'Libro creado.');

        if (esEdicion) {
          this.libros.update((lista) => lista.map((l) => (l.id === libro.id ? libro : l)));
        } else {
          this.libros.update((lista) => [...lista, libro]);
        }

        this.libroSeleccionadoId.set(libro.id);
      } catch (err) {
        const errorDto = (err as HttpErrorResponse).error as ErrorResponseDTO;
        this.errorEnvio.set(errorDto?.mensaje ?? 'Ocurrió un error al guardar el libro.');
      } finally {
        this.enviando.set(false);
      }
    });
  }

  eliminar(): void {
    const id = this.libroSeleccionadoId();
    if (id === 0) return;

    const libro = this.libros().find((l) => l.id === id);
    const confirmado = window.confirm(
      `¿Eliminar "${libro?.titulo ?? 'este libro'}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    this.errorEliminar.set(null);
    this.eliminando.set(true);

    this.libroService.eliminar(id).subscribe({
      next: () => {
        this.libros.update((lista) => lista.filter((l) => l.id !== id));
        this.libroSeleccionadoId.set(0);
        this.model.set({ ...MODELO_VACIO });
        this.eliminando.set(false);
      },
      error: () => {
        this.errorEliminar.set('No se pudo eliminar el libro.');
        this.eliminando.set(false);
      },
    });
  }
}