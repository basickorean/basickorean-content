/* Basic Korean — 홈 렌더러 (bk-home.js)
   홈(첫 페이지)에서만: Blogger 피드(JSONP)를 읽어
   [추천 큰 카드 + 최근 강의 카드 그리드]를 그리고 기본 피드를 숨깁니다.
   실패 시 아무것도 하지 않아 기본 피드가 그대로 보입니다 (안전 폴백).
   시안: theme-mockup-home.html (2026-06-12) */
(function () {
  "use strict";
  var path = window.location.pathname;
  var isHome = !!window.BK_HOME_FORCE ||
    ((path === "/" || path === "" || path === "/index.html") &&
      window.location.search.indexOf("updated-max") === -1);
  if (!isHome) return;

  var MAX = 7; /* 추천 1 + 그리드 6 */

  var CATS = [
    { key: "Pronunciation", ko: "발음", en: "PRONUNCIATION", cls: "blue" },
    { key: "Grammar", ko: "문법", en: "GRAMMAR", cls: "coral" },
    { key: "Vocabulary", ko: "어휘", en: "VOCABULARY", cls: "teal" },
    { key: "Hangul", ko: "한글", en: "HANGUL", cls: "pink" }
  ];

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
    var m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || "");
    return m ? m[1] : "";
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

    var snip = entry.summary ? entry.summary.$t :
      (entry.content ? entry.content.$t.replace(/<[^>]*>/g, " ") : "");
    snip = snip.replace(/\s+/g, " ").trim();
    if (snip.length > 120) snip = snip.slice(0, 120) + "…";

    return {
      title: (entry.title.$t || "").replace(/\s*\|\s*Basic Korean\s*$/, ""),
      url: url, pill: pill, cls: cat ? cat.cls : "teal",
      thumb: thumb, snip: snip, ph: code || (cat ? cat.ko : "Basic Korean")
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
  function render(json) {
    var entries = (json && json.feed && json.feed.entry) || [];
    if (!entries.length) return;
    if (document.getElementById("bk-home")) return;
    var posts = [];
    for (var i = 0; i < entries.length; i++) posts.push(parse(entries[i]));
    var feat = posts[0], rest = posts.slice(1);

    var html =
      '<a class="bk-feat" href="' + esc(feat.url) + '">' +
      '<span class="bk-fimg">' + imgHtml(feat) + "</span>" +
      '<span class="bk-fbody"><span class="bk-pill ' + feat.cls + '">' + esc(feat.pill) + "</span>" +
      "<h2>" + esc(feat.title) + "</h2>" +
      '<span class="bk-more">강의 보기 →</span></span></a>';
    if (rest.length) {
      html += '<div class="bk-gridhead">● 최근 강의</div><div class="bk-cards">';
      for (var j = 0; j < rest.length; j++) html += card(rest[j]);
      html += "</div>";
    }
    html += '<div class="bk-allwrap"><a class="bk-all" href="/search">전체 글 보기 →</a></div>';

    var box = document.createElement("div");
    box.id = "bk-home";
    box.innerHTML = html;
    var feedEl = document.querySelector(".blog-posts");
    if (feedEl && feedEl.parentNode) feedEl.parentNode.insertBefore(box, feedEl);
    else document.body.appendChild(box);
    document.body.classList.add("bk-homeready");
  }

  window.__bkHome = render;
  function load() {
    var s = document.createElement("script");
    s.src = "https://www.basickorean.com/feeds/posts/default?alt=json-in-script&max-results=" + MAX + "&callback=__bkHome";
    s.async = true;
    (document.head || document.body).appendChild(s);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
