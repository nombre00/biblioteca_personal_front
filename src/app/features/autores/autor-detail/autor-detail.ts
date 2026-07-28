import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AutorService } from '../autor.service';
import { LibroService } from '../../libros/libro.service';
import { AutorResponseDTO } from '../../../core/models/autor';
import { LibroResponseDTO } from '../../../core/models/libro';
import { GeneroDTO } from '../../../core/models/genero';

@Component({
  selector: 'app-autor-detail',
  imports: [RouterLink],
  templateUrl: './autor-detail.html',
  styleUrl: './autor-detail.scss',
})
export class AutorDetail implements OnInit {
  private autorService = inject(AutorService);
  private libroService = inject(LibroService);
  private route = inject(ActivatedRoute);

  autor = signal<AutorResponseDTO | null>(null);
  librosAutor = signal<LibroResponseDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  // Unión deduplicada de géneros de todos los libros del autor, ordenada por frecuencia descendente.
  generosAutor = computed<GeneroDTO[]>(() => {
    const conteo = new Map<number, { genero: GeneroDTO; cantidad: number }>();

    for (const libro of this.librosAutor()) {
      for (const genero of libro.generos) {
        const existente = conteo.get(genero.id!);
        if (existente) {
          existente.cantidad++;
        } else {
          conteo.set(genero.id!, { genero, cantidad: 1 });
        }
      }
    }

    return Array.from(conteo.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .map((entrada) => entrada.genero);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.autorService.buscarPorId(id).subscribe({
      next: (data) => {
        this.autor.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el autor solicitado.');
        this.cargando.set(false);
      },
    });

    this.libroService.buscarPorAutor(id).subscribe({
      next: (libros) => this.librosAutor.set(libros),
      // si falla la carga de libros relacionados, no rompemos la página del autor
      error: () => this.librosAutor.set([]),
    });
  }
}