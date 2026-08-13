import { Component, inject, input, output, signal } from '@angular/core';
import { GeneroService } from '../../../../libros/genero.service';
import { ConteoDTO } from '../../../../../core/models/estadistica';
import { GraficoTreemap } from '../../../../../shared/graficos/grafico-treemap/grafico-treemap';

@Component({
  selector: 'app-estadistica-por-genero',
  imports: [GraficoTreemap],
  templateUrl: './estadistica-por-genero.html',
})
export class EstadisticaPorGenero {
  private generoService = inject(GeneroService);

  porGenero = input.required<ConteoDTO[]>();
  anios = input.required<ConteoDTO[]>();
  anioCambiado = output<string>();

  // Mapa nombre de género -> iconoSlug. Antes vivía en Dashboard; se movió acá
  // porque es un dato exclusivo de esta tab y no depende del año seleccionado.
  private iconosPorGenero = signal<Map<string, string | undefined>>(new Map());

  constructor() {
    this.generoService.listarTodos().subscribe({
      next: (generos) => {
        const mapa = new Map<string, string | undefined>();
        for (const g of generos) {
          mapa.set(g.nombre, g.iconoSlug);
        }
        this.iconosPorGenero.set(mapa);
      },
      error: () => this.iconosPorGenero.set(new Map()),
    });
  }

  iconoGenero(nombreGenero: string): string | undefined {
    return this.iconosPorGenero().get(nombreGenero);
  }

  anchoBarra(cantidad: number, lista: ConteoDTO[]): number {
    const maximo = Math.max(...lista.map((c) => c.cantidad), 1);
    return (cantidad / maximo) * 100;
  }
}