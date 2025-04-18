// Weight name mapping
const weightName = {
  '100': 'thin',
  '200': 'extra light',
  '300': 'light',
  '400': 'regular',
  '500': 'medium',
  '600': 'semi bold',
  '700': 'bold',
  '800': 'extra bold',
  '900': 'black'
};

// Weight value mapping (for reverse lookup)
const weightValue = {
  'thin': '100',
  'extra light': '200',
  'light': '300',
  'regular': '400',
  'medium': '500',
  'semi bold': '600',
  'bold': '700',
  'extra bold': '800',
  'black': '900'
};

// Base font size for REM calculations
const BASE_FONT_SIZE = 16;

// Function to get the currently selected unit
const getCurrentUnit = () => {
  const unitSelect = document.getElementById('font-unit');
  // Default to 'px' if the element doesn't exist or has no value
  return unitSelect ? unitSelect.value : 'px';
};

// Function to format size based on the current unit
const formatSize = (pxSize) => {
  const unit = getCurrentUnit();
  if (unit === 'rem') {
    const remSize = parseFloat(pxSize) / BASE_FONT_SIZE;
    // Use toFixed(3) for precision, but remove trailing zeros and the decimal point if it becomes whole
    return `${parseFloat(remSize.toFixed(3))}rem`;
  }
  return `${parseFloat(pxSize)}px`; // Ensure it always returns with 'px' unit explicitly
};

// Function to format line height based on the current unit
const formatLineHeight = (lineHeight) => {
  const unit = getCurrentUnit();
  // If lineHeight is just a number (unitless), return it as is
  if (!isNaN(lineHeight) && !lineHeight.toString().includes('px')) {
    return lineHeight;
  }
  
  // Convert px value to rem if needed
  const pxValue = parseFloat(lineHeight);
  if (unit === 'rem') {
    const remValue = pxValue / BASE_FONT_SIZE;
    return `${parseFloat(remValue.toFixed(3))}rem`;
  }
  return `${pxValue}px`;
};

// Function to determine font category based on font characteristics
function getFontCategory(font) {
  const family = font.family.toLowerCase();
  const elements = font.elements || [];
  
  // Check if font is used primarily in headings
  if (elements.some(el => el.startsWith('h') || el === '@font-face')) {
    return 'heading';
  }
  
  // Check font characteristics
  if (family.includes('mono') || family.includes('code')) {
    return 'monospace';
  } else if (family.includes('script') || family.includes('hand')) {
    return 'handwriting';
  } else if (family.includes('serif')) {
    return 'serif';
  } else if (family.includes('sans')) {
    return 'sans-serif';
  }
  
  // Default to body if no specific category is determined
  return 'body';
}

// Function to get font styles based on category
function getFontStylesByCategory(category) {
  const defaultStyles = {
    'display': { fontSize: '32px', lineHeight: '1.1' },
    'heading': { fontSize: '24px', lineHeight: '1.2' },
    'body': { fontSize: '16px', lineHeight: '1.5' },
    'sans-serif': { fontSize: '18px', lineHeight: '1.4' },
    'serif': { fontSize: '20px', lineHeight: '1.3' },
    'monospace': { fontSize: '14px', lineHeight: '1.6' },
    'handwriting': { fontSize: '28px', lineHeight: '1.2' },
    'decorative': { fontSize: '26px', lineHeight: '1.1' },
    'system': { fontSize: '16px', lineHeight: '1.5' }
  };

  return defaultStyles[category] || defaultStyles['body'];
}

// Function to generate font styles
function generateFontStyles(fontData) {
  // Get the current preview text element to get real-time styles
  const previewText = document.querySelector(`.font-preview-text[style*="font-family: '${fontData.family}'"]`);
  const currentStyles = previewText ? window.getComputedStyle(previewText) : null;
  
  // Use current styles if available, otherwise fallback to fontData
  const fontSize = currentStyles ? currentStyles.fontSize : fontData.fontSize;
  const lineHeight = currentStyles ? currentStyles.lineHeight : fontData.lineHeight;
  const fontWeight = currentStyles ? currentStyles.fontWeight : fontData.weights[0];
  
  // Format the values based on selected unit
  const displayFontSize = formatSize(parseFloat(fontSize));
  const displayLineHeight = formatLineHeight(lineHeight);
  
  return `font-family: '${fontData.family}';
font-weight: ${fontWeight};
font-size: ${displayFontSize};
line-height: ${displayLineHeight};`;
}

