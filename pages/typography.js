// Function to show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  // Use standard CSS class for visibility/transition
  toast.classList.add('show'); 
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
  if (!navigator.clipboard) {
    showToast('Clipboard API not available');
    console.error('Clipboard API not supported');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy to clipboard');
  }
}

// Helper to generate CSS string for a single style
function generateStyleCss(styles) {
  let css = `font-family: ${styles.fontFamily};
`;
  css += `font-size: ${styles.fontSize};
`;
  css += `font-weight: ${styles.fontWeight};
`;
  css += `line-height: ${styles.lineHeight};
`;
  if (styles.letterSpacing && styles.letterSpacing !== 'normal' && styles.letterSpacing !== '0px') {
    css += `letter-spacing: ${styles.letterSpacing};
`;
  }
  return css.trim();
}

// Function to create a typography item card with standard CSS classes
function createTypographyItem(element, styles, count) {
  const item = document.createElement('div');
  item.className = 'typography-card'; // Use standard CSS class

  // --- Preview Area ---
  const previewContainer = document.createElement('div');
  previewContainer.className = 'card-preview-area'; // Standard CSS class
  
  const previewText = document.createElement('div');
  previewText.className = 'card-preview-text'; // Standard CSS class
  previewText.textContent = 'Aa';
  
  // Apply dynamic styles directly to the preview text
  previewText.style.fontFamily = styles.fontFamily;
  previewText.style.fontSize = styles.fontSize; 
  previewText.style.fontWeight = styles.fontWeight;
  previewText.style.lineHeight = styles.lineHeight;
  if (styles.letterSpacing && styles.letterSpacing !== 'normal' && styles.letterSpacing !== '0px') {
    previewText.style.letterSpacing = styles.letterSpacing;
  }
  
  previewContainer.appendChild(previewText);

  // --- Details Area ---
  const details = document.createElement('div');
  details.className = 'card-details-area'; // Standard CSS class

  const topDetails = document.createElement('div');

  const title = document.createElement('div');
  title.className = 'card-title'; // Standard CSS class
  const elementType = element?.tagName?.toLowerCase() || element?.type || 'text';
  title.textContent = elementType.charAt(0).toUpperCase() + elementType.slice(1);
  if (count > 1) {
    title.textContent += ` (${count})`;
  }

  const fontFamily = document.createElement('div');
  fontFamily.className = 'card-font-family'; // Standard CSS class
  fontFamily.textContent = styles.fontFamily.split(',')[0].replace(/["']/g, '');

  const specs = document.createElement('div');
  specs.className = 'card-specs'; // Standard CSS class

  const sizeLineHeight = document.createElement('div');
  sizeLineHeight.className = 'card-spec-item'; // Standard CSS class
  sizeLineHeight.textContent = `Size: ${styles.fontSize} / ${styles.lineHeight}`;
  specs.appendChild(sizeLineHeight);

  const weight = styles.fontWeight;
  const weightLabel = weight === '400' ? 'Regular' : 
                     weight === '700' ? 'Bold' :
                     weight === '600' ? 'Semi Bold' :
                     weight === '500' ? 'Medium' :
                     weight === '300' ? 'Light' :
                     `${weight}`;
  const fontWeightSpan = document.createElement('div');
  fontWeightSpan.className = 'card-spec-item'; // Standard CSS class
  fontWeightSpan.textContent = `Weight: ${weightLabel}`;
  specs.appendChild(fontWeightSpan);

  if (styles.letterSpacing && styles.letterSpacing !== 'normal' && styles.letterSpacing !== '0px') {
    const letterSpacingSpan = document.createElement('div');
    letterSpacingSpan.className = 'card-spec-item'; // Standard CSS class
    letterSpacingSpan.textContent = `Spacing: ${styles.letterSpacing}`;
    specs.appendChild(letterSpacingSpan);
  }

  topDetails.appendChild(title);
  topDetails.appendChild(fontFamily);
  topDetails.appendChild(specs);
  
  // --- Action Area ---
  const actions = document.createElement('div');
  actions.className = 'card-actions-area'; // Standard CSS class

  const copyButton = document.createElement('button');
  copyButton.type = 'button'; 
  copyButton.className = 'button button-copy-style'; // Standard CSS class
  copyButton.setAttribute('aria-label', 'Copy CSS for this style');
  // Use text content and insertAdjacentHTML for SVG to avoid innerHTML performance/security concerns if complex
  copyButton.textContent = ' Copy Style'; 
  copyButton.insertAdjacentHTML('afterbegin', '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2 2h8v2h2V2c0-1.1-.9-2-2-2H2C.9 0 0 .9 0 2v8c0 1.1.9 2 2 2h2v-2H2V2z" fill="currentColor"/><path d="M6 6v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2zm2 0h8v8H8V6z" fill="currentColor"/></svg>');

  
  const styleCss = generateStyleCss(styles);
  copyButton.addEventListener('click', (e) => {
    e.stopPropagation(); 
    copyToClipboard(styleCss);
  });

  copyButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      copyToClipboard(styleCss);
    }
  });

  actions.appendChild(copyButton);
  
  details.appendChild(topDetails);
  details.appendChild(actions);

  item.appendChild(previewContainer);
  item.appendChild(details);

  return item;
}

