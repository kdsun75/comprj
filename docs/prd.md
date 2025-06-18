# AI 커뮤니티 플랫폼 PRD (Product Requirements Document)

## 📋 프로젝트 개요

AI 정보 공유를 중심으로 한 커뮤니티 플랫폼을 구축합니다.
사용자들이 자유롭게 AI 관련 글과 정보를 작성하고 댓글을 남기며, 프로필을 설정하고 1:1로 소통할 수 있는 기능을 제공합니다.
Firebase 기반으로 백엔드를 구성하며, 프론트엔드는 React 및 Tailwind CSS를 활용하여 현대적이고 깔끔한 UI/UX를 제공합니다.

## 🎯 핵심 목표
- AI 정보 공유를 위한 사용자 친화적인 커뮤니티 플랫폼 구축 ✅
- 실시간 소통이 가능한 1:1 채팅 시스템 (계획 중)
- 반응형 웹 디자인으로 모든 디바이스에서 최적화된 경험 제공 ✅
- Firebase 기반의 안정적이고 확장 가능한 백엔드 구조 ✅

## 🛠 기술 스택 (실제 구현)

### Frontend ✅
- **Framework**: React 18 + Create React App (TypeScript)
- **Language**: TypeScript
- **Styling**: TailwindCSS + 커스텀 컴포넌트 라이브러리
- **State Management**: React Context API (AuthContext, PostContext, ThemeContext)
- **Rich Text Editor**: TipTap (ProseMirror 기반)
- **Icons**: Lucide React
- **Routing**: React Router v6

### Backend ✅
- **Authentication**: Firebase Authentication (Google OAuth, Email/Password)
- **Database**: Firestore (메인 데이터 저장)
- **Real-time Database**: Firebase Realtime Database (채팅용 - 계획 중)
- **Storage**: Firebase Storage (이미지 및 파일 업로드)
- **Hosting**: 로컬 개발 환경 (배포 준비 중)

## 🔧 구현 완료된 핵심 기능

### 1. 사용자 인증 및 관리 ✅
- **Firebase Authentication 기반**
  - Google 계정 로그인 연동 ✅
  - 이메일/비밀번호 로그인 ✅
  - 자동 로그인 유지 ✅
  - 로그아웃 기능 ✅

- **사용자 프로필**
  - Firebase Storage 프로필 이미지 업로드 지원 ✅
  - 사용자 정보 Firestore 저장 ✅
  - 설문조사 온보딩 시스템 ✅

### 2. 게시글 시스템 ✅
- **게시글 CRUD**
  - TipTap 리치 텍스트 에디터 (볼드, 이탤릭, 리스트, 인용구 등) ✅
  - 이미지 업로드 (드래그&드롭, 클립보드 지원) ✅
  - YouTube 임베딩 및 링크 미리보기 ✅
  - 카테고리 시스템 (AI, 머신러닝, 딥러닝, NLP, Computer Vision, 기타) ✅
  - 태그 시스템 (최대 10개) ✅

- **게시글 조회 및 필터링**
  - 전체 글 목록 조회 ✅
  - 카테고리별 필터링 (URL 파라미터 연동) ✅
  - 실시간 검색 기능 (제목, 내용) ✅
  - 정렬 기능 (최신순, 인기순, 댓글순) ✅
  - 활성 필터 표시 및 초기화 ✅

### 3. UI/UX 시스템 ✅
- **완전한 다크모드 지원**
  - ThemeContext를 통한 전역 테마 관리 ✅
  - 로컬 스토리지 연동으로 설정 영구 보존 ✅
  - 시스템 테마 자동 감지 ✅
  - Header의 Moon/Sun 토글 버튼 ✅
  - 모든 컴포넌트 다크모드 스타일링 완료 ✅

- **세련된 색상 시스템**
  - 기존 파란색 계열을 슬레이트/그레이로 교체 ✅
  - 하트(좋아요): 빨간색, 댓글: 파란색, 공유: 에메랄드 그린 ✅
  - 일관된 브랜드 색상 체계 적용 ✅

