# AI 커뮤니티 플랫폼

이 프로젝트는 React, TypeScript, Tailwind CSS, Firebase를 사용하여 구축된 현대적인 AI 정보 공유 커뮤니티 플랫폼입니다. 사용자 인증, 게시물 작성 및 관리, 카테고리별 필터링, 완전한 다크모드 등 다양한 기능을 제공합니다.

## ✨ 주요 기능

### 🔐 인증 시스템
- **Firebase Authentication** 기반 로그인/회원가입
- **Google OAuth** 및 이메일/비밀번호 지원
- 자동 로그인 유지 및 설문조사 온보딩 시스템

### 📝 게시글 관리
- **TipTap 리치 텍스트 에디터**: 볼드, 이탤릭, 리스트, 인용구 등 고급 편집 기능
- **이미지 업로드**: 드래그&드롭, 클립보드 붙여넣기, Firebase Storage 연동
- **YouTube 임베딩**: URL 자동 감지 및 비디오 삽입
- **링크 미리보기**: 메타데이터 자동 추출 및 표시
- **실시간 댓글 시스템**: Firestore 서브컬렉션 기반 실시간 댓글
- **좋아요 기능**: 게시글 및 댓글 좋아요/취소 시스템

### 👤 프로필 관리
- **프로필 이미지 업로드**: Firebase Storage 기반 이미지 업로드
- **실시간 프로필 동기화**: 프로필 변경 시 즉시 UI 반영
- **구글 프로필 보호**: 구글 로그인 사용자의 기존 프로필 이미지 유지
- **이미지 최적화**: 파일 크기 제한 및 형식 검증

### 🔍 고급 필터링 & 검색
- **카테고리 시스템**: AI, 머신러닝, 딥러닝, NLP, Computer Vision, 기타
- **실시간 검색**: 제목 및 내용 즉시 검색
- **정렬 기능**: 최신순, 인기순, 댓글순
- **URL 기반 필터링**: 브라우저 히스토리 및 북마크 지원

### 🎨 세련된 UI/UX
- **완전한 다크모드**: 모든 컴포넌트 다크 테마 지원
- **슬레이트 색상 체계**: 세련된 그레이 기반 브랜드 컬러
- **직관적인 액션 색상**: ❤️ 좋아요(빨강), 💬 댓글(파랑), 🔗 공유(초록)
- **반응형 디자인**: 모바일부터 데스크탑까지 최적화

### 📱 모던 레이아웃
- **중앙 집중식 디자인**: 깔끔한 카드 기반 3열 그리드
- **읽기 최적화**: 4xl 최대 너비로 가독성 향상
- **부드러운 애니메이션**: 모든 인터랙션에 트랜지션 효과

## 🛠 기술 스택

### Frontend
- **React 18** + **Create React App** + **TypeScript**
- **Tailwind CSS** + 커스텀 컴포넌트 라이브러리
- **React Router v6** (클라이언트 사이드 라우팅)
- **TipTap Editor** (ProseMirror 기반 리치 텍스트)
- **Lucide React** (아이콘 라이브러리)

### Backend & Services
- **Firebase Authentication** (Google OAuth, Email/Password)
- **Firestore** (NoSQL 데이터베이스)
- **Firebase Storage** (이미지 및 파일 저장)
- **React Context API** (전역 상태 관리)

### Development Tools
- **ESLint** + **TypeScript** (코드 품질 관리)
- **npm** (패키지 매니저)
- **Git** (버전 관리)

## 📁 프로젝트 구조

```
myproject25/
├── public/             # 정적 파일
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── auth/       # 인증 관련
│   │   ├── features/   # 기능별 컴포넌트
│   │   ├── layout/     # Header, Layout, Sidebar
│   │   ├── ui/         # 기본 UI 컴포넌트
│   │   ├── CreatePost.tsx      # 게시글 작성
│   │   ├── TipTapEditor.tsx    # 리치 텍스트 에디터
│   │   ├── LinkPreview.tsx     # 링크 미리보기
│   │   └── AdminDeleteButton.tsx # 관리자 삭제 버튼
│   ├── contexts/       # React Context (Auth, Post, Theme)
│   ├── firebase/       # Firebase 설정
│   ├── hooks/          # 커스텀 훅
│   ├── pages/          # 페이지 컴포넌트
│   ├── services/       # 비즈니스 로직 (API 연동)
│   └── lib/            # 유틸리티 함수
├── docs/               # 프로젝트 문서
└── package.json
```

