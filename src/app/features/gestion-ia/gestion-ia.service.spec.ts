import { TestBed } from '@angular/core/testing';

import { GestionIaService } from './gestion-ia.service';

describe('GestionIaService', () => {
  let service: GestionIaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionIaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
