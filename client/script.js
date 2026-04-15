let category = "";
let currentPage = 1;
let currentView = "home";

// FETCH NEWS
async function fetchNews(append = false) {
  const query = document.getElementById("search").value.trim() || category || "";
  const newsContainer = document.getElementById("news-container");
  const loadMoreBox = document.getElementById("loadMoreBox");
  const actionBar = document.getElementById("actionBar");

  currentView = "home";
  loadMoreBox.style.display = "block";
  actionBar.style.display = "none";

  if (!append) {
    newsContainer.innerHTML = "<p style='text-align:center;'>Loading...</p>";
  }

  try {
    const res = await fetch(
      `http://localhost:5000/news?q=${encodeURIComponent(query)}&page=${currentPage}&t=${Date.now()}`
    );
    const data = await res.json();

    if (!append) {
      newsContainer.innerHTML = "";
    }

    if (!data.articles || data.articles.length === 0) {
      if (!append) {
        newsContainer.innerHTML = "<p style='text-align:center;'>No news found 😢</p>";
      }
      return;
    }

    data.articles.forEach((article) => {
      newsContainer.appendChild(createNewsCard(article, false));
    });
  } catch (error) {
    console.log("Error:", error);
    if (!append) {
      newsContainer.innerHTML =
        "<p style='text-align:center; color:red;'>Error loading news 😢</p>";
    }
  }
}

// CREATE CARD
function createNewsCard(article, isSavedView = false) {
  const card = document.createElement("div");
  card.classList.add("card");

  card.innerHTML = `
    <a href="${article.url}">
      <img
        class="news-image"
        src="${article.urlToImage || "https://via.placeholder.com/300x180"}"
        alt="news image"
      />
    </a>

    <h2>
      <a href="${article.url}" class="title-link">
        ${article.title || "No title available"}
      </a>
    </h2>

    <p>
      ${
        article.description
          ? article.description.slice(0, 100)
          : "No description available"
      }
    </p>

    <div class="btn-container">
      <a href="${article.url}" class="read-btn">Read More</a>
      ${
        isSavedView
          ? `<button class="save-btn remove-btn">Remove</button>`
          : `<button class="save-btn">Save</button>`
      }
      <button class="ai-btn">✨ AI Summary</button>
    </div>

    <p class="summary" style="display: none;"></p>
  `;

  const summaryBox = card.querySelector(".summary");
  const aiBtn = card.querySelector(".ai-btn");

  aiBtn.addEventListener("click", () => {
    if (summaryBox.style.display === "block") {
      summaryBox.style.display = "none";
      summaryBox.innerHTML = "";
      return;
    }

    const fakeSummary =
      (
        article.description ||
        article.content ||
        article.title ||
        "No content available"
      )
        .replace(/\[\+\d+\schars\]/g, "")
        .slice(0, 120) + "...";

    summaryBox.style.display = "block";
    summaryBox.innerHTML = "<strong>AI Summary:</strong> " + fakeSummary;
  });

  if (isSavedView) {
    const removeBtn = card.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => removeArticle(article.url));
  } else {
    const saveBtn = card.querySelector(".save-btn");
    saveBtn.addEventListener("click", () => saveArticle(article));
  }

  return card;
}

// SEARCH
function searchNews() {
  currentPage = 1;
  category = "";
  fetchNews(false);
}

// CATEGORY FILTER
function setCategory(cat) {
  category = cat;
  document.getElementById("search").value = cat;
  currentPage = 1;
  fetchNews(false);
}

// LOAD MORE
function loadMoreNews() {
  currentPage++;
  fetchNews(true);
}

// SAVE ARTICLE
function saveArticle(article) {
  let saved = JSON.parse(localStorage.getItem("savedNews")) || [];

  if (!saved.some((item) => item.url === article.url)) {
    saved.push(article);
    localStorage.setItem("savedNews", JSON.stringify(saved));
    showToast("Saved successfully ✅");
  } else {
    showToast("Already saved ⚠️");
  }
}

// LOAD SAVED NEWS
function loadSavedNews() {
  const newsContainer = document.getElementById("news-container");
  const saved = JSON.parse(localStorage.getItem("savedNews")) || [];
  const loadMoreBox = document.getElementById("loadMoreBox");
  const actionBar = document.getElementById("actionBar");

  currentView = "saved";
  newsContainer.innerHTML = "";
  loadMoreBox.style.display = "none";
  actionBar.style.display = "block";

  if (saved.length === 0) {
    newsContainer.innerHTML =
      "<p style='text-align:center;'>No saved articles 😢</p>";
    return;
  }

  saved.forEach((article) => {
    newsContainer.appendChild(createNewsCard(article, true));
  });
}

// REMOVE ARTICLE
function removeArticle(url) {
  let saved = JSON.parse(localStorage.getItem("savedNews")) || [];
  saved = saved.filter((article) => article.url !== url);
  localStorage.setItem("savedNews", JSON.stringify(saved));
  showToast("Removed successfully ❌");
  loadSavedNews();
}

// BACK TO HOME
function goHome() {
  document.getElementById("search").value = "";
  category = "";
  currentPage = 1;
  fetchNews(false);
}

// DARK MODE
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  const darkModeBtn = document.getElementById("darkModeBtn");
  const isDark = document.body.classList.contains("dark-mode");

  if (isDark) {
    localStorage.setItem("darkMode", "enabled");
    darkModeBtn.innerText = "☀️ Light Mode";
  } else {
    localStorage.setItem("darkMode", "disabled");
    darkModeBtn.innerText = "🌙 Dark Mode";
  }
}

// TOAST
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// AUTO LOAD
window.onload = () => {
  document.getElementById("search").value = "";
  category = "";
  currentPage = 1;
  fetchNews(false);

  const darkModeBtn = document.getElementById("darkModeBtn");

  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeBtn.innerText = "☀️ Light Mode";
  } else {
    darkModeBtn.innerText = "🌙 Dark Mode";
  }
};