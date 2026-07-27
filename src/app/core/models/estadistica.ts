export interface ConteoDTO {
  etiqueta: string;
  cantidad: number;
}

export interface RitmoLecturaDTO {
  totalLibrosConAnio: number;
  cantidadAniosDistintos: number;
  promedioLibrosPorAnio: number | null;
}

export interface ConteoDobleDTO {
  etiqueta: string;
  cantidadTotal: number | null;
  cantidadLeidos: number;
}