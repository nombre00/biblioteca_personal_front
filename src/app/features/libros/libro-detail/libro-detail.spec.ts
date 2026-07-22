import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibroDetail } from './libro-detail';

describe('LibroDetail', () => {
  let component: LibroDetail;
  let fixture: ComponentFixture<LibroDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(LibroDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
