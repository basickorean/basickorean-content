# Basic Korean — 콘텐츠 저장소

베이직 코리안 학습 콘텐츠의 **버전 관리 + 공용 코드 배포** 저장소입니다.
실제 사이트 운영은 **Blogger (basickorean.com)**, 이 저장소는:

1. 모든 강의 콘텐츠의 원본·이력 관리 (note.md, post.html)
2. 공용 디자인/엔진 코드(`assets/`)를 **jsDelivr CDN**으로 Blogger에 서빙

## 구조

```
repo/
├─ assets/                 ← jsDelivr로 서빙되는 공용 파일
│   ├─ bk.css              공용 디자인 (모든 강의 페이지 스타일)
│   ├─ bk.js               공용 엔진 (한글 활용 엔진 + 컴포넌트, 사전 컴파일본)
│   └─ bklogo.jpg          로고
├─ lessons/
│   ├─ grammar/            문법 (G001 ~ G204+)
│   │   └─ G203/
│   │       ├─ note.md     강의노트 (마크다운 원본)
│   │       └─ post.html   Blogger 포스트 본문 (복붙용)
│   ├─ hangul/             한글 (6강)
│   ├─ vocabulary/         어휘 (~100강)
│   └─ pronunciation/      발음 (~20강)
├─ tools/                  활용 도구 등 (Blogger '페이지'용 본문)
└─ scripts/                빌드·변환 보조 스크립트
```

## jsDelivr 사용법

GitHub에 푸시하면 아래 주소로 즉시 서빙됩니다 (Blogger 테마에 1회 삽입):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/basickorean/basickorean-content@main/assets/bk.css">
<script src="https://cdn.jsdelivr.net/gh/basickorean/basickorean-content@main/assets/bk.js"></script>
```

- 디자인 수정 = `bk.css` 한 파일 수정 → 모든 Blogger 포스트에 일괄 반영
- 안정 운영 시에는 `@main` 대신 태그 버전(`@v1.0.0`) 고정 권장

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
