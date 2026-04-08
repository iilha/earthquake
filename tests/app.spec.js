const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8006';

test.describe('Earthquake Standalone PWA', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Earthquake/i);
  });

  test('no cross-app links in navigation', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check header controls - should not have links to other apps
    const headerControls = page.locator('.header-controls');

    // Should NOT have links to ubike, mrt, rail, bus, etc.
    await expect(headerControls.locator('a[href*="ubike"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="mrt"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="rail"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="bus"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="thsr"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="weather"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="oil"]')).toHaveCount(0);
  });

  test('map container exists', async ({ page }) => {
    await page.goto(BASE_URL);

    // Map container should be visible
    const mapContainer = page.locator('#map-container');
    await expect(mapContainer).toBeVisible();

    // Map canvas should exist
    const mapCanvas = page.locator('#map-canvas');
    await expect(mapCanvas).toBeVisible();
  });

  test('Leaflet map initializes', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for Leaflet to load
    await page.waitForFunction(() => window.L !== undefined);

    // Check if map instance exists
    const hasMap = await page.evaluate(() => {
      return window.map !== null && window.map !== undefined;
    });
    expect(hasMap).toBeTruthy();

    // Verify Leaflet controls are present
    const leafletControls = page.locator('.leaflet-control-zoom');
    await expect(leafletControls).toBeVisible();
  });

  test('earthquake list panel exists', async ({ page }) => {
    await page.goto(BASE_URL);

    // Panel should exist
    const panel = page.locator('#panel');
    await expect(panel).toBeVisible();

    // Earthquake list should exist
    const quakeList = page.locator('#quake-list');
    await expect(quakeList).toBeVisible();

    // Result count display should exist
    const resultCount = page.locator('#result-count');
    await expect(resultCount).toBeVisible();
  });

  test('filter controls exist and work', async ({ page }) => {
    await page.goto(BASE_URL);

    // Magnitude slider should exist
    const magSlider = page.locator('#mag-slider');
    await expect(magSlider).toBeVisible();
    await expect(magSlider).toHaveAttribute('min', '2');
    await expect(magSlider).toHaveAttribute('max', '7');
    await expect(magSlider).toHaveAttribute('step', '0.5');

    // Magnitude value display
    const magValue = page.locator('#mag-value');
    await expect(magValue).toBeVisible();
    await expect(magValue).toHaveText('2.0');

    // Change slider value
    await magSlider.fill('4');
    await expect(magValue).toHaveText('4.0');

    // Time range buttons should exist
    const timeBtn1d = page.locator('.time-btn[data-days="1"]');
    const timeBtn7d = page.locator('.time-btn[data-days="7"]');
    const timeBtn30d = page.locator('.time-btn[data-days="30"]');
    const timeBtn90d = page.locator('.time-btn[data-days="90"]');

    await expect(timeBtn1d).toBeVisible();
    await expect(timeBtn7d).toBeVisible();
    await expect(timeBtn30d).toBeVisible();
    await expect(timeBtn90d).toBeVisible();

    // 7d should be active by default
    await expect(timeBtn7d).toHaveClass(/active/);

    // Click 30d button
    await timeBtn30d.click();
    await expect(timeBtn30d).toHaveClass(/active/);
    await expect(timeBtn7d).not.toHaveClass(/active/);
  });

  test('language toggle works', async ({ page }) => {
    await page.goto(BASE_URL);

    // Language button should exist
    const langBtn = page.locator('#lang-btn');
    await expect(langBtn).toBeVisible();

    // Get initial language
    const initialLang = await langBtn.textContent();
    expect(initialLang).toMatch(/EN|中文/);

    // Click to toggle
    await langBtn.click();

    // Should change to other language
    const newLang = await langBtn.textContent();
    expect(newLang).toMatch(/EN|中文/);
    expect(newLang).not.toBe(initialLang);

    // Page title should update
    const pageTitle = page.locator('#page-title');
    await expect(pageTitle).toBeVisible();

    // Filter labels should have data attributes for localization
    const magLabel = page.locator('#lbl-mag');
    await expect(magLabel).toHaveAttribute('data-en');
    await expect(magLabel).toHaveAttribute('data-zh');
  });

  test('USGS API endpoint configured in page source', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check that USGS_API constant is defined
    const usgsApiDefined = await page.evaluate(() => {
      return typeof USGS_API !== 'undefined' && USGS_API.includes('earthquake.usgs.gov');
    });
    expect(usgsApiDefined).toBeTruthy();

    // Verify the API URL
    const apiUrl = await page.evaluate(() => USGS_API);
    expect(apiUrl).toContain('earthquake.usgs.gov/fdsnws/event/1/query');
  });

  test('notification settings button exists and opens modal', async ({ page }) => {
    await page.goto(BASE_URL);

    // Notification button should exist
    const notifyBtn = page.locator('#notify-btn');
    await expect(notifyBtn).toBeVisible();
    await expect(notifyBtn).toContainText('🔔');

    // Modal should be hidden initially
    const notifyModal = page.locator('#notify-modal');
    await expect(notifyModal).not.toHaveClass(/open/);

    // Click notification button
    await notifyBtn.click();

    // Modal should now be visible
    await expect(notifyModal).toHaveClass(/open/);

    // Modal should have title
    const modalTitle = page.locator('#modal-title');
    await expect(modalTitle).toBeVisible();

    // Push notification toggle should exist
    const pushToggle = page.locator('#push-toggle');
    await expect(pushToggle).toBeVisible();

    // Email input should exist
    const emailInput = page.locator('#email-input');
    await expect(emailInput).toBeVisible();

    // Close modal
    const modalClose = page.locator('.modal-close');
    await modalClose.click();
    await expect(notifyModal).not.toHaveClass(/open/);
  });

  test('locate button exists', async ({ page }) => {
    await page.goto(BASE_URL);

    // Locate button should exist
    const locateBtn = page.locator('.locate-btn');
    await expect(locateBtn).toBeVisible();
    await expect(locateBtn).toContainText('📍');
  });

  test('manifest.webapp is accessible', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/manifest.webapp`);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/json|application\/x-web-app-manifest\+json/);

    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('start_url');
  });

  test('service worker is accessible', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/sw.js`);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/javascript/);

    const swContent = await response.text();

    // Verify service worker has required event listeners
    expect(swContent).toContain('addEventListener(\'install\'');
    expect(swContent).toContain('addEventListener(\'activate\'');
    expect(swContent).toContain('addEventListener(\'fetch\'');
    expect(swContent).toContain('addEventListener(\'push\'');

    // Verify it handles earthquake-specific caching
    expect(swContent).toContain('earthquake');
    expect(swContent).toContain('earthquake.usgs.gov');
  });

  test('no JavaScript console errors on load', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto(BASE_URL);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Filter out known external errors (like API failures in test environment)
    const criticalErrors = consoleErrors.filter(error => {
      // Ignore network errors from external APIs
      return !error.includes('earthquake.usgs.gov') &&
             !error.includes('Failed to fetch') &&
             !error.includes('NetworkError');
    });

    expect(criticalErrors).toHaveLength(0);
  });

  test('bottom sheet exists on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    // Panel should exist
    const panel = page.locator('#panel');
    await expect(panel).toBeVisible();

    // Sheet handle should be visible on mobile
    const sheetHandle = page.locator('.sheet-handle');
    await expect(sheetHandle).toBeVisible();

    // Sheet pill (drag indicator) should exist
    const sheetPill = page.locator('.sheet-pill');
    await expect(sheetPill).toBeVisible();

    // Sheet summary should exist
    const sheetSummary = page.locator('#sheet-summary');
    await expect(sheetSummary).toBeVisible();
  });

  test('float buttons are positioned correctly', async ({ page }) => {
    await page.goto(BASE_URL);

    // Float button container should exist
    const floatBtnContainer = page.locator('.float-btn-container');
    await expect(floatBtnContainer).toBeVisible();

    // Should contain language, notify, and locate buttons
    const floatButtons = floatBtnContainer.locator('.float-btn');
    await expect(floatButtons).toHaveCount(3);

    // Check for specific buttons
    await expect(floatBtnContainer.locator('.lang-btn')).toBeVisible();
    await expect(floatBtnContainer.locator('.notify-btn')).toBeVisible();
    await expect(floatBtnContainer.locator('.locate-btn')).toBeVisible();
  });

  test('earthquake list renders with proper structure', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for potential earthquake data to load
    await page.waitForTimeout(2000);

    // Check if filter box is visible
    const filterBox = page.locator('.filter-box');
    await expect(filterBox).toBeVisible();

    // Result count should be visible
    const resultCount = page.locator('#result-count');
    await expect(resultCount).toBeVisible();

    // Earthquake list should be present
    const quakeList = page.locator('#quake-list');
    await expect(quakeList).toBeVisible();
  });

  test('page is responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);

    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Panel should be visible as sidebar on desktop
    const panel = page.locator('#panel');
    await expect(panel).toBeVisible();

    // Map should be visible
    const mapCanvas = page.locator('#map-canvas');
    await expect(mapCanvas).toBeVisible();
  });

  test('page has correct meta tags for PWA', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('initial-scale=1.0');

    // Check theme color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();

    // Check manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', 'manifest.webapp');

    // Check apple touch icon
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveAttribute('href', 'img/icon-180.png');
  });

  test('Leaflet CSS is loaded', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check if Leaflet CSS link exists
    const leafletCss = page.locator('link[href*="leaflet"]');
    await expect(leafletCss).toHaveCount(1);

    // Verify Leaflet styles are applied by checking for Leaflet-specific classes
    await page.waitForSelector('.leaflet-container', { timeout: 5000 });
  });

  test('bottom-sheet.js is loaded', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check if bottom-sheet.js script is present in the page
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).map(s => s.src);
    });

    const hasBottomSheet = scripts.some(src => src.includes('bottom-sheet.js'));
    expect(hasBottomSheet).toBeTruthy();
  });
});
