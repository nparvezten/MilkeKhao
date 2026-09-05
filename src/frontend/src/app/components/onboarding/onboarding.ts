import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../services/tenant.service';
import { Tenant } from '../../models/tenant.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="onboarding-container animate-fade-in">
      <div class="onboarding-card glass-panel">
        <div class="onboarding-header">
          <span class="wizard-badge">✨ Multi-Tenant Partner Setup</span>
          <h2>Register Your Restaurant on MilkeKhao</h2>
          <p class="wizard-sub">Zero-commission direct customer ordering, KDS, & automated payouts</p>

          <!-- Step Indicators -->
          <div class="step-indicators">
            <div class="step-dot" [class.active]="currentStep() >= 1" [class.current]="currentStep() === 1">
              <span class="step-num">1</span>
              <span class="step-lbl">Brand</span>
            </div>
            <div class="step-line" [class.active]="currentStep() >= 2"></div>
            <div class="step-dot" [class.active]="currentStep() >= 2" [class.current]="currentStep() === 2">
              <span class="step-num">2</span>
              <span class="step-lbl">Payouts</span>
            </div>
            <div class="step-line" [class.active]="currentStep() >= 3"></div>
            <div class="step-dot" [class.active]="currentStep() >= 3" [class.current]="currentStep() === 3">
              <span class="step-num">3</span>
              <span class="step-lbl">Fulfillment</span>
            </div>
            <div class="step-line" [class.active]="currentStep() >= 4"></div>
            <div class="step-dot" [class.active]="currentStep() >= 4" [class.current]="currentStep() === 4">
              <span class="step-num">4</span>
              <span class="step-lbl">Launch</span>
            </div>
          </div>
        </div>

        <div class="onboarding-body">
          <!-- Step 1: Brand Details -->
          @if (currentStep() === 1) {
            <div class="step-content animate-fade-in">
              <h3>🏪 1. Restaurant & Brand Identity</h3>
              <p class="field-desc">How your customers will identify your kitchen across web & mobile.</p>

              <div class="form-group">
                <label>Restaurant Name *</label>
                <input
                  type="text"
                  [(ngModel)]="restaurantName"
                  (input)="onNameChange()"
                  placeholder="e.g. Dilli Darbar Awadhi Kitchen"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Storefront Slug (Subdomain URL) *</label>
                <div class="slug-input-wrapper">
                  <span class="slug-prefix">milkekhao.in/</span>
                  <input
                    type="text"
                    [(ngModel)]="restaurantSlug"
                    placeholder="dilli-darbar"
                    class="form-input slug-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>City / Region</label>
                <input
                  type="text"
                  [(ngModel)]="cityRegion"
                  placeholder="e.g. South Delhi, New Delhi"
                  class="form-input"
                />
              </div>
            </div>
          }

          <!-- Step 2: Payment & Zero-Fee Payouts -->
          @if (currentStep() === 2) {
            <div class="step-content animate-fade-in">
              <h3>💳 2. Payment Methods & Direct UPI Payouts</h3>
              <p class="field-desc">Customer payments settle directly to your bank account with 0% gateway commission via Direct UPI.</p>

              <div class="form-group">
                <label>Restaurant UPI VPA / QR ID *</label>
                <input
                  type="text"
                  [(ngModel)]="upiVpa"
                  placeholder="e.g. dillidarbar@okhdfcbank"
                  class="form-input"
                />
                <small class="hint">Money from customer UPI app goes directly to this VPA.</small>
              </div>

              <div class="form-group">
                <label>Secondary Gateways (Optional)</label>
                <div class="checkbox-row">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="enableRazorpay" />
                    <span>Razorpay (Credit/Debit cards, Netbanking)</span>
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="enablePayU" />
                    <span>PayU Payments</span>
                  </label>
                </div>
              </div>
            </div>
          }

          <!-- Step 3: Fulfillment & Taxes -->
          @if (currentStep() === 3) {
            <div class="step-content animate-fade-in">
              <h3>🛵 3. Delivery Channels & GST Registration</h3>
              <p class="field-desc">Choose which order fulfillment modes your kitchen can support.</p>

              <div class="form-group">
                <label>Enabled Order Modes</label>
                <div class="toggle-cards">
                  <div
                    class="toggle-card"
                    [class.selected]="enablePickup"
                    (click)="enablePickup = !enablePickup"
                  >
                    <span class="card-icon">🛍️</span>
                    <div class="card-text">
                      <strong>Customer Takeaway / Pickup</strong>
                      <small>Customer picks up food directly from restaurant counter.</small>
                    </div>
                  </div>

                  <div
                    class="toggle-card"
                    [class.selected]="enableInHouse"
                    (click)="enableInHouse = !enableInHouse"
                  >
                    <span class="card-icon">🛵</span>
                    <div class="card-text">
                      <strong>In-House Express Delivery</strong>
                      <small>Dispatched via your own delivery fleet using Driver Dispatch.</small>
                    </div>
                  </div>

                  <div
                    class="toggle-card"
                    [class.selected]="enableAggregator"
                    (click)="enableAggregator = !enableAggregator"
                  >
                    <span class="card-icon">🚴</span>
                    <div class="card-text">
                      <strong>Aggregator Fleet (Dunzo / Shadowfax)</strong>
                      <small>Automated B2B fleet dispatch when in-house drivers are busy.</small>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="isGstRegistered" />
                  <span>GST Registered Business (5% GST calculated automatically on food orders)</span>
                </label>
              </div>
            </div>
          }

          <!-- Step 4: Launch Confirmation -->
          @if (currentStep() === 4) {
            <div class="step-content animate-fade-in text-center">
              <span class="success-icon">🎉</span>
              <h3>Ready to Launch {{ restaurantName }}!</h3>
              <p class="field-desc">
                Your digital storefront, Kitchen KDS, and UPI payout QR codes have been provisioned.
              </p>

              <div class="summary-box">
                <div class="summary-line">
                  <span>Slug URL:</span>
                  <strong>milkekhao.in/{{ restaurantSlug }}</strong>
                </div>
                <div class="summary-line">
                  <span>Payout UPI ID:</span>
                  <strong>{{ upiVpa }}</strong>
                </div>
                <div class="summary-line">
                  <span>Fulfillment:</span>
                  <strong>{{ getFulfillmentSummary() }}</strong>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="onboarding-footer">
          @if (currentStep() > 1 && currentStep() < 4) {
            <button class="btn btn-secondary" (click)="currentStep.set(currentStep() - 1)">
              ← Back
            </button>
          }

          @if (currentStep() < 3) {
            <button
              class="btn btn-primary next-btn"
              [disabled]="!isCurrentStepValid()"
              (click)="currentStep.set(currentStep() + 1)"
            >
              Continue →
            </button>
          } @else if (currentStep() === 3) {
            <button
              class="btn btn-primary next-btn launch-btn"
              (click)="onCompleteRegistration()"
            >
              🚀 Provision & Launch Restaurant
            </button>
          } @else if (currentStep() === 4) {
            <button
              class="btn btn-primary next-btn"
              (click)="onGoToStorefront()"
            >
              🛍️ Open Live Storefront
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      max-width: 760px;
      margin: 32px auto;
      padding: 0 16px;
    }
    .onboarding-card {
      padding: 36px 40px;
      border-radius: var(--radius-lg);
    }
    .wizard-badge {
      display: inline-block;
      background: rgba(255, 107, 53, 0.2);
      color: var(--accent-primary);
      padding: 4px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .wizard-sub {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 4px;
    }
    .step-indicators {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 32px 0 24px;
      gap: 12px;
    }
    .step-dot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .step-num {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .step-dot.active .step-num {
      background: rgba(255, 107, 53, 0.3);
      border-color: var(--accent-primary);
      color: #ffffff;
    }
    .step-dot.current .step-num {
      background: var(--accent-primary);
      color: #ffffff;
      box-shadow: 0 0 12px rgba(255, 107, 53, 0.6);
    }
    .step-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 700;
    }
    .step-line {
      flex-grow: 1;
      height: 2px;
      background: var(--border-color);
      max-width: 60px;
    }
    .step-line.active {
      background: var(--accent-primary);
    }
    .step-content h3 {
      font-size: 1.15rem;
      margin-bottom: 4px;
    }
    .field-desc {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-bottom: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-secondary);
    }
    .form-input {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      outline: none;
    }
    .slug-input-wrapper {
      display: flex;
      align-items: center;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .slug-prefix {
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 700;
    }
    .slug-input {
      border: none;
      border-radius: 0;
      flex-grow: 1;
    }
    .hint {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .checkbox-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: var(--text-primary);
      cursor: pointer;
    }
    .toggle-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toggle-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .toggle-card.selected {
      border-color: var(--accent-primary);
      background: rgba(255, 107, 53, 0.1);
    }
    .card-icon {
      font-size: 1.6rem;
    }
    .card-text {
      display: flex;
      flex-direction: column;
    }
    .card-text small {
      color: var(--text-muted);
      font-size: 0.8rem;
    }
    .text-center { text-align: center; }
    .success-icon { font-size: 3.5rem; display: block; margin-bottom: 8px; }
    .summary-box {
      background: rgba(0, 0, 0, 0.3);
      padding: 20px;
      border-radius: var(--radius-md);
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }
    .summary-line strong {
      color: var(--accent-gold);
    }
    .onboarding-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }
    .next-btn {
      margin-left: auto;
      padding: 12px 28px;
      font-size: 0.95rem;
    }
    .launch-btn {
      background: linear-gradient(135deg, var(--accent-primary), #ff3e3e);
    }
  `]
})
export class OnboardingComponent {
  @Output() completed = new EventEmitter<void>();

  readonly currentStep = signal<number>(1);

  restaurantName = '';
  restaurantSlug = '';
  cityRegion = 'Delhi NCR';
  upiVpa = '';
  enableRazorpay = false;
  enablePayU = false;

  enablePickup = true;
  enableInHouse = true;
  enableAggregator = false;
  isGstRegistered = true;

  constructor(private tenantService: TenantService) {}

  onNameChange(): void {
    this.restaurantSlug = this.restaurantName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!this.upiVpa && this.restaurantSlug) {
      this.upiVpa = `${this.restaurantSlug.replace(/-/g, '')}@upi`;
    }
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep() === 1) {
      return this.restaurantName.trim().length >= 3 && this.restaurantSlug.trim().length >= 3;
    }
    if (this.currentStep() === 2) {
      return this.upiVpa.includes('@');
    }
    return true;
  }

  getFulfillmentSummary(): string {
    const modes: string[] = [];
    if (this.enablePickup) modes.push('Pickup');
    if (this.enableInHouse) modes.push('In-House');
    if (this.enableAggregator) modes.push('Aggregator');
    return modes.join(', ') || 'Pickup';
  }

  onCompleteRegistration(): void {
    const deliveryModes: string[] = [];
    if (this.enablePickup) deliveryModes.push('Pickup');
    if (this.enableInHouse) deliveryModes.push('InHouseDelivery');
    if (this.enableAggregator) deliveryModes.push('AggregatorDelivery');

    const paymentMethods: string[] = ['UpiIntent', 'UpiQr'];
    if (this.enableRazorpay) paymentMethods.push('Razorpay');
    if (this.enablePayU) paymentMethods.push('PayU');

    const newTenant: Tenant = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tenant-${Date.now()}`,
      name: `${this.restaurantName} (${this.cityRegion})`,
      slug: this.restaurantSlug,
      settings: {
        enabledDeliveryModes: deliveryModes,
        enabledPaymentMethods: paymentMethods,
        maxStaffAccounts: 1,
        gstRegistered: this.isGstRegistered
      }
    };

    this.tenantService.addTenant(newTenant);
    this.currentStep.set(4);
  }

  onGoToStorefront(): void {
    this.completed.emit();
  }
}
