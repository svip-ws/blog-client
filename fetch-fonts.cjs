const fs = require("fs"), https = require("https"), path = require("path");
const dir = path.join(__dirname, "public", "fonts");
let css = fs.readFileSync(path.join(dir, "fonts.css"), "utf8");

function get(url, dest) {
  return new Promise((res, rej) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return res();
    const f = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120" } }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        f.close(); try { fs.unlinkSync(dest); } catch (e) {}
        return get(new URL(r.headers.location, url).toString(), dest).then(res, rej);
      }
      r.pipe(f); f.on("finish", () => f.close(() => res()));
    }).on("error", rej);
  });
}

const blockRe = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]+)}/g;
let m, jobs = [], count = 0;
while ((m = blockRe.exec(css))) {
  const subset = m[1], body = m[2];
  const fam = (body.match(/font-family:\s*'([^']+)'/) || [])[1] || "font";
  const w = (body.match(/font-weight:\s*(\d+)/) || [])[1] || "400";
  const url = (body.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
  if (!url) continue;
  const slug = fam.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const fname = `${slug}-${w}-${subset}.woff2`;
  css = css.split(url).join(`/fonts/${fname}`);
  jobs.push(get(url, path.join(dir, fname)).then(() => { count++; }));
}

(async () => {
  await Promise.all(jobs);
  fs.writeFileSync(path.join(dir, "fonts-local.css"), css);
  console.log("下载 woff2:", count, "个；已生成 fonts-local.css（URL 已本地化）");
})().catch((e) => { console.error(e); process.exit(1); });
