# Firestore 보안 규칙 V2 - 기존 구조 활용

이 문서는 기존 posts 컬렉션의 `likedBy` 배열과 새로운 `bookmarks` 컬렉션을 사용하는 업데이트된 보안 규칙입니다.

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
    
    // 게시글 컬렉션 (좋아요 기능 포함)
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        // 작성자는 모든 필드 수정 가능
        request.auth.uid == resource.data.authorId ||
        // 로그인한 사용자는 좋아요 관련 필드만 수정 가능
        (
          request.auth != null &&
          // 수정 가능한 필드만 변경되었는지 확인
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likedBy', 'likeCount', 'updatedAt']) &&
          // likedBy 배열에 자신의 ID만 추가/제거 가능
          (
            (request.resource.data.likedBy.toSet().difference(resource.data.likedBy.toSet()) == [request.auth.uid].toSet()) ||
            (resource.data.likedBy.toSet().difference(request.resource.data.likedBy.toSet()) == [request.auth.uid].toSet())
          )
        )
      );
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
      
      // 댓글 서브컬렉션
      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
          request.auth.uid == resource.data.authorId;
      }
    }
    
    // 북마크 컬렉션 (새로운 구조)
    match /bookmarks/{bookmarkId} {
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
      
      // 업데이트: 자신의 북마크만 수정 가능 (메모 등)
      allow update: if request.auth != null 
        && request.auth.uid == resource.data.userId
        && request.auth.uid == request.resource.data.userId
        && resource.data.postId == request.resource.data.postId;
    }
  }
}
```

## 📋 데이터 구조

### posts 컬렉션 (기존 구조 활용)
```
posts/
├── {postId}
    ├── title: string
    ├── content: string
    ├── authorId: string
    ├── category: string
    ├── tags: string[]
    ├── likeCount: number          # 좋아요 수
    ├── likedBy: string[]          # 좋아요한 사용자 ID 배열
    ├── commentCount: number
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

### bookmarks 컬렉션 (새로운 구조)
```
bookmarks/
├── {userId}_{postId}           # 문서 ID (복합키)
    ├── userId: string          # 북마크한 사용자 ID
    ├── postId: string          # 게시글 ID
    ├── createdAt: timestamp    # 북마크 생성 시간
    └── note?: string           # 개인 메모 (선택적)
```

## 🔍 보안 규칙 설명

### 1. posts 컬렉션 보안 규칙

#### 읽기 권한 (Read)
- **모든 사용자에게 허용**: 게시글은 공개적으로 읽기 가능

#### 생성 권한 (Create)
- **로그인한 사용자만**: 인증된 사용자만 게시글 작성 가능

#### 수정 권한 (Update)
- **작성자**: 게시글 작성자는 모든 필드 수정 가능
- **일반 사용자**: 좋아요 관련 필드(`likedBy`, `likeCount`, `updatedAt`)만 수정 가능
- **좋아요 제한**: 자신의 사용자 ID만 `likedBy` 배열에 추가/제거 가능

#### 삭제 권한 (Delete)
- **작성자만**: 게시글 작성자만 삭제 가능

### 2. bookmarks 컬렉션 보안 규칙

#### 읽기 권한 (Read)
- **개인 북마크만**: 자신의 북마크만 조회 가능
- 프라이버시 보호: 다른 사용자의 북마크 목록은 비공개

#### 생성/삭제/수정 권한
- **자신의 북마크만**: 본인의 북마크만 관리 가능
- **복합키 검증**: 문서 ID가 `{userId}_{postId}` 형태여야 함

## 🚀 적용 방법

### 1. Firebase 콘솔에서 적용
1. [Firebase 콘솔](https://console.firebase.google.com) 접속
2. 프로젝트 선택
3. **Firestore Database** → **규칙** 탭
4. 위의 보안 규칙 복사하여 붙여넣기
5. **게시** 버튼 클릭

### 2. 인덱스 설정
성능 향상을 위해 다음 복합 인덱스를 생성하세요:

**posts 컬렉션:**
- `likedBy` (배열) + `createdAt` (내림차순)
- `category` (오름차순) + `createdAt` (내림차순)
- `authorId` (오름차순) + `createdAt` (내림차순)

**bookmarks 컬렉션:**
- `userId` (오름차순) + `createdAt` (내림차순)

### 3. 규칙 테스트
Firebase 콘솔의 **규칙 시뮬레이터**를 사용하여 다음 시나리오들을 테스트하세요:

```javascript
// 좋아요 추가 테스트
auth: { uid: 'user123' }
path: /databases/(default)/documents/posts/post456
method: update
data: { 
  likedBy: ['user123'], 
  likeCount: 1, 
  updatedAt: timestamp 
}

// 북마크 생성 테스트  
auth: { uid: 'user123' }
path: /databases/(default)/documents/bookmarks/user123_post456
method: create
data: { userId: 'user123', postId: 'post456', createdAt: timestamp }

// 다른 사용자 좋아요 조작 시도 (실패해야 함)
auth: { uid: 'user123' }
path: /databases/(default)/documents/posts/post456
method: update
data: { 
  likedBy: ['user456'],  // 다른 사용자 ID
  likeCount: 1 
}
```

## ⚠️ 주의사항

### 1. 데이터 일관성
- `likeCount`는 `likedBy` 배열의 길이와 일치해야 합니다
- 정기적으로 동기화 스크립트를 실행하여 일관성을 유지하세요
- 게시글 삭제 시 관련 북마크도 함께 삭제 고려

### 2. 성능 최적화
- `likedBy` 배열이 너무 커지면 성능에 영향을 줄 수 있습니다
- 대규모 서비스에서는 별도의 좋아요 컬렉션 사용을 고려하세요
- 적절한 인덱스를 생성하여 쿼리 성능을 최적화하세요

### 3. 비용 최적화
- 실시간 구독을 적절히 사용하여 불필요한 읽기 비용 방지
- 컴포넌트 언마운트 시 구독 해제 필수
- 배치 작업으로 여러 작업을 한 번에 처리

## 🔧 문제 해결

### 일반적인 오류들

1. **권한 거부 오류**: 
   - 좋아요 시: 다른 사용자의 ID를 조작하려고 시도
   - 북마크 시: 문서 ID가 복합키 형태가 아님

2. **인덱스 누락**: 
   - `likedBy` 배열 쿼리에 필요한 인덱스 생성
   - Firebase가 자동으로 제안하는 인덱스 링크 사용

3. **데이터 불일치**: 
   - `likeCount`와 `likedBy` 배열 길이가 다름
   - 마이그레이션 도구를 사용하여 동기화

### 디버깅 팁
- Firebase 콘솔의 **Firestore** → **사용량** 탭에서 읽기/쓰기 통계 확인
- 개발자 도구의 네트워크 탭에서 Firestore 요청 모니터링
- `console.log`를 사용하여 서비스 함수의 실행 상태 추적

## 📈 마이그레이션 가이드

기존 데이터가 있는 경우 다음 순서로 마이그레이션하세요:

1. **데이터 백업**: 현재 Firestore 데이터 내보내기
2. **필드 추가**: 홈페이지의 관리자 도구로 `likedBy`, `likeCount` 필드 추가
3. **보안 규칙 업데이트**: 새로운 규칙 적용
4. **인덱스 생성**: 필요한 복합 인덱스 생성
5. **테스트**: 좋아요와 북마크 기능 동작 확인
6. **동기화**: 좋아요 수와 배열 데이터 일치 확인

이제 기존 데이터 구조를 최대한 활용하면서도 확장 가능한 좋아요/북마크 시스템이 준비되었습니다! 🚀 