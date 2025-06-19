# Firebase 프로젝트 설정 및 보안 가이드

## 🔧 현재 프로젝트 설정

### Firebase 프로젝트 정보
- **프로젝트 ID**: `your_project_id`
- **프로젝트 이름**: AI 커뮤니티 플랫폼
- **데이터베이스 리전**: `asia-southeast1` (싱가포르)

### 활성화된 Firebase 서비스 ✅
- **Authentication**: Google OAuth, Email/Password 인증
- **Firestore Database**: 사용자 및 게시글 데이터 저장
- **Realtime Database**: 채팅 기능용 (향후 사용)
- **Storage**: 이미지 및 파일 업로드

## 🔐 보안 설정 (중요!)

### 환경 변수 기반 설정 (권장)

```typescript
// src/firebase/config.ts (현재 구현 - 보안 완료 ✅)
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 환경 변수를 통한 안전한 설정
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 서비스 인스턴스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
```

### 환경 변수 설정 (.env 파일)

```bash
# .env 파일에 실제 Firebase 프로젝트 설정값을 저장하세요
# 아래는 예시 형태입니다. 실제 값은 Firebase 콘솔에서 확인하세요.
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# 선택적: Realtime Database URL (채팅 기능용)
REACT_APP_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.region.firebasedatabase.app
```

> ⚠️ **보안 중요**: 실제 Firebase 설정값은 `.env` 파일에 저장하고, 절대 GitHub에 커밋하지 마세요!

## 🛡️ 보안 가이드

### 1. 환경 변수 관리
```bash
# .env 파일 (로컬 개발용)
✅ Git에서 제외됨 (.gitignore에 포함)
✅ 실제 API 키와 설정 값 포함
❌ GitHub에 절대 업로드하지 말 것

# .env.example 파일 (템플릿용)
✅ GitHub에 포함 가능
✅ 예시 값들만 포함
✅ 팀원들을 위한 가이드 역할
```

### 2. Firebase 보안 규칙

#### Firestore Rules (필수 설정)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필: 모든 사람이 읽기, 본인만 수정
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 게시글: 모든 사람이 읽기, 로그인한 사람이 작성, 작성자만 수정
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
  }
}
```

#### Storage Rules (필수 설정)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 이미지: 로그인한 사용자만 업로드, 모든 사람이 읽기
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.resource.size < 5 * 1024 * 1024; // 5MB 제한
    }
  }
}
```

### 3. API 키 보안 수준

#### API 키 제한 설정 (권장)
```
API 키 제한 사항:
✅ HTTP 리퍼러 제한 (localhost:*, 배포 도메인)
✅ API 제한 (필요한 Firebase API만 활성화)
⚠️ IP 주소 제한 (선택적)
```

## 📋 설정 체크리스트

### 환경 변수 설정 ✅
- [x] `.env` 파일에 실제 Firebase 설정 저장
- [x] `.gitignore`에 `.env` 파일 제외 설정
- [x] `src/firebase/config.ts`에서 환경 변수 사용
- [x] 코드에 하드코딩된 API 키 제거

### Firebase 콘솔 설정 🚧
- [x] Authentication 서비스 활성화
- [x] Firestore Database 생성 (테스트 모드)
- [x] Storage 활성화 (기본 규칙)
- [ ] **Firestore 보안 규칙 적용** (배포 전 필수)
- [ ] **Storage 보안 규칙 적용** (배포 전 필수)
- [ ] **API 키 제한 설정** (프로덕션 배포 시)

### GitHub 업로드 전 체크 ✅
- [x] `.env` 파일이 Git에서 제외되는지 확인
- [x] 실제 API 키가 코드에 없는지 확인
- [x] 환경 변수 기반 설정 완료
- [x] `.env.example` 파일 생성 (팀원용 템플릿)

## 🚨 보안 주의사항

### ❌ 하지 말아야 할 것들
- 실제 API 키를 GitHub에 커밋
- 코드에 Firebase 설정 하드코딩
- 보안 규칙 없이 프로덕션 배포
- `.env` 파일을 팀원들과 공개 채널로 공유

### ✅ 해야 할 것들
- 환경 변수 사용으로 설정 분리
- Firebase 보안 규칙 적용
- API 키 제한 설정
- 정기적인 보안 검토

## 🔄 추가 보안 개선 계획

### 단기 (1-2주)
- [ ] Firebase 보안 규칙 강화
- [ ] API 키 HTTP 리퍼러 제한 설정
- [ ] 사용자 권한 세분화

### 중기 (1개월)
- [ ] 환경별 Firebase 프로젝트 분리 (dev/prod)
- [ ] 모니터링 및 로깅 설정
- [ ] 보안 감사 자동화

## 🚀 프로젝트 설정 가이드

### 1. 환경 변수 설정
```bash
# 1. .env.example 파일을 .env로 복사
cp .env.example .env

# 2. .env 파일을 열고 실제 Firebase 설정값으로 교체
# Firebase 콘솔 > 프로젝트 설정 > 일반 탭에서 확인 가능
```

### 2. Firebase 콘솔 설정
1. Firebase 콘솔에서 새 프로젝트 생성
2. Authentication > 로그인 방법에서 Google, Email/Password 활성화
3. Firestore Database > 데이터베이스 만들기
4. Storage > 시작하기
5. 보안 규칙 적용 (문서 참고)

### 3. 개발 서버 실행
```bash
npm install
npm start
```

---

**설정 완료일**: 2024년 1월 15일  
**보안 상태**: ✅ 환경 변수 분리 완료, ✅ GitHub 안전 업로드 준비 완료  
**다음 단계**: Firebase 보안 규칙 적용 및 API 키 제한 설정