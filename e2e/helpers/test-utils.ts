import { Page, expect } from '@playwright/test';

/**
 * Test utilities for InsightInk E2E tests
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for toast notification and verify message
 */
export async function expectToast(page: Page, message: string) {
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: message });
  await expect(toast).toBeVisible({ timeout: 10000 });
}

/**
 * Wait for toast success notification
 */
export async function expectSuccessToast(page: Page, message: string) {
  await expectToast(page, message);
}

/**
 * Wait for toast error notification
 */
export async function expectErrorToast(page: Page, message: string) {
  await expectToast(page, message);
}

/**
 * Fill TipTap editor with content
 */
export async function fillTipTapEditor(page: Page, content: string) {
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await editor.fill(content);
}

/**
 * Select option from Shadcn Select component
 */
export async function selectOption(page: Page, triggerSelector: string, optionText: string) {
  await page.locator(triggerSelector).click();
  await page.getByRole('option', { name: optionText }).click();
}

/**
 * Click button with specific text
 */
export async function clickButton(page: Page, text: string) {
  await page.getByRole('button', { name: text }).click();
}

/**
 * Fill form field by label
 */
export async function fillField(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).isVisible();
}

/**
 * Wait for skeleton to disappear (loading complete)
 */
export async function waitForLoadingComplete(page: Page) {
  await page.waitForSelector('[class*="skeleton"]', { state: 'hidden', timeout: 30000 }).catch(() => {
    // Skeleton might not exist, which is fine
  });
}

/**
 * Get count of items in a list
 */
export async function getListItemCount(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}

/**
 * Navigate and wait for page
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Check page title
 */
export async function expectPageTitle(page: Page, title: string) {
  await expect(page).toHaveTitle(new RegExp(title, 'i'));
}

/**
 * Check URL contains path
 */
export async function expectUrlContains(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * Generate unique test data
 */
export function generateTestData(prefix: string) {
  const timestamp = Date.now();
  return {
    title: `${prefix} Test ${timestamp}`,
    slug: `${prefix.toLowerCase()}-test-${timestamp}`,
    content: `This is test content generated at ${timestamp}`,
    excerpt: `Test excerpt ${timestamp}`,
  };
}

/**
 * Check form validation error
 */
export async function expectValidationError(page: Page, fieldName: string) {
  const errorMessage = page.locator(`[id="${fieldName}-form-item-message"]`);
  await expect(errorMessage).toBeVisible();
}

/**
 * Check button is disabled
 */
export async function expectButtonDisabled(page: Page, buttonText: string) {
  const button = page.getByRole('button', { name: buttonText });
  await expect(button).toBeDisabled();
}

/**
 * Check button is enabled
 */
export async function expectButtonEnabled(page: Page, buttonText: string) {
  const button = page.getByRole('button', { name: buttonText });
  await expect(button).toBeEnabled();
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, urlPattern: string | RegExp) {
  await page.waitForURL(urlPattern);
}

/**
 * Screenshot for debugging
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}

/**
 * Check element has specific text
 */
export async function expectText(page: Page, selector: string, text: string) {
  await expect(page.locator(selector)).toContainText(text);
}

/**
 * Check element count
 */
export async function expectCount(page: Page, selector: string, count: number) {
  await expect(page.locator(selector)).toHaveCount(count);
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Check if page has no console errors
 */
export function setupConsoleErrorCheck(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}
