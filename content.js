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

// Function to resolve CSS variable to its actual value
function resolveCSSVariable(value) {
  if (!value || !value.startsWith('var(--')) return value;
  
  // Create a temporary element to compute the style
  const temp = document.createElement('div');
  temp.style.cssText = `font-size: ${value}; line-height: ${value};`;
  document.body.appendChild(temp);
  
  // Get the computed value
  const computedStyle = window.getComputedStyle(temp);
  const resolvedValue = computedStyle.fontSize !== value ? computedStyle.fontSize : computedStyle.lineHeight;
  
  // Clean up
  document.body.removeChild(temp);
  
  return resolvedValue;
}

// Function to analyze typography on the page
function analyzeTypography() {
  const typographyMap = new Map();
  const processedStyles = new Set();
  
  // Helper function to normalize font family
  function normalizeFontFamily(fontFamily) {
    if (!fontFamily) return '';
    return fontFamily.split(',').map(font => 
      font.trim().replace(/['"]/g, '').toLowerCase()
    )[0];
  }
  
  // Helper function to create a unique key for typography styles
  function createTypographyKey(styles) {
    return `${styles.fontFamily}-${styles.fontSize}-${styles.fontWeight}-${styles.fontStyle}`;
  }

  // Helper function to check if a font is a system font
  function isSystemFont(fontFamily) {
    const systemFonts = [
      'system-ui', '-apple-system', 'segoe ui', 'roboto', 'helvetica neue',
      'arial', 'helvetica', 'sans-serif', 'serif', 'monospace', 'cursive',
      'fantasy', 'times new roman', 'times', 'courier', 'courier new',
      'georgia', 'palatino', 'garamond', 'bookman', 'trebuchet ms', 'impact',
      'tahoma', 'verdana'
    ];
    return systemFonts.includes(fontFamily.toLowerCase());
  }

  // Helper function to resolve style value
  function resolveStyleValue(value, property) {
    if (!value) return property === 'fontSize' ? '16px' : 
                 property === 'lineHeight' ? '1.5' : 
                 property === 'fontWeight' ? '400' : 'normal';
    
    // Handle CSS variables
    if (value.startsWith('var(--')) {
      return resolveCSSVariable(value);
    }
    
    // Handle relative units for font-size
    if (property === 'fontSize' && value.includes('rem')) {
      const rootFontSize = window.getComputedStyle(document.documentElement).fontSize;
      const remValue = parseFloat(value);
      return `${remValue * parseFloat(rootFontSize)}px`;
    }
    
    if (property === 'fontSize' && value.includes('em')) {
      // Default to 16px if we can't determine parent font size
      const baseFontSize = 16;
      const emValue = parseFloat(value);
      return `${emValue * baseFontSize}px`;
    }
    
    return value;
  }

  // Helper function to process style rule
  function processStyleRule(rule) {
    const fontFamily = normalizeFontFamily(rule.style.fontFamily);
    if (!fontFamily || isSystemFont(fontFamily)) return;

    // Resolve all style values
    const fontSize = resolveStyleValue(rule.style.fontSize, 'fontSize');
    const lineHeight = resolveStyleValue(rule.style.lineHeight, 'lineHeight');
    const fontWeight = resolveStyleValue(rule.style.fontWeight, 'fontWeight');
    const fontStyle = resolveStyleValue(rule.style.fontStyle, 'fontStyle');

    const key = createTypographyKey({
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle
    });

    if (typographyMap.has(key)) {
      typographyMap.get(key).count++;
    } else {
      typographyMap.set(key, {
        element: { 
          type: 'css-rule',
          tagName: 'CSS',
          selector: rule.selectorText || ''
        },
        styles: {
          fontFamily,
          fontSize,
          fontWeight,
          fontStyle,
          lineHeight
        },
        count: 1
      });
    }
  }

  // Process stylesheets
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        // Skip extension's own stylesheets
        if (sheet.href && (
          sheet.href.includes('chrome-extension://') || 
          sheet.href.includes('moz-extension://')
        )) {
          return;
        }

        Array.from(sheet.cssRules || sheet.rules).forEach(rule => {
          if (rule instanceof CSSStyleRule && rule.style.fontFamily) {
            processStyleRule(rule);
          }
        });
      } catch (e) {
        console.warn('Could not access stylesheet:', e.message);
      }
    });

    // Also scan actual elements on the page to catch computed/dynamic styles
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const fontFamily = normalizeFontFamily(computedStyle.fontFamily);
      
      if (!fontFamily || isSystemFont(fontFamily)) return;

      const fontSize = computedStyle.fontSize;
      const lineHeight = computedStyle.lineHeight;
      const fontWeight = computedStyle.fontWeight;
      const fontStyle = computedStyle.fontStyle;

      const key = createTypographyKey({
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle
      });

      if (typographyMap.has(key)) {
        typographyMap.get(key).count++;
      } else {
        typographyMap.set(key, {
          element: {
            type: element.tagName.toLowerCase(),
            tagName: element.tagName,
            selector: ''
          },
          styles: {
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            lineHeight
          },
          count: 1
        });
      }
    });
  } catch (e) {
    console.error('Error processing typography:', e);
  }
  
  return Object.fromEntries(typographyMap);
}

