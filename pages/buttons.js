// Keep track of the current tab
let currentTab = null;

// Function to check if a color is light or transparent
function isLightOrTransparent(color) {
  if (!color) return true;
  
  color = color.trim().toLowerCase();
  
  // Check for transparent values
  if (color === 'transparent' || 
      color === 'rgba(0,0,0,0)' || 
      color === 'rgba(0, 0, 0, 0)' ||
      color === '') {
    return true;
  }
  
  // Check for white values
  if (color === 'white' || 
      color === '#fff' || 
      color === '#ffffff') {
    return true;
  }
  
  try {
    // Handle rgba/rgb colors
    if (color.startsWith('rgba')) {
      const values = color.match(/[\d.]+/g);
      if (values && values.length >= 4) {
        // If alpha is less than 0.5, consider it transparent
        if (parseFloat(values[3]) < 0.5) return true;
        return (values[0] * 299 + values[1] * 587 + values[2] * 114) / 1000 > 155;
      }
    }
    
    if (color.startsWith('rgb')) {
      const values = color.match(/\d+/g);
      if (values && values.length >= 3) {
        return (values[0] * 299 + values[1] * 587 + values[2] * 114) / 1000 > 155;
      }
    }
    
    // Handle hex colors
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    if (hex.length !== 6) return true;
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  } catch (e) {
    console.warn('Error checking color:', e);
    return true; // If we can't parse the color, assume it's light/transparent
  }
}

// Function to convert RGB or RGBA to hex
function rgbToHex(color) {
  // If it's null or transparent (common representation), return it
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return 'transparent'; // Standardize transparent representation
  }
  
  // If it's already hex, return as is (uppercase)
  if (color.startsWith('#')) {
    // Ensure 6 or 8 digit hex are uppercase
    if (color.length === 7 || color.length === 9) {
      return color.toUpperCase();
    }
    // Expand 3 or 4 digit hex
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
    }
     if (color.length === 5) { // Handle #RGBA
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}${color[4]}${color[4]}`.toUpperCase();
    }
    // If other hex format, return original for now
    return color.toUpperCase(); 
  }
  
  // Helper to convert decimal to 2-digit hex
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  // Try parsing RGBA first
  const rgbaMatch = color.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = Math.round(parseFloat(rgbaMatch[4]) * 255); // Convert alpha 0-1 to 0-255
    
    // Only include alpha if it's not fully opaque (255)
    if (a < 255) {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`.toUpperCase();
    }
    // If alpha is 1 (255), return standard 6-digit hex
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  // Try parsing RGB
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }
  
  // Return original color if it couldn't be parsed as RGB/RGBA/Hex
  return color; 
}

// Function to create a button card
function createButtonCard(buttonData) {
  const card = document.createElement('div');
  card.className = 'button-card';

  // Get the first instance of the button for reference
  const buttonInstance = buttonData.instances[0];
  
  // Check background and text colors
  const background = buttonData.colors.background;
  const textColor = buttonData.colors.text;
  
  // Convert colors to hex for display
  const displayBackground = rgbToHex(background);
  const displayTextColor = rgbToHex(textColor);

  // Need dark background if:
  // 1. Background is light/transparent AND
  // 2. Text is light colored
  const needsDarkBackground = isLightOrTransparent(background) && isLightOrTransparent(textColor);
  
  const previewClass = needsDarkBackground ? 'button-preview dark-background' : 'button-preview';
  
  card.innerHTML = `
    <div class="${previewClass}">
      <div class="button-preview-container">
        <button class="btn" style="
          width: ${buttonData.dimensions.width}px;
          height: ${buttonData.dimensions.height}px;
          background-color: ${background || 'transparent'};
          color: ${textColor};
          border: ${buttonData.effects.border || 'none'};
          border-radius: ${buttonData.effects.borderRadius};
          font-family: ${buttonData.typography.fontFamily};
          font-size: ${buttonData.typography.fontSize};
          font-weight: ${buttonData.typography.fontWeight};
          padding: ${buttonData.dimensions.padding.top} ${buttonData.dimensions.padding.right} ${buttonData.dimensions.padding.bottom} ${buttonData.dimensions.padding.left};
        ">${buttonInstance.text || 'Button'}</button>
      </div>
    </div>
    <div class="button-info">
      <div class="button-name">${buttonInstance.text || 'Button'}</div>
      <div class="button-details">${buttonInstance.tagName.toLowerCase()}${buttonInstance.classes.length ? ' · ' + buttonInstance.classes.join(' ') : ''}</div>
      <div class="button-meta">${buttonData.count} instance${buttonData.count > 1 ? 's' : ''}</div>
      <div class="button-properties">
        <div class="property-group">
          <div class="property-label">Dimensions</div>
          <div class="property-value">
            ${buttonData.dimensions.width}px × ${buttonData.dimensions.height}px
          </div>
        </div>
        <div class="property-group">
          <div class="property-label">Colors</div>
          <div class="property-value">
            <span class="color-pill" style="background: ${background || 'transparent'}; color: ${isLightOrTransparent(background) ? '#000' : '#FFF'}">bg: ${displayBackground}</span>
            <span class="color-pill" style="background: ${textColor || 'transparent'}; color: ${isLightOrTransparent(textColor) ? '#000' : '#FFF'}">text: ${displayTextColor}</span>
          </div>
        </div>
        <div class="property-group">
          <div class="property-label">Shadow</div>
          <div class="property-value">${buttonData.effects.boxShadow || 'none'}</div>
        </div>
        <div class="property-group">
          <div class="property-label">Border</div>
          <div class="property-value">radius: ${buttonData.effects.borderRadius}</div>
        </div>
        <div class="property-group">
          <div class="property-label">Spacing</div>
          <div class="property-value">padding: ${buttonData.dimensions.padding.top} ${buttonData.dimensions.padding.right}</div>
        </div>
        <div class="property-group">
          <div class="property-label">Typography</div>
          <div class="property-value">${buttonData.typography.fontFamily.split(',')[0]} ${buttonData.typography.fontWeight} / ${buttonData.typography.fontSize}</div>
        </div>
      </div>
    </div>
  `;

  return card;
}

