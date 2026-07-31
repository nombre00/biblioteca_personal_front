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
  private baseUrl = `${environment.gatewayUrl}/biografias`;

  obtener(autorId: number, datos: BiografiaRequest): Observable<BiografiaResponse> {
    return this.http.post<BiografiaResponse>(`${this.baseUrl}/${autorId}`, datos);
  }
}