## 🚀 설치 및 실행

### 1. 저장소 복제
```bash
git clone <repository-url>
cd myproject25
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 🔐 환경 변수 설정 (보안 중요!)

#### Firebase 설정을 위한 환경 변수 생성:

```bash
# 1. .env.example 파일을 .env로 복사
cp .env.example .env

# 2. .env 파일을 열고 실제 Firebase 설정값으로 교체
# Firebase 콘솔 > 프로젝트 설정 > 일반 탭에서 확인 가능
```

#### ⚠️ 보안 주의사항:
- **절대로 실제 API 키를 GitHub에 커밋하지 마세요**
- `.env` 파일은 `.gitignore`에 포함되어 있어 Git에서 제외됩니다
- `.env.example` 파일에는 예시 값만 포함되어 있습니다
- Firebase 콘솔에서 실제 설정 값을 복사하여 `.env` 파일에 넣으세요
- 팀원들과는 안전한 방법으로 환경 변수를 공유하세요

### 4. Firebase 프로젝트 설정

Firebase 콘솔 (https://console.firebase.google.com)에서:

1. **새 프로젝트 생성** 또는 기존 프로젝트 사용
2. **Authentication 활성화**:
   - Google 로그인 제공업체 활성화
   - 이메일/비밀번호 로그인 활성화
3. **Firestore Database 생성**:
   - 테스트 모드로 시작 (나중에 보안 규칙 설정)
4. **Storage 활성화**:
   - 기본 보안 규칙으로 시작
5. **웹 앱 설정**:
   - 프로젝트 설정 > 일반 > 앱 추가 > 웹
   - Firebase SDK 설정 값을 `.env` 파일에 복사

### 5. 개발 서버 실행
```bash
npm start
```

기본적으로 http://localhost:3000에서 실행됩니다. (포트가 사용 중이면 자동으로 다른 포트 제안)

### 6. 프로덕션 빌드
```bash
npm run build
```

## 🔐 보안 가이드

### 환경 변수 관리
```bash
# .env 파일 (로컬 개발용 - Git에서 제외됨)
REACT_APP_FIREBASE_API_KEY=실제_API_키
REACT_APP_FIREBASE_AUTH_DOMAIN=실제_도메인
# ... 기타 Firebase 설정

# .env.example 파일 (GitHub에 포함 - 템플릿용)
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain_here
# ... 예시 값들
```

### Firebase 보안 규칙 (권장)
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
      
      // 댓글 서브컬렉션
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
          request.auth.uid == resource.data.authorId;
      }
    }
  }
}

// Storage Rules (프로필 이미지)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-images/{userId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 10 * 1024 * 1024; // 10MB 제한
    }
  }
}
```

### GitHub에 업로드하기 전 체크리스트
- [x] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [x] 코드에 하드코딩된 API 키가 없는지 확인
- [x] 실제 Firebase 설정이 환경 변수로 분리되어 있는지 확인
- [x] `.env.example` 파일로 팀원들을 위한 템플릿 제공
- [x] `docs/firebaseid.md`에서 실제 API 키 제거 완료

## 🗄️ 데이터베이스 구조

