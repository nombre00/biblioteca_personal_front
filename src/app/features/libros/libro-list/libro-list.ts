import { Component, inject, signal, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LibroService } from '../libro.service';
import { GeneroService } from '../genero.service';
import { PaisService } from '../../autores/pais.service';
import { LibroResponseDTO, LibroFiltroDTO, EstadoLectura } from '../../../core/models/libro';
import { GeneroDTO } from '../../../core/models/genero';
import { PaisDTO } from '../../../core/models/pais';

@Component({
  selector: 'app-libro-list',
  imports: [RouterLink, NgClass],
  templateUrl: './libro-list.html',
  styleUrl: './libro-list.scss',
})
export class LibroList implements OnInit {
  private libroService = inject(LibroService);
  private generoService = inject(GeneroService);
  private paisService = inject(PaisService);

  libros = signal<LibroResponseDTO[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  // Búsqueda y filtros
  textoBusqueda = signal('');
  mostrarFiltros = signal(true);

  estadoFiltro = signal<EstadoLectura | ''>('');
  paisFiltro = signal('');   // string en el modelo, se convierte a number al armar el DTO
  idiomaFiltro = signal('');
  generosFiltro = signal<number[]>([]);

  generosDisponibles = signal<GeneroDTO[]>([]);
  paisesDisponibles = signal<PaisDTO[]>([]);

  ngOnInit(): void {
    this.cargarLibros();

    this.generoService.listarTodos().subscribe({
      next: (data) => this.generosDisponibles.set(data)
    });

    this.paisService.listarTodos().subscribe({
      next: (data) => this.paisesDisponibles.set(data)
    });
  }

  private cargarLibros(): void {
    this.cargando.set(true);
    this.libroService.listarTodos().subscribe({
      next: (data) => {
        this.libros.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de libros.');
        this.cargando.set(false);
      }
    });
  }

  buscar(): void {
    this.mostrarFiltros.set(true);
    this.ejecutarBusqueda();
  }

  onFiltroChange(): void {
    this.ejecutarBusqueda();
  }

  toggleGenero(id: number): void {
    const actuales = this.generosFiltro();
    this.generosFiltro.set(
      actuales.includes(id) ? actuales.filter(g => g !== id) : [...actuales, id]
    );
    this.ejecutarBusqueda();
  }

  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.estadoFiltro.set('');
    this.paisFiltro.set('');
    this.idiomaFiltro.set('');
    this.generosFiltro.set([]);
    this.mostrarFiltros.set(false);
    this.cargarLibros();
  }

  private ejecutarBusqueda(): void {
    const filtro: LibroFiltroDTO = {
      texto: this.textoBusqueda() || undefined,
      estado: this.estadoFiltro() || undefined,
      paisAutorId: this.paisFiltro() ? Number(this.paisFiltro()) : undefined,
      idiomaAutor: this.idiomaFiltro() || undefined,
      generoIds: this.generosFiltro().length ? this.generosFiltro() : undefined,
    };

    this.cargando.set(true);
    this.libroService.buscarConFiltros(filtro).subscribe({
      next: (data) => {
        this.libros.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo aplicar la búsqueda.');
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