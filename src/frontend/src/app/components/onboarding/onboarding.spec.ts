import { TestBed } from '@angular/core/testing';
import { OnboardingComponent } from './onboarding';
import { TenantService } from '../../services/tenant.service';

describe('OnboardingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [TenantService]
    }).compileComponents();
  });

  it('should create the onboarding component', () => {
    const fixture = TestBed.createComponent(OnboardingComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component.currentStep()).toBe(1);
  });

  it('should generate slug and UPI VPA automatically from restaurant name', () => {
    const fixture = TestBed.createComponent(OnboardingComponent);
    const component = fixture.componentInstance;

    component.restaurantName = 'Chawla Chicken & Grill';
    component.onNameChange();

    expect(component.restaurantSlug).toBe('chawla-chicken-grill');
    expect(component.upiVpa).toBe('chawlachickengrill@upi');
  });

  it('should validate step 1 requirements', () => {
    const fixture = TestBed.createComponent(OnboardingComponent);
    const component = fixture.componentInstance;

    component.restaurantName = 'AB';
    component.restaurantSlug = 'ab';
    expect(component.isCurrentStepValid()).toBe(false);

    component.restaurantName = 'Punjab Grill';
    component.restaurantSlug = 'punjab-grill';
    expect(component.isCurrentStepValid()).toBe(true);
  });

  it('should register new restaurant on completion', () => {
    const fixture = TestBed.createComponent(OnboardingComponent);
    const component = fixture.componentInstance;
    const tenantService = TestBed.inject(TenantService);

    component.restaurantName = 'Zaika Darbar';
    component.restaurantSlug = 'zaika-darbar';
    component.upiVpa = 'zaika@upi';

    const countBefore = tenantService.availableTenants().length;
    component.onCompleteRegistration();

    expect(component.currentStep()).toBe(4);
    expect(tenantService.availableTenants().length).toBe(countBefore + 1);
    expect(tenantService.activeTenant().slug).toBe('zaika-darbar');
  });
});