// --- Modal Functionality with standard CSS ---
let exportModal = null;
let previouslyFocusedElement = null; 
let handleModalKeyDown = null; 

function createExportModal(cssVariables) {
  if (exportModal) return; 

  previouslyFocusedElement = document.activeElement; 

  exportModal = document.createElement('div');
  exportModal.id = 'export-modal';
  exportModal.className = 'modal-overlay'; // Standard CSS class
  exportModal.setAttribute('role', 'dialog');
  exportModal.setAttribute('aria-modal', 'true');
  exportModal.setAttribute('aria-labelledby', 'export-modal-title');
  exportModal.setAttribute('aria-hidden', 'true'); // Hide initially
  
  exportModal.innerHTML = `
    <div class="modal-content" tabindex="-1">
      <div class="modal-header">
        <h2 id="export-modal-title" class="modal-title">Export CSS Variables</h2>
        <button type="button" id="close-modal-button" class="button button-icon button-close-modal" aria-label="Close modal">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-description">Copy and paste these CSS variables into your global stylesheet.</p>
        <div class="code-preview-container">
          <pre class="code-preview-content"><code class="language-css">${cssVariables.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>
      </div>
      <div class="modal-footer">
         <button type="button" id="copy-modal-css-button" class="button button-primary">
           <svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2 2h8v2h2V2c0-1.1-.9-2-2-2H2C.9 0 0 .9 0 2v8c0 1.1.9 2 2 2h2v-2H2V2z" fill="currentColor"/><path d="M6 6v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2zm2 0h8v8H8V6z" fill="currentColor"/></svg>
           <span class="button-text">Copy Variables</span>
         </button>
         <button type="button" id="cancel-modal-button" class="button button-secondary">
           Close
         </button>
      </div>
    </div>
  `;

  document.body.appendChild(exportModal);

  // Add listeners
  const closeModalButton = exportModal.querySelector('#close-modal-button');
  const cancelModalButton = exportModal.querySelector('#cancel-modal-button');
  const copyModalCssButton = exportModal.querySelector('#copy-modal-css-button');
  const modalContent = exportModal.querySelector('.modal-content');

  const hide = () => hideExportModal();

  closeModalButton?.addEventListener('click', hide);
  cancelModalButton?.addEventListener('click', hide);
  copyModalCssButton?.addEventListener('click', () => {
    copyToClipboard(cssVariables);
    const buttonText = copyModalCssButton.querySelector('.button-text');
    if (buttonText) buttonText.textContent = 'Copied!';
    setTimeout(() => {
        if (buttonText) buttonText.textContent = 'Copy Variables';
    }, 1500);
  });

  exportModal.addEventListener('click', (event) => {
     if (event.target === exportModal) { 
       hide();
     }
  });

  const focusableElements = modalContent.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  handleModalKeyDown = (event) => {
    if (event.key === 'Escape') {
      hide();
      return;
    }
    if (event.key === 'Tab') {
       if (focusableElements.length === 0) {
         event.preventDefault();
         return;
       }
      if (event.shiftKey) { 
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          event.preventDefault();
        }
      } else { 
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          event.preventDefault();
        }
      }
    }
  };

  exportModal.addEventListener('keydown', handleModalKeyDown);

  // Show modal using CSS class
  requestAnimationFrame(() => {
      exportModal.classList.add('is-visible');
      exportModal.setAttribute('aria-hidden', 'false');
      firstFocusableElement?.focus(); 
  });
}

