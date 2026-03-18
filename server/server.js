require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

/* middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* serve static files */
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

/* API routes */
const newsRoutes = require("./routes/news");
const adminRoutes = require("./routes/admin");

app.use("/api/news", newsRoutes);
// Mount admin routes under /api to support /api/rss/fetch, /api/notifications, etc.
app.use("/api", adminRoutes);


/* health check (important for Render) */
app.get("/", (req, res) => {
  res.send("PrimeReport API is running 🚀");
});

/* server port */
const PORT = process.env.PORT || 3000;

/* start server */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});