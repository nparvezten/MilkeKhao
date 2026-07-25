import { Injectable, signal, computed } from '@angular/core';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  role: string;
  tenantId: string;
  userId: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSignal = signal<string | null>(null);
  private userRoleSignal = signal<string | null>('Customer');
  private tenantIdSignal = signal<string | null>('99999999-9999-9999-9999-999999999999');

  readonly accessToken = computed(() => this.tokenSignal());
  readonly userRole = computed(() => this.userRoleSignal());
  readonly tenantId = computed(() => this.tenantIdSignal());
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  async login(tenantSlug: string, emailOrUsername: string, password: string): Promise<boolean> {
    try {
      // Mock / Real authentication pipeline
      const mockResult: LoginResponse = {
        accessToken: `jwt_token_demo_${Date.now()}`,
        refreshToken: `refresh_token_${Date.now()}`,
        expiresInSeconds: 900,
        role: emailOrUsername.includes('kitchen') ? 'KitchenAdmin' : emailOrUsername.includes('owner') ? 'Owner' : 'Customer',
        tenantId: '99999999-9999-9999-9999-999999999999',
        userId: 'user-id-123',
        email: emailOrUsername
      };

      this.tokenSignal.set(mockResult.accessToken);
      this.userRoleSignal.set(mockResult.role);
      this.tenantIdSignal.set(mockResult.tenantId);
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userRoleSignal.set('Customer');
  }
}
