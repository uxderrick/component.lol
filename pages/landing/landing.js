document.addEventListener("DOMContentLoaded", () => {
  const signInButton = document.querySelector(".sign-in-button");
  const anonymousButton = document.querySelector(".anonymous-button");
  const statsElements = {
    fonts: document.querySelector(".stats-fonts"),
    colors: document.querySelector(".stats-colors"),
    images: document.querySelector(".stats-images"),
  };

  // Add loading state
  Object.values(statsElements).forEach((el) => {
    if (el) el.textContent = "--";
  });

  // Select OG image and container
  const ogImageContainer = document.querySelector(".og-image-container");
  const ogImage = document.querySelector(".og-image");
  const ogFallbackContainer = document.querySelector(".og-fallback-container");

  const handleNavigation = () => {
    window.location.href = "../../index.html";
  };

  // Function to inject and execute content script
  const injectContentScript = async (tabId) => {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
    } catch (error) {
      console.error("Error injecting content script:", error);
      throw error;
    }
  };

  // Function to update stats
  const updateStats = async () => {
    try {
      // Get active tab to analyze
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) throw new Error("No active tab found");

      // Fetch OG image first
      const metaData = await chrome.tabs.sendMessage(tab.id, {
        action: "getMetaData",
      });
      if (metaData && metaData.ogImage) {
        ogImage.src = metaData.ogImage;
        ogImage.alt = "OG Image";
        ogImageContainer.hidden = false;
        ogFallbackContainer.hidden = true;

        // Fetch stats only if OG image exists
        // Get typography data to count unique font families
        const typographyResponse = await chrome.tabs.sendMessage(tab.id, {
          action: "getTypography",
        });
        const componentResponse = await chrome.tabs.sendMessage(tab.id, {
          action: "getComponentCounts",
        });
        // Count unique font families
        const uniqueFontFamilies = new Set();
        if (typographyResponse.typography) {
          Object.values(typographyResponse.typography).forEach((item) => {
            if (item.styles && item.styles.fontFamily) {
              uniqueFontFamilies.add(
                item.styles.fontFamily.split(",")[0].trim().toLowerCase()
              );
            }
          });
        }
        if (document.querySelector(".stats-fonts"))
          document.querySelector(".stats-fonts").textContent =
            uniqueFontFamilies.size || 0;
        if (document.querySelector(".stats-colors"))
          document.querySelector(".stats-colors").textContent =
            componentResponse.colors || 0;
        // Get assets count
        const assetsResponse = await chrome.tabs.sendMessage(tab.id, {
          action: "scanAssets",
        });
        if (document.querySelector(".stats-images"))
          document.querySelector(".stats-images").textContent =
            assetsResponse.assets?.length || 0;
      } else {
        ogImageContainer.hidden = true;
        ogFallbackContainer.hidden = false;
      }
    } catch (error) {
      ogImageContainer.hidden = true;
      ogFallbackContainer.hidden = false;
    }
  };

  // Initialize stats
  updateStats();

  signInButton.addEventListener("click", handleNavigation);
  anonymousButton.addEventListener("click", handleNavigation);
});
