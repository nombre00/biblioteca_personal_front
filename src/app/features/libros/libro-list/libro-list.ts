import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibroService } from '../libro.service';
import { LibroResponseDTO } from '../../../core/models/libro';

@Component({
  selector: 'app-libro-list',
  imports: [RouterLink],
  templateUrl: './libro-list.html',
  styleUrl: './libro-list.scss',
})
export class LibroList implements OnInit {
  private libroService = inject(LibroService);

  libros = signal<LibroResponseDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.libroService.listarTodos().subscribe({
      next: (data) => {
        this.libros.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar la lista de libros.');
        this.cargando.set(false);
      }
    });
  }

  nombresGeneros(libro: LibroResponseDTO): string {
    return libro.generos.length
      ? libro.generos.map(g => g.nombre).join(', ')
      : 'Sin género';
  }
}