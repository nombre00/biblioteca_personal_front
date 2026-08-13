import { Component, computed, input } from '@angular/core';
import {
  NgApexchartsModule,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexPlotOptions,
  ApexDataLabels,
  ApexGrid,
  ApexAnnotations,
} from 'ng-apexcharts';
import { ConteoDobleDTO } from '../../../core/models/estadistica';

// Barra apilada: "Leídos" (oscuro) + "Restante" (claro, = total - leídos)
// en un solo chart, así ambas series comparten exactamente el mismo layout
// interno (sin riesgo de desalineación entre capas).
// Cuando destacarTop() > 0, las primeras N filas (los datos ya vienen
// ordenados desc desde el backend) se resaltan con una banda de fondo
// sutil detrás de toda la fila, en vez de colorear la barra (distributed
// no es compatible con stacked en ApexCharts).
const COLOR_LEIDOS = '#4791db'; // orange-400
const COLOR_RESTANTE = '#cfcd44'; // orange-200
const COLOR_BANDA_DESTACADO = 'rgba(245, 158, 11, 0.12)'; // amber-500 muy suave

@Component({
  selector: 'app-grafico-barras',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './grafico-barras.html',
})
export class GraficoBarras {
  // Datos crudos (ej. dashboard con porAutor()/porPais()).
  // Se asume ya ordenados desc por relevancia (así los entrega el backend).
  datos = input.required<ConteoDobleDTO[]>();

  // Cuántas de las primeras filas destacar con una banda de fondo (0 = ninguna).
  // Usado en "por autor" para remarcar el top 7; "por país" no destaca ninguna.
  destacarTop = input<number>(0);

  categorias = computed(() => this.datos().map((d) => d.etiqueta));

  // Máximo del eje: usa cantidadTotal cuando existe, o cantidadLeidos si no
  // (año filtrado, sin segunda serie).
  maximoValor = computed(() =>
    Math.max(...this.datos().map((d) => d.cantidadTotal ?? d.cantidadLeidos), 1)
  );

  // Alto proporcional a la cantidad de ítems, para que cada fila tenga un
  // grosor razonable sin importar si la lista trae 5 o 20 elementos.
  alto = computed(() => Math.max(200, this.datos().length * 40));

  series = computed<ApexAxisChartSeries>(() => [
    {
      name: 'Leídos',
      data: this.datos().map((d) => d.cantidadLeidos),
    },
    {
      name: 'Por leer',
      data: this.datos().map((d) =>
        d.cantidadTotal !== null ? d.cantidadTotal - d.cantidadLeidos : 0
      ),
    },
  ]);

  chart = computed<ApexChart>(() => ({
    type: 'bar',
    height: this.alto(),
    stacked: true,
    toolbar: { show: false },
    animations: { enabled: false },
  }));

  plotOptions: ApexPlotOptions = {
    bar: { horizontal: true, barHeight: '70%' },
  };

  colores = [COLOR_LEIDOS, COLOR_RESTANTE];

  xaxis = computed<ApexXAxis>(() => ({
    categories: this.categorias(),
    max: this.maximoValor(),
  }));

  yaxis: ApexYAxis = {
    labels: { show: true },
  };

  grid: ApexGrid = { show: false };

  // Solo la serie "Leídos" lleva número visible dentro de la barra;
  // "Restante" no muestra dataLabel (evita ruido con el total ya visible
  // como largo total de la barra apilada).
  dataLabels = computed<ApexDataLabels>(() => ({
    enabled: true,
    enabledOnSeries: [0],
    style: { fontSize: '11px', colors: ['#ffffff'] },
  }));

  // Banda de fondo detrás de cada fila del top N. Se define como anotación
  // de xaxis (eje de categorías en horizontal bar) con x = x2 = la misma
  // categoría, lo que ApexCharts expande al ancho completo de esa fila.
  annotations = computed<ApexAnnotations>(() => {
    const top = this.destacarTop();
    if (top <= 0) return {};
    const cats = this.categorias().slice(0, top);
    return {
      xaxis: cats.map((cat) => ({
        x: cat,
        x2: cat,
        fillColor: COLOR_BANDA_DESTACADO,
        opacity: 1,
      })),
    };
  });
}