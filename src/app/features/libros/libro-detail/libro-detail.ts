import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LibroService } from '../libro.service';
import { LibroResponseDTO } from '../../../core/models/libro';

@Component({
  selector: 'app-libro-detail',
  imports: [RouterLink],
  templateUrl: './libro-detail.html',
  styleUrl: './libro-detail.scss',
})
export class LibroDetail implements OnInit {
  private libroService = inject(LibroService);
  private route = inject(ActivatedRoute);

  libro = signal<LibroResponseDTO | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.libroService.buscarPorId(id).subscribe({
      next: (data) => {
        this.libro.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el libro solicitado.');
        this.cargando.set(false);
      },
    });
  }

  nombresGeneros(libro: LibroResponseDTO): string {
    return libro.generos.length
      ? libro.generos.map(g => g.nombre).join(', ')
      : 'Sin género';
  }
}