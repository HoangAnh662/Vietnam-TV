const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
app.use("/logos", express.static(path.join(__dirname, "logos")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const groupColors = {
  VTV: "1565C0",
  ON: "8E24AA",
  HTV: "00897B",
  HTVC: "00897B",
  SCTV: "D32F2F",
  Phim: "455A64"
};

function makeLogo(name, group) {
  const color = groupColors[group] || "455A64";
  return `https://placehold.co/500x500/${color}/FFFFFF.png?text=${encodeURIComponent(name)}`;
}

app.get("/", (req, res) => {
  res.send("Vietnam TV Server đang hoạt động");
});

app.get("/playlist.m3u", (req, res) => {
  const filePath = path.join(__dirname, "playlist.m3u");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Không đọc được playlist");
    }

    const lines = data.split(/\r?\n/);

    const result = lines.map((line) => {
      if (!line.startsWith("#EXTINF:")) {
        return line;
      }

      // Có logo rồi -> giữ nguyên
      if (/tvg-logo\s*=\s*["'][^"']+["']/i.test(line)) {
        return line;
      }

      const commaIndex = line.lastIndexOf(",");
      if (commaIndex === -1) {
        return line;
      }

      const channelName = line.substring(commaIndex + 1).trim();

      const groupMatch = line.match(
        /group-title\s*=\s*["']([^"']+)["']/i
      );

      const group = groupMatch ? groupMatch[1].trim() : "";
      const logo = makeLogo(channelName, group);

      return line.replace(
        "#EXTINF:",
        `#EXTINF: tvg-logo="${logo}" `
      );
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.apple.mpegurl"
    );

    res.setHeader(
      "Content-Disposition",
      'inline; filename="playlist.m3u"'
    );

    res.send(result.join("\n"));
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Vietnam TV Server running on port ${PORT}`);
});
