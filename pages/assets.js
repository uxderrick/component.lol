// Function to format file size
function formatFileSize(bytes) {
  // Handle null, undefined, or non-numeric input
  if (bytes === null || bytes === undefined || isNaN(bytes))
    return "Unknown size";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // Handle potential calculation errors or very large numbers
  if (i < 0 || i >= sizes.length) return "Unknown size";
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Function to show toast message
function showToast(message, duration = 2000) {
  const toast = document.getElementById(
    message.includes("downloaded") ? "downloaded-toast" : "copied-toast"
  );
  if (toast) {
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  }
}

// Function to get file type from URL
function getAssetType(src) {
  const extension = src?.split(".")?.pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension))
    return extension;
  if (["mp4", "webm", "mov", "ogg", "m4v"].includes(extension))
    return extension;
  if (src?.startsWith("data:image/svg+xml")) return "svg";
  return "unknown";
}

// Function to scan webpage for assets
async function scanForAssets() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      console.error("No active tab found");
      return [];
    }

    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    // Send message to content script
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { action: "scanAssets" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError);
          resolve([]);
          return;
        }

        if (!response || !response.assets) {
          console.error("Invalid response:", response);
          resolve([]);
          return;
        }

        resolve(response.assets);
      });
    });
  } catch (error) {
    console.error("Error scanning webpage:", error);
    return [];
  }
}