// Function to analyze buttons on the webpage
function analyzeButtons() {
  const buttonMap = new Map();
  
  // Helper function to get computed dimensions
  function getDimensions(element) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      padding: {
        top: computed.paddingTop,
        right: computed.paddingRight,
        bottom: computed.paddingBottom,
        left: computed.paddingLeft
      }
    };
  }

  // Helper function to get colors
  function getColors(element) {
    const computed = window.getComputedStyle(element);
    return {
      background: computed.backgroundColor,
      text: computed.color,
      border: computed.borderColor,
      hoverBg: getHoverColor(element, 'backgroundColor'),
      hoverText: getHoverColor(element, 'color')
    };
  }

  // Helper function to get hover state colors
  function getHoverColor(element, property) {
    const clone = element.cloneNode(true);
    clone.style.display = 'none';
    document.body.appendChild(clone);
    clone.classList.add('hover');
    const hoverStyle = window.getComputedStyle(clone, ':hover');
    const color = hoverStyle[property];
    document.body.removeChild(clone);
    return color;
  }

  // Helper function to analyze typography
  function getTypography(element) {
    const computed = window.getComputedStyle(element);
    return {
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      textTransform: computed.textTransform
    };
  }

  // Helper function to get shadows and effects
  function getEffects(element) {
    const computed = window.getComputedStyle(element);
    return {
      boxShadow: computed.boxShadow,
      borderRadius: computed.borderRadius,
      border: `${computed.borderWidth} ${computed.borderStyle} ${computed.borderColor}`,
      transition: computed.transition
    };
  }

  // Function to create a unique key for the button
  function createButtonKey(buttonData) {
    return JSON.stringify({
      dimensions: buttonData.dimensions,
      colors: buttonData.colors,
      typography: buttonData.typography,
      effects: buttonData.effects
    });
  }

  // Find all button-like elements
  const buttonElements = [
    ...document.getElementsByTagName('button'),
    ...document.getElementsByTagName('input'),
    ...document.querySelectorAll('[role="button"]'),
    ...document.querySelectorAll('.btn, .button, [class*="btn-"], [class*="button-"]')
  ].filter(element => {
    if (element.tagName === 'INPUT') {
      return ['button', 'submit', 'reset'].includes(element.type);
    }
    return true;
  });

  // Analyze each button
  buttonElements.forEach(element => {
    const buttonData = {
      element: {
        tagName: element.tagName,
        type: element.type || 'button',
        classes: Array.from(element.classList),
        text: element.innerText || element.value || ''
      },
      dimensions: getDimensions(element),
      colors: getColors(element),
      typography: getTypography(element),
      effects: getEffects(element)
    };

    const key = createButtonKey(buttonData);
    
    if (buttonMap.has(key)) {
      buttonMap.get(key).count++;
      buttonMap.get(key).instances.push(buttonData.element);
    } else {
      buttonMap.set(key, {
        ...buttonData,
        count: 1,
        instances: [buttonData.element]
      });
    }
  });

  return Array.from(buttonMap.entries()).map(([key, data]) => ({
    key,
    ...data
  }));
}

