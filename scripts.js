// scripts.js
// Author:
// Author URI: https://
// Author Github URI: https://www.github.com/
// Project Repository URI: https://github.com/
// Description: Handles all the popup level activities (e.g. UI interactions, etc.)
// License: MIT

document.addEventListener("DOMContentLoaded", async () => {
  //console.log('Popup loaded');

  // Function to inject content script
  async function injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
      return true;
    } catch (error) {
      console.error("Error injecting content script:", error);
      return false;
    }
  }

  // Function to get meta data
  async function getMetaData(tab) {
    try {
      // First try to send message
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getMetaData",
        });
        if (response) return response;
      } catch (error) {
        //console.log('Initial message failed, attempting to inject content script');
      }

      // If message fails, inject content script and try again
      const injected = await injectContentScript(tab.id);
      if (!injected) {
        throw new Error("Failed to inject content script");
      }

      // Wait a bit longer for the script to initialize since we're using document_idle
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try sending message again
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "getMetaData",
        });
        if (!response) {
          throw new Error("No response from content script");
        }
        return response;
      } catch (error) {
        console.error("Error communicating with content script:", error);
        throw new Error(
          "Could not communicate with content script. Please refresh the page."
        );
      }
    } catch (error) {
      console.error("Error getting meta data:", error);
      throw error;
    }
  }

  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    // Update the profile link with the current tab's URL
    const profileLinkBadge = document.querySelector(".profile-url-badge");
    if (profileLinkBadge) {
      if (tab.url && tab.url !== "about:blank") {
        // Check if URL exists and is not blank
        profileLinkBadge.href = tab.url;
        profileLinkBadge.textContent = tab.url;
      } else {
        profileLinkBadge.textContent = "Cannot get URL for this page"; // Handle cases like chrome:// pages or blank tabs
        profileLinkBadge.removeAttribute("href"); // Remove href if URL is not valid
        profileLinkBadge.style.pointerEvents = "none"; // Make it non-clickable
        profileLinkBadge.style.textDecoration = "none";
      }
    } else {
      console.error(
        "Profile link badge element (.profile-url-badge) not found."
      );
    }

    // Update UI to loading state
    document.getElementById("website-title").textContent = "Loading...";
    document.getElementById("website-description").textContent =
      "Getting website information...";

    // Get meta data
    const metaData = await getMetaData(tab);

    if (!metaData) {
      throw new Error("Could not get website information");
    }

    // Update the UI with meta data
    document.getElementById("website-title").textContent =
      metaData.title || "No title available";
    document.getElementById("website-description").textContent =
      metaData.description || "No description available";

    // Set the OG image if available
    const ogImageElement = document.getElementById("og-image");
    const ogContainer = document.querySelector(".og-image-container");

    if (ogImageElement && ogContainer) {
      if (metaData.ogImage) {
        //console.log("OG image found, attempting to load src:", metaData.ogImage);
        // Make container visible to show skeleton loader
        ogContainer.style.display = "block";

        ogImageElement.src = metaData.ogImage;
        ogImageElement.alt = metaData.title || "Website Image";

        // Handle successful load
        ogImageElement.onload = function () {
          //console.log("OG image loaded successfully");
          // Remove skeleton styles from container
          ogContainer.classList.remove("skeleton");
          ogContainer.style.background = "none";
          ogContainer.style.animation = "none";
          // NOW make the actual image visible
          ogImageElement.style.display = "block";
        };

        // Handle image load error
        ogImageElement.onerror = function () {
          //console.log("OG image failed to load, hiding container");
          // Hide container and ensure image is hidden
          ogContainer.style.display = "none";
          ogImageElement.style.display = "none";
          ogContainer.classList.remove("skeleton");
          ogContainer.style.background = "none";
          ogContainer.style.animation = "none";
        };
      } else {
        //console.log("No OG image found in metadata, ensuring container is hidden");
        ogContainer.style.display = "none";
        ogImageElement.style.display = "none"; // Ensure image is hidden too
        // Ensure skeleton styles are removed
        ogContainer.classList.remove("skeleton");
        ogContainer.style.background = "none";
        ogContainer.style.animation = "none";
      }
    } else {
      //console.log("OG image element or container not found in DOM");
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("website-title").textContent = "Error";
    document.getElementById("website-description").textContent =
      error.message || "An unknown error occurred";
  }

  // Add click handler for colors card
  const colorsCard = document.getElementById("colors-card");
  if (colorsCard) {
    colorsCard.addEventListener("click", () => {
      window.location.href = "pages/colors.html";
    });
    // Add keydown listener for accessibility
    colorsCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        window.location.href = "pages/colors.html";
      }
    });
  }

  // Add click handler for typography card
  const typographyCard = document.querySelector(".typography-card"); // Use class selector as ID might be missing
  if (typographyCard) {
    typographyCard.addEventListener("click", () => {
      window.location.href = "pages/typography.html";
    });
    // Add keydown listener for accessibility
    typographyCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        window.location.href = "pages/typography.html";
      }
    });
  }

  // Add click handler for buttons card
  const buttonsCard = document.querySelector(".buttons-card"); // Use class selector
  if (buttonsCard) {
    buttonsCard.addEventListener("click", () => {
      window.location.href = "pages/buttons.html";
    });
    // Add keydown listener for accessibility
    buttonsCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        window.location.href = "pages/buttons.html";
      }
    });
  }

  // Add click handler for assets card
  const assetsCard = document.querySelector(".assets-card"); // Use class selector
  if (assetsCard) {
    assetsCard.addEventListener("click", () => {
      window.location.href = "pages/assets.html";
    });
    // Add keydown listener for accessibility
    assetsCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        window.location.href = "pages/assets.html";
      }
    });
  }

  // Listen for tab updates to refresh counters
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      //console.log('Tab updated, refreshing counters');
    }
  });
});
