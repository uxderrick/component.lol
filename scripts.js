// scripts.js
// Author:
// Author URI: https://
// Author Github URI: https://www.github.com/
// Project Repository URI: https://github.com/
// Description: Handles all the popup level activities (e.g. UI interactions, etc.)
// License: MIT

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  
  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('Error querying tabs:', chrome.runtime.lastError);
      return;
    }
    
    const currentTab = tabs[0];
    console.log('Current tab:', currentTab);
    
    // Send message to content script to get meta data
    chrome.tabs.sendMessage(currentTab.id, { action: 'getMetaData' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        document.getElementById('website-title').textContent = 'Error: Content script not loaded';
        document.getElementById('website-description').textContent = 'Please refresh the page and try again';
        return;
      }
      
      if (response) {
        console.log('Received response:', response);
        // Update the title and description in the popup
        document.getElementById('website-title').textContent = response.title || 'No title available';
        document.getElementById('website-description').textContent = response.description || 'No description available';
      } else {
        console.log('No response received');
        document.getElementById('website-title').textContent = 'Unable to fetch title';
        document.getElementById('website-description').textContent = 'Unable to fetch description';
      }
    });
  });

  // Function to extract colors from CSS
  function extractColors() {
    // Get all stylesheets
    const stylesheets = Array.from(document.styleSheets);
    const colors = new Set();

    stylesheets.forEach(sheet => {
      try {
        // Get all CSS rules
        const rules = Array.from(sheet.cssRules || sheet.rules);
        rules.forEach(rule => {
          if (rule.style) {
            // Check background-color
            if (rule.style.backgroundColor) {
              colors.add(rule.style.backgroundColor);
            }
            // Check color
            if (rule.style.color) {
              colors.add(rule.style.color);
            }
            // Check border-color
            if (rule.style.borderColor) {
              colors.add(rule.style.borderColor);
            }
          }
        });
      } catch (e) {
        console.warn('Could not access stylesheet:', e);
      }
    });

    // Get computed styles from all elements
    const allElements = document.getElementsByTagName('*');
    Array.from(allElements).forEach(element => {
      const styles = window.getComputedStyle(element);
      if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        colors.add(styles.backgroundColor);
      }
      if (styles.color) {
        colors.add(styles.color);
      }
      if (styles.borderColor) {
        colors.add(styles.borderColor);
      }
    });

    // Log all unique colors
    console.log('Found colors:', Array.from(colors));
    return Array.from(colors);
  }

  // Add click handler for colors card
  const colorsCard = document.getElementById('colors-card');
  if (colorsCard) {
    colorsCard.addEventListener('click', () => {
      // Extract and display colors
      const colors = extractColors();
      console.log('Colors extracted:', colors);
      // Load colors page in the popup
      window.location.href = 'pages/colors.html';
    });
  }
});
