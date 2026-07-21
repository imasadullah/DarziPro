import { Injectable, signal } from '@angular/core';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration: number;
    leaving: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    #toasts = signal<Toast[]>([]);
    public readonly toasts = this.#toasts.asReadonly();

    private nextId = 0;

    show(message: string, type: ToastType = 'info', duration = 3000): void {
        const id = this.nextId++;
        const toast: Toast = { id, message, type, duration, leaving: false };
        this.#toasts.update(list => [...list, toast]);

        setTimeout(() => this.dismiss(id), duration);
    }

    success(message: string, duration = 3000): void {
        this.show(message, 'success', duration);
    }

    error(message: string, duration = 3000): void {
        this.show(message, 'error', duration);
    }

    warning(message: string, duration = 3000): void {
        this.show(message, 'warning', duration);
    }

    info(message: string, duration = 3000): void {
        this.show(message, 'info', duration);
    }

    dismiss(id: number): void {
        // mark as leaving so the exit animation can play, then remove
        this.#toasts.update(list =>
            list.map(t => (t.id === id ? { ...t, leaving: true } : t))
        );
        setTimeout(() => {
            this.#toasts.update(list => list.filter(t => t.id !== id));
        }, 250);
    }
}