// Toast notification functionality
const showToast = (message) => {
  const toast = document.getElementById('copied-toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
};

// Clipboard functionality
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Typography styles copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy to clipboard');
  }
};

// Helper function to resolve CSS variable value
function resolveCSSVariable(value, styleSheet) {
  if (!value || !value.startsWith('var(--')) return value;
  
  const variableName = value.match(/var\((.*?)\)/)[1];
  if (!variableName) return value;

  // Try to find the variable value in the stylesheet
  try {
    for (const rule of styleSheet.cssRules) {
      if (rule.selectorText === ':root' || rule.selectorText === 'html') {
        const variableValue = rule.style.getPropertyValue(variableName);
        if (variableValue) return variableValue.trim();
      }
    }
  } catch (e) {
    console.warn('Could not access stylesheet rules:', e);
  }
  
  // Fallback to computed style on document root
  const rootStyle = getComputedStyle(document.documentElement);
  return rootStyle.getPropertyValue(variableName).trim() || value;
}

// Helper function to resolve inherited value
function resolveInheritedValue(property, element, computedStyle) {
  if (!element || !computedStyle) return null;
  
  const value = computedStyle[property];
  if (value && value !== 'inherit') {
    return value;
  }
  
  // Try to get the inherited value from the parent element
  const parentElement = element.parentElement;
  if (parentElement) {
    const parentStyle = getComputedStyle(parentElement);
    return resolveInheritedValue(property, parentElement, parentStyle);
  }
  
  return null;
}

// Function to normalize font size value
function normalizeFontSize(fontSize, element, styleSheet) {
  if (!fontSize) return '16px';
  
  // Handle CSS variables
  if (fontSize.startsWith('var(')) {
    fontSize = resolveCSSVariable(fontSize, styleSheet);
  }
  
  // Handle inherit
  if (fontSize === 'inherit' && element) {
    const computedStyle = getComputedStyle(element);
    fontSize = resolveInheritedValue('fontSize', element, computedStyle) || '16px';
  }
  
  // Handle relative units
  if (fontSize.endsWith('rem')) {
    const rootFontSize = getComputedStyle(document.documentElement).fontSize;
    const remValue = parseFloat(fontSize);
    const pxValue = remValue * parseFloat(rootFontSize);
    return `${pxValue}px`;
  }
  
  if (fontSize.endsWith('em')) {
    const parentFontSize = element ? 
      getComputedStyle(element.parentElement).fontSize : 
      '16px';
    const emValue = parseFloat(fontSize);
    const pxValue = emValue * parseFloat(parentFontSize);
    return `${pxValue}px`;
  }
  
  return fontSize;
}

// Function to inject content script
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    return true;
  } catch (error) {
    console.error('Error injecting content script:', error);
    return false;
  }
}

// Function to get typography from the webpage
async function getWebpageTypography() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    // First try to send message directly
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getTypography' });
      if (response && response.typography) {
        return processTypographyData(response.typography);
      }
    } catch (error) {
      console.log('Initial message failed, attempting to inject content script');
    }

    // If direct message fails, inject content script and try again
    const injected = await injectContentScript(tab.id);
    if (!injected) {
      throw new Error('Failed to inject content script');
    }

    // Wait for script to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try sending message again
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getTypography' });
      if (!response || !response.typography) {
        throw new Error('No typography data received from page');
      }
      return processTypographyData(response.typography);
    } catch (error) {
      console.error('Error communicating with content script:', error);
      throw new Error('Could not get typography data. Please refresh the page and try again.');
    }
  } catch (error) {
    console.error('Error in getWebpageTypography:', error);
    throw error;
  }
}

