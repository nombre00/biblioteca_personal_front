import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadisticaPorAutor } from './estadistica-por-autor';

describe('EstadisticaPorAutor', () => {
  let component: EstadisticaPorAutor;
  let fixture: ComponentFixture<EstadisticaPorAutor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticaPorAutor],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticaPorAutor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
