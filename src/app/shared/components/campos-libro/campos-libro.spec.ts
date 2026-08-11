import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamposLibro } from './campos-libro';

describe('CamposLibro', () => {
  let component: CamposLibro;
  let fixture: ComponentFixture<CamposLibro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamposLibro],
    }).compileComponents();

    fixture = TestBed.createComponent(CamposLibro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