// Function to update buttons display
async function updateButtonsDisplay(size = 'all', variant = 'all', type = 'all') {
  const grid = document.getElementById('buttons-grid');
  
  // Show loading state
  grid.innerHTML = `
    <div class="button-card skeleton">
      <div class="button-preview skeleton"></div>
      <div class="button-info">
        <div class="button-name skeleton"></div>
        <div class="button-details skeleton"></div>
        <div class="button-properties skeleton"></div>
      </div>
    </div>
  `.repeat(3);

  try {
    // Ensure we have the current tab
    if (!currentTab) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
    }

    // Check if we can access the tab
    if (!currentTab || !currentTab.id) {
      throw new Error('No active tab found');
    }

    // Inject the content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          // Check if our script is already injected
          if (!window._buttonAnalyzerInjected) {
            window._buttonAnalyzerInjected = true;
            return true;
          }
          return false;
        }
      });
    } catch (e) {
      console.warn('Script injection check failed:', e);
      // Continue anyway as the script might already be injected
    }

    // Set up a timeout for the message response
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 5000);
    });

    // Send message with timeout
    const messagePromise = chrome.tabs.sendMessage(currentTab.id, { 
      action: 'getButtons',
      filters: { size, variant, type }
    });

    // Race between timeout and message response
    const response = await Promise.race([messagePromise, timeout]);
    
    if (response.error) {
      throw new Error(response.error);
    }

    const buttons = response.buttons;
    
    // Clear existing content
    grid.innerHTML = '';
    
    if (!buttons || buttons.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No buttons found on this page</p>
          <p class="empty-state-subtitle">Try navigating to a different webpage</p>
        </div>
      `;
      return;
    }

    // Filter buttons based on selected options
    const filteredButtons = buttons.filter(button => {
      if (size !== 'all' && button.size !== size) {
        return false;
      }
      if (variant !== 'all' && button.variant !== variant) {
        return false;
      }
      if (type !== 'all' && button.type !== type) {
        return false;
      }
      return true;
    });

    // Create cards for each button
    filteredButtons.forEach(buttonData => {
      const card = createButtonCard(buttonData);
      grid.appendChild(card);
    });

  } catch (error) {
    console.error('Error updating buttons display:', error);
    grid.innerHTML = `
      <div class="empty-state">
        <p>Error analyzing buttons</p>
        <p class="empty-state-subtitle">${error.message}</p>
        <button class="retry-button" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

// Keep the popup open when devtools is opened
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === 'keepAlive') {
    port.onDisconnect.addListener(function() {
      // Cleanup when the devtools are closed
      currentTab = null;
    });
  }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  // Create a connection to keep the popup alive when devtools is open
  if (chrome.runtime.connect) {
    chrome.runtime.connect({ name: 'keepAlive' });
  }

  // Set up filter change handlers
  const sizeSelect = document.getElementById('button-size');
  const variantSelect = document.getElementById('button-variant');
  const typeSelect = document.getElementById('button-type');

  const handleFilterChange = () => {
    updateButtonsDisplay(
      sizeSelect.value,
      variantSelect.value,
      typeSelect.value
    );
  };

  sizeSelect.addEventListener('change', handleFilterChange);
  variantSelect.addEventListener('change', handleFilterChange);
  typeSelect.addEventListener('change', handleFilterChange);

  // Initial load
  await updateButtonsDisplay();
}); 