import { TestBed } from '@angular/core/testing';
import { AudioAlertService } from './audio-alert.service';

describe('AudioAlertService', () => {
  let service: AudioAlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioAlertService);
  });

  it('should initialize unmuted by default', () => {
    expect(service.isMuted()).toBe(false);
  });

  it('should toggle mute state and update signal', () => {
    service.toggleMute();
    expect(service.isMuted()).toBe(true);

    service.toggleMute();
    expect(service.isMuted()).toBe(false);
  });

  it('should not throw error on playOrderChime invocation', () => {
    expect(() => service.playOrderChime()).not.toThrow();

    service.isMuted.set(true);
    expect(() => service.playOrderChime()).not.toThrow();
  });
});
