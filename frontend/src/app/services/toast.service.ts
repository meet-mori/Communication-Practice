import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly dedupeWindowMs = 2500;
  private readonly autoCloseMs = 3500;
  private readonly shownAt = new Map<string, number>();
  private readonly toastsSubject = new BehaviorSubject<ToastItem[]>([]);
  private nextId = 1;

  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string, title = 'Success', requestPath?: string) {
    if (this.shouldSkip('success', message, requestPath)) return;
    this.pushToast('success', message, title);
  }

  error(message: string, title = 'Error', requestPath?: string) {
    if (this.shouldSkip('error', message, requestPath)) return;
    this.pushToast('error', message, title);
  }

  info(message: string, title = 'Info', requestPath?: string) {
    if (this.shouldSkip('info', message, requestPath)) return;
    this.pushToast('info', message, title);
  }

  dismiss(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;
      if (typeof apiMessage === 'string' && apiMessage.trim()) {
        return apiMessage;
      }

      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.status === 0) {
        return 'Unable to reach server. Check your connection and try again.';
      }

      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }

  private shouldSkip(kind: 'success' | 'error' | 'info', message: string, requestPath?: string): boolean {
    const key = `${kind}|${requestPath || '-'}|${message}`;
    const now = Date.now();
    const lastShown = this.shownAt.get(key);

    this.shownAt.set(key, now);

    if (!lastShown) {
      return false;
    }

    return now - lastShown < this.dedupeWindowMs;
  }

  private pushToast(type: ToastItem['type'], message: string, title: string) {
    const toast: ToastItem = {
      id: this.nextId++,
      type,
      title,
      message,
    };

    const next = [...this.toastsSubject.value, toast].slice(-4);
    this.toastsSubject.next(next);

    setTimeout(() => this.dismiss(toast.id), this.autoCloseMs);
  }
}
