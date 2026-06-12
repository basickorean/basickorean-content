/* p003.jsx — Blogger 포스트용 (소스: pronunciation-prototype/P003.html)
   babel-standalone 런타임 컴파일(임시). 필요: bk-pron.css + React18 + <div id="bk-lesson" class="bkp-root"> */

    const { useState, useEffect, useRef } = React;
    const VIDEO_ID = "Frt3A-tZYpc";
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

    /* 애니메이션은 로드 즉시 시작 — 스크롤 트리거(IntersectionObserver)는 빠른 스크롤을
       못 따라와 롤백 (2026-06-12). 놓치면 '다시 보기'로 재생. .force 리플레이 로직은 유지 */
    function useInView(ref){ return true; }

    /* ===== 인트로 애니메이션: 받침소리 [ㄱ·ㄷ·ㅂ] + 자음 → 된소리 ===== */
    function AnimIntro({lang}){
      const [k,setK]=useState(0);
      const wrapRef=useRef(null);
      const inView=useInView(wrapRef);
      const T = lang==="ko"
        ? {title:"된소리 되기: 받침소리 [ㄱ·ㄷ·ㅂ] + ㄱ·ㄷ·ㅂ·ㅅ·ㅈ", l1:"받침소리", l2:"첫소리", l3:"된소리", co1:"받침소리는", co2:"그대로!", replay:"다시 보기"}
        : {title:"Tensification: final sound [ㄱ·ㄷ·ㅂ] + ㄱ·ㄷ·ㅂ·ㅅ·ㅈ", l1:"final sound", l2:"next onset", l3:"tense", co1:"final sound", co2:"stays!", replay:"Replay"};
      return (
        <div className="animwrap" ref={wrapRef}>
          <button className="replay" onClick={()=>setK(k+1)}>↻ {T.replay}</button>
          <div className="animtitle">{T.title}</div>
          <svg key={k} className={(inView?"anim-on":"")+(k>0?" force":"")} viewBox="0 90 520 260" role="img" aria-label={T.title}>
            {/* 받침소리 (틸 = 유지) */}
            <rect x="20" y="150" width="150" height="110" rx="16" fill="var(--teal)"/>
            <text x="95" y="196" className="av-t" fontSize="19" textAnchor="middle">{T.l1}</text>
            <text x="95" y="232" className="av-t" fontSize="26" textAnchor="middle">[ㄱ·ㄷ·ㅂ]</text>
            <text x="185" y="215" fontSize="30" textAnchor="middle" fill="var(--muted)">+</text>
            {/* 첫소리 (파랑) */}
            <rect x="200" y="150" width="150" height="110" rx="16" fill="var(--blue)"/>
            <text x="275" y="196" className="av-t" fontSize="19" textAnchor="middle">{T.l2}</text>
            <text x="275" y="232" className="av-t" fontSize="24" textAnchor="middle">ㄱ ㄷ ㅂ ㅅ ㅈ</text>
            {/* 화살표 → 된소리 */}
            <path className="av-arrow" d="M355 205 H392"/>
            <path className="av-head" d="M386 199 L396 205 L386 211"/>
            <g className="ax-result">
              <rect x="405" y="150" width="110" height="110" rx="16" fill="var(--orange)"/>
              <text x="460" y="190" className="av-t" fontSize="19" textAnchor="middle">{T.l3}</text>
              <text x="460" y="220" className="av-t" fontSize="20" textAnchor="middle">ㄲ ㄸ ㅃ</text>
              <text x="460" y="246" className="av-t" fontSize="20" textAnchor="middle">ㅆ ㅉ</text>
            </g>
            {/* 콜아웃 */}
            <g className="av-callout">
              <ellipse cx="95" cy="305" rx="76" ry="32" fill="none" stroke="var(--teal)" strokeWidth="2.5"/>
              <path d="M95 273 L95 262" stroke="var(--teal)" strokeWidth="2.5" fill="none"/>
              <text x="95" y="300" fontSize="15.5" textAnchor="middle" fill="var(--teal-dark)" style={{fontFamily:"var(--display)"}}>{T.co1}</text>
              <text x="95" y="320" fontSize="15.5" textAnchor="middle" fill="var(--teal-dark)" style={{fontFamily:"var(--display)"}}>{T.co2}</text>
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
    const AXC = {ink:"var(--ink)", coral:"var(--orange)", blue:"var(--blue)", gray:"#c2ccc8", pink:"var(--pink)", teal:"var(--teal)"};
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
        ? {bat:"받침소리", on:"첫소리", tn:"된소리", listen:"발음 듣기", replay:"다시 보기"}
        : {bat:"final", on:"onset", tn:"tense", listen:"Listen", replay:"Replay"};
      const batw = d.batw ? d.batw[lang==="ko"?0:1] : (lang==="ko" ? 100 : 92);
      const tnw = lang==="ko" ? 88 : 86;
      const ow = lang==="ko" ? 60 : 66;
      const bf = lang==="ko" ? 14.5 : 12.5;
      return (
        <div className="animwrap" ref={wrapRef}>
          <button className="replay" onClick={()=>setK(k+1)}>↻ {T.replay}</button>
          <svg key={k} className={(inView?"anim-on ":"")+"exsvg"+(k>0?" force":"")} viewBox="0 0 600 228" role="img">
            {/* 카드 규격: 드래그 게임과 동일 106×106, 글자 62 */}
            <rect x="40" y="70" width="106" height="106" rx="16" fill="#f7faf9" stroke="var(--line)" strokeWidth="1.5"/>
            <CSyl id={d.id+"-a"} cx={93} y={143} F={62} spec={d.s1}/>
            {/* 받침소리 말풍선 (틸, 아래) — batlab: '[ㄱ]' 또는 'ㅍ→[ㅂ]' */}
            <g className="av-callout">
              <path d="M88 184 L93 174 L98 184 Z" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5"/>
              <rect x={93-batw/2} y="188" width={batw} height="28" rx="14" fill="var(--teal-soft)" stroke="var(--teal)" strokeWidth="1.5"/>
              <text x="93" y="207" fontSize={bf} textAnchor="middle" fill="var(--teal-dark)" style={{fontFamily:"var(--display)"}}>{T.bat+" "+(d.batlab||"")}</text>
            </g>
            <rect x="176" y="70" width="106" height="106" rx="16" fill="#f7faf9" stroke="var(--line)" strokeWidth="1.5"/>
            <CSyl id={d.id+"-b"} cx={229} y={143} F={62} spec={d.s2}/>
            {/* 첫소리 말풍선 (파랑, 위) */}
            <g className="av-callout2">
              <rect x={229-ow/2} y="30" width={ow} height="28" rx="14" fill="var(--blue-soft)" stroke="var(--blue)" strokeWidth="1.5"/>
              <text x="229" y="49" className="ax-cot-b" fontSize={lang==="ko"?15:13} textAnchor="middle">{T.on}</text>
              <path d="M224 62 L229 72 L234 62 Z" fill="var(--blue-soft)" stroke="var(--blue)" strokeWidth="1.5"/>
            </g>
            {/* 받침소리 → 첫소리 영향 화살표 (P001·P002와 같은 경로) */}
            <path className="ax-arrow" d={d.to==="top" ? "M128 141 H161 V104 H198" : "M128 141 H161 V119 H198"}/>
            <path className="ax-head" d={d.to==="top" ? "M190 98 L200 104 L190 110" : "M190 113 L200 119 L190 125"}/>
            {/* → + 결과 카드 */}
            <g className="ax-result">
              <text x="309" y="131" fill="var(--muted)" fontSize="26" textAnchor="middle">→</text>
              <rect x="336" y="70" width="260" height="106" rx="16" fill="#f7faf9" stroke="var(--line)" strokeWidth="1.5"/>
              <text x="367" y="140" fontSize="60" textAnchor="middle" fill="var(--ink)" style={{fontFamily:"var(--display)"}}>[</text>
              <CSyl id={d.id+"-r1"} cx={407} y={143} F={62} spec={d.res[0]}/>
              <CSyl id={d.id+"-r2"} cx={469} y={143} F={62} spec={d.res[1]}/>
              <text x="509" y="140" fontSize="60" textAnchor="middle" fill="var(--ink)" style={{fontFamily:"var(--display)"}}>]</text>
              {/* 된소리 말풍선 (코랄, 결과 위) */}
              <g>
                <rect x={469-tnw/2} y="30" width={tnw} height="28" rx="14" fill="var(--orange-soft)" stroke="var(--orange)" strokeWidth="1.5"/>
                <text x="469" y="49" fontSize={bf} textAnchor="middle" fill="var(--orange)" style={{fontFamily:"var(--display)"}}>{T.tn+" "+(d.tnlab||"")}</text>
                <path d="M464 62 L469 72 L474 62 Z" fill="var(--orange-soft)" stroke="var(--orange)" strokeWidth="1.5"/>
              </g>
              {/* 발음 듣기 — TTS, 미지원 시 영상 클립 */}
              <g style={{cursor:"pointer"}} onClick={()=>speakKo(d.word, ()=>onPlay&&onPlay(d.t))} role="button" aria-label={T.listen}>
                <circle cx="557" cy="123" r="17" fill="#fff" stroke="var(--line)" strokeWidth="1.5"/>
                <text x="558" y="128" fontSize="12" textAnchor="middle" fill="var(--teal-dark)">▶</text>
              </g>
            </g>
          </svg>
        </div>
      );
    }
    /* 학생: 학(받침소리 [ㄱ] 틸) + 생(첫소리 ㅅ 파랑) → [학쌩] (ㅆ 코랄) */
    const EX_HAKSAENG = { id:"haksaeng", word:"학생", batlab:"[ㄱ]", tnlab:"ㅆ", to:"top", t:393,
      s1:{ch:"학", parts:[{c:"ink"},{c:"teal",y0:0.55}]},
      s2:{ch:"생", parts:[{c:"ink"},{c:"blue",x1:0.5,y1:0.52}]},
      res:[{ch:"학", parts:[{c:"ink"},{c:"teal",y0:0.55}]}, {ch:"쌩", parts:[{c:"ink"},{c:"coral",x1:0.58,y1:0.52}]}] };
    /* 숙제: 숙([ㄱ]) + 제(ㅈ) → [숙쩨] */
    const EX_SUKJE = { id:"sukje", word:"숙제", batlab:"[ㄱ]", tnlab:"ㅉ", t:550,
      s1:{ch:"숙", parts:[{c:"ink"},{c:"teal",y0:0.55}]},
      s2:{ch:"제", parts:[{c:"ink"},{c:"blue",x1:0.45}]},
      res:[{ch:"숙", parts:[{c:"ink"},{c:"teal",y0:0.55}]}, {ch:"쩨", parts:[{c:"ink"},{c:"coral",x1:0.52}]}] };
    /* 옆집(받침 글자≠소리): 옆 ㅍ→소리[ㅂ] + 집 ㅈ → [엽찝] */
    const EX_YEOPJIP = { id:"yeopjip", word:"옆집", batlab:"ㅍ→[ㅂ]", batw:[128,118], tnlab:"ㅉ", to:"top", t:496,
      s1:{ch:"옆", parts:[{c:"ink"},{c:"teal",y0:0.55}]},
      s2:{ch:"집", parts:[{c:"ink"},{c:"blue",x1:0.5,y1:0.5}]},
      res:[{ch:"엽", parts:[{c:"ink"},{c:"teal",y0:0.55}]}, {ch:"찝", parts:[{c:"ink"},{c:"coral",x1:0.55,y1:0.5}]}] };

    /* ===== 된소리 탭 게임 — 된소리가 되는 글자를 직접 눌러 보기 ===== */
    /* HTML용 자모 부분 색칠 (P001·P002와 동일 방식) */
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
    /* 받침소리 [ㄱ·ㄷ·ㅂ] 복습 미니 표 — t는 영상 지점(초) */
    const SOUNDS=[
      {snd:"ㄱ", letters:"ㄱ · ㄲ · ㅋ · ㄺ · ㄳ", t:88},
      {snd:"ㄷ", letters:"ㄷ · ㅅ · ㅆ · ㅈ · ㅊ · ㅌ", t:123},
      {snd:"ㅂ", letters:"ㅂ · ㅍ · ㄼ · ㅄ", t:152},
    ];
    /* 된소리 발음 비교 (예사소리 vs 된소리) — 예문은 영상의 것 */
    const PAIRS=[
      {a:"가", b:"까", wa:"가다", wb:"까다", ea:"가로수길에 가다", eb:"껍질을 까다", t:184},
      {a:"다", b:"따", wa:"다지다", wb:"따지다", ea:"마늘을 다지다", eb:"잘잘못을 따지다", t:243},
      {a:"바", b:"빠", wa:"바르다", wb:"빠르다", ea:"약을 바르다", eb:"비행기는 빠르다", t:279},
      {a:"사", b:"싸", wa:"사다", wb:"싸다", ea:"사과를 사다", eb:"사과가 싸다", t:315},
      {a:"자", b:"짜", wa:"자다", wb:"짜다", ea:"아이가 잠을 자다", eb:"소금이 짜다", t:349},
    ];
    /* steps: 차례로 눌러야 하는 글자. i=글자 위치, cho/jong=눌렀을 때 바뀌는 자모 인덱스(ㄲ1·ㄸ4·ㅆ10·ㅉ13 / ㄷ7),
       reg=결과 색칠 영역, color(기본 coral), hint=단계 안내. 마지막은 받침소리 변환 포함 도전 */
    /* 모든 단어 2단계: ① 받침소리 글자 찾기(틸) → ② 된소리 발음 찾기(코랄) */
    const H1={ko:"① 받침소리 [ㄱ·ㄷ·ㅂ] 글자를 눌러 보세요.",en:"① Tap the syllable with a [ㄱ·ㄷ·ㅂ] final sound."};
    const H2=(snd)=>({ko:"✓ 받침소리 ["+snd+"]! ② 이제 된소리가 되는 글자를 눌러 보세요.",en:"✓ Final sound ["+snd+"]! ② Now tap the letter that tenses."});
    const TAPS=[
      {word:"학교", steps:[
        {i:0, color:"teal", reg:[0,1,0.55,1], hint:H1},
        {i:1, cho:1, reg:[0,1,0,0.42], hint:H2("ㄱ")}]},
      {word:"식당", steps:[
        {i:0, color:"teal", reg:[0,1,0.55,1], hint:H1},
        {i:1, cho:4, reg:[0,0.62,0,0.5], hint:H2("ㄱ")}]},
      {word:"입다", steps:[
        {i:0, color:"teal", reg:[0,1,0.55,1], hint:H1},
        {i:1, cho:4, reg:[0,0.6,0,1], hint:H2("ㅂ")}]},
      {word:"책상", steps:[
        {i:0, color:"teal", reg:[0,1,0.55,1], hint:H1},
        {i:1, cho:10, reg:[0,0.62,0,0.52], hint:H2("ㄱ")}]},
      {word:"옷장", challenge:true,
        msg:{ko:"🎉 받침 ㅅ은 소리 [ㄷ] — 그래서 ㅈ이 [ㅉ]이 됐어요!",en:"🎉 Final ㅅ sounds [ㄷ] — so ㅈ tensed to [ㅉ]!"},
        steps:[
          {i:0, jong:7, color:"teal", reg:[0,1,0.55,1],
            hint:{ko:"① 받침소리 글자를 눌러 보세요 — 받침 ㅅ이 소리 [ㄷ]으로 바뀌어요!",en:"① Tap the final-sound syllable — ㅅ becomes the sound [ㄷ]!"}},
          {i:1, cho:13, reg:[0,0.62,0,0.5], hint:H2("ㄷ")}]},
    ];
    function TapGame({lang}){
      const [wi,setWi]=useState(0);
      const [done,setDone]=useState(0);        // 완료한 step 수
      const [miss,setMiss]=useState(false);    // 잘못 누름
      const d=TAPS[wi];
      const syls=[...d.word];
      const solved=done>=d.steps.length;
      const cur=d.steps[done];
      /* 현재 상태의 글자·색 (완료된 step만 반영) */
      const view=(i)=>{
        const d0=dec(syls[i]); let cho=d0.cho, jong=d0.jong; const parts=[];
        d.steps.forEach((st,k)=>{ if(k<done && st.i===i){
          if(st.cho!==undefined) cho=st.cho;
          if(st.jong!==undefined) jong=st.jong;
          parts.push({color:st.color||"orange", r:st.reg}); } });
        return {ch:comp(cho,d0.jung,jong), parts};
      };
      const tap=(i)=>{ if(solved) return;
        if(cur && cur.i===i){ setDone(done+1); setMiss(false); }
        else setMiss(true); };
      const resWord=syls.map((sy,i)=>{ const d0=dec(sy); let cho=d0.cho, jong=d0.jong;
        d.steps.forEach(st=>{ if(st.i===i){ if(st.cho!==undefined) cho=st.cho; if(st.jong!==undefined) jong=st.jong; } });
        return comp(cho,d0.jung,jong); }).join("");
      const next=()=>{ setWi((wi+1)%TAPS.length); setDone(0); setMiss(false); };
      const prev=()=>{ if(wi>0){ setWi(wi-1); setDone(0); setMiss(false); } };
      return (
        <div className="dragwrap">
          <div className="draghead">
            <span>👆 {lang==="ko"?"받침소리 찾고, 된소리로 바꿔 보세요!":"Find the final sound, then tense it!"}
              {d.challenge && <span className="chal">{lang==="ko"?"도전!":"Challenge!"}</span>}</span>
            <span className="cnt">{wi+1} / {TAPS.length}</span>
          </div>
          <div className="dragrow">
            {syls.map((sy,i)=>{
              const v=view(i);
              return (
                <div className="dsylwrap" key={wi+"-"+i}>
                  <div className="dsyl zone" onClick={()=>tap(i)} role="button"
                    aria-label={(lang==="ko"?"글자 ":"syllable ")+v.ch}>
                    <HSyl ch={v.ch} parts={v.parts}/>
                  </div>
                </div>
              );
            })}
            {/* 완료 후 작은 요약 */}
            <span className={"dsum"+(solved?" show":"")} aria-hidden={!solved}>
              {d.word}<span className="darrow">→</span>[{resWord}]
              <button className="tplay dplay" onClick={()=>speakKo(resWord)} aria-label={lang==="ko"?"발음 듣기":"Listen"}>▶</button>
            </span>
          </div>
          <div className="dfoot">
            <button className="cta ghost" onClick={prev} style={wi>0?null:{visibility:"hidden"}} aria-hidden={wi===0}>← {lang==="ko"?"이전 단어":"Previous"}</button>
            {solved
              ? <p className="dmsg">{d.msg?d.msg[lang]:(lang==="ko"?"🎉 된소리가 됐어요!":"🎉 It became a tense sound!")}
                  {wi===TAPS.length-1 && <span> {lang==="ko"?"— 모두 완료! 👏":"— all done! 👏"}</span>}
                  <button className="cta" onClick={next}>{wi<TAPS.length-1
                    ? (lang==="ko"?"다음 단어 →":"Next word →")
                    : (lang==="ko"?"처음부터 다시 ↻":"Start over ↻")}</button></p>
              : <p className="dhint">{miss
                  ? (lang==="ko"?"❌ 거기가 아니에요 — 받침소리 [ㄱ·ㄷ·ㅂ] 바로 뒤 글자를 찾아 보세요!":"❌ Not that one — find the letter right after a [ㄱ·ㄷ·ㅂ] final sound!")
                  : (cur&&cur.hint)
                    ? cur.hint[lang]
                    : (lang==="ko"?"된소리로 바뀌는 글자를 눌러 보세요.":"Tap the letter that becomes tense.")}</p>}
          </div>
        </div>
      );
    }

    const CT = {
      ko:{
        langA:"한글", langB:"EN",
        kicker:"한국어 발음 03 · Korean Pronunciation",
        heroEx:"‘학생’이라고 쓰지만 [학쌩]이라고 발음해요.",
        heroSub:"— 받침소리 [ㄱ·ㄷ·ㅂ] 뒤에서 자음이 단단해지는 현상",
        c1_l:"개념", c1_h:"된소리 되기(경음화)란?",
        prereq:"사전 지식: 받침소리 7개 — 여기에서는 [ㄱ·ㄷ·ㅂ]만 간단히 복습해요.",
        c1_p:[
          ["받침소리 ",{b:"[ㄱ·ㄷ·ㅂ]"}," 뒤에 자음 ",{b:"ㄱ·ㄷ·ㅂ·ㅅ·ㅈ"},"이 오면,"],
          ["받침소리는 그대로 두고, 뒤 자음을 ",{b:"된소리 [ㄲ·ㄸ·ㅃ·ㅆ·ㅉ]"},"로 발음해요. 이걸 ",{b:"된소리 되기(경음화)"},"라고 해요."],
          ["기준은 받침 ‘글자’가 아니라 ",{b:"받침 ‘소리’"},"예요 — 바로 아래에서 받침소리부터 복습해요."],
        ],
        prep1_l:"준비 ①", prep1_h:"받침소리 [ㄱ·ㄷ·ㅂ] 복습",
        prep1_intro:"여러 받침 글자가 같은 소리로 발음돼요. 글자가 달라도 소리가 [ㄱ·ㄷ·ㅂ]이면 오늘 규칙이 적용돼요.",
        prep1_th:["소리","받침 글자"],
        prep1_link:["받침소리 7개를 처음 본다면 ",{a:{t:"한글 ‘받침소리 7개’ 강의",href:"https://www.basickorean.com/2018/10/03-01.html"}},"를 먼저 보세요."],
        prep2_l:"준비 ②", prep2_h:"된소리, 어떻게 발음할까?",
        prep2_intro:"입 앞에 손을 대고 비교해 보세요 — 예사소리는 바람이 나오고, 된소리는 바람 없이 목에 힘을 줘요.",
        plainL:"예사소리", tenseL:"된소리", tipA:"바람이 나와요 · 편안하게", tipB:"바람 ✗ · 목에 힘 꽉!",
        viz_l:"소리 나는 원리", viz_h:"뒤 자음이 단단해져요",
        viz_note:"받침소리 [ㄱ·ㄷ·ㅂ]은 그대로, 바로 뒤 자음만 된소리로 바뀌어요.",
        table_l:"변화별 발음", table_h:"어떤 소리로 바뀔까?",
        table_intro:"다섯 가지 변화를 예문으로 확인해 보세요. 파란 글자가 실제로 소리가 바뀌는 부분이에요.",
        th:["변화","예문","발음"],
        legend:[["var(--blue)","된소리로 바뀐 발음"],["var(--orange)","된소리가 일어나는 원래 글자"]],
        note_l:"주의", note_h:"꼭 기억할 두 가지",
        notes:[
          ["①  기준은 받침 ‘글자’가 아니라 ",{b:"받침 ‘소리’"},"예요 — ‘꽃’의 ㅊ은 소리 ",{ph:"[ㄷ]"},", ‘옆’의 ㅍ은 ",{ph:"[ㅂ]"},", ‘닭’의 ㄺ은 ",{ph:"[ㄱ]"},".",{br:1},
           "※ 받침소리 7개는 ",{a:{t:"한글 ‘받침소리 7개’ 강의",href:"https://www.basickorean.com/2018/10/03-01.html"}},"에서 자세히 배워요."],
          ["②  된소리는 ",{b:"바람 없이, 목에 힘을 주고"}," 짧고 단단하게! 입 앞에 손을 대고 ‘가/까’를 비교해 보세요."],
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
          ["받침소리 ",{b:"[ㄱ·ㄷ·ㅂ]"}," 뒤의 ",{b:"ㄱ·ㄷ·ㅂ·ㅅ·ㅈ"},"은 된소리 ",{ph:"[ㄲ·ㄸ·ㅃ·ㅆ·ㅉ]"},"로 발음해요."],
          ["받침소리는 ",{b:"그대로 유지"},"돼요 — ‘학생’ → ",{ph:"[학쌩]"},"."],
          ["기준은 받침 글자가 아니라 ",{b:"받침 소리"},"예요 — ‘꽃가게’ → ",{ph:"[꼳까게]"},"."],
        ],
        video_l:"영상", video_h:"강의 영상으로 복습",
        next_l:"다음 학습",
        footer_sub:"한국어 발음 03 · 된소리 되기 (경음화)",
      },
      en:{
        langA:"한글", langB:"EN",
        kicker:"Korean Pronunciation 03",
        heroEx:"You write ‘학생’ but say [학쌩].",
        heroSub:"— consonants tense up after the final sounds [ㄱ·ㄷ·ㅂ]",
        c1_l:"Concept", c1_h:"What is tensification (된소리 되기)?",
        prereq:"Good to know first: the 7 final sounds — we review [ㄱ·ㄷ·ㅂ] below.",
        c1_p:[
          ["When a final sound ",{b:"[ㄱ·ㄷ·ㅂ]"}," is followed by ",{b:"ㄱ·ㄷ·ㅂ·ㅅ·ㅈ"},","],
          ["the final sound stays, and the next consonant is pronounced as a ",{b:"tense sound [ㄲ·ㄸ·ㅃ·ㅆ·ㅉ]"},". This is ",{b:"tensification (된소리 되기 / 경음화)"},"."],
          ["What matters is the final ",{b:"sound"},", not the letter — let’s review the final sounds first."],
        ],
        prep1_l:"Prep ①", prep1_h:"Review: final sounds [ㄱ·ㄷ·ㅂ]",
        prep1_intro:"Different final letters share the same sound. If the sound is [ㄱ·ㄷ·ㅂ], today’s rule applies.",
        prep1_th:["Sound","Final letters"],
        prep1_link:["New to the 7 final sounds? See the ",{a:{t:"Hangul ‘7 final sounds’ lesson",href:"https://www.basickorean.com/2018/10/03-01.html"}}," (in Korean)."],
        prep2_l:"Prep ②", prep2_h:"How do tense sounds work?",
        prep2_intro:"Put your hand in front of your mouth — plain sounds release air; tense sounds release no air, with a tight throat.",
        plainL:"PLAIN", tenseL:"TENSE", tipA:"air flows · relaxed", tipB:"no air · throat tight!",
        viz_l:"How it works", viz_h:"The next consonant tenses up",
        viz_note:"The final sound [ㄱ·ㄷ·ㅂ] stays; only the following consonant becomes tense.",
        table_l:"By change", table_h:"Which sound does it become?",
        table_intro:"Check the five changes with example sentences. The blue letters are where the sound actually changes.",
        th:["Change","Example","Pronounced"],
        legend:[["var(--blue)","tensed pronunciation"],["var(--orange)","word where tensing happens"]],
        note_l:"Watch out", note_h:"Two things to remember",
        notes:[
          ["①  What matters is the final ",{b:"sound"},", not the letter — ㅊ of ‘꽃’ sounds ",{ph:"[ㄷ]"},", ㅍ of ‘옆’ sounds ",{ph:"[ㅂ]"},", ㄺ of ‘닭’ sounds ",{ph:"[ㄱ]"},".",{br:1},
           "※ See the ",{a:{t:"Hangul ‘7 final sounds’ lesson",href:"https://www.basickorean.com/2018/10/03-01.html"}}," (in Korean)."],
          ["②  Tense sounds: ",{b:"no air, tight throat"},", short and hard! Compare ‘가/까’ with your hand in front of your mouth."],
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
          ["After a final sound ",{b:"[ㄱ·ㄷ·ㅂ]"},", the consonants ",{b:"ㄱ·ㄷ·ㅂ·ㅅ·ㅈ"}," are pronounced tense: ",{ph:"[ㄲ·ㄸ·ㅃ·ㅆ·ㅉ]"},"."],
          ["The final sound ",{b:"stays as-is"}," — ‘학생’ → ",{ph:"[학쌩]"},"."],
          ["It’s about the final ",{b:"sound"},", not the letter — ‘꽃가게’ → ",{ph:"[꼳까게]"},"."],
        ],
        video_l:"Video", video_h:"Review with the lecture video",
        next_l:"Keep learning",
        footer_sub:"Korean Pronunciation 03 · Tensification (된소리 되기)",
      },
    };

    /* 변화별 발음 표 — 5행. ▶는 TTS(문장)로 재생, 미지원 시 영상 클립 */
    const ROWS = [
      {j:"ㄱ→ㄲ", sent:["학교에 가요.","I go to school."], key:"학교", ph:"학꾜에 가요", phKey:"학꾜", t:550},
      {j:"ㄷ→ㄸ", sent:["꽃다발을 줘요.","I give a bouquet."], key:"꽃다발", ph:"꼳따바를 줘요", phKey:"꼳따", t:535},
      {j:"ㅂ→ㅃ", sent:["국밥이 유명해요.","The gukbap is famous."], key:"국밥", ph:"국빠비 유명해요", phKey:"국빠", t:19},
      {j:"ㅅ→ㅆ", sent:["학생이 많아요.","There are many students."], key:"학생", ph:"학쌩이 마나요", phKey:"학쌩", t:393},
      {j:"ㅈ→ㅉ", sent:["숙제를 해요.","I do homework."], key:"숙제", ph:"숙쩨를 해요", phKey:"숙쩨", t:550},
    ];

    const LISTEN = [
      { t:535, seg:[{tx:"졸업생",pr:"조럽쌩"},{tx:"에게 "},{tx:"꽃다발을",pr:"꼳따바를"},{tx:" 줘요."}] },
      { t:550, seg:[{tx:"학교",pr:"학꾜"},{tx:"에서 "},{tx:"숙제",pr:"숙쩨"},{tx:"를 해요."}] },
      { t:550, seg:[{tx:"식당",pr:"식땅"},{tx:"에서 "},{tx:"국밥을",pr:"국빠블"},{tx:" "},{tx:"먹어요",pr:"머거요"},{tx:"."}] },
      { t:393, seg:[{tx:"학생",pr:"학쌩"},{tx:"이 "},{tx:"책상",pr:"책쌍"},{tx:"에서 공부해요."}] },
    ];
    const QUIZ = [
      { word:"학생",  opts:["[학생]","[학쌩]","[하쌩]"], a:1, ex:{ko:"받침소리 [ㄱ] 뒤의 ㅅ은 [ㅆ]으로 → [학쌩].", en:"After the [ㄱ] final sound, ㅅ tenses to [ㅆ] → [학쌩]."} },
      { word:"숙제",  opts:["[숙제]","[수쩨]","[숙쩨]"], a:2, ex:{ko:"받침소리 [ㄱ]은 그대로, ㅈ은 [ㅉ]으로 → [숙쩨].", en:"[ㄱ] stays; ㅈ tenses to [ㅉ] → [숙쩨]."} },
      { listen:true, say:"학꾜", t:550, opts:["학꾜","학교","항교"], a:1, ex:{ko:"[학꾜]로 들리지만, 글자는 ‘학교’예요 — ㄱ이 된소리 [ㄲ]이 됐어요.", en:"You hear [학꾜], but it’s written ‘학교’ — ㄱ tensed to [ㄲ]."} },
      { word:"꽃가게", opts:["[꼳까게]","[꽃가게]","[꼬까게]"], a:0, ex:{ko:"받침 ㅊ은 소리 [ㄷ] — 그 뒤 ㄱ은 [ㄲ] → [꼳까게].", en:"Final ㅊ sounds [ㄷ]; then ㄱ tenses → [꼳까게]."} },
      { word:"옆집",  opts:["[엽집]","[엽찝]","[여찝]"], a:1, ex:{ko:"받침 ㅍ은 소리 [ㅂ] — 그 뒤 ㅈ은 [ㅉ] → [엽찝].", en:"Final ㅍ sounds [ㅂ]; then ㅈ tenses → [엽찝]."} },
      { word:"식당",  opts:["[식당]","[시땅]","[식땅]"], a:2, ex:{ko:"받침소리 [ㄱ] 뒤 ㄷ은 [ㄸ]으로 → [식땅].", en:"After [ㄱ], ㄷ tenses to [ㄸ] → [식땅]."} },
      { listen:true, say:"입따", t:279, opts:["입다","이따","입따"], a:0, ex:{ko:"[입따]로 들리지만, 글자는 ‘입다’예요 — ㄷ이 된소리 [ㄸ]이 됐어요.", en:"You hear [입따], but it’s written ‘입다’ — ㄷ tensed to [ㄸ]."} },
    ];
    /* ※ 받아쓰기(spell) 문제는 퀴즈에서 제외 (2026-06-12) — mp3 녹음 후 별도 '받아쓰기 페이지'로.
       SpellInput 등 렌더링 코드는 유지 — 데이터만 넣으면 다시 동작 */

    function Listen({t,onPlay}){
      const [show,setShow]=useState(true);
      const [reps,setReps]=useState({});   // 문장별 따라 읽은 횟수 (0~3)
      return (
        <div className="dlg">
          <p className="muted" style={{marginTop:0}}>{t.listen_intro}</p>
          <div className="togglerow"><button className="ptoggle" onClick={()=>setShow(v=>!v)}>{show?"🐾 "+t.listen_toggle[1]:"🔍 "+t.listen_toggle[0]}</button></div>
          {LISTEN.map((ln,i)=>(
            <div className="pline" key={i}>
              <button className="playbtn" onClick={()=>speakKo(ln.seg.map(s=>s.tx).join(""), ()=>onPlay(ln.t))} title="▶">▶</button>
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
              {correct===TOTAL && <p className="mtitle">🏆 {lang==="ko"?"된소리 마스터!":"Tensification Master!"}</p>}
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
      const [done,setDone]=useState(()=>{try{return localStorage.getItem("bk_done_P003")==="1";}catch(e){return false;}});
      const [best,setBest]=useState(()=>{try{const v=localStorage.getItem("bk_best_P003");return v?parseInt(v):null;}catch(e){return null;}});
      /* 저장된 틀린 문제 번호 검증 — 문제 수가 바뀌면 범위 밖 번호가 남아 에러 나는 것 방지 */
      const [wrongSaved,setWrongSaved]=useState(()=>{try{
        const v=JSON.parse(localStorage.getItem("bk_wrong_P003")||"[]");
        return (Array.isArray(v)?v:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<QUIZ.length);
      }catch(e){return [];}});
      const [retryIdxs,setRetryIdxs]=useState(null);
      const saveWrong=(w)=>{ setWrongSaved(w); try{localStorage.setItem("bk_wrong_P003",JSON.stringify(w));}catch(e){} };
      const quizDone=(c,w)=>{ setDone(true); saveWrong(w||[]); setBest(b=>{const nb=(b===null?c:Math.max(b,c));
        try{localStorage.setItem("bk_best_P003",String(nb));localStorage.setItem("bk_done_P003","1");localStorage.setItem("bk_date_P003",String(Date.now()));}catch(e){} return nb;}); };
      const retryDone=(c,w)=>{ saveWrong(w||[]); };
      /* 3일 후 복습 배너 (G203과 동일 패턴) */
      const [review,setReview]=useState(()=>{try{
        const d=localStorage.getItem("bk_date_P003");
        if(!d || localStorage.getItem("bk_done_P003")!=="1") return null;
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
            <h1>된소리 되기 <span className="ph">경음화</span></h1>
            <div className="ex">{t.heroEx}<small>{t.heroSub}</small></div>
          </div></header>

          <div className="wrap">
            {/* 복습 배너 — 완료 3일 후 재방문 시 */}
            {review!==null && (
              <div className="revbanner">
                <span>📅 {lang==="ko"
                  ? review+"일 전에 된소리 되기를 배웠어요. 기억이 잘 나는지 복습 퀴즈로 확인해 볼까요?"
                  : "You studied tensification "+review+" days ago — quick review quiz?"}</span>
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
              {/* 듣기 한 줄 — 규칙을 읽은 직후 귀로 확인 (영상 9:10 구간) */}
              <div className="hearcard">
                <div className="hearrow">
                  <span className="hearsent">🔊 “<span className="hsrc">학교</span>에서 <span className="hsrc">숙제</span>를 해요.”
                    {lang==="en" && <span className="hen">I do homework at school.</span>}</span>
                  <span className="hearplay"><span>{lang==="ko"?"직접 들어보세요":"Listen first"}</span>
                    <button className="tplay" onClick={()=>setClip(550)} aria-label={lang==="ko"?"직접 들어보세요":"Listen"}>▶</button></span>
                </div>
                <p className="hearcap">{lang==="ko"
                  ? "색이 있는 부분이 오늘 배울 ‘연음’이 일어나는 곳이에요. 어떻게 소리 나는지 먼저 들어보세요."
                  : "The colored parts are where today’s linking (연음) happens. Listen to how they actually sound."}</p>
              </div>
            </section>

            {/* 준비 ① — 받침소리 복습 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.prep1_l}</div>
              <h2 className="head">{t.prep1_h}</h2>
              <p className="muted" style={{marginTop:0}}>{t.prep1_intro}</p>
              <div className="tablewrap">
              <table className="ptable tense">
                <thead><tr><th>{t.prep1_th[0]}</th><th>{t.prep1_th[1]}</th><th>{lang==="ko"?"듣기":"Listen"}</th></tr></thead>
                <tbody>
                  {SOUNDS.map((g,i)=>(
                    <tr key={i}>
                      <td className="jamo">[{g.snd}]</td>
                      <td className="ex" style={{textAlign:"center"}}><span style={{fontFamily:"var(--display)",fontSize:20}}>{g.letters}</span></td>
                      <td className="listen"><button className="tplay" onClick={()=>setClip(g.t)} aria-label={(lang==="ko"?"발음 듣기 ":"Listen ")+g.snd}>▶</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="callout" style={{marginTop:14}}>{rich(t.prep1_link)}</div>
            </section>

            {/* 준비 ② — 된소리 발음하기 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.prep2_l}</div>
              <h2 className="head">{t.prep2_h}</h2>
              <p className="muted" style={{marginTop:0}}>{t.prep2_intro}</p>
              {PAIRS.map((p,i)=>(
                <div className="pairpanel" key={i}>
                  <div className="pairpanelhead">
                    <span className="pairtitle">{p.a}<span className="vs">vs</span>{p.b}</span>
                    <button className="pairvid" onClick={()=>setClip(p.t)}>🎬 {lang==="ko"?"영상에서 비교 듣기":"Compare in the video"}</button>
                  </div>
                  <div className="pairrow">
                  <div className="paircell">
                    <div className="pairsylrow"><button className="pairsyl" onClick={()=>speakKo(p.a, ()=>setClip(p.t))} aria-label={(lang==="ko"?"발음 듣기 ":"Listen ")+p.a}>{p.a}<span className="syltri">▶</span></button></div>
                    <div className="pairwind">💨</div>
                    <div className="pairline">{p.wa}<button className="ptri" onClick={()=>speakKo(p.wa)} aria-label={(lang==="ko"?"발음 듣기 ":"Listen ")+p.wa}>▶</button></div>
                    <div className="pairline sent">{p.ea}<button className="ptri" onClick={()=>speakKo(p.ea)} aria-label={(lang==="ko"?"발음 듣기 ":"Listen ")+p.ea}>▶</button></div>
                  </div>
                  <div className="paircell tensecell">
                    <div className="pairsylrow"><button className="pairsyl tense" onClick={()=>speakKo(p.b, ()=>setClip(p.t))} aria-label={(lang==="ko"?"발음 듣기 ":"Listen ")+p.b}>{p.b}<span className="syltri">▶</span></button></div>
                    <div className="pairwind">🚫💨</div>
                    <div className="pairline">{p.wb}<button className="ptri" onClick={()=>speakKo(p.wb)} aria-label={(lang==="ko"?"발음 듣기 ":"Listen ")+p.wb}>▶</button></div>
                    <div className="pairline sent">{p.eb}<button className="ptri" onClick={()=>speakKo(p.eb)} aria-label={(lang==="ko"?"발음 듣기 ":"Listen ")+p.eb}>▶</button></div>
                  </div>
                  </div>
                </div>
              ))}
            </section>

            {/* 소리 나는 원리 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.viz_l}</div>
              <h2 className="head">{t.viz_h}</h2>
              <AnimIntro lang={lang} />

              <div className="subhead">{lang==="ko"?"● 기본 규칙":"● Basic rule"}
                <span className="excdiv">·</span>
                <span className="exctext">{lang==="ko"?"받침소리는 남고, 뒤 자음이 된소리가 돼요.":"The final sound stays — the next consonant tenses."}</span></div>
              {/* 학생·숙제 분해 도식 */}
              <AnimExample d={EX_HAKSAENG} lang={lang} onPlay={setClip} />
              <AnimExample d={EX_SUKJE} lang={lang} onPlay={setClip} />

              <div className="excpanel">
                <p className="exchead">⚠ {lang==="ko"?"받침 글자 ≠ 받침 소리":"Letter ≠ sound"}
                  <span className="excdiv">·</span>
                  <span className="exctext">{lang==="ko"?"받침은 먼저 받침소리 [ㄱ·ㄷ·ㅂ]으로 바뀐 뒤, 규칙이 적용돼요.":"The final letter first becomes its sound, then the rule applies."}</span></p>
                <AnimExample d={EX_YEOPJIP} lang={lang} onPlay={setClip} />
              </div>

              <div style={{marginTop:20}}><TapGame lang={lang} /></div>

              <p className="muted" style={{marginTop:14,textAlign:"center"}}>{t.viz_note}</p>
            </section>

            {/* 받침별 발음 표 */}
            <section className="sec">
              <div className="label"><span className="stepn">{num()}</span>{t.table_l}</div>
              <h2 className="head">{t.table_h}</h2>
              <p className="muted" style={{marginTop:0}}>{t.table_intro}</p>
              <div className="togglerow"><button className="ptoggle" onClick={()=>setShowPh(v=>!v)}>{showPh?"🐾 "+t.listen_toggle[1]:"🔍 "+t.listen_toggle[0]}</button></div>
              <div className="tablewrap">
              <table className="ptable tense">
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
                      <td className="listen"><button className="tplay" onClick={()=>speakKo(r.sent[0], ()=>setClip(r.t))} aria-label={(lang==="ko"?"발음 듣기":"Listen")+" "+r.j}>▶</button></td>
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
              <VideoEmbed title="Korean Pronunciation 03" />
            </section>

            {/* 다음 학습 */}
            <section className="sec">
              <div className="label">{t.next_l}</div>
              <div className="nextgrid">
                {/* P004 발행 전까지 준비 중 카드. P002는 발행 후 연결 */}
                <div className="nextcard">
                  <span className="nk">{lang==="ko"?"다음 강의 · 발음 04":"NEXT · PRONUNCIATION 04"}</span>
                  <div className="np">비음화 <span className="ph">콧소리 되기</span></div>
                  <div className="ng">{lang==="ko"?"받침이 ㄴ·ㅁ·ㅇ 콧소리로 바뀌어요":"Finals turn into nasal sounds"}</div>
                  <span className="na">{lang==="ko"?"준비 중 →":"Coming soon →"}</span>
                </div>
                <div className="nextcard">
                  <span className="nk">{lang==="ko"?"이전 강의 · 발음 02":"PREVIOUS · PRONUNCIATION 02"}</span>
                  <div className="np">연음 <span className="ph">겹받침</span></div>
                  <div className="ng">{lang==="ko"?"받침이 두 개일 때의 연음":"Linking with double final consonants"}</div>
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
  