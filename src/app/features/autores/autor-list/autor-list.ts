import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgStyle } from '@angular/common';
import { AutorService } from '../autor.service';
import { AutorResponseDTO } from '../../../core/models/autor';

@Component({
  selector: 'app-autor-list',
  imports: [RouterLink, NgStyle],
  templateUrl: './autor-list.html',
  styleUrl: './autor-list.scss',
})
export class AutorList implements OnInit {
  private autorService = inject(AutorService);

  autores = signal<AutorResponseDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  private paleta = ['#f97316', '#0ea5e9', '#16a34a', '#a855f7', '#e11d48', '#0d9488', '#ca8a04'];

  ngOnInit(): void {
    this.autorService.listarTodos().subscribe({
      next: (data) => {
        this.autores.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de autores.');
        this.cargando.set(false);
      },
    });
  }

  colorPorPais(pais: string): string {
    let hash = 0;
    for (let i = 0; i < pais.length; i++) {
      hash = pais.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.paleta[Math.abs(hash) % this.paleta.length];
  }
}