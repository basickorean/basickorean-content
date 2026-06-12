/* Basic Korean — 카테고리 메뉴 자동 삽입 (bk-nav.js)
   헤더 바로 아래에 홈/한글/문법/어휘/발음 메뉴 바를 넣습니다.
   각 항목은 라벨 검색으로 연결 (포스트에 같은 이름의 라벨을 지정해야 글이 나옵니다). */
(function () {
  "use strict";
  var ITEMS = [
    { k: "홈", e: "Home", href: "/" },
    { k: "한글", e: "Hangul", href: "/search/label/Hangul" },
    { k: "문법", e: "Grammar", href: "/search/label/Grammar" },
    { k: "어휘", e: "Vocabulary", href: "/search/label/Vocabulary" },
    { k: "발음", e: "Pronunciation", href: "/search/label/Pronunciation" }
  ];
  function current(href) {
    var p = decodeURIComponent(window.location.pathname);
    if (href === "/") return p === "/" || p === "";
    return p.indexOf(href.replace("/search/label/", "/search/label/")) === 0 && p.indexOf("/search/label/") === 0 &&
      p.split("/search/label/")[1] === href.split("/search/label/")[1];
  }
  function build() {
    /* 홈 전용 스타일 키 (예: '최근 강의' 섹션 제목) */
    var path = window.location.pathname;
    if (path === "/" || path === "" || path === "/index.html") document.body.classList.add("bk-home");
    if (document.getElementById("bk-nav")) return;
    var nav = document.createElement("nav");
    nav.id = "bk-nav";
    nav.setAttribute("aria-label", "categories");
    var html = '<div class="bk-nav-in">';
    for (var i = 0; i < ITEMS.length; i++) {
      var it = ITEMS[i];
      html += '<a class="bk-nav-a' + (current(it.href) ? " on" : "") + '" href="' + it.href + '">' +
        '<span class="k">' + it.k + '</span><span class="e">' + it.e + "</span></a>";
    }
    html += "</div>";
    nav.innerHTML = html;
    var anchor =
      document.querySelector(".centered-top-container") ||
      document.querySelector(".centered-top-placeholder") ||
      document.querySelector("header") ||
      document.body.firstElementChild;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(nav, anchor.nextSibling);
    else document.body.insertBefore(nav, document.body.firstChild);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
