import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(private auth: Auth, private router: Router) {}

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.errorMessage = null;
    this.isSubmitting = true;

    const { email, password } = this.loginForm.value;

    try {
      await this.auth.login(email!, password!);
      this.router.navigate(['/libros']);
    } catch (err) {
      this.errorMessage = 'Email o contraseña incorrectos.';
    } finally {
      this.isSubmitting = false;
    }
  }
}