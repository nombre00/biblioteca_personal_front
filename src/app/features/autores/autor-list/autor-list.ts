import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutorService } from '../autor.service';
import { AutorResponseDTO } from '../../../core/models/autor';

@Component({
  selector: 'app-autor-list',
  imports: [RouterLink],
  templateUrl: './autor-list.html',
  styleUrl: './autor-list.scss',
})
export class AutorList implements OnInit {
  private autorService = inject(AutorService);

  autores = signal<AutorResponseDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

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
}