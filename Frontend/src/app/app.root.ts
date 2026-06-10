import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Componente raíz: solo muestra la ruta activa (login o layout)
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class Root {}