- **반응형 디자인**
  - Mobile-first 접근 방식 ✅
  - 터치 친화적 인터페이스 ✅
  - 3단계 브레이크포인트 (Mobile/Tablet/Desktop) ✅

### 4. 레이아웃 및 네비게이션 ✅
- **Header 컴포넌트**
  - 투명 배경 + 백드롭 블러 효과 ✅
  - 로고, 네비게이션, 검색, 알림, 다크모드 토글 ✅
  - 사용자 드롭다운 메뉴 ✅
  - 카테고리 드롭다운 메뉴 ✅

- **중앙 집중식 레이아웃**
  - Sidebar 제거, 메인 콘텐츠 중앙 정렬 ✅
  - 4xl 최대 너비로 읽기 최적화 ✅

## 📁 실제 프로젝트 구조

```
myproject25/
├── 📁 public/                # 정적 파일
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
├── 📁 src/
│   ├── 📁 components/        # 재사용 가능한 컴포넌트
│   │   ├── 📁 auth/         # 인증 관련 컴포넌트
│   │   ├── 📁 features/     # 기능별 컴포넌트
│   │   │   ├── 📁 auth/
│   │   │   ├── 📁 chat/
│   │   │   └── 📁 posts/
│   │   ├── 📁 layout/       # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── 📁 ui/           # 기본 UI 컴포넌트
│   │   ├── CreatePost.tsx    # 게시글 작성
│   │   ├── TipTapEditor.tsx  # 리치 텍스트 에디터
│   │   ├── LinkPreview.tsx   # 링크 미리보기
│   │   └── Modal.tsx         # 모달 컴포넌트
│   ├── 📁 contexts/         # React Context API
│   │   ├── AuthContext.tsx   # 인증 상태 관리
│   │   ├── PostContext.tsx   # 게시글 상태 관리
│   │   └── ThemeContext.tsx  # 테마 상태 관리
│   ├── 📁 firebase/         # Firebase 설정
│   │   └── config.ts
│   ├── 📁 hooks/            # 커스텀 훅
│   │   └── useAuth.ts
│   ├── 📁 lib/              # 유틸리티 함수
│   ├── 📁 pages/            # 페이지 컴포넌트
│   │   ├── HomePage.tsx      # 메인 홈페이지
│   │   ├── LoginPage.tsx     # 로그인 페이지
│   │   ├── SignUp.tsx        # 회원가입 페이지
│   │   ├── Profile.tsx       # 프로필 페이지
│   │   └── SurveyPage.tsx    # 설문조사 페이지
│   ├── 📁 services/         # 비즈니스 로직
│   │   ├── authService.ts    # 인증 서비스
│   │   ├── postService.ts    # 게시글 서비스
│   │   └── statsService.ts   # 통계 서비스
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── 📁 docs/                 # 프로젝트 문서
├── 📄 package.json
├── 📄 tailwind.config.js
├── 📄 tsconfig.json
└── 📄 README.md
```

## 🗄 데이터베이스 구조 (구현됨)

### Firestore Collections ✅
```
users/                        # 사용자 정보
├── displayName               # 사용자 이름
├── email                     # 이메일
├── photoURL                  # 프로필 이미지
├── surveyCompleted           # 설문조사 완료 여부
└── createdAt                 # 가입일

posts/                        # 게시글
├── title                     # 제목
├── content                   # HTML 내용
├── authorId                  # 작성자 ID
├── category                  # 카테고리 (ai/ml/deep/nlp/cv/other)
├── tags[]                    # 태그 배열
├── likeCount                 # 좋아요 수
├── commentCount              # 댓글 수
├── linkPreview               # 링크 미리보기 정보
├── extractedLinks[]          # 추출된 링크 목록
├── createdAt                 # 작성일
└── updatedAt                 # 수정일

comments/                     # 댓글 (서브컬렉션 - 계획 중)
likes/                        # 좋아요 정보 (계획 중)
bookmarks/                    # 북마크 정보 (계획 중)
```

