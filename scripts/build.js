/* src/bk.jsx → assets/bk.js (JSX 사전 컴파일)
   사용법:  npm i @babel/standalone  후  node scripts/build.js  */
const fs = require("fs");
const path = require("path");
const Babel = require("@babel/standalone");

const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "src", "bk.jsx"), "utf8");
const out = Babel.transform(src, { presets: ["react"] }).code;

const header = `/* Basic Korean 공용 강의 엔진 — 자동 생성 파일 (직접 수정 금지!)
 * 소스: src/bk.jsx  ·  빌드: node scripts/build.js
 * 서빙: https://cdn.jsdelivr.net/gh/basickorean/basickorean-content@main/assets/bk.js */
`;
fs.writeFileSync(path.join(root, "assets", "bk.js"), header + out + "\n");
console.log("✓ assets/bk.js", out.length, "chars");
