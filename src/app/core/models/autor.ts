import { PaisDTO } from './pais';

// Lo que se envía al crear/editar
export interface AutorDTO {
  nombre: string;
  idioma?: string;
  paisId: number;
}

// Lo que se recibe con detalle completo
export interface AutorResponseDTO {
  id: number;
  nombre: string;
  idioma: string;
  pais: PaisDTO;
}

// Versión resumida/aplanada
export interface AutorResumenDTO {
  id: number;
  nombre: string;
  idioma: string;
  paisNombre: string;
}