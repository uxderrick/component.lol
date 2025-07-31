// content.js
// Author:
// Author URI: https://
// Author Github URI: https://www.github.com/
// Project Repository URI: https://github.com/
// Description: Handles all the webpage level activities (e.g. manipulating page data, etc.)
// License: MIT

//console.log("Component.lol content script is active!");

// Function to get meta data from the page
function getMetaData() {
  //console.log("Getting meta data from page...");
  const title = document.title;
  const metaDescription =
    document.querySelector('meta[name="description"]')?.content || "";

  // Get OG image URL from meta tags with more fallbacks
  let ogImage =
    document.querySelector('meta[property="og:image"]')?.content ||
    document.querySelector('meta[name="og:image"]')?.content ||
    document.querySelector('meta[property="twitter:image"]')?.content ||
    document.querySelector('meta[property="og:image:url"]')?.content ||
    document.querySelector('meta[name="twitter:image"]')?.content ||
    document.querySelector('meta[itemprop="image"]')?.content ||
    document.querySelector('link[rel="image_src"]')?.href ||
    "";

  // Resolve to absolute URL if found
  if (ogImage) {
    ogImage = getAbsoluteURL(ogImage); // Use the helper function
  }

  //console.log("Found title:", title);
  //console.log("Found description:", metaDescription);
  //console.log("Found OG image (absolute):", ogImage);

  return {
    title,
    description: metaDescription,
    ogImage,
  };
}

// Function to convert any color format to hex
function normalizeColor(color) {
  // Handle transparent colors
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") {
    return null;
  }

  // Create a temporary div to get computed color
  const div = document.createElement("div");
  div.style.color = color;
  document.body.appendChild(div);

  // Get computed color
  const computedColor = window.getComputedStyle(div).color;
  document.body.removeChild(div);

  // Parse RGB and RGBA values
  const rgbMatch = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  const rgbaMatch = computedColor.match(
    /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/
  );

  if (rgbMatch || rgbaMatch) {
    const values = rgbMatch || rgbaMatch;
    const r = parseInt(values[1]);
    const g = parseInt(values[2]);
    const b = parseInt(values[3]);

    // Convert to hex
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    // If it's RGBA, include alpha channel
    if (rgbaMatch) {
      const alpha = Math.round(parseFloat(values[4]) * 255);
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha)}`.toUpperCase();
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  // If it's already hex, ensure it's uppercase
  if (color.startsWith("#")) {
    // If it's a 4 or 8 digit hex, ensure proper format
    if (color.length === 4 || color.length === 9) {
      return color.toUpperCase();
    }
    // If it's a 3 or 6 digit hex, ensure proper format
    return color.length === 7
      ? color.toUpperCase()
      : `#${color.slice(1).replace(/(.)/g, "$1$1")}`.toUpperCase();
  }

  // Fallback to canvas method for other formats
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  return ctx.fillStyle.toUpperCase();
}

