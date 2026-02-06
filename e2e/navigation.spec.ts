import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page.getByRole('heading', { name: 'Liquid Memory' })).toBeVisible();
    
    // Check upload area
    await expect(page.getByText('Drop your image here')).toBeVisible();
  });

  test('can navigate to library', async ({ page }) => {
    await page.goto('/');
    
    // Click library link
    await page.getByRole('link', { name: /library/i }).click();
    
    // Verify navigation
    await expect(page).toHaveURL('/library');
    await expect(page.getByRole('heading', { name: /library/i })).toBeVisible();
  });

  test('logo links to home', async ({ page }) => {
    await page.goto('/library');
    
    // Click logo
    await page.getByRole('link', { name: 'Liquid Memory' }).click();
    
    // Verify navigation
    await expect(page).toHaveURL('/');
  });
});

test.describe('Accessibility', () => {
  test('navigation has proper aria labels', async ({ page }) => {
    await page.goto('/');
    
    // Check aria-labels on icon buttons
    const libraryLink = page.getByRole('link', { name: /navigate to library/i });
    await expect(libraryLink).toBeVisible();
  });

  test('focus states are visible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check focus ring is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
