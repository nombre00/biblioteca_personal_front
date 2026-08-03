import { Component, computed, input } from '@angular/core';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
} from 'ng-apexcharts';
import { ConteoDTO } from '../../../core/models/estadistica';

@Component({
  selector: 'app-grafico-lineas',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './grafico-lineas.html',
  styleUrl: './grafico-lineas.scss',
})
export class GraficoLineas {
  // Datos crudos que llegan desde la página que lo use (ej. dashboard con porAnioLectura()).
  // Se asume ya ordenados ascendente por año (así lo entrega el backend).
  datos = input.required<ConteoDTO[]>();

  // ApexAxisChartSeries pide un array de series, cada una con su nombre y sus valores.
  // Acá solo hay una serie ("Libros leídos"), con un valor por año.
  series = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Libros leídos',
      data: this.datos().map((d) => d.cantidad),
    },
  ]);

  // Las etiquetas del eje X son los años (la 'etiqueta' de cada ConteoDTO).
  xaxis = computed<ApexXAxis>(() => ({
    categories: this.datos().map((d) => d.etiqueta),
  }));

  chart: ApexChart = {
    type: 'line',
    height: 320,
    toolbar: { show: false },
  };

  stroke: ApexStroke = {
    curve: 'smooth',
    width: 3,
  };

  dataLabels: ApexDataLabels = {
    enabled: false,
  };
}