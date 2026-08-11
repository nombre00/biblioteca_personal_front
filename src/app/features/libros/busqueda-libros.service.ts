import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LibroResponseDTO } from '../../core/models/libro';
import {
  BusquedaLibroRequest,
  BusquedaLibrosResponse,
  LibroExternoResponse,
  ResolverLibroRequest,
  ResolverLibroResponse,
  ImportarLibroRequest,
  AutorResolucionExistente,
  AutorResolucionNueva,
} from '../../core/models/busqueda-externa';

// Autor ya decidido (nunca "requiere_confirmacion" — ese estado se resuelve
// en la página de búsqueda antes de guardar la selección).
export type AutorResueltoFinal = AutorResolucionExistente | AutorResolucionNueva;

export interface SeleccionParaImportar {
  resolucion: ResolverLibroResponse;
  autor: AutorResueltoFinal;
}

@Injectable({
  providedIn: 'root',
})
export class BusquedaLibrosService {
  private http = inject(HttpClient);

  // A diferencia de LibroService (que habla con Java, en camelCase), este
  // servicio habla con agentes-ia (Python/FastAPI). El request y la
  // respuesta de /buscar y /resolver van en snake_case, tal cual está
  // definido en busqueda-externa.ts — no hay traducción de nombres acá.
  private baseUrl = `${environment.gatewayUrl}/busqueda-libros`;

  buscar(request: BusquedaLibroRequest): Observable<BusquedaLibrosResponse> {
    return this.http.post<BusquedaLibrosResponse>(`${this.baseUrl}/buscar`, request);
  }

  resolver(request: ResolverLibroRequest): Observable<ResolverLibroResponse> {
    return this.http.post<ResolverLibroResponse>(`${this.baseUrl}/resolver`, request);
  }

  // Ojo: la respuesta de /importar es la excepción. agentes-ia no arma un
  // schema propio para esto, reenvía tal cual el JSON que devuelve Java
  // (ver service.py -> importar_libro -> respuesta.json()). Por eso el
  // tipo de retorno es LibroResponseDTO (camelCase), no un tipo nuevo.
  importar(request: ImportarLibroRequest): Observable<LibroResponseDTO> {
    return this.http.post<LibroResponseDTO>(`${this.baseUrl}/importar`, request);
  }

  // ==========================================
  // Estado de la búsqueda activa (query, resultados, paginación)
  // ==========================================
  //
  // Vive acá (no en el componente Buscar) para sobrevivir la navegación
  // ida y vuelta a /libros/buscar/importar: si el usuario cancela una
  // importación y vuelve a /libros/buscar, ve la misma página de
  // resultados en la que se había quedado, sin tener que rebuscar.
  //
  // Igual que seleccionActual más abajo: en memoria nada más (sin
  // localStorage/sessionStorage), se pierde solo si se recarga la pestaña.
  private _query = signal('');
  private _resultados = signal<LibroExternoResponse[]>([]);
  private _totalItems = signal(0);
  private _paginaActual = signal(1);
  private _busquedaRealizada = signal(false); // distingue "0 resultados" de "aún no se buscó"

  readonly query = this._query.asReadonly();
  readonly resultados = this._resultados.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly paginaActual = this._paginaActual.asReadonly();
  readonly busquedaRealizada = this._busquedaRealizada.asReadonly();

  guardarResultadosBusqueda(
    query: string,
    pagina: number,
    respuesta: BusquedaLibrosResponse
  ): void {
    this._query.set(query);
    this._paginaActual.set(pagina);
    this._resultados.set(respuesta.items);
    this._totalItems.set(respuesta.total_items);
    this._busquedaRealizada.set(true);
  }

  limpiarBusqueda(): void {
    this._query.set('');
    this._resultados.set([]);
    this._totalItems.set(0);
    this._paginaActual.set(1);
    this._busquedaRealizada.set(false);
  }

  // ==========================================
  // Estado compartido entre /libros/buscar y /libros/buscar/importar
  // ==========================================
  //
  // Guarda la resolución ya calculada (y el autor ya decidido, incluso si
  // pasó por el paso de confirmación de autor dudoso) para que la página
  // de confirmación no tenga que volver a llamar /resolver.
  //
  // Vive en memoria nada más (signal en un servicio root, sin persistencia
  // en localStorage/sessionStorage): se pierde si el usuario recarga la
  // página de confirmación directamente. Ese caso se maneja redirigiendo
  // de vuelta a /libros/buscar (ver ConfirmarImportar.ngOnInit). 
  private seleccionActual = signal<SeleccionParaImportar | null>(null);

  guardarSeleccion(seleccion: SeleccionParaImportar): void {
    this.seleccionActual.set(seleccion);
  }

  obtenerSeleccion(): SeleccionParaImportar | null {
    return this.seleccionActual();
  }

  limpiarSeleccion(): void {
    this.seleccionActual.set(null);
  }
}