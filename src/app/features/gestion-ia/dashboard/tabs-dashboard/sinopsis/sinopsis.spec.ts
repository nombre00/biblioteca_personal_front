import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sinopsis } from './sinopsis';

describe('Sinopsis', () => {
  let component: Sinopsis;
  let fixture: ComponentFixture<Sinopsis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sinopsis],
    }).compileComponents();

    fixture = TestBed.createComponent(Sinopsis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