// Function to get dimensions of an image
async function getImageDimensions(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Function to get absolute URL
function getAbsoluteURL(url) {
  if (!url) return null;
  try {
    return new URL(url, window.location.href).href;
  } catch (e) {
    return null;
  }
}

// Function to get file size
async function getFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = response.headers.get('content-length');
    return size ? parseInt(size) : 0;
  } catch (error) {
    console.warn(`Could not get size for ${url}:`, error);
    return 0;
  }
}

// Function to check if an element is likely an icon
function isLikelyIcon(element, url = '', dimensions = {}) {
  const { width, height } = dimensions;
  
  // Check dimensions (icons are typically small and square)
  const isSmallAndSquare = width && height && 
    width <= 64 && height <= 64 && 
    Math.abs(width - height) <= 4;

  // Check URL patterns
  const urlLower = url.toLowerCase();
  const isIconPath = urlLower.includes('/icons/') || 
                    urlLower.includes('/icon/') ||
                    urlLower.includes('icon.') ||
                    urlLower.includes('-icon.') ||
                    urlLower.includes('_icon.');

  // Check element context
  const isInIconContext = element.closest('[class*="icon"]') !== null ||
                        element.closest('[id*="icon"]') !== null ||
                        element.getAttribute('class')?.toLowerCase().includes('icon') ||
                        element.getAttribute('id')?.toLowerCase().includes('icon');

  return isSmallAndSquare || isIconPath || isInIconContext;
}

// Function to scan for assets
async function scanAssets() {
  const assets = new Map();

  // Scan for images
  const imageElements = document.querySelectorAll('img');
  for (const img of imageElements) {
    const src = getAbsoluteURL(img.src);
    if (src && !assets.has(src)) {
      const dimensions = await getImageDimensions(src);
      const size = await getFileSize(src);
      const isIcon = isLikelyIcon(img, src, dimensions);
      
      assets.set(src, {
        name: src.split('/').pop(),
        type: isIcon ? 'icon' : 'image',
        url: src,
        size,
        dimensions,
        isIcon
      });
    }
  }

  // Scan for background images
  const elements = document.querySelectorAll('*');
  for (const el of elements) {
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const matches = bgImage.match(/url\(['"]?([^'"\)]+)['"]?\)/g) || [];
      for (const match of matches) {
        const url = match.replace(/url\(['"]?([^'"\)]+)['"]?\)/, '$1');
        const absoluteUrl = getAbsoluteURL(url);
        if (absoluteUrl && !assets.has(absoluteUrl)) {
          const dimensions = await getImageDimensions(absoluteUrl);
          const size = await getFileSize(absoluteUrl);
          const isIcon = isLikelyIcon(el, absoluteUrl, dimensions);
          
          assets.set(absoluteUrl, {
            name: absoluteUrl.split('/').pop(),
            type: isIcon ? 'icon' : 'background',
            url: absoluteUrl,
            size,
            dimensions,
            isIcon
          });
        }
      }
    }
  }

  // Scan for SVGs
  const svgElements = document.querySelectorAll('svg');
  svgElements.forEach(svg => {
    const svgContent = svg.outerHTML;
    const key = svgContent;
    if (!assets.has(key)) {
      const dimensions = {
        width: svg.clientWidth,
        height: svg.clientHeight
      };
      const blob = new Blob([svgContent], {type: 'image/svg+xml'});
      const isIcon = isLikelyIcon(svg, '', dimensions);
      
      assets.set(key, {
        name: 'icon.svg',
        type: isIcon ? 'icon' : 'svg',
        content: svgContent,
        size: blob.size,
        dimensions,
        isIcon
      });
    }
  });

  // Scan for video sources
  const videoSources = document.querySelectorAll('video source');
  for (const source of videoSources) {
    const src = getAbsoluteURL(source.src);
    if (src && !assets.has(src)) {
      const size = await getFileSize(src);
      assets.set(src, {
        name: src.split('/').pop(),
        type: 'video',
        url: src,
        size
      });
    }
  }

  return Array.from(assets.values());
}

