import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixture with authentication helpers
 *
 * Note: For Clerk authentication, we use test mode or mock authentication.
 * In production, you would set up Clerk test tokens or use Clerk's testing utilities.
 */

export type TestUser = {
  email: string;
  password: string;
  role: 'Author' | 'Admin';
  name: string;
};

// Test users - these should match your Clerk test environment
export const TEST_USERS = {
  author: {
    email: process.env.TEST_AUTHOR_EMAIL || 'author@test.com',
    password: process.env.TEST_AUTHOR_PASSWORD || 'testpassword123',
    role: 'Author' as const,
    name: 'Test Author',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'testpassword123',
    role: 'Admin' as const,
    name: 'Test Admin',
  },
  reader: {
    email: process.env.TEST_READER_EMAIL || 'reader@test.com',
    password: process.env.TEST_READER_PASSWORD || 'testpassword123',
    role: 'Author' as const, // Default role
    name: 'Test Reader',
  },
};

// Test fixtures extending base Playwright test
type AuthFixtures = {
  authenticatedPage: ReturnType<typeof base['page']>;
  authorPage: ReturnType<typeof base['page']>;
  adminPage: ReturnType<typeof base['page']>;
};

/**
 * Login helper function
 */
async function loginWithClerk(
  page: Awaited<ReturnType<typeof base['page']>>,
  user: TestUser
) {
  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Wait for Clerk sign-in form
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });

  // Fill email
  await page.fill('input[name="identifier"]', user.email);

  // Click continue
  await page.click('button[type="submit"]');

  // Wait for password field
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });

  // Fill password
  await page.fill('input[name="password"]', user.password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard or homepage
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(page: Awaited<ReturnType<typeof base['page']>>): Promise<boolean> {
  // Check for Clerk user button or dashboard link
  const userButton = page.locator('[data-clerk-user-button]');
  return await userButton.isVisible({ timeout: 5000 }).catch(() => false);
}

/**
 * Logout helper
 */
async function logout(page: Awaited<ReturnType<typeof base['page']>>) {
  const userButton = page.locator('[data-clerk-user-button]');
  if (await userButton.isVisible()) {
    await userButton.click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await page.waitForURL('/');
  }
}

// Export extended test with auth fixtures
export const test = base.extend<AuthFixtures>({
  // Generic authenticated page
  authenticatedPage: async ({ page }, use) => {
    await loginWithClerk(page, TEST_USERS.author);
    await use(page);
  },

  // Author-specific page
  authorPage: async ({ page }, use) => {
    await loginWithClerk(page, TEST_USERS.author);
    await use(page);
  },

  // Admin-specific page
  adminPage: async ({ page }, use) => {
    await loginWithClerk(page, TEST_USERS.admin);
    await use(page);
  },
});

export { expect, loginWithClerk, isAuthenticated, logout };
