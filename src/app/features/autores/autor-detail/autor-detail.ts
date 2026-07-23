import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AutorService } from '../autor.service';
import { AutorResponseDTO } from '../../../core/models/autor';

@Component({
  selector: 'app-autor-detail',
  imports: [],
  templateUrl: './autor-detail.html',
  styleUrl: './autor-detail.scss',
})
export class AutorDetail implements OnInit {
  private autorService = inject(AutorService);
  private route = inject(ActivatedRoute);

  autor = signal<AutorResponseDTO | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

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
  }
}