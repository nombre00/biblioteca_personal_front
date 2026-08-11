import { Component, input, WritableSignal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

import { EstadoLectura } from '../../../core/models/libro';

// Modelo de los campos de libro que este componente sabe editar. Autor y
// géneros quedan afuera a propósito (ver ng-content en el template): en
// libro-form son un <select> por id y un arreglo de ids ya persistidos;
// en confirmar-importar son datos que pueden no tener id todavía (autor
// nuevo, género nuevo) — dos tipos de dato distintos, no una variación de
// un mismo widget, así que no pueden vivir como un campo simple acá.
export interface CamposLibroModel {
  titulo: string;
  isbn: string;
  portadaUrl: string;
  estado: EstadoLectura;
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
  // bindea directo con [formField] sobre cada subcampo.
  libroForm = input.required<ReturnType<typeof form<CamposLibroModel>>>();

  // El signal de datos crudo (no el field tree), necesario para leer
  // portadaUrl al armar el preview de la imagen.
  datosLibro = input.required<WritableSignal<CamposLibroModel>>();
}