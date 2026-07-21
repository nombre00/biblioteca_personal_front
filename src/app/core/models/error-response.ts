// core/models/error-response.ts
export interface ErrorResponseDTO {
  timestamp: string;   // LocalDateTime de Java se serializa como ISO string en JSON
  status: number;
  error: string;
  mensaje: string;
}