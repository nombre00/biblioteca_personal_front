export interface ResumenRequest {
  titulo_libro: string;
  nombre_autor: string;
  genero?: string;
}

export interface ResumenResponse {
  libro_id: number;
  texto: string;
  modelo_usado: string;
  fecha_generacion: string;
}