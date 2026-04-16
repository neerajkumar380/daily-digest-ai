const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const NEWS_API_KEY = process.env.NEWS_API_KEY || "YOUR_NEWS_API_KEY";

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

// Home route - frontend khol dega
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// News API route
app.get("/news", async (req, res) => {
  try {
    const query = req.query.q?.trim();
    const page = parseInt(req.query.page) || 1;

    let response;

    // Homepage ke liye fresh headlines
    if (!query || query === "") {
      response = await axios.get("https://newsapi.org/v2/top-headlines", {
        params: {
          country: "us",
          pageSize: 12,
          page: page,
        },
        headers: {
          "X-Api-Key": NEWS_API_KEY,
        },
      });
    } else {
      // Search ke liye latest matching news
      response = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: query,
          sortBy: "publishedAt",
          language: "en",
          pageSize: 12,
          page: page,
        },
        headers: {
          "X-Api-Key": NEWS_API_KEY,
        },
      });
    }

    const filteredArticles = response.data.articles.filter(
      (article) => article.title && article.url
    );

    res.json({
      articles: filteredArticles,
    });
  } catch (error) {
    console.log("News API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Error fetching news" });
  }
});

// Fallback route (important for deploy)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});