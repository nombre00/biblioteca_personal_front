import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficoPie } from './grafico-pie';

describe('GraficoPie', () => {
  let component: GraficoPie;
  let fixture: ComponentFixture<GraficoPie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoPie],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoPie);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
