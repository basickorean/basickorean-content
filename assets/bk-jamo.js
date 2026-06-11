/* bk-jamo.js — 한글 자모 부분 색칠 공용 유틸 (Basic Korean)
   ─────────────────────────────────────────────────────────────
   원리: 완성형 글자를 두 겹으로 그린다.
     1층 = 글자 전체(잉크색) / 2층 = 같은 글자를 색으로, clip-path로 자모 영역만 보이게.
   자모를 낱자(ㅇ,ㅓ,ㄱ…)로 따로 조합하면 폰트 균형이 깨지므로 반드시 이 방식을 쓴다.
   (P001 발음 강의에서 확립, 2026-06-11)

   ▸ 보정값은 Jua 폰트 기준. 글자 상자(1em) 비율 [x0,x1,y0,y1].
   ▸ 새 글자가 필요하면 REGIONS에 추가하고 브라우저에서 눈으로 보정한다.
     (SVG와 HTML은 상자 기준이 미세하게 달라 ±0.02 정도 조정이 필요할 수 있음)

   사용법 1 — HTML 선언형 (Blogger 본문):
     <span class="bk-jamo" data-ch="국" data-part="bat" data-color="coral"></span>
     <script src=".../bk-jamo.js"></script>   ← 로드되면 자동 스캔

   사용법 2 — JS:
     BKJamo.el("어", "on", "blue")            → DOM 노드 반환
     BKJamo.scan(루트요소)                     → .bk-jamo 일괄 변환

   data-part  : bat=받침, on=초성(왼쪽), top=세로조합 첫 자모 (REGIONS 키)
   data-color : coral | teal | tealdark | blue | pink | ink | 임의 CSS 색
   data-region: "x0,x1,y0,y1" — 사전에 없는 글자 즉석 지정용
*/
(function (global) {
  "use strict";

  var COLORS = {
    coral: "#e0726e",   // 어미·조사·타겟 (받침 이동 등)
    teal: "#3fa796",    // 품사·어간
    tealdark: "#2c8273",
    blue: "#3b82c4",    // 발음 표기
    pink: "#d56b86",    // ㅎ 탈락 등 보조
    ink: "#242a28"
  };

  /* 자모 영역 보정값 사전 — [x0, x1, y0, y1] (글자 상자 1em 비율)
     ※ P001에서 시각 검증 완료된 값. 새 항목은 검증 후 추가. */
  var REGIONS = {
    "국": { bat: [0, 1, 0.57, 1] },
    "어": { on:  [0, 0.56, 0, 1] },
    "거": { on:  [0, 0.54, 0, 1] },
    "얼": { bat: [0, 1, 0.52, 1] },
    "음": { top: [0, 1, 0, 0.38] },
    "름": { top: [0, 1, 0, 0.38] },
    "좋": { bat: [0, 1, 0.50, 1] },
    "아": { on:  [0, 0.54, 0, 1] }
  };

  function clipInset(r) { // [x0,x1,y0,y1] → inset(top right bottom left)
    return "inset(" + (r[2] * 100) + "% " + ((1 - r[1]) * 100) + "% " +
           ((1 - r[3]) * 100) + "% " + (r[0] * 100) + "%)";
  }

  function resolveRegion(ch, part, regionAttr) {
    if (regionAttr) {
      var r = regionAttr.split(",").map(Number);
      return r.length === 4 && r.every(function (v) { return !isNaN(v); }) ? r : null;
    }
    var d = REGIONS[ch];
    if (!d) return null;
    return d[part] || d[Object.keys(d)[0]] || null;
  }

  /* 글자 1개를 2겹(잉크 + 색 오버레이)으로 만든 노드 반환 */
  function el(ch, part, color, region) {
    var span = document.createElement("span");
    span.className = "bk-jamo";
    var r = resolveRegion(ch, part, region);
    if (!r) { span.textContent = ch; return span; } // 보정값 없으면 그냥 출력
    span.style.position = "relative";
    span.style.display = "inline-block";
    span.style.lineHeight = "1";

    var base = document.createElement("span");
    base.textContent = ch;
    base.style.display = "block";

    var ov = document.createElement("span");
    ov.textContent = ch;
    ov.setAttribute("aria-hidden", "true");
    ov.style.position = "absolute";
    ov.style.left = "0";
    ov.style.top = "0";
    ov.style.color = COLORS[color || "coral"] || color;
    ov.style.clipPath = clipInset(r);
    ov.style.webkitClipPath = clipInset(r);

    span.appendChild(base);
    span.appendChild(ov);
    return span;
  }

  /* .bk-jamo[data-ch] 요소 일괄 변환 */
  function scan(root) {
    var nodes = (root || document).querySelectorAll(".bk-jamo[data-ch]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.dataset.bkjDone) continue;
      var built = el(n.dataset.ch, n.dataset.part, n.dataset.color, n.dataset.region);
      n.dataset.bkjDone = "1";
      n.innerHTML = built.innerHTML;
      n.style.cssText += built.style.cssText;
    }
  }

  /* SVG용 마크업 생성 (애니메이션 프로토타입용)
     opts = {cx, y, F(폰트크기), id(고유), ink, fontFamily} */
  function svgMarkup(ch, part, color, opts) {
    var r = resolveRegion(ch, part, opts && opts.region);
    var cx = opts.cx, y = opts.y, F = opts.F, id = opts.id;
    var fam = (opts.fontFamily || "'Jua','Noto Sans KR',sans-serif");
    var ink = opts.ink || COLORS.ink;
    var col = COLORS[color || "coral"] || color;
    var t = function (fill, clip) {
      return '<text x="' + cx + '" y="' + y + '" font-size="' + F +
        '" text-anchor="middle" fill="' + fill + '" style="font-family:' + fam + '"' +
        (clip ? ' clip-path="url(#' + clip + ')"' : "") + ">" + ch + "</text>";
    };
    if (!r) return t(ink);
    var left = cx - F / 2, top = y - 0.82 * F;
    return '<clipPath id="' + id + '"><rect x="' + (left + r[0] * F) + '" y="' + (top + r[2] * F) +
      '" width="' + ((r[1] - r[0]) * F) + '" height="' + ((r[3] - r[2]) * F) + '"/></clipPath>' +
      t(ink) + t(col, id);
  }

  var BKJamo = { COLORS: COLORS, REGIONS: REGIONS, el: el, scan: scan, svgMarkup: svgMarkup, clipInset: clipInset };
  global.BKJamo = BKJamo;

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", function () { scan(); });
  else scan();
})(window);
