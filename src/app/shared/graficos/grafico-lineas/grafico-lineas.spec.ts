import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficoLineas } from './grafico-lineas';

describe('GraficoLineas', () => {
  let component: GraficoLineas;
  let fixture: ComponentFixture<GraficoLineas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoLineas],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoLineas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
