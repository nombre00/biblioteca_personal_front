import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmarImportar } from './confirmar-importar';

describe('ConfirmarImportar', () => {
  let component: ConfirmarImportar;
  let fixture: ComponentFixture<ConfirmarImportar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmarImportar],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmarImportar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
