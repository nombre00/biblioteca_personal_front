export interface ConteoDTO {
  etiqueta: string;
  cantidad: number;
}

export interface RitmoLecturaDTO {
  totalLibrosConAnio: number;
  cantidadAniosDistintos: number;
  promedioLibrosPorAnio: number | null;
}