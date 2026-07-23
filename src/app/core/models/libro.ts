import { AutorResumenDTO } from './autor';
import { GeneroDTO } from './genero';

export type EstadoLectura = 'LEIDO' | 'LEYENDO' | 'POR_LEER';

export interface LibroDTO {
  titulo: string;
  isbn?: string;
  portadaUrl?: string;
  estado: EstadoLectura;
  autorId: number;
  generoIds?: number[];
}

export interface LibroFiltroDTO {
  estado?: EstadoLectura;
  generoIds?: number[];
  paisAutorId?: number;
  idiomaAutor?: string;
  texto?: string;
}

export interface LibroResponseDTO {
  id: number;
  titulo: string;
  isbn: string;
  portadaUrl: string;
  estado: EstadoLectura;
  autor: AutorResumenDTO;
  generos: GeneroDTO[];
}