# Basic Korean — 콘텐츠 저장소

베이직 코리안 학습 콘텐츠의 **버전 관리 + 공용 코드 배포** 저장소입니다.
실제 사이트 운영은 **Blogger (basickorean.com)**, 이 저장소는:

1. 모든 강의 콘텐츠의 원본·이력 관리 (note.md, post.html)
2. 공용 디자인/엔진 코드(`assets/`)를 **jsDelivr CDN**으로 Blogger에 서빙

## 구조

```
basickorean-content/
├─ assets/                 ← jsDelivr로 서빙되는 공용 파일
│   ├─ bk.css              공용 디자인 (.bk-root 범위 — 블로그 테마와 충돌 없음)
│   ├─ bk.js               공용 엔진 (한글 엔진 + 컴포넌트, JSX 사전 컴파일본 — 직접 수정 금지)
│   └─ bklogo.jpg          로고
├─ src/
│   └─ bk.jsx              bk.js 의 소스 — 수정은 여기서, 컴파일은 scripts/build.js
├─ lessons/
│   ├─ grammar/            문법 (G001 ~ G204+)
│   │   └─ G203/
│   │       ├─ note.md     강의노트 (마크다운 원본)
│   │       ├─ post.html   Blogger 포스트 본문 (HTML 보기 모드에 복붙)
│   │       └─ preview.html 로컬 미리보기 (자동 생성 — 더블클릭으로 확인)
│   ├─ hangul/             한글 (6강)
│   ├─ vocabulary/         어휘 (~100강)
│   └─ pronunciation/      발음 (~20강)
├─ tools/                  활용 도구 등 (Blogger '페이지'용 본문)
└─ scripts/
    ├─ build.js            src/bk.jsx → assets/bk.js 컴파일
    └─ preview.js          각 post.html → preview.html 생성
```

## 동작 원리

- 포스트 본문(post.html)은 `<div id="bk-lesson">` + 강의 데이터(`window.BK_LESSON`)만 담는다.
- 테마 head의 공용 `bk.js` 가 데이터를 읽어 인터랙티브 페이지로 렌더링한다.
- 디자인 수정 = `bk.css` 한 파일 수정 → 모든 포스트에 일괄 반영.
- 기능 수정 = `src/bk.jsx` 수정 → `node scripts/build.js` → 푸시.

## Blogger 테마 설치 (1회)

Blogger → 테마 → HTML 편집 → `</head>` 바로 위에 아래 5줄 삽입
(테마는 XML이라 URL의 `&`는 반드시 `&amp;`로 써야 합니다):

```html
<link href='https://fonts.googleapis.com/css2?family=Jua&amp;family=Noto+Sans+KR:wght@400;500;700;900&amp;family=Quicksand:wght@600;700&amp;display=swap' rel='stylesheet'/>
<link href='https://cdn.jsdelivr.net/gh/basickorean/basickorean-content@main/assets/bk.css' rel='stylesheet'/>
<script crossorigin='anonymous' src='https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js'></script>
<script crossorigin='anonymous' src='https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'></script>
<script src='https://cdn.jsdelivr.net/gh/basickorean/basickorean-content@main/assets/bk.js'></script>
```

- GitHub에 푸시하면 jsDelivr 주소로 즉시 서빙됩니다 (변경 반영은 캐시 때문에 수 분~12시간 — 급하면 `@main` 대신 커밋 해시 사용).
- 안정 운영 시에는 `@main` 대신 태그 버전(`@v1.0.0`) 고정 권장.

## 빌드 (공용 코드를 수정했을 때만)

```
npm i @babel/standalone        # 최초 1회
node scripts/build.js          # src/bk.jsx → assets/bk.js
node scripts/preview.js        # post.html → preview.html 재생성
```

## 발행 워크플로

```
1. 원자료(자막+PPT) 준비  →  변환 작업 (note.md + post.html 생성)
2. repo에 커밋 & 푸시 (GitHub Desktop)
3. post.html 내용을 Blogger 새 포스트에 붙여넣기 (HTML 보기 모드)
4. 라벨 지정 (Grammar / 레벨) 후 발행
5. 해당 유튜브 영상 설명란에 포스트 링크 추가
```

## 원자료 위치 (이 저장소에 포함하지 않음)

자막(.sbv)·PPT/PDF·퀴즈 PDF 등 원자료는 상위 작업 폴더
(`subtitle/`, `ppt/`, `quiz/`, `notes/`, `pronunication/`)에 보관합니다.
공개 저장소이므로 판매 자료·원본 문서는 커밋하지 않습니다.

## 참고

- 디자인·기능의 기준 구현(프로토타입): 작업 폴더의 `grammar-prototype/G203.html`, `G204.html`
- 색 규칙: 틸 `#3fa796` = 품사(V/A/N)·어간 · 코럴 `#e0726e` = 어미·조사 · 파랑 `#3b82c4` = 발음 표기
