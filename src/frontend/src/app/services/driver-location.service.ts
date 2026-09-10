import { Injectable, signal } from '@angular/core';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number; // meters per second
  heading?: number;
  timestamp?: number;
}

export interface DeliveryRoute {
  restaurantLocation: GeoCoordinate;
  customerLocation: GeoCoordinate;
  driverCurrentLocation: GeoCoordinate;
  progressPercent: number;
  etaMinutes: number;
  speedKmph: number;
}

@Injectable({
  providedIn: 'root'
})
export class DriverLocationService {
  // Coordinates for restaurant (e.g. Connaught Place / Swaad Foods Hub)
  readonly defaultRestaurant: GeoCoordinate = { latitude: 28.6315, longitude: 77.2167 };
  // Coordinates for customer delivery address (e.g. Green Valley / Noida Sector 62)
  readonly defaultCustomer: GeoCoordinate = { latitude: 28.6280, longitude: 77.3649 };

  readonly isBroadcasting = signal<boolean>(false);
  readonly currentDriverPosition = signal<GeoCoordinate>({ ...this.defaultRestaurant });
  readonly routeProgress = signal<number>(20); // 0 to 100%
  readonly speedKmph = signal<number>(28.5);
  readonly etaMinutes = signal<number>(14);

  private watchId: number | null = null;
  private simulationInterval: any = null;

  constructor() {}

  /**
   * Starts broadcasting live GPS coordinates from the device hardware.
   */
  startLiveGpsBroadcasting(): boolean {
    if (!('geolocation' in navigator)) {
      console.warn('[DriverLocation] Geolocation not supported, falling back to simulated telemetry');
      this.startSimulatedBroadcast();
      return true;
    }

    this.isBroadcasting.set(true);

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: GeoCoordinate = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed || 7.5,
            timestamp: pos.timestamp
          };
          this.currentDriverPosition.set(coords);
          this.speedKmph.set(Math.round((coords.speed || 7.5) * 3.6));
        },
        (err) => {
          console.warn('[DriverLocation] Hardware GPS error, using simulated telemetry:', err.message);
          this.startSimulatedBroadcast();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );
      return true;
    } catch {
      this.startSimulatedBroadcast();
      return true;
    }
  }

  /**
   * Starts smooth simulated driver route progression towards the customer destination.
   */
  startSimulatedBroadcast(): void {
    this.isBroadcasting.set(true);
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = setInterval(() => {
      this.routeProgress.update(prev => {
        const next = prev >= 100 ? 10 : prev + 5;
        this.updateSimulatedCoordinates(next);
        return next;
      });
    }, 2500);
  }

  /**
   * Stop broadcasting GPS coordinates.
   */
  stopBroadcasting(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isBroadcasting.set(false);
  }

  private updateSimulatedCoordinates(progress: number): void {
    const fraction = progress / 100;
    const lat = this.defaultRestaurant.latitude + fraction * (this.defaultCustomer.latitude - this.defaultRestaurant.latitude);
    const lng = this.defaultRestaurant.longitude + fraction * (this.defaultCustomer.longitude - this.defaultRestaurant.longitude);

    this.currentDriverPosition.set({ latitude: lat, longitude: lng });
    const remainingFraction = 1 - fraction;
    this.etaMinutes.set(Math.max(1, Math.round(remainingFraction * 18)));
    this.speedKmph.set(Math.floor(25 + Math.random() * 15));
  }
}
