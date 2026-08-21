import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BiografiaRequest, BiografiaResponse } from '../../core/models/biografia';

@Injectable({
  providedIn: 'root'
})
export class BiografiaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/ia/biografias`;

  obtener(autorId: number, datos: BiografiaRequest): Observable<BiografiaResponse> {
    return this.http.post<BiografiaResponse>(`${this.baseUrl}/${autorId}`, datos);
  }

  obtenerGuardado(autorId: number): Observable<BiografiaResponse | null> {
    return this.http.get<BiografiaResponse | null>(`${this.baseUrl}/${autorId}`);
  }

  adoptar(autorId: number, texto: string): Observable<BiografiaResponse> {
    return this.http.put<BiografiaResponse>(`${this.baseUrl}/${autorId}`, { texto });
  }
}  