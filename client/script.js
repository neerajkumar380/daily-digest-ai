let currentPage = 1;
let currentQuery = "";
let currentCategory = "";
let showingSavedNews = false;
let allArticles = [];

const newsContainer = document.getElementById("news-container");
const loadMoreBox = document.getElementById("loadMoreBox");
const actionBar = document.getElementById("actionBar");
const toast = document.getElementById("toast");

const searchInput =
  document.querySelector('input[type="text"]') ||
  document.querySelector("input");

const searchButton = Array.from(document.querySelectorAll("button")).find(
  (btn) => btn.textContent.trim().toLowerCase() === "search"
);

const savedNewsButton = Array.from(document.querySelectorAll("button")).find(
  (btn) => btn.textContent.trim().toLowerCase().includes("saved")
);

const darkModeButton = Array.from(document.querySelectorAll("button")).find(
  (btn) => btn.textContent.trim().toLowerCase().includes("dark")
);

const categoryButtons = Array.from(document.querySelectorAll("button")).filter(
  (btn) =>
    ["sports", "tech", "business", "entertainment"].includes(
      btn.textContent.trim().toLowerCase()
    )
);

document.addEventListener("DOMContentLoaded", () => {
  setupDarkMode();
  setupSearch();
  setupCategories();
  setupSavedNewsButton();
  loadNews();
});

function setupSearch() {
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      const value = searchInput ? searchInput.value.trim() : "";
      currentQuery = value;
      currentCategory = "";
      currentPage = 1;
      showingSavedNews = false;
      loadNews(true);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const value = searchInput.value.trim();
        currentQuery = value;
        currentCategory = "";
        currentPage = 1;
        showingSavedNews = false;
        loadNews(true);
      }
    });
  }
}

function setupCategories() {
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentCategory = normalizeCategory(btn.textContent.trim());
      currentQuery = "";
      currentPage = 1;
      showingSavedNews = false;
      if (searchInput) searchInput.value = "";
      loadNews(true);
    });
  });
}

function setupSavedNewsButton() {
  if (!savedNewsButton) return;

  savedNewsButton.addEventListener("click", () => {
    showingSavedNews = true;
    renderSavedNews();
  });
}

function setupDarkMode() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateDarkModeButtonText(true);
  }

  if (darkModeButton) {
    darkModeButton.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateDarkModeButtonText(isDark);
    });
  }
}

function updateDarkModeButtonText(isDark) {
  if (!darkModeButton) return;
  darkModeButton.textContent = isDark ? "☀ Light Mode" : "🌙 Dark Mode";
}

function normalizeCategory(category) {
  const map = {
    tech: "technology",
    sports: "sports",
    business: "business",
    entertainment: "entertainment",
  };
  return map[category.toLowerCase()] || category.toLowerCase();
}

async function loadNews(reset = false) {
  try {
    showLoading();

    if (reset) {
      allArticles = [];
      newsContainer.innerHTML = "";
    }

    const params = new URLSearchParams();
    params.append("page", currentPage);

    if (currentQuery) {
      params.append("q", currentQuery);
    }

    if (currentCategory) {
      params.append("category", currentCategory);
    }

    const response = await fetch(`/news?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch news");
    }

    const articles = Array.isArray(data.articles) ? data.articles : [];

    if (reset) {
      allArticles = [...articles];
    } else {
      allArticles = [...allArticles, ...articles];
    }

    renderArticles(allArticles);

    if (articles.length === 0 && currentPage === 1) {
      newsContainer.innerHTML = `<p style="text-align:center;">No news found.</p>`;
      loadMoreBox.style.display = "none";
    } else {
      loadMoreBox.style.display = articles.length > 0 ? "block" : "none";
    }

    actionBar.style.display = "none";
  } catch (error) {
    console.error("Load news error:", error);
    newsContainer.innerHTML = `<p style="text-align:center; color:red;">Error loading news 😔</p>`;
    loadMoreBox.style.display = "block";
  }
}

function renderArticles(articles) {
  newsContainer.innerHTML = "";

  articles.forEach((article, index) => {
    const card = document.createElement("div");
    card.className = "news-card";

    const image = article.urlToImage
      ? `<img src="${escapeHtml(article.urlToImage)}" alt="news image" class="news-image" onerror="this.style.display='none'">`
      : "";

    const sourceName = article.source?.name || "Unknown Source";
    const description = article.description || "No description available.";
    const content = article.content || description;
    const title = article.title || "No title";
    const publishedAt = article.publishedAt
      ? new Date(article.publishedAt).toLocaleString()
      : "Unknown date";

    card.innerHTML = `
      ${image}
      <div class="news-content">
        <h3 class="news-title">${escapeHtml(title)}</h3>
        <p class="news-meta"><strong>Source:</strong> ${escapeHtml(sourceName)}</p>
        <p class="news-meta"><strong>Date:</strong> ${escapeHtml(publishedAt)}</p>
        <p class="news-desc">${escapeHtml(description)}</p>

        <div class="news-actions">
          <a class="read-more-btn" href="${escapeHtml(article.url || "#")}" target="_blank" rel="noopener noreferrer">Read More</a>
          <button class="save-btn" data-index="${index}">Save</button>
          <button class="summary-btn" data-index="${index}">AI Summary</button>
        </div>

        <div class="summary-box" id="summary-${index}" style="display:none;"></div>
      </div>
    `;

    newsContainer.appendChild(card);
  });

  attachCardEvents(articles);
}

function attachCardEvents(articles) {
  const saveButtons = document.querySelectorAll(".save-btn");
  const summaryButtons = document.querySelectorAll(".summary-btn");

  saveButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      saveArticle(articles[index]);
    });
  });

  summaryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      toggleSummary(index, articles[index]);
    });
  });
}

function saveArticle(article) {
  const saved = JSON.parse(localStorage.getItem("savedNews")) || [];

  const alreadySaved = saved.some(
    (item) => item.title === article.title && item.url === article.url
  );

  if (alreadySaved) {
    showToast("This article is already saved.");
    return;
  }

  saved.push(article);
  localStorage.setItem("savedNews", JSON.stringify(saved));
  showToast("Article saved successfully.");
}

function renderSavedNews() {
  const saved = JSON.parse(localStorage.getItem("savedNews")) || [];
  actionBar.style.display = "block";

  if (saved.length === 0) {
    newsContainer.innerHTML = `<p style="text-align:center;">No saved news yet.</p>`;
    loadMoreBox.style.display = "none";
    return;
  }

  renderArticles(saved);
  loadMoreBox.style.display = "none";
}

function goHome() {
  showingSavedNews = false;
  currentPage = 1;
  currentQuery = "";
  currentCategory = "";
  if (searchInput) searchInput.value = "";
  actionBar.style.display = "none";
  loadNews(true);
}

function loadMoreNews() {
  if (showingSavedNews) return;
  currentPage += 1;
  loadNews(false);
}

function toggleSummary(index, article) {
  const box = document.getElementById(`summary-${index}`);
  if (!box) return;

  if (box.style.display === "none") {
    box.innerHTML = `
      <strong>Summary:</strong>
      <p>${escapeHtml(generateSimpleSummary(article))}</p>
    `;
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function generateSimpleSummary(article) {
  const text =
    article.description ||
    article.content ||
    "No summary available for this article.";

  const cleanText = text.replace(/\s+/g, " ").trim();

  if (cleanText.length <= 180) return cleanText;
  return cleanText.slice(0, 180) + "...";
}

function showLoading() {
  newsContainer.innerHTML = `<p style="text-align:center;">Loading news...</p>`;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.goHome = goHome;
window.loadMoreNews = loadMoreNews;