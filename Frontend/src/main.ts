import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { Root } from './app/app.root';

// Arranque de la aplicación con nuestro componente raíz y configuración
bootstrapApplication(Root, appConfig)
  .catch((err) => console.error(err));
