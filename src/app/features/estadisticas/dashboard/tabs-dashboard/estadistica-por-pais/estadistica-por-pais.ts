import { Component, input, output } from '@angular/core';
import { ConteoDTO, ConteoDobleDTO } from '../../../../../core/models/estadistica';
import { GraficoBarras } from '../../../../../shared/graficos/grafico-barras/grafico-barras';

@Component({
  selector: 'app-estadistica-por-pais',
  imports: [GraficoBarras],
  templateUrl: './estadistica-por-pais.html',
})
export class EstadisticaPorPais {
  porPais = input.required<ConteoDobleDTO[]>();
  anios = input.required<ConteoDTO[]>();
  anioCambiado = output<string>();
}