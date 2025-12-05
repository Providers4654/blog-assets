// === MTN HLTH Blog Loader (Squarespace-safe) ===

// --- Cache-Busting Setup ---
const manualBump = "1"; // bump this when you want to force refresh
const today = new Date();
const daily =
  today.getFullYear().toString() +
  (today.getMonth() + 1).toString().padStart(2, "0") +
  today.getDate().toString().padStart(2, "0");
const version = daily + (manualBump ? "-" + manualBump : "");

// --- URLs for assets ---
const BLOG_HTML_URL =
  "https://providers4654.github.io/blog-assets/blog.html?v=" + version;
const BLOG_CSS_URL =
  "https://providers4654.github.io/blog-assets/blog.css?v=" + version;
const BLOG_JS_URL =
  "https://providers4654.github.io/blog-assets/blog.js?v=" + version;

// --- Helper: ensure CSS is loaded once ---
function ensureBlogCssLoaded() {
  if (document.querySelector('link[data-mtn-blog-css="1"]')) return;
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = BLOG_CSS_URL;
  cssLink.setAttribute("data-mtn-blog-css", "1");
  document.head.appendChild(cssLink);
}

// --- Helper: ensure JS is loaded once ---
function ensureBlogJsLoaded() {
  if (document.querySelector('script[data-mtn-blog-js="1"]')) return;
  const jsScript = document.createElement("script");
  jsScript.src = BLOG_JS_URL;
  jsScript.defer = true;
  jsScript.setAttribute("data-mtn-blog-js", "1");
  document.head.appendChild(jsScript);
}

// --- Main loader ---
function loadMtnBlog() {
  // Look for the container in the Squarespace Code Block
  const root = document.getElementById("mtn-blog-root");
  if (!root) {
    console.warn("MTN HLTH Blog: #mtn-blog-root not found.");
    return;
  }

  // Load HTML template
  fetch(BLOG_HTML_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load blog.html");
      return response.text();
    })
    .then((htmlText) => {
      // Parse blog.html as a document
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");

      // Only insert the <body> content (safe for Squarespace)
      const bodyContent = doc.body ? doc.body.innerHTML : htmlText;

      // Inject blog content into the code block container
      root.innerHTML = bodyContent;

      // Attach CSS + JS
      ensureBlogCssLoaded();
      ensureBlogJsLoaded();

      console.log("✅ MTN HLTH blog template injected safely.");
    })
    .catch((error) => {
      console.error("💥 Error loading blog.html:", error);
    });
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadMtnBlog);
} else {
  loadMtnBlog();
}
