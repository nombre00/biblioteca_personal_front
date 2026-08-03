import { Component, computed, input } from '@angular/core';
import {
  NgApexchartsModule,
  ApexChart,
  ApexNonAxisChartSeries,
  ApexLegend,
  ApexDataLabels,
} from 'ng-apexcharts';
import { ConteoDTO } from '../../../core/models/estadistica';

// Traducción de los valores del enum de estado (backend) a texto legible.
const ETIQUETAS_ESTADO: Record<string, string> = {
  LEIDO: 'Leído',
  LEYENDO: 'Leyendo',
  POR_LEER: 'Por leer',
};

@Component({
  selector: 'app-grafico-pie',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './grafico-pie.html',
  styleUrl: './grafico-pie.scss',
})
export class GraficoPie {
  // Datos crudos que llegan desde la página que lo use (ej. dashboard con porEstado()).
  datos = input.required<ConteoDTO[]>();

  // Transformación a lo que pide ApexCharts: dos arrays paralelos (valores y etiquetas).
  series = computed<ApexNonAxisChartSeries>(() =>
    this.datos().map((d) => d.cantidad)
  );

  labels = computed<string[]>(() =>
    this.datos().map((d) => ETIQUETAS_ESTADO[d.etiqueta] ?? d.etiqueta)
  );

  // Configuración fija del gráfico (paleta por defecto de Apex, por ahora).
  chart: ApexChart = {
    type: 'pie',
    height: 320,
  };

  legend: ApexLegend = {
    position: 'bottom',
  };

  dataLabels: ApexDataLabels = {
    enabled: true,
  };
}