### Storage Structure ✅
```
images/                       # 게시글 이미지
├── {timestamp}_{filename}    # 유니크한 파일명으로 저장
└── ...

profiles/                     # 프로필 이미지 (계획 중)
chats/                        # 채팅 파일 (계획 중)
```

## 🎨 디자인 시스템 (구현됨)

### 색상 팔레트 ✅
- **Primary**: 슬레이트 계열 (slate-700, slate-800)
- **배경**: 
  - 라이트: bg-gray-50, bg-white
  - 다크: bg-gray-900, bg-gray-800
- **텍스트**:
  - 라이트: text-gray-900, text-gray-700
  - 다크: text-white, text-gray-300
- **액센트 색상**:
  - 좋아요: text-red-500
  - 댓글: text-blue-500
  - 공유: text-emerald-500

### 반응형 브레이크포인트 ✅
- Mobile: 320px ~ 768px
- Tablet: 768px ~ 1024px  
- Desktop: 1024px+

## 🚀 배포 계획

### 배포 환경 (준비 중)
- **호스팅**: Firebase Hosting
- **도메인**: 커스텀 도메인 연결 예정
- **SSL**: Firebase Hosting 자동 SSL

### 성능 최적화 ✅
- **이미지 최적화**: 파일 크기 제한 (5MB), 형식 검증
- **컴포넌트 최적화**: React.memo 적용
- **효율적인 상태 관리**: Context API 활용

## 📈 개발 현황 및 다음 단계

### Phase 1 (완료) ✅
- [x] 기본 인증 시스템 (Google OAuth, Email/Password)
- [x] 게시글 CRUD (TipTap 에디터, 이미지 업로드)
- [x] 카테고리 시스템 및 필터링
- [x] 검색 기능 (실시간 검색)
- [x] 다크모드 전체 적용
- [x] 반응형 디자인
- [x] 색상 시스템 개선

### Phase 2 (진행 중/계획)
- [ ] 댓글 시스템 구현
- [ ] 좋아요/북마크 기능
- [ ] 사용자 프로필 페이지 완성
- [ ] 게시글 상세 페이지
- [ ] 무한 스크롤 구현

### Phase 3 (향후 계획)
- [ ] 1:1 채팅 시스템 (Firebase Realtime Database)
- [ ] 실시간 알림 시스템
- [ ] 관리자 패널
- [ ] PWA 지원
- [ ] 이메일 알림

## 🔐 보안 및 권한 (구현됨)

### Authentication Rules ✅
- 로그인한 사용자만 게시글 작성 가능
- Firebase Authentication으로 사용자 신원 확인
- 설문조사 완료 후 서비스 이용 가능

### Firestore Security Rules (구현 필요)
- 사용자 프로필: 읽기는 모든 사용자, 쓰기는 본인만
- 게시글: 읽기는 모든 사용자, 쓰기는 작성자만
- 댓글: 읽기는 모든 사용자, 쓰기는 작성자만

## 🎯 주요 성과

### 기술적 성과
- **TypeScript 적용률**: 100%
- **다크모드 적용률**: 100% (모든 컴포넌트)
- **반응형 대응률**: 100%
- **컴포넌트 재사용률**: 높음
- **성능**: 빠른 로딩, 부드러운 애니메이션

### 사용자 경험
- 직관적인 카테고리 필터링
- 실시간 검색으로 즉시 결과 확인
- 완전한 다크모드 지원
- 세련된 색상 체계로 브랜드 일관성
- 터치 친화적 모바일 인터페이스

---

**📝 문서 업데이트 히스토리**
- 2024.01.01: 초기 PRD 작성
- 2024.01.15: 실제 구현 상태 반영 업데이트
  - Create React App 기반 구현 현황 반영
  - 카테고리 필터링 시스템 완성
  - 다크모드 전체 적용 완료
  - 색상 시스템 개선 (슬레이트 계열) 완료
  - 실제 기능 구현 상태 정확히 반영