function hideExportModal() {
  if (!exportModal) return;
  
  exportModal.classList.remove('is-visible');
  exportModal.setAttribute('aria-hidden', 'true');

  const handleTransitionEnd = (event) => {
    // Ensure transitionend is from the overlay itself
    if (event.target === exportModal) {
        exportModal.removeEventListener('transitionend', handleTransitionEnd);
        if (handleModalKeyDown) {
            exportModal.removeEventListener('keydown', handleModalKeyDown);
            handleModalKeyDown = null; 
        }
        exportModal?.remove();
        exportModal = null;
        previouslyFocusedElement?.focus();
    }
  };

  exportModal.addEventListener('transitionend', handleTransitionEnd);
}

// Function to generate CSS variables
function generateCSSVariables(typographyMap) {
  let css = ':root {\n';
  let index = 1; // Use index for unique variable names
  
  const sortedEntries = [...typographyMap.entries()].sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  sortedEntries.forEach(([key, data]) => {
    const { styles } = data;
    const elementType = data.element?.tagName?.toLowerCase() || data.element?.type || 'text';
    const sanitizedType = elementType.replace(/[^a-zA-Z0-9-]/g, '').replace(/^[^a-zA-Z]+|[^a-zA-Z0-9]+$/g, ''); // More robust sanitization
    const baseName = `typography-${sanitizedType || 'custom'}-${index}`; // Fallback name

    css += `  /* Style Ref: ${key} (${elementType}) */\n`;
    css += `  --${baseName}-font-family: ${styles.fontFamily};\n`;
    css += `  --${baseName}-font-size: ${styles.fontSize};\n`;
    css += `  --${baseName}-line-height: ${styles.lineHeight};\n`;
    css += `  --${baseName}-font-weight: ${styles.fontWeight};\n`;
    if (styles.letterSpacing && styles.letterSpacing !== 'normal' && styles.letterSpacing !== '0px') {
      css += `  --${baseName}-letter-spacing: ${styles.letterSpacing};\n`;
    }
    css += `\n`;
    index++;
  });
  
  css += '}';
  return css;
}

// Function to display export view (now triggers modal)
function displayExport(typographyMap) {
  const cssVariables = generateCSSVariables(typographyMap);
  createExportModal(cssVariables);
}

