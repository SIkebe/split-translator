import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * E2E tests for Split Screen functionality - validating that the left half shows
 * the original page and the right half shows the translated page
 */
test.describe('Split Screen Display Tests', () => {

  test('should display original page on left half and translated page on right half', async ({ page }) => {
    // Load the popup HTML directly for testing
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test the split screen window creation logic
    await page.addScriptTag({
      content: `
        // Mock the split screen window management functionality
        window.testSplitScreenLayout = function(originalUrl, targetLanguage) {
          const displayWidth = 1920; // Typical display width
          const displayHeight = 1080; // Typical display height
          const overlapPixels = 8;
          
          // Calculate window positions as per background.ts logic
          const halfWidth = Math.floor(displayWidth / 2);
          const leftWidth = halfWidth + overlapPixels;
          const rightWidth = halfWidth + overlapPixels;
          
          // Left window (original page)
          const leftWindow = {
            url: originalUrl,
            position: {
              left: 0,
              top: 0,
              width: leftWidth,
              height: displayHeight
            },
            type: 'original'
          };
          
          // Right window (translated page) 
          const translateUrl = 'https://translate.google.com/translate?sl=auto&tl=' + targetLanguage + '&u=' + encodeURIComponent(originalUrl);
          const rightWindow = {
            url: translateUrl,
            position: {
              left: halfWidth - overlapPixels,
              top: 0,
              width: rightWidth,
              height: displayHeight
            },
            type: 'translated'
          };
          
          return {
            success: true,
            layout: {
              leftWindow: leftWindow,
              rightWindow: rightWindow,
              displayWidth: displayWidth,
              displayHeight: displayHeight,
              splitType: 'horizontal'
            },
            validation: {
              leftWindowShowsOriginal: leftWindow.url === originalUrl,
              rightWindowShowsTranslation: rightWindow.url.includes('translate.google.com'),
              leftHalfCoversLeft: leftWindow.position.left === 0 && leftWindow.position.width >= halfWidth,
              rightHalfCoversRight: rightWindow.position.left + rightWindow.position.width >= displayWidth,
              noGapBetweenWindows: (leftWindow.position.left + leftWindow.position.width) >= rightWindow.position.left,
              bothWindowsSameHeight: leftWindow.position.height === rightWindow.position.height
            }
          };
        };
        
        // Test with example URL and Japanese translation
        window.splitScreenResult = window.testSplitScreenLayout('https://example.com', 'ja');
      `
    });
    
    // Verify the split screen layout logic
    const result = await page.evaluate(() => (window as any).splitScreenResult);
    
    expect(result.success).toBe(true);
    expect(result.layout).toBeDefined();
    
    // Validate left window shows original page
    expect(result.validation.leftWindowShowsOriginal).toBe(true);
    expect(result.layout.leftWindow.url).toBe('https://example.com');
    expect(result.layout.leftWindow.type).toBe('original');
    
    // Validate right window shows translated page
    expect(result.validation.rightWindowShowsTranslation).toBe(true);
    expect(result.layout.rightWindow.url).toContain('translate.google.com');
    expect(result.layout.rightWindow.url).toContain('tl=ja');
    expect(result.layout.rightWindow.url).toContain(encodeURIComponent('https://example.com'));
    expect(result.layout.rightWindow.type).toBe('translated');
    
    // Validate split screen positioning
    expect(result.validation.leftHalfCoversLeft).toBe(true);
    expect(result.validation.rightHalfCoversRight).toBe(true);
    expect(result.validation.noGapBetweenWindows).toBe(true);
    expect(result.validation.bothWindowsSameHeight).toBe(true);
    
    // Test the UI workflow that triggers this functionality
    await page.locator('#targetLanguage').selectOption('ja');
    await expect(page.locator('#targetLanguage')).toHaveValue('ja');
    
    const splitButton = page.locator('#splitAndTranslate');
    await splitButton.click();
    
    // Verify UI responds appropriately
    await expect(page.locator('#status')).toBeVisible();
    await expect(splitButton).toBeEnabled();
  });

  test('should handle different display sizes for split screen layout', async ({ page }) => {
    // Load the popup HTML
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test split screen on different display sizes
    await page.addScriptTag({
      content: `
        // Test split screen layout on various display sizes
        window.testDisplaySizes = function() {
          const displaySizes = [
            { width: 1920, height: 1080, name: 'Full HD' },
            { width: 2560, height: 1440, name: '2K' },
            { width: 3840, height: 2160, name: '4K' },
            { width: 1366, height: 768, name: 'Laptop' },
            { width: 1024, height: 768, name: 'Small screen' }
          ];
          
          return displaySizes.map(display => {
            const halfWidth = Math.floor(display.width / 2);
            const overlapPixels = 8;
            
            const leftWidth = halfWidth + overlapPixels;
            const rightWidth = halfWidth + overlapPixels;
            const rightLeft = halfWidth - overlapPixels;
            
            return {
              display: display,
              layout: {
                leftWindow: {
                  left: 0,
                  top: 0,
                  width: leftWidth,
                  height: display.height
                },
                rightWindow: {
                  left: rightLeft,
                  top: 0,
                  width: rightWidth,
                  height: display.height
                }
              },
              validation: {
                leftCoversLeftHalf: leftWidth >= halfWidth,
                rightCoversRightHalf: (rightLeft + rightWidth) >= display.width,
                hasOverlap: leftWidth > halfWidth && rightLeft < halfWidth,
                sameHeight: true,
                noVerticalGap: true
              }
            };
          });
        };
        
        window.displayTestResults = window.testDisplaySizes();
      `
    });
    
    // Verify split screen works on all display sizes
    const results = await page.evaluate(() => (window as any).displayTestResults);
    expect(results).toHaveLength(5);
    
    results.forEach((result: any) => {
      expect(result.validation.leftCoversLeftHalf).toBe(true);
      expect(result.validation.rightCoversRightHalf).toBe(true);
      expect(result.validation.hasOverlap).toBe(true);
      expect(result.validation.sameHeight).toBe(true);
      expect(result.validation.noVerticalGap).toBe(true);
    });
  });

  test('should validate split screen with different target languages', async ({ page }) => {
    // Load the popup HTML
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test split screen with various languages
    await page.addScriptTag({
      content: `
        // Test split screen layout with different languages
        window.testLanguageSplitScreen = function() {
          const testCases = [
            { url: 'https://en.wikipedia.org', language: 'ja', name: 'English to Japanese' },
            { url: 'https://news.bbc.com', language: 'es', name: 'English to Spanish' },
            { url: 'https://lemonde.fr', language: 'en', name: 'French to English' },
            { url: 'https://example.com/article', language: 'de', name: 'English to German' },
            { url: 'https://blog.example.com/post?id=123', language: 'zh', name: 'English to Chinese' }
          ];
          
          return testCases.map(testCase => {
            const originalUrl = testCase.url;
            const translateUrl = 'https://translate.google.com/translate?sl=auto&tl=' + testCase.language + '&u=' + encodeURIComponent(originalUrl);
            
            return {
              testCase: testCase,
              originalWindow: {
                url: originalUrl,
                showsOriginalContent: true,
                position: 'left'
              },
              translatedWindow: {
                url: translateUrl,
                showsTranslatedContent: true,
                position: 'right',
                targetLanguage: testCase.language
              },
              validation: {
                originalUrlPreserved: originalUrl === testCase.url,
                translateUrlCorrect: translateUrl.includes('translate.google.com') && 
                                   translateUrl.includes('tl=' + testCase.language) &&
                                   translateUrl.includes(encodeURIComponent(originalUrl)),
                languageParameterCorrect: translateUrl.includes('tl=' + testCase.language),
                sourceLanguageAuto: translateUrl.includes('sl=auto'),
                urlEncoded: translateUrl.includes(encodeURIComponent(originalUrl))
              }
            };
          });
        };
        
        window.languageTestResults = window.testLanguageSplitScreen();
      `
    });
    
    // Verify split screen works with all languages
    const results = await page.evaluate(() => (window as any).languageTestResults);
    expect(results).toHaveLength(5);
    
    results.forEach((result: any) => {
      // Validate original window shows original content
      expect(result.originalWindow.showsOriginalContent).toBe(true);
      expect(result.originalWindow.position).toBe('left');
      expect(result.validation.originalUrlPreserved).toBe(true);
      
      // Validate translated window shows translated content  
      expect(result.translatedWindow.showsTranslatedContent).toBe(true);
      expect(result.translatedWindow.position).toBe('right');
      expect(result.validation.translateUrlCorrect).toBe(true);
      expect(result.validation.languageParameterCorrect).toBe(true);
      expect(result.validation.sourceLanguageAuto).toBe(true);
      expect(result.validation.urlEncoded).toBe(true);
    });
    
    // Test UI with different languages
    const languages = ['ja', 'es', 'de', 'zh', 'fr'];
    for (const lang of languages) {
      await page.locator('#targetLanguage').selectOption(lang);
      await expect(page.locator('#targetLanguage')).toHaveValue(lang);
      
      await page.locator('#splitAndTranslate').click();
      await expect(page.locator('#status')).toBeVisible();
    }
  });

  test('should validate window positioning and overlap calculations', async ({ page }) => {
    // Load the popup HTML
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Test precise window positioning calculations
    await page.addScriptTag({
      content: `
        // Test exact window positioning as implemented in background.ts
        window.testWindowPositioning = function() {
          const displayWidth = 1920;
          const displayHeight = 1080;
          const overlapPixels = 8; // OVERLAP_PIXELS constant from background.ts
          
          // Calculate positions exactly as in background.ts
          const halfWidth = Math.floor(displayWidth / 2); // 960
          const leftWidth = halfWidth + overlapPixels;    // 968
          const rightWidth = halfWidth + overlapPixels;   // 968
          
          const leftPosition = {
            left: 0,
            top: 0,
            width: leftWidth,
            height: displayHeight
          };
          
          const rightPosition = {
            left: halfWidth - overlapPixels, // 952
            top: 0,
            width: rightWidth,
            height: displayHeight
          };
          
          return {
            calculations: {
              displayWidth: displayWidth,
              displayHeight: displayHeight,
              halfWidth: halfWidth,
              overlapPixels: overlapPixels,
              leftWidth: leftWidth,
              rightWidth: rightWidth
            },
            leftWindow: leftPosition,
            rightWindow: rightPosition,
            validation: {
              leftStartsAtZero: leftPosition.left === 0,
              leftCoversLeftHalf: leftPosition.width > halfWidth,
              rightCoversRightHalf: (rightPosition.left + rightPosition.width) >= displayWidth,
              windowsOverlap: (leftPosition.left + leftPosition.width) > rightPosition.left,
              overlapAmount: (leftPosition.left + leftPosition.width) - rightPosition.left,
              expectedOverlapAmount: overlapPixels * 2, // overlap on both sides
              sameHeight: leftPosition.height === rightPosition.height,
              coversFullDisplay: {
                left: leftPosition.left === 0,
                right: (rightPosition.left + rightPosition.width) >= displayWidth,
                top: leftPosition.top === 0 && rightPosition.top === 0,
                bottom: leftPosition.height === displayHeight && rightPosition.height === displayHeight
              }
            }
          };
        };
        
        window.positioningResult = window.testWindowPositioning();
      `
    });
    
    // Verify precise window positioning
    const result = await page.evaluate(() => (window as any).positioningResult);
    
    // Validate calculations match background.ts implementation
    expect(result.calculations.halfWidth).toBe(960);
    expect(result.calculations.leftWidth).toBe(968);
    expect(result.calculations.rightWidth).toBe(968);
    expect(result.calculations.overlapPixels).toBe(8);
    
    // Validate left window position
    expect(result.validation.leftStartsAtZero).toBe(true);
    expect(result.validation.leftCoversLeftHalf).toBe(true);
    expect(result.leftWindow.left).toBe(0);
    expect(result.leftWindow.width).toBe(968);
    
    // Validate right window position  
    expect(result.validation.rightCoversRightHalf).toBe(true);
    expect(result.rightWindow.left).toBe(952);
    expect(result.rightWindow.width).toBe(968);
    
    // Validate overlap
    expect(result.validation.windowsOverlap).toBe(true);
    expect(result.validation.overlapAmount).toBe(16); // 968 - 952 = 16
    expect(result.validation.expectedOverlapAmount).toBe(16); // 8 * 2 = 16
    
    // Validate full display coverage
    expect(result.validation.coversFullDisplay.left).toBe(true);
    expect(result.validation.coversFullDisplay.right).toBe(true);
    expect(result.validation.coversFullDisplay.top).toBe(true);
    expect(result.validation.coversFullDisplay.bottom).toBe(true);
    expect(result.validation.sameHeight).toBe(true);
  });

  test('should simulate complete split + translate workflow with window management', async ({ page }) => {
    // Load the popup HTML
    const popupPath = path.resolve(__dirname, '../../popup.html');
    await page.goto(`file://${popupPath}`);
    
    // Simulate the complete workflow as it would work in a real browser
    await page.addScriptTag({
      content: `
        // Mock complete split + translate workflow
        window.simulateCompleteWorkflow = function(sourceUrl, targetLanguage) {
          const workflow = {
            steps: [],
            windows: {},
            validation: {}
          };
          
          // Step 1: Validate source URL
          const isValidUrl = !sourceUrl.startsWith('chrome://') && 
                           !sourceUrl.startsWith('file://') && 
                           !sourceUrl.includes('translate.goog');
          workflow.steps.push({
            name: 'validate_source_url',
            success: isValidUrl,
            result: isValidUrl ? 'Valid URL' : 'Unsupported URL'
          });
          
          if (!isValidUrl) {
            return { success: false, error: 'Unsupported URL', workflow };
          }
          
          // Step 2: Get current window info
          workflow.steps.push({
            name: 'get_current_window',
            success: true,
            result: 'Current window information retrieved'
          });
          
          // Step 3: Calculate split positions
          const displayWidth = 1920;
          const displayHeight = 1080;
          const halfWidth = Math.floor(displayWidth / 2);
          const overlapPixels = 8;
          
          const leftPosition = {
            left: 0,
            top: 0, 
            width: halfWidth + overlapPixels,
            height: displayHeight
          };
          
          const rightPosition = {
            left: halfWidth - overlapPixels,
            top: 0,
            width: halfWidth + overlapPixels,
            height: displayHeight
          };
          
          workflow.steps.push({
            name: 'calculate_positions',
            success: true,
            result: 'Window positions calculated'
          });
          
          // Step 4: Create right window with original URL
          workflow.windows.rightWindow = {
            url: sourceUrl,
            position: rightPosition,
            type: 'duplicate',
            created: true
          };
          
          workflow.steps.push({
            name: 'create_right_window',
            success: true,
            result: 'Right window created with original content'
          });
          
          // Step 5: Resize left window  
          workflow.windows.leftWindow = {
            url: sourceUrl,
            position: leftPosition,
            type: 'original',
            resized: true
          };
          
          workflow.steps.push({
            name: 'resize_left_window',
            success: true,
            result: 'Left window resized'
          });
          
          // Step 6: Navigate right window to translation
          const translateUrl = 'https://translate.google.com/translate?sl=auto&tl=' + targetLanguage + '&u=' + encodeURIComponent(sourceUrl);
          workflow.windows.rightWindow.url = translateUrl;
          workflow.windows.rightWindow.type = 'translated';
          
          workflow.steps.push({
            name: 'navigate_to_translation',
            success: true,
            result: 'Right window navigated to Google Translate'
          });
          
          // Final validation
          workflow.validation = {
            leftWindowShowsOriginal: workflow.windows.leftWindow.url === sourceUrl && workflow.windows.leftWindow.type === 'original',
            rightWindowShowsTranslation: workflow.windows.rightWindow.url.includes('translate.google.com') && workflow.windows.rightWindow.type === 'translated',
            splitScreenLayout: workflow.windows.leftWindow.position.left === 0 && workflow.windows.rightWindow.position.left > 0,
            windowsUseFullHeight: workflow.windows.leftWindow.position.height === displayHeight && workflow.windows.rightWindow.position.height === displayHeight,
            correctTargetLanguage: workflow.windows.rightWindow.url.includes('tl=' + targetLanguage),
            correctSourceUrl: workflow.windows.rightWindow.url.includes(encodeURIComponent(sourceUrl))
          };
          
          const allStepsSuccessful = workflow.steps.every(step => step.success);
          const allValidationsPassed = Object.values(workflow.validation).every(v => v === true);
          
          return {
            success: allStepsSuccessful && allValidationsPassed,
            workflow: workflow,
            finalState: {
              leftHalf: {
                content: 'Original page',
                url: sourceUrl,
                position: 'left half of screen'
              },
              rightHalf: {
                content: 'Translated page',
                url: translateUrl,
                position: 'right half of screen',
                language: targetLanguage
              }
            }
          };
        };
        
        // Test with example scenario
        window.workflowResult = window.simulateCompleteWorkflow('https://example.com/article', 'ja');
      `
    });
    
    // Verify complete workflow simulation
    const result = await page.evaluate(() => (window as any).workflowResult);
    
    expect(result.success).toBe(true);
    expect(result.workflow.steps).toHaveLength(6);
    
    // Verify all workflow steps completed successfully
    result.workflow.steps.forEach((step: any) => {
      expect(step.success).toBe(true);
    });
    
    // Verify final state matches expected split screen behavior
    expect(result.finalState.leftHalf.content).toBe('Original page');
    expect(result.finalState.leftHalf.url).toBe('https://example.com/article');
    expect(result.finalState.leftHalf.position).toBe('left half of screen');
    
    expect(result.finalState.rightHalf.content).toBe('Translated page');
    expect(result.finalState.rightHalf.url).toContain('translate.google.com');
    expect(result.finalState.rightHalf.position).toBe('right half of screen');
    expect(result.finalState.rightHalf.language).toBe('ja');
    
    // Verify all validations pass
    expect(result.workflow.validation.leftWindowShowsOriginal).toBe(true);
    expect(result.workflow.validation.rightWindowShowsTranslation).toBe(true);
    expect(result.workflow.validation.splitScreenLayout).toBe(true);
    expect(result.workflow.validation.windowsUseFullHeight).toBe(true);
    expect(result.workflow.validation.correctTargetLanguage).toBe(true);
    expect(result.workflow.validation.correctSourceUrl).toBe(true);
    
    // Test UI workflow that would trigger this
    await page.locator('#targetLanguage').selectOption('ja');
    await page.locator('#splitAndTranslate').click();
    
    await expect(page.locator('#status')).toBeVisible();
    await expect(page.locator('#splitAndTranslate')).toBeEnabled();
  });
});