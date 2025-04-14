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

// Function to count components on the page
function countComponents() {
  // Count colors
  const colorMap = new Map();
  function addColor(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return;
    const normalizedColor = normalizeColor(color);
    colorMap.set(normalizedColor, (colorMap.get(normalizedColor) || 0) + 1);
  }

  // Get all elements
  const elements = document.getElementsByTagName('*');
  Array.from(elements).forEach(element => {
    const styles = window.getComputedStyle(element);
    addColor(styles.color);
    addColor(styles.backgroundColor);
    addColor(styles.borderColor);
  });

  // Count typography elements (excluding those within buttons and other interactive elements)
  const typographyElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, blockquote');
  const typographyCount = Array.from(typographyElements).filter(el => {
    // Exclude elements that are part of buttons or other interactive elements
    return !el.closest('button, [role="button"], input, select, textarea, .button, .btn');
  }).length;

  // Count buttons (including various button types and button-like elements)
  const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], .button, .btn');
  const buttonCount = Array.from(buttons).filter(button => {
    // Exclude hidden buttons
    const style = window.getComputedStyle(button);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }).length;

  // Count assets (images, icons, SVGs)
  const assets = document.querySelectorAll('img, svg, [class*="icon"], [class*="logo"]');
  const assetCount = Array.from(assets).filter(asset => {
    // Exclude hidden assets
    const style = window.getComputedStyle(asset);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }).length;

  return {
    colors: colorMap.size,
    typography: typographyCount,
    buttons: buttonCount,
    assets: assetCount
  };
}

// Function to extract gradients from the webpage
function extractGradients() {
  const gradientMap = new Map();
  
  // Function to add gradient to map with count
  function addGradient(gradient) {
    if (!gradient) return;
    const normalizedGradientKey = normalizeGradient(gradient); // Use normalized string as key
    let existingEntry = gradientMap.get(normalizedGradientKey);
    
    if (existingEntry) {
      existingEntry.count++;
    } else {
      // Store the *original* gradient string for rendering, along with count
      gradientMap.set(normalizedGradientKey, { original: gradient, count: 1 });
    }
  }
  
  // Get all elements
  const elements = document.getElementsByTagName('*');
  
  Array.from(elements).forEach(element => {
    const styles = window.getComputedStyle(element);
    const backgroundImage = styles.backgroundImage;
    
    if (backgroundImage && backgroundImage.includes('gradient')) {
      addGradient(backgroundImage);
    }
  });
  
  // Also check all stylesheets
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || sheet.rules).forEach(rule => {
          if (rule.style && rule.style.backgroundImage && rule.style.backgroundImage.includes('gradient')) {
            addGradient(rule.style.backgroundImage);
          }
        });
      } catch (e) {
        // Skip inaccessible stylesheets
      }
    });
  } catch (e) {
    console.warn('Could not access some stylesheets:', e);
  }
  
  // Return the map entries directly. The format is now [normalizedKey, { original, count }]
  return Array.from(gradientMap.entries());
}

// Function to normalize gradient string (used for grouping/key generation)
function normalizeGradient(gradient) {
  // Remove vendor prefixes
  gradient = gradient.replace(/-webkit-|-moz-|-o-|-ms-/g, '');
  
  // Extract colors and positions
  const colors = gradient.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
  const positions = gradient.match(/\d+%|\d+\.\d+%/g) || [];
  
  // Create a normalized string
  return colors.map((color, i) => {
    const position = positions[i] || '';
    return `${color}${position}`;
  }).join(',');
}

// Function to analyze typography on the page
function analyzeTypography() {
  const typographyMap = new Map();
  const processedStyles = new Set();
  
  // Helper function to get computed styles
  function getTypographyStyles(element) {
    const styles = window.getComputedStyle(element);
    return {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight
    };
  }
  
  // Helper function to create a unique key for typography styles
  function createTypographyKey(styles) {
    return `${styles.fontFamily}-${styles.fontSize}-${styles.fontWeight}-${styles.lineHeight}`;
  }
  
  // First, scan all stylesheets
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || sheet.rules).forEach(rule => {
          // Handle regular style rules
          if (rule.style) {
            // Only process rules that target typography-related elements
            if (rule.selectorText) {
              // Extract element type from selector
              const match = rule.selectorText.match(/^(h[1-6]|p|a|span|div|li|blockquote)/);
              if (match) {
                const elementType = match[1];
                const styles = {
                  fontFamily: rule.style.fontFamily || 'inherit',
                  fontSize: rule.style.fontSize || 'inherit',
                  fontWeight: rule.style.fontWeight || 'inherit',
                  lineHeight: rule.style.lineHeight || 'inherit'
                };
                
                // Only add if we have at least one non-inherited style
                if (Object.values(styles).some(value => value !== 'inherit')) {
                  const key = createTypographyKey(styles);
                  if (!processedStyles.has(key)) {
                    processedStyles.add(key);
                    typographyMap.set(key, {
                      element: { type: elementType, tagName: elementType.toUpperCase() },
                      styles,
                      count: 1
                    });
                  }
                }
              }
            }
          }
        });
      } catch (e) {
        // Skip inaccessible stylesheets (e.g., cross-origin)
        console.warn('Could not access stylesheet:', e);
      }
    });
  } catch (e) {
    console.warn('Could not process some stylesheets:', e);
  }
  
  // Then, scan actual elements
  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, blockquote');
  
  elements.forEach(element => {
    // Skip hidden elements
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    
    // Skip elements that are part of buttons or other interactive elements
    if (element.closest('button, [role="button"], input, select, textarea, .button, .btn')) return;
    
    const styles = getTypographyStyles(element);
    const key = createTypographyKey(styles);
    
    if (typographyMap.has(key)) {
      typographyMap.get(key).count++;
    } else {
      typographyMap.set(key, {
        element: {
          type: element.tagName.toLowerCase(),
          tagName: element.tagName
        },
        styles,
        count: 1
      });
    }
  });
  
  return Object.fromEntries(typographyMap);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getColors') {
    const colors = extractColors();
    console.log('Sending colors:', colors);
    sendResponse({ colors });
  } else if (request.action === 'getMetaData') {
    const metaData = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || 
                  document.querySelector('meta[property="og:description"]')?.content ||
                  'No description available'
    };
    console.log('Sending meta data:', metaData);
    sendResponse(metaData);
  } else if (request.action === 'getComponentCounts') {
    const counts = countComponents();
    console.log('Sending component counts:', counts);
    sendResponse(counts);
  } else if (request.action === 'getGradients') {
    const gradients = extractGradients();
    sendResponse({ gradients });
  } else if (request.action === 'getTypography') {
    // Get typography data
    const typography = analyzeTypography();
    sendResponse({ typography });
  }
  return true; // Keep the message channel open for async response
});
