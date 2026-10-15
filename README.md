# Advanced Packaging Explorer

## 프로젝트 개요
- **이름**: Advanced Packaging Explorer
- **목적**: 반도체 패키징의 "큰 그림"부터 시작해, 7가지 패키징 아키텍처를 3D로 탐색하고,
  응용분야별 요구사항을 이해하고, 전체 기술 지형을 한 눈에 파악할 수 있는 인터랙티브 아틀라스
- **주요 기능**:
  - **00 · Overview** — 사이트 진입 시 첫 화면. 아이콘 중심의 그래픽 히어로 + 통계 칩 + 6단계 로드맵 스텝퍼(아이콘만, 텍스트 최소화) + 나머지 3개 뷰로 가는 아이콘 카드
  - **01 · 3D Explorer** — Three.js 기반 3D 뷰어 (회전/줌/단면/분해도/카메라 프리셋). 컴포넌트 클릭 시 기술 개요/키워드/재료/공정/과제/관련 기업/논문/노트 표시
  - **02 · Applications** — AI/HPC, Smartphone, 5G/6G, Aerospace/Harsh 4개 응용분야별로 "어떤 패키징 building block이 필요한지 / 어떤 challenge가 있는지 / 무엇을 해결해야 하는지"를 짧은 문구 기반의 아이콘 대시보드(Demand → Response → Bottleneck → Roadmap 4분할 카드)로 설명. Essential/Relevant 매트릭스 표 포함. 추천 패키지 버튼으로 3D Explorer의 해당 구조로 바로 이동 가능
  - **03 · Structure Map** — Fundamentals / Package Architectures / Commercial Technologies / Key Technologies / Challenges 5개 상위 카테고리를 **허브-스포크 마인드맵 스타일의 드릴다운 다이어그램**으로 표현 (기존의 평범한 텍스트 트리에서 완전히 재설계됨). 상단에 브레드크럼, 중앙에 현재 허브 카드, 하단에 자식 노드 카드 그리드가 배치되며, 자식 카드를 클릭하면 하위 카테고리로 드릴다운하거나(하위 노드가 있는 경우) 인라인으로 짧은 설명이 펼쳐짐(리프 노드인 경우). 3D 구조와 매칭되는 노드는 "View in 3D" 버튼이 붙어 클릭하면 3D Explorer의 정확한 컴포넌트로 이동
  - **04 · Ideas** — 나의 아이디어(스케치·컨셉)를 그림판(figure plate) 형태로 보여주는 화면. `assets/ideas/`에 이미지를 넣고 `data/ideas.js`에 항목을 추가하면 표시됨. (이전 Sketchboard는 제거 — Supabase `sketches` 테이블의 데이터는 그대로 남아 있음)
  - **디자인 원칙**: 모든 텍스트는 짧은 문구/칩 형태로 압축, Font Awesome 아이콘을 전면에 사용, 출처/논문 인용 텍스트는 사이트 어디에도 표시하지 않음
  - **공개 읽기**: 누구나 접속해 모든 콘텐츠(5개 뷰 전체)를 볼 수 있음
  - **오너 전용 편집**: 로그인한 오너만 논문 추가/삭제, 노트 작성, 스케치보드에 그리기 가능 (Supabase RLS로 서버단 강제)
  - **헤더/브랜딩**: 사이트 이름 **Hoogwan's Lab Notebook** (연구노트) — "Advanced Packaging · from die to package". Application이 시스템(패키지)을 결정한다는 관점. Nature 학술지 그림 스타일 + 자연 색감(숲·흙·호수 톤)
  - **3D Explorer 프리미엄 리디자인**: `MeshPhysicalMaterial` 기반 재질별(실리콘/금속/유기기판/유리/범프/TSV 등) 재질감 차별화, 스튜디오 조명(Hemisphere+Ambient+key/fill/rim) + ACES 톤매핑 + 비네트 텍스처로 입체감 강화, 카메라를 더 타이트하게 당겨(orthographic d=4.6) 오브젝트 존재감 확대, 각 3D 컴포넌트에서 점선 리더라인으로 뻗어나가는 이름표(라벨)를 추가 — 라벨을 클릭해도 오른쪽 정보 패널이 그대로 열림

