// background.js
// Author:
// Author URI: https://
// Author Github URI: https://www.github.com/
// Project Repository URI: https://github.com/
// Description: Handles all the browser level activities (e.g. tab management, etc.)
// License: MIT

// This is a service worker that runs in the background
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hello World Extension installed!');
});
