import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GeneroDTO } from '../../core/models/genero';

@Injectable({
  providedIn: 'root'
})
export class GeneroService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/api/generos`;

  listarTodos(): Observable<GeneroDTO[]> {
    return this.http.get<GeneroDTO[]>(this.baseUrl);
  }

  crear(dto: GeneroDTO): Observable<GeneroDTO> {
    return this.http.post<GeneroDTO>(this.baseUrl, dto);
  }
}