## 화면 구성 (상단 네비게이션)
| 뷰 | 설명 |
|---|---|
| Overview | 랜딩 페이지. 아이콘 히어로 + 프레임워크 스텝퍼 + 뷰 안내 카드 |
| 3D Explorer | 5개 구조 — a. Flip-Chip·Fan-Out, b. 2.5D + 3D(CoWoS + SoIC/Hybrid Bonding + HBM 상세), c. Silicon Bridge(EMIB/UCIe), d. CPO, e. Future AI Server Node(Gupta/Lim 개념도 기반, Glass core 포함). 라벨과 리더라인은 모델을 따라 움직임 |
| Applications | 응용분야 × 패키징 매트릭스 + 4개 도메인별 아이콘 대시보드 |
| Structure Map | 전체 패키징 기술 지형을 허브-스포크 마인드맵으로 드릴다운 탐색 |
| Ideas | 나의 아이디어 스케치/컨셉 모음 (`data/ideas.js`) |

방문한 마지막 뷰는 `localStorage`(`advPkg.lastView`)에 저장되어, 다시 방문 시 이어서 표시됩니다 (콘텐츠 데이터 아님, UI 상태만).

## URLs
- **Production**: https://advanced-packaging-study-hg.vercel.app/
- **GitHub**: https://github.com/Hoogwan/Advanced-Packaging-Study-HG

## 데이터 아키텍처
- **정적 콘텐츠**:
  - `data/components.js` — 원래의 부품 콘텐츠 라이브러리(엘리먼트 id 유지). `data/packages.js` — 이 라이브러리에서 5개 구조를 조합 + CPO/AI Server Node 신규 부품. 구조를 합치며 옮겨진 부품은 `legacyPkg`로 원래 package id를 기억해서, Supabase에 저장된 논문/메모가 그대로 연결됨
  - `data/applications.js` — `window.APPLICATIONS`(4개 응용분야별 demand/response/bottleneck/roadmap 짧은 문구 + from/to 다이어그램(chips) + 아이콘 + 추천 패키지), `window.APP_MATRIX`(7개 building block × 4개 응용분야 essential/relevant/blank 매트릭스, 컬럼별 아이콘 포함), `window.APP_FRAMEWORK`(6단계 로드맵 프레임워크, step/title/icon만). 사이트 내에는 출처/인용 텍스트를 표시하지 않음(내부 참고 자료: Mahajan et al., *Nature Reviews Electrical Engineering* 3, 254–263, 2026 — 텍스트는 재구성/압축되었고 일부는 참고 자료를 넘어 확장 작성됨)
  - `data/structure-tree.js` — `window.STRUCTURE_TREE` — Fundamentals/Package Architectures/Commercial Technologies/Key Technologies/Challenges 5개 브랜치를 가진 지식 트리. 각 노드는 짧은 설명(`desc`, 한 문구), 아이콘(`icon`), 선택적 강조색(`color`)과 3D Explorer로의 딥링크(`link: {packageId, elementId}`)를 가질 수 있음
- **동적 콘텐츠(Supabase Postgres)**:
  - `public.papers` — 사용자(오너)가 추가한 논문 (package_id, element_id, title, url, notes)
  - `public.notes` — 엘리먼트별 자유 노트 (package_id + element_id 당 1행)
  - `public.sketches` — (이전 Sketchboard용, 현재 화면에서는 사용하지 않음. 데이터 보존을 위해 테이블은 그대로 둠)
  - `public.app_config` — `owner_email` 설정값 저장
- **인증**: Supabase Auth (email/password), `is_owner()` SQL 함수로 오너 여부 판별
- **접근 제어**: Row Level Security
  - SELECT: 모두 허용 (공개 읽기)
  - INSERT/UPDATE/DELETE: `is_owner()`가 true인 경우만 허용
- **UI 전용 상태**: `localStorage`에 저장 (콘텐츠 아님)
  - `advPkg.lastView` — 마지막으로 본 상단 뷰 (overview/explorer/applications/structure)
  - `advPkg.lastPkg` — 3D Explorer 안에서 마지막으로 본 패키지 인덱스

