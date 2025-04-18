// Import color mapping functionality
import { colorMap } from './colorMap.js';

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
          console.error('Error communicating with content e script:', chrome.runtime.lastError);
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

// Function to show the toast notification
function showToast(message) {
  const toast = document.getElementById('copied-toast');
  if (!toast) {
    console.error('Toast element not found');
    return;
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Color ${text} copied!`);
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
  // Reverted: Convert RGB to hex if needed
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
    // Reverted: Copy the hex value instead of the original color
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
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Function to get all gradients from the page
async function getAllGradients() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      return [];
    }
    
    // Send message to content script to get gradients
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'getGradients' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with content script:', chrome.runtime.lastError);
          resolve([]);
          return;
        }
        
        if (!response) {
          console.error('No response received from content script');
          resolve([]);
          return;
        }
        
        if (!response.gradients) {
          console.error('No gradients array in response:', response);
          resolve([]);
          return;
        }
        
        try {
          // Ensure response.gradients is an array
          if (!Array.isArray(response.gradients)) {
            console.error('Expected gradients to be an array, got:', response.gradients);
            resolve([]);
            return;
          }
          
          console.log('Successfully processed gradients:', response.gradients);
          resolve(response.gradients);
        } catch (error) {
          console.error('Error processing gradients data:', error);
          resolve([]);
        }
      });
    });
  } catch (error) {
    console.error('Error in getAllGradients:', error);
    return [];
  }
}

// Function to display gradients
async function displayGradients() {
  const grid = document.getElementById('colors-grid');
  grid.innerHTML = '';
  
  // Show skeleton loading state
  grid.innerHTML = `
    <div class="color-family">
      <div class="skeleton skeleton-family-header"></div>
      <div class="colors-grid">
        ${Array(6).fill(`
          <div class="gradient-card skeleton-color-card">
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
    const gradients = await getAllGradients();
    
    // Clear existing content
    grid.innerHTML = '';
    
    if (gradients.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No gradients found on this page</p>
          <p class="empty-state-subtitle">Try navigating to a different webpage and click the extension again</p>
        </div>
      `;
      return;
    }
    
    // Sort gradients by usage count
    const sortedGradients = gradients.sort((a, b) => b[1].count - a[1].count);
    
    // Create gradient cards
    sortedGradients.forEach(([normalizedKey, gradientData]) => {
      // Ensure gradientData and gradientData.original are valid before creating the card
      if (gradientData && typeof gradientData.original === 'string') {
        const card = createGradientCard(gradientData.original, gradientData.count);
        grid.appendChild(card);
      } else {
        console.warn('Skipping invalid gradient data:', gradientData);
      }
    });
  } catch (error) {
    console.error('Error displaying gradients:', error);
    grid.innerHTML = `
      <div class="empty-state">
        <p>Error loading gradients</p>
        <ppogr class="empty-state-subtitle">Please try refreshing the page or navigating to a different webpage</p>
      </div>
    `;
  }
}

// Function to create gradient card
function createGradientCard(gradient, count) {
  // Add check to ensure gradient is a string
  if (typeof gradient !== 'string') {
    console.error('Invalid gradient type passed to createGradientCard:', typeof gradient, gradient);
    // Return an empty div or some error indicator element
    const errorCard = document.createElement('div');
    errorCard.textContent = 'Error loading gradient';
    errorCard.style.color = 'red';
    errorCard.style.padding = 'var(--spacing-md)';
    return errorCard;
  }

  const card = document.createElement('div');
  card.className = 'gradient-card';
  
  const swatch = document.createElement('div');
  swatch.className = 'gradient-swatch';
  swatch.style.background = gradient;
  
  const info = document.createElement('div');
  info.className = 'gradient-info';
  
  const name = document.createElement('div');
  name.className = 'gradient-name';
  name.textContent = getGradientName(gradient);
  
  const type = document.createElement('div');
  type.className = 'gradient-type';
  type.textContent = getGradientType(gradient);
  
  const colors = document.createElement('div');
  colors.className = 'gradient-colors';
  
  const gradientColors = gradient.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
  gradientColors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'gradient-color';
    colorDiv.style.backgroundColor = color;
    colors.appendChild(colorDiv);
  });
  
  const countDiv = document.createElement('div');
  countDiv.className = 'gradient-count';
  countDiv.textContent = `${count} uses`;
  
  info.appendChild(name);
  info.appendChild(type);
  info.appendChild(colors);
  info.appendChild(countDiv);
  
  card.appendChild(swatch);
  card.appendChild(info);
  
  // Add click handler to copy gradient
  card.addEventListener('click', () => {
    navigator.clipboard.writeText(gradient);
    showToast('Gradient copied to clipboard!');
  });
  
  return card;
}

