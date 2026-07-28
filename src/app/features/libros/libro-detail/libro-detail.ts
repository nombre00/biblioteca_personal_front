import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { LibroService } from '../libro.service';
import { LibroResponseDTO } from '../../../core/models/libro';
import { GeneroDTO } from '../../../core/models/genero';

@Component({
  selector: 'app-libro-detail',
  imports: [RouterLink, NgClass],
  templateUrl: './libro-detail.html',
  styleUrl: './libro-detail.scss',
})
export class LibroDetail implements OnInit {
  private libroService = inject(LibroService);
  private route = inject(ActivatedRoute);

  libro = signal<LibroResponseDTO | null>(null);
  otrosLibrosAutor = signal<LibroResponseDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.libroService.buscarPorId(id).subscribe({
      next: (data) => {
        this.libro.set(data);
        this.cargando.set(false);
        this.cargarOtrosLibrosDelAutor(data.autor.id, data.id);
      },
      error: () => {
        this.error.set('No se pudo cargar el libro solicitado.');
        this.cargando.set(false);
      },
    });
  }

  private cargarOtrosLibrosDelAutor(autorId: number, libroActualId: number): void {
    this.libroService.buscarPorAutor(autorId).subscribe({
      next: (libros) => {
        this.otrosLibrosAutor.set(libros.filter(l => l.id !== libroActualId));
      },
      error: () => {
        // Si falla, simplemente no mostramos la sección — no es crítico para la página
        this.otrosLibrosAutor.set([]);
      },
    });
  }

  tieneAlgunIcono(generos: GeneroDTO[]): boolean {
    return generos.some(g => !!g.iconoSlug);
  }
}