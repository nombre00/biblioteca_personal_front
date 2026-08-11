import { Component, computed, input, output, model, WritableSignal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { AutorResponseDTO } from '../../../core/models/autor';
import { GeneroDTO } from '../../../core/models/genero';
import { EstadoLectura } from '../../../core/models/libro';

// Modelo de los campos de libro que este componente sabe editar. Vive acá
// (no en libro-form.ts) porque tanto libro-form como, más adelante,
// confirmar-importar, comparten esta misma forma de datos — es el punto
// de verdad único para el shape del formulario.
export interface CamposLibroModel {
  titulo: string;
  isbn: string;
  portadaUrl: string;
  estado: EstadoLectura;
  autorId: string;
  generoIds: number[];
  generoParaAgregar: string;
  anioPublicacion: string;
  anioLectura: string;
  fechaInicio: string;
  fechaTermino: string;
}

@Component({
  selector: 'app-campos-libro',
  imports: [FormField],
  templateUrl: './campos-libro.html',
  styleUrl: './campos-libro.scss',
})
export class CamposLibro {
  // Field tree de Signal Forms (resultado de form(...) en el padre) — se
  // bindea directo con [formField] sobre cada subcampo, igual que hacía
  // libro-form antes de que este bloque se extrajera.
  libroForm = input.required<ReturnType<typeof form<CamposLibroModel>>>();

  // El signal de datos crudo (no el field tree), necesario porque
  // agregar/quitar género no pasan por un <input> con [formField] — son
  // mutaciones directas del arreglo generoIds, así que el componente
  // necesita poder leer y escribir el modelo completo.
  datosLibro = input.required<WritableSignal<CamposLibroModel>>();

  autoresOrdenados = input.required<AutorResponseDTO[]>();
  // Deshabilita el selector de autor sin sacarlo del componente — pensado
  // para confirmar-importar, donde el autor ya viene resuelto de antemano
  // y no debe poder cambiarse desde acá.
  bloquearAutor = input(false);

  generosSeleccionados = input.required<GeneroDTO[]>();
  generosDisponibles = input.required<GeneroDTO[]>();
  errorGenero = input<string | null>(null);
  creandoGenero = input(false);

  // Two-way: el padre sigue siendo dueño de este valor (lo resetea a ''
  // después de crear el género con éxito), el componente solo lo edita.
  nombreGeneroNuevo = model('');

  // Crear género sí requiere backend (GeneroService en libro-form, o el
  // servicio correspondiente en cada página que use este componente), así
  // que esa acción se delega al padre en vez de resolverse acá adentro.
  crearGeneroNuevo = output<void>();

  // Nombre del autor a mostrar como texto plano cuando bloquearAutor() es
  // true (confirmar-importar) — evita depender de [disabled] sobre un
  // <select> con [formField], que Signal Forms no permite (NG8022).
  // autorId vive como string en el modelo (sentinel '' para vacío, ver
  // convención del proyecto), por eso se convierte con Number() acá antes
  // de comparar contra el id numérico de AutorResponseDTO.
  protected readonly nombreAutorBloqueado = computed(() => {
    const autorId = this.datosLibro()().autorId;
    const autor = this.autoresOrdenados().find((a) => a.id === Number(autorId));
    return autor ? `${autor.nombre} (${autor.pais.nombre})` : 'Autor sin resolver';
  });

  agregarGenero(): void {
    const idStr = this.datosLibro()().generoParaAgregar;
    if (!idStr) return;
    const id = Number(idStr);
    this.datosLibro().update((m) => ({
      ...m,
      generoIds: [...m.generoIds, id],
      generoParaAgregar: '',
    }));
  }

  quitarGenero(id: number): void {
    this.datosLibro().update((m) => ({
      ...m,
      generoIds: m.generoIds.filter((gid) => gid !== id),
    }));
  }

  onCrearGeneroNuevo(): void {
    if (!this.nombreGeneroNuevo().trim()) return;
    this.crearGeneroNuevo.emit();
  }
}