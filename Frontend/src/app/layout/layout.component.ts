import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { LoadingService, MessageService } from '../core/ui.services';

// Layout principal: sidebar con el MENÚ CARGADO DESDE LA BASE DE DATOS SEGÚN EL ROL
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="d-flex">
    <!-- Sidebar -->
    <aside class="sidebar p-3 d-flex flex-column">
      <h5 class="text-white mb-1"><i class="bi bi-router me-2"></i>NetCaja</h5>
      <small class="text-secondary mb-3">Sistema de Gestión de Caja</small>

      <nav class="flex-grow-1">
        <a *ngFor="let item of menu" [routerLink]="item.route" routerLinkActive="active" class="mb-1">
          <i class="bi {{ item.icon }} me-2"></i>{{ item.label }}
        </a>
      </nav>

      <div class="border-top border-secondary pt-3">
        <div class="text-white small">{{ auth.user()?.username }}</div>
        <div class="text-secondary small mb-2">{{ auth.user()?.rolname }}</div>
        <button class="btn btn-outline-light btn-sm w-100" (click)="salir()">
          <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Contenido -->
    <main class="flex-grow-1 p-4" style="min-height:100vh">
      <router-outlet></router-outlet>
    </main>
  </div>

  <!-- Loading global (requisito del PDF) -->
  <div class="loading-overlay" *ngIf="loading.visible()">
    <div class="spinner-border text-primary" style="width:3rem;height:3rem"></div>
  </div>

  <!-- Mensajes de éxito / error (requisito del PDF) -->
  <div class="app-toast" *ngIf="msg.message() as m">
    <div class="alert alert-{{ m.type }} alert-dismissible shadow mb-0">
      {{ m.text }}
      <button type="button" class="btn-close" (click)="msg.clear()"></button>
    </div>
  </div>
  `
})
export class LayoutComponent implements OnInit {
  menu: any[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
    public auth: AuthService,
    public loading: LoadingService,
    public msg: MessageService
  ) {}

  ngOnInit() {
    // El menú se obtiene del backend, que lo lee de la BD según el rol del JWT
    this.api.getMenu().subscribe(data => this.menu = data);
  }

  salir() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
