// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const splitAndTranslateButton = document.getElementById('splitAndTranslate');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const statusDiv = document.getElementById('status');

  // Helper function to ensure `.status-text` span exists
  function ensureStatusTextSpan() {
    if (!statusDiv.querySelector('.status-text')) {
      const statusTextSpan = document.createElement('span');
      statusTextSpan.className = 'status-text';
      statusDiv.appendChild(statusTextSpan);
    }
  }

  // Initialize status text span
  ensureStatusTextSpan();

  // Set initial status message
  updateStatus('Select a language and click "Split + Translate"', 'info');

  // Helper function to update status with proper accessibility
  function updateStatus(message, type = 'info') {
    ensureStatusTextSpan();
    const statusTextSpan = statusDiv.querySelector('.status-text');
    statusTextSpan.textContent = message;
    statusDiv.classList.remove('info', 'error', 'success');
    statusDiv.classList.add(type);

    // Force screen reader announcement for important messages
    if (type === 'error' || type === 'success') {
      statusDiv.setAttribute('aria-live', 'assertive');
      // The 100ms delay ensures screen readers announce the updated status message properly
      setTimeout(() => {
        statusDiv.setAttribute('aria-live', 'polite');
      }, 100);
    }
  }

  // Initialize focus management
  function initializeFocusManagement() {
    // Set initial focus to the language select for better UX
    setTimeout(() => {
      targetLanguageSelect.focus();
    }, 100);
  }

  initializeFocusManagement();

  // Load saved language settings
  chrome.storage.sync.get(['targetLanguage'], function(result) {
    if (result.targetLanguage) {
      targetLanguageSelect.value = result.targetLanguage;
    }
  });

  // Save language selection
  targetLanguageSelect.addEventListener('change', function() {
    chrome.storage.sync.set({
      targetLanguage: targetLanguageSelect.value
    });

    // Announce language change to screen readers
    updateStatus(`Language selected: ${targetLanguageSelect.options[targetLanguageSelect.selectedIndex].text}`, 'info');
  });

  // Helper function to get current focusable elements
  function getFocusableElements() {
    const elements = document.querySelectorAll(
      'button, select, input, [tabindex]:not([tabindex="-1"])'
    );
    return {
      elements: elements,
      first: elements.length > 0 ? elements[0] : null,
      last: elements.length > 0 ? elements[elements.length - 1] : null
    };
  }

  // Unified keyboard navigation support
  document.addEventListener('keydown', function(event) {
    // Handle Enter key on button
    if (event.key === 'Enter' && event.target === splitAndTranslateButton) {
      event.preventDefault();
      splitAndTranslateButton.click();
      return;
    }

    // Handle Escape key to close popup
    if (event.key === 'Escape') {
      window.close();
      return;
    }

    // Handle Tab key for focus management
    if (event.key === 'Tab') {
      // Recalculate focusable elements each time to handle dynamic changes
      // (e.g., status updates, disabled states)
      const focusable = getFocusableElements();

      if (focusable.first && focusable.last) {
        if (event.shiftKey) {
          if (document.activeElement === focusable.first) {
            event.preventDefault();
            focusable.last.focus();
          }
        } else {
          if (document.activeElement === focusable.last) {
            event.preventDefault();
            focusable.first.focus();
          }
        }
      }
    }
  });

  // Split + Translate button click event
  splitAndTranslateButton.addEventListener('click', async function() {
    try {
      splitAndTranslateButton.disabled = true;
      splitAndTranslateButton.setAttribute('aria-disabled', 'true');
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

        // Close popup after 1 second
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        throw new Error(response.error || 'Failed to split + translate');
      }
    } catch (error) {
      console.error('Split + translation error:', error);
      updateStatus(`Error: ${error.message}`, 'error');
    } finally {
      splitAndTranslateButton.disabled = false;
      splitAndTranslateButton.removeAttribute('aria-busy');
      splitAndTranslateButton.removeAttribute('aria-disabled');
    }
  });
});