## 파일 구조
```
webapp/
├── index.html               # 페이지 셸 — 4개 view-section + script 태그
├── styles.css                # 전체 스타일 (뷰 네비게이션 + 4개 뷰 스타일 전부 포함)
├── data/
│   ├── components.js          # 부품 콘텐츠 라이브러리 (원본)
│   ├── packages.js            # 3D Explorer: 5개 구조 조합 + 신규 부품
│   ├── ideas.js               # Ideas 뷰 데이터
│   ├── applications.js         # Applications 뷰: 응용분야 데이터 + 매트릭스 + 프레임워크
│   └── structure-tree.js       # Structure Map 뷰: 지식 트리 + 3D 딥링크
├── js/
│   ├── config.js               # Supabase URL + Publishable key
│   ├── config.example.js       # config.js 템플릿(참고용)
│   ├── auth.js                 # 로그인 popover UI + 오너 체크 (window.auth)
│   ├── data-store.js           # Supabase CRUD 래퍼 (window.dataStore)
│   ├── scene.js                 # Three.js 3D 씬 빌더 + 인터랙션 (window.PkgScene)
│   ├── app.js                   # 상단 뷰 전환(window.AppNav) + 3D Explorer 탭/정보패널 로직
│   ├── overview-view.js          # Overview 뷰 렌더링 (아이콘 히어로 + 스텝퍼 + 카드)
│   ├── applications-view.js      # Applications 뷰 렌더링 (아이콘 탭, 매트릭스, from/to 다이어그램, 아이콘 쿼드런트)
│   ├── tree-view.js               # Structure Map 뷰 렌더링 (허브-스포크 마인드맵 드릴다운)
│   └── ideas-view.js              # Ideas 뷰: 아이디어 그림판
└── supabase/schema.sql        # DB 스키마 + RLS 정책 (papers/notes/sketches/app_config, Supabase SQL Editor에서 실행)
```

## 뷰 간 연동 (Cross-linking)
`js/app.js`가 노출하는 `window.AppNav` 객체가 5개 뷰를 하나로 묶습니다:
- `window.AppNav.switchView(viewName)` — 상단 네비게이션 전환 (`overview`/`explorer`/`applications`/`structure`/`ideas`)
- `window.AppNav.goToPackage(packageId, elementId?)` — Applications/Structure Map 뷰의 "3D로 보기" 버튼에서 호출. 3D Explorer로 전환하고, 해당 패키지 탭을 활성화하고(필요시 `elementId`까지 지정해 정확한 컴포넌트를 선택 상태로 만듦), 정보 패널에 상세 내용을 표시

## 사용자 가이드
1. **일반 방문자**: 사이트 접속 → Overview에서 큰 그림 확인 → Applications에서 관심 응용분야 아이콘 탭 클릭해 요구사항/challenge 확인 → 추천 패키지 버튼 클릭 → 3D Explorer로 자동 이동해 해당 구조를 회전/분해/단면으로 탐색 → 또는 Structure Map에서 카드를 클릭해 마인드맵을 드릴다운하며 전체 기술 지형을 훑어보기
2. **오너(관리자)**: 우측 상단 "Log in" 클릭 → Supabase Auth에 등록된 이메일/비밀번호 입력 → 로그인 성공 시 3D Explorer 정보 패널에 "+ Add paper" 버튼과 노트 편집 textarea, 논문 삭제 버튼이 나타남

## 배포 상태
- **플랫폼**: GitHub + Vercel (정적 사이트 호스팅) + Supabase (Auth + Postgres)
- **기술 스택**: Vanilla JS + Three.js r128 (MeshPhysicalMaterial + ACES 톤매핑) + Supabase JS SDK v2
- **빌드 과정**: 없음 (순수 정적 HTML/CSS/JS, 빌드 스텝 불필요)
- **최종 업데이트**: 2026-08-29

## 아직 구현되지 않은 것 / 다음 단계
- Realtime 멀티탭 동기화는 `data-store.js`에 훅만 만들어둠 (`onChange` 구독은 아직 미사용)
- 접근성(3D 콘텐츠의 스크린리더 지원, 리스트 뷰 대안)은 미구현
- 반응형 레이아웃은 데스크톱 우선(≥1000px). Overview/Applications/Structure Map/Ideas는 태블릿까지 대응하는 미디어쿼리를 넣었지만 3D Explorer 자체는 모바일 최적화가 부족함
- Applications 뷰의 4개 도메인은 PPT 원본(AI/HPC, Smartphone, 5G/6G, Aerospace)을 기반으로 하되 텍스트는 짧은 문구로 압축/재구성되었고 일부는 참고 자료를 넘어 확장 작성됨 — 추가 응용분야(예: 자동차, 데이터센터 네트워킹 등)를 원하면 `data/applications.js`에 도메인 객체를 추가하면 됨
- 커스텀 도메인 연결은 선택 사항 (Vercel에서 설정 가능)
