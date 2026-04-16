const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const MEDIASTACK_API_KEY = process.env.MEDIASTACK_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.get("/news", async (req, res) => {
  try {
    const query = (req.query.q || "").trim();
    const category = (req.query.category || "").trim().toLowerCase();
    const page = parseInt(req.query.page, 10) || 1;

    const limit = 10;
    const offset = (page - 1) * limit;

    const params = {
      access_key: MEDIASTACK_API_KEY,
      languages: "en",
      limit,
      offset,
      sort: "published_desc",
    };

    if (query) {
      params.keywords = query;
    }

    if (category) {
      params.categories = category;
    }

    const response = await axios.get("https://api.mediastack.com/v1/news", {
      params,
    });

    const articles = (response.data.data || []).map((article) => ({
      source: {
        id: null,
        name: article.source || "Unknown Source",
      },
      author: article.author || "Unknown",
      title: article.title || "No title",
      description: article.description || "No description available.",
      url: article.url || "#",
      urlToImage: article.image || "",
      publishedAt: article.published_at || "",
      content: article.description || "",
    }));

    res.json({ articles });
  } catch (error) {
    console.log(
      "Mediastack API Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Error fetching news" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});