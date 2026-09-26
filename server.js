const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Cho phép app TV / IPTV truy cập
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Màu logo dự phòng theo từng nhóm
const groupColors = {
  VTV: "1565C0",    // xanh dương
  ON: "8E24AA",     // tím
  HTV: "00897B",    // xanh ngọc
  HTVC: "00897B",   // xanh ngọc
  SCTV: "D32F2F",   // đỏ
  Phim: "455A64"    // xanh xám
};

// Tạo link logo chữ
function makeLogo(name, group) {
  const color = groupColors[group] || "455A64";

  return `https://placehold.co/500x500/${color}/FFFFFF.png?text=${encodeURIComponent(name)}`;
}

// Trang kiểm tra server
app.get("/", (req, res) => {
  res.send("Vietnam TV Server đang hoạt động");
});

// Playlist chính
app.get("/playlist.m3u", (req, res) => {
  const filePath = path.join(__dirname, "playlist.m3u");

 
