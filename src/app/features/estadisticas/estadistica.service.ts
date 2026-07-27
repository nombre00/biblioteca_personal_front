import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConteoDTO, ConteoDobleDTO, RitmoLecturaDTO } from '../../core/models/estadistica';

@Injectable({
  providedIn: 'root'
})
export class EstadisticaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/api/estadisticas`;

  obtenerConteoPorEstado(): Observable<ConteoDTO[]> {
    return this.http.get<ConteoDTO[]>(`${this.baseUrl}/por-estado`);
  }

  obtenerConteoPorAnioLectura(): Observable<ConteoDTO[]> {
    return this.http.get<ConteoDTO[]>(`${this.baseUrl}/por-anio-lectura`);
  }

  obtenerRitmoLectura(): Observable<RitmoLecturaDTO> {
    return this.http.get<RitmoLecturaDTO>(`${this.baseUrl}/ritmo-lectura`);
  }

  obtenerConteoPorGenero(anio?: number): Observable<ConteoDTO[]> {
    let params = new HttpParams();
    if (anio != null) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<ConteoDTO[]>(`${this.baseUrl}/por-genero`, { params });
  }

  obtenerConteoPorAutor(anio?: number): Observable<ConteoDobleDTO[]> {
    let params = new HttpParams();
    if (anio != null) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<ConteoDobleDTO[]>(`${this.baseUrl}/por-autor`, { params });
  }

  obtenerConteoPorPais(anio?: number): Observable<ConteoDobleDTO[]> {
    let params = new HttpParams();
    if (anio != null) {
      params = params.set('anio', anio.toString());
    }
    return this.http.get<ConteoDobleDTO[]>(`${this.baseUrl}/por-pais`, { params });
  }
}