// content.js
// Author:
// Author URI: https://
// Author Github URI: https://www.github.com/
// Project Repository URI: https://github.com/
// Description: Handles all the webpage level activities (e.g. manipulating page data, etc.)
// License: MIT

console.log('Component.lol content script is active!');

// Function to get meta data from the page
function getMetaData() {
  console.log('Getting meta data from page...');
  const title = document.title;
  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
  
  console.log('Found title:', title);
  console.log('Found description:', metaDescription);
  
  return {
    title,
    description: metaDescription
  };
}

// Function to convert any color format to hex
function normalizeColor(color) {
  // Handle transparent colors
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return null;
  }

  // Create a temporary div to get computed color
  const div = document.createElement('div');
  div.style.color = color;
  document.body.appendChild(div);
  
  // Get computed color
  const computedColor = window.getComputedStyle(div).color;
  document.body.removeChild(div);

  // Parse RGB and RGBA values
  const rgbMatch = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const rgbaMatch = computedColor.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);

  if (rgbMatch || rgbaMatch) {
    const values = rgbMatch || rgbaMatch;
    const r = parseInt(values[1]);
    const g = parseInt(values[2]);
    const b = parseInt(values[3]);
    
    // Convert to hex
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    // If it's RGBA, include alpha channel
    if (rgbaMatch) {
      const alpha = Math.round(parseFloat(values[4]) * 255);
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha)}`.toUpperCase();
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  // If it's already hex, ensure it's uppercase
  if (color.startsWith('#')) {
    // If it's a 4 or 8 digit hex, ensure proper format
    if (color.length === 4 || color.length === 9) {
      return color.toUpperCase();
    }
    // If it's a 3 or 6 digit hex, ensure proper format
    return color.length === 7 ? color.toUpperCase() : `#${color.slice(1).replace(/(.)/g, '$1$1')}`.toUpperCase();
  }

  // Fallback to canvas method for other formats
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  return ctx.fillStyle.toUpperCase();
}

// Function to extract all colors from the webpage
function extractColors() {
  const colorMap = new Map();
  
  // Function to add color to map with count
  function addColor(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return;
    const normalizedColor = normalizeColor(color);
    colorMap.set(normalizedColor, (colorMap.get(normalizedColor) || 0) + 1);
  }
  
  // Get all elements
  const elements = document.getElementsByTagName('*');
  
  Array.from(elements).forEach(element => {
    const styles = window.getComputedStyle(element);
    
    // Check common color properties
    addColor(styles.color);
    addColor(styles.backgroundColor);
    addColor(styles.borderColor);
    addColor(styles.borderTopColor);
    addColor(styles.borderBottomColor);
    addColor(styles.borderLeftColor);
    addColor(styles.borderRightColor);
    addColor(styles.outlineColor);
    addColor(styles.textDecorationColor);
    addColor(styles.boxShadow?.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi)?.[0]);
    
    // Check for gradients
    const backgroundImage = styles.backgroundImage;
    if (backgroundImage) {
      const colors = backgroundImage.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi);
      if (colors) colors.forEach(addColor);
    }
  });
  
  // Also check all stylesheets
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || sheet.rules).forEach(rule => {
          if (rule.style) {
            addColor(rule.style.color);
            addColor(rule.style.backgroundColor);
            addColor(rule.style.borderColor);
          }
        });
      } catch (e) {
        // Skip inaccessible stylesheets (e.g., cross-origin)
      }
    });
  } catch (e) {
    console.warn('Could not access some stylesheets:', e);
  }
  
  return Array.from(colorMap.entries());
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getColors') {
    sendResponse({ colors: extractColors() });
  } else if (request.action === 'getMetaData') {
    sendResponse({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || 
                  document.querySelector('meta[property="og:description"]')?.content ||
                  'No description available'
    });
  }
  return true;
});
