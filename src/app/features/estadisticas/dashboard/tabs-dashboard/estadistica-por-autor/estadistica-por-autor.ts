import { Component, input, output } from '@angular/core';
import { ConteoDTO, ConteoDobleDTO } from '../../../../../core/models/estadistica';
import { GraficoBarras } from '../../../../../shared/graficos/grafico-barras/grafico-barras';

@Component({
  selector: 'app-estadistica-por-autor',
  imports: [GraficoBarras],
  templateUrl: './estadistica-por-autor.html',
})
export class EstadisticaPorAutor {
  porAutor = input.required<ConteoDobleDTO[]>();
  anios = input.required<ConteoDTO[]>();
  anioCambiado = output<string>();
}