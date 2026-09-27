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

    let bg = "#607D8B";

    if (upper.startsWith("VTV")) bg = "#E53935";
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

    if (current)