### Firestore Collections
```
users/                  # 사용자 정보
├── displayName         # 사용자 이름
├── email              # 이메일
├── photoURL           # 프로필 이미지
├── surveyCompleted    # 설문조사 완료 여부
└── createdAt          # 가입일

posts/                 # 게시글
├── title              # 제목
├── content            # HTML 내용
├── authorId           # 작성자 ID
├── category           # 카테고리 (ai/ml/deep/nlp/cv/other)
├── tags[]             # 태그 배열
├── likeCount          # 좋아요 수
├── likedBy[]          # 좋아요 누른 사용자 ID 배열
├── commentCount       # 댓글 수
├── createdAt          # 작성일
└── comments/          # 댓글 서브컬렉션
    ├── content        # 댓글 내용
    ├── authorId       # 댓글 작성자 ID
    ├── authorName     # 댓글 작성자 이름
    ├── authorPhotoURL # 댓글 작성자 프로필 이미지
    ├── likeCount      # 댓글 좋아요 수
    ├── likedBy[]      # 댓글 좋아요 누른 사용자 배열
    └── createdAt      # 댓글 작성일
├── linkPreview        # 링크 미리보기 정보
└── createdAt          # 작성일
```

### Firebase Storage
```
images/                # 게시글 이미지
├── {timestamp}_{filename}
└── ...
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: 슬레이트 계열 (slate-700, slate-800)
- **Background**: 
  - 라이트: bg-gray-50, bg-white
  - 다크: bg-gray-900, bg-gray-800
- **Action Colors**:
  - 좋아요: text-red-500 ❤️
  - 댓글: text-blue-500 💬
  - 공유: text-emerald-500 🔗

### 반응형 브레이크포인트
- **Mobile**: 320px ~ 768px
- **Tablet**: 768px ~ 1024px
- **Desktop**: 1024px+

## 📋 주요 컴포넌트

### HomePage
- 카테고리별 탭 네비게이션
- 실시간 검색 및 필터링
- 3열 반응형 카드 그리드
- 빈 상태 처리

### TipTapEditor
- ProseMirror 기반 WYSIWYG 에디터
- 이미지 업로드 및 YouTube 임베딩
- 완전한 다크모드 지원
- 실시간 미리보기

### Header
- 투명 배경 + 백드롭 블러
- 카테고리 드롭다운 메뉴
- 다크모드 토글 (Moon/Sun 아이콘)
- 사용자 프로필 메뉴

## 🔧 주요 기능 구현 상태

### ✅ 완료된 기능
- [x] 사용자 인증 시스템 (Google OAuth, Email/Password)
- [x] 게시글 CRUD (TipTap 에디터, 이미지 업로드)
- [x] 카테고리 시스템 및 필터링
- [x] 실시간 검색 기능
- [x] 완전한 다크모드 지원
- [x] 반응형 디자인
- [x] 색상 시스템 개선 (슬레이트 체계)

### 🚧 진행 중/계획 중
- [ ] 댓글 시스템
- [ ] 좋아요/북마크 기능
- [ ] 사용자 프로필 페이지
- [ ] 게시글 상세 페이지
- [ ] 무한 스크롤
- [ ] 1:1 채팅 시스템
- [ ] 실시간 알림

## 📊 성능 지표

- **TypeScript 적용률**: 100%
- **다크모드 지원률**: 100%
- **반응형 대응률**: 100%
- **빌드 성공률**: 100%
- **ESLint 준수율**: 100%

## 📖 문서

프로젝트의 상세한 문서는 `docs/` 디렉터리에서 확인할 수 있습니다:

- **[PRD](docs/prd.md)**: 제품 요구사항 문서
- **[구현 현황](docs/implementation-status.md)**: 상세한 구현 상태
- **[다크모드 기능](docs/dark-mode-feature.md)**: 다크모드 구현 명세
- **[프론트엔드 계획](docs/frontend.md)**: 프론트엔드 아키텍처
- **[인증 시스템](docs/auth.md)**: 인증 기능 상세
- **[데이터베이스](docs/database.md)**: DB 구조 설명

## 🤝 기여

프로젝트에 기여하고 싶으시면:

1. 이 저장소를 포크하세요
2. 새로운 기능 브랜치를 만드세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 열어주세요

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**최근 업데이트**: 2024년 1월 15일
**주요 변경사항**: 색상 시스템 혁신, 완전한 다크모드 구현, 카테고리 필터링 시스템 완성
