import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { MessageService } from '../core/ui.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="d-flex align-items-center justify-content-center" style="min-height:100vh">
    <div class="card p-4" style="width:380px">
      <div class="text-center mb-3">
        <i class="bi bi-router text-primary" style="font-size:2.5rem"></i>
        <h4 class="mt-2 mb-0">Sistema de Caja</h4>
        <small class="text-muted">Empresa de servicios de internet</small>
      </div>

      <!-- ============ LOGIN ============ -->
      <div *ngIf="!modoRecuperar">
        <div class="mb-3">
          <label class="form-label">Usuario o correo</label>
          <input class="form-control" [(ngModel)]="login" name="login"
                 placeholder="admin1234" (keyup.enter)="entrar()">
          <small class="text-danger" *ngIf="intentado && !login">El usuario es obligatorio</small>
        </div>
        <div class="mb-3">
          <label class="form-label">Contraseña</label>
          <input type="password" class="form-control" [(ngModel)]="password" name="password"
                 placeholder="********" (keyup.enter)="entrar()">
          <small class="text-danger" *ngIf="intentado && !password">La contraseña es obligatoria</small>
        </div>
        <button class="btn btn-primary w-100 mb-2" (click)="entrar()">
          <i class="bi bi-box-arrow-in-right me-1"></i>Ingresar
        </button>
        <button class="btn btn-link w-100 btn-sm" (click)="modoRecuperar = true">
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <!-- ============ RECUPERAR CONTRASEÑA ============ -->
      <div *ngIf="modoRecuperar">
        <h6 class="mb-3">Recuperar contraseña</h6>
        <div class="mb-3">
          <label class="form-label">Correo registrado</label>
          <input type="email" class="form-control" [(ngModel)]="email" name="email" placeholder="correo@mail.com">
          <small class="text-danger" *ngIf="intentadoRec && !emailValido()">Ingrese un correo válido</small>
        </div>
        <div class="mb-3">
          <label class="form-label">Nueva contraseña</label>
          <input type="password" class="form-control" [(ngModel)]="nuevaPassword" name="nuevaPassword">
          <small class="text-muted d-block">Mínimo 8 caracteres, una mayúscula y un número</small>
          <small class="text-danger" *ngIf="intentadoRec && !passValida()">La contraseña no cumple el formato</small>
        </div>
        <button class="btn btn-primary w-100 mb-2" (click)="recuperar()">Restablecer</button>
        <button class="btn btn-link w-100 btn-sm" (click)="modoRecuperar = false">Volver al login</button>
      </div>
    </div>
  </div>
  `
})
export class LoginComponent {
  login = '';
  password = '';
  intentado = false;

  modoRecuperar = false;
  email = '';
  nuevaPassword = '';
  intentadoRec = false;

  constructor(private auth: AuthService, private router: Router, private msg: MessageService) {}

  // Validar que los datos sean ingresados ANTES de consumir el servicio (requisito del PDF)
  entrar() {
    this.intentado = true;
    if (!this.login || !this.password) return;
    this.auth.login(this.login, this.password).subscribe(() => {
      this.msg.success('Bienvenido ' + this.login);
      this.router.navigate(['/welcome']);
    });
  }

  emailValido() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email); }
  passValida() { return /^(?=.*\d)(?=.*[A-Z]).{8,30}$/.test(this.nuevaPassword); }

  recuperar() {
    this.intentadoRec = true;
    if (!this.emailValido() || !this.passValida()) return;
    this.auth.recover(this.email, this.nuevaPassword).subscribe(res => {
      this.msg.success(res.message);
      this.modoRecuperar = false;
    });
  }
}
