import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from './api.service';

// Maneja la sesión: token JWT + datos del usuario en localStorage
@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<any>(this.leerUsuario());

  constructor(private http: HttpClient) {}

  private leerUsuario() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  login(login: string, password: string) {
    return this.http.post<any>(`${API_URL}/auth/login`, { login, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.user.set(res.user);
      })
    );
  }

  recover(email: string, newPassword: string) {
    return this.http.post<any>(`${API_URL}/auth/recover`, { email, newPassword });
  }

  logout() {
    this.http.post(`${API_URL}/auth/logout`, {}).subscribe({ next: () => {}, error: () => {} });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.user.set(null);
  }

  get token() { return localStorage.getItem('token'); }
  get isLoggedIn() { return !!this.token; }
  hasRole(...roles: string[]) {
    const u = this.user();
    return !!u && roles.includes(u.rolname);
  }
}
