import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { GestionIaService } from '../../../gestion-ia.service';
import { ConfiguracionPrompt } from '../../../../../core/models/gestion-ia';
import { ConfiguracionPromptForm } from '../../../../../shared/components/configuracion-prompt-form/configuracion-prompt-form';

@Component({
  selector: 'app-sinopsis',
  imports: [ConfiguracionPromptForm],
  templateUrl: './sinopsis.html',
  styleUrl: './sinopsis.scss',
})
export class Sinopsis implements OnInit {
  private gestionIaService = inject(GestionIaService);

  presets = signal<ConfiguracionPrompt[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  // null = formulario oculto, 0 = creación, >0 = edición de ese id.
  presetSeleccionadoId = signal<number | null>(null);
  mostrarFormulario = computed(() => this.presetSeleccionadoId() !== null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.gestionIaService.listar('sinopsis').subscribe({
      next: (presets) => {
        this.presets.set(presets);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los presets de sinopsis.');
        this.cargando.set(false);
      },
    });
  }

  activar(id: number): void {
    this.gestionIaService.activar(id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo activar el preset.'),
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar este preset? Esta acción no se puede deshacer.')) {
      return;
    }
    this.gestionIaService.eliminar(id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo eliminar el preset.'),
    });
  }

  nuevoPreset(): void {
    this.presetSeleccionadoId.set(0);
  }

  editarPreset(id: number): void {
    this.presetSeleccionadoId.set(id);
  }

  cerrarFormulario(): void {
    this.presetSeleccionadoId.set(null);
  }

  onGuardado(): void {
    this.cerrarFormulario();
    this.cargar();
  }
}