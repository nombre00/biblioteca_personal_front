import { Component, computed, input } from '@angular/core';
import {
  NgApexchartsModule,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexDataLabels,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { ConteoDTO } from '../../../core/models/estadistica';

@Component({
  selector: 'app-grafico-treemap',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './grafico-treemap.html',
  styleUrl: './grafico-treemap.scss',
})
export class GraficoTreemap {
  // Datos crudos que llegan desde la página que lo use (ej. dashboard con porGenero()).
  datos = input.required<ConteoDTO[]>();

  // El treemap de Apex pide una sola serie, cuya 'data' es un array de puntos {x, y}:
  // x = etiqueta de la celda, y = valor que determina su tamaño.
  series = computed<ApexNonAxisChartSeries>(() => [
    {
      data: this.datos().map((d) => ({ x: d.etiqueta, y: d.cantidad })),
    },
  ] as unknown as ApexNonAxisChartSeries);

  chart: ApexChart = {
    type: 'treemap',
    height: 500,
    toolbar: { show: false },
  };

  dataLabels: ApexDataLabels = {
    enabled: true,
    style: {
      fontSize: '13px',
    },
  };

  // distributed: cada celda toma un color distinto de la paleta por defecto de Apex,
  // en vez de que todas compartan un único color con solo variación de intensidad.
  plotOptions: ApexPlotOptions = {
    treemap: {
      distributed: true,
      enableShades: false,
    },
  };
}