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
} from 'ng-apexcharts';
import { ConteoDobleDTO } from '../../../core/models/estadistica';

// Barra de fondo (total) en tono claro, barra superpuesta (leídos) en tono oscuro.
// Cuando destacarTop() > 0, las primeras N barras de "leídos" (los datos ya vienen
// ordenados desc desde el backend) se pintan en ámbar en vez de naranja, para
// remarcar visualmente el top (ej. los 7 autores más leídos).
const COLOR_FONDO = '#fed7aa'; // orange-200
const COLOR_LEIDOS = '#fb923c'; // orange-400
const COLOR_LEIDOS_DESTACADO = '#f59e0b'; // amber-500

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

  // Cuántas de las primeras barras destacar con un color distinto (0 = ninguna).
  // Usado en "por autor" para remarcar el top 7; "por país" no destaca ninguna.
  destacarTop = input<number>(0);

  // Si algún ítem trae cantidadTotal, se dibujan DOS capas superpuestas
  // (fondo = total, encima = leídos, más angosta). Si todos vienen con
  // cantidadTotal null (año filtrado), solo se dibuja la capa de leídos,
  // esta vez sola y con sus propias etiquetas de categoría visibles.
  hayTotal = computed(() => this.datos().some((d) => d.cantidadTotal !== null));

  categorias = computed(() => this.datos().map((d) => d.etiqueta));

  // Máximo común para que las dos capas compartan la misma escala del eje de
  // valores — si no, cada chart de ApexCharts autoescala por su cuenta y las
  // barras dejan de calzar entre sí.
  maximoValor = computed(() =>
    Math.max(...this.datos().map((d) => d.cantidadTotal ?? d.cantidadLeidos), 1)
  );

  // Alto proporcional a la cantidad de ítems, para que cada barra tenga un
  // grosor razonable sin importar si la lista trae 5 o 20 elementos.
  alto = computed(() => Math.max(200, this.datos().length * 40));

  // --- Capa de fondo (total) ---
  seriesFondo = computed<ApexAxisChartSeries>(() => [
    { name: 'Total', data: this.datos().map((d) => d.cantidadTotal ?? 0) },
  ]);

  chartFondo = computed<ApexChart>(() => ({
    type: 'bar',
    height: this.alto(),
    toolbar: { show: false },
    animations: { enabled: false },
  }));

  plotOptionsFondo: ApexPlotOptions = {
    bar: { horizontal: true, barHeight: '70%' },
  };

  coloresFondo = [COLOR_FONDO];

  xaxisFondo = computed<ApexXAxis>(() => ({
    categories: this.categorias(),
    max: this.maximoValor(),
    labels: { show: false },
  }));

  dataLabelsFondo: ApexDataLabels = {
    enabled: true,
    style: { fontSize: '11px', colors: ['#78716c'] },
  };

  // --- Capa de leídos (superpuesta si hayTotal(), o única si no) ---
  seriesLeidos = computed<ApexAxisChartSeries>(() => [
    { name: 'Leídos', data: this.datos().map((d) => d.cantidadLeidos) },
  ]);

  chartLeidos = computed<ApexChart>(() => ({
    type: 'bar',
    height: this.alto(),
    toolbar: { show: false },
    animations: { enabled: false },
    background: 'transparent',
  }));

  // barHeight angosto solo cuando hay una capa de fondo detrás (efecto "adentro").
  // distributed:true habilita colorear cada barra individualmente vía `colores`,
  // necesario para el remarcado de destacarTop().
  plotOptionsLeidos = computed<ApexPlotOptions>(() => ({
    bar: {
      horizontal: true,
      barHeight: this.hayTotal() ? '40%' : '70%',
      distributed: this.destacarTop() > 0,
    },
  }));

  colores = computed<string[]>(() => {
    const top = this.destacarTop();
    if (top <= 0) return [COLOR_LEIDOS];
    return this.datos().map((_, i) => (i < top ? COLOR_LEIDOS_DESTACADO : COLOR_LEIDOS));
  });

  xaxisLeidos = computed<ApexXAxis>(() => ({
    categories: this.categorias(),
    max: this.maximoValor(),
    labels: { show: false },
  }));

  // Etiquetas de categoría (nombres) visibles solo si esta es la única capa
  // (no hay fondo detrás mostrándolas ya).
  yaxisLeidos = computed<ApexYAxis>(() => ({
    labels: { show: !this.hayTotal() },
  }));

  gridOculto: ApexGrid = { show: false };

  dataLabelsLeidos: ApexDataLabels = {
    enabled: true,
    style: { fontSize: '11px', colors: ['#ffffff'] },
  };
}