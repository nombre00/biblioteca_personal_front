import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.waitForAuthReady();

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/login');
};