// Mock for popup.ts testing

export class PopupMock {
  static simulateDOMContentLoaded(): void {
    // Simulate the DOMContentLoaded event and popup initialization
    const targetLanguageSelect = document.getElementById('targetLanguage') as HTMLSelectElement;
    const splitAndTranslateButton = document.getElementById('splitAndTranslate') as HTMLButtonElement;
    const statusDiv = document.getElementById('status') as HTMLDivElement;

    if (!targetLanguageSelect || !splitAndTranslateButton || !statusDiv) {
      return; // Elements not found
    }

    // Initialize status text span (once only)
    const statusTextSpan = document.createElement('span');
    statusTextSpan.className = 'status-text';
    statusDiv.appendChild(statusTextSpan);

    // Helper function to update status with proper accessibility
    function updateStatus(message: string, type: 'info' | 'error' | 'success' = 'info'): void {
      statusTextSpan.textContent = message;
      statusDiv.classList.remove('info', 'error', 'success');
      statusDiv.classList.add(type);

      // Force screen reader announcement for important messages only
      if (type === 'error' || type === 'success') {
        statusDiv.setAttribute('aria-live', 'assertive');
        // In test environment, set immediately
        statusDiv.setAttribute('aria-live', 'polite');
      }
    }

    // Set initial status message
    updateStatus('Select a language and click "Split + Translate"', 'info');

    // Initialize focus management
    // In test environment, focus immediately
    targetLanguageSelect.focus();

    // Load saved language settings
    chrome.storage.sync.get(['targetLanguage'], function(result: { targetLanguage?: string }) {
      if (result.targetLanguage) {
        targetLanguageSelect.value = result.targetLanguage;
      }
    });

    // Save language selection
    targetLanguageSelect.addEventListener('change', function() {
      chrome.storage.sync.set({
        targetLanguage: targetLanguageSelect.value
      });

      // Announce language change to screen readers (simpler message)
      const selectedOption = targetLanguageSelect.options[targetLanguageSelect.selectedIndex];
      updateStatus(`Language changed to ${selectedOption.text}`, 'info');
    });

    // Helper function to get current focusable elements
    function getFocusableElements(): { elements: NodeListOf<HTMLElement>; first: HTMLElement | null; last: HTMLElement | null } {
      const elements = document.querySelectorAll<HTMLElement>(
        'button, select, input, [tabindex]:not([tabindex="-1"])'
      );
      return {
        elements: elements,
        first: elements.length > 0 ? elements[0] : null,
        last: elements.length > 0 ? elements[elements.length - 1] : null
      };
    }

    // Unified keyboard navigation support
    document.addEventListener('keydown', function(event: KeyboardEvent) {
      // Handle Escape key to close popup
      if (event.key === 'Escape') {
        window.close();
        return;
      }

      // Handle Tab key for focus management
      if (event.key === 'Tab') {
        const focusable = getFocusableElements();

        if (focusable.first && focusable.last) {
          if (event.shiftKey && document.activeElement === focusable.first) {
            event.preventDefault();
            (focusable.last as HTMLElement).focus();
          } else if (!event.shiftKey && document.activeElement === focusable.last) {
            event.preventDefault();
            (focusable.first as HTMLElement).focus();
          }
        }
      }
    });

    // Split + Translate button click event
    splitAndTranslateButton.addEventListener('click', async function() {
      try {
        splitAndTranslateButton.disabled = true;
        splitAndTranslateButton.setAttribute('aria-busy', 'true');
        updateStatus('Getting current tab information...', 'info');

        // Get current tab information
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!currentTab) {
          throw new Error('Could not get current tab');
        }

        updateStatus('Executing split view + translation...', 'info');

        // Send split + translate instruction to background script
        const response = await chrome.runtime.sendMessage({
          action: 'splitAndTranslate',
          currentTab: currentTab,
          targetLanguage: targetLanguageSelect.value
        });

        if (response.success) {
          updateStatus('Split + translation completed successfully!', 'success');

          // In test environment, close immediately
          window.close();
        } else {
          throw new Error(response.error || 'Failed to split + translate');
        }
      } catch (error) {
        console.error('Split + translation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        updateStatus(`Error: ${errorMessage}`, 'error');
      } finally {
        splitAndTranslateButton.disabled = false;
        splitAndTranslateButton.removeAttribute('aria-busy');
      }
    });
  }
}
