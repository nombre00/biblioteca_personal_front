import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LibroResponseDTO } from '../../core/models/libro';
import {
  BusquedaLibroRequest,
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

  buscar(request: BusquedaLibroRequest): Observable<LibroExternoResponse[]> {
    return this.http.post<LibroExternoResponse[]>(`${this.baseUrl}/buscar`, request);
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