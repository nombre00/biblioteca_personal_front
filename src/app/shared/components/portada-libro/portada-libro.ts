import { Component, input } from '@angular/core';

@Component({
  selector: 'app-portada-libro',
  imports: [],
  templateUrl: './portada-libro.html',
  styleUrl: './portada-libro.scss',
})
export class PortadaLibro {
  portadaUrl = input<string | undefined>(undefined);
  titulo = input<string>('');
  tamano = input<'chico' | 'grande'>('chico');
  ancho = input<string>('w-full'); // clase Tailwind de ancho, ej: 'w-28', 'w-48'
} 