// biografia.model.ts

export interface BiografiaRequest {
  nombre_autor: string;
  nacionalidad?: string | null;
  anio_nacimiento?: number | null;
  anio_defuncion?: number | null;
}

export interface BiografiaResponse {
  autor_id: number;
  texto: string;
  modelo_usado: string;
  fecha_generacion: string; // ISO 8601 string; Angular no deserializa automáticamente a Date
}