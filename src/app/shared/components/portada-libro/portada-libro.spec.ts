import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortadaLibro } from './portada-libro';

describe('PortadaLibro', () => {
  let component: PortadaLibro;
  let fixture: ComponentFixture<PortadaLibro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortadaLibro],
    }).compileComponents();

    fixture = TestBed.createComponent(PortadaLibro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
