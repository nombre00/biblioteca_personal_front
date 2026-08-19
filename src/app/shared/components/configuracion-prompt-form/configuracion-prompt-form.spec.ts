import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracionPromptForm } from './configuracion-prompt-form';

describe('ConfiguracionPromptForm', () => {
  let component: ConfiguracionPromptForm;
  let fixture: ComponentFixture<ConfiguracionPromptForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionPromptForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionPromptForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
