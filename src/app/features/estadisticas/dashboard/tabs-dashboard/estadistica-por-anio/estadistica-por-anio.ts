import { Component, input } from '@angular/core';
import { ConteoDTO } from '../../../../../core/models/estadistica';
import { GraficoPie } from '../../../../../shared/graficos/grafico-pie/grafico-pie';
import { GraficoLineas } from '../../../../../shared/graficos/grafico-lineas/grafico-lineas';

@Component({
  selector: 'app-estadistica-por-anio',
  imports: [GraficoPie, GraficoLineas],
  templateUrl: './estadistica-por-anio.html',
})
export class EstadisticaPorAnio {
  porEstado = input.required<ConteoDTO[]>();
  porAnioLectura = input.required<ConteoDTO[]>();
}