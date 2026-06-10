import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, throwError } from 'rxjs';
import { LoadingService, MessageService } from './ui.services';

// Interceptor de TODAS las peticiones (requisito del PDF):
// 1) Adjunta el JWT en el header Authorization
// 2) Activa/desactiva el loading global
// 3) Muestra los mensajes de error del backend
// 4) Si el token expira (401) redirige al login
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const msg = inject(MessageService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  loading.show();

  return next(cloned).pipe(
    catchError(err => {
      const texto = err?.error?.message || 'Error de comunicación con el servidor';
      msg.error(texto);
      if (err.status === 401 && !req.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
    finalize(() => loading.hide())
  );
};
