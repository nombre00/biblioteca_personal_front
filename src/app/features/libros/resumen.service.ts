import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResumenRequest, ResumenResponse } from '../../core/models/resumen';

@Injectable({ providedIn: 'root' })
export class ResumenService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/resumenes`;

  obtener(libroId: number, datos: ResumenRequest): Observable<ResumenResponse> {
    return this.http.post<ResumenResponse>(`${this.baseUrl}/${libroId}`, datos);
  }
}