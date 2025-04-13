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
  card.setAttribute('aria-label', `Color ${color}, used ${count} times`);
  
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
  const handleCopy = () => {
    copyToClipboard(color);
    card.classList.add('copied');
    setTimeout(() => card.classList.remove('copied'), 200);
  };
  
  card.addEventListener('click', handleCopy);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
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
  const colorFormat = document.getElementById('color-format');
  const colorTheme = document.getElementById('color-theme');
  const colorFamily = document.getElementById('color-family');
  const grid = document.getElementById('colors-grid');
  
  // Function to update colors based on current selections
  const updateColors = () => {
    // Clear the grid
    grid.innerHTML = '';
    
    // Get current selections
    const format = colorFormat.value;
    const theme = colorTheme.value;
    const family = colorFamily.value;
    
    // Get the current color group based on format
    const colorGroup = format === 'hex' ? currentHexColors : currentRgbColors;
    
    // Sort colors by usage count
    const sortedColors = Array.from(colorGroup.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Filter colors based on theme (only for RGB format)
    const filteredColors = sortedColors.filter(([color, count]) => {
      if (theme === 'all') return true;
      
      // For RGB format, filter by brightness
      const brightness = getColorBrightness(color);
      return theme === 'light' ? brightness > 0.5 : brightness <= 0.5;
    });
    
    // Group colors by family
    const colorFamilies = groupColorsByFamily(filteredColors);
    
    // Update family selector options
    const familyOptions = colorFamily.querySelectorAll('option');
    familyOptions.forEach(option => {
      if (option.value === 'all') return; // Don't disable 'all' option
      
      const hasColors = colorFamilies.has(option.value) && colorFamilies.get(option.value).length > 0;
      option.disabled = !hasColors;
      
      // If current selection is disabled, switch to 'all'
      if (option.value === family && !hasColors) {
        colorFamily.value = 'all';
      }
    });
    
    // Create sections for each family
    colorFamilies.forEach((colors, familyName) => {
      // Skip families that don't match the selected family
      if (family !== 'all' && family !== familyName) return;
      
      const section = createFamilySection(familyName, colors);
      grid.appendChild(section);
    });
  };

  // Function to handle format change
  const handleFormatChange = () => {
    const format = colorFormat.value;
    // Disable/enable theme selector based on format
    colorTheme.disabled = format === 'hex';
    if (format === 'hex') {
      colorTheme.value = 'all';
    }
    updateColors();
  };
  
  // Add event listeners for selectors
  colorFormat.addEventListener('change', handleFormatChange);
  colorTheme.addEventListener('change', updateColors);
  colorFamily.addEventListener('change', updateColors);
  
  // Initialize selector states
  handleFormatChange();
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Handle different tab content
      const tabType = tab.dataset.tab;
      if (tabType === 'colors') {
        updateColors();
      } else if (tabType === 'gradient') {
        // TODO: Implement gradient view
        grid.innerHTML = '<div class="empty-state"><p>Gradient view coming soon!</p></div>';
      } else if (tabType === 'export') {
        // TODO: Implement export view
        grid.innerHTML = '<div class="empty-state"><p>Export view coming soon!</p></div>';
      }
    });
  });
}

// Helper function to get color brightness
function getColorBrightness(color) {
  let r, g, b;
  
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return 0.5;
    r = parseInt(match[1]);
    g = parseInt(match[2]);
    b = parseInt(match[3]);
  } else {
    return 0.5; // Default for unknown formats
  }
  
  // Calculate relative luminance using the sRGB coefficients
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance;
}

// Function to determine color family
function getColorFamily(color) {
  let r, g, b;
  
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return 'Other';
    r = parseInt(match[1]);
    g = parseInt(match[2]);
    b = parseInt(match[3]);
  } else {
    return 'Other';
  }
  
  // Calculate hue
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  if (diff === 0) {
    return 'Grayscale';
  }
  
  const hue = (() => {
    if (max === r) return ((g - b) / diff) * 60;
    if (max === g) return ((b - r) / diff) * 60 + 120;
    return ((r - g) / diff) * 60 + 240;
  })();
  
  // Normalize hue to 0-360 range
  const normalizedHue = (hue + 360) % 360;
  
  // Determine color family based on hue
  if (normalizedHue < 15 || normalizedHue >= 345) return 'Reds';
  if (normalizedHue < 45) return 'Oranges';
  if (normalizedHue < 75) return 'Yellows';
  if (normalizedHue < 165) return 'Greens';
  if (normalizedHue < 195) return 'Teals';
  if (normalizedHue < 255) return 'Blues';
  if (normalizedHue < 285) return 'Purples';
  if (normalizedHue < 345) return 'Pinks';
  
  return 'Other';
}

// Function to group colors by family
function groupColorsByFamily(colors) {
  const families = new Map();
  
  colors.forEach(([color, count]) => {
    const family = getColorFamily(color);
    if (!families.has(family)) {
      families.set(family, []);
    }
    families.get(family).push([color, count]);
  });
  
  // Sort families by name
  const sortedFamilies = new Map([...families.entries()].sort());
  
  // Sort colors within each family by usage count
  sortedFamilies.forEach(colors => {
    colors.sort((a, b) => b[1] - a[1]);
  });
  
  return sortedFamilies;
}

// Function to create family section
function createFamilySection(familyName, colors) {
  const section = document.createElement('div');
  section.className = 'color-family';
  
  const header = document.createElement('div');
  header.className = 'family-header';
  header.textContent = familyName;
  
  const grid = document.createElement('div');
  grid.className = 'colors-grid';
  
  colors.forEach(([color, count]) => {
    const card = createColorCard(color, count);
    grid.appendChild(card);
  });
  
  section.appendChild(header);
  section.appendChild(grid);
  return section;
}

// Main function to display colors
async function displayColors() {
  const grid = document.getElementById('colors-grid');
  
  if (!grid) {
    console.error('Colors grid element not found');
    return;
  }
  
  // Show skeleton loading state
  grid.innerHTML = `
    <div class="color-family">
      <div class="skeleton skeleton-family-header"></div>
      <div class="colors-grid">
        ${Array(6).fill(`
          <div class="color-card skeleton-color-card">
            <div class="skeleton skeleton-color-swatch"></div>
            <div class="skeleton-color-info">
              <div class="skeleton skeleton-color-name"></div>
              <div class="skeleton skeleton-color-hex"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  try {
    const colors = await getAllColors();
    
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
      // Group colors by family
      const colorFamilies = groupColorsByFamily(sortedHexColors);
      
      // Create sections for each family
      colorFamilies.forEach((colors, family) => {
        const section = createFamilySection(family, colors);
        grid.appendChild(section);
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