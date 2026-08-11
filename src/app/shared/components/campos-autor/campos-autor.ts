import { Component, input, model, WritableSignal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

// Modelo de los campos de autor que este componente sabe editar. País queda
// afuera a propósito: en autor-form es un paisId string simple con su
// propio <select>, en confirmar-importar es una PaisResolucion (unión
// existente/nuevo) resuelta por la IA — son dos widgets distintos, no una
// variación de uno solo (a diferencia de autorId en CamposLibro). Cada
// página resuelve país por su cuenta y lo proyecta en el slot
// [campos-autor-pais].
export interface CamposAutorModel {
  nombre: string;
  idioma: string;
  retratoUrl: string;
  fechaNacimiento: string;
  anioNacimientoAprox: string;
  fechaDefuncion: string;
  anioDefuncionAprox: string;
}

type ModoFecha = 'exacta' | 'aproximado';

@Component({
  selector: 'app-campos-autor',
  imports: [FormField],
  templateUrl: './campos-autor.html',
  styleUrl: './campos-autor.scss',
})
export class CamposAutor {
  // Field tree de Signal Forms (resultado de form(...) en el padre). El
  // modelo real del padre puede tener campos extra (ej. paisId en
  // autor-form) sin romper este tipo — TypeScript lo permite por tipado
  // estructural, ya que CamposAutorModel es un subconjunto de las claves
  // que este componente necesita leer.
  autorForm = input.required<ReturnType<typeof form<CamposAutorModel>>>();

  // Igual que datosLibro en CamposLibro: el signal crudo, no el field
  // tree, porque el toggle de modo fecha necesita mutar el modelo
  // completo (limpiar el campo que no corresponde al modo activo).
  datosAutor = input.required<WritableSignal<CamposAutorModel>>();

  // Two-way: el padre fija el valor inicial al cargar un autor existente
  // (según si venía con año aproximado o con fecha exacta); el componente
  // gestiona los cambios posteriores originados por clicks del usuario.
  modoNacimiento = model<ModoFecha>('exacta');
  modoDefuncion = model<ModoFecha>('exacta');

  cambiarModoNacimiento(modo: ModoFecha): void {
    this.modoNacimiento.set(modo);
    this.datosAutor().update((m) => ({
      ...m,
      fechaNacimiento: modo === 'exacta' ? m.fechaNacimiento : '',
      anioNacimientoAprox: modo === 'aproximado' ? m.anioNacimientoAprox : '',
    }));
  }

  cambiarModoDefuncion(modo: ModoFecha): void {
    this.modoDefuncion.set(modo);
    this.datosAutor().update((m) => ({
      ...m,
      fechaDefuncion: modo === 'exacta' ? m.fechaDefuncion : '',
      anioDefuncionAprox: modo === 'aproximado' ? m.anioDefuncionAprox : '',
    }));
  }
}