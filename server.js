const fs = require("fs");
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
app.get("/auto-logo/:name", (req, res) => {
  const name = decodeURIComponent(req.params.name || "TV").trim();
  const upper = name.toUpperCase();

  // Màu theo từng nhóm
  let bg = "#607D8B";

  if (upper.startsWith("VTV")) bg = "#E53935";
  else if (upper.startsWith("VTC")) bg = "#1565C0";
  else if (upper.startsWith("HTVC")) bg = "#00897B";
  else if (upper.startsWith("HTV")) bg = "#F9A825";
  else if (upper.startsWith("SCTV")) bg = "#7E57C2";
  else if (upper.startsWith("ON")) bg = "#D81B60";
  else if (upper.startsWith("K+")) bg = "#43A047";
  else if (upper.startsWith("TV360")) bg = "#1976D2";

  // Chia tên thành các dòng
  const words = name.split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? line + " " + word : word;

    if (test.length > 12 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) lines.push(line);

  // Tối đa 3 dòng
  const finalLines = lines.slice(0, 3);

  // Tự chỉnh cỡ chữ
  const longest = Math.max(...finalLines.map(x => x.length));

  let fontSize = 62;
  if (longest > 8) fontSize = 50;
  if (longest > 11) fontSize = 40;
  if (longest > 15) fontSize = 32;

  const lineHeight = fontSize + 12;
  const totalHeight = finalLines.length * lineHeight;
  const startY = (300 - totalHeight) / 2 + fontSize;

  const textSvg = finalLines.map((line, i) => `
    <text
      x="150"
      y="${startY + i * lineHeight}"
      text-anchor="middle"
      font-family="Arial,sans-serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="white">${escapeXml(line)}</text>
  `).join("");

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="300"
       height="300"
       viewBox="0 0 300 300">

    <rect
      width="300"
      height="300"
      rx="35"
      fill="${bg}"/>

    ${textSvg}
  </svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(svg);
});

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
// Trang kiểm tra
app.get("/", (req, res) => {
  res.send("Vietnam TV Server đang hoạt động");
});

// Playlist - tự thêm logo cho kênh chưa có logo
app.get("/playlist.m3u", (req, res) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.apple.mpegurl"
  );

  res.setHeader(
    "Content-Disposition",
    'inline; filename="playlist.m3u"'
  );

  const playlistPath = path.join(__dirname, "playlist.m3u");

  fs.readFile(playlistPath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Không đọc được playlist");
    }

    const host = `${req.protocol}://${req.get("host")}`;

    const lines = data.split(/\r?\n/);

    const result = lines.map(line => {
      if (!line.startsWith("#EXTINF:")) {
        return line;
      }

      // Nếu đã có logo thật thì giữ nguyên
      if (/tvg-logo\s*=\s*"[^"]+"/i.test(line)) {
        return line;
      }

      // Lấy tên kênh sau dấu phẩy cuối
      const comma = line.lastIndexOf(",");
      if (comma === -1) {
        return line;
      }

      const channelName = line
        .substring(comma + 1)
        .trim();

      if (!channelName) {
        return line;
      }

      const logo =
  `${host}/auto-logo/${encodeURIComponent(channelName)}?v=2`;

      return (
        line.substring(0, comma) +
        ` tvg-logo="${logo}"` +
        line.substring(comma)
      );
    });

    res.send(result.join("\n"));
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Vietnam TV Server running on port ${PORT}`);
});
