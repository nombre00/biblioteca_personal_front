import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticaPorPais } from './estadistica-por-pais';

describe('EstadisticaPorPais', () => {
  let component: EstadisticaPorPais;
  let fixture: ComponentFixture<EstadisticaPorPais>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticaPorPais],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticaPorPais);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
