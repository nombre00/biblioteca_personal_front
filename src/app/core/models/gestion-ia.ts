export type TipoTareaIa = 'sinopsis' | 'biografia';

export interface LineaPrompt {
  id: number;
  orden: number;
  texto: string;
}

export interface LineaPromptCreate {
  texto: string;
}

export interface ConfiguracionPrompt {
  id: number;
  tipo_tarea: string;
  nombre: string;
  es_default: boolean;
  activa: boolean;
  limite_parrafos: number;
  evitar_spoilers: boolean | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  lineas: LineaPrompt[];
}

export interface ConfiguracionPromptCreate {
  nombre: string;
  limite_parrafos: number;
  evitar_spoilers?: boolean | null;
  lineas: LineaPromptCreate[];
}

export interface ConfiguracionPromptUpdate {
  nombre?: string;
  limite_parrafos?: number;
  evitar_spoilers?: boolean | null;
  lineas?: LineaPromptCreate[];
}

export interface PruebaPromptRequest {
  nombre_autor?: string;
  nacionalidad?: string;
  anio_nacimiento?: number;
  anio_defuncion?: number;
  titulo_libro?: string;
  genero?: string;
  limite_parrafos: number;
  evitar_spoilers?: boolean | null;
  lineas: LineaPromptCreate[];
}

export interface PruebaPromptResponse {
  prompt: string;
  texto_generado: string;
}