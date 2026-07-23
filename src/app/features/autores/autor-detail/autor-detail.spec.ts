import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutorDetail } from './autor-detail';

describe('AutorDetail', () => {
  let component: AutorDetail;
  let fixture: ComponentFixture<AutorDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutorDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(AutorDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
