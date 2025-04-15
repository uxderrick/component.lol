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

// Function to generate font styles based on format
function generateFontStyles(fontData) {
  const format = document.getElementById('font-format').value;
  
  // Get the current preview text element to get real-time styles
  const previewText = document.querySelector(`.font-preview-text[style*="font-family: '${fontData.family}'"]`);
  const currentStyles = previewText ? window.getComputedStyle(previewText) : null;
  
  // Use current styles if available, otherwise fallback to fontData
  const fontSize = currentStyles ? currentStyles.fontSize : fontData.fontSize;
  const lineHeight = currentStyles ? currentStyles.lineHeight : fontData.lineHeight;
  const fontWeight = currentStyles ? currentStyles.fontWeight : fontData.weights[0];
  
  if (format === 'tailwind') {
    return `font-family: ${fontData.family};
font-weight: ${fontWeight};
font-size: ${fontSize};
line-height: ${lineHeight};`;
  }
  
  return `font-family: '${fontData.family}';
font-weight: ${fontWeight};
font-size: ${fontSize};
line-height: ${lineHeight};`;
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

// Function to get typography from the webpage
async function getWebpageTypography() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      return [];
    }
    
    // Send message to content script to get typography
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getTypography' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with content script:', chrome.runtime.lastError);
          resolve([]);
          return;
        }
        
        if (!response || !response.typography) {
          console.error('No typography data in response:', response);
          resolve([]);
          return;
        }
        
        try {
          console.log('Raw typography data:', response.typography);
          
          const typographyData = Object.values(response.typography)
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
                weights: [fontWeight],
                styles: [fontStyle],
                fontSize: fontSize,
                lineHeight: lineHeight,
                element: {
                  type: item.element?.type || 'unknown',
                  tagName: item.element?.tagName || 'UNKNOWN'
                }
              };
            })
            .filter(Boolean); // Remove null entries
          
          // Group by font family and merge properties
          const fontMap = new Map();
          typographyData.forEach(data => {
            if (!fontMap.has(data.family)) {
              fontMap.set(data.family, {
                family: data.family,
                weights: new Set(),
                styles: new Set(),
                elements: new Set(),
                fontSizes: new Set(),
                lineHeights: new Set()
              });
            }
            
            const font = fontMap.get(data.family);
            if (data.weights[0]) font.weights.add(data.weights[0]);
            if (data.styles[0]) font.styles.add(data.styles[0]);
            if (data.element?.type) font.elements.add(data.element.type);
            if (data.fontSize) font.fontSizes.add(data.fontSize);
            if (data.lineHeight) font.lineHeights.add(data.lineHeight);
          });
          
          // Convert to array and format
          const results = Array.from(fontMap.values())
            .filter(font => font.family && font.weights.size > 0) // Ensure we have valid fonts
            .map(font => ({
              family: font.family,
              weights: Array.from(font.weights).sort((a, b) => Number(a) - Number(b)),
              styles: Array.from(font.styles),
              elements: Array.from(font.elements),
              fontSizes: Array.from(font.fontSizes),
              lineHeights: Array.from(font.lineHeights)
            }));
          
          console.log('Processed typography results:', results);
          resolve(results);
        } catch (error) {
          console.error('Error processing typography data:', error);
          resolve([]);
        }
      });
    });
  } catch (error) {
    console.error('Error in getWebpageTypography:', error);
    return [];
  }
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
  const fontSize = extractFontSize(fontData.fontSizes[0]);
  const lineHeight = fontData.lineHeights[0];
  const fontWeight = fontData.weights[0];

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
          font-size: ${fontSize};
          line-height: ${lineHeight};
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
        <span class="font-size">${fontSize}</span>
        <span class="line-height">/${lineHeight}</span>
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
      const currentSize = parseFloat(window.getComputedStyle(previewText).fontSize);
      const newSize = control.dataset.action === 'increase' ? currentSize + 2 : currentSize - 2;
      if (newSize >= 8 && newSize <= 48) { // Limit size range
        previewText.style.fontSize = `${newSize}px`;
        fontSizeSpan.textContent = `${newSize}px`;
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
async function updateTypographyDisplay(format, weight, category) {
  const grid = document.getElementById('typography-grid');
  
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
    
    if (fonts.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No fonts found on this page</p>
          <p class="empty-state-subtitle">Try navigating to a different webpage and click the extension again</p>
        </div>
      `;
      return;
    }
    
    // Process raw typography data to create individual font entries
    const processedFonts = fonts.flatMap(font => {
      // Get unique combinations of font properties as they appear on the page
      const uniqueCombinations = new Set();
      const fontEntries = [];
      
      // Create entries only for font sizes that exist
      font.fontSizes.forEach((fontSize, i) => {
        if (fontSize === 'N/A') return;
        
        // Use corresponding line height or default
        const lineHeight = font.lineHeights[i] || '1.5';
        
        // Use corresponding weight or the first weight
        const weight = font.weights[0] || '400';
        
        // Create a unique key for this combination
        const key = `${fontSize}-${lineHeight}-${weight}`;
        
        // Only add if we haven't seen this combination before
        if (!uniqueCombinations.has(key)) {
          uniqueCombinations.add(key);
          fontEntries.push({
            family: font.family,
            weights: [weight],
            styles: font.styles,
            elements: font.elements,
            fontSizes: [fontSize],
            lineHeights: [lineHeight]
          });
        }
      });
      
      return fontEntries;
    });
    
    // Group fonts by family and calculate total usage
    const fontsByFamily = new Map();
    const familyUsageCounts = new Map();
    
    processedFonts.forEach(font => {
      const family = font.family;
      if (!fontsByFamily.has(family)) {
        fontsByFamily.set(family, []);
        familyUsageCounts.set(family, 0);
      }
      fontsByFamily.get(family).push(font);
      // Increment the usage count for this family
      familyUsageCounts.set(family, familyUsageCounts.get(family) + 1);
    });
    
    // Convert to array and sort families by usage count
    const sortedFamilies = Array.from(fontsByFamily.entries())
      .sort(([familyA], [familyB]) => {
        const countA = familyUsageCounts.get(familyA) || 0;
        const countB = familyUsageCounts.get(familyB) || 0;
        return countB - countA; // Sort in descending order
      });
    
    // Create sections for each family in sorted order
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
        // Sort by font size numerically
        const sizeA = parseFloat(a.fontSizes[0]);
        const sizeB = parseFloat(b.fontSizes[0]);
        if (sizeA !== sizeB) return sizeA - sizeB;
        
        // If sizes are equal, sort by weight
        const weightA = parseInt(a.weights[0]);
        const weightB = parseInt(b.weights[0]);
        return weightA - weightB;
      });
      
      fonts.forEach(font => {
        const card = createFontCard(font);
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
        <p class="empty-state-subtitle">Please try refreshing the page or navigating to a different webpage</p>
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
  const unit = document.getElementById('scale-unit').value;
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
  const unit = document.getElementById('scale-unit').value;
  
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
  const unit = document.getElementById('scale-unit').value;
  
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
        updateTypographyDisplay(formatSelect.value, weightSelect.value, categorySelect.value);
      } else if (selectedTab === 'scale') {
        scaleControls.style.display = 'flex';
        populateScaleFontFamilies().then(() => displayTypeScale());
      } else if (selectedTab === 'export') {
        typographyGrid.style.display = 'none';
      }
    });
  });

  // Initialize filters
  const formatSelect = document.getElementById('font-format');
  const weightSelect = document.getElementById('font-weight');
  const categorySelect = document.getElementById('font-category');
  
  const handleFilterChange = () => {
    const format = formatSelect.value;
    const weight = weightSelect.value;
    const category = categorySelect.value;
    updateTypographyDisplay(format, weight, category);
  };
  
  formatSelect.addEventListener('change', handleFilterChange);
  weightSelect.addEventListener('change', handleFilterChange);
  categorySelect.addEventListener('change', handleFilterChange);
  
  // Add event listeners for scale controls
  const scaleRatio = document.getElementById('scale-ratio');
  const scaleFormat = document.getElementById('scale-format');
  const scaleFontFamily = document.getElementById('scale-font-family');
  const scaleBaseSize = document.getElementById('scale-base-size');
  const scaleUnit = document.getElementById('scale-unit');
    
  scaleRatio.addEventListener('change', displayTypeScale);
  scaleFormat.addEventListener('change', displayTypeScale);
  scaleFontFamily.addEventListener('change', displayTypeScale);
  scaleBaseSize.addEventListener('change', displayTypeScale);
  scaleUnit.addEventListener('change', displayTypeScale);
  
  // Initial display
  updateTypographyDisplay('css', 'all', 'all');
}); 