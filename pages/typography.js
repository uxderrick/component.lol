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

// Enhanced Font Scanning System
const enhancedScanFonts = () => {
  console.time('enhancedFontScan');
  const fontMap = new Map();
  const processedElements = new Set();

  // Helper to process font data
  const processFontData = (family, weight, style, source) => {
    if (!family || family.toLowerCase() === 'inherit') return;
    
    const normalizedFamily = family.replace(/['"]/g, '').trim();
    if (!fontMap.has(normalizedFamily)) {
      fontMap.set(normalizedFamily, {
        family: normalizedFamily,
        weights: new Set(),
        styles: new Set(),
        sources: new Set(),
        fallbacks: new Set()
      });
    }

    const font = fontMap.get(normalizedFamily);
    if (weight) font.weights.add(weight);
    if (style) font.styles.add(style);
    if (source) font.sources.add(source);
  };

  // 1. Scan Stylesheets (including @font-face rules)
  try {
    const sheets = Array.from(document.styleSheets).filter(sheet => {
      try {
        sheet.cssRules;
        return true;
      } catch (e) {
        console.warn(`Cross-origin stylesheet skipped: ${sheet.href}`);
        return false;
      }
    });

    sheets.forEach(sheet => {
      try {
        Array.from(sheet.cssRules || []).forEach(rule => {
          // Handle @font-face rules
          if (rule instanceof CSSFontFaceRule) {
            processFontData(
              rule.style.fontFamily,
              rule.style.fontWeight,
              rule.style.fontStyle,
              'font-face'
            );
          }
          // Handle regular style rules
          else if (rule.style?.fontFamily) {
            rule.style.fontFamily.split(',').forEach(family => {
              processFontData(
                family,
                rule.style.fontWeight,
                rule.style.fontStyle,
                'stylesheet'
              );
            });
          }
        });
      } catch (e) {
        console.warn('Error processing stylesheet rules:', e);
      }
    });
  } catch (e) {
    console.warn('Error scanning stylesheets:', e);
  }

  // 2. Scan Computed Styles (including inheritance)
  const processElement = (element) => {
    if (processedElements.has(element)) return;
    processedElements.add(element);

    const style = window.getComputedStyle(element);
    if (!style.fontFamily) return;

    // Handle font-family chains (including fallbacks)
    const families = style.fontFamily.split(',');
    families.forEach((family, index) => {
      const normalizedFamily = family.replace(/['"]/g, '').trim();
      
      processFontData(
        normalizedFamily,
        style.fontWeight,
        style.fontStyle,
        'computed'
      );

      // Track fallback relationships
      if (index > 0) {
        const primaryFont = families[0].replace(/['"]/g, '').trim();
        if (fontMap.has(primaryFont)) {
          fontMap.get(primaryFont).fallbacks.add(normalizedFamily);
        }
      }
    });

    // Process children for inheritance
    Array.from(element.children).forEach(processElement);
  };

  // Start processing from the root
  processElement(document.documentElement);

  // 3. Set up dynamic font detection
  const fontChangeObserver = new MutationObserver((mutations) => {
    const hasStyleChanges = mutations.some(mutation => 
      mutation.type === 'childList' && 
      Array.from(mutation.addedNodes).some(node => 
        node.nodeName === 'STYLE' || 
        node.nodeName === 'LINK' ||
        (node instanceof Element && node.style.fontFamily)
      )
    );

    if (hasStyleChanges) {
      console.log('Font changes detected, rescanning...');
      enhancedScanFonts();
    }
  });

  // Observe both head and body for font changes
  fontChangeObserver.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
  fontChangeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });

  // Format results
  const results = Array.from(fontMap.entries()).map(([family, data]) => ({
    family,
    weights: Array.from(data.weights).sort((a, b) => Number(a) - Number(b)),
    styles: Array.from(data.styles),
    sources: Array.from(data.sources),
    fallbacks: Array.from(data.fallbacks),
    usage: processedElements.size
  }));

  console.timeEnd('enhancedFontScan');
  return results;
};

// Helper function to display results in a friendly format
const displayFontResults = (results) => {
  console.group('Font Scan Results');
  results.forEach(font => {
    console.group(`${font.family}`);
    console.log(`Weights: ${font.weights.join(', ')}`);
    console.log(`Styles: ${font.styles.join(', ')}`);
    console.log(`Sources: ${font.sources.join(', ')}`);
    if (font.fallbacks.length) {
      console.log(`Fallbacks: ${font.fallbacks.join(', ')}`);
    }
    console.groupEnd();
  });
  console.groupEnd();
};

// Replace the old scanFonts with the enhanced version
const scanFonts = enhancedScanFonts;

// Create font card element
const createFontCard = (fontData) => {
  const card = document.createElement('div');
  card.className = 'font-card';
  
  const weightName = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black'
  }[fontData.weights[0]] || 'Regular';

  // Get font category and determine appropriate size
  const category = getFontCategory(fontData);
  const fontStyles = getFontStylesByCategory(category);

  card.innerHTML = `
    <div class="font-preview">
      <p class="font-preview-text" style="
        font-family: '${fontData.family}';
        font-size: ${fontStyles.fontSize};
        line-height: ${fontStyles.lineHeight};"
      >Aa</p>
    </div>
    <div class="font-info">
      <div class="font-name">${fontData.family}</div>
      <div class="font-details">${weightName} ${fontData.weights[0]}</div>
      <div class="font-meta">
        <span class="font-size"></span>
      </div>
    </div>
  `;

  // Get computed styles after the element is in the DOM
  const previewText = card.querySelector('.font-preview-text');
  const fontSizeSpan = card.querySelector('.font-size');
  
  // Wait for next frame to ensure styles are computed
  requestAnimationFrame(() => {
    const computedStyle = window.getComputedStyle(previewText);
    fontData.fontSize = computedStyle.fontSize;
    fontData.lineHeight = computedStyle.lineHeight;
    fontData.color = computedStyle.color;
    fontSizeSpan.textContent = fontData.fontSize;
  });
  
  card.addEventListener('click', () => {
    const styles = generateFontStyles(fontData);
    copyToClipboard(styles);
  });
  
  return card;
};

// Function to get font styles based on category
const getFontStylesByCategory = (category) => {
  const styles = {
    'display': {
      fontSize: '32px',
      lineHeight: '1.1'
    },
    'heading': {
      fontSize: '24px',
      lineHeight: '1.2'
    },
    'body': {
      fontSize: '16px',
      lineHeight: '1.5'
    },
    'sans-serif': {
      fontSize: '18px',
      lineHeight: '1.4'
    },
    'serif': {
      fontSize: '20px',
      lineHeight: '1.3'
    },
    'monospace': {
      fontSize: '14px',
      lineHeight: '1.6'
    },
    'handwriting': {
      fontSize: '28px',
      lineHeight: '1.2'
    },
    'decorative': {
      fontSize: '26px',
      lineHeight: '1.1'
    },
    'system': {
      fontSize: '16px',
      lineHeight: '1.5'
    }
  };

  return styles[category] || styles['body']; // Default to body styles if category not found
};

// Function to convert RGB color to Hex
const rgbToHex = (rgb) => {
  // Check if it's already a hex color
  if (rgb.startsWith('#')) return rgb;
  
  // Extract RGB values
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return '#000000';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  // Convert to hex
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Generate font styles based on selected format
const generateFontStyles = (fontData) => {
  const format = document.getElementById('font-format').value;
  const hexColor = rgbToHex(fontData.color || 'rgb(0, 0, 0)');
  
  if (format === 'tailwind') {
    return `font-family: ${fontData.family};
font-weight: ${fontData.weights[0]};
font-size: ${fontData.fontSize};
line-height: ${fontData.lineHeight};
color: ${hexColor};`;
  }
  
  return `font-family: '${fontData.family}';
font-weight: ${fontData.weights[0]};
font-size: ${fontData.fontSize};
line-height: ${fontData.lineHeight};
color: ${hexColor};`;
};

// Update typography display based on filters
const updateTypographyDisplay = (format, weight, category) => {
  const grid = document.getElementById('typography-grid');
  const categorySelect = document.getElementById('font-category');
  grid.innerHTML = '';
  
  const fonts = scanFonts();
  
  // Get available categories and their counts
  const categoryCount = new Map();
  fonts.forEach(font => {
    const fontCategory = getFontCategory(font);
    categoryCount.set(fontCategory, (categoryCount.get(fontCategory) || 0) + 1);
  });
  
  // Update category selector options
  Array.from(categorySelect.options).forEach(option => {
    const value = option.value;
    if (value === 'all') return; // Don't disable 'All Categories' option
    
    const hasValues = categoryCount.has(value) && categoryCount.get(value) > 0;
    option.disabled = !hasValues;
    
    // If current selection is disabled, switch to 'all'
    if (value === category && !hasValues) {
      categorySelect.value = 'all';
      category = 'all';
    }
  });
  
  const filteredFonts = fonts.filter(font => {
    // Filter by weight
    if (weight !== 'all') {
      const fontWeight = weightName[font.weights[0]]?.toLowerCase() || 'regular';
      if (fontWeight !== weight.toLowerCase()) return false;
    }
    
    // Filter by category
    if (category !== 'all') {
      const fontCategory = getFontCategory(font);
      if (fontCategory !== category) return false;
    }
    
    return true;
  });
  
  // Sort fonts alphabetically
  filteredFonts.sort((a, b) => a.family.localeCompare(b.family));
  
  // Display fonts
  filteredFonts.forEach(font => {
    const card = createFontCard(font);
    grid.appendChild(card);
  });
  
  // Show empty state if no fonts found
  if (filteredFonts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No fonts found matching the selected criteria</p>
        <p class="empty-state-subtitle">Try adjusting your filters</p>
      </div>
    `;
  }
};

// Function to determine font category based on font family and usage
const getFontCategory = (font) => {
  const family = font.family.toLowerCase();
  
  // Common system fonts
  const systemFonts = [
    'system-ui', '-apple-system', 'segoe ui', 'roboto', 'helvetica neue', 
    'arial', 'noto sans', 'liberation sans', 'sans-serif'
  ];
  if (systemFonts.includes(family)) {
    return 'system';
  }

  // Display fonts (large, decorative headings)
  if (family.includes('display') || 
      family.includes('poster') || 
      family.includes('banner') || 
      family.includes('showcase')) {
    return 'display';
  }

  // Heading fonts (optimized for titles and headers)
  if (family.includes('heading') || 
      family.includes('title') || 
      ['inter', 'montserrat', 'raleway', 'oswald'].includes(family)) {
    return 'heading';
  }

  // Body fonts (optimized for readability)
  if (family.includes('text') || 
      family.includes('body') || 
      family.includes('book') || 
      ['open sans', 'lato', 'nunito', 'roboto'].includes(family)) {
    return 'body';
  }

  // Sans-serif fonts
  if (family.includes('sans') || 
      ['arial', 'helvetica', 'verdana', 'tahoma'].includes(family)) {
    return 'sans-serif';
  }

  // Serif fonts
  if (family.includes('serif') || 
      ['georgia', 'times', 'garamond', 'baskerville'].includes(family) ||
      family.includes('roman')) {
    return 'serif';
  }

  // Monospace fonts
  if (family.includes('mono') || 
      family.includes('code') || 
      ['consolas', 'courier', 'menlo', 'monaco', 'fira code'].includes(family)) {
    return 'monospace';
  }

  // Handwriting and script fonts
  if (family.includes('script') || 
      family.includes('hand') || 
      family.includes('writing') || 
      family.includes('cursive') ||
      ['pacifico', 'dancing script', 'great vibes'].includes(family)) {
    return 'handwriting';
  }

  // Decorative fonts
  if (family.includes('decorative') || 
      family.includes('ornamental') || 
      family.includes('comic') || 
      family.includes('graffiti') || 
      family.includes('brush') ||
      family.includes('fancy')) {
    return 'decorative';
  }

  // Default to sans-serif if no specific category is matched
  return 'sans-serif';
};

// Weight name mapping
const weightName = {
  '100': 'Thin',
  '200': 'Extra Light',
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'Semi Bold',
  '700': 'Bold',
  '800': 'Extra Bold',
  '900': 'Black'
};

// Function to scan webpage stylesheets
const scanWebpageStylesheets = async () => {
  console.time('stylesheetScan');
  const results = {
    stylesheets: [],
    fonts: new Set(),
    errors: []
  };

  try {
    // Get all stylesheet links
    const stylesheetLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const styleElements = Array.from(document.querySelectorAll('style'));

    // Process external stylesheets
    for (const link of stylesheetLinks) {
      try {
        const href = link.href;
        const sheet = link.sheet;
        
        if (!sheet) {
          results.errors.push(`Could not access stylesheet: ${href}`);
          continue;
        }

        const stylesheetInfo = {
          type: 'external',
          url: href,
          fontFamilies: new Set(),
          rules: 0
        };

        try {
          const rules = Array.from(sheet.cssRules || []);
          stylesheetInfo.rules = rules.length;

          rules.forEach(rule => {
            if (rule instanceof CSSFontFaceRule) {
              stylesheetInfo.fontFamilies.add(rule.style.fontFamily.replace(/['"]/g, '').trim());
            } else if (rule.style?.fontFamily) {
              rule.style.fontFamily.split(',').forEach(family => {
                const normalizedFamily = family.replace(/['"]/g, '').trim();
                if (normalizedFamily && normalizedFamily.toLowerCase() !== 'inherit') {
                  stylesheetInfo.fontFamilies.add(normalizedFamily);
                  results.fonts.add(normalizedFamily);
                }
              });
            }
          });
        } catch (e) {
          stylesheetInfo.error = `Cross-origin stylesheet: ${href}`;
        }

        stylesheetInfo.fontFamilies = Array.from(stylesheetInfo.fontFamilies);
        results.stylesheets.push(stylesheetInfo);
      } catch (e) {
        results.errors.push(`Error processing stylesheet: ${link.href}`);
      }
    }

    // Process inline styles
    styleElements.forEach((style, index) => {
      try {
        const sheet = style.sheet;
        const stylesheetInfo = {
          type: 'inline',
          index: index,
          fontFamilies: new Set(),
          rules: 0
        };

        const rules = Array.from(sheet.cssRules || []);
        stylesheetInfo.rules = rules.length;

        rules.forEach(rule => {
          if (rule instanceof CSSFontFaceRule) {
            stylesheetInfo.fontFamilies.add(rule.style.fontFamily.replace(/['"]/g, '').trim());
          } else if (rule.style?.fontFamily) {
            rule.style.fontFamily.split(',').forEach(family => {
              const normalizedFamily = family.replace(/['"]/g, '').trim();
              if (normalizedFamily && normalizedFamily.toLowerCase() !== 'inherit') {
                stylesheetInfo.fontFamilies.add(normalizedFamily);
                results.fonts.add(normalizedFamily);
              }
            });
          }
        });

        stylesheetInfo.fontFamilies = Array.from(stylesheetInfo.fontFamilies);
        results.stylesheets.push(stylesheetInfo);
      } catch (e) {
        results.errors.push(`Error processing inline style #${index}`);
      }
    });

    results.fonts = Array.from(results.fonts);
    console.timeEnd('stylesheetScan');
    return results;
  } catch (e) {
    console.error('Error scanning stylesheets:', e);
    results.errors.push('Fatal error scanning stylesheets');
    return results;
  }
};

// Helper function to display stylesheet results
const displayStylesheetResults = (results) => {
  console.group('Stylesheet Scan Results');
  
  // Display overall font count
  console.log(`Total unique fonts found: ${results.fonts.length}`);
  
  // Display external stylesheets
  console.group('External Stylesheets');
  results.stylesheets
    .filter(sheet => sheet.type === 'external')
    .forEach(sheet => {
      console.group(sheet.url);
      console.log(`Rules: ${sheet.rules}`);
      console.log(`Fonts: ${sheet.fontFamilies.join(', ')}`);
      if (sheet.error) console.warn(`Error: ${sheet.error}`);
      console.groupEnd();
    });
  console.groupEnd();
  
  // Display inline styles
  console.group('Inline Styles');
  results.stylesheets
    .filter(sheet => sheet.type === 'inline')
    .forEach(sheet => {
      console.group(`Inline Style #${sheet.index}`);
      console.log(`Rules: ${sheet.rules}`);
      console.log(`Fonts: ${sheet.fontFamilies.join(', ')}`);
      console.groupEnd();
    });
  console.groupEnd();
  
  // Display any errors
  if (results.errors.length > 0) {
    console.group('Errors');
    results.errors.forEach(error => console.warn(error));
    console.groupEnd();
  }
  
  console.groupEnd();
};

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
      if (selectedTab === 'export') {
        typographyGrid.style.display = 'none';
      } else {
        typographyGrid.style.display = 'grid';
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
  
  // Initial display
  updateTypographyDisplay('css', 'all', 'all');
}); 