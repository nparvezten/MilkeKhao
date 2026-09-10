import { TestBed } from '@angular/core/testing';
import { PushNotificationService } from './push-notification.service';

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PushNotificationService);
  });

  it('should be created and check browser push notification support', () => {
    expect(service).toBeTruthy();
    expect(service.permissionStatus()).toBeDefined();
  });

  it('should store and track the last sent notification payload', () => {
    service.sendOrderAlert('ORD-999', 'Order Out For Delivery', 'Rider is on the way');
    const last = service.lastNotification();
    expect(last).not.toBeNull();
    expect(last?.title).toBe('Order Out For Delivery');
    expect(last?.body).toBe('Rider is on the way');
  });
});
