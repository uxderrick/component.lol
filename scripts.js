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

  // Add click handler for colors card
  const colorsCard = document.getElementById('colors-card');
  if (colorsCard) {
    colorsCard.addEventListener('click', () => {
      window.location.href = 'pages/colors.html';
    });
  }
});

// Listen for tab updates to refresh counters
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated, refreshing counters');
  }
});
