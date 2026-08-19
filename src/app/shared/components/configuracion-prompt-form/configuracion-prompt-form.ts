import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField, submit, required } from '@angular/forms/signals';

import { GestionIaService } from '../../../features/gestion-ia/gestion-ia.service';
import {
  ConfiguracionPromptCreate,
  ConfiguracionPromptUpdate,
  TipoTareaIa,
} from '../../../core/models/gestion-ia';
import { construirPreviewSegmentoEditable } from '../../../core/utils/prompt-preview.util';

interface ConfiguracionPromptFormModel {
  nombre: string;
  limiteParrafos: string;
}

const MODELO_VACIO: ConfiguracionPromptFormModel = {
  nombre: '',
  limiteParrafos: '',
};

@Component({
  selector: 'app-configuracion-prompt-form',
  imports: [FormField],
  templateUrl: './configuracion-prompt-form.html',
  styleUrl: './configuracion-prompt-form.scss',
})
export class ConfiguracionPromptForm {
  private gestionIaService = inject(GestionIaService);

  // tipoTarea define a qué endpoint/tarea pertenece el preset.
  // presetId = 0 significa modo creación (mismo criterio que autorSeleccionadoId en AutorForm).
  tipoTarea = input.required<TipoTareaIa>();
  presetId = input<number>(0);

  guardado = output<void>();
  cancelado = output<void>();

  cargandoPreset = signal(false);
  errorCarga = signal<string | null>(null);

  enviando = signal(false);
  errorEnvio = signal<string | null>(null);

  // evitarSpoilers y lineas viven fuera del form de Signal Forms:
  // evitarSpoilers es condicional a la tarea, lineas es un array (no un
  // campo escalar), mismo criterio que paisId fuera de CamposAutorModel.
  evitarSpoilers = signal(false);
  lineas = signal<string[]>([]);
  lineaNueva = signal('');

  protected readonly model = signal<ConfiguracionPromptFormModel>({ ...MODELO_VACIO });

  protected readonly presetForm = form(this.model, (s) => {
    required(s.nombre, { message: 'El nombre es obligatorio' });
    required(s.limiteParrafos, { message: 'El límite de párrafos es obligatorio' });
  });

  // Preview del segmento editable únicamente (ver nota en prompt-preview.util.ts).
  preview = computed(() =>
    construirPreviewSegmentoEditable(
      this.lineas(),
      Number(this.model().limiteParrafos) || 0,
      this.tipoTarea() === 'sinopsis' ? this.evitarSpoilers() : null
    )
  );

  constructor() {
    // Reacciona a cambios de presetId (0 = limpiar para creación, >0 = cargar preset existente).
    effect(() => {
      const id = this.presetId();
      this.errorCarga.set(null);
      this.errorEnvio.set(null);

      if (id === 0) {
        this.model.set({ ...MODELO_VACIO });
        this.evitarSpoilers.set(false);
        this.lineas.set([]);
        return;
      }

      this.cargandoPreset.set(true);
      this.gestionIaService.obtener(id).subscribe({
        next: (preset) => {
          this.model.set({
            nombre: preset.nombre,
            limiteParrafos: String(preset.limite_parrafos),
          });
          this.evitarSpoilers.set(preset.evitar_spoilers ?? false);
          this.lineas.set(preset.lineas.map((l) => l.texto));
          this.cargandoPreset.set(false);
        },
        error: () => {
          this.errorCarga.set('No se pudo cargar el preset.');
          this.cargandoPreset.set(false);
        },
      });
    });
  }

  agregarLinea(): void {
    const texto = this.lineaNueva().trim();
    if (!texto) return;
    this.lineas.update((l) => [...l, texto]);
    this.lineaNueva.set('');
  }

  eliminarLinea(index: number): void {
    this.lineas.update((l) => l.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    submit(this.presetForm, async () => {
      this.errorEnvio.set(null);
      this.enviando.set(true);

      const m = this.model();
      const esEdicion = this.presetId() !== 0;
      const lineasPayload = this.lineas().map((texto) => ({ texto }));

      const camposComunes = {
        nombre: m.nombre,
        limite_parrafos: Number(m.limiteParrafos),
        lineas: lineasPayload,
      };

      // evitar_spoilers solo se manda para sinopsis; biografía no lo conoce.
      const dto: ConfiguracionPromptCreate | ConfiguracionPromptUpdate =
        this.tipoTarea() === 'sinopsis'
          ? { ...camposComunes, evitar_spoilers: this.evitarSpoilers() }
          : camposComunes;

      try {
        if (esEdicion) {
          await firstValueFrom(this.gestionIaService.actualizar(this.presetId(), dto));
        } else {
          await firstValueFrom(
            this.gestionIaService.crear(this.tipoTarea(), dto as ConfiguracionPromptCreate)
          );
        }
        this.guardado.emit();
      } catch (err) {
        // agentes-ia (FastAPI) puede devolver "detail" por defecto, o "mensaje"
        // si tiene un exception handler custom — se cubren ambos casos.
        const body = (err as HttpErrorResponse).error;
        this.errorEnvio.set(
          body?.mensaje ?? body?.detail ?? 'Ocurrió un error al guardar el preset.'
        );
      } finally {
        this.enviando.set(false);
      }
    });
  }
}