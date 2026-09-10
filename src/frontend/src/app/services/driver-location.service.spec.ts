import { TestBed } from '@angular/core/testing';
import { DriverLocationService } from './driver-location.service';

describe('DriverLocationService', () => {
  let service: DriverLocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverLocationService);
  });

  afterEach(() => {
    service.stopBroadcasting();
  });

  it('should initialize with default restaurant coordinates and inactive broadcast status', () => {
    expect(service.isBroadcasting()).toBe(false);
    expect(service.currentDriverPosition().latitude).toBeCloseTo(28.6315, 2);
    expect(service.currentDriverPosition().longitude).toBeCloseTo(77.2167, 2);
  });

  it('should start simulated GPS broadcasting and update progress and speed telemetry', () => {
    service.startSimulatedBroadcast();
    expect(service.isBroadcasting()).toBe(true);
    expect(service.speedKmph()).toBeGreaterThan(0);
    expect(service.etaMinutes()).toBeGreaterThan(0);
  });

  it('should stop broadcasting and clear timers cleanly', () => {
    service.startSimulatedBroadcast();
    expect(service.isBroadcasting()).toBe(true);
    service.stopBroadcasting();
    expect(service.isBroadcasting()).toBe(false);
  });
});
