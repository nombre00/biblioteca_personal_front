import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { LibroList } from './features/libros/libro-list/libro-list';
import { LibroDetail } from './features/libros/libro-detail/libro-detail';
import { LibroForm } from './features/libros/libro-form/libro-form';
import { AutorList } from './features/autores/autor-list/autor-list';
import { AutorDetail } from './features/autores/autor-detail/autor-detail';
import { AutorForm } from './features/autores/autor-form/autor-form';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'libros', component: LibroList, canActivate: [authGuard] },
  { path: 'libros/gestionar', component: LibroForm, canActivate: [authGuard] },
  { path: 'libros/:id', component: LibroDetail, canActivate: [authGuard] },
  { path: 'autores', component: AutorList, canActivate: [authGuard] },
  { path: 'autores/gestionar', component: AutorForm, canActivate: [authGuard] },
  { path: 'autores/:id', component: AutorDetail, canActivate: [authGuard] },
];