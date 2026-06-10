import { Injectable, signal, computed } from '@angular/core';

// Loading global: cuenta las peticiones HTTP en curso (lo usa el interceptor)
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private counter = signal(0);
  visible = computed(() => this.counter() > 0);

  show() { this.counter.update(v => v + 1); }
  hide() { this.counter.update(v => Math.max(0, v - 1)); }
}

// Mensajes de éxito y error (toast con autocierre)
@Injectable({ providedIn: 'root' })
export class MessageService {
  message = signal<{ type: 'success' | 'danger'; text: string } | null>(null);
  private timer: any;

  private show(type: 'success' | 'danger', text: string) {
    this.message.set({ type, text });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), 4000);
  }

  success(text: string) { this.show('success', text); }
  error(text: string) { this.show('danger', text); }
  clear() { this.message.set(null); }
}
