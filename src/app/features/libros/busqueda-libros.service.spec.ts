import { TestBed } from '@angular/core/testing';

import { BusquedaLibrosService } from './busqueda-libros.service';

describe('BusquedaLibrosService', () => {
  let service: BusquedaLibrosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusquedaLibrosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