// Function to display typography items with standard CSS
function displayTypography(typographyMap) {
  const content = document.getElementById('typography-content');
  const elementTypeSelector = document.getElementById('element-type');

  content.innerHTML = '';
  content.className = 'typography-grid-container'; // Use standard CSS class for grid

  const selectedType = elementTypeSelector ? elementTypeSelector.value : 'all';
  let itemsDisplayed = 0;

  Array.from(typographyMap.entries()).forEach(([key, data]) => {
    const { element, styles, count } = data;
    const elementType = element?.tagName?.toLowerCase() || element?.type || 'text';

    // More detailed filtering logic that handles specific heading types
    let shouldDisplay = false;
    if (selectedType === 'all') {
      shouldDisplay = true;
    } else if (selectedType === 'heading') {
      // Show all heading elements (h1-h6)
      shouldDisplay = elementType.match(/^h[1-6]$/);
    } else if (selectedType.match(/^h[1-6]$/)) {
      // For specific heading tags (h1, h2, etc.), check exact match
      shouldDisplay = (elementType === selectedType);
    } else if (selectedType === 'link') {
      shouldDisplay = (elementType === 'a');
    } else if (selectedType === 'body') {
      // Exclude headings, links, and other non-content elements
      const nonBodyElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'input', 
                               'textarea', 'select', 'option', 'label', 'img', 'svg', 
                               'br', 'hr', 'script', 'style', 'iframe'];
      shouldDisplay = !nonBodyElements.includes(elementType);
    }

    if (shouldDisplay) {
      if (element && styles) {
        content.appendChild(createTypographyItem(element, styles, count));
        itemsDisplayed++;
      } else {
        console.warn(`Skipping item with key ${key} due to missing element or styles.`);
      }
    }
  });

  if (itemsDisplayed === 0) {
    content.innerHTML = `
      <div class="empty-state-message">
        <p>No typography styles match the filter "${selectedType}".</p>
      </div>
    `;
    content.className = 'typography-empty-container';
  }
}

