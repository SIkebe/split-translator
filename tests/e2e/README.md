# E2E Tests for Split Translator

This directory contains end-to-end tests for the Split Translator browser extension using Playwright.

## Overview

The E2E tests validate the complete user workflows of the extension, including:

- ✅ Popup UI functionality and interactions
- ✅ Language selection and persistence
- ✅ Split + translate workflow
- ✅ Error handling for unsupported URLs
- ✅ Accessibility features
- ✅ Keyboard navigation

## Test Structure

```
tests/e2e/
├── utils/
│   └── extension-utils.ts    # Utilities for browser extension testing
├── popup.spec.ts            # Popup functionality tests
├── split-translate.spec.ts   # Core workflow tests
├── error-handling.spec.ts    # Error scenario tests
├── smoke.spec.ts            # Basic infrastructure tests
├── global-setup.ts          # Global test setup
└── global-teardown.ts       # Global test cleanup
```

## Running E2E Tests

### Prerequisites

1. **Build the extension** before running E2E tests:
   ```bash
   npm run build
   ```

2. **Display server required** for extension testing:
   - ⚠️ Chrome extensions **do not work in headless mode** - this is a Chrome limitation
   - Extension tests always run with `headless: false` even in CI environments
   - Ensure you have a display server available (X11, Xvfb, etc.)

### Available Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with visible browser (headed mode)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- tests/e2e/popup.spec.ts

# Debug tests interactively
npm run test:e2e:debug

# Open Playwright test UI
npm run test:e2e:ui

# Run smoke tests only (fastest)
npm run test:e2e -- tests/e2e/smoke.spec.ts
```

## Environment Requirements

### Local Development
- Works on Windows, macOS, and Linux with GUI
- Requires display server for headed browser testing

### CI/CD Environment
- ⚠️ **Always requires virtual display setup** (Xvfb, etc.) - headless mode is not supported for extension APIs
- Extensions must run with `headless: false` even in CI environments

### Example CI Setup (GitHub Actions)
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install chromium

- name: Setup virtual display (required for extension testing)
  run: |
    sudo apt-get update
    sudo apt-get install -y xvfb
    export DISPLAY=:99
    Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
    echo "DISPLAY=:99" >> $GITHUB_ENV

- name: Run E2E tests
  run: npm run test:e2e:smoke  # Or test:e2e:extension
```

## Test Scenarios

### 1. Popup Tests (`popup.spec.ts`)
- ✅ Popup loads with correct UI elements
- ✅ Default language selection (Japanese)
- ✅ Language selection changes
- ✅ Settings persistence between sessions
- ✅ Keyboard navigation (Tab, Escape)
- ✅ Accessibility attributes validation
- ✅ All language options available

### 2. Split + Translate Tests (`split-translate.spec.ts`)
- ✅ Complete workflow with valid URLs
- ✅ Status updates during operation
- ✅ Button state management
- ✅ Different content types handling
- ✅ Language selection validation
- ✅ Error recovery and retry capability

### 3. Error Handling Tests (`error-handling.spec.ts`)
- ✅ chrome:// URL rejection
- ✅ file:// URL rejection
- ✅ Google Translate URL handling
- ✅ Extension page rejection
- ✅ Network error handling
- ✅ Missing tab scenarios
- ✅ Invalid tab data handling
- ✅ Error message display
- ✅ Recovery from errors

### 4. Infrastructure Tests (`smoke.spec.ts`)
- ✅ Browser launch capability
- ✅ Extension files accessibility
- ✅ Basic Playwright functionality

## Extension Testing Limitations

Browser extension E2E testing has some inherent limitations:

1. **Headed Mode Required**: Chrome extension APIs are not available in headless mode
2. **Chrome API Availability**: Some APIs may not work in test environments
3. **Window Management**: Actual window splitting requires real display
4. **Network Dependencies**: Google Translate integration requires internet access

## Test Development Guidelines

### Adding New Tests

1. **Use existing utilities**: Leverage `ExtensionTestUtils` for common operations
2. **Handle test environment limitations**: Tests should gracefully handle API unavailability
3. **Focus on user workflows**: Test complete user journeys, not just individual functions
4. **Include error scenarios**: Test both success and failure paths

### Test Patterns

```typescript
import { test, expect } from '@playwright/test';
import { ExtensionTestUtils, ExtensionTestContext } from './utils/extension-utils';

test.describe('Feature Tests', () => {
  let testContext: ExtensionTestContext;

  test.beforeEach(async () => {
    testContext = await ExtensionTestUtils.launchExtension();
  });

  test.afterEach(async () => {
    await ExtensionTestUtils.cleanup(testContext);
  });

  test('should test specific feature', async () => {
    const popupPage = await ExtensionTestUtils.openPopup(
      testContext.context, 
      testContext.extensionId
    );
    
    // Test implementation
    await expect(popupPage.locator('#element')).toBeVisible();
  });
});
```

## Troubleshooting

### Common Issues

1. **"Missing X server or $DISPLAY"**
   - Solution: Set up virtual display (Xvfb) or run on machine with GUI

2. **"Extension not found"**
   - Solution: Ensure `npm run build` has been run first

3. **"Target page has been closed"**
   - Solution: Check browser launch arguments and display availability

4. **Extension APIs not working**
   - Expected: Some APIs have limited support in test environments
   - Tests should handle these gracefully

### Debug Mode

Use debug mode to inspect test execution:
```bash
npm run test:e2e:debug
```

This opens the Playwright inspector for step-by-step debugging.

## Future Enhancements

Potential improvements for the E2E test suite:

- [ ] Mock Google Translate API for consistent testing
- [ ] Add visual regression testing for UI components
- [ ] Implement cross-browser testing (Firefox, Edge)
- [ ] Add performance testing for window operations
- [ ] Create test data fixtures for different page types
- [ ] Add automated accessibility scanning