// Helper function to process typography data
function processTypographyData(rawData) {
  console.log('Raw typography data:', rawData);
  
  return Object.values(rawData)
    .filter(item => item && item.styles && item.styles.fontFamily) // Filter out invalid items
    .map(item => {
      // Safely get font family
      const fontFamily = item.styles.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      if (!fontFamily) return null; // Skip if no valid font family
      
      // Safely get font weight
      const fontWeight = item.styles.fontWeight || '400';
      
      // Safely get font style
      const fontStyle = item.styles.fontStyle || 'normal';
      
      // Safely get font size
      let fontSize = item.styles.fontSize || '16px';
      if (fontSize === 'inherit' || fontSize === 'normal') {
        fontSize = '16px';
      }
      
      // Safely get line height
      let lineHeight = item.styles.lineHeight || '1.5';
      if (lineHeight === 'inherit' || lineHeight === 'normal') {
        lineHeight = '1.5';
      }
      
      return {
        family: fontFamily,
        weight: fontWeight,
        style: fontStyle,
        size: fontSize,
        lineHeight: lineHeight,
        category: getFontCategory({ family: fontFamily, elements: item.elements || [] })
      };
    })
    .filter(Boolean); // Remove any null entries
}

// Function to extract font size value from CSS variable
function extractFontSize(fontSize) {
  if (!fontSize) return '16px';
  
  // If it's a CSS variable with a fallback value
  if (fontSize.startsWith('var(')) {
    const match = fontSize.match(/var\([^,]+,\s*([^)]+)\)/);
    if (match) {
      return match[1].trim();
    }
  }
  
  return fontSize;
}

// Create font card element
const createFontCard = (fontData) => {
  const card = document.createElement('div');
  card.className = 'font-card';
  
  let displayWeightName = weightName[fontData.weights[0]] || 'regular';
  displayWeightName = displayWeightName.charAt(0).toUpperCase() + displayWeightName.slice(1);

  // Get font category and determine appropriate size
  const category = getFontCategory(fontData);

  // Create preview text based on font category
  const getPreviewText = (category) => {
    const previews = {
      'display': 'Ag',
      'heading': 'Ag',
      'body': 'Ag',
      'sans-serif': 'Ag',
      'serif': 'Ag',
      'monospace': 'Ag',
      'handwriting': 'Ag',
      'decorative': 'Ag',
      'system': 'Ag'
    };
    return previews[category] || previews['body'];
  };

  // Get the font size and line height (now we know there's only one of each)
  const fontSizePx = parseFloat(extractFontSize(fontData.fontSizes[0])); // Ensure we have a number
  const lineHeight = fontData.lineHeights[0];
  const fontWeight = fontData.weights[0];

  // Format size and line height based on selected unit
  const displayFontSize = formatSize(fontSizePx);
  const displayLineHeight = formatLineHeight(lineHeight);

  // Create a pattern based on the font category
  const getPatternStyle = (category) => {
    const patterns = {
      'display': `radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)`,
      'heading': `repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 10px)`,
      'body': `linear-gradient(0deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
      'sans-serif': `linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
      'serif': `repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 10px)`,
      'monospace': `repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 8px)`,
      'handwriting': `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03) 1px, transparent 1px)`,
      'decorative': `repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 8px)`,
      'system': `linear-gradient(45deg, rgba(0,0,0,0.03) 1px, transparent 1px)`
    };
    return patterns[category] || patterns['body'];
  };

  card.innerHTML = `
    <div class="font-preview" style="background-image: ${getPatternStyle(category)}; background-size: 20px 20px;">
      <div class="font-preview-container">
        <p class="font-preview-text" style="
          font-family: '${fontData.family}';
          font-size: ${fontSizePx}px; /* Always set style in px */
          line-height: ${lineHeight}; /* Keep original line height */
          font-weight: ${fontWeight};"
        >${getPreviewText(category)}</p>
        <div class="font-preview-controls">
          <button class="preview-control" data-action="increase">+</button>
          <button class="preview-control" data-action="decrease">-</button>
        </div>
      </div>
    </div>
    <div class="font-info">
      <div class="font-name">${fontData.family}</div>
      <div class="font-details">${displayWeightName} ${fontWeight}</div>
      <div class="font-meta">
        <span class="font-size">${displayFontSize}</span>
        <span class="line-height">/${displayLineHeight}</span>
      </div>
    </div>
  `;

  const previewText = card.querySelector('.font-preview-text');
  const fontSizeSpan = card.querySelector('.font-size');
  const controls = card.querySelectorAll('.preview-control');
  
  // Handle preview size controls
  controls.forEach(control => {
    control.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click
      const currentSizePx = parseFloat(window.getComputedStyle(previewText).fontSize);
      const newSizePx = control.dataset.action === 'increase' ? currentSizePx + 2 : currentSizePx - 2;
      if (newSizePx >= 8 && newSizePx <= 48) { // Limit size range
        previewText.style.fontSize = `${newSizePx}px`;
        // Update the display span based on the current unit selection
        fontSizeSpan.textContent = formatSize(newSizePx);
      }
    });
  });
  
  card.addEventListener('click', () => {
    const styles = generateFontStyles(fontData);
    copyToClipboard(styles);
  });
  
  return card;
};

