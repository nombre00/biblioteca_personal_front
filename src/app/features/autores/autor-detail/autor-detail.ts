import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AutorService } from '../autor.service';
import { LibroService } from '../../libros/libro.service';
import { BiografiaService } from '../biografia.service';
import { AutorResponseDTO } from '../../../core/models/autor';
import { LibroResponseDTO } from '../../../core/models/libro';
import { GeneroDTO } from '../../../core/models/genero';
import { BiografiaResponse } from '../../../core/models/biografia';
import { CarruselLibros, CarruselItem } from '../../../shared/components/carrusel-libros/carrusel-libros';

@Component({
  selector: 'app-autor-detail',
  imports: [CarruselLibros],
  templateUrl: './autor-detail.html',
  styleUrl: './autor-detail.scss',
})
export class AutorDetail implements OnInit {
  private autorService = inject(AutorService);
  private libroService = inject(LibroService);
  private biografiaService = inject(BiografiaService);
  private route = inject(ActivatedRoute);

  autor = signal<AutorResponseDTO | null>(null);
  librosAutor = signal<LibroResponseDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  biografia = signal<BiografiaResponse | null>(null);
  biografiaCargando = signal(true);

  // Mapeo a la forma normalizada que consume CarruselLibros. Sin
  // subtitulo: en esta página ya estamos viendo al autor, repetir su
  // nombre bajo cada portada sería redundante (a diferencia de
  // "sugerencias" en home, donde sí aporta).
  librosAutorCarrusel = computed<CarruselItem[]>(() =>
    this.librosAutor().map((l) => ({
      id: l.id,
      portadaUrl: l.portadaUrl,
      titulo: l.titulo,
    }))
  );

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
        this.cargarBiografia(id, data);
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

  // Gestión de biografía
  private cargarBiografia(autorId: number, autor: AutorResponseDTO): void {
    const datos = {
      nombre_autor: autor.nombre,
      nacionalidad: autor.pais?.nombre ?? null,
      anio_nacimiento: this.extraerAnio(autor.fechaNacimiento, autor.anioNacimientoAprox),
      anio_defuncion: this.extraerAnio(autor.fechaDefuncion, autor.anioDefuncionAprox),
    };

    this.biografiaService.obtener(autorId, datos).subscribe({
      next: (data) => {
        this.biografia.set(data);
        this.biografiaCargando.set(false);
      },
      // si falla la generación, no rompemos la página del autor; se mantiene el placeholder
      error: () => this.biografiaCargando.set(false),
    });
  }

  // Prioriza la fecha exacta si existe; si no, usa el año aproximado.
  private extraerAnio(fecha?: string, anioAprox?: number): number | null {
    if (fecha) {
      return Number(fecha.split('-')[0]);
    }
    return anioAprox ?? null;
  }
}