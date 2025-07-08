// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const splitAndTranslateButton = document.getElementById('splitAndTranslate');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const statusDiv = document.getElementById('status');

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
  });

  // Split + Translate button click event
  splitAndTranslateButton.addEventListener('click', async function() {
    try {
      splitAndTranslateButton.disabled = true;
      statusDiv.textContent = 'Getting current tab information...';

      // Get current tab information
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!currentTab) {
        throw new Error('Could not get current tab');
      }

      statusDiv.textContent = 'Executing split view + translation...';

      // Send split + translate instruction to background script
      const response = await chrome.runtime.sendMessage({
        action: 'splitAndTranslate',
        currentTab: currentTab,
        targetLanguage: targetLanguageSelect.value
      });

      if (response.success) {
        statusDiv.textContent = 'Split + translation completed!';
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';

        // Close popup after 1 second
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        throw new Error(response.error || 'Failed to split + translate');
      }
    } catch (error) {
      console.error('Split + translation error:', error);

      // Display detailed error messages in English
      let errorMessage = error.message;
      if (error.message.includes('minimum')) {
        errorMessage = 'Window size is too small. Please maximize the browser and try again.';
      } else if (error.message.includes('not defined')) {
        errorMessage = 'Failed to get screen information. Please reload the page and try again.';
      }

      statusDiv.textContent = `Error: ${errorMessage}`;
      statusDiv.style.backgroundColor = '#f8d7da';
      statusDiv.style.color = '#721c24';

      // Restore original color after 5 seconds
      setTimeout(() => {
        statusDiv.style.backgroundColor = '#f8f9fa';
        statusDiv.style.color = '#666';
        statusDiv.textContent = 'Select a language and click "Split + Translate"';
      }, 5000);
    } finally {
      splitAndTranslateButton.disabled = false;
    }
  });
});
