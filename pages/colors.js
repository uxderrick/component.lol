// Function to get all colors used in the page
async function getAllColors() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      return new Map();
    }
    
    // Send message to content script to get colors
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getColors' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with content script:', chrome.runtime.lastError);
          resolve(new Map());
          return;
        }
        
        if (!response) {
          console.error('No response received from content script');
          resolve(new Map());
          return;
        }
        
        if (!response.colors) {
          console.error('No colors array in response:', response);
          resolve(new Map());
          return;
        }
        
        try {
          // Ensure response.colors is an array
          if (!Array.isArray(response.colors)) {
            console.error('Expected colors to be an array, got:', response.colors);
            resolve(new Map());
            return;
          }
          
          // Convert array to Map, ensuring each entry is valid
          const colorsMap = new Map();
          response.colors.forEach(([color, count]) => {
            if (typeof color === 'string' && typeof count === 'number') {
              colorsMap.set(color, count);
            } else {
              console.warn('Skipping invalid color entry:', [color, count]);
            }
          });
          
          console.log('Successfully processed colors:', colorsMap);
          resolve(colorsMap);
        } catch (error) {
          console.error('Error processing colors data:', error);
          resolve(new Map());
        }
      });
    });
  } catch (error) {
    console.error('Error in getAllColors:', error);
    return new Map();
  }
}

// Import color mapping functionality
import { getClosestColorName } from './colorMap.js';

// Function to get a human-readable name for a color
function getColorName(hex) {
  return getClosestColorName(hex);
}

// Function to show the "Copied" toast
function showCopiedToast() {
  const toast = document.getElementById('copied-toast');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopiedToast();
  } catch (err) {
    console.error('Failed to copy text:', err);
  }
}

// Function to create color card
function createColorCard(color, count) {
  const card = document.createElement('div');
  card.className = 'color-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  
  const swatch = document.createElement('div');
  swatch.className = 'color-swatch';
  swatch.style.backgroundColor = color;
  
  const info = document.createElement('div');
  info.className = 'color-info';
  
  const name = document.createElement('div');
  name.className = 'color-name';
  name.textContent = getColorName(color);
  
  const hex = document.createElement('div');
  hex.className = 'color-hex';
  hex.textContent = color.toUpperCase();
  
  const countEl = document.createElement('div');
  countEl.className = 'color-count';
  countEl.textContent = `Used ${count} time${count > 1 ? 's' : ''}`;
  
  info.appendChild(name);
  info.appendChild(hex);
  info.appendChild(countEl);
  card.appendChild(swatch);
  card.appendChild(info);
  
  // Add click handler to copy color
  card.addEventListener('click', () => copyToClipboard(color));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyToClipboard(color);
    }
  });
  
  return card;
}

// Function to group colors by format
function groupColorsByFormat(colors) {
  const hexColors = new Map();
  const rgbColors = new Map();
  
  // Ensure colors is a Map
  if (!(colors instanceof Map)) {
    console.error('Expected colors to be a Map, got:', colors);
    return { hexColors, rgbColors };
  }
  
  // Iterate through the Map entries
  for (const [color, count] of colors.entries()) {
    // Skip if color is not a string
    if (typeof color !== 'string') {
      console.warn('Skipping invalid color:', color);
      continue;
    }
    
    // Skip if count is not a number
    if (typeof count !== 'number') {
      console.warn('Skipping invalid count:', count);
      continue;
    }
    
    if (color.startsWith('#')) {
      hexColors.set(color, count);
      try {
        const rgbColor = hexToRgb(color);
        rgbColors.set(rgbColor, count);
      } catch (error) {
        console.warn('Failed to convert hex to RGB:', color, error);
      }
    } else if (color.startsWith('rgb')) {
      rgbColors.set(color, count);
    }
  }
  
  return { hexColors, rgbColors };
}

// Function to convert hex to RGB
function hexToRgb(hex) {
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error('Invalid hex color format');
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgb(${r}, ${g}, ${b})`;
}

// Function to handle tab switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const grid = document.getElementById('colors-grid');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Clear the grid
      grid.innerHTML = '';
      
      // Get the current color group
      const colorGroup = tab.dataset.tab === 'hex' ? currentHexColors : currentRgbColors;
      
      // Sort colors by usage count
      const sortedColors = Array.from(colorGroup.entries())
        .sort((a, b) => b[1] - a[1]);
      
      // Create and append color cards
      sortedColors.forEach(([color, count]) => {
        const card = createColorCard(color, count);
        grid.appendChild(card);
      });
    });
  });
}

// Main function to display colors
async function displayColors() {
  try {
    const colors = await getAllColors();
    const grid = document.getElementById('colors-grid');
    
    if (!grid) {
      console.error('Colors grid element not found');
      return;
    }
    
    // Clear existing content
    grid.innerHTML = '';
    
    if (colors.size === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No colors found on this page</p>
          <p class="empty-state-subtitle">Try navigating to a different webpage and click the extension again</p>
        </div>
      `;
      return;
    }
    
    // Group colors by format
    const { hexColors, rgbColors } = groupColorsByFormat(colors);
    
    if (hexColors.size === 0 && rgbColors.size === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No valid colors found</p>
          <p class="empty-state-subtitle">The page might be using colors in an unsupported format</p>
        </div>
      `;
      return;
    }
    
    currentHexColors = hexColors;
    currentRgbColors = rgbColors;
    
    // Setup tabs
    setupTabs();
    
    // Show hex colors by default
    const sortedHexColors = Array.from(hexColors.entries())
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedHexColors.length === 0) {
      // If no hex colors, show RGB colors by default
      const sortedRgbColors = Array.from(rgbColors.entries())
        .sort((a, b) => b[1] - a[1]);
      
      sortedRgbColors.forEach(([color, count]) => {
        const card = createColorCard(color, count);
        grid.appendChild(card);
      });
      
      // Switch to RGB tab
      const rgbTab = document.querySelector('[data-tab="rgb"]');
      if (rgbTab) {
        document.querySelector('.tab-button.active').classList.remove('active');
        rgbTab.classList.add('active');
      }
    } else {
      sortedHexColors.forEach(([color, count]) => {
        const card = createColorCard(color, count);
        grid.appendChild(card);
      });
    }
  } catch (error) {
    console.error('Error displaying colors:', error);
    const grid = document.getElementById('colors-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Error loading colors</p>
          <p class="empty-state-subtitle">Please try refreshing the page or navigating to a different webpage</p>
        </div>
      `;
    }
  }
}

// Global variables to store color groups
let currentHexColors = new Map();
let currentRgbColors = new Map();

// Run when the page loads
document.addEventListener('DOMContentLoaded', displayColors); 