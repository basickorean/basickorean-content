/* Basic Korean — 목록 렌더러 (bk-home.js)
   홈 · 라벨 페이지(/search/label/X) · 전체 글(/search)에서
   Blogger 피드(JSONP)를 읽어 카드 그리드를 그리고 기본 피드를 숨깁니다.
   - 홈: 추천 큰 카드 1 + 최근 강의 그리드 6 + "전체 글 보기"
   - 라벨/전체: 카드 12개씩 + "더 보기" 버튼
   실패 시 아무것도 하지 않아 기본 피드가 그대로 보입니다 (안전 폴백).
   시안: theme-mockup-home.html (2026-06-12) */
(function () {
  "use strict";
  var loc = window.location;
  var path = loc.pathname;
  var FORCE = !!window.BK_HOME_FORCE;

  /* 검색 결과(?q=)·과거 페이지(updated-max)는 기본 피드 유지 */
  if (!FORCE && (loc.search.indexOf("updated-max") > -1 || loc.search.indexOf("q=") > -1)) return;

  var isHome = FORCE || path === "/" || path === "" || path === "/index.html";
  var label = "";
  var m = /^\/search\/label\/([^/]+)\/?$/.exec(path);
  if (m) label = decodeURIComponent(m[1]);
  var isAll = path === "/search" || path === "/search/";
  if (!isHome && !label && !isAll) return;

  /* 깜빡임 방지: 첫 페인트 전에 기본 피드 숨김 (이 파일은 defer 없이 head에서 즉시 실행)
     렌더 실패·지연 시 클래스를 떼어 기본 피드로 복구 — 안전 폴백 유지 */
  document.documentElement.classList.add("bk-listpage");
  var rendered = false;
  function unhide() {
    if (!rendered) document.documentElement.classList.remove("bk-listpage");
  }
  setTimeout(unhide, 8000);

  var BATCH = isHome ? 7 : 12; /* 홈: 추천 1 + 그리드 6 */
  var start = 1, total = 0, shown = 0;

  var CATS = [
    { key: "Pronunciation", ko: "발음", en: "PRONUNCIATION", cls: "blue" },
    { key: "Grammar", ko: "문법", en: "GRAMMAR", cls: "coral" },
    { key: "Vocabulary", ko: "어휘", en: "VOCABULARY", cls: "teal" },
    { key: "Hangul", ko: "한글", en: "HANGUL", cls: "pink" }
  ];
  var LABEL_KO = {
    Hangul: "한글 강의", Grammar: "문법 강의", Vocabulary: "어휘 강의",
    Pronunciation: "발음 강의", "Pronunciation-EN": "발음 강의 · EN",
    "in Korean": "한국어 글", "in English": "English Posts"
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function upscale(u) {
    return u
      .replace(/\/s\d{2,4}(-c)?\//, "/w640-h360-c/")
      .replace(/=s\d{2,4}(-c)?[-\w]*$/, "=w640-h360-c");
  }
  function firstImg(html) {
    var mm = /<img[^>]+src=["']([^"']+)["']/i.exec(html || "");
    return mm ? mm[1] : "";
  }
  function parse(entry) {
    var labels = [], i;
    (entry.category || []).forEach(function (c) { labels.push(c.term); });
    var url = "";
    (entry.link || []).forEach(function (l) { if (l.rel === "alternate") url = l.href; });

    var cat = null;
    for (i = 0; i < CATS.length && !cat; i++) {
      if (labels.indexOf(CATS[i].key) > -1 || labels.indexOf(CATS[i].key + "-EN") > -1 ||
        labels.indexOf(CATS[i].ko) > -1) cat = CATS[i];
    }
    var code = "";
    labels.forEach(function (t) { if (/^[A-Z]\d{3}$/.test(t)) code = t; });
    var en = labels.indexOf("in English") > -1;

    var pill = "POST";
    if (cat) {
      var num = code ? String(parseInt(code.slice(1), 10)) : "";
      if (num.length === 1) num = "0" + num;
      pill = cat.en + (en ? " · EN" : (num ? " · " + cat.ko + " " + num : ""));
    }

    var thumb = entry.media$thumbnail ? entry.media$thumbnail.url : "";
    if (!thumb) thumb = firstImg(entry.content && entry.content.$t);
    if (thumb) {
      thumb = upscale(thumb);
      if (thumb.indexOf("//") === 0) thumb = "https:" + thumb;
    }

    return {
      title: (entry.title.$t || "").replace(/\s*\|\s*Basic Korean\s*$/, ""),
      url: url, pill: pill, cls: cat ? cat.cls : "teal",
      thumb: thumb, ph: code || (cat ? cat.ko : "Basic Korean")
    };
  }
  function imgHtml(p) {
    return p.thumb
      ? '<img loading="lazy" src="' + esc(p.thumb) + '" alt=""/>'
      : '<span class="bk-noimg">' + esc(p.ph) + "</span>";
  }
  function card(p) {
    return '<a class="bk-card" href="' + esc(p.url) + '">' +
      '<span class="bk-cimg">' + imgHtml(p) + "</span>" +
      '<span class="bk-cbody"><span class="bk-pill ' + p.cls + '">' + esc(p.pill) + "</span>" +
      "<h3>" + esc(p.title) + "</h3></span></a>";
  }
  function featHtml(p) {
    return '<a class="bk-feat" href="' + esc(p.url) + '">' +
      '<span class="bk-fimg">' + imgHtml(p) + "</span>" +
      '<span class="bk-fbody"><span class="bk-pill ' + p.cls + '">' + esc(p.pill) + "</span>" +
      "<h2>" + esc(p.title) + "</h2>" +
      '<span class="bk-more">강의 보기 →</span></span></a>';
  }
  function headTitle() {
    if (isHome) return "● 최근 강의";
    if (label) return "● " + (LABEL_KO[label] || label);
    return "● 전체 글";
  }
  function feedUrl() {
    var base = "https://www.basickorean.com/feeds/posts/default";
    if (label) base += "/-/" + encodeURIComponent(label);
    return base + "?alt=json-in-script&start-index=" + start + "&max-results=" + BATCH + "&callback=__bkHome";
  }

  var box = null;
  function ensureBox() {
    if (box) return;
    box = document.createElement("div");
    box.id = "bk-home";
    var feedEl = document.querySelector(".blog-posts");
    if (feedEl && feedEl.parentNode) feedEl.parentNode.insertBefore(box, feedEl);
    else document.body.appendChild(box);
  }
  function updateMore() {
    var wrap = document.getElementById("bk-morewrap");
    if (!wrap) return;
    if (isHome) {
      wrap.innerHTML = '<a class="bk-all" href="/search">전체 글 보기 →</a>';
      return;
    }
    if (shown < total) {
      wrap.innerHTML = '<a class="bk-all" href="#" id="bk-morebtn">더 보기 (' + shown + "/" + total + ")</a>";
      var btn = document.getElementById("bk-morebtn");
      btn.onclick = function (e) { e.preventDefault(); btn.textContent = "불러오는 중…"; load(); };
    } else {
      wrap.innerHTML = "";
    }
  }
  function render(json) {
    /* 본문(body)이 아직 파싱 중이면 끝난 뒤 다시 시도 */
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { render(json); });
      return;
    }
    var f = json && json.feed;
    var entries = (f && f.entry) || [];
    if (f && f.openSearch$totalResults) total = parseInt(f.openSearch$totalResults.$t, 10) || 0;
    if (!entries.length && shown === 0) { unhide(); return; } /* 폴백: 기본 피드 복구 */

    var posts = [];
    for (var i = 0; i < entries.length; i++) posts.push(parse(entries[i]));

    ensureBox();
    if (shown === 0) {
      var html = "";
      if (isHome && posts.length) html += featHtml(posts.shift());
      html += '<div class="bk-gridhead">' + esc(headTitle()) + "</div>" +
        '<div class="bk-cards" id="bk-grid"></div>' +
        '<div class="bk-allwrap" id="bk-morewrap"></div>';
      box.innerHTML = html;
      document.body.classList.add("bk-homeready");
    }
    var grid = document.getElementById("bk-grid");
    var cardsHtml = "";
    for (var j = 0; j < posts.length; j++) cardsHtml += card(posts[j]);
    grid.insertAdjacentHTML("beforeend", cardsHtml);

    rendered = true;
    shown += entries.length;
    start += entries.length;
    updateMore();
  }

  window.__bkHome = render;
  function load() {
    var s = document.createElement("script");
    s.src = feedUrl();
    s.async = true;
    s.onerror = unhide;
    (document.head || document.body).appendChild(s);
  }
  load(); /* 즉시 요청 — 파싱과 병렬로 데이터 수신 */
})();