// Function to extract all colors from the webpage
function extractColors() {
  const colorMap = new Map();

  // Function to add color to map with count
  function addColor(color) {
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)")
      return;
    // Attempt to normalize; if it fails or returns null (like for transparent), skip.
    const normalizedColor = normalizeColor(color);
    if (!normalizedColor) return;
    colorMap.set(normalizedColor, (colorMap.get(normalizedColor) || 0) + 1);
  }

  // Recursive function to process an element and its shadow DOM children
  function processElementAndChildren(element) {
    // --- Add filtering for extension-specific elements here if needed ---
    // Example: if (element.closest('.my-extension-root-class')) return;

    try {
      const styles = window.getComputedStyle(element);

      // Check common color properties
      addColor(styles.color);
      addColor(styles.backgroundColor);
      // Check border colors more robustly
      if (styles.borderWidth !== "0px") {
        addColor(styles.borderColor); // General border color
        // Check individual sides if necessary, though borderColor often covers it
        addColor(styles.borderTopColor);
        addColor(styles.borderRightColor);
        addColor(styles.borderBottomColor);
        addColor(styles.borderLeftColor);
      }
      addColor(styles.outlineColor);
      addColor(styles.textDecorationColor);

      // Extract color from box-shadow if present
      const boxShadow = styles.boxShadow;
      if (boxShadow && boxShadow !== "none") {
        // Regex to find color values (hex, rgb, rgba) within the shadow string
        const shadowColors = boxShadow.match(
          /rgba?\([^)]+\)|#[0-9a-f]{3,8}|rgb\([^)]+\)/gi
        );
        if (shadowColors) shadowColors.forEach(addColor);
      }

      // Extract colors from background-image gradients
      const backgroundImage = styles.backgroundImage;
      if (backgroundImage && backgroundImage.includes("-gradient(")) {
        // More specific check for gradients
        const gradientColors = backgroundImage.match(
          /rgba?\([^)]+\)|#[0-9a-f]{3,8}|rgb\([^)]+\)/gi
        );
        if (gradientColors) gradientColors.forEach(addColor);
      }
    } catch (e) {
      // Ignore elements where styles can't be computed (e.g., display:none in some cases)
      // console.warn('Could not compute style for element:', element, e);
    }

    // Process children within the Shadow DOM, if it exists
    if (element.shadowRoot) {
      try {
        const shadowElements = element.shadowRoot.querySelectorAll("*");
        shadowElements.forEach(processElementAndChildren); // Recurse
      } catch (e) {
        console.warn("Could not query shadowRoot:", element, e);
      }
    }
  }

  // Get all elements in the main document and process them
  const allElements = document.querySelectorAll("*");
  allElements.forEach(processElementAndChildren);

  // Also check all stylesheets
  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      // Skip extension's own stylesheets and inaccessible ones
      if (
        sheet.href &&
        (sheet.href.startsWith("chrome-extension://") ||
          sheet.href.startsWith("moz-extension://"))
      ) {
        return; // Skip this extension stylesheet
      }

      try {
        Array.from(sheet.cssRules || sheet.rules).forEach((rule) => {
          // Check if it's a style rule and has a style object
          if (rule instanceof CSSStyleRule && rule.style) {
            addColor(rule.style.color);
            addColor(rule.style.backgroundColor);
            if (
              rule.style.borderWidth !== "0px" &&
              rule.style.borderWidth !== ""
            ) {
              addColor(rule.style.borderColor); // More specific check
              addColor(rule.style.borderTopColor);
              addColor(rule.style.borderRightColor);
              addColor(rule.style.borderBottomColor);
              addColor(rule.style.borderLeftColor);
            }
            addColor(rule.style.outlineColor);
            addColor(rule.style.textDecorationColor);

            // Extract color from box-shadow if present in rule style
            const boxShadowRule = rule.style.boxShadow;
            if (boxShadowRule && boxShadowRule !== "none") {
              const shadowColorsRule = boxShadowRule.match(
                /rgba?\([^)]+\)|#[0-9a-f]{3,8}|rgb\([^)]+\)/gi
              );
              if (shadowColorsRule) shadowColorsRule.forEach(addColor);
            }

            // Extract colors from background-image gradients in rule style
            const backgroundImageRule = rule.style.backgroundImage;
            if (
              backgroundImageRule &&
              backgroundImageRule.includes("-gradient(")
            ) {
              const gradientColorsRule = backgroundImageRule.match(
                /rgba?\([^)]+\)|#[0-9a-f]{3,8}|rgb\([^)]+\)/gi
              );
              if (gradientColorsRule) gradientColorsRule.forEach(addColor);
            }
          }
          // Potentially handle other rule types like @media, @supports if necessary
          // else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) { ... recurse into rule.cssRules ... }
        });
      } catch (e) {
        console.warn(
          `Could not process rules for stylesheet (possibly cross-origin): ${
            sheet.href || "inline style"
          }`,
          e.message
        );
        // Skip inaccessible rules within a stylesheet (e.g., cross-origin restrictions)
      }
    });
  } catch (e) {
    console.warn("Could not access document.styleSheets:", e);
  }

  // Ensure null keys (from failed normalizations) are removed if any snuck in.
  colorMap.delete(null);

  return Array.from(colorMap.entries());
}

// Function to count components on the page
function countComponents() {
  // Count colors
  const colorMap = new Map();
  function addColor(color) {
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)")
      return;
    const normalizedColor = normalizeColor(color);
    colorMap.set(normalizedColor, (colorMap.get(normalizedColor) || 0) + 1);
  }

  // Get all elements
  const elements = document.getElementsByTagName("*");
  Array.from(elements).forEach((element) => {
    const styles = window.getComputedStyle(element);
    addColor(styles.color);
    addColor(styles.backgroundColor);
    addColor(styles.borderColor);
  });

  // Count typography elements (excluding those within buttons and other interactive elements)
  const typographyElements = document.querySelectorAll(
    "h1, h2, h3, h4, h5, h6, p, span, a, li, blockquote"
  );
  const typographyCount = Array.from(typographyElements).filter((el) => {
    // Exclude elements that are part of buttons or other interactive elements
    return !el.closest(
      'button, [role="button"], input, select, textarea, .button, .btn'
    );
  }).length;

  // Count buttons (including various button types and button-like elements)
  const buttons = document.querySelectorAll(
    'button, [role="button"], input[type="button"], input[type="submit"], .button, .btn'
  );
  const buttonCount = Array.from(buttons).filter((button) => {
    // Exclude hidden buttons
    const style = window.getComputedStyle(button);
    return style.display !== "none" && style.visibility !== "hidden";
  }).length;

  // Count assets (images, icons, SVGs)
  const assets = document.querySelectorAll(
    'img, svg, [class*="icon"], [class*="logo"]'
  );
  const assetCount = Array.from(assets).filter((asset) => {
    // Exclude hidden assets
    const style = window.getComputedStyle(asset);
    return style.display !== "none" && style.visibility !== "hidden";
  }).length;

  return {
    colors: colorMap.size,
    typography: typographyCount,
    buttons: buttonCount,
    assets: assetCount,
  };
}

