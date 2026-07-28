import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SugerenciaLibroDTO } from '../../core/models/recomendacion';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/api/recomendaciones`;

  obtenerPorAutorPendiente(): Observable<SugerenciaLibroDTO[]> {
    return this.http.get<SugerenciaLibroDTO[]>(`${this.baseUrl}/por-autor-pendiente`);
  }
}