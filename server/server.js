const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// Yahan apni real News API key daal
const NEWS_API_KEY = "06c7c1971c5c49d38053e6949c8f8fb2";

// Home route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// News route
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

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});