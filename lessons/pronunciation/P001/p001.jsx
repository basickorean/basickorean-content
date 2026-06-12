/* p001.jsx — Blogger 포스트용 (소스: pronunciation-prototype/P001.html)
   babel-standalone 런타임 컴파일(임시). 필요: bk-pron.css + React18 + <div id="bk-lesson" class="bkp-root"> */

    const { useState, useEffect, useRef } = React;
    const VIDEO_ID = "oI9wswL_i5c";
    const IS_FILE = window.location.protocol === "file:";

    /* ---- 연음 엔진 ----
       ※ '직접 해 보기' 입력 도구는 제거됨 (2026-06-11) — 발음 시리즈 완성 후
         모든 법칙을 통합한 종합 발음 변환기로 부활 예정. 엔진은 그 기반으로 유지. */
    const BASE=0xAC00;
    function dec(ch){const c=ch.charCodeAt(0)-BASE; if(c<0||c>=11172)return null; return {cho:Math.floor(c/588),jung:Math.floor((c%588)/28),jong:c%28};}
    function comp(cho,jung,jong){return String.fromCharCode(BASE+cho*588+jung*28+(jong||0));}
    const J2C={1:0,2:1,4:2,7:3,8:5,16:6,17:7,19:9,20:10,22:12,23:14,24:15,25:16,26:17};
    function liaison(word){
      const a=[...word]; let out='';
      for(let i=0;i<a.length;i++){
        const cur=dec(a[i]); const nxt=i+1<a.length?dec(a[i+1]):null;
        if(cur && nxt && nxt.cho===11 && cur.jong!==0){
          if(cur.jong===27){ out+=comp(cur.cho,cur.jung,0); }
          else if(cur.jong===21){ out+=a[i]; }
          else if(J2C[cur.jong]!==undefined){ out+=comp(cur.cho,cur.jung,0); a[i+1]=comp(J2C[cur.jong],nxt.jung,nxt.jong); }
          else out+=a[i];
        } else out+=a[i];
      }
      return out;
    }
    /* 한국어 TTS — 듣기 퀴즈용 (영상 없이 발음만 들려주기). 지원 안 되면 영상 클립으로 폴백 */
    function speakKo(text, fallback){
      try{
        if(!window.speechSynthesis || !window.SpeechSynthesisUtterance){ fallback&&fallback(); return; }
        const u=new SpeechSynthesisUtterance(text);
        u.lang="ko-KR"; u.rate=0.85;
        const v=window.speechSynthesis.getVoices().find(v=>v.lang&&v.lang.indexOf("ko")===0);
        if(v) u.voice=v;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }catch(e){ fallback&&fallback(); }
    }
    /* 만점 축하 색종이 (G203과 동일) */
    function celebrate(){
      if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const colors=["#f0883c","#4fb89c","#ec6aa6","#f4d24c","#57c08a"];
      for(let i=0;i<120;i++){ const d=document.createElement("div"); d.className="confetti";
        d.style.left=Math.random()*100+"vw"; d.style.background=colors[i%colors.length];
        d.style.animation=`fall ${1.6+Math.random()*1.4}s ${Math.random()*0.4}s ease-in forwards`;
        d.style.transform=`rotate(${Math.random()*360}deg)`; document.body.appendChild(d); setTimeout(()=>d.remove(),3400); }
    }
    /* 겹받침 + 'ㅇ' 조합인지 (P002 예고용) */
    function hasDblLink(word){
      const DBL={3:1,5:1,6:1,9:1,10:1,11:1,12:1,13:1,14:1,15:1,18:1};
      const a=[...word];
      for(let i=0;i<a.length-1;i++){
        const c=dec(a[i]), n=dec(a[i+1]);
        if(c&&n&&n.cho===11&&DBL[c.jong]) return true;
      }
      return false;
    }

    function MiniPlayer({sec,onClose,label}){
      if(sec===null) return null;
      const mm=Math.floor(sec/60), ss=String(sec%60).padStart(2,"0");
      return (
        <div className="miniplayer">
          <div className="bar"><span>▶ {label} · {mm}:{ss}</span><button onClick={onClose}>×</button></div>
          {IS_FILE ? (
            <a className="vid vfallback" href={`https://youtu.be/${VIDEO_ID}?t=${sec}`} target="_blank" rel="noreferrer">
              <img src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`} alt="clip" /><span className="playbig">▶</span>
            </a>
          ) : (
            <div className="vid"><iframe key={sec} src={`https://www.youtube.com/embed/${VIDEO_ID}?start=${sec}&autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title="clip"></iframe></div>
          )}
        </div>
      );
    }
    function VideoEmbed({title}){
      if(!IS_FILE) return <div className="video"><iframe src={`https://www.youtube.com/embed/${VIDEO_ID}?rel=0`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div>;
      return <a className="video vfallback" href={`https://youtu.be/${VIDEO_ID}`} target="_blank" rel="noreferrer" title={title}><img src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`} alt={title}/><span className="playbig">▶</span></a>;
    }

    function rich(parts){
      return parts.map((p,i)=>{
        if(typeof p==="string") return <React.Fragment key={i}>{p}</React.Fragment>;
        if(p.br!==undefined) return <br key={i}/>;
        if(p.a!==undefined) return <a key={i} href={p.a.href} target="_blank" rel="noreferrer">{p.a.t}</a>;
        if(p.b!==undefined) return <b key={i}>{p.b}</b>;
        if(p.ph!==undefined) return <span key={i} className="ph">{p.ph}</span>;
        return null;
      });
    }
    /* 텍스트에서 key 부분만 className 으로 감싸기 */
    function hi(text, key, cls){
      if(!key) return text;
      const i=text.indexOf(key); if(i<0) return text;
      return [text.slice(0,i), <span key="h" className={cls}>{key}</span>, text.slice(i+key.length)];
    }

    /* 화면에 들어왔을 때 true — 애니메이션을 스크롤 도달 시점에 시작 (모바일에서 미리 끝나는 문제 방지) */
    function useInView(ref){
      const [on,setOn]=useState(false);
      useEffect(()=>{
        const el=ref.current; if(!el) return;
        if(!window.IntersectionObserver){ setOn(true); return; }
        const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ setOn(true); io.disconnect(); } }); },{threshold:0.35});
        io.observe(el); return ()=>io.disconnect();
      },[]);
      return on;
    }

    /* ===== 인트로 애니메이션: 받침이 ‘ㅇ’ 자리로 ===== */
    function AnimIntro({lang}){
      const [k,setK]=useState(0);
      const wrapRef=useRef(null);
      const inView=useInView(wrapRef);
      const reduce = typeof window!=="undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const T = lang==="ko"
        ? {title:"연음: 받침 + ‘ㅇ’ 모음", batchim:"받침", moeum:"모음", co1:"홑받침:", co2:"받침 1개", replay:"다시 보기"}
        : {title:"Linking: final consonant + ‘ㅇ’ vowel", batchim:["final","consonant"], moeum:"vowel", co1:"Single", co2:"final consonant", replay:"Replay"};
      const isArr = Array.isArray(T.batchim);
      return (
        <div className="animwrap" ref={wrapRef}>
          <button className="replay" onClick={()=>setK(k+1)}>↻ {T.replay}</button>
          {/* 제목: SVG 밖 HTML 배지 — 길어도 자동 줄바꿈, 안 잘림 */}
          <div className="animtitle">{T.title}</div>
          <svg key={k} className={inView?"anim-on":""} viewBox="0 90 520 260" role="img" aria-label={T.title}>
            {/* 빈 칸 (왼위) */}
            <rect className="av-empty" x="150" y="100" width="100" height="100" rx="16"/>
            {/* 모음 (오른위, 파랑) */}
            <rect className="av-moeum" x="290" y="100" width="100" height="100" rx="16"/>
            <text x="340" y="148" className="av-t" fontSize="38" textAnchor="middle">ㅇ</text>
            <text x="340" y="184" className="av-t" fontSize="22" textAnchor="middle">{T.moeum}</text>
            {/* 받침 (왼아래, 코랄) */}
            <rect className="av-batchim" x="150" y="216" width="100" height="100" rx="16"/>
            {isArr
              ? <text className="av-t" fontSize="18" textAnchor="middle"><tspan x="200" y="260">{T.batchim[0]}</tspan><tspan x="200" y="284">{T.batchim[1]}</tspan></text>
              : <text x="200" y="275" className="av-t" fontSize="26" textAnchor="middle">{T.batchim}</text>}
            {/* 빈 칸 (오른아래) */}
            <rect className="av-empty" x="290" y="216" width="100" height="100" rx="16"/>
            {/* 화살표: 받침 오른쪽 → 위로 → 모음 ㅇ */}
            <path className="av-arrow" d="M250 266 H272 V134 H288"/>
            <path className="av-head" d="M280 128 L290 134 L280 140"/>
            {/* 콜아웃 */}
            <g className="av-callout">
              <ellipse cx="72" cy="306" rx="70" ry="34" fill="none" stroke="var(--orange)" strokeWidth="2.5"/>
              <path d="M126 282 L148 254" stroke="var(--orange)" strokeWidth="2.5" fill="none"/>
              <text x="72" y="302" className="av-cot" fontSize="15.5" textAnchor="middle">{T.co1}</text>
              <text x="72" y="322" className="av-cot" fontSize="15.5" textAnchor="middle">{T.co2}</text>
            </g>
          </svg>
        </div>
      );
    }

    /* ===== 예시 분해 도식 (개념 애니와 같은 톤) =====
       완성형 음절을 그대로 그리고, clipPath 사각형으로 자모 영역만 색을 입힌다.
       → 자모를 낱자로 조합할 때 생기던 글자 균형 문제 해결 (폰트의 원래 비례 유지)
       spec = {ch, parts:[{c, x0,x1,y0,y1, cls}]}  좌표는 글자 상자(1em) 0~1 비율
       타입: move = 받침이 ㅇ로 이동 / drop = 받침 ㅎ 탈락 */
    const AXC = {ink:"var(--ink)", coral:"var(--orange)", blue:"var(--blue)", gray:"#c2ccc8", pink:"var(--pink)"};
    function CSyl({id, cx, y, F, spec}){
      const fam={fontFamily:"var(--display)"};
      if(!spec.parts)
        return <text x={cx} y={y} fontSize={F} textAnchor="middle" fill={AXC[spec.c||"ink"]} style={fam}>{spec.ch}</text>;
      const left=cx-F/2, top=y-0.82*F;
      return spec.parts.map((p,i)=>{
        const cid=`${id}-${i}`;
        const x0=p.x0??-0.25, x1=p.x1??1.25, y0=p.y0??-0.25, y1=p.y1??1.25;
        return (
          <g key={i}>
            <clipPath id={cid}><rect x={left+x0*F} y={top+y0*F} width={(x1-x0)*F} height={(y1-y0)*F}/></clipPath>
            <text x={cx} y={y} fontSize={F} textAnchor="middle" fill={AXC[p.c]||p.c} clipPath={`url(#${cid})`} className={p.cls||""} style={fam}>{spec.ch}</text>
          </g>
        );
      });
    }
    function AnimExample({d,lang,onPlay}){
      const [k,setK]=useState(0);
      const wrapRef=useRef(null);
      const inView=useInView(wrapRef);
      const T = lang==="ko"
        ? {batchim:"받침", moeum:"모음", listen:"발음 듣기", replay:"다시 보기"}
        : {batchim:"final consonant", moeum:"vowel", listen:"Listen", replay:"Replay"};
      const bw = lang==="ko" ? 60 : 146, bf = lang==="ko" ? 16 : 15;
      const mw = lang==="ko" ? 60 : 72;
      const isDrop = d.type==="drop";
      const bcol = isDrop ? "var(--pink)" : "var(--orange)";
      const bsoft = isDrop ? "#fbeaf0" : "var(--orange-soft)";
      return (
        <div className="animwrap" ref={wrapRef}>
          <button className="replay" onClick={()=>setK(k+1)}>↻ {T.replay}</button>
          <svg key={k} className={(inView?"anim-on ":"")+"exsvg"+(isDrop?" anim-drop":"")} viewBox="0 0 600 228" role="img">
            {/* 드래그 게임과 동일 규격 — 카드 106×118, 글자 62 (1:1 축척, max-width 600) */}
            {/* 음절 카드 A — 정사각 106×106, 여백 상하좌우 22 */}
            <rect x="40" y="70" width="106" height="106" rx="16" fill="#f7faf9" stroke="var(--line)" strokeWidth="1.5"/>
            <CSyl id={d.id+"-a"} cx={93} y={143} F={62} spec={d.s1}/>
            {/* 받침 말풍선 (move=코랄 / drop=ㅎ 핑크) */}
            <g className="av-callout">
              <path d="M88 184 L93 174 L98 184 Z" fill={bsoft} stroke={bcol} strokeWidth="1.5"/>
              <rect x={93-bw/2} y="188" width={bw} height="28" rx="14" fill={bsoft} stroke={bcol} strokeWidth="1.5"/>
              <text x="93" y={lang==="ko"?208:207} fontSize={bf} textAnchor="middle" fill={bcol} style={{fontFamily:"var(--display)"}}>{T.batchim}</text>
            </g>
            {/* 음절 카드 B */}
            <rect x="176" y="70" width="106" height="106" rx="16" fill="#f7faf9" stroke="var(--line)" strokeWidth="1.5"/>
            <CSyl id={d.id+"-b"} cx={229} y={143} F={62} spec={d.s2}/>
            {/* 모음 말풍선 (파랑) */}
            <g className="av-callout2">
              <rect x={229-mw/2} y="30" width={mw} height="28" rx="14" fill="var(--blue-soft)" stroke="var(--blue)" strokeWidth="1.5"/>
              <text x="229" y={lang==="ko"?50:49} className="ax-cot-b" fontSize={lang==="ko"?16:15} textAnchor="middle">{T.moeum}</text>
              <path d="M224 62 L229 72 L234 62 Z" fill="var(--blue-soft)" stroke="var(--blue)" strokeWidth="1.5"/>
            </g>
            {/* 국어·얼음 동일 경로 — 시작 128, 꺾임 161(카드 사이), 끝 190 (높이만 타겟 ㅇ에 맞춤) */}
            {!isDrop && <path className="ax-arrow" d={d.to==="top" ? "M128 141 H161 V104 H198" : "M128 141 H161 V119 H198"}/>}
            {!isDrop && <path className="ax-head" d={d.to==="top" ? "M190 98 L200 104 L190 110" : "M190 113 L200 119 L190 125"}/>}
            {/* drop 타입은 ㅎ 위에 ✗ 표시 */}
            {isDrop && <text className="ax-dropx" x="93" y="150" fontSize="28" textAnchor="middle" fill="var(--pink)">✗</text>}
            {/* → + 결과 카드 */}
            <g className="ax-result">
              <text x="309" y="131" fill="var(--muted)" fontSize="26" textAnchor="middle">→</text>
              <rect x="336" y="70" width="260" height="106" rx="16" fill="#f7faf9" stroke="var(--line)" strokeWidth="1.5"/>
              <text x="367" y="140" fontSize="60" textAnchor="middle" fill="var(--ink)" style={{fontFamily:"var(--display)"}}>[</text>
              <CSyl id={d.id+"-r1"} cx={407} y={143} F={62} spec={d.res[0]}/>
              <CSyl id={d.id+"-r2"} cx={469} y={143} F={62} spec={d.res[1]}/>
              <text x="509" y="140" fontSize="60" textAnchor="middle" fill="var(--ink)" style={{fontFamily:"var(--display)"}}>]</text>
              {/* 발음 듣기 버튼 — 공용 원형 ▶(34px), 상하좌우 여백 22 균등 */}
              <g style={{cursor:"pointer"}} onClick={()=>onPlay&&onPlay(d.t)} role="button" aria-label={T.listen}>
                <circle cx="557" cy="123" r="17" fill="#fff" stroke="var(--line)" strokeWidth="1.5"/>
                <text x="558" y="128" fontSize="12" textAnchor="middle" fill="var(--teal-dark)">▶</text>
              </g>
            </g>
          </svg>
        </div>
      );
    }
    /* 국어: 국(받침 ㄱ 코랄 하단) + 어(ㅇ 파랑 좌측) → [구거] (거의 ㄱ 코랄) */
    const EX_GUGEO = { id:"gugeo", type:"move", t:68,
      s1:{ch:"국", parts:[{c:"ink",y1:0.57},{c:"coral",y0:0.57}]},
      s2:{ch:"어", parts:[{c:"blue",x1:0.56},{c:"ink",x0:0.56}]},
      res:[{ch:"구"}, {ch:"거", parts:[{c:"coral",x1:0.54},{c:"ink",x0:0.54}]}] };
    /* 얼음: 얼(받침 ㄹ 코랄 하단) + 음(ㅇ 파랑 상단) → [어름] (름의 ㄹ 코랄) */
    const EX_EOREUM = { id:"eoreum", type:"move", to:"top", t:96,
      s1:{ch:"얼", parts:[{c:"ink",y1:0.52},{c:"coral",y0:0.52}]},
      s2:{ch:"음", parts:[{c:"blue",y1:0.38},{c:"ink",y0:0.38}]},
      res:[{ch:"어"}, {ch:"름", parts:[{c:"coral",y1:0.38},{c:"ink",y0:0.38}]}] };
    /* 좋아(ㅎ 탈락): 좋(받침 ㅎ 핑크 하단, 탈락 애니) + 아(ㅇ 파랑 좌측) → [조아] */
    const EX_JOA = { id:"joa", type:"drop", t:204,
      s1:{ch:"좋", parts:[{c:"ink",y1:0.50},{c:"pink",y0:0.50,cls:"ax-drop"}]},
      s2:{ch:"아", parts:[{c:"blue",x1:0.54},{c:"ink",x0:0.54}]},
      res:[{ch:"조"}, {ch:"아"}] };

    /* ===== 받침 드래그 게임 — 받침을 직접 ‘ㅇ’ 자리로 옮겨 보기 ===== */
    /* HTML용 자모 부분 색칠 (완성형 N겹 + clip — bk-jamo.js와 같은 방식·보정값) */
    function HSyl({ch,parts}){
      if(!parts||!parts.length) return <span>{ch}</span>;
      return (
        <span style={{position:"relative",display:"inline-block",lineHeight:1}}>
          <span>{ch}</span>
          {parts.map((p,i)=>{
            const r=p.r, ins=`inset(${r[2]*100}% ${(1-r[1])*100}% ${(1-r[3])*100}% ${r[0]*100}%)`;
            return <span key={i} aria-hidden="true" style={{position:"absolute",left:0,top:0,color:`var(--${p.color})`,clipPath:ins,WebkitClipPath:ins}}>{ch}</span>;
          })}
        </span>
      );
    }
    /* 단어·어미·조사 결합형 5개 — 위 예시와 다른 단어에 규칙을 직접 적용해 보는 단계.
       chips: 옮길 받침 (from번째 글자 → to번째 글자). drop=ㅎ 탈락. 마지막은 연음 2회 도전. */
    const DRAGS=[
      {word:"먹이", chips:[{j:"ㄱ",from:0,to:1}]},
      {word:"놀이", chips:[{j:"ㄹ",from:0,to:1}]},
      {word:"웃어", chips:[{j:"ㅅ",from:0,to:1}]},
      {word:"넣어", chips:[{j:"ㅎ",from:0,to:1,drop:true}]},
      {word:"음악을", chips:[{j:"ㅁ",from:0,to:1},{j:"ㄱ",from:1,to:2}], challenge:true},
    ];
    const CHO_OF={"ㄱ":0,"ㄴ":2,"ㄷ":3,"ㄹ":5,"ㅁ":6,"ㅂ":7,"ㅅ":9,"ㅈ":12,"ㅊ":14,"ㅋ":15,"ㅌ":16,"ㅍ":17,"ㅎ":18};
    const V_TOP={8:1,12:1,13:1,17:1,18:1};   // ㅗㅛㅜㅠㅡ — ㅇ이 글자 위쪽에 있는 모음
    /* 글자별 색 영역 보정값 (없으면 기본값 사용) */
    const REG_BAT={"먹":[0,1,0.55,1],"놀":[0,1,0.48,1],"웃":[0,1,0.55,1],"넣":[0,1,0.47,1],"음":[0,1,0.54,1],"악":[0,1,0.56,1],"막":[0,1,0.52,1]};
    const REG_ON={"이":[0,0.56,0,1],"어":[0,0.56,0,1],"기":[0,0.56,0,1],"리":[0,0.64,0,1],"서":[[0,0.52,0,1],[0,0.70,0.58,1]],
                  "을":[0,1,0,0.34],"글":[0,1,0,0.32],"악":[0,0.60,0,0.56],"막":[0,0.60,0,0.56],"마":[0,0.60,0,1]};
    /* placed 상태에 따라 카드 i의 글자·색을 계산 (한글 조합 엔진 재사용) */
    function sylView(word,chips,placed,i){
      const d0=dec(word[i]); let cho=d0.cho, jong=d0.jong;
      chips.forEach((c,k)=>{ if(placed[k]){ if(c.from===i) jong=0; if(c.to===i&&!c.drop) cho=CHO_OF[c.j]; } });
      const ch=comp(cho,d0.jung,jong);
      const onR = REG_ON[ch] || (V_TOP[d0.jung]?[0,1,0,0.38]:[0,0.52,0,1]);
      const parts=[];
      /* r이 사각형 1개 또는 여러 개(대각선 자모용 — ㅅ 등) 모두 지원 */
      const push=(color,r)=>{ if(Array.isArray(r[0])) r.forEach(rr=>parts.push({color,r:rr})); else parts.push({color,r}); };
      chips.forEach((c,k)=>{
        if(c.from===i&&!placed[k]) push(c.drop?"pink":"orange", REG_BAT[ch]||[0,1,0.55,1]);
        if(c.to===i&&!placed[k])  push("blue", onR);
        if(c.to===i&&placed[k]&&!c.drop) push("orange", onR);
      });
      return {ch,parts};
    }
    function DragGame({lang}){
      const [wi,setWi]=useState(0);
      const [placed,setPlaced]=useState({});
      const [pos,setPos]=useState(null);     // {k,x,y} 드래그 중 칩
      const [sel,setSel]=useState(null);     // 탭 모드로 선택된 칩 idx
      const [hot,setHot]=useState(null);     // 드래그 중 올라간 목표 카드 idx
      const cardRefs=useRef([]), chipRefs=useRef([]), start=useRef(null);
      const d=DRAGS[wi];
      const syls=[...d.word];
      const solved=d.chips.every((_,k)=>placed[k]);
      const isSm=syls.length>2;
      const ALL=Object.fromEntries(d.chips.map((_,k)=>[k,true]));
      const inTarget=(k)=>{
        const c=chipRefs.current[k], z=cardRefs.current[d.chips[k].to]; if(!c||!z) return false;
        const cr=c.getBoundingClientRect(), zr=z.getBoundingClientRect();
        const cx=cr.left+cr.width/2, cy=cr.top+cr.height/2;
        return cx>zr.left-10&&cx<zr.right+10&&cy>zr.top-10&&cy<zr.bottom+10;
      };
      const place=(k)=>{ setPlaced(p=>({...p,[k]:true})); setPos(null); setSel(null); setHot(null); };
      const down=(k)=>(e)=>{ if(placed[k]) return; e.preventDefault();
        if(e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
        start.current={k,x:e.clientX,y:e.clientY,moved:false}; };
      const move=(e)=>{ const s=start.current; if(!s) return;
        const dx=e.clientX-s.x, dy=e.clientY-s.y;
        if(Math.abs(dx)+Math.abs(dy)>5) s.moved=true;
        setPos({k:s.k,x:dx,y:dy}); setHot(inTarget(s.k)?d.chips[s.k].to:null); };
      const up=()=>{ const s=start.current; if(!s) return; start.current=null; setHot(null);
        if(s.moved&&inTarget(s.k)) place(s.k);
        else if(!s.moved){ setSel(v=>v===s.k?null:s.k); setPos(null); }
        else setPos(null); };
      const cardTap=(i)=>{ if(sel!==null&&d.chips[sel].to===i&&!placed[sel]) place(sel); };
      const isZone=(i)=>d.chips.some((c,k)=>!placed[k]&&c.to===i);
      const resWord=syls.map((s,i)=>sylView(d.word,d.chips,ALL,i).ch).join("");   // 결과 발음 (TTS용)
      const next=()=>{ setWi((wi+1)%DRAGS.length); setPlaced({}); setPos(null); setSel(null); setHot(null); };
      const prev=()=>{ if(wi>0){ setWi(wi-1); setPlaced({}); setPos(null); setSel(null); setHot(null); } };
      return (
        <div className="dragwrap">
          <div className="draghead">
            <span>🖐 {lang==="ko"?"직접 옮겨 보세요!":"Your turn — move it yourself!"}
              {d.challenge && <span className="chal">{lang==="ko"?"도전!":"Challenge!"}</span>}</span>
            <span className="cnt">{wi+1} / {DRAGS.length}</span>
          </div>
          <div className="dragrow">
            {syls.map((s,i)=>{
              const v=sylView(d.word,d.chips,placed,i);
              return (
                <div className="dsylwrap" key={wi+"-"+i}>
                  <div ref={el=>cardRefs.current[i]=el}
                    className={"dsyl"+(isZone(i)?" zone":"")+(hot===i?" hot":"")}
                    onClick={()=>cardTap(i)}>
                    <HSyl ch={v.ch} parts={v.parts}/>
                  </div>
                  {d.chips.map((c,k)=> c.from===i && !placed[k] ? (
                    <div key={k} ref={el=>chipRefs.current[k]=el}
                      className={"dchip"+(c.drop?" pink":"")+(sel===k?" sel":"")+((!pos||pos.k!==k)&&sel!==k?" idle":"")}
                      style={pos&&pos.k===k?{transform:"translate("+pos.x+"px,"+pos.y+"px)"}:null}
                      onPointerDown={down(k)} onPointerMove={move} onPointerUp={up}
                      role="button" aria-label={(lang==="ko"?"받침 ":"final consonant ")+c.j}>{c.j}</div>
                  ) : null)}
                </div>
              );
            })}
            {/* 옮긴 후 작은 요약 (자리는 처음부터 확보 — 카드가 안 움직이게) */}
            <span className={"dsum"+(solved?" show":"")} aria-hidden={!solved}>
              {syls.map((s,i)=>{const v=sylView(d.word,d.chips,{},i); return <HSyl key={i} ch={v.ch} parts={v.parts}/>;})}
              <span className="darrow">→</span>
              [{syls.map((s,i)=>{const v=sylView(d.word,d.chips,ALL,i); return <HSyl key={i} ch={v.ch} parts={v.parts}/>;})}]
              <button className="tplay dplay" onClick={()=>speakKo(resWord)} aria-label={lang==="ko"?"발음 듣기":"Listen"}>▶</button>
            </span>
          </div>
          <div className="dfoot">
            <button className="cta ghost" onClick={prev} style={wi>0?null:{visibility:"hidden"}} aria-hidden={wi===0}>← {lang==="ko"?"이전 단어":"Previous"}</button>
            {solved
              ? <p className="dmsg">{d.challenge
                  ? (lang==="ko"?"🎉 연음이 두 번 일어났어요!":"🎉 Linking happened twice!")
                  : d.chips[0].drop
                    ? (lang==="ko"?"💥 ㅎ은 옮겨 가지 않고 탈락해요!":"💥 ㅎ doesn’t move — it drops!")
                    : (lang==="ko"?"🎉 받침이 ‘ㅇ’ 자리로 옮겨 갔어요!":"🎉 The final consonant slid into the ‘ㅇ’ slot!")}
                  {wi===DRAGS.length-1 && <span> {lang==="ko"?"— 모두 완료! 👏":"— all done! 👏"}</span>}
                  <button className="cta" onClick={next}>{wi<DRAGS.length-1
                    ? (lang==="ko"?"다음 단어 →":"Next word →")
                    : (lang==="ko"?"처음부터 다시 ↻":"Start over ↻")}</button></p>
              : <p className="dhint">{lang==="ko"
                  ? "받침 동그라미를 끌어서 ‘ㅇ’ 글자 칸에 놓아 보세요. (동그라미를 탭한 뒤 칸을 탭해도 돼요)"
                  : "Drag the circle onto the ‘ㅇ’ box. (Or tap the chip, then tap the box.)"}</p>}
          </div>
        </div>
      );
    }

    const CT = {
      ko:{
        langA:"한글", langB:"EN",
        kicker:"한국어 발음 01 · Korean Pronunciation",
        heroEx:"‘한국어 발음’이라고 쓰지만 [한구거 바름]이라고 발음해요.",
        heroSub:"— 받침이 뒤 모음의 ‘ㅇ’ 자리로 옮겨 가서 소리 나는 현상",
        c1_l:"개념", c1_h:"연음이란?",
        prereq:"사전 지식: 받침(글자 아래 자음)과 모음을 구분할 수 있으면 충분해요.",
        c1_p:[
          ["받침으로 끝나는 글자가 ",{b:"‘ㅇ’으로 시작하는(=모음) 글자"}," 와 만나면,"],
          ["그 받침이 뒤 글자의 ",{b:"‘ㅇ’ 자리로 옮겨 가서"}," 소리 나요. 이걸 ",{b:"연음"},"이라고 해요."],
          ["오늘은 받침이 한 개인 ",{b:"홑받침"},"의 경우를 배워요."],
        ],
        viz_l:"소리 나는 원리", viz_h:"받침이 옮겨 가요",
        viz_note:"받침이 뒤에 오는 모음 ‘ㅇ’으로 옮겨서 발음해요.",
        table_l:"받침별 발음", table_h:"받침마다 어떻게 소리 날까?",
        table_intro:"받침이 모음을 만났을 때, 받침은 보통 그 소리 그대로 옮겨 가요. 파란 글자가 실제로 소리가 바뀌는 부분이에요.",
        th:["받침","예문","발음"],
        legend:[["var(--blue)","소리가 옮겨온 글자"],["var(--orange)","연음이 일어나는 원래 글자"]],
        note_l:"주의", note_h:"꼭 기억할 두 가지",
        notes:[
          ["①  ",{b:"받침 + 모음"},": 받침 뒤에 모음이 오면 받침은 ",{b:"그대로"}," 발음해요.",{br:1},
           "※ ",{b:"받침 + 자음"},": 받침 뒤에 자음이 오면 받침은 ",{ph:"[받침소리 7개]"},"로 바꿔서 발음해요 — ",{a:{t:"한글 ‘받침소리 7개’ 강의",href:"https://www.basickorean.com/2018/10/03-01.html"}},"에서 배워요."],
          ["②  받침 ",{b:"‘ㅎ’은 모음 앞에서 탈락"},"해요 — ‘좋아’ → ",{ph:"[조아]"},", ‘낳아요’ → ",{ph:"[나아요]"},"."],
        ],
        listen_l:"듣고 따라 하기", listen_h:"문장으로 연습하기",
        listen_intro:"발음 표기를 보면서 듣고, 소리 내어 따라 읽어 보세요. 한 번 읽을 때마다 동그라미를 채워 보세요 — 목표는 3번!",
        listen_rep:"소리 내어 읽기 체크",
        listen_toggle:["발음 보기","발음 숨기기"],
        quiz_l:"퀴즈", quiz_h:"발음 고르기",
        quiz_intro:"맞는 발음을 골라 보세요.",
        retry:"다시 풀기",
        review_l:"정리", review_h:"오늘 배운 것",
        review:[
          [{b:"연음 (받침 + 모음)"},": 받침이 모음으로 시작하는 글자를 만나면, 모음에 있는 ‘ㅇ’ 자리로 옮겨 가서 소리 나요."],
          ["받침은 ",{b:"소리 그대로"}," 옮겨 가요. (ㅅ→ㅅ, ㅈ→ㅈ …)"],
          ["받침 ‘ㅎ’은 모음 앞에서 ",{b:"탈락"},"해요."],
        ],
        video_l:"영상", video_h:"강의 영상으로 복습",
        next_l:"다음 학습",
        footer_sub:"한국어 발음 01 · 연음 (Linking)",
      },
      en:{
        langA:"한글", langB:"EN",
        kicker:"Korean Pronunciation 01",
        heroEx:"You write ‘한국어 발음’ but say [한구거 바름].",
        heroSub:"— a final consonant slides into the ‘ㅇ’ slot of the next vowel",
        c1_l:"Concept", c1_h:"What is 연음 (linking)?",
        prereq:"Good to know first: telling a final consonant from a vowel.",
        c1_p:[
          ["When a syllable ending in a final consonant meets a syllable that ",{b:"starts with ‘ㅇ’ (a vowel)"},","],
          ["that final consonant ",{b:"moves into the ‘ㅇ’ slot"}," of the next syllable. This is called ",{b:"연음 (linking)"},"."],
          ["Today we cover the ",{b:"single final consonant"}," case."],
        ],
        viz_l:"How it works", viz_h:"The final consonant slides over",
        viz_note:"The final consonant moves into the following vowel ‘ㅇ’ and is pronounced there.",
        table_l:"By final consonant", table_h:"How does each final consonant sound?",
        table_intro:"Before a vowel, a final consonant usually carries its own sound straight over. The blue letter is the part whose sound actually moves.",
        th:["Final consonant","Example","Pronounced"],
        legend:[["var(--blue)","sound that moved over"],["var(--orange)","word where linking happens"]],
        note_l:"Watch out", note_h:"Two things to remember",
        notes:[
          ["①  ",{b:"Final consonant + vowel"},": before a vowel, the final consonant is pronounced ",{b:"as-is"},".",{br:1},
           "※ ",{b:"Final consonant + consonant"},": before a consonant, it changes to one of the ",{ph:"[7 final sounds]"}," — see the ",{a:{t:"Hangul ‘7 final sounds’ lesson",href:"https://www.basickorean.com/2018/10/03-01.html"}}," (in Korean)."],
          ["②  Final ",{b:"‘ㅎ’ drops before a vowel"}," — ‘좋아’ → ",{ph:"[조아]"},", ‘낳아요’ → ",{ph:"[나아요]"},"."],
        ],
        listen_l:"Listen & repeat", listen_h:"Practice with sentences",
        listen_intro:"Read along with the pronunciation, then say it aloud. Fill a circle each time you say it — aim for three!",
        listen_rep:"Read-aloud check",
        listen_toggle:["Show pronunciation","Hide pronunciation"],
        quiz_l:"Quiz", quiz_h:"Pick the right sound",
        quiz_intro:"Choose the correct pronunciation.",
        retry:"Try again",
        review_l:"Review", review_h:"What we learned",
        review:[
          [{b:"연음 (final consonant + vowel)"},": when a final consonant meets a syllable starting with a vowel, it moves into the vowel’s ‘ㅇ’ slot and is pronounced there."],
          ["The final consonant carries its ",{b:"own sound"}," over (ㅅ→ㅅ, ㅈ→ㅈ …)."],
          ["Final ‘ㅎ’ ",{b:"drops"}," before a vowel."],
        ],
        video_l:"Video", video_h:"Review with the lecture video",
        next_l:"Keep learning",
        footer_sub:"Korean Pronunciation 01 · Linking (연음)",
      },
    };

    /* 받침별 발음 표 — 15개 전부. ex/key=원래 글자(코랄), ph/phKey=발음 바뀐 글자(파랑) */
    /* t = 영상에서 해당 받침 예문이 나오는 지점(초) — 발음 듣기 버튼에 사용 */
    const ROWS = [
      {j:"ㄱ", sent:["한국어는 재미있어요.","Korean is fun."], key:"국어", ph:"한구거는 재미이써요", phKey:"구거", t:234},
      {j:"ㄴ", sent:["창문을 닫아 주세요.","Please close the window."], key:"닫아", ph:"창무늘 다다 주세요", phKey:"다다", t:248},
      {j:"ㄷ", sent:["당신을 믿어요.","I trust you."], key:"믿어", ph:"당시늘 미더요", phKey:"미더", t:262},
      {j:"ㄹ", sent:["물이 차가워요.","The water is cold."], key:"물이", ph:"무리 차가워요", phKey:"무리", t:276},
      {j:"ㅁ", sent:["이름이 뭐예요?","What's your name?"], key:"이름이", ph:"이르미 뭐예요", phKey:"이르미", t:289},
      {j:"ㅂ", sent:["밥을 먹어요.","I eat a meal."], key:"밥을", ph:"바블 머거요", phKey:"바블", t:303},
      {j:"ㅅ", sent:["옷이 예뻐요.","The clothes are pretty."], key:"옷이", ph:"오시 예뻐요", phKey:"오시", t:317},
      {j:"ㅇ", sent:["가방이 싸네요.","The bag is cheap."], key:"가방이", ph:"가방이 싸네요", phKey:"", tag:{ko:"변화 없음",en:"no change"}, mark:"none", t:335},
      {j:"ㅈ", sent:["사람을 찾아요.","I look for someone."], key:"찾아", ph:"사라믈 차자요", phKey:"차자", t:355},
      {j:"ㅊ", sent:["꽃이 예뻐요.","The flower is pretty."], key:"꽃이", ph:"꼬치 예뻐요", phKey:"꼬치", t:382},
      {j:"ㅋ", sent:["부엌에 있어요.","It's in the kitchen."], key:"부엌에", ph:"부어케 이써요", phKey:"부어케", t:403},
      {j:"ㅌ", sent:["공부하는 것 같아요.","Seems they're studying."], key:"같아요", ph:"공부하는 걷 가타요", phKey:"가타요", t:429},
      {j:"ㅎ", sent:["좋아요!","I like it!"], key:"좋아요", ph:"조아요", phKey:"조아요", mark:"drop", tag:{ko:"ㅎ 탈락",en:"ㅎ drops"}, t:456},
      {j:"ㄲ", sent:["창문을 닦아요.","I wipe the window."], key:"닦아요", ph:"창무늘 다까요", phKey:"다까요", t:500},
      {j:"ㅆ", sent:["집에 있어요.","I'm at home."], key:"있어요", ph:"지베 이써요", phKey:"이써요", t:521},
    ];

    const LISTEN = [
      { t:54,  seg:[{tx:"한국어",pr:"한구거"},{tx:" 공부는 "},{tx:"재미있어요",pr:"재미이써요"},{tx:"."}] },
      { t:95,  seg:[{tx:"얼음이",pr:"어르미"},{tx:" "},{tx:"녹았어요",pr:"노가써요"},{tx:"."}] },
      { t:160, seg:[{tx:"옷이",pr:"오시"},{tx:" 정말 예뻐요."}] },
      { t:204, seg:[{tx:"좋아요",pr:"조아요"},{tx:"! 내일 봐요."}] },
    ];
    const QUIZ = [
      { word:"국어",  opts:["[구거]","[국어]","[구어]"], a:0, ex:{ko:"받침 ㄱ이 ㅇ 자리로 → [구거].", en:"ㄱ slides into the ㅇ slot → [구거]."} },
      { word:"옷이",  opts:["[오디]","[오시]","[옫이]"], a:1, ex:{ko:"ㅅ은 [ㄷ]이 아니라 ‘ㅅ’ 그대로 → [오시].", en:"ㅅ stays ‘ㅅ’, not [ㄷ] → [오시]."} },
      { listen:true, say:"이르미", t:289, opts:["이르미","이름이","일므이"], a:1, ex:{ko:"[이르미]로 들리지만, 글자는 ‘이름이’예요 — 받침 ㅁ이 ㅇ 자리로 옮겨 갔어요.", en:"You hear [이르미], but it’s written ‘이름이’ — final ㅁ slid into the ㅇ slot."} },
      { word:"좋아",  opts:["[조하]","[조타]","[조아]"], a:2, ex:{ko:"받침 ㅎ은 모음 앞에서 탈락 → [조아].", en:"Final consonant ㅎ drops before a vowel → [조아]."} },
      { word:"꽃이",  opts:["[꼬치]","[꼬디]","[꼳이]"], a:0, ex:{ko:"ㅊ도 그대로 옮겨 가요 → [꼬치].", en:"ㅊ carries over as-is → [꼬치]."} },
      { word:"밥을",  opts:["[바블]","[밥을]","[바을]"], a:0, ex:{ko:"받침 ㅂ이 ㅇ 자리로 → [바블].", en:"ㅂ slides into the ㅇ slot → [바블]."} },
      { listen:true, say:"부어케", t:403, opts:["부어케","부엌케","부엌에"], a:2, ex:{ko:"[부어케]로 들리지만, 글자는 ‘부엌에’예요 — 받침 ㅋ이 옮겨 갔어요.", en:"You hear [부어케], but it’s written ‘부엌에’ — final ㅋ slid over."} },
    ];
    /* ※ 받아쓰기(spell) 문제는 퀴즈에서 제외 (2026-06-12) — mp3 녹음 후 별도 '받아쓰기 페이지'로.
       SpellInput 등 렌더링 코드는 유지 — 데이터만 넣으면 다시 동작 */

    function Listen({t,onPlay}){
      const [show,setShow]=useState(true);
      const [reps,setReps]=useState({});   // 문장별 따라 읽은 횟수 (0~3)
      return (
        <div className="dlg">
          <button className="ptoggle" onClick={()=>setShow(v=>!v)}>{show?"🐾 "+t.listen_toggle[1]:"🔍 "+t.listen_toggle[0]}</button>
          <p className="muted" style={{marginTop:0}}>{t.listen_intro}</p>
          {LISTEN.map((ln,i)=>(
            <div className="pline" key={i}>
              <button className="playbtn" onClick={()=>onPlay(ln.t)} title="▶">▶</button>
              {ln.seg.map((s,j)=> s.pr
                ? <span className="pw" key={j}>{s.tx}{show && <small className="pr">[{s.pr}]</small>}</span>
                : <React.Fragment key={j}>{s.tx}</React.Fragment>)}
              <span className="reps" title={t.listen_rep}>
                {[1,2,3].map(n=>(
                  <button key={n} className={"repdot"+((reps[i]||0)>=n?" on":"")}
                    onClick={()=>setReps(p=>({...p,[i]:(p[i]||0)>=n?n-1:n}))}
                    aria-label={t.listen_rep+" "+n+"/3"}/>
                ))}
              </span>
            </div>
          ))}
        </div>
      );
    }

    /* 받아쓰기 입력 (spell 타입 문제) */
    function SpellInput({shown,val,lang,onSubmit}){
      const [v,setV]=useState("");
      const submit=()=>{ const s=v.trim(); if(!shown && s) onSubmit(s); };
      return (
        <div className="io">
          <input value={shown?(typeof val==="string"?val:""):v} onChange={e=>setV(e.target.value)} disabled={shown}
            placeholder={lang==="ko"?"글자로 입력":"Type here"} spellCheck="false"
            onKeyDown={e=>{ if(e.key==="Enter") submit(); }}/>
          {!shown && <button className="cta" onClick={submit}>{lang==="ko"?"확인":"Check"}</button>}
        </div>
      );
    }
    function Quiz({t,lang,onPlay,onComplete,idxs}){
      const list = (idxs || QUIZ.map((_,i)=>i)).filter(i=>QUIZ[i]);   // 풀 문제의 QUIZ 인덱스 목록 (범위 밖 번호 방어)
      const [idx,setIdx]=useState(0);
      const [picked,setPicked]=useState({});
      const [fin,setFin]=useState(false);
      const TOTAL=list.length;
      const isRight=(q,p)=> q.spell ? (typeof p==="string" && p.trim()===q.answer) : p===q.a;
      const correct=list.reduce((n,qi,i)=>n+(isRight(QUIZ[qi],picked[i])?1:0),0);
      const C=2*Math.PI*23;
      const reset=()=>{setPicked({});setIdx(0);setFin(false);};
      if(fin){
        const wrong=list.map((qi,i)=>({q:QUIZ[qi],i})).filter(({q,i})=>!isRight(q,picked[i]));
        return (
          <div>
            <div className="panel" style={{textAlign:"center"}}>
              <svg className="ring" viewBox="0 0 54 54"><circle className="bg" cx="27" cy="27" r="23"/><circle className="fg" cx="27" cy="27" r="23" strokeDasharray={C} strokeDashoffset={C*(1-correct/TOTAL)}/></svg>
              <p style={{fontFamily:"var(--display)",fontSize:24,margin:"10px 0 4px"}}>🎉 <b style={{color:"var(--blue)"}}>{correct}</b> / {TOTAL}</p>
              {correct===TOTAL && <p className="mtitle">🏆 {lang==="ko"?"연음 마스터!":"Linking Master!"}</p>}
              <button className="cta" onClick={reset}>{t.retry}</button>
            </div>
            {wrong.length>0 && <div className="panel" style={{marginTop:12}}>
              {wrong.map(({q,i})=>(<div className="wrongline" key={i}><b>{q.word||"🔊"}</b> → <b>{q.spell?q.answer:q.opts[q.a]}</b><br/><span className="muted">{q.ex[lang]}</span></div>))}
            </div>}
          </div>
        );
      }
      const q=QUIZ[list[idx]]; const sel=picked[idx]; const shown=sel!==undefined;
      const pick=(oi)=>{ if(shown) return; setPicked(p=>({...p,[idx]:oi})); };
      const next=()=>{ if(idx<TOTAL-1) setIdx(idx+1); else { setFin(true);
        if(correct===TOTAL) celebrate();
        onComplete&&onComplete(correct, list.filter((qi,i)=>!isRight(QUIZ[qi],picked[i]))); } };
      return (
        <div>
          <p className="muted">{t.quiz_intro}</p>
          <div className="qstep-top">
            <span className="qcount">{lang==="ko"?"문제":"Question"} {idx+1} / {TOTAL}</span>
            <div className="qbar"><div className="qbar-fill" style={{width:((idx+(shown?1:0))/TOTAL*100)+"%"}}/></div>
          </div>
          <div className="q">
            <div className="prompt">{(q.listen||q.spell)
              ? <React.Fragment><button className="playbtn qplay" onClick={()=>speakKo(q.say, ()=>onPlay&&onPlay(q.t))} aria-label="play">▶</button>
                  {q.spell
                    ? (lang==="ko"?"잘 듣고 — 글자로 어떻게 쓸까요?":"Listen — how is it written?")
                    : (lang==="ko"?"잘 듣고 — 어떤 단어를 발음했을까요?":"Listen — which word was pronounced?")}</React.Fragment>
              : <React.Fragment>{lang==="ko"?"‘":""}<b>{q.word}</b>{lang==="ko"?"’의 발음은?":" is pronounced…"}</React.Fragment>}</div>
            {q.spell
              ? <SpellInput key={list[idx]} shown={shown} val={sel} lang={lang} onSubmit={(v)=>setPicked(p=>({...p,[idx]:v}))}/>
              : <div className="opts">
                  {q.opts.map((o,oi)=>{ let cls="opt"; if(shown){ if(oi===q.a)cls+=" correct"; else if(oi===sel)cls+=" wrong"; }
                    return <button key={oi} className={cls} disabled={shown} onClick={()=>pick(oi)}>{o}</button>; })}
                </div>}
            {shown && <div className="explain">{isRight(q,sel)?"✓ ":"✗ "}{q.spell&&!isRight(q,sel)?(lang==="ko"?("정답: "+q.answer+". "):("Answer: "+q.answer+". ")):""}{q.ex[lang]}</div>}
          </div>
          {shown && <div style={{textAlign:"right",marginTop:12}}><button className="cta" onClick={next}>{idx<TOTAL-1?(lang==="ko"?"다음 →":"Next →"):(lang==="ko"?"결과 보기 🎉":"Results 🎉")}</button></div>}
        </div>
      );
    }

    function App(){
      /* 언어 = URL 규칙: ...-en.html이면 영어판. 토글은 상대편 글로 이동 */
      const IS_EN = /-en\.html$/.test(window.location.pathname);
      const [lang] = useState(IS_EN ? "en" : "ko");
      const pick = (v)=>{ const en = v==="en"; if(en===IS_EN) return;
        const path = window.location.pathname;
        window.location.href = en ? path.replace(/\.html$/,"-en.html") : path.replace(/-en\.html$/,".html"); };
      useEffect(()=>{  /* hreflang 주입 — KO/EN 글을 같은 내용의 언어판으로 연결 */
        const path = window.location.pathname; if(!/\.html$/.test(path)) return;
        const ko = path.replace(/-en\.html$/,".html"), en = ko.replace(/\.html$/,"-en.html");
        [["ko",ko],["en",en],["x-default",ko]].forEach(([hl,href])=>{
          if(document.querySelector('link[rel="alternate"][hreflang="'+hl+'"]')) return;
          const l=document.createElement("link"); l.rel="alternate"; l.hreflang=hl;
          l.href=window.location.origin+href; document.head.appendChild(l);
        });
      },[]);
      const [clip,setClip]=useState(null);
      const [showPh,setShowPh]=useState(true);      // 받침표: 발음 열 보기/숨기기
      /* 학습 완료·최고 기록 (G203과 동일 패턴) */
      const [done,setDone]=useState(()=>{try{return localStorage.getItem("bk_done_P001")==="1";}catch(e){return false;}});
      const [best,setBest]=useState(()=>{try{const v=localStorage.getItem("bk_best_P001");return v?parseInt(v):null;}catch(e){return null;}});
      /* 저장된 틀린 문제 번호 검증 — 문제 수가 바뀌면 범위 밖 번호가 남아 에러 나는 것 방지 */
      const [wrongSaved,setWrongSaved]=useState(()=>{try{
        const v=JSON.parse(localStorage.getItem("bk_wrong_P001")||"[]");
        return (Array.isArray(v)?v:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<QUIZ.length);
      }catch(e){return [];}});
      const [retryIdxs,setRetryIdxs]=useState(null);
      const saveWrong=(w)=>{ setWrongSaved(w); try{localStorage.setItem("bk_wrong_P001",JSON.stringify(w));}catch(e){} };
      const quizDone=(c,w)=>{ setDone(true); saveWrong(w||[]); setBest(b=>{const nb=(b===null?c:Math.max(b,c));
        try{localStorage.setItem("bk_best_P001",String(nb));localStorage.setItem("bk_done_P001","1");localStorage.setItem("bk_date_P001",String(Date.now()));}catch(e){} return nb;}); };
      const retryDone=(c,w)=>{ saveWrong(w||[]); };
      /* 3일 후 복습 배너 (G203과 동일 패턴) */
      const [review,setReview]=useState(()=>{try{
        const d=localStorage.getItem("bk_date_P001");
        if(!d || localStorage.getItem("bk_done_P001")!=="1") return null;
        const days=Math.floor((Date.now()-parseInt(d))/86400000);
        return days>=3 ? days : null;
      }catch(e){return null;}});
      const t=CT[lang];
      let n=0; const num=()=>++n;
      return (
        <React.Fragment>
          {/* 블로그 스킨이 로고·내비 제공 — 토글만 본문 상단에 */}
          <div className="wrap" style={{display:"flex",justifyContent:"flex-end",paddingTop:14}}>
            <div className="langtoggle">
              <button className={lang==="ko"?"on":""} onClick={()=>pick("ko")}>{t.langA}</button>
              <button className={lang==="en"?"on":""} onClick={()=>pick("en")}>{t.langB}</button>
            </div>
          </div>

          <header className="hero"><div className="wrap">
            <span className="kicker">{t.kicker}</span>
            {done && <span className="donebadge">✓ {lang==="ko"?"학습 완료":"Completed"}</span>}
            <h1>연음 <span className="ph">Linking</span></h1>
            <div className="ex">{t.heroEx}<small>{t.heroSub}</small></div>
          </div></header>

          <div className="wrap">
            {/* 복습 배너 — 완료 3일 후 재방문 시 */}
            {review!==null && (
              <div className="revbanner">
                <span>📅 {lang==="ko"
                  ? review+"일 전에 연음을 배웠어요. 기억이 잘 나는지 복습 퀴즈로 확인해 볼까요?"
                  : "You studied linking "+review+" days ago — quick review quiz?"}</span>
                <button className="cta" onClick={()=>{const el=document.getElementById("quizsec"); if(el) el.scrollIntoView({behavior:"smooth"}); setReview(null);}}>{lang==="ko"?"복습 퀴즈 →":"Review quiz →"}</button>
                <button className="x" aria-label="close" onClick={()=>setReview(null)}>×</button>
              </div>
            )}
            {/* 개념 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.c1_l}</div>
              <h2 className="head">{t.c1_h}</h2>
              <p className="prereq">📌 {t.prereq}</p>
              <div className="card"><ul>{t.c1_p.map((l,i)=><li key={i}>{rich(l)}</li>)}</ul></div>
              {/* 듣기 한 줄 — 규칙을 읽은 직후 귀로 확인 (영상 3:54 구간) */}
              <div className="hearcard">
                <div className="hearrow">
                  <span className="hearsent">🔊 “이<span className="hsrc">름이</span> 뭐예요?”
                    {lang==="en" && <span className="hen">What’s your name?</span>}</span>
                  <span className="hearplay"><span>{lang==="ko"?"직접 들어보세요":"Listen first"}</span>
                    <button className="tplay" onClick={()=>setClip(289)} aria-label={lang==="ko"?"직접 들어보세요":"Listen"}>▶</button></span>
                </div>
                <p className="hearcap">{lang==="ko"
                  ? "색이 있는 부분이 오늘 배울 ‘연음’이 일어나는 곳이에요. 어떻게 소리 나는지 먼저 들어보세요."
                  : "The colored parts are where today’s linking (연음) happens. Listen to how they actually sound."}</p>
              </div>
            </section>

            {/* 소리 나는 원리 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.viz_l}</div>
              <h2 className="head">{t.viz_h}</h2>
              <AnimIntro lang={lang} />

              <div className="subhead">{lang==="ko"?"● 기본 규칙":"● Basic rule"}
                <span className="excdiv">·</span>
                <span className="exctext">{lang==="ko"?"받침은 소리 그대로 옮겨 가요.":"The final consonant slides over as-is."}</span></div>
              {/* 국어 분해 도식 (개념 애니와 같은 톤) */}
              <AnimExample d={EX_GUGEO} lang={lang} onPlay={setClip} />
              <AnimExample d={EX_EOREUM} lang={lang} onPlay={setClip} />

              <div className="excpanel">
                <p className="exchead">⚠ {lang==="ko"?"예외 — ㅎ 받침":"Exception — final ㅎ"}
                  <span className="excdiv">·</span>
                  <span className="exctext">{lang==="ko"?"받침 ‘ㅎ’은 옮겨 가지 않고 사라져요(탈락).":"Final ‘ㅎ’ doesn’t move — it drops."}</span></p>
                <AnimExample d={EX_JOA} lang={lang} onPlay={setClip} />
              </div>

              <div style={{marginTop:20}}><DragGame lang={lang} /></div>

              <p className="muted" style={{marginTop:14,textAlign:"center"}}>{t.viz_note}</p>
            </section>

            {/* 받침별 발음 표 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.table_l}</div>
              <h2 className="head">{t.table_h}</h2>
              <button className="ptoggle" onClick={()=>setShowPh(v=>!v)}>{showPh?"🐾 "+t.listen_toggle[1]:"🔍 "+t.listen_toggle[0]}</button>
              <p className="muted" style={{marginTop:0}}>{t.table_intro}</p>
              <div className="tablewrap">
              <table className="ptable">
                <thead><tr><th>{t.th[0]}</th><th>{t.th[1]}</th><th>{t.th[2]}</th><th>{lang==="ko"?"듣기":"Listen"}</th></tr></thead>
                <tbody>
                  {ROWS.map((r,i)=>(
                    <tr key={i} className={r.tag?"special":""}>
                      <td className="jamo">{r.j}{r.tag && <span className={"tagm "+(r.mark||"none")}>{r.tag[lang]}</span>}</td>
                      <td className="ex">
                        {hi(r.sent[0], r.key, "key")}
                        {lang==="en" && r.sent[1] && <span className="enr">{r.sent[1]}</span>}
                      </td>
                      <td className="ph">{showPh
                        ? <React.Fragment>[{r.phKey ? hi(r.ph, r.phKey, "hot"+(r.mark==="keep"?" keep":(r.mark==="drop"?" drop":""))) : r.ph}]</React.Fragment>
                        : <span className="phwrap">{/* 실제 발음을 투명하게 깔아 칸 폭 고정 */}
                            <span className="phghost">[{r.ph}]</span>
                            <span className="mask">[ 🐾 ]</span>
                          </span>}</td>
                      <td className="listen"><button className="tplay" onClick={()=>setClip(r.t)} aria-label={(lang==="ko"?"발음 듣기":"Listen")+" "+r.j}>▶</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="leg">
                {t.legend.map((g,i)=><span key={i}><span className="dot" style={{background:g[0]}}/>{g[1]}</span>)}
              </div>
            </section>

            {/* 주의 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.note_l}</div>
              <h2 className="head">{t.note_h}</h2>
              {t.notes.map((nt,i)=><div className="callout" key={i}>{rich(nt)}</div>)}
            </section>

            {/* 듣고 따라하기 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.listen_l}</div>
              <h2 className="head">{t.listen_h}</h2>
              <Listen t={t} onPlay={setClip} />
            </section>

            {/* 퀴즈 */}
            <section className="sec" id="quizsec">
              <div className="label"><span className="stepn">{num()}</span>{t.quiz_l}</div>
              <h2 className="head">{t.quiz_h}</h2>
              {best!==null && <p className="bestscore">🏆 {lang==="ko"?("최고 기록: "+best+"/"+QUIZ.length):("Best score: "+best+"/"+QUIZ.length)}</p>}
              {wrongSaved.length>0 && retryIdxs===null &&
                <button className="retrybtn" onClick={()=>setRetryIdxs(wrongSaved)}>🔁 {lang==="ko"
                  ? "지난번 틀린 "+wrongSaved.length+"문제 다시 풀기"
                  : "Retry "+wrongSaved.length+" missed question"+(wrongSaved.length>1?"s":"")}</button>}
              {retryIdxs!==null &&
                <p className="bestscore">🔁 {lang==="ko"?"틀린 문제만 풀고 있어요.":"Reviewing missed questions."}
                  <button className="ptoggle" style={{float:"none",marginLeft:8}} onClick={()=>setRetryIdxs(null)}>{lang==="ko"?"전체 퀴즈 풀기":"Full quiz"}</button></p>}
              <Quiz key={retryIdxs?("r"+retryIdxs.join("-")):"full"} t={t} lang={lang} onPlay={setClip}
                onComplete={retryIdxs?retryDone:quizDone} idxs={retryIdxs||undefined} />
            </section>

            {/* 정리 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.review_l}</div>
              <div className="review"><h3>{t.review_h}</h3><ul>{t.review.map((l,i)=><li key={i}>{rich(l)}</li>)}</ul></div>
            </section>

            {/* 영상 */}
            <section className="sec">
              <div className="label">{t.video_l}</div>
              <h2 className="head">{t.video_h}</h2>
              <VideoEmbed title="Korean Pronunciation 01" />
            </section>

            {/* 다음 학습 */}
            <section className="sec">
              <div className="label">{t.next_l}</div>
              <div className="nextgrid">
                {/* 발행 시 실제 URL 연결 — 그 전까지는 클릭 안 되는 카드 */}
                <div className="nextcard">
                  <span className="nk">{lang==="ko"?"다음 강의 · 발음 02":"NEXT · PRONUNCIATION 02"}</span>
                  <div className="np">연음 <span className="ph">겹받침</span></div>
                  <div className="ng">{lang==="ko"?"받침이 두 개일 때의 연음":"Linking with double final consonants"}</div>
                  <span className="na">{lang==="ko"?"준비 중 →":"Coming soon →"}</span>
                </div>
                <div className="nextcard">
                  <span className="nk">{lang==="ko"?"관련 문법":"RELATED GRAMMAR"}</span>
                  <div className="np">V <span className="ph">-ㄴ/은 채로</span></div>
                  <div className="ng">{lang==="ko"?"발음 표기가 나오는 문법 강의":"Grammar lesson with pronunciation notes"}</div>
                  <span className="na">{lang==="ko"?"발행 후 연결 예정 →":"Link coming soon →"}</span>
                </div>
              </div>
            </section>
          </div>

          <MiniPlayer sec={clip} onClose={()=>setClip(null)} label={lang==="ko"?"영상에서 듣기":"Listen in the video"} />
        </React.Fragment>
      );
    }
    ReactDOM.createRoot(document.getElementById("bk-lesson")).render(<App/>);
  