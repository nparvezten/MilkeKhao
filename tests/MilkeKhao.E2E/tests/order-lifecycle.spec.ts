import { test, expect } from '@playwright/test';

test.describe('MilkeKhao End-to-End Order Lifecycle Suite', () => {

  test('Customer Storefront -> Cart Drawer -> Order Creation Flow', async ({ page }) => {
    // 1. Visit Storefront
    await page.goto('/');
    await expect(page).toHaveTitle(/MilkeKhao/i);

    // 2. Verify Storefront branding & category pills
    const storefrontHeader = page.locator('header');
    await expect(storefrontHeader).toBeVisible();

    // 3. Search and Add item to Cart
    const addToCartButtons = page.locator('button:has-text("Add to Cart"), button:has-text("Add")');
    if (await addToCartButtons.count() > 0) {
      await addToCartButtons.first().click();

      // 4. Open Cart Drawer / Checkout
      const cartTrigger = page.locator('button:has-text("Cart"), [aria-label*="cart"]');
      if (await cartTrigger.isVisible()) {
        await cartTrigger.click();
      }

      // 5. Fill customer details if form is presented
      const nameInput = page.locator('input[placeholder*="Name"], input[name="name"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Rahul Sharma');
      }

      const phoneInput = page.locator('input[placeholder*="Phone"], input[type="tel"]');
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+919876543210');
      }

      // 6. Select UPI payment option
      const upiOption = page.locator('text=UPI Direct, text=UPI QR');
      if (await upiOption.count() > 0) {
        await upiOption.first().click();
      }
    }
  });

  test('Staff Tab Navigation: Kitchen KDS -> Driver Dispatch -> Owner Analytics', async ({ page }) => {
    await page.goto('/');

    // 1. Kitchen KDS Tab
    const kdsTab = page.locator('button:has-text("Kitchen KDS"), a:has-text("Kitchen KDS")');
    if (await kdsTab.isVisible()) {
      await kdsTab.click();
      await expect(page.locator('text=Pending, text=Accepted, text=In Preparation')).toBeVisible();
    }

    // 2. Driver Dispatch Tab
    const driverTab = page.locator('button:has-text("Driver Dispatch"), a:has-text("Driver Dispatch")');
    if (await driverTab.isVisible()) {
      await driverTab.click();
      await expect(page.locator('text=Driver, text=Dispatch, text=Delivery')).toBeVisible();
    }

    // 3. Owner Analytics Tab
    const analyticsTab = page.locator('button:has-text("Owner Analytics"), a:has-text("Owner Analytics")');
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await expect(page.locator('text=Revenue, text=Gross Sales, text=Top Selling')).toBeVisible();
    }
  });

});