// Function to extract gradients from the webpage
function extractGradients() {
  const gradientMap = new Map();

  // Function to add gradient to map with count
  function addGradient(gradient) {
    if (!gradient) return;
    const normalizedGradientKey = normalizeGradient(gradient); // Use normalized string as key
    let existingEntry = gradientMap.get(normalizedGradientKey);

    if (existingEntry) {
      existingEntry.count++;
    } else {
      // Store the *original* gradient string for rendering, along with count
      gradientMap.set(normalizedGradientKey, { original: gradient, count: 1 });
    }
  }

  // Get all elements
  const elements = document.getElementsByTagName("*");

  Array.from(elements).forEach((element) => {
    const styles = window.getComputedStyle(element);
    const backgroundImage = styles.backgroundImage;

    if (backgroundImage && backgroundImage.includes("gradient")) {
      addGradient(backgroundImage);
    }
  });

  // Also check all stylesheets
  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules || sheet.rules).forEach((rule) => {
          if (
            rule.style &&
            rule.style.backgroundImage &&
            rule.style.backgroundImage.includes("gradient")
          ) {
            addGradient(rule.style.backgroundImage);
          }
        });
      } catch (e) {
        // Skip inaccessible stylesheets
      }
    });
  } catch (e) {
    console.warn("Could not access some stylesheets:", e);
  }

  // Return the map entries directly. The format is now [normalizedKey, { original, count }]
  return Array.from(gradientMap.entries());
}

// Function to normalize gradient string (used for grouping/key generation)
function normalizeGradient(gradient) {
  // Remove vendor prefixes
  gradient = gradient.replace(/-webkit-|-moz-|-o-|-ms-/g, "");

  // Extract colors and positions
  const colors = gradient.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
  const positions = gradient.match(/\d+%|\d+\.\d+%/g) || [];

  // Create a normalized string
  return colors
    .map((color, i) => {
      const position = positions[i] || "";
      return `${color}${position}`;
    })
    .join(",");
}

// Function to resolve CSS variable to its actual value
function resolveCSSVariable(value) {
  // NOTE: This function might still be needed by other parts of content.js,
  // but it's not needed for analyzeTypography anymore if we only use computedStyle.
  if (!value || !value.startsWith("var(--")) return value;

  // Create a temporary element to compute the style
  const temp = document.createElement("div");
  // Apply to multiple properties in case one is invalid for the element
  temp.style.cssText = `color: ${value}; background-color: ${value}; border-color: ${value}; font-size: ${value}; line-height: ${value};`;
  temp.style.display = "none"; // Avoid affecting layout
  document.body.appendChild(temp);

  // Get the computed value - try common properties
  const computedStyle = window.getComputedStyle(temp);
  let resolvedValue = computedStyle.color;
  if (resolvedValue === value || !resolvedValue)
    resolvedValue = computedStyle.backgroundColor;
  if (resolvedValue === value || !resolvedValue)
    resolvedValue = computedStyle.borderColor;
  if (resolvedValue === value || !resolvedValue)
    resolvedValue = computedStyle.fontSize;
  if (resolvedValue === value || !resolvedValue)
    resolvedValue = computedStyle.lineHeight;

  // Clean up
  document.body.removeChild(temp);

  // Return the original value if resolution failed
  return resolvedValue !== value ? resolvedValue : value;
}

