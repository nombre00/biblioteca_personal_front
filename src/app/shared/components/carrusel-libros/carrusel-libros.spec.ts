import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarruselLibros } from './carrusel-libros';

describe('CarruselLibros', () => {
  let component: CarruselLibros;
  let fixture: ComponentFixture<CarruselLibros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselLibros],
    }).compileComponents();

    fixture = TestBed.createComponent(CarruselLibros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
