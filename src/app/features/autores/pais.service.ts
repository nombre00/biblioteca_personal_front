import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaisDTO } from '../../core/models/pais';

@Injectable({
  providedIn: 'root'
})
export class PaisService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/api/paises`;

  listarTodos(): Observable<PaisDTO[]> {
    return this.http.get<PaisDTO[]>(this.baseUrl);
  }

  crear(dto: PaisDTO): Observable<PaisDTO> {
    return this.http.post<PaisDTO>(this.baseUrl, dto);
  }
}