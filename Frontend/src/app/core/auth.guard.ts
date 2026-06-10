import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Protección de rutas (requisito del PDF)

// Solo permite entrar si hay sesión iniciada
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) return true;
  router.navigate(['/login']);
  return false;
};

// Solo permite entrar si el rol está en data.roles de la ruta
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles: string[] = route.data['roles'] || [];
  if (auth.hasRole(...roles)) return true;
  router.navigate(['/welcome']);
  return false;
};