// Function to update typography display
async function updateTypographyDisplay(weight) {
  const grid = document.getElementById('typography-grid');
  const currentUnit = getCurrentUnit();
  
  // Show loading state
  grid.innerHTML = `
    <div class="color-family">
      <div class="skeleton skeleton-family-header"></div>
      <div class="colors-grid">
        ${Array(6).fill(`
          <div class="font-card skeleton-color-card">
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
    const fonts = await getWebpageTypography();
    
    // Clear existing content
    grid.innerHTML = '';
    
    if (!fonts || fonts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No fonts found on this page</p>
          <p class="empty-state-subtitle">Try navigating to a different webpage and click the extension again</p>
        </div>
      `;
      return;
    }

    // Filter fonts based on weight only
    const filteredFonts = fonts.filter(font => {
      if (weight !== 'all') {
        const weightMap = {
          'regular': '400',
          'medium': '500',
          'semibold': '600',
          'bold': '700'
        };
        return font.weight === weightMap[weight];
      }
      return true;
    });

    // Group fonts by family
    const fontsByFamily = filteredFonts.reduce((acc, font) => {
      if (!acc[font.family]) {
        acc[font.family] = [];
      }
      acc[font.family].push(font);
      return acc;
    }, {});

    // Sort families by usage (number of variations)
    const sortedFamilies = Object.entries(fontsByFamily)
      .sort(([, fontsA], [, fontsB]) => fontsB.length - fontsA.length);

    if (sortedFamilies.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No fonts found matching the selected weight</p>
          <p class="empty-state-subtitle">Try selecting a different weight</p>
        </div>
      `;
      return;
    }

    // Create sections for each family
    sortedFamilies.forEach(([family, fonts]) => {
      const section = document.createElement('div');
      section.className = 'color-family';
      
      const header = document.createElement('div');
      header.className = 'family-header';
      header.textContent = family;
      
      const fontsGrid = document.createElement('div');
      fontsGrid.className = 'colors-grid';
      
      // Sort fonts within family by size and weight
      fonts.sort((a, b) => {
        const sizeA = parseFloat(a.size);
        const sizeB = parseFloat(b.size);
        if (sizeA !== sizeB) return sizeA - sizeB;
        
        const weightA = parseInt(a.weight);
        const weightB = parseInt(b.weight);
        return weightA - weightB;
      });

      fonts.forEach(font => {
        const adaptedFont = {
          family: font.family,
          weights: [font.weight],
          fontSizes: [font.size],
          lineHeights: [font.lineHeight],
          category: font.category
        };
        
        const card = createFontCard(adaptedFont);
        fontsGrid.appendChild(card);
      });
      
      section.appendChild(header);
      section.appendChild(fontsGrid);
      grid.appendChild(section);
    });

  } catch (error) {
    console.error('Error updating typography display:', error);
    grid.innerHTML = `
      <div class="empty-state">
        <p>Error loading typography</p>
        <p class="empty-state-subtitle">Please refresh the page or navigate to a different webpage</p>
      </div>
    `;
  }
}

// Function to get current base size
function getCurrentBaseSize() {
  const baseSizeSelect = document.getElementById('scale-base-size');
  return parseFloat(baseSizeSelect.value);
}

