const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 HEALTH CHECK (IMPORTANT)
app.get("/", (req, res) => {
  res.send("PrimeReport API Running ✅");
});

// 🔥 SAFE NEWS API
app.get("/api/news", async (req, res) => {
  try {
    const data = require("./data/feeds.json"); // or your source
    res.json(data);
  } catch (error) {
    console.error("NEWS ERROR:", error);
    res.status(500).json({ error: "Failed to load news" });
  }
});

// 🔥 CATEGORY API
app.get("/api/category/:name", (req, res) => {
  try {
    const category = req.params.name.toLowerCase();
    const data = require("./data/feeds.json");

    const filtered = data.filter(
      item => item.category?.toLowerCase() === category
    );

    res.json(filtered);
  } catch (err) {
    console.error("CATEGORY ERROR:", err);
    res.status(500).json({ error: "Category failed" });
  }
});

// 🔥 ARTICLE API
app.get("/api/article/:slug", (req, res) => {
  try {
    const slug = req.params.slug;
    const data = require("./data/feeds.json");

    const article = data.find(item => item.slug === slug);

    if (!article) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(article);
  } catch (err) {
    console.error("ARTICLE ERROR:", err);
    res.status(500).json({ error: "Article failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});