// Main function to initialize the typography page
document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('typography-content');
  const exportButton = document.getElementById('export-button');
  const elementTypeSelector = document.getElementById('element-type');
  let typographyMap = null; // Store the map for reuse

  // Add extra declarations for specific heading counts
  function updateDisplay() {
    if (typographyMap) {
      displayTypography(typographyMap);
    }
  }

  // Show loading state with standard CSS skeletons
  const skeletonCardHtml = `
    <div class="skeleton-card">
      <div class="skeleton skeleton-preview"></div>
      <div class="skeleton-details">
        <div class="skeleton skeleton-line" style="width: 50%;"></div>
        <div class="skeleton skeleton-line" style="width: 33%;"></div>
        <div class="skeleton skeleton-line" style="width: 75%;"></div>
        <div class="skeleton skeleton-line" style="width: 50%;"></div>
        <div class="skeleton-actions">
            <div class="skeleton skeleton-button"></div>
        </div>
      </div>
    </div>
  `;
  content.innerHTML = `
    <div class="typography-grid-container is-loading">
      ${Array(6).fill(skeletonCardHtml).join('')}
    </div>
  `;
  content.className = 'typography-grid-container is-loading'; // Set loading class

  // Disable controls initially
  if (elementTypeSelector) elementTypeSelector.disabled = true;
  if (exportButton) exportButton.disabled = true;

  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0 || !tabs[0]?.id) {
       content.innerHTML = `<div class="error-message">Error: Could not find active tab.</div>`;
       content.className = 'typography-error-container'; // Remove grid if error
      return; // Keep controls disabled
    }
    const currentTab = tabs[0];

    // Send message to content script
    chrome.tabs.sendMessage(currentTab.id, { action: 'getTypography' }, (response) => {
      // Remove loading class regardless of outcome
      content.classList.remove('is-loading');

      if (chrome.runtime.lastError) {
        content.innerHTML = `<div class="error-message">Error: ${chrome.runtime.lastError.message || 'Could not connect to page'}.<br>Please refresh the target page and try again.</div>`;
        content.className = 'typography-error-container'; // Remove grid if error
        return; // Keep controls disabled
      }

      if (!response || !response.typography || Object.keys(response.typography).length === 0) {
        content.innerHTML = `<div class="empty-state-message">No typography styles found on this page.</div>`;
        content.className = 'typography-empty-container'; // Remove grid if empty
        return; // Keep controls disabled
      }

      typographyMap = new Map(Object.entries(response.typography));

      // Count element types with more specific heading counts
      let headingCount = 0;
      let h1Count = 0;
      let h2Count = 0; 
      let h3Count = 0;
      let h4Count = 0;
      let h5Count = 0;
      let h6Count = 0;
      let linkCount = 0;
      let bodyCount = 0;

      typographyMap.forEach(data => {
        const elementType = data.element?.tagName?.toLowerCase() || data.element?.type || 'text';
        
        // Count more specific element types
        if (elementType.match(/^h[1-6]$/)) {
          headingCount++;
          
          // Count each heading type separately
          if (elementType === 'h1') h1Count++;
          else if (elementType === 'h2') h2Count++;
          else if (elementType === 'h3') h3Count++;
          else if (elementType === 'h4') h4Count++;
          else if (elementType === 'h5') h5Count++;
          else if (elementType === 'h6') h6Count++;
        } else if (elementType === 'a') {
          linkCount++;
        } else {
          // Count as body text if not a heading, link, or other non-content element
          const nonBodyElements = ['button', 'input', 'textarea', 'select', 'option', 
                                  'label', 'img', 'svg', 'br', 'hr', 'script', 'style', 'iframe'];
          if (!nonBodyElements.includes(elementType)) {
            bodyCount++;
          }
        }
      });

      if (elementTypeSelector) {
        elementTypeSelector.disabled = false;
        
        // Get all options and update them
        const allOption = elementTypeSelector.querySelector('option[value="all"]');
        const headingOption = elementTypeSelector.querySelector('option[value="heading"]');
        const h1Option = elementTypeSelector.querySelector('option[value="h1"]');
        const h2Option = elementTypeSelector.querySelector('option[value="h2"]');
        const h3Option = elementTypeSelector.querySelector('option[value="h3"]');
        const h4Option = elementTypeSelector.querySelector('option[value="h4"]');
        const h5Option = elementTypeSelector.querySelector('option[value="h5"]');
        const h6Option = elementTypeSelector.querySelector('option[value="h6"]');
        const bodyOption = elementTypeSelector.querySelector('option[value="body"]');
        const linkOption = elementTypeSelector.querySelector('option[value="link"]');

        // Update counts in option labels (optional)
        if (headingOption && headingCount > 0) {
          headingOption.textContent = `Headings (${headingCount})`;
        }
        
        // Disable options with no content
        if (headingOption) headingOption.disabled = headingCount === 0;
        if (h1Option) h1Option.disabled = h1Count === 0;
        if (h2Option) h2Option.disabled = h2Count === 0;
        if (h3Option) h3Option.disabled = h3Count === 0;
        if (h4Option) h4Option.disabled = h4Count === 0;
        if (h5Option) h5Option.disabled = h5Count === 0;
        if (h6Option) h6Option.disabled = h6Count === 0;
        if (bodyOption) bodyOption.disabled = bodyCount === 0;
        if (linkOption) linkOption.disabled = linkCount === 0;

        // Reset selection to 'all' if current selection is disabled
        const selectedOption = elementTypeSelector.options[elementTypeSelector.selectedIndex];
        if (selectedOption && selectedOption.disabled && selectedOption.value !== 'all') {
          elementTypeSelector.value = 'all';
        }
        
        // Set up the change event listener
        elementTypeSelector.removeEventListener('change', updateDisplay);
        elementTypeSelector.addEventListener('change', updateDisplay);
      }

      // --- Enable Export Button ---
      if (exportButton) {
         exportButton.disabled = false;
         // Use cloning to ensure only one listener is attached
         const currentListener = exportButton.__clickHandler; // Check if we stored a ref before
         if (currentListener) {
             exportButton.removeEventListener('click', currentListener);
         }
         const newClickHandler = () => {
            if (typographyMap) {
             displayExport(typographyMap); // Trigger modal display
            }
         };
         exportButton.addEventListener('click', newClickHandler);
         exportButton.__clickHandler = newClickHandler; // Store ref for potential removal
      }
      
      // Initial display
      updateDisplay(); 
    });
  });
}); 