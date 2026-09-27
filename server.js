const fs = require("fs");
const express = require("express");
const path = require("path");
const sharp = require("sharp");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Logo thật trong thư mục logos
app.use("/logos", express.static(path.join(__dirname, "logos")));

// ===============================
// TỰ TẠO LOGO PNG
// ===============================
app.get("/auto-logo/:name.png", async (req, res) => {
  try {
    const name = (req.params.name || "TV").trim();
    const upper = name.toUpperCase();
const group = (req.query.group || "").trim();
const upperGroup = group.toUpperCase();
    let bg = "#607D8B";

// Ưu tiên màu theo group-title
if (upperGroup.includes("ĐỊA PHƯƠNG")) {
  bg = "#00897B";
} else if (upperGroup.includes("VTV")) {
  bg = "#E53935";
} else if (upperGroup.includes("VTC")) {
  bg = "#1565C0";
} else if (upperGroup.includes("HTV")) {
  bg = "#F9A825";
} else if (upperGroup.includes("SCTV")) {
  bg = "#7E57C2";
} else if (upperGroup.includes("ON")) {
  bg = "#D81B60";
} else if (upperGroup.includes("K+")) {
  bg = "#43A047";
} else if (upperGroup.includes("TV360")) {
  bg = "#1976D2";
}

// Nếu playlist không có group-title thì nhận diện theo tên kênh
else if (upper.startsWith("VTV")) bg = "#E53935";
else if (upper.startsWith("VTC")) bg = "#1565C0";
else if (upper.startsWith("HTVC")) bg = "#00897B";
else if (upper.startsWith("HTV")) bg = "#F9A825";
else if (upper.startsWith("SCTV")) bg = "#7E57C2";
else if (upper.startsWith("ON")) bg = "#D81B60";
else if (upper.startsWith("K+")) bg = "#43A047";
else if (upper.startsWith("TV360")) bg = "#1976D2";

    // Chia tên thành tối đa 3 dòng
    const words = name.split(/\s+/);
    const lines = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;

      if (test.length > 12 && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }

    if (current) lines.push(current);

    const finalLines = lines.slice(0, 3);

    const longest = Math.max(
      1,
      ...finalLines.map(line => line.length)
    );

    let fontSize = 62;

    if (longest > 8) fontSize = 50;
    if (longest > 11) fontSize = 40;
    if (longest > 15) fontSize = 32;

    const lineHeight = fontSize + 12;
    const totalHeight = finalLines.length * lineHeight;
    const startY = (300 - totalHeight) / 2 + fontSize;

    const textSvg = finalLines
      .map(
        (line, i) => `
        <text
          x="150"
          y="${startY + i * lineHeight}"
          text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="#ffffff"
        >${escapeXml(line)}</text>`
      )
      .join("");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="300"
           height="300"
           viewBox="0 0 300 300">

        <rect
          width="300"
          height="300"
          rx="35"
          ry="35"
          fill="${bg}"
        />

        ${textSvg}
      </svg>
    `;

    // Chuyển SVG thành PNG thật
    const png = await sharp(
      Buffer.from(svg)
    )
      .png()
      .toBuffer();

    res.setHeader("Content-Type", "image/png");

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    res.send(png);

  } catch (err) {
    console.error(err);
    res.status(500).send("Không tạo được logo");
  }
});

function escapeXml(str) {
  return String(str)
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

// ===============================
// PLAYLIST
// ===============================
app.get("/playlist.m3u", (req, res) => {

  const playlistPath =
    path.join(__dirname, "playlist.m3u");

  fs.readFile(
    playlistPath,
    "utf8",
    (err, data) => {

      if (err) {
        console.error(err);

        return res
          .status(500)
          .send("Không đọc được playlist.m3u");
      }

      const host =
        `${req.protocol}://${req.get("host")}`;

      const lines = data.split(/\r?\n/);

      const result = lines.map(line => {

        if (!line.trim().startsWith("#EXTINF:")) {
          return line;
        }

        const comma = line.lastIndexOf(",");

        if (comma === -1) {
          return line;
        }

        const channelName =
          line.substring(comma + 1).trim();

        if (!channelName) {
          return line;
        }
const groupMatch = line.match(/group-title\s*=\s*"([^"]*)"/i);
const group = groupMatch ? groupMatch[1].trim() : "";

// Logo PNG + truyền group
const logo =
  `${host}/auto-logo/` +
  `${encodeURIComponent(channelName)}.png` +
  `?group=${encodeURIComponent(group)}&v=5`;
        
        // Logo thật đã có -> giữ nguyên
        if (/tvg-logo\s*=\s*"[^"]+"/i.test(line)) {
          return line;
        }

        // tvg-logo="" -> thay bằng logo PNG
        if (/tvg-logo\s*=\s*""/i.test(line)) {
          return line.replace(
            /tvg-logo\s*=\s*""/i,
            `tvg-logo="${logo}"`
          );
        }

        // Chưa có tvg-logo -> thêm vào
        return (
          line.substring(0, comma) +
          ` tvg-logo="${logo}"` +
          line.substring(comma)
        );
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl; charset=utf-8"
      );

      res.setHeader(
        "Content-Disposition",
        'inline; filename="playlist.m3u"'
      );

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );

      res.send(result.join("\n"));
    }
  );
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Vietnam TV Server running on port ${PORT}`
  );
});
