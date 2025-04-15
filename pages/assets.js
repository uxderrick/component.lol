// Function to format file size
function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return 'Unknown size';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Function to show toast message
function showToast(message, duration = 2000) {
  const toast = document.getElementById(message.includes('downloaded') ? 'downloaded-toast' : 'copied-toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }
}

// Function to get file type from URL
function getAssetType(src) {
  const extension = src?.split('.')?.pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return extension;
  if (['mp4', 'webm'].includes(extension)) return extension;
  if (src?.startsWith('data:image/svg+xml')) return 'svg';
  return 'unknown';
}

// Function to scan webpage for assets
async function scanForAssets() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      return [];
    }

    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Send message to content script
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: 'scanAssets' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          resolve([]);
          return;
        }

        if (!response || !response.assets) {
          console.error('Invalid response:', response);
          resolve([]);
          return;
        }

        resolve(response.assets);
      });
    });
  } catch (error) {
    console.error('Error scanning webpage:', error);
    return [];
  }
}

// Function to create asset card
function createAssetCard(asset) {
  const card = document.createElement('div');
  card.className = 'asset-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Asset ${asset.name}`);

  const downloadButton = `
    <button class="download-button" aria-label="Download asset">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: var(--color-text-secondary); height: 40px; width: 40px;">
        <path d="M14 11V14H2V11H0V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V11H14Z" fill="currentColor"/>
        <path d="M7 0H9V8.59L11.3 6.3L12.7 7.7L8 12.4L3.3 7.7L4.7 6.3L7 8.59V0Z" fill="currentColor"/>
      </svg>
    </button>
  `;

  // Format dimensions string
  const dimensionsStr = asset.dimensions ? 
    `<div class="asset-dimensions">${asset.dimensions.width}×${asset.dimensions.height}</div>` : '';

  // Add icon indicator class if it's an icon
  if (asset.isIcon || asset.type === 'icon') {
    card.classList.add('is-icon');
  }

  card.innerHTML = `
    <div class="asset-preview">
      ${asset.type === 'svg' 
        ? asset.content 
        : `<img src="${asset.url}" alt="${asset.name}" loading="lazy" />`
      }
      ${downloadButton}
    </div>
    <div class="asset-info">
      <div class="asset-name">${asset.name}</div>
      <div class="asset-meta">
        ${dimensionsStr}
        <span class="asset-size">${formatFileSize(asset.size)}</span>
        ${asset.isIcon ? '<span class="icon-badge">Icon</span>' : ''}
      </div>
    </div>
  `;

  // Add click handler for the download button
  const btnDownload = card.querySelector('.download-button');
  btnDownload.addEventListener('click', async (e) => {
    e.stopPropagation(); // Prevent card click
    try {
      let blob;
      if (asset.type === 'svg') {
        blob = new Blob([asset.content], { type: 'image/svg+xml' });
      } else {
        const response = await fetch(asset.url);
        blob = await response.blob();
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Asset downloaded successfully!');
    } catch (error) {
      console.error('Error downloading asset:', error);
      showToast('Error downloading asset');
    }
  });

  // Add keyboard support for download button
  btnDownload.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btnDownload.click();
    }
  });

  return card;
}

// Function to filter assets
function filterAssets(assets, type, size) {
  return assets.filter(asset => {
    // Type filtering
    const typeMatch = type === 'all' || 
      (type === asset.type) || 
      // Special case for icons - match both type='icon' and isIcon=true
      (type === 'icon' && asset.isIcon);
    
    // Size filtering
    let sizeMatch = true;
    if (size !== 'all' && asset.size) {
      const sizeInKB = asset.size / 1024;
      switch (size) {
        case 'small':
          sizeMatch = sizeInKB < 50;
          break;
        case 'medium':
          sizeMatch = sizeInKB >= 50 && sizeInKB <= 200;
          break;
        case 'large':
          sizeMatch = sizeInKB > 200;
          break;
      }
    }
    
    return typeMatch && sizeMatch;
  });
}

// Function to create skeleton loader cards
function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'asset-card skeleton';
  
  card.innerHTML = `
    <div class="asset-preview skeleton-preview">
      <div class="skeleton-image"></div>
    </div>
    <div class="asset-info">
      <div class="skeleton-name"></div>
      <div class="asset-meta">
        <div class="skeleton-dimensions"></div>
        <div class="skeleton-size"></div>
      </div>
    </div>
  `;
  
  return card;
}

// Function to show skeleton loading state
function showSkeletonLoading(grid, count = 8) {
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    grid.appendChild(createSkeletonCard());
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('assets-grid');
  const typeSelect = document.getElementById('asset-type');
  const sizeSelect = document.getElementById('asset-size');

  if (!grid || !typeSelect || !sizeSelect) {
    console.error('Required elements not found');
    return;
  }

  // Show skeleton loading state
  showSkeletonLoading(grid);

  try {
    // Scan the active tab's webpage for assets
    const assets = await scanForAssets();
    let currentAssets = assets;

    // Handle filter changes
    function handleFilterChange() {
      const type = typeSelect.value;
      const size = sizeSelect.value;
      showSkeletonLoading(grid);
      
      setTimeout(() => {
        currentAssets = filterAssets(assets, type, size);
        renderAssets();
      }, 300);
    }

    typeSelect.addEventListener('change', handleFilterChange);
    sizeSelect.addEventListener('change', handleFilterChange);

    // Render assets to the grid
    function renderAssets() {
      if (!grid) return;
      
      grid.innerHTML = '';
      if (!currentAssets || currentAssets.length === 0) {
        grid.innerHTML = '<div class="empty-state">No assets found</div>';
        return;
      }

      currentAssets.forEach(asset => {
        const card = createAssetCard(asset);
        if (card) {
          grid.appendChild(card);
        }
      });
    }

    // Initial render
    renderAssets();
  } catch (error) {
    console.error('Error initializing page:', error);
    if (grid) {
      grid.innerHTML = '<div class="error-state">Error loading assets. Please try again.</div>';
    }
  }
}); 