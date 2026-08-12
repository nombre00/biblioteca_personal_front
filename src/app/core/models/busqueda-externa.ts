// Modelos para el flujo de búsqueda externa de libros (Google Books).
//
// A diferencia del resto de core/models/ (que habla con el backend Java,
// en camelCase), estos tipos reflejan el schema Pydantic de agentes-ia
// (Python/FastAPI), que usa snake_case sin alias configurado. Se mantienen
// snake_case a propósito para que el nombre del campo en TS sea idéntico
// al nombre real que viaja en el JSON — evita una capa de mapeo que
// duplicaría el mantenimiento cada vez que schema.py cambie.
//
// Excepción: la respuesta de /importar NO sigue este patrón, porque
// agentes-ia la reenvía tal cual desde Java (ver busqueda-libros.service.ts). 

// ==========================================
// 1. Búsqueda (paso 1: /buscar)
// ==========================================

export interface BusquedaLibroRequest {
  query: string;
  max_results?: number; // default 40 en el backend si se omite
  // Offset de paginación (0-based) que se reenvía tal cual a Google Books.
  // start_index = (pagina - 1) * max_results. Default 0 en el backend si se omite.
  start_index?: number;
}

export interface LibroExternoResponse {
  google_id: string;
  titulo: string;
  autores: string[];
  idioma?: string | null;
  categorias: string[];
  anio_publicacion?: number | null;
  descripcion?: string;
  portada_url?: string;
  isbn?: string | null;
}

// Envoltorio de la respuesta de /buscar: la página actual de resultados
// más el total real que reporta Google Books para la query completa (no
// la cantidad de items en esta página). total_items se usa para calcular
// cuántas páginas hay disponibles.
export interface BusquedaLibrosResponse {
  items: LibroExternoResponse[];
  total_items: number;
}

// ==========================================
// 2. Datos "nuevo" de País / Género / Autor
// ==========================================

export interface PaisCreateSchema {
  nombre: string;
}

export interface GeneroCreateSchema {
  nombre: string;
  icono_slug?: string | null;
}

export interface AutorCreateSchema {
  nombre: string;
  idioma?: string | null;
  pais?: PaisResolucion | null;
  retrato_url?: string | null;
  fecha_nacimiento?: string | null; // ISO date (yyyy-MM-dd)
  anio_nacimiento_aprox?: number | null;
  fecha_defuncion?: string | null;
  anio_defuncion_aprox?: number | null;
}

// ==========================================
// 3. Resoluciones: existente vs. nuevo (uniones discriminadas por "tipo")
// ==========================================

export interface PaisResolucionExistente {
  tipo: 'existente';
  pais_id: number;
  nombre: string;
}

export interface PaisResolucionNueva {
  tipo: 'nuevo';
  datos: PaisCreateSchema;
}

export type PaisResolucion = PaisResolucionExistente | PaisResolucionNueva;

export interface GeneroResolucionExistente {
  tipo: 'existente';
  genero_id: number;
  nombre: string;
}

export interface GeneroResolucionNueva {
  tipo: 'nuevo';
  datos: GeneroCreateSchema;
}

export type GeneroResolucion = GeneroResolucionExistente | GeneroResolucionNueva;

export interface AutorResolucionExistente {
  tipo: 'existente';
  autor_id: number;
  nombre: string;
}

export interface AutorResolucionNueva {
  tipo: 'nuevo';
  datos: AutorCreateSchema;
}

export interface AutorResolucionPendiente {
  tipo: 'requiere_confirmacion';
  autor_id_candidato: number;
  nombre_candidato: string;
  datos_si_es_nuevo: AutorCreateSchema;
  motivo: string; 
}

export type AutorResolucion =
  | AutorResolucionExistente
  | AutorResolucionNueva
  | AutorResolucionPendiente;

// ==========================================
// 4. Endpoint intermedio: resolución (paso 2: /resolver)
// ==========================================

export interface ResolverLibroRequest {
  titulo: string;
  autor_nombre: string;
  idioma?: string | null;
  categorias: string[];
  anio_publicacion?: number | null;
  descripcion?: string;
  portada_url?: string;
  isbn?: string | null;
}

export interface ResolverLibroResponse {
  titulo: string;
  anio_publicacion?: number | null;
  descripcion?: string;
  portada_url?: string;
  isbn?: string | null;
  autor: AutorResolucion;
  generos: GeneroResolucion[];
}

// ==========================================
// 5. Importación final (paso 3: /importar)
// ==========================================

export interface AutorImportSchema {
  autor_id?: number;
  datos?: AutorCreateSchema;
}

export interface GeneroImportSchema {
  genero_id?: number;
  datos?: GeneroCreateSchema;
}

export interface ImportarLibroRequest {
  titulo: string;
  anio_publicacion?: number | null;
  descripcion?: string;
  portada_url?: string;
  isbn?: string | null;
  estado: string;
  // Lectura personal — opcionales, se llenan solo si el usuario ya leyó
  // el libro que está importando. Mismo criterio que anio_publicacion:
  // se omiten del payload si quedan vacíos (undefined, no null vacío).
  anio_lectura?: number;
  fecha_inicio?: string; // ISO date (yyyy-MM-dd)
  fecha_termino?: string; // ISO date (yyyy-MM-dd)
  autor: AutorImportSchema;
  generos: GeneroImportSchema[];
}