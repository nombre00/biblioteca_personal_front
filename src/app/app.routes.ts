import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { LibroList } from './features/libros/libro-list/libro-list';
import { LibroDetail } from './features/libros/libro-detail/libro-detail';
import { LibroForm } from './features/libros/libro-form/libro-form';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'libros', component: LibroList, canActivate: [authGuard] },
  { path: 'libros/nuevo', component: LibroForm, canActivate: [authGuard] },
  { path: 'libros/:id/editar', component: LibroForm, canActivate: [authGuard] },
  { path: 'libros/:id', component: LibroDetail, canActivate: [authGuard] },
];