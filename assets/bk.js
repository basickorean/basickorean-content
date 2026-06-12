/* Basic Korean 공용 강의 엔진 — 자동 생성 파일 (직접 수정 금지!)
 * 소스: src/bk.jsx  ·  빌드: node scripts/build.js
 * 서빙: https://cdn.jsdelivr.net/gh/basickorean/basickorean-content@main/assets/bk.js */
/* ==========================================================================
   Basic Korean — 공용 강의 엔진 (소스: src/bk.jsx)
   * 이 파일을 수정한 뒤 scripts/build.js 로 컴파일하면 assets/bk.js 가 됩니다.
   * 강의별 내용은 각 포스트의 window.BK_LESSON 객체로 주입됩니다.
   * 필요한 전역: React, ReactDOM (Blogger 테마 head에서 CDN 로드)
   ========================================================================== */
(function () {
  "use strict";

  if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
    console.error("[BK] React/ReactDOM이 로드되지 않았습니다. 테마 head를 확인하세요.");
    return;
  }
  const {
    useState,
    useEffect,
    useRef
  } = React;

  /* ---------- 한글 활용 엔진 (강의 스크립트에서 BK.hangul 로 사용) ---------- */
  const JONG = {
    N: 4,
    L: 8,
    SS: 20
  };
  function decompose(ch) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c >= 11172) return null;
    return {
      cho: Math.floor(c / 588),
      jung: Math.floor(c % 588 / 28),
      jong: c % 28
    };
  }
  const compose = (cho, jung, jong) => String.fromCharCode(0xac00 + cho * 588 + jung * 28 + (jong || 0));
  const stemOf = v => v.endsWith("다") ? v.slice(0, -1) : v;
  const IS_FILE = window.location.protocol === "file:";

  /* ---------- 공통 UI 문자열 (모든 강의에서 동일) ---------- */
  const UI = {
    ko: {
      rule: "조건",
      question: "문제",
      next: "다음 →",
      results: "결과 보기 🎉",
      welldone: "수고했어요! 틀린 문제는 아래에서 복습하세요.",
      reviewMiss: "틀린 문제 복습",
      best: (b, t) => `최고 기록: ${b}/${t}`,
      done: "학습 완료",
      revBanner: d => `${d}일 전에 이 문법을 배웠어요. 기억이 잘 나는지 복습 퀴즈로 확인해 볼까요?`,
      revBtn: "복습 퀴즈 →",
      clip: "영상에서 듣기",
      pdf: "PDF로 저장",
      fileNote: (mm, ss) => `클릭하면 유튜브에서 ${mm}:${ss}부터 재생 · opens on YouTube`,
      card: i => `연습 카드 ${i}`,
      cardShow: " — 정답 보기",
      cardHide: " — 정답 숨기기",
      pron: "발음 규칙 보기: ",
      pronTitle: "발음 규칙 보기"
    },
    en: {
      rule: "rule",
      question: "Question",
      next: "Next →",
      results: "See results 🎉",
      welldone: "Well done! Review any misses below.",
      reviewMiss: "Review your misses",
      best: (b, t) => `Best score: ${b}/${t}`,
      done: "Completed",
      revBanner: d => `You studied this ${d} days ago — quick review quiz?`,
      revBtn: "Review quiz →",
      clip: "Listen in the video",
      pdf: "Save as PDF",
      fileNote: (mm, ss) => `Opens on YouTube at ${mm}:${ss}`,
      card: i => `Practice card ${i}`,
      cardShow: " — reveal answer",
      cardHide: " — hide answer",
      pron: "Pronunciation rule: ",
      pronTitle: "See the pronunciation rule"
    }
  };
  const TAG_DEFAULT = {
    ko: {
      bo: "받침 O",
      bx: "받침 X",
      bl: "ㄹ 탈락",
      ir: "불규칙"
    },
    en: {
      bo: "has 받침",
      bx: "no 받침",
      bl: "drop ㄹ",
      ir: "irregular"
    }
  };
  function celebrate() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#f0883c", "#4fb89c", "#ec6aa6", "#f4d24c", "#57c08a"];
    for (let i = 0; i < 120; i++) {
      const d = document.createElement("div");
      d.className = "confetti";
      d.style.left = Math.random() * 100 + "vw";
      d.style.background = colors[i % colors.length];
      d.style.animation = `fall ${1.6 + Math.random() * 1.4}s ${Math.random() * 0.4}s ease-in forwards`;
      d.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 3400);
    }
  }

  /* ---------- 리치 텍스트: ["글 ", {b:"강조"}, " 글"] ---------- */
  function rich(parts) {
    return parts.map((p, i) => {
      if (typeof p === "string") return /*#__PURE__*/React.createElement(React.Fragment, {
        key: i
      }, p);
      if (p && p.b !== undefined) return /*#__PURE__*/React.createElement("b", {
        key: i
      }, p.b);
      return null;
    });
  }

  /* ---------- 미니 플레이어 (자막 타임스탬프 → 해당 초부터 재생) ---------- */
  function MiniPlayer({
    videoId,
    sec,
    onClose,
    label
  }) {
    if (sec === null) return null;
    const mm = Math.floor(sec / 60),
      ss = String(sec % 60).padStart(2, "0");
    return /*#__PURE__*/React.createElement("div", {
      className: "miniplayer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bar"
    }, /*#__PURE__*/React.createElement("span", null, "\u25B6 ", label, " \xB7 ", mm, ":", ss), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      title: "close"
    }, "\xD7")), IS_FILE ? /*#__PURE__*/React.createElement("a", {
      className: "vid vfallback",
      href: `https://youtu.be/${videoId}?t=${sec}`,
      target: "_blank",
      rel: "noreferrer"
    }, /*#__PURE__*/React.createElement("img", {
      src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      alt: "clip"
    }), /*#__PURE__*/React.createElement("span", {
      className: "playbig"
    }, "\u25B6")) : /*#__PURE__*/React.createElement("div", {
      className: "vid"
    }, /*#__PURE__*/React.createElement("iframe", {
      key: sec,
      src: `https://www.youtube.com/embed/${videoId}?start=${sec}&autoplay=1&rel=0`,
      allow: "autoplay; encrypted-media; picture-in-picture",
      allowFullScreen: true,
      title: "clip"
    })));
  }
  function VideoEmbed({
    videoId,
    title
  }) {
    if (!IS_FILE) return /*#__PURE__*/React.createElement("div", {
      className: "video"
    }, /*#__PURE__*/React.createElement("iframe", {
      src: `https://www.youtube.com/embed/${videoId}?rel=0`,
      title: title,
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      allowFullScreen: true
    }));
    return /*#__PURE__*/React.createElement("a", {
      className: "video vfallback",
      href: `https://youtu.be/${videoId}`,
      target: "_blank",
      rel: "noreferrer",
      title: title
    }, /*#__PURE__*/React.createElement("img", {
      src: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      alt: title
    }), /*#__PURE__*/React.createElement("span", {
      className: "playbig"
    }, "\u25B6"));
  }

  /* ---------- ② 대화 속에서 보기 ---------- */
  function Dialogue({
    d,
    lang,
    onPlay
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "dlg"
    }, /*#__PURE__*/React.createElement("span", {
      className: "tag " + d.cls
    }, d.tag), /*#__PURE__*/React.createElement("p", {
      className: "intro"
    }, d.intro), d.lines.map((ln, i) => /*#__PURE__*/React.createElement("div", {
      className: "bubble",
      key: i
    }, ln.t !== undefined && onPlay && /*#__PURE__*/React.createElement("button", {
      className: "playbtn",
      onClick: () => onPlay(ln.t),
      title: "\u25B6"
    }, "\u25B6"), /*#__PURE__*/React.createElement("span", {
      className: "who"
    }, ln.who), /*#__PURE__*/React.createElement("div", {
      className: "ko"
    }, rich(ln.ko)), lang === "en" && ln.en && /*#__PURE__*/React.createElement("div", {
      className: "en"
    }, ln.en))), /*#__PURE__*/React.createElement("div", {
      className: "formbox"
    }, /*#__PURE__*/React.createElement("span", {
      className: "big"
    }, d.form[0]), /*#__PURE__*/React.createElement("span", {
      className: "eq"
    }, d.form[1]), /*#__PURE__*/React.createElement("span", {
      className: "part"
    }, d.form[2]), /*#__PURE__*/React.createElement("span", {
      className: "eq"
    }, d.form[3]), /*#__PURE__*/React.createElement("span", {
      className: "part",
      style: {
        color: "var(--orange)"
      }
    }, d.form[4])), /*#__PURE__*/React.createElement("div", {
      className: "steps3"
    }, d.steps.map((s, i) => /*#__PURE__*/React.createElement("div", {
      className: "stepc",
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "n"
    }, i + 1), /*#__PURE__*/React.createElement("div", {
      className: "k " + s.cls
    }, s.k), /*#__PURE__*/React.createElement("div", {
      className: "v"
    }, rich(s.v))))), /*#__PURE__*/React.createElement("div", {
      className: "takeaway"
    }, rich(d.take)));
  }

  /* ---------- ④ 활용 만들기 ---------- */
  function Builder({
    L,
    t,
    lang
  }) {
    const B = L.builder;
    const [verb, setVerb] = useState(B.def);
    const out = B.conjugate(verb);
    const stem = stemOf(verb.trim());
    function hi(form) {
      const sp = B.split(form);
      if (!sp || !sp[1]) return form;
      return /*#__PURE__*/React.createElement("span", null, sp[0], /*#__PURE__*/React.createElement("span", {
        className: "e"
      }, sp[1]));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "panel"
    }, /*#__PURE__*/React.createElement("p", {
      className: "muted",
      style: {
        marginTop: 0
      }
    }, t.builder_hint), /*#__PURE__*/React.createElement("div", {
      className: "builder-io"
    }, /*#__PURE__*/React.createElement("input", {
      value: verb,
      onChange: e => setVerb(e.target.value),
      spellCheck: "false"
    }), /*#__PURE__*/React.createElement("div", {
      className: "chips"
    }, B.verbs.map(v => /*#__PURE__*/React.createElement("button", {
      key: v,
      className: "chip" + (v === verb ? " on" : ""),
      onClick: () => setVerb(v)
    }, v)))), out ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "result-big"
    }, hi(out)), /*#__PURE__*/React.createElement("div", {
      className: "steps"
    }, /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("div", {
      className: "k"
    }, t.b_base), /*#__PURE__*/React.createElement("div", {
      className: "v"
    }, verb.trim())), /*#__PURE__*/React.createElement("span", {
      className: "arrow-s"
    }, "\u2192"), /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("div", {
      className: "k"
    }, t.b_stem), /*#__PURE__*/React.createElement("div", {
      className: "v"
    }, stem)), /*#__PURE__*/React.createElement("span", {
      className: "arrow-s"
    }, "\u2192"), /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("div", {
      className: "k"
    }, UI[lang].rule), /*#__PURE__*/React.createElement("div", {
      className: "v",
      style: {
        fontSize: 14
      }
    }, B.rule(verb, lang))), /*#__PURE__*/React.createElement("span", {
      className: "arrow-s"
    }, "\u2192"), /*#__PURE__*/React.createElement("div", {
      className: "step",
      style: {
        background: "var(--orange-soft)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "k"
    }, t.b_result), /*#__PURE__*/React.createElement("div", {
      className: "v"
    }, out)))) : /*#__PURE__*/React.createElement("p", {
      style: {
        color: "var(--bad)"
      }
    }, t.builder_invalid), /*#__PURE__*/React.createElement("p", {
      className: "muted",
      style: {
        marginBottom: 0
      }
    }, t.builder_note));
  }

  /* ---------- ⑤ 문장으로 활용하기 (세로 뒤집기 카드) ---------- */
  function SentPractice({
    t,
    lang,
    onPlay
  }) {
    const [flip, setFlip] = useState({});
    const toggle = i => setFlip(f => ({
      ...f,
      [i]: !f[i]
    }));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "muted",
      style: {
        marginTop: 0
      }
    }, t.sent_hint), /*#__PURE__*/React.createElement("div", {
      className: "fcards"
    }, t.sent_items.map((it, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "fcard" + (flip[i] ? " on" : ""),
      onClick: () => toggle(i),
      role: "button",
      tabIndex: 0,
      "aria-pressed": !!flip[i],
      "aria-label": UI[lang].card(i + 1) + (flip[i] ? UI[lang].cardHide : UI[lang].cardShow),
      onKeyDown: e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle(i);
        }
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "finner"
    }, /*#__PURE__*/React.createElement("div", {
      className: "fface ffront"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fnum"
    }, i + 1), /*#__PURE__*/React.createElement("p", null, rich(it.q)), /*#__PURE__*/React.createElement("span", {
      className: "fhint"
    }, t.sent_tap)), /*#__PURE__*/React.createElement("div", {
      className: "fface fback"
    }, it.t !== undefined && onPlay && /*#__PURE__*/React.createElement("button", {
      className: "playbtn",
      title: "\u25B6",
      onClick: e => {
        e.stopPropagation();
        onPlay(it.t);
      }
    }, "\u25B6"), /*#__PURE__*/React.createElement("p", null, rich(it.a)), /*#__PURE__*/React.createElement("p", {
      className: "fbr"
    }, it.br), lang === "en" && it.tr && /*#__PURE__*/React.createElement("p", {
      className: "ftr"
    }, it.tr)))))));
  }

  /* ---------- ⑥ 대화 연습 · 발음 (발음 표기 + 규칙 팝업) ---------- */
  function DlgPractice({
    L,
    t,
    lang,
    onPlay
  }) {
    const [show, setShow] = useState(false);
    const [sel, setSel] = useState(null);
    const PR = L.prules || {};
    const segR = seg => seg.map((s, i) => {
      if (typeof s === "string") return /*#__PURE__*/React.createElement(React.Fragment, {
        key: i
      }, s);
      if (s.b) return /*#__PURE__*/React.createElement("b", {
        key: i
      }, s.tx);
      const clickable = !!s.ru;
      return /*#__PURE__*/React.createElement("span", {
        key: i,
        className: "pw" + (clickable ? " link" : ""),
        onClick: clickable ? () => setSel(s) : undefined,
        role: clickable ? "button" : undefined,
        tabIndex: clickable ? 0 : undefined,
        "aria-label": clickable ? UI[lang].pron + s.tx + " [" + s.pr + "]" : undefined,
        onKeyDown: clickable ? e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSel(s);
          }
        } : undefined,
        title: clickable ? UI[lang].pronTitle : undefined
      }, s.tx, show && s.pr && /*#__PURE__*/React.createElement("small", {
        className: "pr"
      }, "[", s.pr, "]"));
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "dlg"
    }, /*#__PURE__*/React.createElement("button", {
      className: "ptoggle",
      onClick: () => setShow(v => !v)
    }, show ? "\uD83D\uDC3E " + t.dlgp_toggle[1] : "\uD83D\uDC31 " + t.dlgp_toggle[0]), /*#__PURE__*/React.createElement("p", {
      className: "intro"
    }, t.dlgp_intro), t.dlgp_lines.map((ln, i) => /*#__PURE__*/React.createElement("div", {
      className: "bubble",
      key: i
    }, ln.t !== undefined && onPlay && /*#__PURE__*/React.createElement("button", {
      className: "playbtn",
      onClick: () => onPlay(ln.t),
      title: "\u25B6"
    }, "\u25B6"), /*#__PURE__*/React.createElement("span", {
      className: "who"
    }, ln.who), /*#__PURE__*/React.createElement("div", {
      className: "ko"
    }, segR(ln.seg)), lang === "en" && ln.en && /*#__PURE__*/React.createElement("div", {
      className: "en"
    }, ln.en))), /*#__PURE__*/React.createElement("div", {
      className: "takeaway"
    }, rich(t.dlgp_note)), sel && PR[sel.ru] && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "pp-ov",
      onClick: () => setSel(null)
    }), /*#__PURE__*/React.createElement("div", {
      className: "ppcard",
      role: "dialog"
    }, /*#__PURE__*/React.createElement("button", {
      className: "pp-x",
      onClick: () => setSel(null),
      title: "close"
    }, "\xD7"), /*#__PURE__*/React.createElement("span", {
      className: "pp-badge"
    }, "\uD83D\uDD0A ", PR[sel.ru][lang].name), /*#__PURE__*/React.createElement("div", {
      className: "pp-big"
    }, sel.tx, " ", /*#__PURE__*/React.createElement("span", {
      className: "arr"
    }, "\u2192"), " ", /*#__PURE__*/React.createElement("span", {
      className: "ph"
    }, "[", sel.pr, "]")), /*#__PURE__*/React.createElement("p", {
      className: "pp-sub"
    }, PR[sel.ru][lang].sub), /*#__PURE__*/React.createElement("p", {
      className: "pp-note"
    }, sel.nt))));
  }

  /* ---------- ⑧ 나만의 문장 만들기 ---------- */
  function MySentence({
    L,
    t
  }) {
    const KEY = "bk_mysent_" + L.id;
    const [val, setVal] = useState(() => {
      try {
        return localStorage.getItem(KEY) || "";
      } catch (e) {
        return "";
      }
    });
    const [fb, setFb] = useState(null);
    const check = () => {
      setFb(L.checker(val));
      try {
        localStorage.setItem(KEY, val);
      } catch (e) {}
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "panel mysent"
    }, /*#__PURE__*/React.createElement("p", {
      className: "muted",
      style: {
        marginTop: 0
      }
    }, t.ms_hint), /*#__PURE__*/React.createElement("textarea", {
      value: val,
      onChange: e => setVal(e.target.value),
      placeholder: t.ms_ph,
      spellCheck: "false"
    }), /*#__PURE__*/React.createElement("div", {
      className: "ms-row"
    }, /*#__PURE__*/React.createElement("button", {
      className: "ms-btn",
      onClick: check
    }, t.ms_btn)), fb && fb.st === "ok" && /*#__PURE__*/React.createElement("div", {
      className: "ms-fb ok"
    }, "\u2713 ", t.ms_ok[0], /*#__PURE__*/React.createElement("b", null, fb.form), t.ms_ok[1]), fb && fb.st === "almost" && /*#__PURE__*/React.createElement("div", {
      className: "ms-fb almost"
    }, t.ms_almost[0], /*#__PURE__*/React.createElement("b", null, fb.form), t.ms_almost[1]), fb && fb.st === "none" && /*#__PURE__*/React.createElement("div", {
      className: "ms-fb none"
    }, t.ms_none));
  }

  /* ---------- ⑦ 퀴즈 (스텝 방식) ---------- */
  function Quiz({
    L,
    t,
    lang,
    onComplete
  }) {
    const P1 = L.quiz.part1,
      P2 = L.quiz.part2;
    const items = [...P1.map((q, i) => ({
      ...q,
      key: "a" + i,
      part: 1
    })), ...P2.map((q, i) => ({
      ...q,
      key: "b" + i,
      part: 2
    }))];
    const TOTAL = items.length;
    const [idx, setIdx] = useState(0);
    const [picked, setPicked] = useState({});
    const [finished, setFinished] = useState(false);
    const correct = items.reduce((n, q) => n + (picked[q.key] === q.answer ? 1 : 0), 0);
    const celebrated = useRef(false);
    useEffect(() => {
      if (finished && !celebrated.current) {
        celebrated.current = true;
        celebrate();
        if (onComplete) onComplete(correct, TOTAL);
      }
    }, [finished]);
    const TAG = L.quiz.tags && L.quiz.tags[lang] || TAG_DEFAULT[lang];
    const reset = () => {
      setPicked({});
      setIdx(0);
      setFinished(false);
      celebrated.current = false;
    };
    const C = 2 * Math.PI * 23;
    if (finished) {
      const wrong = items.filter(it => picked[it.key] !== it.answer);
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "panel",
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("svg", {
        className: "ring ringbig",
        viewBox: "0 0 54 54"
      }, /*#__PURE__*/React.createElement("circle", {
        className: "bg",
        cx: "27",
        cy: "27",
        r: "23"
      }), /*#__PURE__*/React.createElement("circle", {
        className: "fg",
        cx: "27",
        cy: "27",
        r: "23",
        strokeDasharray: C,
        strokeDashoffset: C * (1 - correct / TOTAL)
      })), /*#__PURE__*/React.createElement("p", {
        style: {
          fontFamily: "var(--display)",
          fontSize: 24,
          margin: "10px 0 4px"
        }
      }, "\uD83C\uDF89 ", /*#__PURE__*/React.createElement("b", {
        style: {
          color: "var(--orange)"
        }
      }, correct), " / ", TOTAL), /*#__PURE__*/React.createElement("p", {
        className: "muted",
        style: {
          margin: "0 0 14px"
        }
      }, UI[lang].welldone), /*#__PURE__*/React.createElement("button", {
        className: "cta",
        onClick: reset
      }, t.retry)), wrong.length > 0 && /*#__PURE__*/React.createElement("div", {
        className: "panel",
        style: {
          marginTop: 12
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "qpart",
        style: {
          marginTop: 0
        }
      }, UI[lang].reviewMiss), wrong.map(w => /*#__PURE__*/React.createElement("div", {
        className: "wrongline",
        key: w.key
      }, w.sent ? /*#__PURE__*/React.createElement("span", null, w.sent[0], "(", w.base, ")", w.sent[1]) : /*#__PURE__*/React.createElement("span", null, w.base), " → ", /*#__PURE__*/React.createElement("b", null, w.options[w.answer]), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
        className: "muted"
      }, w.explain[lang])))));
    }
    const q = items[idx];
    const sel = picked[q.key];
    const show = sel !== undefined;
    const pick = oi => {
      if (show) return;
      setPicked(p => ({
        ...p,
        [q.key]: oi
      }));
    };
    const next = () => {
      if (idx < TOTAL - 1) setIdx(idx + 1);else setFinished(true);
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "quiz-intro"
    }, t.quiz_intro[0], /*#__PURE__*/React.createElement("span", {
      className: "muted"
    }, t.quiz_intro[1])), /*#__PURE__*/React.createElement("div", {
      className: "qstep-top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "qcount"
    }, UI[lang].question, " ", idx + 1, " / ", TOTAL), /*#__PURE__*/React.createElement("div", {
      className: "qbar"
    }, /*#__PURE__*/React.createElement("div", {
      className: "qbar-fill",
      style: {
        width: idx / TOTAL * 100 + "%"
      }
    }))), /*#__PURE__*/React.createElement("div", {
      className: "q"
    }, /*#__PURE__*/React.createElement("div", {
      className: "qpart",
      style: {
        margin: "0 0 10px"
      }
    }, q.part === 1 ? t.qpart1 : t.qpart2), /*#__PURE__*/React.createElement("div", {
      className: "prompt"
    }, q.sent ? /*#__PURE__*/React.createElement("span", null, q.sent[0], /*#__PURE__*/React.createElement("span", {
      className: "base"
    }, "( ", q.base, " )"), q.sent[1]) : /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "base"
    }, q.base), " ", /*#__PURE__*/React.createElement("span", {
      className: "muted"
    }, "(", q.gloss[lang], ")"), " \u2192 ?")), q.en && lang === "en" && /*#__PURE__*/React.createElement("div", {
      className: "en"
    }, q.en), /*#__PURE__*/React.createElement("div", {
      className: "opts"
    }, q.options.map((opt, oi) => {
      let cls = "opt";
      if (show) {
        if (oi === q.answer) cls += " correct";else if (oi === sel) cls += " wrong";
      }
      return /*#__PURE__*/React.createElement("button", {
        key: oi,
        className: cls,
        "data-c": oi === q.answer ? "1" : "0",
        disabled: show,
        onClick: () => pick(oi)
      }, opt);
    })), show && /*#__PURE__*/React.createElement("div", {
      className: "explain"
    }, sel === q.answer ? "✓ " : "✗ ", q.explain[lang], q.nuance && /*#__PURE__*/React.createElement("span", null, " \xB7 ", /*#__PURE__*/React.createElement("span", {
      className: "tag2 " + q.nuance
    }, TAG[q.nuance])))), show && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "cta",
      onClick: next
    }, idx < TOTAL - 1 ? UI[lang].next : UI[lang].results)));
  }

  /* ---------- 페이지 전체 ---------- */
  function App({
    L
  }) {
    const [lang, setLangRaw] = useState(() => {
      try {
        return localStorage.getItem("bk_lang") || "ko";
      } catch (e) {
        return "ko";
      }
    });
    const setLang = v => {
      setLangRaw(v);
      try {
        localStorage.setItem("bk_lang", v);
      } catch (e) {}
    };
    const [clip, setClip] = useState(null);
    const [done, setDone] = useState(() => {
      try {
        return localStorage.getItem("bk_done_" + L.id) === "1";
      } catch (e) {
        return false;
      }
    });
    const [best, setBest] = useState(() => {
      try {
        const v = localStorage.getItem("bk_best_" + L.id);
        return v ? parseInt(v) : null;
      } catch (e) {
        return null;
      }
    });
    const total = L.quiz ? L.quiz.part1.length + L.quiz.part2.length : 0;
    const quizDone = (c, tot) => {
      setDone(true);
      setBest(b => {
        const nb = b === null ? c : Math.max(b, c);
        try {
          localStorage.setItem("bk_best_" + L.id, String(nb));
          localStorage.setItem("bk_done_" + L.id, "1");
          localStorage.setItem("bk_date_" + L.id, String(Date.now()));
        } catch (e) {}
        return nb;
      });
    };
    const [review, setReview] = useState(() => {
      try {
        const d = localStorage.getItem("bk_date_" + L.id);
        if (!d || localStorage.getItem("bk_done_" + L.id) !== "1") return null;
        const days = Math.floor((Date.now() - parseInt(d)) / 86400000);
        return days >= 3 ? days : null;
      } catch (e) {
        return null;
      }
    });
    const progRef = useRef(null);
    useEffect(() => {
      const f = () => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        if (progRef.current) progRef.current.style.width = (max > 0 ? h.scrollTop / max * 100 : 0) + "%";
      };
      window.addEventListener("scroll", f, {
        passive: true
      });
      f();
      return () => window.removeEventListener("scroll", f);
    }, []);
    const t = L.ct[lang];
    const U = UI[lang];
    let n = 0;
    const num = () => ++n; // 섹션 번호 자동 매김

    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "scrollprog",
      ref: progRef
    }), L.showHeader !== false && /*#__PURE__*/React.createElement("div", {
      className: "topbrand"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "logo"
    }, /*#__PURE__*/React.createElement("img", {
      className: "bkimg",
      src: L.logoUrl,
      alt: "\uBCA0\uC774\uC9C1 \uCF54\uB9AC\uC548"
    }), /*#__PURE__*/React.createElement("span", {
      className: "en"
    }, "BASIC KOREAN")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "langtoggle"
    }, /*#__PURE__*/React.createElement("button", {
      className: lang === "ko" ? "on" : "",
      onClick: () => setLang("ko")
    }, t.langA), /*#__PURE__*/React.createElement("button", {
      className: lang === "en" ? "on" : "",
      onClick: () => setLang("en")
    }, t.langB)), L.showPdf && /*#__PURE__*/React.createElement("button", {
      className: "printbtn",
      onClick: () => window.print(),
      title: U.pdf
    }, "\uD83D\uDCC4 PDF")))), /*#__PURE__*/React.createElement("header", {
      className: "hero"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wrap"
    }, /*#__PURE__*/React.createElement("span", {
      className: "kicker"
    }, t.kicker), done && /*#__PURE__*/React.createElement("span", {
      className: "donebadge"
    }, "\u2713 ", U.done), /*#__PURE__*/React.createElement("h1", {
      dangerouslySetInnerHTML: {
        __html: L.heroHTML
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "ex"
    }, t.heroEx, /*#__PURE__*/React.createElement("small", null, t.heroSub)))), /*#__PURE__*/React.createElement("div", {
      className: "wrap"
    }, review !== null && /*#__PURE__*/React.createElement("div", {
      className: "revbanner"
    }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC5 ", U.revBanner(review)), /*#__PURE__*/React.createElement("button", {
      className: "ms-btn",
      onClick: () => {
        const el = document.getElementById("bk-quizsec");
        if (el) el.scrollIntoView({
          behavior: "smooth"
        });
        setReview(null);
      }
    }, U.revBtn), /*#__PURE__*/React.createElement("button", {
      className: "pp-x",
      style: {
        position: "static"
      },
      "aria-label": "close",
      onClick: () => setReview(null)
    }, "\xD7")), /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.concept_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.concept_h), t.prereq && /*#__PURE__*/React.createElement("p", {
      className: "prereq"
    }, "\uD83D\uDCCC ", t.prereq), /*#__PURE__*/React.createElement("div", {
      className: "concept-card"
    }, /*#__PURE__*/React.createElement("ul", {
      className: "cul"
    }, t.concept_p1.map((line, i) => /*#__PURE__*/React.createElement("li", {
      key: i
    }, rich(line))))), /*#__PURE__*/React.createElement("div", {
      className: "flow"
    }, t.flow.map((nd, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, i > 0 && /*#__PURE__*/React.createElement("div", {
      className: "arrow"
    }, "\u2192"), /*#__PURE__*/React.createElement("div", {
      className: "node"
    }, /*#__PURE__*/React.createElement("div", {
      className: "emoji"
    }, nd[0]), /*#__PURE__*/React.createElement("div", {
      className: "t"
    }, nd[1]), /*#__PURE__*/React.createElement("div", {
      className: "s"
    }, nd[2])))))), t.dialogs && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.dlg_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.dlg_h), t.dialogs.map((d, i) => /*#__PURE__*/React.createElement(Dialogue, {
      key: i,
      d: d,
      lang: lang,
      onPlay: setClip
    }))), L.tables && L.tables.conj && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.conj_l), t.conj_h ? /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.conj_h) : null, /*#__PURE__*/React.createElement("p", {
      className: "combine"
    }, t.conj_combine), /*#__PURE__*/React.createElement("div", {
      dangerouslySetInnerHTML: {
        __html: L.tables.conj[lang]
      }
    })), L.builder && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.builder_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.builder_h), /*#__PURE__*/React.createElement(Builder, {
      L: L,
      t: t,
      lang: lang
    }), L.toolUrl && t.tool_text && /*#__PURE__*/React.createElement("a", {
      className: "toolbanner",
      href: L.toolUrl,
      target: "_blank",
      rel: "noopener noreferrer"
    }, /*#__PURE__*/React.createElement("span", {
      className: "tb-ic"
    }, "\uD83D\uDD27"), /*#__PURE__*/React.createElement("span", null, t.tool_text[0], /*#__PURE__*/React.createElement("b", null, t.tool_text[1])), /*#__PURE__*/React.createElement("span", {
      className: "tb-arrow"
    }, "\u2192"))), t.sent_items && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.sent_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.sent_h), /*#__PURE__*/React.createElement(SentPractice, {
      t: t,
      lang: lang,
      onPlay: setClip
    })), t.dlgp_lines && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.dlgp_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.dlgp_h), /*#__PURE__*/React.createElement(DlgPractice, {
      L: L,
      t: t,
      lang: lang,
      onPlay: setClip
    })), L.quiz && /*#__PURE__*/React.createElement("section", {
      className: "sec",
      id: "bk-quizsec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.quiz_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.quiz_h), best !== null && /*#__PURE__*/React.createElement("p", {
      className: "bestscore"
    }, "\uD83C\uDFC6 ", U.best(best, total)), /*#__PURE__*/React.createElement(Quiz, {
      L: L,
      t: t,
      lang: lang,
      onComplete: quizDone
    })), L.checker && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.ms_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.ms_h), /*#__PURE__*/React.createElement(MySentence, {
      L: L,
      t: t
    })), t.review && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stepn"
    }, num()), t.review_l), /*#__PURE__*/React.createElement("div", {
      className: "review"
    }, /*#__PURE__*/React.createElement("h3", null, t.review_h), /*#__PURE__*/React.createElement("ul", null, t.review.map((li, i) => /*#__PURE__*/React.createElement("li", {
      key: i
    }, rich(li)))), L.tables && L.tables.rev && /*#__PURE__*/React.createElement("div", {
      dangerouslySetInnerHTML: {
        __html: L.tables.rev[lang]
      }
    }))), L.videoId && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, t.video_l), /*#__PURE__*/React.createElement("h2", {
      className: "head"
    }, t.video_h), /*#__PURE__*/React.createElement(VideoEmbed, {
      videoId: L.videoId,
      title: t.kicker
    })), L.next && L.next.length > 0 && /*#__PURE__*/React.createElement("section", {
      className: "sec"
    }, /*#__PURE__*/React.createElement("div", {
      className: "label"
    }, t.next_l), /*#__PURE__*/React.createElement("div", {
      className: "nextgrid"
    }, L.next.map((nc, i) => /*#__PURE__*/React.createElement("a", {
      key: i,
      className: "nextcard",
      href: nc.href,
      target: nc.newTab ? "_blank" : undefined,
      rel: nc.newTab ? "noopener noreferrer" : undefined
    }, /*#__PURE__*/React.createElement("span", {
      className: "nk"
    }, nc.nk[lang]), /*#__PURE__*/React.createElement("div", {
      className: "np",
      dangerouslySetInnerHTML: {
        __html: nc.npHTML
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "ng"
    }, nc.ng[lang]), /*#__PURE__*/React.createElement("span", {
      className: "na"
    }, nc.na[lang])))))), /*#__PURE__*/React.createElement(MiniPlayer, {
      videoId: L.videoId,
      sec: clip,
      onClose: () => setClip(null),
      label: U.clip
    }), L.showFooter !== false && /*#__PURE__*/React.createElement("div", {
      className: "bkfoot"
    }, /*#__PURE__*/React.createElement("div", {
      className: "brand"
    }, /*#__PURE__*/React.createElement("b", null, "\uBCA0\uC774\uC9C1 \uCF54\uB9AC\uC548"), " ", /*#__PURE__*/React.createElement("span", {
      className: "bren"
    }, "\xB7 Basic Korean")), /*#__PURE__*/React.createElement("p", null, t.footer_sub, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("a", {
      href: "https://www.basickorean.com/",
      target: "_blank",
      rel: "noreferrer"
    }, "basickorean.com"), " \xB7", /*#__PURE__*/React.createElement("a", {
      href: "https://www.youtube.com/@basickoreanBK",
      target: "_blank",
      rel: "noreferrer"
    }, " YouTube @basickoreanBK"))));
  }

  /* ---------- 마운트 ---------- */
  function mount() {
    const L = window.BK_LESSON;
    const el = document.getElementById("bk-lesson");
    if (!L || !el) return;
    if (el.dataset.bkMounted) return; // 중복 마운트 방지
    el.dataset.bkMounted = "1";
    el.classList.add("bk-root");
    ReactDOM.createRoot(el).render(/*#__PURE__*/React.createElement(App, {
      L: L
    }));
  }
  window.BK = {
    version: "1.0.0",
    hangul: {
      decompose,
      compose,
      stemOf,
      JONG
    },
    render: mount
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);else mount();
})();
