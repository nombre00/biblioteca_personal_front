import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { form, FormField, submit, required } from '@angular/forms/signals';

import { GestionIaService } from '../../../features/gestion-ia/gestion-ia.service';
import { AutorService } from '../../../features/autores/autor.service';
import { LibroService } from '../../../features/libros/libro.service';
import { ResumenService } from '../../../features/libros/resumen.service';
import { BiografiaService } from '../../../features/autores/biografia.service';
import { AutorResponseDTO } from '../../../core/models/autor';
import { LibroResponseDTO } from '../../../core/models/libro';
import { ResumenResponse } from '../../../core/models/resumen';
import { BiografiaResponse } from '../../../core/models/biografia';
import {
  ConfiguracionPromptCreate,
  ConfiguracionPromptUpdate,
  PruebaPromptRequest,
  PruebaPromptResponse,
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
  private autorService = inject(AutorService);
  private libroService = inject(LibroService);
  private resumenService = inject(ResumenService);
  private biografiaService = inject(BiografiaService);

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

  // Datos para el panel de prueba: selección de autor/libro real según la tarea.
  autores = signal<AutorResponseDTO[]>([]);
  libros = signal<LibroResponseDTO[]>([]);
  cargandoOpciones = signal(false);
  autorSeleccionadoId = signal<number | null>(null);
  libroSeleccionadoId = signal<number | null>(null);

  autorSeleccionado = computed(() =>
    this.autores().find((a) => a.id === this.autorSeleccionadoId()) ?? null
  );
  libroSeleccionado = computed(() =>
    this.libros().find((l) => l.id === this.libroSeleccionadoId()) ?? null
  );

  // Versión ya guardada del autor/libro seleccionado, para comparar contra la
  // nueva generada con el borrador actual. null = sin versión guardada aún.
  textoGuardadoComparacion = signal<ResumenResponse | BiografiaResponse | null>(null);
  cargandoGuardado = signal(false);

  probando = signal(false);
  errorProbar = signal<string | null>(null);
  resultadoPrueba = signal<PruebaPromptResponse | null>(null);

  // Estado del botón "Adoptar este texto": sobrescribe la versión guardada
  // con el resultado de "Probar", sin volver a llamar a Wikipedia/Gemini.
  adoptando = signal(false);
  errorAdoptar = signal<string | null>(null);

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
      this.errorProbar.set(null);
      this.resultadoPrueba.set(null);
      this.errorAdoptar.set(null);

      // Cambiar de preset invalida cualquier selección/comparación previa del panel de prueba.
      this.autorSeleccionadoId.set(null);
      this.libroSeleccionadoId.set(null);
      this.textoGuardadoComparacion.set(null);

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

    // Carga autores/libros reales para el panel de prueba, según la tarea.
    // Depende solo de tipoTarea(), no de presetId(): se carga una sola vez
    // al montar el formulario, no en cada cambio de preset seleccionado.
    effect(() => {
      const tarea = this.tipoTarea();
      this.cargandoOpciones.set(true);

      if (tarea === 'biografia') {
        this.autorService.listarTodos().subscribe({
          next: (autores) => {
            this.autores.set(autores);
            this.cargandoOpciones.set(false);
          },
          error: () => this.cargandoOpciones.set(false),
        });
      } else {
        this.libroService.listarTodos().subscribe({
          next: (libros) => {
            this.libros.set(libros);
            this.cargandoOpciones.set(false);
          },
          error: () => this.cargandoOpciones.set(false),
        });
      }
    });

    // Al elegir un autor/libro, busca de inmediato su versión ya guardada
    // (solo lectura, no genera nada) para poder mostrarla en la comparación
    // aunque el usuario todavía no haya presionado "Probar".
    effect(() => {
      const tarea = this.tipoTarea();
      const autorId = this.autorSeleccionadoId();
      const libroId = this.libroSeleccionadoId();

      this.textoGuardadoComparacion.set(null);
      this.resultadoPrueba.set(null);
      this.errorProbar.set(null);
      this.errorAdoptar.set(null);

      if (tarea === 'biografia' && autorId != null) {
        this.cargandoGuardado.set(true);
        this.biografiaService.obtenerGuardado(autorId).subscribe({
          next: (r) => {
            this.textoGuardadoComparacion.set(r);
            this.cargandoGuardado.set(false);
          },
          error: () => this.cargandoGuardado.set(false),
        });
      } else if (tarea === 'sinopsis' && libroId != null) {
        this.cargandoGuardado.set(true);
        this.resumenService.obtenerGuardado(libroId).subscribe({
          next: (r) => {
            this.textoGuardadoComparacion.set(r);
            this.cargandoGuardado.set(false);
          },
          error: () => this.cargandoGuardado.set(false),
        });
      }
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

  onAutorSeleccionado(value: string): void {
    this.autorSeleccionadoId.set(value ? Number(value) : null);
  }

  onLibroSeleccionado(value: string): void {
    this.libroSeleccionadoId.set(value ? Number(value) : null);
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

  async probar(): Promise<void> {
    this.errorProbar.set(null);
    this.resultadoPrueba.set(null);
    this.errorAdoptar.set(null);

    const limiteParrafos = Number(this.model().limiteParrafos);
    if (!limiteParrafos) {
      this.errorProbar.set('Define un límite de párrafos antes de probar.');
      return;
    }

    let datos: PruebaPromptRequest;

    if (this.tipoTarea() === 'biografia') {
      const autor = this.autorSeleccionado();
      if (!autor) {
        this.errorProbar.set('Selecciona un autor para probar.');
        return;
      }
      datos = {
        nombre_autor: autor.nombre,
        nacionalidad: autor.pais?.nombre,
        anio_nacimiento: autor.anioNacimientoAprox ?? this.extraerAnio(autor.fechaNacimiento),
        anio_defuncion: autor.anioDefuncionAprox ?? this.extraerAnio(autor.fechaDefuncion),
        limite_parrafos: limiteParrafos,
        lineas: this.lineas().map((texto) => ({ texto })),
      };
    } else {
      const libro = this.libroSeleccionado();
      if (!libro) {
        this.errorProbar.set('Selecciona un libro para probar.');
        return;
      }
      datos = {
        titulo_libro: libro.titulo,
        nombre_autor: libro.autor.nombre,
        genero: libro.generos[0]?.nombre,
        limite_parrafos: limiteParrafos,
        evitar_spoilers: this.evitarSpoilers(),
        lineas: this.lineas().map((texto) => ({ texto })),
      };
    }

    this.probando.set(true);
    try {
      const resultado = await firstValueFrom(this.gestionIaService.probar(this.tipoTarea(), datos));
      this.resultadoPrueba.set(resultado);
    } catch (err) {
      const body = (err as HttpErrorResponse).error;
      this.errorProbar.set(body?.mensaje ?? body?.detail ?? 'Ocurrió un error al probar el prompt.');
    } finally {
      this.probando.set(false);
    }
  }

  async adoptarTexto(): Promise<void> {
    const resultado = this.resultadoPrueba();
    if (!resultado) return;

    const autorId = this.autorSeleccionadoId();
    const libroId = this.libroSeleccionadoId();

    const confirmado = confirm(
      'Esto reemplazará el texto guardado actualmente (usado en producción) por el generado en esta prueba. ¿Continuar?'
    );
    if (!confirmado) return;

    this.errorAdoptar.set(null);
    this.adoptando.set(true);

    try {
      if (this.tipoTarea() === 'biografia' && autorId != null) {
        const actualizado = await firstValueFrom(
          this.biografiaService.adoptar(autorId, resultado.texto_generado)
        );
        this.textoGuardadoComparacion.set(actualizado);
      } else if (this.tipoTarea() === 'sinopsis' && libroId != null) {
        const actualizado = await firstValueFrom(
          this.resumenService.adoptar(libroId, resultado.texto_generado)
        );
        this.textoGuardadoComparacion.set(actualizado);
      }
    } catch (err) {
      const body = (err as HttpErrorResponse).error;
      this.errorAdoptar.set(
        body?.mensaje ?? body?.detail ?? 'Ocurrió un error al adoptar el texto.'
      );
    } finally {
      this.adoptando.set(false);
    }
  }

  private extraerAnio(fecha?: string): number | undefined {
    return fecha ? new Date(fecha).getFullYear() : undefined;
  }
}