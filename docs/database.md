export default App;

# AI 커뮤니티 플랫폼 데이터베이스 구조

## 📊 현재 구현 상태

### ✅ 구현 완료
- **Firestore**: 사용자 정보, 게시글 데이터 저장
- **Firebase Storage**: 이미지 업로드 시스템
- **실시간 데이터 동기화**: PostContext를 통한 자동 업데이트

### 🚧 계획 중
- **댓글 시스템**: Firestore 서브컬렉션
- **좋아요/북마크**: 별도 컬렉션 구조
- **실시간 채팅**: Firebase Realtime Database

## 🗄️ Firestore 구조 (현재 구현됨)

### users/ (사용자 정보) ✅
```typescript
{
  uid: string
  email: string                    // 이메일 주소
  displayName: string              // 사용자 이름
  photoURL?: string                // 프로필 이미지 URL
  surveyCompleted: boolean         // 설문조사 완료 여부
  createdAt: Timestamp            // 가입일
  updatedAt?: Timestamp           // 수정일
  
  // 설문조사 데이터 (선택적)
  personalInfo?: {
    age?: string
    gender?: string
    occupation?: string
    interests?: string[]
    experience?: string
    goals?: string[]
  }
}
```

### posts/ (게시글) ✅
```typescript
{
  id: string                      // 자동 생성 ID
  authorId: string                // 작성자 UID
  title: string                   // 게시글 제목
  content: string                 // HTML 형태의 본문 내용
  category: 'ai' | 'ml' | 'deep' | 'nlp' | 'cv' | 'other'  // 카테고리
  tags: string[]                  // 태그 배열 (최대 10개)
  
  // 메타데이터
  createdAt: Timestamp           // 작성일
  updatedAt?: Timestamp          // 수정일
  
  // 상호작용 카운터
  likeCount: number              // 좋아요 수
  commentCount: number           // 댓글 수
  viewCount?: number             // 조회수 (추후 구현)
  
  // 미디어 및 링크
  imageUrl?: string              // 메인 이미지 URL
  linkPreview?: {                // 링크 미리보기 정보
    url: string
    title?: string
    description?: string
    image?: string
    siteName?: string
  }
  extractedLinks?: string[]      // 본문에서 추출된 링크들
}
```

## 🔄 계획된 Firestore 구조

### comments/ (댓글 - 서브컬렉션) 🚧
```typescript
posts/{postId}/comments/{commentId}
{
  id: string
  authorId: string
  content: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  parentId?: string              // 대댓글용 부모 댓글 ID
  likeCount: number
  isDeleted: boolean             // 소프트 삭제
}
```

### likes/ (좋아요 정보) 🚧
```typescript
{
  id: string                     // 자동 생성 ID
  userId: string                 // 좋아요 누른 사용자
  postId: string                 // 대상 게시글
  createdAt: Timestamp
}
```

### bookmarks/ (북마크 정보) 🚧
```typescript
{
  id: string
  userId: string                 // 북마크한 사용자
  postId: string                 // 북마크된 게시글
  createdAt: Timestamp
  note?: string                  // 개인 메모 (선택적)
}
```

### chatRooms/ (채팅방 메타데이터) 🚧
```typescript
{
  id: string
  members: string[]              // 참여자 UID 배열
  type: 'direct' | 'group'       // 1:1 또는 그룹 채팅
  name?: string                  // 그룹 채팅 이름
  lastMessage?: {
    content: string
    senderId: string
    timestamp: Timestamp
    type: 'text' | 'image' | 'file'
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 🔥 Firebase Realtime Database 구조 (채팅용)

### chatRooms/ 🚧
```json
{
  "roomId": {
    "members": {
      "userId1": true,
      "userId2": true
    },
    "createdAt": "timestamp",
    "lastActivity": "timestamp"
  }
}
```

### messages/ 🚧
```json
{
  "roomId": {
    "messageId": {
      "senderId": "string",
      "content": "string",
      "type": "text|image|file",
      "fileUrl": "string",
      "timestamp": "timestamp",
      "readBy": {
        "userId1": "timestamp",
        "userId2": "timestamp"
      }
    }
  }
}
```

### userChats/ 🚧
```json
{
  "userId": {
    "roomId": {
      "lastReadAt": "timestamp",
      "unreadCount": 5,
      "isActive": true
    }
  }
}
```

### presence/ (온라인 상태) 🚧
```json
{
  "userId": {
    "state": "online|offline|away",
    "lastChanged": "timestamp"
  }
}
```

## 📁 Firebase Storage 구조

### 현재 구현됨 ✅
```
images/                        # 게시글 이미지
├── {timestamp}_{filename}     # 유니크한 파일명
└── ...
```

### 계획된 구조 🚧
```
profiles/                      # 프로필 이미지
├── avatars/
│   └── {uid}/{filename}
└── covers/
    └── {uid}/{filename}

posts/                         # 게시글 관련 파일
├── images/
│   └── {postId}/{filename}
└── attachments/
    └── {postId}/{filename}

chats/                         # 채팅 관련 파일
├── images/
│   └── {roomId}/{filename}
└── files/
    └── {roomId}/{filename}
```

## 🔐 Security Rules

### Firestore Rules (구현 필요)
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
    
    // 댓글: 게시글과 동일한 규칙
    match /posts/{postId}/comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
    
    // 좋아요: 본인 좋아요만 관리
    match /likes/{likeId} {
      allow read: if true;
      allow create, delete: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // 북마크: 본인 북마크만 관리
    match /bookmarks/{bookmarkId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### Storage Rules (구현 필요)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 이미지: 본인만 업로드, 모든 사람이 읽기
    match /profiles/avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 게시글 이미지: 로그인한 사용자만 업로드, 모든 사람이 읽기
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 채팅 파일: 채팅방 멤버만 접근
    match /chats/{roomId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        // 추가 검증 로직 필요 (채팅방 멤버 확인)
    }
  }
}
```

## 📈 데이터 쿼리 최적화

### 인덱스 설정 ✅
- **posts**: category, createdAt (복합 인덱스)
- **posts**: authorId, createdAt
- **likes**: userId, postId (복합 인덱스)
- **bookmarks**: userId, createdAt

### 쿼리 패턴 ✅
```typescript
// 카테고리별 최신 게시글
const postsQuery = query(
  collection(db, 'posts'),
  where('category', '==', 'ai'),
  orderBy('createdAt', 'desc'),
  limit(20)
);

// 사용자별 게시글
const userPostsQuery = query(
  collection(db, 'posts'),
  where('authorId', '==', userId),
  orderBy('createdAt', 'desc')
);

// 인기 게시글 (좋아요 순)
const popularPostsQuery = query(
  collection(db, 'posts'),
  orderBy('likeCount', 'desc'),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

## 🔧 성능 최적화

### 현재 구현됨 ✅
- **실시간 리스너**: PostContext에서 자동 업데이트
- **페이지네이션**: limit() 쿼리 사용
- **복합 인덱스**: 효율적인 필터링 지원

### 계획된 최적화 🚧
- **무한 스크롤**: startAfter() 페이지네이션
- **캐싱**: 자주 조회되는 데이터 로컬 캐싱
- **오프라인 지원**: Firestore 오프라인 기능 활용

---

**최종 업데이트**: 2024년 1월 15일  
**구현 상태**: 기본 구조 완성, 고급 기능 개발 중  
**다음 단계**: 댓글 시스템, 좋아요/북마크 기능 구현
