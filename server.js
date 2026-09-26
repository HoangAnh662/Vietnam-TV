const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Logo
app.use("/logos", express.static(path.join(__dirname, "logos")));

// Trang kiểm tra
app.get("/", (req, res) => {
  res.send("Vietnam TV Server đang hoạt động");
});

// Playlist
app.get("/playlist.m3u", (req, res) => {
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader(
    "Content-Disposition",
    'inline; filename="playlist.m3u"'
  );

  res.sendFile(path.join(__dirname, "playlist.m3u"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Vietnam TV Server running on port ${PORT}`);
});
