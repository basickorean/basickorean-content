// 각 강의 폴더의 post.html → preview.html 생성 (로컬에서 더블클릭으로 확인용)
// 사용법: node scripts/preview.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const lessonsDir = path.join(root, "lessons");

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out = out.concat(walk(p));
    else if (f.name === "post.html") out.push(p);
  }
  return out;
}

for (const postPath of walk(lessonsDir)) {
  const dir = path.dirname(postPath);
  const rel = path.relative(dir, root).split(path.sep).join("/"); // 예: ../../..
  const body = fs.readFileSync(postPath, "utf8")
    .replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/[^@]+@main\//g, rel + "/"); // 로컬 미리보기는 로컬 파일 사용
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>미리보기 — ${path.basename(dir)} · Basic Korean</title>
<!-- 자동 생성 파일 (node scripts/preview.js) — 직접 수정 금지. Blogger 테마 head와 동일한 구성 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700;900&family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}/assets/bk.css">
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="${rel}/assets/bk.js"></script>
</head>
<body style="margin:0">
${body}
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, "preview.html"), html);
  console.log("✓", path.relative(root, path.join(dir, "preview.html")));
}
