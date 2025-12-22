# InsightInk E2E Tests

Comprehensive Playwright end-to-end tests for the InsightInk Blog CMS Platform.

## Test Coverage

### Phase 1-2: Setup & Foundational (`01-setup-foundational.spec.ts`)
- Application initialization and routing
- Navigation structure (header, footer, sidebar)
- Authentication pages (Clerk integration)
- Public vs protected routes
- UI components (Shadcn)
- Category navigation sidebar
- Database connection verification
- Error handling (404, console errors)
- Performance (load time)

### Phase 3: Author Creates Posts (`02-author-posts.spec.ts`)
- Author dashboard access
- Post creation form with all fields
- TipTap rich text editor
- Category and tag selection
- Draft and publish workflows
- Slug generation
- Post editing and updating
- Post deletion with confirmation
- Published posts display on homepage
- Individual post pages
- Pagination

### Phase 4: Comment Moderation (`03-comment-moderation.spec.ts`)
- Comment form visibility (authenticated vs public)
- Comment submission workflow
- Validation for empty comments
- Comment display (approved only)
- Admin comment moderation page
- Filter by status
- Approve/reject comments
- Optimistic UI updates
- Dashboard statistics
- Security checks

### Phase 5: Content Discovery (`04-content-discovery.spec.ts`)
- Category navigation sidebar
- Category filter pages
- Tag filter pages
- Category/tag links on post cards
- Empty states
- Pagination on filter pages
- Filter combinations
- SEO and accessibility

### Phase 6: Search (`05-search.spec.ts`)
- Search bar component
- Search form submission
- Search results page
- Empty state for no results
- Input sanitization (XSS, SQL injection prevention)
- Relevance ranking
- Search performance
- URL query parameters
- Browser back/forward navigation
- Accessibility

### Phase 7: Admin Management (`06-admin-management.spec.ts`)
- Admin dashboard access
- Dashboard statistics (posts, comments, pending)
- Admin posts management (DataTable)
- Admin categories management (CRUD)
- Admin users management
- Role badges
- Category deletion with posts error
- Confirmation dialogs
- Sorting and pagination in tables
- Admin permissions (edit/delete any post)

### Phase 8: Profile Management (`07-profile-management.spec.ts`)
- Profile settings page access
- Profile form (name, bio, email)
- Profile update workflow
- Validation errors
- Loading states
- Public author page
- Author info display (name, bio, join date, post count)
- Author link on posts
- Profile persistence

### Phase 9: Polish & UX (`08-polish-ux.spec.ts`)
- Loading states in forms
- Toast notifications
- Pagination controls
- Skeleton loading states
- SEO meta tags (title, description, Open Graph)
- Responsive design (mobile/desktop)
- Image optimization
- Error messages (field-level)
- Role badges
- Error boundaries
- Performance
- Accessibility (headings, labels, keyboard nav, alt text)
- Browser compatibility
- Security (XSS prevention, no sensitive data exposure)

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed browser
npm run test:headed

# Debug tests
npm run test:debug

# View test report
npm run test:report

# Run specific test file
npx playwright test e2e/tests/01-setup-foundational.spec.ts

# Run tests matching pattern
npx playwright test -g "search"
```

## Test Configuration

- **Browser**: Chromium (desktop and mobile viewports)
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Timeout**: 30 seconds per test
- **Retries**: 2 in CI, 0 locally
- **Parallel**: Yes

## Authentication

Tests use Clerk for authentication. Configure test users in `.env.test`:

```env
TEST_AUTHOR_EMAIL=author@test.com
TEST_AUTHOR_PASSWORD=testpassword123
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpassword123
```

## Test Fixtures

- `authorPage`: Authenticated as Author role
- `adminPage`: Authenticated as Admin role

## Test Utilities

Located in `e2e/helpers/test-utils.ts`:

- `navigateTo(page, path)`: Navigate and wait for load
- `waitForLoadingComplete(page)`: Wait for skeletons to disappear
- `expectToast(page, message)`: Verify toast notification
- `fillTipTapEditor(page, content)`: Fill rich text editor
- `selectOption(page, trigger, option)`: Select from dropdown
- `generateTestData(prefix)`: Generate unique test data
- And more...

## Writing New Tests

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { navigateTo, waitForLoadingComplete } from '../helpers/test-utils';

test.describe('Feature Name', () => {
  test('should do something', async ({ authorPage }) => {
    await navigateTo(authorPage, '/dashboard');
    await waitForLoadingComplete(authorPage);

    // Your test assertions
    await expect(authorPage.getByRole('heading')).toBeVisible();
  });
});
```

## Test Reports

HTML reports are generated in `playwright-report/` after each run.
Screenshots on failure are saved to `test-results/`.
