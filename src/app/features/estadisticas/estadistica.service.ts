import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConteoDTO, RitmoLecturaDTO } from '../../core/models/estadistica';

@Injectable({
  providedIn: 'root'
})
export class EstadisticaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/api/estadisticas`;

  obtenerConteoPorEstado(): Observable<ConteoDTO[]> {
    return this.http.get<ConteoDTO[]>(`${this.baseUrl}/por-estado`);
  }

  obtenerConteoPorGenero(): Observable<ConteoDTO[]> {
    return this.http.get<ConteoDTO[]>(`${this.baseUrl}/por-genero`);
  }

  obtenerConteoPorAnioLectura(): Observable<ConteoDTO[]> {
    return this.http.get<ConteoDTO[]>(`${this.baseUrl}/por-anio-lectura`);
  }

  obtenerRitmoLectura(): Observable<RitmoLecturaDTO> {
    return this.http.get<RitmoLecturaDTO>(`${this.baseUrl}/ritmo-lectura`);
  }
}