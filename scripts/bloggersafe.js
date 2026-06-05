// post.html 의 <script> 안 특수문자(따옴표·이모지·화살표 등)를 \uXXXX 로 이스케이프
// → Blogger 편집기가 HTML 엔티티로 바꿔버리는 문제 방지. 한글은 그대로 둠.
// 사용법: node scripts/bloggersafe.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const lessonsDir = path.join(root, "lessons");

function keep(cp) {
  if (cp >= 0x09 && cp <= 0x7e) return true;                  // ASCII(개행 포함)
  if (cp >= 0xac00 && cp <= 0xd7a3) return true;              // 한글 음절
  if (cp >= 0x3130 && cp <= 0x318f) return true;              // 자모 (ㄴ, ㄹ 등)
  if (cp >= 0x1100 && cp <= 0x11ff) return true;              // 옛 자모
  return false;
}
function esc(str) {
  let out = "", n = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (keep(cp)) { out += ch; continue; }
    for (let i = 0; i < ch.length; i++)
      out += "\\u" + ch.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0");
    n++;
  }
  return [out, n];
}
function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out = out.concat(walk(p));
    else if (f.name === "post.html") out.push(p);
  }
  return out;
}
for (const p of walk(lessonsDir)) {
  const src = fs.readFileSync(p, "utf8");
  const fixed = src.replace(/(<script>)([\s\S]*?)(<\/script>)/g, (m, a, body, c) => {
    const [e, n] = esc(body);
    console.log("  ", path.relative(root, p), "—", n, "chars escaped");
    return a + e + c;
  });
  fs.writeFileSync(p, fixed);
}
console.log("done");