// Update generateTypeScale to use the selected base size
function generateTypeScale(ratio = 1.2) {
  const baseSize = getCurrentBaseSize();
  const scale = {
    'xs': baseSize * Math.pow(ratio, -2),    // 2 steps down
    'sm': baseSize * Math.pow(ratio, -1),    // 1 step down
    'base': baseSize,                        // base size
    'lg': baseSize * Math.pow(ratio, 1),     // 1 step up
    'xl': baseSize * Math.pow(ratio, 2),     // 2 steps up
    '2xl': baseSize * Math.pow(ratio, 3),    // 3 steps up
    '3xl': baseSize * Math.pow(ratio, 4),    // 4 steps up
    '4xl': baseSize * Math.pow(ratio, 5),    // 5 steps up
  };

  // Round all values to 2 decimal places
  return Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [key, Math.round(value * 100) / 100])
  );
}

// Function to populate font family selector
async function populateScaleFontFamilies() {
  const fonts = await getWebpageTypography();
  const fontFamilySelect = document.getElementById('scale-font-family');
  
  // Clear existing options
  fontFamilySelect.innerHTML = '';
  
  // Add system fonts first
  fontFamilySelect.innerHTML = `
    <option value="system-ui">System UI</option>
    <option value="sans-serif">Sans Serif</option>
    <option value="serif">Serif</option>
    <option value="monospace">Monospace</option>
  `;
  
  // Add fonts from the page
  const uniqueFamilies = new Set(fonts.map(font => font.family));
  uniqueFamilies.forEach(family => {
    const option = document.createElement('option');
    option.value = family;
    option.textContent = family;
    fontFamilySelect.appendChild(option);
  });
  
  // Select the first font from the page if available, otherwise use system-ui
  if (uniqueFamilies.size > 0) {
    fontFamilySelect.value = Array.from(uniqueFamilies)[0];
  }
}

// Update createScalePreview to handle different units
function createScalePreview(size, name, text = 'Aa') {
  const card = document.createElement('div');
  card.className = 'scale-preview-card';
  
  const preview = document.createElement('div');
  preview.className = 'scale-preview-text';
  
  // Get selected unit
  const unit = getCurrentUnit();
  const displaySize = unit === 'rem' ? `${(size/16).toFixed(3)}rem` : `${size}px`;
  
  preview.style.fontSize = displaySize;
  
  // Get selected font family
  const fontFamily = document.getElementById('scale-font-family').value;
  preview.style.fontFamily = fontFamily;
  
  preview.textContent = text;
  
  const info = document.createElement('div');
  info.className = 'scale-preview-info';
  info.innerHTML = `
    <div class="scale-name">${name}</div>
    <div class="scale-size">${displaySize}</div>
  `;
  
  card.appendChild(preview);
  card.appendChild(info);
  return card;
}

// Update generateScaleCSS to handle different units
function generateScaleCSS(scale) {
  const fontFamily = document.getElementById('scale-font-family').value;
  const unit = getCurrentUnit();
  
  const getSizeWithUnit = (size) => {
    return unit === 'rem' ? `${(size/16).toFixed(3)}rem` : `${size}px`;
  };
  
  return `:root {
    --font-family: ${fontFamily};
    --font-size-xs: ${getSizeWithUnit(scale.xs)};
    --font-size-sm: ${getSizeWithUnit(scale.sm)};
    --font-size-base: ${getSizeWithUnit(scale.base)};
    --font-size-lg: ${getSizeWithUnit(scale.lg)};
    --font-size-xl: ${getSizeWithUnit(scale.xl)};
    --font-size-2xl: ${getSizeWithUnit(scale['2xl'])};
    --font-size-3xl: ${getSizeWithUnit(scale['3xl'])};
    --font-size-4xl: ${getSizeWithUnit(scale['4xl'])};
  }`;
}

