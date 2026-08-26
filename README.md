# Advanced Packaging Explorer

## 프로젝트 개요
- **이름**: Advanced Packaging Explorer
- **목적**: 7가지 반도체 패키징 아키텍처(2.5D 인터포저, 3D IC/하이브리드 본딩, Fan-Out WLP, Flip Chip FCBGA, Chiplet, HBM Stack, Glass Substrate PLP)를 3D로 탐색하는 인터랙티브 아틀라스
- **주요 기능**:
  - Three.js 기반 3D 뷰어 (회전/줌/단면/분해도/카메라 프리셋)
  - 컴포넌트 클릭 시 기술 개요/키워드/재료/공정/과제/관련 기업/논문/노트 표시
  - **공개 읽기**: 누구나 접속해 모든 콘텐츠를 볼 수 있음
  - **오너 전용 편집**: 로그인한 오너만 논문 추가/삭제, 노트 작성 가능 (Supabase RLS로 서버단 강제)

## URLs
- **Production**: (Vercel 배포 후 이 자리에 URL을 채워주세요, 예: `https://advanced-packaging-explorer.vercel.app`)
- **GitHub**: (레포 URL을 채워주세요)

## 데이터 아키텍처
- **정적 콘텐츠**: `data/packages.js` — 7개 패키지, ~50개 엘리먼트의 기본 콘텐츠 (하드코딩, 배포 시 함께 제공)
- **동적 콘텐츠(Supabase Postgres)**:
  - `public.papers` — 사용자(오너)가 추가한 논문 (package_id, element_id, title, url, notes)
  - `public.notes` — 엘리먼트별 자유 노트 (package_id + element_id 당 1행)
  - `public.app_config` — `owner_email` 설정값 저장
- **인증**: Supabase Auth (email/password), `is_owner()` SQL 함수로 오너 여부 판별
- **접근 제어**: Row Level Security
  - SELECT: 모두 허용 (공개 읽기)
  - INSERT/UPDATE/DELETE: `is_owner()`가 true인 경우만 허용
- **UI 전용 상태**: 마지막으로 본 탭 인덱스는 `localStorage`(`advPkg.lastPkg`)에 저장 (콘텐츠 아님)

## 파일 구조
```
webapp/
├── index.html          # 페이지 셸 (script 태그 포함)
├── styles.css           # 전체 스타일
├── data/packages.js     # 패키지/엘리먼트 기본 콘텐츠
├── js/
│   ├── config.js         # Supabase URL + Publishable key
│   ├── config.example.js # config.js 템플릿(참고용)
│   ├── auth.js           # 로그인 popover UI + 오너 체크 (window.auth)
│   ├── data-store.js     # Supabase CRUD 래퍼 (window.dataStore)
│   ├── scene.js           # Three.js 3D 씬 빌더 + 인터랙션
│   └── app.js             # 탭 전환, 정보 패널 렌더링, 오너 게이팅
└── supabase/schema.sql   # DB 스키마 + RLS 정책 (Supabase SQL Editor에서 실행)
```

## 사용자 가이드
1. **일반 방문자**: 사이트 접속 → 탭에서 패키지 선택 → 3D 모델의 컴포넌트 클릭 → 우측 패널에서 기술 정보/논문/노트 확인 (읽기 전용)
2. **오너(관리자)**: 우측 상단 "Log in" 클릭 → Supabase Auth에 등록된 이메일/비밀번호 입력 → 로그인 성공 시 "+ Add paper" 버튼과 노트 편집 textarea, 논문 삭제 버튼이 나타남

## 배포 상태
- **플랫폼**: GitHub + Vercel (정적 사이트 호스팅) + Supabase (Auth + Postgres)
- **기술 스택**: Vanilla JS + Three.js r128 + Supabase JS SDK v2
- **빌드 과정**: 없음 (순수 정적 HTML/CSS/JS, 빌드 스텝 불필요)
- **최종 업데이트**: 2026-08-26

## 아직 구현되지 않은 것 / 다음 단계
- Realtime 멀티탭 동기화는 `data-store.js`에 훅만 만들어둠 (`onChange` 구독은 app.js에서 아직 미사용)
- 접근성(3D 콘텐츠의 스크린리더 지원, 리스트 뷰 대안)은 미구현
- 반응형 레이아웃은 데스크톱 우선(≥1000px), 모바일 최적화 없음
- 커스텀 도메인 연결은 선택 사항 (Vercel에서 설정 가능)