// Function to analyze typography on the page
function analyzeTypography() {
  const typographyMap = new Map();
  // const processedStyles = new Set(); // No longer needed?

  // Helper function to normalize font family
  function normalizeFontFamily(fontFamily) {
    if (!fontFamily) return "";
    // Take the first font in the stack, remove quotes, trim, lowercase
    return fontFamily.split(",")[0].trim().replace(/['"]/g, "").toLowerCase();
  }

  // Helper function to create a unique key for typography styles
  function createTypographyKey(styles) {
    // Key based on the directly computed values which should be consistent
    return `${styles.fontFamily}-${styles.fontSize}-${styles.fontWeight}-${styles.fontStyle}`;
  }

  // Helper function to check if a font is a system font
  function isSystemFont(fontFamily) {
    // Consider expanding this list or using a more robust check if needed
    const systemFonts = [
      "system-ui",
      "-apple-system",
      "blinkmacsystemfont",
      "segoe ui",
      "roboto",
      "helvetica neue",
      "ubuntu",
      "cantarell",
      "firoid sans",
      "oxygen-sans", // Common Linux fonts
      "arial",
      "helvetica",
      "sans-serif", // Generic fallbacks
      "serif",
      "times new roman",
      "times",
      "georgia", // Generic serif
      "monospace",
      "courier new",
      "courier", // Generic mono
      // Avoid overly broad matches like just 'sans'
    ];
    // Use startsWith for font stacks like "Roboto, sans-serif"
    // return systemFonts.some(sysFont => fontFamily.startsWith(sysFont));
    // Exact match on the first font in the stack is usually better
    return systemFonts.includes(fontFamily.toLowerCase());
  }

  // // Helper function to resolve style value - NO LONGER NEEDED FOR analyzeTypography
  // function resolveStyleValue(value, property) { ... }

  // // Helper function to process style rule - NO LONGER NEEDED
  // function processStyleRule(rule) { ... }

  // // Process stylesheets - REMOVED
  // try {
  //   Array.from(document.styleSheets).forEach(sheet => { ... });
  // } catch (e) {
  //   console.warn('Could not access document.styleSheets:', e);
  // }

  // Process actual elements on the page using computed styles
  try {
    const elements = document.querySelectorAll("*");
    elements.forEach((element) => {
      try {
        const computedStyle = window.getComputedStyle(element);

        // --- FILTERING ---
        // 1. Skip hidden elements
        if (
          computedStyle.display === "none" ||
          computedStyle.visibility === "hidden"
        ) {
          return;
        }
        // 2. Skip elements with zero size (optional, uncomment if needed)
        // if (element.offsetWidth === 0 && element.offsetHeight === 0 && element.tagName !== 'BODY') {
        //    return;
        // }
        // 3. Skip elements with 0px font size (Comment out the 'return' to report 0px sizes)
        if (computedStyle.fontSize === "0px") {
          return;
        }
        // --- END FILTERING ---

        // Use the *first* font in the computed stack
        const fontFamily = normalizeFontFamily(computedStyle.fontFamily);

        // Skip system fonts
        if (!fontFamily || isSystemFont(fontFamily)) {
          return;
        }

        // Directly use computed values
        const fontSize = computedStyle.fontSize; // e.g., "16px"
        const lineHeight = computedStyle.lineHeight; // e.g., "24px" or "normal"
        const fontWeight = computedStyle.fontWeight; // e.g., "400", "700"
        const fontStyle = computedStyle.fontStyle; // e.g., "normal", "italic"

        // Skip if essential style properties are missing (shouldn't happen with computedStyle often)
        if (!fontSize || !fontWeight || !fontStyle) {
          return;
        }

        const key = createTypographyKey({
          fontFamily,
          fontSize,
          fontWeight,
          fontStyle,
        });

        if (typographyMap.has(key)) {
          // Increment count for existing style combination
          typographyMap.get(key).count++;
          // Optionally, add element info if needed:
          // typographyMap.get(key).elements.push({ tagName: element.tagName });
        } else {
          // Add new style combination
          typographyMap.set(key, {
            element: {
              // Store info about the first element found with this style
              type: element.tagName.toLowerCase(),
              tagName: element.tagName,
              selector: "", // Generating selector is complex, omit for now
            },
            styles: {
              fontFamily, // Normalized first font
              fontSize, // Computed pixel value (usually)
              fontWeight, // Computed weight
              fontStyle, // Computed style
              lineHeight, // Computed line height
            },
            count: 1,
            // Optionally track elements:
            // elements: [{ tagName: element.tagName }]
          });
        }
      } catch (e) {
        // Ignore errors getting computed style for specific elements (e.g., SVGs in some browsers)
        // console.warn("Could not process element:", element, e);
      }
    }); // End elements.forEach
  } catch (e) {
    console.error("Error processing typography from DOM elements:", e);
  }

  // Convert Map to object format expected by popup script
  const resultObject = {};
  typographyMap.forEach((value, key) => {
    // Use the generated key as the key for the result object
    resultObject[key] = value;
  });

  return resultObject; // Return the object
}

// Function to analyze buttons on the webpage
function analyzeButtons() {
  const buttonMap = new Map();

  // Helper function to get computed dimensions
  function getDimensions(element) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      padding: {
        top: computed.paddingTop,
        right: computed.paddingRight,
        bottom: computed.paddingBottom,
        left: computed.paddingLeft,
      },
    };
  }

  // Helper function to get colors
  function getColors(element) {
    const computed = window.getComputedStyle(element);
    return {
      background: computed.backgroundColor,
      text: computed.color,
      border: computed.borderColor,
      hoverBg: getHoverColor(element, "backgroundColor"),
      hoverText: getHoverColor(element, "color"),
    };
  }

  // Helper function to get hover state colors
  function getHoverColor(element, property) {
    const clone = element.cloneNode(true);
    clone.style.display = "none";
    document.body.appendChild(clone);
    clone.classList.add("hover");
    const hoverStyle = window.getComputedStyle(clone, ":hover");
    const color = hoverStyle[property];
    document.body.removeChild(clone);
    return color;
  }

  // Helper function to analyze typography
  function getTypography(element) {
    const computed = window.getComputedStyle(element);
    return {
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      textTransform: computed.textTransform,
    };
  }

  // Helper function to get shadows and effects
  function getEffects(element) {
    const computed = window.getComputedStyle(element);
    return {
      boxShadow: computed.boxShadow,
      borderRadius: computed.borderRadius,
      border: `${computed.borderWidth} ${computed.borderStyle} ${computed.borderColor}`,
      transition: computed.transition,
    };
  }

  // Function to create a unique key for the button
  function createButtonKey(buttonData) {
    return JSON.stringify({
      dimensions: buttonData.dimensions,
      colors: buttonData.colors,
      typography: buttonData.typography,
      effects: buttonData.effects,
    });
  }

  // Find all button-like elements
  const buttonElements = [
    ...document.getElementsByTagName("button"),
    ...document.getElementsByTagName("input"),
    ...document.getElementsByTagName("nav"),
    ...document.getElementsByTagName("a"),
    ...document.querySelectorAll('[role="button"]'),
    ...document.querySelectorAll(
      '.btn, .button, [class*="btn-"], [class*="button-"], [class*="button"], [class*="btn"], [class*="button"], [class*="btn-"], [class*="button-"], [class*="button_"]'
    ),
  ].filter((element) => {
    if (element.tagName === "INPUT") {
      return ["button", "submit", "reset"].includes(element.type);
    }
    return true;
  });

  // Analyze each button
  buttonElements.forEach((element) => {
    const buttonData = {
      element: {
        tagName: element.tagName,
        type: element.type || "button",
        classes: Array.from(element.classList),
        text: element.innerText || element.value || "",
      },
      dimensions: getDimensions(element),
      colors: getColors(element),
      typography: getTypography(element),
      effects: getEffects(element),
    };

    const key = createButtonKey(buttonData);

    if (buttonMap.has(key)) {
      buttonMap.get(key).count++;
      buttonMap.get(key).instances.push(buttonData.element);
    } else {
      buttonMap.set(key, {
        ...buttonData,
        count: 1,
        instances: [buttonData.element],
      });
    }
  });

  return Array.from(buttonMap.entries()).map(([key, data]) => ({
    key,
    ...data,
  }));
}

