// === CONFIG ===
const BLOG_INDEX_PATH = "/mtn-hlth-blog";

async function loadSingleBlogPost() {
  console.log("🔎 Starting blog loader…");

  try {
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

    console.log("📥 Fetching CSVs…");
    const [postsRes, authorsRes] = await Promise.all([fetch(postsUrl), fetch(authorsUrl)]);
    const [postsText, authorsText] = await Promise.all([postsRes.text(), authorsRes.text()]);

    console.log("✅ CSVs loaded");
    const posts = parseCSV(postsText);
    const authors = parseCSV(authorsText);

    console.log("👤 Building author map…");
    const authorMap = {};
    authors.slice(1).forEach(([name, photoUrl, profileUrl]) => {
      authorMap[name.trim().toLowerCase()] = { photoUrl, profileUrl };
    });

    const currentPath = window.location.pathname.replace(/\/$/, "");
    console.log("📍 Current path:", currentPath);

    console.log("📝 Building posts array…");
    const postsArray = posts.slice(1).map((cells, idx) => {
      const [
        heroImage, title, subtitle, author, date, category,
        readTime, tags, excerpt, link, ctaText, ctaButtonText
      ] = cells;

      return {
        heroImage, title, subtitle, author, date, category,
        readTime, tags, excerpt, link, ctaText, ctaButtonText,
        row: idx + 2 // spreadsheet row number for debugging
      };
    });

    console.log("📊 Posts parsed:", postsArray);

    // Match by exact or loose link
    let post = postsArray.find(p => (p.link || "").replace(/\/$/, "") === currentPath);
    if (!post) {
      console.warn("⚠️ Exact match failed. Trying loose match…");
      post = postsArray.find(p => currentPath.includes((p.link || "").replace(/\/$/, "")));
    }

    if (!post) {
      console.error("❌ No post matched! Check Link column in sheet vs. currentPath");
      console.table(postsArray.map(p => ({ row: p.row, link: p.link, title: p.title })));
      return;
    }

    console.log("✅ Matched post:", post);

    // HERO
    const heroImg = document.querySelector(".blog-hero img");
    if (heroImg) {
      heroImg.src = post.heroImage;
      heroImg.onload = () => {
        if (heroImg.naturalWidth > heroImg.naturalHeight) {
          heroImg.classList.add("landscape");
        }
      };
    } else {
      console.warn("⚠️ .blog-hero img not found in DOM");
    }

    const heroContainer = document.querySelector(".blog-hero");
    if (heroContainer) {
      heroContainer.style.setProperty("--hero-url", `url(${post.heroImage})`);
    }

    // TITLES
    document.querySelector(".blog-title").textContent = post.title || "";
    document.querySelector(".blog-subtitle").textContent = post.subtitle || "";

    // CATEGORY
    const categoryEl = document.querySelector(".blog-category");
    if (categoryEl && post.category) {
      categoryEl.innerHTML = `<a href="${BLOG_INDEX_PATH}?category=${encodeURIComponent(
        post.category.trim()
      )}">${post.category}</a>`;
    }

    // AUTHOR
    const authorName = (post.author || "").trim();
    const authorData = authorMap[authorName.toLowerCase()];
    const authorImg = document.querySelector(".blog-author-left img");
    const authorLinkEls = document.querySelectorAll(".author-link");
    const authorNameEl = document.querySelector(".blog-author-name");

    if (authorData) {
      if (authorImg) authorImg.src = authorData.photoUrl;
      if (authorNameEl) authorNameEl.textContent = authorName;
      authorLinkEls.forEach(el => (el.href = authorData.profileUrl));
    } else {
      if (authorNameEl) authorNameEl.textContent = authorName;
    }

    // DATE + READ TIME
    const dateEl = document.querySelector(".blog-author-date");
    const readTimeEl = document.querySelector(".blog-author-readtime");
    if (dateEl) dateEl.textContent = `Published: ${post.date}`;
    if (readTimeEl) readTimeEl.innerHTML = `🕒 ${post.readTime || "5 MINUTE READ"}`;

    // CTA
    const ctaHeading = document.getElementById("globalCtaHeading");
    const ctaLink = document.getElementById("globalCtaLink");
    if (ctaHeading && ctaLink) {
      const defaultText =
        getComputedStyle(document.documentElement).getPropertyValue("--cta-link-text").trim() ||
        "Book a Consultation";
      const defaultUrl =
        getComputedStyle(document.documentElement).getPropertyValue("--cta-link-url").trim() ||
        "/free-consultation";

      ctaHeading.textContent = (post.ctaText && post.ctaText.trim()) || "Ready to Take the Next Step?";
      ctaLink.textContent = (post.ctaButtonText && post.ctaButtonText.trim()) || defaultText;
      ctaLink.href = defaultUrl;
    }

    // RELATED
    const relatedWrapper = document.getElementById("relatedWrapper");
    const relatedContainer = document.getElementById("relatedPosts");
    if (relatedWrapper && relatedContainer) {
      const currentTags = (post.tags || "").split(",").map(t => t.trim().toLowerCase());
      let relatedPosts = postsArray.filter(p => {
        if (p.link === post.link) return false;
        const tags = (p.tags || "").split(",").map(t => t.trim().toLowerCase());
        return tags.some(t => currentTags.includes(t));
      });

      if (relatedPosts.length < 4) {
        const categoryMatches = postsArray.filter(
          p => p.link !== post.link && p.category === post.category && !relatedPosts.includes(p)
        );
        relatedPosts = relatedPosts.concat(categoryMatches);
      }

      relatedPosts = relatedPosts.slice(0, 4);

      if (relatedPosts.length > 0) {
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
        relatedWrapper.style.display = "none";
      }
    }

    console.log("🎉 Blog post loaded successfully");

  } catch (err) {
    console.error("💥 Blog loader crashed:", err);
  }
}

// Load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSingleBlogPost);
} else {
  loadSingleBlogPost();
}
