const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "public", "fonts");
let css = fs.readFileSync(path.join(dir, "fonts.css"), "utf8");
const keep = new Set(["latin", "latin-ext"]);
const blockRe = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{[^}]+}\n?/g;
const removed = [];
const out = css.replace(blockRe, (blk, subset) => {
  if (keep.has(subset)) return blk;
  const u = (blk.match(/url\(\/fonts\/([^)]+)\)/) || [])[1];
  if (u) removed.push(u);
  return "";
});
removed.forEach((f) => { try { fs.unlinkSync(path.join(dir, f)); } catch (e) {} });
fs.writeFileSync(path.join(dir, "fonts.css"), out);
console.log("删除多余子集 woff2:", removed.length, "个；仅保留 latin / latin-ext");
