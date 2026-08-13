import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticaPorAnio } from './estadistica-por-anio';

describe('EstadisticaPorAnio', () => {
  let component: EstadisticaPorAnio;
  let fixture: ComponentFixture<EstadisticaPorAnio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticaPorAnio],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticaPorAnio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
