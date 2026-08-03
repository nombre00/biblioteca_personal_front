import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficoTreemap } from './grafico-treemap';

describe('GraficoTreemap', () => {
  let component: GraficoTreemap;
  let fixture: ComponentFixture<GraficoTreemap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoTreemap],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoTreemap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