// Function to fetch SVG content from a URL
async function fetchSvgContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Don't throw an error, just return null so the process can continue
      console.warn(
        `Could not fetch SVG content from ${url}: ${response.statusText}`
      );
      return null;
    }
    const text = await response.text();
    // Basic check to see if it looks like SVG
    if (text.trim().startsWith("<svg")) {
      return text;
    }
    return null;
  } catch (error) {
    console.warn(`Error fetching SVG content from ${url}:`, error);
    return null;
  }
}

// Function to get dimensions of an image
async function getImageDimensions(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Function to get absolute URL
function getAbsoluteURL(url) {
  if (!url) return null;
  try {
    return new URL(url, window.location.href).href;
  } catch (e) {
    return null;
  }
}

// Function to get file size
async function getFileSize(url) {
  if (!url) return null; // Added check for null/undefined URL
  try {
    // Use 'no-cors' mode for HEAD requests to avoid immediate CORS failure,
    // though it might limit header access on some servers.
    const response = await fetch(url, { method: "HEAD", mode: "no-cors" });

    // If the request was opaque (due to no-cors), we can't access headers.
    // Try a GET request as a fallback, but abort it quickly.
    if (response.type === "opaque") {
      try {
        const controller = new AbortController();
        const signal = controller.signal;
        // Abort after 500ms to avoid downloading large files just for size
        setTimeout(() => controller.abort(), 500);

        const getResponse = await fetch(url, { signal });
        if (!getResponse.ok) {
          console.warn(
            `Could not get size for ${url}: GET request failed with status ${getResponse.status}`
          );
          return null;
        }
        const sizeHeader = getResponse.headers.get("content-length");
        // IMPORTANT: We consumed the response body partially here, need to cancel it.
        if (getResponse.body) {
          getResponse.body.cancel();
        }
        return sizeHeader ? parseInt(sizeHeader) : null; // Return null if header missing
      } catch (getError) {
        if (getError.name === "AbortError") {
          console.warn(
            `HEAD request for ${url} was opaque, and GET request timed out or failed before getting size.`
          );
        } else {
          console.warn(
            `Fallback GET request for size failed for ${url}:`,
            getError
          );
        }
        return null; // Return null on fallback failure
      }
    }

    // For non-opaque responses
    if (!response.ok) {
      console.warn(
        `Could not get size for ${url}: HEAD request failed with status ${response.status}`
      );
      return null; // Return null on non-OK status
    }

    const size = response.headers.get("content-length");
    return size ? parseInt(size) : null; // Return null if header missing
  } catch (error) {
    // Catch fetch errors (network, CORS on redirect if 'no-cors' wasn't enough, etc.)
    console.warn(`Could not get size for ${url}:`, error);
    return null; // Return null on error
  }
}

// Function to check if an element is likely an icon
function isLikelyIcon(element, url = "", dimensions = {}) {
  // Ensure dimensions is an object before destructuring
  const safeDimensions = dimensions || {};
  const { width, height } = safeDimensions;

  // Check dimensions (icons are typically small and square)
  const isSmallAndSquare =
    width &&
    height &&
    width > 0 &&
    height > 0 && // Added check for > 0
    width <= 64 &&
    height <= 64 &&
    Math.abs(width - height) <= 10; // Increased tolerance slightly

  // Check URL patterns
  const urlLower = (url || "").toLowerCase(); // Ensure url is a string
  const isIconPath =
    urlLower.includes("/icons/") ||
    urlLower.includes("/icon/") ||
    urlLower.includes("icon.") ||
    urlLower.includes("-icon.") ||
    urlLower.includes("_icon.") ||
    urlLower.endsWith(".ico"); // Added .ico check

  // Check element context if element is provided
  let isInIconContext = false;
  if (element && typeof element.closest === "function") {
    // Check if element is valid
    isInIconContext =
      element.closest('[class*="icon"]') !== null ||
      element.closest('[id*="icon"]') !== null ||
      element.getAttribute("class")?.toLowerCase().includes("icon") ||
      element.getAttribute("id")?.toLowerCase().includes("icon") ||
      element.tagName?.toLowerCase() === "i"; // Check if it's an <i> tag
  }

  // Consider it an icon if it's small/square OR has an icon path/context
  return isSmallAndSquare || isIconPath || isInIconContext;
}

// Function to scan for assets
async function scanAssets() {
  const assets = new Map();
  const processedUrls = new Set(); // Keep track of processed URLs to avoid duplicate fetches

  // Simple blocklist for known non-asset domains/patterns
  const NON_ASSET_PATTERNS = [
    /\.google-analytics\.com$/,
    /\.googletagmanager\.com$/,
    /\.googleadservices\.com$/,
    /\.doubleclick\.net$/,
    /\/beacon/,
    /\/pixel/,
    /\/analytics/,
    /\/tracking/,
    /\.facebook\.net$/,
    /\.fbcdn\.net$/,
    /connect\.facebook\.net$/,
    /\.twitter\.com\/i\//, // Twitter analytics/pixels
    /t\.co\//, // Twitter short URLs (often tracking)
    /\.adsrvr\.org$/,
    /analytics\.twitter\.com$/,
    // Add more patterns as needed
  ];

  // Helper function to check if a URL should be skipped
  const shouldSkipUrl = (url) => {
    if (!url) return true;
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const path = urlObj.pathname;

      // Skip common non-asset protocols
      if (!["http:", "https:", "data:"].includes(urlObj.protocol)) {
        return true;
      }
      // Skip if it matches any non-asset pattern
      return NON_ASSET_PATTERNS.some((pattern) => {
        // If pattern ends with $ (and is a RegExp), test only hostname, otherwise test hostname + path
        // Ensure we are dealing with a RegExp object before using toString()
        const patternString =
          Object.prototype.toString.call(pattern) === "[object RegExp]"
            ? pattern.toString()
            : "";
        if (patternString.endsWith("$/")) {
          return pattern.test(hostname);
        } else {
          return pattern.test(hostname + path);
        }
      });
    } catch (e) {
      return true; // Invalid URL
    }
  };

  // Helper function to add assets safely
  const addAsset = (key, assetData) => {
    // Basic check for valid asset data
    if (!assetData.url && !assetData.content) return;
    // Ensure name exists
    if (!assetData.name) {
      if (assetData.url) {
        assetData.name =
          assetData.url.split("/").pop().split("?")[0] || "asset"; // Basic name from URL
      } else {
        assetData.name = `${assetData.type || "svg"}_asset`; // Default name for content-based assets
      }
    }
    // Add appropriate file extension if missing
    if (assetData.type && assetData.name && !assetData.name.includes(".")) {
      const ext =
        assetData.type === "image"
          ? "png"
          : assetData.type === "background"
          ? "png"
          : assetData.type; // Default extensions
      if (!["icon", "svg", "video", "image", "background"].includes(ext)) {
        // Don't add extensions for unknown types
      } else if (ext !== "background") {
        assetData.name = `${assetData.name}.${ext}`;
      }
    }

    assets.set(key, assetData);
    if (assetData.url) {
      processedUrls.add(assetData.url); // Mark URL as processed
    }
  };

  // --- Scan Phase 1: DOM Elements (img, svg, video) ---

  // Scan for images (<img> tags)
  const imageElements = document.querySelectorAll("img");
  for (const img of imageElements) {
    // Handle potential src and srcset
    let potentialUrls = [img.src];
    if (img.srcset) {
      potentialUrls = potentialUrls.concat(
        img.srcset.split(",").map((entry) => entry.trim().split(" ")[0])
      );
    }

    for (const potentialSrc of potentialUrls) {
      const src = getAbsoluteURL(potentialSrc);
      if (src && !processedUrls.has(src) && !src.startsWith("data:")) {
        // Skip data URIs for now
        processedUrls.add(src); // Mark as processing

        // *** Add filter check here ***
        if (shouldSkipUrl(src)) {
          //console.log("Skipping non-asset URL:", src);
          continue; // Skip this URL
        }

        const dimensions = await getImageDimensions(src);
        const size = await getFileSize(src);
        const type = getAssetTypeFromUrl(src) || "image";
        let content = null;

        // If it's an SVG, try to fetch its content
        if (type === "svg") {
          content = await fetchSvgContent(src);
        }

        // Pass dimensions safely to isLikelyIcon
        const isIcon = isLikelyIcon(img, src, dimensions || {});

        addAsset(src, {
          name: src.split("/").pop().split("?")[0], // Remove query params from name
          type: content ? "svg" : isIcon ? "icon" : type, // Correct type based on content
          url: src,
          content, // Add the fetched content
          size, // Can be null
          dimensions, // Can be null
          isIcon,
        });
      } else if (src && src.startsWith("data:image/")) {
        // Handle data URIs
        if (!assets.has(src)) {
          // Avoid duplicates if already added
          const type = src.match(/^data:image\/([^;]+);/)?.[1] || "png";
          addAsset(src, {
            name: `data_image.${type}`,
            type: type,
            url: src, // Keep data URI as URL for display/download
            size: calculateDataUriSize(src),
            dimensions: await getImageDimensions(src), // Try getting dimensions
            isIcon: isLikelyIcon(
              img,
              "",
              (await getImageDimensions(src)) || {}
            ),
          });
        }
      }
    }
  }

  // Scan for inline SVGs (<svg> tags)
  const svgElements = document.querySelectorAll("svg");
  svgElements.forEach((svg) => {
    // Ensure the SVG is potentially visible and meaningful
    if (
      svg.clientWidth > 0 &&
      svg.clientHeight > 0 &&
      svg.outerHTML.length > 50
    ) {
      const svgContent = svg.outerHTML;
      const key = `svg_${svgContent.substring(0, 100)}_${svgContent.length}`; // Create a more stable key

      if (!assets.has(key)) {
        const dimensions = {
          width: svg.clientWidth,
          height: svg.clientHeight,
        };
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const isIcon = isLikelyIcon(svg, "", dimensions); // Pass dimensions

        addAsset(key, {
          name: isIcon ? "icon.svg" : "vector.svg", // Better default names
          type: "svg", // Type is always svg for inline
          content: svgContent,
          size: blob.size,
          dimensions,
          isIcon,
          url: null, // Explicitly null for content-based assets initially
        });
      }
    }
  });

  // Scan for video sources (<video> <source> tags)
  const videoSources = document.querySelectorAll("video source");
  for (const source of videoSources) {
    const src = getAbsoluteURL(source.src);
    if (src && !processedUrls.has(src) && !src.startsWith("data:")) {
      processedUrls.add(src); // Mark as processing
      const size = await getFileSize(src);
      addAsset(src, {
        name: src.split("/").pop().split("?")[0],
        type: getAssetTypeFromUrl(src) || "video", // Use helper
        url: src,
        size, // Can be null
        dimensions: null, // Typically don't get video dimensions easily here
        isIcon: false,
      });
    }
    // Add handling for data URI videos if needed later
  }

  // --- Scan Phase 2: Computed Styles (background-image) ---

  // Scan for background images (more robustly)
  const allElements = document.querySelectorAll("*");
  const checkedBackgroundUrls = new Set(); // Avoid checking the same bg URL multiple times

  for (const el of allElements) {
    // Basic check to skip potentially hidden or irrelevant elements
    if (
      el.offsetWidth === 0 &&
      el.offsetHeight === 0 &&
      el.tagName !== "BODY"
    ) {
      continue;
    }

    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;

    // Skip if no background image or if it's a gradient
    if (!bgImage || bgImage === "none" || bgImage.includes("-gradient(")) {
      continue;
    }

    // Extract URLs (handles multiple backgrounds)
    const matches = bgImage.match(/url\((['"]?)(.*?)\1\)/g) || [];
    for (const match of matches) {
      const url = match.replace(/url\((['"]?)(.*?)\1\)/, "$2");
      if (!url || url.startsWith("data:") || checkedBackgroundUrls.has(url)) {
        // Skip data URIs and already checked URLs
        continue;
      }
      checkedBackgroundUrls.add(url); // Mark as checked

      const absoluteUrl = getAbsoluteURL(url);
      if (absoluteUrl && !processedUrls.has(absoluteUrl)) {
        processedUrls.add(absoluteUrl); // Mark as processing

        // *** Add filter check here ***
        if (shouldSkipUrl(absoluteUrl)) {
          //console.log("Skipping non-asset background URL:", absoluteUrl);
          continue; // Skip this URL
        }

        const dimensions = await getImageDimensions(absoluteUrl);
        const size = await getFileSize(absoluteUrl);
        // Pass dimensions safely to isLikelyIcon
        const isIcon = isLikelyIcon(el, absoluteUrl, dimensions || {});

        addAsset(absoluteUrl, {
          name: absoluteUrl.split("/").pop().split("?")[0],
          type:
            getAssetTypeFromUrl(absoluteUrl) ||
            (isIcon ? "icon" : "background"), // Use helper, default to background
          url: absoluteUrl,
          size, // Can be null
          dimensions, // Can be null
          isIcon,
        });
      } else if (
        absoluteUrl &&
        absoluteUrl.startsWith("data:image/") &&
        !assets.has(absoluteUrl)
      ) {
        // Handle data URIs found in CSS
        const type = absoluteUrl.match(/^data:image\/([^;]+);/)?.[1] || "png";
        addAsset(absoluteUrl, {
          name: `data_bg_image.${type}`,
          type: type,
          url: absoluteUrl,
          size: calculateDataUriSize(absoluteUrl),
          dimensions: await getImageDimensions(absoluteUrl),
          isIcon: isLikelyIcon(
            el,
            "",
            (await getImageDimensions(absoluteUrl)) || {}
          ),
        });
      }
    }
  }

  // --- Scan Phase 3: Shadow DOM (Recursive Scan) ---

  const scanNodeRecursively = async (node) => {
    const shadowRoot = node.shadowRoot;
    if (shadowRoot) {
      // Scan elements within the shadow root
      const shadowImages = shadowRoot.querySelectorAll("img");
      for (const img of shadowImages) {
        // Similar logic as top-level images, checking processedUrls
        let potentialUrls = [img.src];
        if (img.srcset) {
          potentialUrls = potentialUrls.concat(
            img.srcset.split(",").map((entry) => entry.trim().split(" ")[0])
          );
        }
        for (const potentialSrc of potentialUrls) {
          const src = getAbsoluteURL(potentialSrc); // Resolve relative to host document
          if (src && !processedUrls.has(src) && !src.startsWith("data:")) {
            processedUrls.add(src);

            // *** Add filter check here ***
            if (shouldSkipUrl(src)) {
              //console.log("Skipping non-asset shadow URL:", src);
              continue; // Skip this URL
            }

            const dimensions = await getImageDimensions(src);
            const size = await getFileSize(src);
            const isIcon = isLikelyIcon(img, src, dimensions || {});
            addAsset(src, {
              name: src.split("/").pop().split("?")[0],
              type: getAssetTypeFromUrl(src) || (isIcon ? "icon" : "image"),
              url: src,
              size,
              dimensions,
              isIcon,
            });
          } else if (src && src.startsWith("data:image/") && !assets.has(src)) {
            const type = src.match(/^data:image\/([^;]+);/)?.[1] || "png";
            addAsset(src, {
              name: `data_shadow_image.${type}`,
              type: type,
              url: src,
              size: calculateDataUriSize(src),
              dimensions: await getImageDimensions(src),
              isIcon: isLikelyIcon(
                img,
                "",
                (await getImageDimensions(src)) || {}
              ),
            });
          }
        }
      }

      const shadowSvgs = shadowRoot.querySelectorAll("svg");
      shadowSvgs.forEach((svg) => {
        // Similar logic as top-level SVGs
        if (
          svg.clientWidth > 0 &&
          svg.clientHeight > 0 &&
          svg.outerHTML.length > 50
        ) {
          const svgContent = svg.outerHTML;
          const key = `svg_${svgContent.substring(0, 100)}_${
            svgContent.length
          }`;
          if (!assets.has(key)) {
            const dimensions = {
              width: svg.clientWidth,
              height: svg.clientHeight,
            };
            const blob = new Blob([svgContent], { type: "image/svg+xml" });
            const isIcon = isLikelyIcon(svg, "", dimensions);
            addAsset(key, {
              name: isIcon ? "icon_shadow.svg" : "vector_shadow.svg",
              type: "svg",
              content: svgContent,
              size: blob.size,
              dimensions,
              isIcon,
              url: null,
            });
          }
        }
      });

      // Recursively scan children within the shadow root
      const shadowChildren = shadowRoot.querySelectorAll("*");
      for (const child of shadowChildren) {
        await scanNodeRecursively(child); // Recurse
      }
    }
  };

  // Start recursive scan from the document body
  for (const node of document.querySelectorAll("*")) {
    await scanNodeRecursively(node);
  }

  //console.log(`Scan complete. Found ${assets.size} unique assets.`);
  return Array.from(assets.values());
}

// --- Helper Functions ---

// Function to get asset type from URL extension
function getAssetTypeFromUrl(url) {
  if (!url || url.startsWith("data:")) return null;
  try {
    const path = new URL(url).pathname;
    const extension = path.split(".").pop()?.toLowerCase();

    if (
      [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "bmp",
        "tif",
        "tiff",
        "ico",
      ].includes(extension)
    )
      return "image";
    if (["svg"].includes(extension)) return "svg";
    if (
      ["mp4", "webm", "mov", "ogg", "m4v", "avi", "wmv", "flv"].includes(
        extension
      )
    )
      return "video";
    // Add more types if needed (e.g., fonts, audio)

    // Special check for URLs that *look* like icons even without standard extension
    if (url.toLowerCase().includes("icon")) return "icon";

    return null; // Or 'unknown' if preferred
  } catch (e) {
    return null; // Invalid URL
  }
}

// Function to estimate size of base64 data URI
function calculateDataUriSize(dataUri) {
  if (!dataUri || !dataUri.startsWith("data:")) return null;
  // Find the comma separating header from data
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) return null;

  const base64Data = dataUri.substring(commaIndex + 1);
  // Base64 encoding uses 4 characters for every 3 bytes of original data.
  // Padding characters ('=') don't represent original data bytes.
  const padding = base64Data.endsWith("==")
    ? 2
    : base64Data.endsWith("=")
    ? 1
    : 0;
  const base64Length = base64Data.length;

  // Approximate size in bytes
  return Math.floor(base64Length * (3 / 4)) - padding;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //console.log("Content script received message:", request);

  if (request.action === "getColors") {
    const colors = extractColors();
    //console.log("Sending colors:", colors);
    sendResponse({ colors });
  } else if (request.action === "getMetaData") {
    const metaData = getMetaData();
    //console.log("Sending meta data:", metaData);
    sendResponse(metaData);
  } else if (request.action === "getComponentCounts") {
    const counts = countComponents();
    //console.log("Sending component counts:", counts);
    sendResponse(counts);
  } else if (request.action === "getGradients") {
    const gradients = extractGradients();
    sendResponse({ gradients });
  } else if (request.action === "getTypography") {
    try {
      // Call analyzeTypography directly
      const typography = analyzeTypography();
      //console.log("Sending typography data:", typography);
      sendResponse({ typography });
    } catch (error) {
      console.error("Error getting typography:", error);
      sendResponse({ error: error.message });
    }
    return true; // Keep channel open for async response if needed, although analyzeTypography is currently sync
  } else if (request.action === "getButtons") {
    try {
      const buttons = analyzeButtons();
      sendResponse({ buttons });
    } catch (error) {
      console.error("Error analyzing buttons:", error);
      sendResponse({ error: error.message });
    }
  } else if (request.action === "scanAssets") {
    scanAssets()
      .then((assets) => {
        //console.log("Sending assets:", assets);
        sendResponse({ assets });
      })
      .catch((error) => {
        console.error("Error scanning assets:", error);
        sendResponse({ assets: [] });
      });
    return true; // Keep the message channel open for async response
  }

  // For non-async responses
  if (request.action === "getMetaData" || request.action === "getTypography") {
    return true;
  }
});
