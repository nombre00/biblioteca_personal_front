import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutorDTO, AutorResponseDTO } from '../../core/models/autor';

@Injectable({
  providedIn: 'root'
})
export class AutorService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/api/autores`;

  listarTodos(): Observable<AutorResponseDTO[]> {
    return this.http.get<AutorResponseDTO[]>(this.baseUrl);
  }

  buscarPorId(id: number): Observable<AutorResponseDTO> {
    return this.http.get<AutorResponseDTO>(`${this.baseUrl}/${id}`);
  }

  crear(dto: AutorDTO): Observable<AutorResponseDTO> {
    return this.http.post<AutorResponseDTO>(this.baseUrl, dto);
  }

  actualizar(id: number, dto: AutorDTO): Observable<AutorResponseDTO> {
    return this.http.put<AutorResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}