// Function to create asset card
function createAssetCard(asset) {
  const card = document.createElement("div");
  card.className = "asset-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Asset ${asset.name}`);

  // Add lightbox container to document if it doesn't exist
  if (!document.getElementById("asset-lightbox")) {
    const lightboxStyles = `
      .lightbox {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999;
        justify-content: center;
        align-items: center;
      }
      .lightbox.active {
        display: flex;
      }
      .lightbox-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .lightbox-close {
        position: absolute;
        top: -40px;
        right: -40px;
        width: 30px;
        height: 30px;
        background: white;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lightbox img {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
      }
      .lightbox video {
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        background: black;
        border-radius: var(--radius-md);
      }
      .lightbox .video-container {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: black;
        border-radius: var(--radius-md);
      }
      .lightbox .video-error {
        color: var(--color-text-error);
        padding: 1rem;
        text-align: center;
        background: rgba(0, 0, 0, 0.5);
        border-radius: var(--radius-md);
      }
      .lightbox svg,
      .lightbox .svg-container {
        max-width: 90vw;
        max-height: 90vh;
        padding: 32px;
        background: white;
        border-radius: var(--radius-md);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lightbox .svg-container svg {
        width: 100%;
        height: 100%;
        padding: 0;
        max-width: 100%;
        max-height: 100%;
      }
      .lightbox .icon-preview {
        max-width: 128px;
        max-height: 128px;
        padding: 24px;
        background: white;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .lightbox .icon-preview img,
      .lightbox .icon-preview svg {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        padding: 0;
        background: none;
        box-shadow: none;
      }
    `;

    const style = document.createElement("style");
    style.textContent = lightboxStyles;
    document.head.appendChild(style);

    const lightbox = document.createElement("div");
    lightbox.id = "asset-lightbox";
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close preview">✕</button>
        <div class="lightbox-media"></div>
      </div>
    `;

    document.body.appendChild(lightbox);

    // Close lightbox when clicking outside or on close button
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.closest(".lightbox-close")) {
        lightbox.classList.remove("active");
      }
    });

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("active")) {
        lightbox.classList.remove("active");
      }
    });
  }

  const downloadButton = `
    <button class="download-button" aria-label="Download asset">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: var(--color-text-secondary); height: 40px; width: 40px;">
        <path d="M14 11V14H2V11H0V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V11H14Z" fill="currentColor"/>
        <path d="M7 0H9V8.59L11.3 6.3L12.7 7.7L8 12.4L3.3 7.7L4.7 6.3L7 8.59V0Z" fill="currentColor"/>
      </svg>
    </button>
  `;

  // Format dimensions string - Check if dimensions exist
  const dimensionsStr =
    asset.dimensions && asset.dimensions.width && asset.dimensions.height
      ? `<div class="asset-dimensions">${asset.dimensions.width}×${asset.dimensions.height}</div>`
      : "";

  // Add icon indicator class if it's an icon
  const isIcon = asset.isIcon || asset.type === "icon";
  if (isIcon) {
    card.classList.add("is-icon");
  }

  // Handle preview content based on asset type
  let previewContent = "";
  if (asset.type === "svg") {
    // Always use direct innerHTML injection for SVG previews, similar to lightbox
    // Removed the try/catch block that attempted Blob URL and <img> tag
    if (asset.content) {
      const sanitizedContent = asset.content
        .replace(/script/gi, "scrpt")
        .replace(/on\w+=/gi, "data-on=");
      previewContent = `<div class="svg-container" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; cursor: zoom-in;">${sanitizedContent}</div>`;
    } else {
      // Fallback if SVG has no inline content (e.g., only a URL)
      // Use an img tag in this case, assuming it's a simple SVG file URL
      previewContent = `<img src="${asset.url}" alt="${asset.name}" style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;" loading="lazy" />`;
      console.warn(
        "SVG asset has no inline content, attempting preview via URL:",
        asset.name
      );
    }
  } else if (isIcon) {
    // For icons, create a blob URL and ensure proper sizing
    try {
      if (asset.content) {
        // If we have SVG content for the icon
        const blob = new Blob([asset.content], { type: "image/svg+xml" });
        const blobUrl = URL.createObjectURL(blob);
        previewContent = `<img src="${blobUrl}" alt="${asset.name}" style="max-width: 32px; max-height: 32px; width: auto; height: auto; object-fit: contain;" loading="lazy" onload="URL.revokeObjectURL(this.src)" />`;
      } else if (asset.url) {
        // If we have a URL for the icon, create an object URL from fetching it
        fetch(asset.url)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const img = card.querySelector(".icon-preview-placeholder");
            if (img) {
              img.src = blobUrl;
              img.onload = () => URL.revokeObjectURL(blobUrl);
            }
          })
          .catch((error) => console.error("Error loading icon:", error));

        // Use a placeholder while loading
        previewContent = `<img class="icon-preview-placeholder" alt="${asset.name}" style="max-width: 32px; max-height: 32px; width: auto; height: auto; object-fit: contain;" loading="lazy" />`;
      }
    } catch (error) {
      console.error("Error creating icon preview:", error);
      // Fallback to direct URL with proper sizing
      previewContent = `<img src="${asset.url}" alt="${asset.name}" style="max-width: 32px; max-height: 32px; width: auto; height: auto; object-fit: contain;" loading="lazy" />`;
    }
  } else if (
    ["mp4", "webm", "mov", "ogg", "m4v", "video"].includes(asset.type)
  ) {
    // For videos, create a video preview with blob URL to handle CORS
    try {
      previewContent = `
        <video 
        controls 
        preload="metadata"
        style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;"
        loading="lazy"
      >
        <source src="${asset.url}" type="video/${asset.type}">
        <source src="${asset.url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>`;

      // After the card is created, fetch and create blob URL for the video
      setTimeout(async () => {
        try {
          const response = await fetch(asset.url, {
            mode: "cors",
            credentials: "same-origin",
          });
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const videoElement = card.querySelector(".asset-video source");
          if (videoElement) {
            videoElement.src = blobUrl;
            const video = videoElement.parentElement;
            if (video) {
              video.load(); // Reload the video with the new blob URL

              // Clean up blob URL when video is removed
              video.addEventListener(
                "emptied",
                () => {
                  URL.revokeObjectURL(blobUrl);
                },
                { once: true }
              );
            }
          }
        } catch (error) {
          console.error("Error creating video blob URL:", error);
          // If blob creation fails, we'll keep the original URL
          const videoElement = card.querySelector(".asset-video");
          if (videoElement) {
            videoElement.innerHTML = `
              <p class="video-error" style="padding: 1rem; color: var(--color-text-error);">
                Unable to load video preview. Click download to access the video.
              </p>
            `;
          }
        }
      }, 0);
    } catch (error) {
      console.error("Error creating video preview:", error);
      previewContent = `
        <div class="video-error" style="padding: 1rem; text-align: center; color: var(--color-text-error);">
          Unable to preview video
        </div>
      `;
    }
  } else if (asset.type === "gif") {
    // For GIFs, create a special preview that shows animation on hover
    previewContent = `
      <div class="gif-preview" style="width: 100%; height: 100%; position: relative; cursor: pointer;">
        <img 
          src="${asset.url}" 
          alt="${asset.name}" 
          style="width: 100%; height: 100%; object-fit: contain;" 
          loading="lazy"
        />
        <div class="gif-play-indicator" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
        ">GIF</div>
      </div>
    `;
  } else {
    // Regular images
    previewContent = `<img src="${asset.url}" alt="${asset.name}" style="width: 100%; height: 100%; object-fit: contain; cursor: zoom-in;" loading="lazy" />`;
  }

  card.innerHTML = `
    <div class="asset-preview" style="display: flex; align-items: center; justify-content: center; ${
      isIcon
        ? "padding: 1rem; background: var(--color-background-secondary);"
        : ""
    }">
      ${previewContent}
      ${downloadButton}
    </div>
    <div class="asset-info">
      <div class="asset-name">${asset.name}</div>
      <div class="asset-meta">
        ${dimensionsStr}
        <span class="asset-size">${formatFileSize(asset.size)}</span>
        ${isIcon ? '<span class="icon-badge">Icon</span>' : ""}
        ${
          ["mp4", "webm", "mov", "ogg", "m4v"].includes(asset.type)
            ? '<span class="video-badge">Video</span>'
            : ""
        }
        ${asset.type === "gif" ? '<span class="gif-badge">GIF</span>' : ""}
      </div>
    </div>
  `;

  // Add click handler for preview
  if (!["mp4", "webm", "mov", "ogg", "m4v"].includes(asset.type)) {
    const preview = card.querySelector(".asset-preview");
    preview.addEventListener("click", (e) => {
      // Don't open lightbox if clicking download button
      if (!e.target.closest(".download-button")) {
        const lightbox = document.getElementById("asset-lightbox");
        const lightboxMedia = lightbox.querySelector(".lightbox-media");

        // Clear previous content
        lightboxMedia.innerHTML = "";

        if (asset.type === "svg" && asset.content) {
          // For SVGs with content, use the content directly and ensure proper sizing
          const sanitizedContent = asset.content
            .replace(/script/gi, "scrpt")
            .replace(/on\w+=/gi, "data-on=")
            // Ensure SVG has width and height attributes if missing
            .replace(/<svg/, '<svg width="100%" height="100%"');
          lightboxMedia.innerHTML = `<div class="svg-container">${sanitizedContent}</div>`;
        } else if (isIcon) {
          // For icons, create a special preview container
          lightboxMedia.innerHTML = `
            <div class="icon-preview">
              <img src="${asset.url}" alt="${asset.name}" />
            </div>
          `;
        } else {
          // For regular images
          lightboxMedia.innerHTML = `<img src="${asset.url}" alt="${asset.name}" />`;
        }

        // Ensure lightbox is appended if it wasn't before
        if (!document.getElementById("asset-lightbox")) {
          document.body.appendChild(lightbox);
        }
        lightbox.classList.add("active");
      }
    });
  }

  // Add click handler for the download button
  const btnDownload = card.querySelector(".download-button");
  btnDownload.addEventListener("click", async (e) => {
    e.stopPropagation(); // Prevent card click
    try {
      let blob;
      if (asset.type === "svg" || (isIcon && asset.content)) {
        // For SVGs and SVG icons, use the content directly
        blob = new Blob([asset.content], { type: "image/svg+xml" });
      } else if (["mp4", "webm", "mov", "ogg", "m4v"].includes(asset.type)) {
        // For videos, fetch with proper CORS headers
        const response = await fetch(asset.url, {
          mode: "cors",
          credentials: "same-origin",
        });
        blob = await response.blob();
      } else {
        // For other assets, fetch the URL
        const response = await fetch(asset.url);
        blob = await response.blob();
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      showToast("Asset downloaded successfully!");
    } catch (error) {
      console.error("Error downloading asset:", error);
      showToast("Error downloading asset");
    }
  });

  // Add keyboard support for download button
  btnDownload.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      btnDownload.click();
    }
  });

  // For GIFs, add hover interaction to show animation
  if (asset.type === "gif") {
    const gifPreview = card.querySelector(".gif-preview");
    const playIndicator = card.querySelector(".gif-play-indicator");

    if (gifPreview && playIndicator) {
      gifPreview.addEventListener("mouseenter", () => {
        playIndicator.style.opacity = "0";
      });

      gifPreview.addEventListener("mouseleave", () => {
        playIndicator.style.opacity = "1";
      });
    }
  }

  // Update the video click handler
  if (["mp4", "webm", "mov", "ogg", "m4v", "video"].includes(asset.type)) {
    card.addEventListener("click", async (e) => {
      // Don't handle if clicking download button
      if (e.target.closest(".download-button")) return;

      const lightbox = document.getElementById("asset-lightbox");
      const mediaContainer = lightbox.querySelector(".lightbox-media");

      try {
        // Try to fetch the video with CORS
        const response = await fetch(asset.url, {
          mode: "cors",
          credentials: "same-origin",
        });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const videoType =
          asset.type === "mov" ? "video/quicktime" : `video/${asset.type}`;

        mediaContainer.innerHTML = `
          <div class="video-container">
            <video controls autoplay class="lightbox-video">
              <source src="${blobUrl}" type="${videoType}">
              <source src="${blobUrl}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>
        `;

        // Clean up blob URL when video is removed or lightbox is closed
        const video = mediaContainer.querySelector("video");
        const cleanup = () => {
          URL.revokeObjectURL(blobUrl);
          video.removeEventListener("emptied", cleanup);
          lightbox.removeEventListener("click", maybeCleanup);
        };

        const maybeCleanup = (e) => {
          if (e.target === lightbox || e.target.closest(".lightbox-close")) {
            cleanup();
          }
        };

        video.addEventListener("emptied", cleanup);
        lightbox.addEventListener("click", maybeCleanup);
      } catch (error) {
        console.error("Error loading video in lightbox:", error);
        mediaContainer.innerHTML = `
          <div class="video-container">
            <video controls autoplay class="lightbox-video">
              <source src="${asset.url}" type="video/${asset.type}">
              <source src="${asset.url}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>
        `;
      }

      lightbox.classList.add("active");
    });
  }

  return card;
}

