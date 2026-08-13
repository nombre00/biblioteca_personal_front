import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticaPorGenero } from './estadistica-por-genero';

describe('EstadisticaPorGenero', () => {
  let component: EstadisticaPorGenero;
  let fixture: ComponentFixture<EstadisticaPorGenero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticaPorGenero],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticaPorGenero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
