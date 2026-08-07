import { Injectable, inject } from '@angular/core';
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
} from '../../core/models/busqueda-externa';

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
}