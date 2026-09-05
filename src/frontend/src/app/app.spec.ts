import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the main app component', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should default active view to storefront', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.activeView()).toBe('storefront');
  });

  it('should switch active view when updated', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.activeView.set('kitchen');
    expect(app.activeView()).toBe('kitchen');

    app.activeView.set('driver');
    expect(app.activeView()).toBe('driver');

    app.activeView.set('owner');
    expect(app.activeView()).toBe('owner');

    app.activeView.set('onboarding');
    expect(app.activeView()).toBe('onboarding');
  });
});