// Function to get typography from the webpage
function getTypography() {
  const typographyMap = new Map();
  
  // Helper function to process an element's typography
  function processElement(element) {
    const styles = window.getComputedStyle(element);
    const fontFamily = styles.fontFamily;
    
    // Skip if no font family or if it's a system font
    if (!fontFamily || fontFamily === 'inherit') return;
    
    const key = `${fontFamily}-${styles.fontWeight}-${styles.fontSize}-${styles.lineHeight}`;
    
    if (!typographyMap.has(key)) {
      typographyMap.set(key, {
        styles: {
          fontFamily: fontFamily,
          fontWeight: styles.fontWeight,
          fontStyle: styles.fontStyle,
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
          letterSpacing: styles.letterSpacing,
          textTransform: styles.textTransform
        },
        elements: [],
        count: 0
      });
    }
    
    const entry = typographyMap.get(key);
    entry.elements.push(element.tagName.toLowerCase());
    entry.count++;
  }
  
  // Process all text-containing elements
  const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, blockquote, label, button, input[type="text"], textarea');
  textElements.forEach(processElement);
  
  // Also check stylesheets for typography rules
  try {
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || sheet.rules).forEach(rule => {
          if (rule.style && rule.style.fontFamily) {
            const fontFamily = rule.style.fontFamily;
            const key = `${fontFamily}-${rule.style.fontWeight || '400'}-${rule.style.fontSize || '16px'}-${rule.style.lineHeight || 'normal'}`;
            
            if (!typographyMap.has(key)) {
              typographyMap.set(key, {
                styles: {
                  fontFamily: fontFamily,
                  fontWeight: rule.style.fontWeight || '400',
                  fontStyle: rule.style.fontStyle || 'normal',
                  fontSize: rule.style.fontSize || '16px',
                  lineHeight: rule.style.lineHeight || 'normal',
                  letterSpacing: rule.style.letterSpacing || 'normal',
                  textTransform: rule.style.textTransform || 'none'
                },
                elements: [],
                count: 0
              });
            }
          }
        });
      } catch (e) {
        // Skip inaccessible stylesheets
      }
    });
  } catch (e) {
    console.warn('Could not access some stylesheets:', e);
  }
  
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
    const metaData = getMetaData();
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
    try {
      const typography = getTypography();
      console.log('Sending typography data:', typography);
      sendResponse({ typography });
    } catch (error) {
      console.error('Error getting typography:', error);
      sendResponse({ error: error.message });
    }
  } else if (request.action === 'getButtons') {
    try {
      const buttons = analyzeButtons();
      sendResponse({ buttons });
    } catch (error) {
      console.error('Error analyzing buttons:', error);
      sendResponse({ error: error.message });
    }
  } else if (request.action === 'scanAssets') {
    scanAssets()
      .then(assets => {
        console.log('Sending assets:', assets);
        sendResponse({ assets });
      })
      .catch(error => {
        console.error('Error scanning assets:', error);
        sendResponse({ assets: [] });
      });
    return true; // Keep the message channel open for async response
  }
  
  // For non-async responses
  if (request.action === 'getMetaData' || request.action === 'getTypography') {
    return true;
  }
});
