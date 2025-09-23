// === CONFIG ===
const BLOG_INDEX_PATH = "/mtn-hlth-blog";


async function loadSingleBlogPost() {
  const postsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS00JZEcV_m0xKeyM6VWfWI_r5MEOCivfJMqSW6yj7xxaBmhGRYJVpRRyWHCaH2ONCmSBgMOfFE3U9/pub?gid=0&single=true&output=csv";  
  const authorsUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS00JZEcV_m0xKeyM6VWfWI_r5MEOCivfJMqSW6yj7xxaBmhGRYJVpRRyWHCaH2ONCmSBgMOfFE3U9/pub?gid=2014004444&single=true&output=csv"; 

  // CSV parser
  function parseCSV(text) {
    const rows = [];
    let currentRow = [], currentCell = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i], next = text[i+1];
      if (char === '"' && inQuotes && next === '"') {
        currentCell += '"'; i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell); currentCell = "";
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentCell || currentRow.length) {
          currentRow.push(currentCell);
          rows.push(currentRow);
        }
        currentRow = []; currentCell = "";
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }
    return rows;
  }

  const [postsRes, authorsRes] = await Promise.all([fetch(postsUrl), fetch(authorsUrl)]);
  const [postsText, authorsText] = await Promise.all([postsRes.text(), authorsRes.text()]);

  const posts = parseCSV(postsText);
  const authors = parseCSV(authorsText);

  // Author lookup
  const authorMap = {};
  authors.slice(1).forEach(([name, photoUrl, profileUrl]) => {
    authorMap[name.trim().toLowerCase()] = { photoUrl, profileUrl };
  });

  // Match current URL
  const currentPath = window.location.pathname.replace(/\/$/, "");
const postsArray = posts.slice(1).map(cells => {
  const [
    heroImage, title, subtitle, author, date, category,
    readTime, tags, excerpt, link, ctaText, ctaButtonText
  ] = cells;

  return {
    heroImage, title, subtitle, author, date, category,
    readTime, tags, excerpt, link, ctaText, ctaButtonText
  };
});


const post = postsArray.find(p => (p.link || "").replace(/\/$/, "") === currentPath);
if (!post) {
  console.warn("⚠️ No matching post found for:", currentPath);
  return;
}



// Inject hero image
const heroImg = document.querySelector(".blog-hero img");
heroImg.src = post.heroImage;

// Set blurred background via CSS variable
const heroContainer = document.querySelector(".blog-hero");
heroContainer.style.setProperty("--hero-url", `url(${post.heroImage})`);

// Detect orientation (still useful for CSS tweaks if needed)
heroImg.onload = () => {
  if (heroImg.naturalWidth > heroImg.naturalHeight) {
    heroImg.classList.add("landscape");
  }
};


document.querySelector(".blog-title").textContent = post.title;
document.querySelector(".blog-subtitle").textContent = post.subtitle;
const categoryEl = document.querySelector(".blog-category");
if (categoryEl && post.category) {
  categoryEl.innerHTML = `<a href="${BLOG_INDEX_PATH}?category=${encodeURIComponent(
    post.category.trim()
  )}">${post.category}</a>`;
}




  // Author
  const authorName = post.author.trim();
  const authorData = authorMap[authorName.toLowerCase()];
  const authorImg = document.querySelector(".blog-author-left img");
  const authorLinkEls = document.querySelectorAll(".author-link");
  const authorNameEl = document.querySelector(".blog-author-left strong");

  if (authorData) {
    authorImg.src = authorData.photoUrl;
    authorNameEl.textContent = authorName;
    authorLinkEls.forEach(el => el.href = authorData.profileUrl);
  } else {
    authorNameEl.textContent = authorName;
  }

  // Date + Read Time
  document.querySelector(".blog-date").textContent = `PUBLISHED: ${post.date}`;
  document.querySelector(".blog-readtime").innerHTML = `🕒 ${post.readTime || "5 MINUTE READ"}`;

  // === CTA ===
  document.getElementById("globalCtaHeading").textContent =
    post.ctaText || "Ready to Take the Next Step?";

  const ctaLink = document.getElementById("globalCtaLink");
  ctaLink.textContent =
    post.ctaButtonText ||
    getComputedStyle(document.documentElement).getPropertyValue('--cta-link-text').trim();
  ctaLink.href = getComputedStyle(document.documentElement).getPropertyValue('--cta-link-url').trim();






// === Related Posts ===
const relatedWrapper = document.getElementById("relatedWrapper");
const relatedContainer = document.getElementById("relatedPosts");

// … after filtering posts
if (relatedPosts.length) {
  relatedPosts.forEach(rp => {
    const item = document.createElement("a");
    item.className = "related-item";
    item.href = rp.link;
    item.innerHTML = `
      <img src="${rp.heroImage}" alt="${rp.title}">
      <div class="related-item-content">
        <h4>${rp.title}</h4>
        <span>${rp.category}</span>
      </div>
    `;
    relatedContainer.appendChild(item);
  });
} else if (relatedWrapper) {
  relatedWrapper.remove();  // nukes heading + list
}


// Normalize current post tags
const currentTags = (post.tags || "").split(",").map(t => t.trim().toLowerCase());

// Step 1: Find posts with overlapping tags
let relatedPosts = postsArray.filter(p => {
  if (p.link === post.link) return false; // skip current post
  const tags = (p.tags || "").split(",").map(t => t.trim().toLowerCase());
  return tags.some(t => currentTags.includes(t));
});

// Step 2: If fewer than 4, add category matches
if (relatedPosts.length < 4) {
  const categoryMatches = postsArray.filter(p =>
    p.link !== post.link &&
    p.category === post.category &&
    !relatedPosts.includes(p) // avoid duplicates
  );
  relatedPosts = relatedPosts.concat(categoryMatches);
}

// Step 3: Limit to max 4
relatedPosts = relatedPosts.slice(0, 4);

// Step 4: Render or remove section
if (relatedPosts.length) {
  relatedPosts.forEach(rp => {
    const item = document.createElement("a");
    item.className = "related-item";
    item.href = rp.link;
    item.innerHTML = `
      <img src="${rp.heroImage}" alt="${rp.title}">
      <div class="related-item-content">
        <h4>${rp.title}</h4>
        <span>${rp.category}</span>
      </div>
    `;
    relatedContainer.appendChild(item);
  });
} else {
  relatedWrapper.remove(); // hide entire block if nothing related
}



if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSingleBlogPost);
} else {
  loadSingleBlogPost();
}





