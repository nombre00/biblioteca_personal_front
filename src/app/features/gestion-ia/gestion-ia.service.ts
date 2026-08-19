import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConfiguracionPrompt,
  ConfiguracionPromptCreate,
  ConfiguracionPromptUpdate,
  TipoTareaIa,
} from '../../core/models/gestion-ia';

@Injectable({
  providedIn: 'root',
})
export class GestionIaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.gatewayUrl}/ia/configuracion-prompt`;

  listar(tipoTarea: TipoTareaIa): Observable<ConfiguracionPrompt[]> {
    return this.http.get<ConfiguracionPrompt[]>(`${this.baseUrl}/${tipoTarea}`);
  }

  obtener(configuracionId: number): Observable<ConfiguracionPrompt> {
    return this.http.get<ConfiguracionPrompt>(`${this.baseUrl}/detalle/${configuracionId}`);
  }

  crear(tipoTarea: TipoTareaIa, datos: ConfiguracionPromptCreate): Observable<ConfiguracionPrompt> {
    return this.http.post<ConfiguracionPrompt>(`${this.baseUrl}/${tipoTarea}`, datos);
  }

  actualizar(configuracionId: number, datos: ConfiguracionPromptUpdate): Observable<ConfiguracionPrompt> {
    return this.http.put<ConfiguracionPrompt>(`${this.baseUrl}/detalle/${configuracionId}`, datos);
  }

  eliminar(configuracionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/detalle/${configuracionId}`);
  }

  activar(configuracionId: number): Observable<ConfiguracionPrompt> {
    return this.http.patch<ConfiguracionPrompt>(`${this.baseUrl}/detalle/${configuracionId}/activar`, {});
  }
}