// Function to filter assets
function filterAssets(assets, type, size) {
  return assets.filter((asset) => {
    // Type filtering
    const typeMatch =
      type === "all" ||
      type === asset.type ||
      // Special case for icons - match both type='icon' and isIcon=true
      (type === "icon" && asset.isIcon);

    // Size filtering
    let sizeMatch = true;
    if (size !== "all" && asset.size) {
      const sizeInKB = asset.size / 1024;
      switch (size) {
        case "small":
          sizeMatch = sizeInKB < 50;
          break;
        case "medium":
          sizeMatch = sizeInKB >= 50 && sizeInKB <= 200;
          break;
        case "large":
          sizeMatch = sizeInKB > 200;
          break;
      }
    }

    return typeMatch && sizeMatch;
  });
}

// Function to create skeleton loader cards
function createSkeletonCard() {
  const card = document.createElement("div");
  card.className = "asset-card skeleton";

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
  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    grid.appendChild(createSkeletonCard());
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("assets-grid");
  const typeSelect = document.getElementById("asset-type");
  const sizeSelect = document.getElementById("asset-size");

  if (!grid || !typeSelect || !sizeSelect) {
    console.error("Required elements not found");
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

    typeSelect.addEventListener("change", handleFilterChange);
    sizeSelect.addEventListener("change", handleFilterChange);

    // Render assets to the grid
    function renderAssets() {
      if (!grid) return;

      grid.innerHTML = "";
      if (!currentAssets || currentAssets.length === 0) {
        grid.innerHTML = '<div class="empty-state">No assets found</div>';
        return;
      }

      currentAssets.forEach((asset) => {
        const card = createAssetCard(asset);
        if (card) {
          grid.appendChild(card);
        }
      });
    }

    // Initial render
    renderAssets();
  } catch (error) {
    console.error("Error initializing page:", error);
    if (grid) {
      grid.innerHTML =
        '<div class="error-state">Error loading assets. Please try again.</div>';
    }
  }
});

// Add these styles to the document
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-fade-out {
    animation: fadeOut 0.2s ease-out;
  }
`;
document.head.appendChild(style);
