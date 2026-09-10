import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  readonly permissionStatus = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  readonly isPushSupported = signal<boolean>(typeof window !== 'undefined' && 'Notification' in window);
  readonly lastNotification = signal<{ title: string; body: string; timestamp: string } | null>(null);

  constructor() {
    if (this.isPushSupported()) {
      this.permissionStatus.set(Notification.permission);
    }
  }

  /**
   * Request browser push notification permission from the user.
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isPushSupported()) {
      console.warn('[PushNotification] Web Notifications not supported in this environment');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus.set(permission);
      return permission === 'granted';
    } catch (err) {
      console.error('[PushNotification] Permission request failed', err);
      return false;
    }
  }

  /**
   * Trigger a push notification for order milestone alerts.
   */
  sendOrderAlert(orderId: string, title: string, body: string): void {
    const timestamp = new Date().toLocaleTimeString('en-IN');
    this.lastNotification.set({ title, body, timestamp });

    if (this.isPushSupported() && this.permissionStatus() === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `order-${orderId}`,
          requireInteraction: false
        });
      } catch (err) {
        console.warn('[PushNotification] Native notification dispatch error:', err);
      }
    }
  }
}
