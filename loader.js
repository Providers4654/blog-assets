// === Blog CSS/JS loader with cache-busting ===

// Manual override (set to "" for normal daily refresh)
// Change this number (e.g. "1", "2", "3") to force an immediate update across all pages
const manualBump = "3";

// Daily cache-buster (YYYYMMDD)
const today = new Date();
const daily = today.getFullYear().toString() +
              (today.getMonth() + 1).toString().padStart(2, "0") +
              today.getDate().toString().padStart(2, "0");

// Final version string
const version = daily + (manualBump ? "-" + manualBump : "");

// Load CSS
const cssLink = document.createElement("link");
cssLink.rel = "stylesheet";
cssLink.href = "https://providers4654.github.io/blog-assets/blog.css?v=" + version;
document.head.appendChild(cssLink);

// Load JS
const jsScript = document.createElement("script");
jsScript.src = "https://providers4654.github.io/blog-assets/blog.js?v=" + version;
jsScript.defer = true;
document.head.appendChild(jsScript);
