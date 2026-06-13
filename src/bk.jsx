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
  const { useState, useEffect, useRef } = React;

  /* ---------- 한글 활용 엔진 (강의 스크립트에서 BK.hangul 로 사용) ---------- */
  const JONG = { N: 4, L: 8, SS: 20 };
  function decompose(ch) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c >= 11172) return null;
    return { cho: Math.floor(c / 588), jung: Math.floor((c % 588) / 28), jong: c % 28 };
  }
  const compose = (cho, jung, jong) => String.fromCharCode(0xac00 + cho * 588 + jung * 28 + (jong || 0));
  const stemOf = (v) => (v.endsWith("다") ? v.slice(0, -1) : v);

  const IS_FILE = window.location.protocol === "file:";

  /* ---------- 공통 UI 문자열 (모든 강의에서 동일) ---------- */
  const UI = {
    ko: {
      rule: "조건", question: "문제", next: "다음 →", results: "결과 보기 🎉",
      welldone: "수고했어요! 틀린 문제는 아래에서 복습하세요.", reviewMiss: "틀린 문제 복습",
      best: (b, t) => `최고 기록: ${b}/${t}`, done: "학습 완료",
      revBanner: (d) => `${d}일 전에 이 문법을 배웠어요. 기억이 잘 나는지 복습 퀴즈로 확인해 볼까요?`,
      revBtn: "복습 퀴즈 →", clip: "영상에서 듣기", pdf: "PDF로 저장",
      fileNote: (mm, ss) => `클릭하면 유튜브에서 ${mm}:${ss}부터 재생 · opens on YouTube`,
      card: (i) => `연습 카드 ${i}`, cardShow: " — 정답 보기", cardHide: " — 정답 숨기기",
      pron: "발음 규칙 보기: ", pronTitle: "발음 규칙 보기",
    },
    en: {
      rule: "rule", question: "Question", next: "Next →", results: "See results 🎉",
      welldone: "Well done! Review any misses below.", reviewMiss: "Review your misses",
      best: (b, t) => `Best score: ${b}/${t}`, done: "Completed",
      revBanner: (d) => `You studied this ${d} days ago — quick review quiz?`,
      revBtn: "Review quiz →", clip: "Listen in the video", pdf: "Save as PDF",
      fileNote: (mm, ss) => `Opens on YouTube at ${mm}:${ss}`,
      card: (i) => `Practice card ${i}`, cardShow: " — reveal answer", cardHide: " — hide answer",
      pron: "Pronunciation rule: ", pronTitle: "See the pronunciation rule",
    },
  };
  const TAG_DEFAULT = {
    ko: { bo: "받침 O", bx: "받침 X", bl: "ㄹ 탈락", ir: "불규칙" },
    en: { bo: "has 받침", bx: "no 받침", bl: "drop ㄹ", ir: "irregular" },
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
      if (typeof p === "string") return <React.Fragment key={i}>{p}</React.Fragment>;
      if (p && p.b !== undefined) return <b key={i}>{p.b}</b>;
      return null;
    });
  }

  /* ---------- 미니 플레이어 (자막 타임스탬프 → 해당 초부터 재생) ---------- */
  function MiniPlayer({ videoId, sec, onClose, label }) {
    if (sec === null) return null;
    const mm = Math.floor(sec / 60), ss = String(sec % 60).padStart(2, "0");
    return (
      <div className="miniplayer">
        <div className="bar"><span>▶ {label} · {mm}:{ss}</span><button onClick={onClose} title="close">×</button></div>
        {IS_FILE ? (
          <a className="vid vfallback" href={`https://youtu.be/${videoId}?t=${sec}`} target="_blank" rel="noreferrer">
            <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="clip" />
            <span className="playbig">▶</span>
          </a>
        ) : (
          <div className="vid"><iframe key={sec} src={`https://www.youtube.com/embed/${videoId}?start=${sec}&autoplay=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title="clip"></iframe></div>
        )}
      </div>
    );
  }

  function VideoEmbed({ videoId, title }) {
    if (!IS_FILE) return (
      <div className="video"><iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>
    );
    return (
      <a className="video vfallback" href={`https://youtu.be/${videoId}`} target="_blank" rel="noreferrer" title={title}>
        <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={title} />
        <span className="playbig">▶</span>
      </a>
    );
  }

  /* ---------- ② 대화 속에서 보기 ---------- */
  function Dialogue({ d, lang, onPlay }) {
    return (
      <div className="dlg">
        <span className={"tag " + d.cls}>{d.tag}</span>
        <p className="intro">{d.intro}</p>
        {d.lines.map((ln, i) => (
          <div className="bubble" key={i}>
            {ln.t !== undefined && onPlay && <button className="playbtn" onClick={() => onPlay(ln.t)} title="▶">▶</button>}
            <span className="who">{ln.who}</span>
            <div className="ko">{rich(ln.ko)}</div>
            {lang === "en" && ln.en && <div className="en">{ln.en}</div>}
          </div>
        ))}
        <div className="formbox">
          <span className="big">{d.form[0]}</span><span className="eq">{d.form[1]}</span>
          <span className="part">{d.form[2]}</span><span className="eq">{d.form[3]}</span>
          <span className="part" style={{ color: "var(--orange)" }}>{d.form[4]}</span>
        </div>
        {d.formNote && <div className="formnote">{rich(d.formNote)}</div>}
        <div className="steps3">
          {d.steps.map((s, i) => (
            <div className="stepc" key={i}>
              <span className="n">{i + 1}</span>
              <div className={"k " + s.cls}>{s.k}</div>
              <div className="v">{rich(s.v)}</div>
            </div>
          ))}
        </div>
        {d.take && <div className="takeaway">{rich(d.take)}</div>}
      </div>
    );
  }

  /* ---------- ④ 활용 만들기 ---------- */
  function Builder({ L, t, lang }) {
    const B = L.builder;
    const [verb, setVerb] = useState(B.def);
    const out = B.conjugate(verb);
    const stem = stemOf(verb.trim());
    function hi(form) {
      const sp = B.split(form);
      if (!sp || !sp[1]) return form;
      return <span>{sp[0]}<span className="e">{sp[1]}</span></span>;
    }
    return (
      <div className="panel">
        <p className="muted" style={{ marginTop: 0 }}>{t.builder_hint}</p>
        <div className="builder-io">
          <input value={verb} onChange={(e) => setVerb(e.target.value)} spellCheck="false" />
          <div className="chips">{B.verbs.map((v) => <button key={v} className={"chip" + (v === verb ? " on" : "")} onClick={() => setVerb(v)}>{v}</button>)}</div>
        </div>
        {out ? (
          <React.Fragment>
            <div className="result-big">{hi(out)}</div>
            <div className="steps">
              <div className="step"><div className="k">{t.b_base}</div><div className="v">{verb.trim()}</div></div>
              <span className="arrow-s">→</span>
              <div className="step"><div className="k">{t.b_stem}</div><div className="v">{stem}</div></div>
              <span className="arrow-s">→</span>
              <div className="step"><div className="k">{UI[lang].rule}</div><div className="v" style={{ fontSize: 13.5 }}>{B.rule(verb, lang)}</div></div>
              <span className="arrow-s">→</span>
              <div className="step" style={{ background: "var(--orange-soft)" }}><div className="k">{t.b_result}</div><div className="v">{out}</div></div>
            </div>
          </React.Fragment>
        ) : <p style={{ color: "var(--bad)" }}>{t.builder_invalid}</p>}
        <p className="muted" style={{ marginBottom: 0 }}>{t.builder_note}</p>
      </div>
    );
  }

  /* ---------- ⑤ 문장으로 활용하기 (세로 뒤집기 카드) ---------- */
  function SentPractice({ t, lang, onPlay }) {
    const [flip, setFlip] = useState({});
    const toggle = (i) => setFlip((f) => ({ ...f, [i]: !f[i] }));
    return (
      <div>
        <p className="muted" style={{ marginTop: 0 }}>{t.sent_hint}</p>
        <div className="fcards">
          {t.sent_items.map((it, i) => (
            <div key={i} className={"fcard" + (flip[i] ? " on" : "")} onClick={() => toggle(i)}
              role="button" tabIndex={0} aria-pressed={!!flip[i]}
              aria-label={UI[lang].card(i + 1) + (flip[i] ? UI[lang].cardHide : UI[lang].cardShow)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }}>
              <div className="finner">
                <div className="fface ffront">
                  <span className="fnum">{i + 1}</span>
                  <p>{rich(it.q)}</p>
                  <span className="fhint">{t.sent_tap}</span>
                </div>
                <div className="fface fback">
                  {it.t !== undefined && onPlay && <button className="playbtn" title="▶"
                    onClick={(e) => { e.stopPropagation(); onPlay(it.t); }}>▶</button>}
                  <p>{rich(it.a)}</p>
                  <p className="fbr">{it.br}</p>
                  {lang === "en" && it.tr && <p className="ftr">{it.tr}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- ⑥ 대화 연습 · 발음 (발음 표기 + 규칙 팝업) ---------- */
  function DlgPractice({ L, t, lang, onPlay }) {
    const [show, setShow] = useState(false);
    const [sel, setSel] = useState(null);
    const PR = L.prules || {};
    const segR = (seg) => seg.map((s, i) => {
      if (typeof s === "string") return <React.Fragment key={i}>{s}</React.Fragment>;
      if (s.b) return <b key={i}>{s.tx}</b>;
      const clickable = !!s.ru;
      return (
        <span key={i} className={"pw" + (clickable ? " link" : "")}
          onClick={clickable ? () => setSel(s) : undefined}
          role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined}
          aria-label={clickable ? UI[lang].pron + s.tx + " [" + s.pr + "]" : undefined}
          onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(s); } } : undefined}
          title={clickable ? UI[lang].pronTitle : undefined}>
          {s.tx}{show && s.pr && <small className="pr">[{s.pr}]</small>}
        </span>
      );
    });
    return (
      <div className="dlg">
        <button className="ptoggle" onClick={() => setShow((v) => !v)}>{show ? "🐾 " + t.dlgp_toggle[1] : "🔍 " + t.dlgp_toggle[0]}</button>
        <p className="intro">{t.dlgp_intro}</p>
        {t.dlgp_lines.map((ln, i) => (
          <div className="bubble" key={i}>
            {ln.t !== undefined && onPlay && <button className="playbtn" onClick={() => onPlay(ln.t)} title="▶">▶</button>}
            <span className="who">{ln.who}</span>
            <div className="ko">{segR(ln.seg)}</div>
            {lang === "en" && ln.en && <div className="en">{ln.en}</div>}
          </div>
        ))}
        <div className="takeaway">{rich(t.dlgp_note)}</div>
        {sel && PR[sel.ru] && (
          <React.Fragment>
            <div className="pp-ov" onClick={() => setSel(null)} />
            <div className="ppcard" role="dialog">
              <button className="pp-x" onClick={() => setSel(null)} title="close">×</button>
              <span className="pp-badge">🔊 {PR[sel.ru][lang].name}</span>
              <div className="pp-big">{sel.tx} <span className="arr">→</span> <span className="ph">[{sel.pr}]</span></div>
              <p className="pp-sub">{PR[sel.ru][lang].sub}</p>
              <p className="pp-note">{sel.nt}</p>
              {PR[sel.ru][lang].link && (
                <a className="pp-link" href={PR[sel.ru][lang].link.href} target="_blank" rel="noreferrer">
                  {PR[sel.ru][lang].link.label} →
                </a>
              )}
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }

  /* ---------- ⑧ 나만의 문장 만들기 ---------- */
  function MySentence({ L, t }) {
    const KEY = "bk_mysent_" + L.id;
    const [val, setVal] = useState(() => { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } });
    const [fb, setFb] = useState(null);
    const check = () => { setFb(L.checker(val)); try { localStorage.setItem(KEY, val); } catch (e) {} };
    return (
      <div className="panel mysent">
        <p className="muted" style={{ marginTop: 0 }}>{t.ms_hint}</p>
        <textarea value={val} onChange={(e) => setVal(e.target.value)} placeholder={t.ms_ph} spellCheck="false" />
        <div className="ms-row"><button className="ms-btn" onClick={check}>{t.ms_btn}</button></div>
        {fb && fb.st === "ok" && <div className="ms-fb ok">✓ {t.ms_ok[0]}<b>{fb.form}</b>{t.ms_ok[1]}</div>}
        {fb && fb.st === "almost" && <div className="ms-fb almost">{t.ms_almost[0]}<b>{fb.form}</b>{t.ms_almost[1]}</div>}
        {fb && fb.st === "none" && <div className="ms-fb none">{t.ms_none}</div>}
      </div>
    );
  }

  /* ---------- ⑦ 퀴즈 (스텝 방식) ---------- */
  function Quiz({ L, t, lang, onComplete }) {
    const P1 = L.quiz.part1, P2 = L.quiz.part2;
    const items = [...P1.map((q, i) => ({ ...q, key: "a" + i, part: 1 })), ...P2.map((q, i) => ({ ...q, key: "b" + i, part: 2 }))];
    const TOTAL = items.length;
    const [idx, setIdx] = useState(0);
    const [picked, setPicked] = useState({});
    const [finished, setFinished] = useState(false);
    const correct = items.reduce((n, q) => n + (picked[q.key] === q.answer ? 1 : 0), 0);
    const celebrated = useRef(false);
    useEffect(() => { if (finished && !celebrated.current) { celebrated.current = true; celebrate(); if (onComplete) onComplete(correct, TOTAL); } }, [finished]);
    const TAG = (L.quiz.tags && L.quiz.tags[lang]) || TAG_DEFAULT[lang];
    const reset = () => { setPicked({}); setIdx(0); setFinished(false); celebrated.current = false; };
    const C = 2 * Math.PI * 23;

    if (finished) {
      const wrong = items.filter((it) => picked[it.key] !== it.answer);
      return (
        <div>
          <div className="panel" style={{ textAlign: "center" }}>
            <svg className="ring ringbig" viewBox="0 0 54 54"><circle className="bg" cx="27" cy="27" r="23" /><circle className="fg" cx="27" cy="27" r="23" strokeDasharray={C} strokeDashoffset={C * (1 - correct / TOTAL)} /></svg>
            <p style={{ fontFamily: "var(--display)", fontSize: 24, margin: "10px 0 4px" }}>🎉 <b style={{ color: "var(--orange)" }}>{correct}</b> / {TOTAL}</p>
            <p className="muted" style={{ margin: "0 0 14px" }}>{UI[lang].welldone}</p>
            <button className="cta" onClick={reset}>{t.retry}</button>
          </div>
          {wrong.length > 0 && (
            <div className="panel" style={{ marginTop: 12 }}>
              <div className="qpart" style={{ marginTop: 0 }}>{UI[lang].reviewMiss}</div>
              {wrong.map((w) => (
                <div className="wrongline" key={w.key}>
                  {w.sent ? <span>{w.sent[0]}({w.base}){w.sent[1]}</span> : <span>{w.base}</span>}
                  {" → "}<b>{w.options[w.answer]}</b><br />
                  <span className="muted">{w.explain[lang]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const q = items[idx];
    const sel = picked[q.key]; const show = sel !== undefined;
    const pick = (oi) => { if (show) return; setPicked((p) => ({ ...p, [q.key]: oi })); };
    const next = () => { if (idx < TOTAL - 1) setIdx(idx + 1); else setFinished(true); };
    return (
      <div>
        <p className="quiz-intro">{t.quiz_intro[0]}<span className="muted">{t.quiz_intro[1]}</span></p>
        <div className="qstep-top">
          <span className="qcount">{UI[lang].question} {idx + 1} / {TOTAL}</span>
          <div className="qbar"><div className="qbar-fill" style={{ width: (idx / TOTAL * 100) + "%" }} /></div>
        </div>
        <div className="q">
          <div className="qpart" style={{ margin: "0 0 10px" }}>{q.part === 1 ? t.qpart1 : t.qpart2}</div>
          <div className="prompt">
            {q.sent ? <span>{q.sent[0]}<span className="base">( {q.base} )</span>{q.sent[1]}</span>
              : <span><span className="base">{q.base}</span> <span className="muted">({q.gloss[lang]})</span> → ?</span>}
          </div>
          {q.en && lang === "en" && <div className="en">{q.en}</div>}
          <div className="opts">
            {q.options.map((opt, oi) => {
              let cls = "opt"; if (show) { if (oi === q.answer) cls += " correct"; else if (oi === sel) cls += " wrong"; }
              return <button key={oi} className={cls} data-c={oi === q.answer ? "1" : "0"} disabled={show} onClick={() => pick(oi)}>{opt}</button>;
            })}
          </div>
          {show && <div className="explain">{sel === q.answer ? "✓ " : "✗ "}{q.explain[lang]}{q.nuance && <span> · <span className={"tag2 " + q.nuance}>{TAG[q.nuance]}</span></span>}</div>}
        </div>
        {show && <div style={{ textAlign: "right", marginTop: 12 }}>
          <button className="cta" onClick={next}>{idx < TOTAL - 1 ? UI[lang].next : UI[lang].results}</button>
        </div>}
      </div>
    );
  }

  /* ---------- 페이지 전체 ---------- */
  function App({ L }) {
    const [lang, setLangRaw] = useState(() => { try { return localStorage.getItem("bk_lang") || "ko"; } catch (e) { return "ko"; } });
    const setLang = (v) => { setLangRaw(v); try { localStorage.setItem("bk_lang", v); } catch (e) {} };
    const [clip, setClip] = useState(null);
    const [done, setDone] = useState(() => { try { return localStorage.getItem("bk_done_" + L.id) === "1"; } catch (e) { return false; } });
    const [best, setBest] = useState(() => { try { const v = localStorage.getItem("bk_best_" + L.id); return v ? parseInt(v) : null; } catch (e) { return null; } });
    const total = L.quiz ? L.quiz.part1.length + L.quiz.part2.length : 0;
    const quizDone = (c, tot) => {
      setDone(true);
      setBest((b) => {
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
      } catch (e) { return null; }
    });
    const progRef = useRef(null);
    useEffect(() => {
      const f = () => {
        const h = document.documentElement; const max = h.scrollHeight - h.clientHeight;
        if (progRef.current) progRef.current.style.width = (max > 0 ? (h.scrollTop / max * 100) : 0) + "%";
      };
      window.addEventListener("scroll", f, { passive: true }); f();
      return () => window.removeEventListener("scroll", f);
    }, []);
    const t = L.ct[lang];
    const U = UI[lang];
    let n = 0; const num = () => ++n;   // 섹션 번호 자동 매김

    return (
      <React.Fragment>
        <div className="scrollprog" ref={progRef} />
        {L.showHeader !== false && (
          <div className="topbrand"><div className="wrap">
            <div className="logo"><img className="bkimg" src={L.logoUrl} alt="베이직 코리안" /><span className="en">BASIC KOREAN</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="langtoggle">
                <button className={lang === "ko" ? "on" : ""} onClick={() => setLang("ko")}>{t.langA}</button>
                <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>{t.langB}</button>
              </div>
              {L.showPdf && <button className="printbtn" onClick={() => window.print()} title={U.pdf}>📄 PDF</button>}
            </div>
          </div></div>
        )}

        <header className="hero"><div className="wrap">
          <span className="kicker">{t.kicker}</span>
          {done && <span className="donebadge">✓ {U.done}</span>}
          <h1 dangerouslySetInnerHTML={{ __html: L.heroHTML }} />
          <div className="ex">{t.heroEx}<small>{t.heroSub}</small></div>
        </div></header>

        <div className="wrap">
          {review !== null && (
            <div className="revbanner">
              <span>📅 {U.revBanner(review)}</span>
              <button className="ms-btn" onClick={() => { const el = document.getElementById("bk-quizsec"); if (el) el.scrollIntoView({ behavior: "smooth" }); setReview(null); }}>{U.revBtn}</button>
              <button className="pp-x" style={{ position: "static" }} aria-label="close" onClick={() => setReview(null)}>×</button>
            </div>
          )}

          {/* 개념 */}
          <section className="sec">
            <div className="label"><span className="stepn">{num()}</span>{t.concept_l}</div>
            <h2 className="head">{t.concept_h}</h2>
            {t.prereq && <p className="prereq">📌 {t.prereq}</p>}
            <div className="concept-card"><ul className="cul">{t.concept_p1.map((line, i) => <li key={i}>{rich(line)}</li>)}</ul></div>
            {t.flowHTML ? (
              <div className="cvis" dangerouslySetInnerHTML={{ __html: t.flowHTML }} />
            ) : t.flow && (
              <div className="flow">
                {t.flow.map((nd, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div className="arrow">→</div>}
                    <div className="node"><div className="emoji">{nd[0]}</div><div className="t">{nd[1]}</div><div className="s">{nd[2]}</div></div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>

          {/* 대화 속에서 보기 */}
          {t.dialogs && (
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.dlg_l}</div>
              <h2 className="head">{t.dlg_h}</h2>
              {t.dialogs.map((d, i) => <Dialogue key={i} d={d} lang={lang} onPlay={setClip} />)}
            </section>
          )}

          {/* 결합정보 */}
          {L.tables && L.tables.conj && (
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.conj_l}</div>
              {t.conj_h ? <h2 className="head">{t.conj_h}</h2> : null}
              <p className="combine">{t.conj_combine}</p>
              <div dangerouslySetInnerHTML={{ __html: L.tables.conj[lang] }} />
            </section>
          )}

          {/* 활용 만들기 */}
          {L.builder && (
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.builder_l}</div>
              <h2 className="head">{t.builder_h}</h2>
              <Builder L={L} t={t} lang={lang} />
              {L.toolUrl && t.tool_text && (
                <a className="toolbanner" href={L.toolUrl} target="_blank" rel="noopener noreferrer">
                  <span className="tb-ic">🔧</span>
                  <span>{t.tool_text[0]}<b>{t.tool_text[1]}</b></span>
                  <span className="tb-arrow">→</span>
                </a>
              )}
            </section>
          )}

          {/* 문장으로 활용하기 */}
          {t.sent_items && (
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.sent_l}</div>
              <h2 className="head">{t.sent_h}</h2>
              <SentPractice t={t} lang={lang} onPlay={setClip} />
            </section>
          )}

          {/* 대화 연습 · 발음 */}
          {t.dlgp_lines && (
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.dlgp_l}</div>
              <h2 className="head">{t.dlgp_h}</h2>
              <DlgPractice L={L} t={t} lang={lang} onPlay={setClip} />
            </section>
          )}

          {/* 퀴즈 */}
          {L.quiz && (
            <section className="sec" id="bk-quizsec">
              <div className="label"><span className="stepn">{num()}</span>{t.quiz_l}</div>
              <h2 className="head">{t.quiz_h}</h2>
              {best !== null && <p className="bestscore">🏆 {U.best(best, total)}</p>}
              <Quiz L={L} t={t} lang={lang} onComplete={quizDone} />
            </section>
          )}

          {/* 나만의 문장 만들기 */}
          {L.checker && (
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.ms_l}</div>
              <h2 className="head">{t.ms_h}</h2>
              <MySentence L={L} t={t} />
            </section>
          )}

          {/* 복습 */}
          {t.review && (
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.review_l}</div>
              <div className="review"><h3>{t.review_h}</h3>
                <ul>{t.review.map((li, i) => <li key={i}>{rich(li)}</li>)}</ul>
                {L.tables && L.tables.rev && <div dangerouslySetInnerHTML={{ __html: L.tables.rev[lang] }} />}
              </div>
            </section>
          )}

          {/* 영상 */}
          {L.videoId && (
            <section className="sec">
              <div className="label">{t.video_l}</div>
              <h2 className="head">{t.video_h}</h2>
              <VideoEmbed videoId={L.videoId} title={t.kicker} />
            </section>
          )}

          {/* 다음 학습 */}
          {L.next && L.next.length > 0 && (
            <section className="sec">
              <div className="label">{t.next_l}</div>
              <div className="nextgrid">
                {L.next.map((nc, i) => (
                  <a key={i} className="nextcard" href={nc.href}
                    target={nc.newTab ? "_blank" : undefined} rel={nc.newTab ? "noopener noreferrer" : undefined}>
                    <span className="nk">{nc.nk[lang]}</span>
                    <div className="np" dangerouslySetInnerHTML={{ __html: nc.npHTML }} />
                    <div className="ng">{nc.ng[lang]}</div>
                    <span className="na">{nc.na[lang]}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <MiniPlayer videoId={L.videoId} sec={clip} onClose={() => setClip(null)} label={U.clip} />

        {L.showFooter !== false && (
          <div className="bkfoot">
            <div className="brand"><b>베이직 코리안</b> <span className="bren">· Basic Korean</span></div>
            <p>{t.footer_sub}<br />
              <a href="https://www.basickorean.com/" target="_blank" rel="noreferrer">basickorean.com</a> ·
              <a href="https://www.youtube.com/@basickoreanBK" target="_blank" rel="noreferrer"> YouTube @basickoreanBK</a></p>
          </div>
        )}
      </React.Fragment>
    );
  }

  /* ---------- 마운트 ---------- */
  function mount() {
    const L = window.BK_LESSON;
    const el = document.getElementById("bk-lesson");
    if (!L || !el) return;
    if (el.dataset.bkMounted) return;   // 중복 마운트 방지
    el.dataset.bkMounted = "1";
    el.classList.add("bk-root");
    ReactDOM.createRoot(el).render(<App L={L} />);
  }

  window.BK = {
    version: "1.0.0",
    hangul: { decompose, compose, stemOf, JONG },
    render: mount,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
