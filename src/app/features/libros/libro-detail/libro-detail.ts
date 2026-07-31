import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { LibroService } from '../libro.service';
import { ResumenService } from '../resumen.service';
import { LibroResponseDTO } from '../../../core/models/libro';
import { GeneroDTO } from '../../../core/models/genero';
import { ResumenResponse } from '../../../core/models/resumen';

@Component({
  selector: 'app-libro-detail',
  imports: [RouterLink, NgClass],
  templateUrl: './libro-detail.html',
  styleUrl: './libro-detail.scss',
})
export class LibroDetail implements OnInit {
  private libroService = inject(LibroService);
  private resumenService = inject(ResumenService);
  private route = inject(ActivatedRoute);

  libro = signal<LibroResponseDTO | null>(null);
  otrosLibrosAutor = signal<LibroResponseDTO[]>([]);
  resumen = signal<ResumenResponse | null>(null);
  resumenCargando = signal(true);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.cargando.set(true);
      this.resumen.set(null);
      this.resumenCargando.set(true);

      this.libroService.buscarPorId(id).subscribe({
        next: (data) => {
          this.libro.set(data);
          this.cargando.set(false);
          this.cargarOtrosLibrosDelAutor(data.autor.id, data.id);
          this.cargarResumen(data);
        },
        error: () => {
          this.error.set('No se pudo cargar el libro solicitado.');
          this.cargando.set(false);
        },
      });
    });
  }

  private cargarOtrosLibrosDelAutor(autorId: number, libroActualId: number): void {
    this.libroService.buscarPorAutor(autorId).subscribe({
      next: (libros) => {
        this.otrosLibrosAutor.set(libros.filter(l => l.id !== libroActualId));
      },
      error: () => {
        this.otrosLibrosAutor.set([]);
      },
    });
  }

  private cargarResumen(libro: LibroResponseDTO): void {
    const datos = {
      titulo_libro: libro.titulo,
      nombre_autor: libro.autor.nombre,
      genero: libro.generos[0]?.nombre,
    };

    this.resumenService.obtener(libro.id, datos).subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.resumenCargando.set(false);
      },
      error: () => {
        // Fallo aislado, no rompe el resto de la vista — mismo criterio que otrosLibrosAutor
        this.resumenCargando.set(false);
      },
    });
  }

  tieneAlgunIcono(generos: GeneroDTO[]): boolean {
    return generos.some(g => !!g.iconoSlug);
  }
}