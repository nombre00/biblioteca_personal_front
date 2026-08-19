import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Biografias } from './biografias';

describe('Biografias', () => {
  let component: Biografias;
  let fixture: ComponentFixture<Biografias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Biografias],
    }).compileComponents();

    fixture = TestBed.createComponent(Biografias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
