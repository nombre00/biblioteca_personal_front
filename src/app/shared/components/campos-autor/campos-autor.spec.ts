import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamposAutor } from './campos-autor';

describe('CamposAutor', () => {
  let component: CamposAutor;
  let fixture: ComponentFixture<CamposAutor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CamposAutor],
    }).compileComponents();

    fixture = TestBed.createComponent(CamposAutor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
