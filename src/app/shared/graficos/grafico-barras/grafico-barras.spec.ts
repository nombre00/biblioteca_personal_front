import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficoBarras } from './grafico-barras';

describe('GraficoBarras', () => {
  let component: GraficoBarras;
  let fixture: ComponentFixture<GraficoBarras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoBarras],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoBarras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