// Function to get gradient name
function getGradientName(gradient) {
  // Try to extract colors first, even if the gradient is invalid CSS
  let colors = gradient.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
  
  // If no colors found, maybe it's a malformed string? Attempt basic cleanup
  if (colors.length === 0) {
    const potentialColors = gradient.split(/,|\s+/).filter(part => part.startsWith('#') || part.startsWith('rgb'));
    if (potentialColors.length > 0) colors = potentialColors;
  }
  
  if (colors.length === 0) return 'Unknown Gradient'; // Fallback
  
  return colors.map(color => {
    // Convert RGB to hex if needed
    if (color.startsWith('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
    return colorMap[color.toLowerCase()] || color;
  }).join(' → ');
}

// Function to get gradient type
function getGradientType(gradient) {
  if (gradient.includes('linear-gradient')) return 'Linear';
  if (gradient.includes('radial-gradient')) return 'Radial';
  if (gradient.includes('conic-gradient')) return 'Conic';
  return 'Gradient';
}

// Function to generate CSS variables from colors
function generateCSSVariables(colors, format = 'hex') {
  let css = ':root {\n';
  
  // Add color variables
  colors.forEach(([color, count]) => {
    const colorName = getColorName(color).toLowerCase().replace(/\s+/g, '-');
    const shortHex = color.replace('#', '').slice(-3);
    const colorValue = format === 'hex' ? color : hexToRgb(color);
    css += `  --color-${colorName}-${shortHex}: ${colorValue};\n`;
  });
  
  css += '}\n';
  return css;
}

// Function to download text as file
function downloadTextAsFile(text, filename) {
  const blob = new Blob([text], { type: 'text/css' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Function to display export view
function displayExport() {
  const grid = document.getElementById('colors-grid');
  
  // Get all colors (both hex and rgb)
  const allColors = new Map([
    ...Array.from(currentHexColors.entries()),
    ...Array.from(currentRgbColors.entries())
  ]);
  
  // Sort colors by usage count
  const sortedColors = Array.from(allColors.entries())
    .sort((a, b) => b[1] - a[1]);
  
  // Generate CSS variables with HEX format
  let cssVariables = generateCSSVariables(sortedColors, 'hex');
  
  // Create export view HTML
  grid.innerHTML = `
    <div class="export-section">
      <h2 class="export-title">Download CSS</h2>
      <p class="export-description">Download the CSS variables as a file</p>
      <button class="export-button" id="download-css">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M14 6h-4V2c0-1.1-.9-2-2-2H2C.9 0 0 .9 0 2v8c0 1.1.9 2 2 2h4v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 6H2V2h6v10zm6 2H8V8h6v6z" fill="currentColor"/>
        </svg>
        Download CSS File
      </button>
    </div>
    <div class="export-section">
      <h2 class="export-title">CSS Variables</h2>
      <p class="export-description">Copy and paste these CSS variables into your stylesheet</p>
      <div class="code-preview">
        <pre><code>${cssVariables}</code></pre>
      </div>
      <button class="export-button" id="copy-css">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2h8v2h2V2c0-1.1-.9-2-2-2H2C.9 0 0 .9 0 2v8c0 1.1.9 2 2 2h2v-2H2V2z" fill="currentColor"/>
          <path d="M6 6v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2zm2 0h8v8H8V6z" fill="currentColor"/>
        </svg>
        Copy to Clipboard
      </button>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('copy-css').addEventListener('click', () => {
    navigator.clipboard.writeText(cssVariables);
    showToast('CSS variables copied to clipboard!');
  });
  
  document.getElementById('download-css').addEventListener('click', () => {
    downloadTextAsFile(cssVariables, 'colors.css');
    showToast('CSS file downloaded!');
  });
}

// Function to handle tab switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const colorFormat = document.getElementById('color-format');
  const colorTheme = document.getElementById('color-theme');
  const colorFamily = document.getElementById('color-family');
  const grid = document.getElementById('colors-grid');
  const selectors = document.querySelector('.color-selectors');
  
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
        selectors.style.display = 'flex';
        updateColors();
      } else if (tabType === 'gradient') {
        selectors.style.display = 'none';
        displayGradients();
      } else if (tabType === 'export') {
        selectors.style.display = 'none';
        displayExport();
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
  
  // Sort colors within each family by brightness (darkest to lightest)
  sortedFamilies.forEach(colors => {
    colors.sort((a, b) => getColorBrightness(a[0]) - getColorBrightness(b[0]));
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

  // --- Modification for Grayscale --- 
  if (familyName === 'Grayscale') {
    const brightnessThreshold = 0.95; // Threshold for considering a color "near white"
    const nearWhites = [];
    const otherGrays = [];

    colors.forEach(([color, count]) => {
      if (getColorBrightness(color) >= brightnessThreshold) {
        nearWhites.push([color, count]);
      } else {
        otherGrays.push([color, count]);
      }
    });

    // Create a summary card for near whites if any exist
    if (nearWhites.length > 0) {
      const totalNearWhiteCount = nearWhites.reduce((sum, [, count]) => sum + count, 0);
      
      const summaryCard = document.createElement('div');
      summaryCard.className = 'color-card near-white-summary'; // Add specific class
      // summaryCard.setAttribute('aria-label', `Near white colors, used ${totalNearWhiteCount} times in total`);

      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = '#FFFFFF'; // Representative swatch
      swatch.style.border = '1px solid var(--color-border-subtle)'; // Add border for visibility

      const info = document.createElement('div');
      info.className = 'color-info';

      const name = document.createElement('div');
      name.className = 'color-name';
      name.textContent = 'Near Whites'; // Summary name

      const hex = document.createElement('div');
      hex.className = 'color-hex';
      hex.textContent = `${nearWhites.length} variations`; // Indicate multiple variations

      const countEl = document.createElement('div');
      countEl.className = 'color-count';
      countEl.textContent = `Used ${totalNearWhiteCount} time${totalNearWhiteCount > 1 ? 's' : ''} total`;
      
      info.appendChild(name);
      info.appendChild(hex);
      info.appendChild(countEl);
      summaryCard.appendChild(swatch);
      summaryCard.appendChild(info);
      grid.appendChild(summaryCard); // Add summary card first
    }

    // Create individual cards for other grays (already sorted dark to light)
    otherGrays.forEach(([color, count]) => {
      const card = createColorCard(color, count);
      grid.appendChild(card);
    });

  } else {
    // --- Original behavior for other families --- 
    colors.forEach(([color, count]) => {
      const card = createColorCard(color, count);
      grid.appendChild(card);
    });
  }
  // --- End Modification ---
  
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
    
    // If no hex colors were found, set the default format selector to RGB before setting up tabs.
    if (hexColors.size === 0 && rgbColors.size > 0) {
      const formatSelector = document.getElementById('color-format');
      if (formatSelector) {
        formatSelector.value = 'rgb';
      }
    }

    // Setup tabs and initial display based on (potentially modified) selector value
    setupTabs();
    
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