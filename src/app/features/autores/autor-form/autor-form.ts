import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField, submit, required, min } from '@angular/forms/signals';

import { AutorService } from '../autor.service';
import { PaisService } from '../pais.service';

import { AutorDTO, AutorResponseDTO } from '../../../core/models/autor';
import { PaisDTO } from '../../../core/models/pais';
import { ErrorResponseDTO } from '../../../core/models/error-response';

interface AutorFormModel {
  nombre: string;
  idioma: string;
  paisId: number;
}

const MODELO_VACIO: AutorFormModel = {
  nombre: '',
  idioma: '',
  paisId: 0,
};

@Component({
  selector: 'app-autor-form',
  imports: [FormField],
  templateUrl: './autor-form.html',
  styleUrl: './autor-form.scss',
})
export class AutorForm implements OnInit {
  private autorService = inject(AutorService);
  private paisService = inject(PaisService);

  // Autor que se está editando (0 = modo creación)
  autorSeleccionadoId = signal(0);

  autores = signal<AutorResponseDTO[]>([]);
  paises = signal<PaisDTO[]>([]);

  cargando = signal(true);
  errorCarga = signal<string | null>(null);
  cargandoAutor = signal(false);

  enviando = signal(false);
  errorEnvio = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  eliminando = signal(false);
  errorEliminar = signal<string | null>(null);

  nombrePaisNuevo = signal('');
  errorPais = signal<string | null>(null);
  creandoPais = signal(false);

  protected readonly model = signal<AutorFormModel>({ ...MODELO_VACIO });

  protected readonly autorForm = form(this.model, (s) => {
    required(s.nombre, { message: 'El nombre es obligatorio' });
    min(s.paisId, 1, { message: 'Debes seleccionar un país' });
  });

  ngOnInit(): void {
    Promise.all([this.cargarAutores(), this.cargarPaises()]).then(() => {
      this.cargando.set(false);
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

  private cargarPaises(): Promise<void> {
    return new Promise((resolve) => {
      this.paisService.listarTodos().subscribe({
        next: (data) => {
          this.paises.set(data);
          resolve();
        },
        error: () => {
          this.errorCarga.set('No se pudieron cargar los países.');
          resolve();
        },
      });
    });
  }

  onSeleccionarAutor(idStr: string): void {
    const id = Number(idStr);
    this.autorSeleccionadoId.set(id);
    this.errorEnvio.set(null);
    this.mensajeExito.set(null);
    this.errorEliminar.set(null);

    if (id === 0) {
      this.model.set({ ...MODELO_VACIO });
      return;
    }

    this.cargandoAutor.set(true);
    this.autorService.buscarPorId(id).subscribe({
      next: (autor) => {
        this.model.set({
          nombre: autor.nombre,
          idioma: autor.idioma ?? '',
          paisId: autor.pais.id!,
        });
        this.cargandoAutor.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudo cargar el autor seleccionado.');
        this.cargandoAutor.set(false);
      },
    });
  }

  crearPaisNuevo(): void {
    const nombre = this.nombrePaisNuevo().trim();
    if (!nombre) {
      this.errorPais.set('Ingresa un nombre para el país.');
      return;
    }

    this.errorPais.set(null);
    this.creandoPais.set(true);

    this.paisService.crear({ nombre }).subscribe({
      next: (creado) => {
        this.paises.update((lista) => [...lista, creado]);
        this.model.update((m) => ({ ...m, paisId: creado.id! }));
        this.nombrePaisNuevo.set('');
        this.creandoPais.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const errorDto = err.error as ErrorResponseDTO;
        this.errorPais.set(errorDto?.mensaje ?? 'No se pudo crear el país.');
        this.creandoPais.set(false);
      },
    });
  }

  onSubmit(): void {
    submit(this.autorForm, async () => {
      this.errorEnvio.set(null);
      this.mensajeExito.set(null);
      this.enviando.set(true);

      const m = this.model();
      const dto: AutorDTO = {
        nombre: m.nombre,
        idioma: m.idioma.trim() ? m.idioma.trim() : undefined,
        paisId: m.paisId,
      };

      try {
        const esEdicion = this.autorSeleccionadoId() !== 0;
        const autor = esEdicion
          ? await firstValueFrom(this.autorService.actualizar(this.autorSeleccionadoId(), dto))
          : await firstValueFrom(this.autorService.crear(dto));

        this.mensajeExito.set(esEdicion ? 'Autor actualizado.' : 'Autor creado.');

        // Refresca la lista local del dropdown
        if (esEdicion) {
          this.autores.update((lista) => lista.map((a) => (a.id === autor.id ? autor : a)));
        } else {
          this.autores.update((lista) => [...lista, autor]);
        }

        this.autorSeleccionadoId.set(autor.id);
      } catch (err) {
        const errorDto = (err as HttpErrorResponse).error as ErrorResponseDTO;
        this.errorEnvio.set(errorDto?.mensaje ?? 'Ocurrió un error al guardar el autor.');
      } finally {
        this.enviando.set(false);
      }
    });
  }

  eliminar(): void {
    const id = this.autorSeleccionadoId();
    if (id === 0) return;

    const autor = this.autores().find((a) => a.id === id);
    const confirmado = window.confirm(
      `¿Eliminar a "${autor?.nombre ?? 'este autor'}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    this.errorEliminar.set(null);
    this.eliminando.set(true);

    this.autorService.eliminar(id).subscribe({
      next: () => {
        this.autores.update((lista) => lista.filter((a) => a.id !== id));
        this.autorSeleccionadoId.set(0);
        this.model.set({ ...MODELO_VACIO });
        this.eliminando.set(false);
      },
      error: () => {
        this.errorEliminar.set('No se pudo eliminar el autor. Puede que tenga libros asociados.');
        this.eliminando.set(false);
      },
    });
  }
}