// Update generateTailwindConfig to handle different units
function generateTailwindConfig(scale) {
  const fontFamily = document.getElementById('scale-font-family').value;
  const unit = getCurrentUnit();
  
  const getSizeWithUnit = (size) => {
    return unit === 'rem' ? `${(size/16).toFixed(3)}rem` : `${size}px`;
  };
  
  return `module.exports = {
    theme: {
      extend: {
        fontFamily: {
          'scale': ['${fontFamily}'],
        },
        fontSize: {
          'xs': '${getSizeWithUnit(scale.xs)}',
          'sm': '${getSizeWithUnit(scale.sm)}',
          'base': '${getSizeWithUnit(scale.base)}',
          'lg': '${getSizeWithUnit(scale.lg)}',
          'xl': '${getSizeWithUnit(scale.xl)}',
          '2xl': '${getSizeWithUnit(scale['2xl'])}',
          '3xl': '${getSizeWithUnit(scale['3xl'])}',
          '4xl': '${getSizeWithUnit(scale['4xl'])}',
        }
      }
    }
  }`;
}

// Function to display type scale
function displayTypeScale() {
  const grid = document.getElementById('typography-grid');
  const scaleRatio = parseFloat(document.getElementById('scale-ratio').value);
  const format = document.getElementById('scale-format').value;
  
  // Generate the scale
  const scale = generateTypeScale(scaleRatio);
  
  // Clear existing content
  grid.innerHTML = '';
  
  // Create preview section
  const previewSection = document.createElement('div');
  previewSection.className = 'scale-preview-section';
  
  // Add preview cards in reverse order (largest to smallest)
  Object.entries(scale)
    .reverse()
    .forEach(([name, size]) => {
      const card = createScalePreview(size, name);
      previewSection.appendChild(card);
    });
  
  // Create export section
  const exportSection = document.createElement('div');
  exportSection.className = 'scale-export-section';
  
  const exportContent = format === 'css' 
    ? generateScaleCSS(scale)
    : generateTailwindConfig(scale);
  
  exportSection.innerHTML = `
    <div class="export-header">
      <h2>Export ${format.toUpperCase()}</h2>
      <button class="copy-button" onclick="copyToClipboard('${exportContent}')">
        Copy to Clipboard
      </button>
    </div>
    <pre><code>${exportContent}</code></pre>
  `;
  
  // Add sections to grid
  grid.appendChild(previewSection);
  grid.appendChild(exportSection);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize tabs
  const tabs = document.querySelectorAll('.tab-button');
  const typographyGrid = document.getElementById('typography-grid');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const selectedTab = tab.dataset.tab;
      const scaleControls = document.querySelector('.scale-controls');
      const colorSelectors = document.querySelector('.color-selectors');
      
      // Hide all control sections first
      scaleControls.style.display = 'none';
      colorSelectors.style.display = 'none';
      
      if (selectedTab === 'fonts') {
        colorSelectors.style.display = 'flex';
        updateTypographyDisplay(weightSelect.value);
      } else if (selectedTab === 'scale') {
        scaleControls.style.display = 'flex';
        populateScaleFontFamilies().then(() => displayTypeScale());
      } else if (selectedTab === 'export') {
        typographyGrid.style.display = 'none';
      }
    });
  });

  // Initialize filters
  const weightSelect = document.getElementById('font-weight');
  const unitSelect = document.getElementById('font-unit');
  
  const handleFilterChange = () => {
    const weight = weightSelect.value;
    updateTypographyDisplay(weight);
  };
  
  if (weightSelect) weightSelect.addEventListener('change', handleFilterChange);
  if (unitSelect) unitSelect.addEventListener('change', handleFilterChange);
  
  // Add event listeners for scale controls if they exist
  const scaleRatio = document.getElementById('scale-ratio');
  const scaleFormat = document.getElementById('scale-format');
  const scaleFontFamily = document.getElementById('scale-font-family');
  const scaleBaseSize = document.getElementById('scale-base-size');
  const scaleUnit = document.getElementById('scale-unit');
    
  if (scaleRatio) scaleRatio.addEventListener('change', displayTypeScale);
  if (scaleFormat) scaleFormat.addEventListener('change', displayTypeScale);
  if (scaleFontFamily) scaleFontFamily.addEventListener('change', displayTypeScale);
  if (scaleBaseSize) scaleBaseSize.addEventListener('change', displayTypeScale);
  if (scaleUnit) scaleUnit.addEventListener('change', displayTypeScale);
  
  // Initial display - Delay slightly to allow extension context to settle
  setTimeout(handleFilterChange, 100);
}); 