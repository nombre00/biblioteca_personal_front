import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LibroDTO, LibroFiltroDTO, LibroResponseDTO } from '../../core/models/libro';

@Injectable({
  providedIn: 'root'
})
export class LibroService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/api/libros`;

  listarTodos(): Observable<LibroResponseDTO[]> {
    return this.http.get<LibroResponseDTO[]>(this.baseUrl);
  }

  buscarConFiltros(filtro: LibroFiltroDTO): Observable<LibroResponseDTO[]> {
    let params = new HttpParams();

    if (filtro.estado) {
      params = params.set('estado', filtro.estado);
    }
    if (filtro.paisAutorId != null) {
      params = params.set('paisAutorId', filtro.paisAutorId);
    }
    if (filtro.idiomaAutor) {
      params = params.set('idiomaAutor', filtro.idiomaAutor);
    }
    if (filtro.texto) {
      params = params.set('texto', filtro.texto);
    }
    if (filtro.generoIds && filtro.generoIds.length > 0) {
      for (const id of filtro.generoIds) {
        params = params.append('generoIds', id);
      }
    }

    return this.http.get<LibroResponseDTO[]>(`${this.baseUrl}/buscar`, { params });
  }

  buscarPorId(id: number): Observable<LibroResponseDTO> {
    return this.http.get<LibroResponseDTO>(`${this.baseUrl}/${id}`);
  }

  crear(dto: LibroDTO): Observable<LibroResponseDTO> {
    return this.http.post<LibroResponseDTO>(this.baseUrl, dto);
  }

  actualizar(id: number, dto: LibroDTO): Observable<LibroResponseDTO> {
    return this.http.put<LibroResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}