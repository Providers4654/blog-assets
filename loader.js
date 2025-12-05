// === MTN HLTH Blog Loader ===
// Dynamically loads blog.html, then blog.css + blog.js with cache-busting




/* ===== SQUARESPACE EDIT MODE PROTECTION ===== */
try {
  // Detect if code block is running inside Squarespace editor iframe
  const isInSquarespaceIframe =
    window.frameElement &&
    window.frameElement.classList &&
    window.frameElement.classList.contains("sqs-code-block");

  // Detect Squarespace page editor mode
  const isSqEdit =
    window.top &&
    window.top.document &&
    window.top.document.body &&
    window.top.document.body.classList.contains("sqs-edit-mode");

  if (isInSquarespaceIframe || isSqEdit) {
    console.log("⛔ Blog Loader Disabled in Squarespace Editor");
    return;
  }
} catch (e) {
  console.warn("Squarespace detection error:", e);
}












// === Cache-Busting Setup ===
const manualBump = "1"; // Change this if you want to force-refresh all assets
const today = new Date();
const daily =
  today.getFullYear().toString() +
  (today.getMonth() + 1).toString().padStart(2, "0") +
  today.getDate().toString().padStart(2, "0");
const version = daily + (manualBump ? "-" + manualBump : "");

// === Load blog.html ===
fetch("https://providers4654.github.io/blog-assets/blog.html?v=" + version)
  .then((response) => {
    if (!response.ok) throw new Error("Failed to load blog.html");
    return response.text();
  })
  .then((html) => {
    // Inject the fetched HTML into the current page
    document.documentElement.innerHTML = html;

    // After injection, re-append <head> content (since we overwrote document)
    reAddHeadAssets();

    console.log("✅ MTN HLTH blog template loaded successfully.");
  })
  .catch((error) => {
    console.error("Error loading blog.html:", error);
  });

// === Re-add CSS/JS ===
function reAddHeadAssets() {
  // --- CSS ---
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href =
    "https://providers4654.github.io/blog-assets/blog.css?v=" + version;
  document.head.appendChild(cssLink);

  // --- JS ---
  const jsScript = document.createElement("script");
  jsScript.src =
    "https://providers4654.github.io/blog-assets/blog.js?v=" + version;
  jsScript.defer = true;
  document.head.appendChild(jsScript);
}
