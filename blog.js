// === CONFIG ===
const BLOG_INDEX_PATH = "/mtn-hlth-blog";

async function loadSingleBlogPost() {
  console.log("🔎 Starting blog loader…");

  try {
    const postsUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS00JZEcV_m0xKeyM6VWfWI_r5MEOCivfJMqSW6yj7xxaBmhGRYJVpRRyWHCaH2ONCmSBgMOfFE3U9/pub?gid=0&single=true&output=csv";
    const authorsUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSS00JZEcV_m0xKeyM6VWfWI_r5MEOCivfJMqSW6yj7xxaBmhGRYJVpRRyWHCaH2ONCmSBgMOfFE3U9/pub?gid=2014004444&single=true&output=csv";

    // === Simple CSV Parser ===
    function parseCSV(text) {
      const rows = [];
      let currentRow = [],
        currentCell = "",
        inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i],
          next = text[i + 1];
        if (char === '"' && inQuotes && next === '"') {
          currentCell += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          currentRow.push(currentCell);
          currentCell = "";
        } else if ((char === "\n" || char === "\r") && !inQuotes) {
          if (currentCell || currentRow.length) {
            currentRow.push(currentCell);
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = "";
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
    const [postsRes, authorsRes] = await Promise.all([
      fetch(postsUrl),
      fetch(authorsUrl),
    ]);
    const [postsText, authorsText] = await Promise.all([
      postsRes.text(),
      authorsRes.text(),
    ]);

    console.log("✅ CSVs loaded");
    const posts = parseCSV(postsText);
    const authors = parseCSV(authorsText);

    // === Build Author Map ===
    const authorMap = {};
    authors.slice(1).forEach(([name, photoUrl, profileUrl]) => {
      if (!name) return;
      authorMap[name.trim().toLowerCase()] = { photoUrl, profileUrl };
    });

    // === Identify Current Page ===
    const currentPath = window.location.pathname.replace(/\/$/, "");
    console.log("📍 Current path:", currentPath);

    // === Build Posts Array ===
    const postsArray = posts.slice(1).map((cells, idx) => {
      const [
        title, // A
        url, // B
        heroImage, // C
        subtitle, // D
        author, // E
        date, // F
        category, // G
        readTime, // H
        tags, // I
        section1, // J
        subsection1, // K
        section2, // L
        subsection2, // M
        section3, // N
        subsection3, // O
        section4, // P
        subsection4, // Q
        excerpt, // R
        ctaText, // S
        ctaButtonText // T
      ] = cells;

      return {
        title,
        url,
        heroImage,
        subtitle,
        author,
        date,
        category,
        readTime,
        tags,
        excerpt,
        ctaText,
        ctaButtonText,
        contentBlocks: [
          section1,
          subsection1,
          section2,
          subsection2,
          section3,
          subsection3,
          section4,
          subsection4,
        ].filter((v) => v && v.trim() !== ""), // ✅ filters out empty/undefined
        row: idx + 2,
      };
    });

    console.log("📊 Parsed posts:", postsArray.length);

    // === Match Current Page to Post ===
    let post = postsArray.find(
      (p) => (p.url || "").replace(/\/$/, "") === currentPath
    );
    if (!post) {
      console.warn("⚠️ Exact match failed, trying loose match…");
      post = postsArray.find((p) =>
        currentPath.includes((p.url || "").replace(/\/$/, ""))
      );
    }
    if (!post) {
      console.error("❌ No post matched this path:", currentPath);
      console.table(
        postsArray.map((p) => ({ row: p.row, url: p.url, title: p.title }))
      );
      return;
    }

    console.log("✅ Matched post:", post.title);

    // === HERO IMAGE ===
    const heroImg = document.querySelector(".blog-hero img");
    if (heroImg && post.heroImage) {
      heroImg.src = post.heroImage;
      heroImg.onload = () => {
        if (heroImg.naturalWidth > heroImg.naturalHeight) {
          heroImg.classList.add("landscape");
        }
      };
    }

    // === TITLES & SUBTITLE ===
    const setText = (selector, value) => {
      const el = document.querySelector(selector);
      if (el && value) el.textContent = value;
    };

    setText(".blog-title", post.title);
    setText(".blog-subtitle", post.subtitle);

    // === CATEGORY LINK ===
    const catEl = document.querySelector(".blog-category");
    if (catEl && post.category) {
      catEl.innerHTML = `<a href="${BLOG_INDEX_PATH}?category=${encodeURIComponent(
        post.category
      )}">${post.category}</a>`;
    }

    // === AUTHOR BOX ===
    const authorName = (post.author || "").trim();
    const authorData = authorMap[authorName.toLowerCase()];
    const authorImg = document.querySelector(".blog-author-left img");
    const authorLinks = document.querySelectorAll(".author-link");
    const authorNameEl = document.querySelector(".blog-author-name");

    if (authorData) {
      if (authorImg) authorImg.src = authorData.photoUrl;
      authorLinks.forEach((a) => (a.href = authorData.profileUrl));
    }
    if (authorNameEl) authorNameEl.textContent = authorName;

    // === DATE & READ TIME ===
    const dateEl = document.querySelector(".blog-author-date");
    const readEl = document.querySelector(".blog-author-readtime");
    if (dateEl && post.date) dateEl.textContent = `Published: ${post.date}`;
    if (readEl)
      readEl.innerHTML = `🕒 ${post.readTime || "5 min read"}`;

    // === CONTENT SECTIONS ===
    const contentEl = document.querySelector("#blogContent");
    if (contentEl && post.contentBlocks.length > 0) {
      post.contentBlocks.forEach((html, i) => {
        try {
          if (!html || html.trim() === "") return;
          const section = document.createElement("section");
          section.className = `content-block block-${i + 1}`;
          section.innerHTML = html;
          contentEl.appendChild(section);
        } catch (e) {
          console.warn(`⚠️ Skipped invalid content block ${i + 1}`, e);
        }
      });
    } else {
      console.warn("⚠️ No content blocks found for this post.");
    }

    // === CTA ===
    const ctaHeading = document.getElementById("globalCtaHeading");
    const ctaLink = document.getElementById("globalCtaLink");
    if (ctaHeading && ctaLink) {
      ctaHeading.textContent =
        (post.ctaText && post.ctaText.trim()) ||
        "Ready to Take the Next Step?";
      ctaLink.textContent =
        (post.ctaButtonText && post.ctaButtonText.trim()) ||
        "Book a Consultation";
      ctaLink.href = "/free-consultation";
    }

    // === RELATED POSTS ===
    const relatedWrapper = document.getElementById("relatedWrapper");
    const relatedContainer = document.getElementById("relatedPosts");

    if (relatedWrapper && relatedContainer) {
      const currentTags = (post.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase());

      let relatedPosts = postsArray.filter((p) => {
        if (p.url === post.url) return false;
        const tags = (p.tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase());
        return tags.some((t) => currentTags.includes(t));
      });

      if (relatedPosts.length < 4) {
        const sameCategory = postsArray.filter(
          (p) =>
            p.url !== post.url &&
            p.category === post.category &&
            !relatedPosts.includes(p)
        );
        relatedPosts = relatedPosts.concat(sameCategory);
      }

      relatedPosts = relatedPosts.slice(0, 4);
      if (relatedPosts.length > 0) {
        relatedPosts.forEach((rp) => {
          const item = document.createElement("a");
          item.className = "related-item";
          item.href = rp.url;
          item.innerHTML = `
            <img src="${rp.heroImage || ""}" alt="${rp.title || ""}">
            <div class="related-item-content">
              <h4>${rp.title || "Untitled"}</h4>
              <span>${rp.category || ""}</span>
            </div>`;
          relatedContainer.appendChild(item);
        });
      } else {
        relatedWrapper.style.display = "none";
      }
    }

    console.log("🎉 Blog post rendered successfully.");
  } catch (err) {
    console.error("💥 Blog loader crashed:", err);
  }
}

// === Run Loader on DOM Ready ===
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSingleBlogPost);
} else {
  loadSingleBlogPost();
}
