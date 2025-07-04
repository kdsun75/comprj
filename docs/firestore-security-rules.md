# Firestore 보안 규칙 - 좋아요 및 북마크 기능

이 문서는 새로 추가된 `postLikes`와 `bookMarks` 컬렉션에 대한 Firestore 보안 규칙을 설명합니다.

## 🔐 업데이트된 보안 규칙

Firebase 콘솔에서 다음 보안 규칙을 적용하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자 컬렉션 
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 게시글 컬렉션
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
    
    // 게시글 좋아요 컬렉션
    match /postLikes/{likeId} {
      // 읽기: 모든 사용자 허용 (좋아요 수 카운트용)
      allow read: if true;
      
      // 생성: 로그인한 사용자, 자신의 좋아요만 생성 가능
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId
        && likeId == request.auth.uid + '_' + request.resource.data.postId;
      
      // 삭제: 로그인한 사용자, 자신의 좋아요만 삭제 가능
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // 업데이트: 금지 (좋아요는 생성/삭제만 가능)
      allow update: if false;
    }
    
    // 북마크 컬렉션
    match /bookMarks/{bookmarkId} {
      // 읽기: 로그인한 사용자, 자신의 북마크만 읽기 가능
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // 생성: 로그인한 사용자, 자신의 북마크만 생성 가능
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId
        && bookmarkId == request.auth.uid + '_' + request.resource.data.postId;
      
      // 삭제: 로그인한 사용자, 자신의 북마크만 삭제 가능
      allow delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      
      // 업데이트: 금지 (북마크는 생성/삭제만 가능)
      allow update: if false;
    }
  }
}
```

## 📋 데이터 구조

### postLikes 컬렉션
```
postLikes/
├── {userId}_{postId}           # 문서 ID (복합키)
    ├── userId: string          # 좋아요를 누른 사용자 ID
    ├── postId: string          # 게시글 ID
    └── createdAt: timestamp    # 좋아요 생성 시간
```

### bookMarks 컬렉션
```
bookMarks/
├── {userId}_{postId}           # 문서 ID (복합키)
    ├── userId: string          # 북마크한 사용자 ID
    ├── postId: string          # 게시글 ID
    └── createdAt: timestamp    # 북마크 생성 시간
```

## 🔍 보안 규칙 설명

### 1. postLikes 보안 규칙

#### 읽기 권한 (Read)
- **모든 사용자에게 허용**: 게시글의 좋아요 수를 계산하기 위해 필요
- 사용 예시: 게시글 목록에서 좋아요 수 표시

#### 생성 권한 (Create)
- **로그인한 사용자만**: 인증된 사용자만 좋아요 추가 가능
- **자신의 좋아요만**: `userId`가 현재 사용자와 일치해야 함
- **복합키 검증**: 문서 ID가 `{userId}_{postId}` 형태여야 함

#### 삭제 권한 (Delete)
- **자신의 좋아요만**: 본인이 추가한 좋아요만 삭제 가능

### 2. bookMarks 보안 규칙

#### 읽기 권한 (Read)
- **개인 북마크만**: 자신의 북마크만 조회 가능
- 프라이버시 보호: 다른 사용자의 북마크 목록은 비공개

#### 생성/삭제 권한
- **자신의 북마크만**: 본인의 북마크만 추가/삭제 가능
- **복합키 검증**: postLikes와 동일한 방식

## 🚀 적용 방법

### 1. Firebase 콘솔에서 적용
1. [Firebase 콘솔](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. **Firestore Database** → **규칙** 탭
4. 위의 보안 규칙 복사하여 붙여넣기
5. **게시** 버튼 클릭

### 2. 규칙 테스트
Firebase 콘솔의 **규칙 시뮬레이터**를 사용하여 다음 시나리오들을 테스트하세요:

```javascript
// 좋아요 생성 테스트
auth: { uid: 'user123' }
path: /databases/(default)/documents/postLikes/user123_post456
method: create
data: { userId: 'user123', postId: 'post456', createdAt: timestamp }

// 북마크 읽기 테스트  
auth: { uid: 'user123' }
path: /databases/(default)/documents/bookMarks/user123_post456
method: get

// 다른 사용자 북마크 읽기 시도 (실패해야 함)
auth: { uid: 'user123' }
path: /databases/(default)/documents/bookMarks/user456_post789
method: get
```

## ⚠️ 주의사항

### 1. 데이터 일관성
- 게시글이 삭제될 때 관련된 좋아요와 북마크도 함께 삭제해야 합니다
- 현재 구현에서는 애플리케이션 레벨에서 처리합니다

### 2. 성능 최적화
- 좋아요 수가 많은 게시글의 경우 쿼리 성능에 주의
- 필요시 복합 인덱스 생성을 고려하세요

### 3. 비용 최적화
- 실시간 구독을 적절히 사용하여 불필요한 읽기 비용 방지
- 컴포넌트 언마운트 시 구독 해제 필수

## 📈 인덱스 설정

성능 향상을 위해 다음 복합 인덱스를 생성하는 것을 권장합니다:

### postLikes 컬렉션
- `userId` (오름차순) + `createdAt` (내림차순)
- `postId` (오름차순) + `createdAt` (내림차순)

### bookMarks 컬렉션  
- `userId` (오름차순) + `createdAt` (내림차순)

Firebase 콘솔에서 **Firestore Database** → **인덱스** → **복합** 탭에서 생성하세요.

## 🔧 문제 해결

### 일반적인 오류들

1. **권한 거부 오류**: 보안 규칙이 올바르게 적용되었는지 확인
2. **인덱스 누락**: 쿼리에 필요한 인덱스가 생성되었는지 확인  
3. **실시간 구독 문제**: 네트워크 연결 및 구독 해제 로직 확인

### 디버깅 팁
- Firebase 콘솔의 **Firestore** → **사용량** 탭에서 읽기/쓰기 통계 확인
- 개발자 도구의 네트워크 탭에서 Firestore 요청 모니터링
- `console.log`를 사용하여 서비스 함수의 실행 상태 추적 