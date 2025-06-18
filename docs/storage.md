# Firebase Storage Structure for Media Files

## 1. 스토리지 구조 개요

Firebase Storage를 사용하여 사용자 프로필 이미지, 게시글 첨부파일, 채팅 파일 등을 효율적으로 관리합니다.
보안, 성능, 사용자 경험을 고려한 구조를 설계합니다.

## 2. 폴더 구조 설계

```
storage/
├── profiles/                 # 프로필 관련 파일
│   ├── avatars/             # 프로필 이미지
│   │   └── {userId}/        # 사용자별 폴더
│   │       ├── original.jpg # 원본 이미지
│   │       ├── large.jpg    # 대형 (400x400)
│   │       ├── medium.jpg   # 중형 (200x200)
│   │       └── small.jpg    # 소형 (100x100)
│   └── covers/              # 커버 이미지
│       └── {userId}/
│           └── cover.jpg
├── posts/                   # 게시글 관련 파일
│   └── {postId}/           # 게시글별 폴더
│       ├── images/         # 이미지 파일
│       │   ├── {imageId}/
│       │   │   ├── original.jpg
│       │   │   ├── large.jpg
│       │   │   ├── medium.jpg
│       │   │   └── thumbnail.jpg
│       └── attachments/    # 첨부파일
│           └── {fileName}
├── chats/                  # 채팅 관련 파일
│   └── {chatRoomId}/      # 채팅방별 폴더
│       ├── images/        # 채팅 이미지
│       │   └── {messageId}/
│       │       ├── original.jpg
│       │       └── thumbnail.jpg
│       └── files/         # 채팅 파일
│           └── {messageId}/
│               └── {fileName}
└── temp/                  # 임시 파일 (24시간 후 자동 삭제)
    └── {userId}/
        └── {tempId}/
            └── {fileName}
```

## 3. 보안 규칙 (Security Rules)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 이미지 접근 제어
    match /profiles/avatars/{userId}/{imageVariant} {
      allow read: if true; // 모든 사용자가 프로필 이미지 조회 가능
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && isValidImage()
        && request.resource.size < 5 * 1024 * 1024; // 5MB 제한
    }
    
    // 커버 이미지 접근 제어
    match /profiles/covers/{userId}/{imageVariant} {
      allow read: if true;
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && isValidImage()
        && request.resource.size < 10 * 1024 * 1024; // 10MB 제한
    }
    
    // 게시글 이미지 접근 제어
    match /posts/{postId}/images/{imageId}/{imageVariant} {
      allow read: if true; // 모든 사용자가 게시글 이미지 조회 가능
      allow write: if request.auth != null 
        && isPostOwner(postId)
        && isValidImage()
        && request.resource.size < 10 * 1024 * 1024;
    }
    
    // 게시글 첨부파일 접근 제어
    match /posts/{postId}/attachments/{fileName} {
      allow read: if request.auth != null; // 로그인한 사용자만 첨부파일 다운로드 가능
      allow write: if request.auth != null 
        && isPostOwner(postId)
        && isValidFile()
        && request.resource.size < 50 * 1024 * 1024; // 50MB 제한
    }
    
    // 채팅 파일 접근 제어
    match /chats/{chatRoomId}/{fileType}/{messageId}/{fileName} {
      allow read: if request.auth != null && isChatParticipant(chatRoomId);
      allow write: if request.auth != null 
        && isChatParticipant(chatRoomId)
        && ((fileType == 'images' && isValidImage() && request.resource.size < 10 * 1024 * 1024)
        || (fileType == 'files' && isValidFile() && request.resource.size < 100 * 1024 * 1024));
    }
    
    // 임시 파일 접근 제어
    match /temp/{userId}/{tempId}/{fileName} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.size < 100 * 1024 * 1024;
    }
    
    // 유효한 이미지 파일인지 확인
    function isValidImage() {
      return request.resource.contentType.matches('image/.*')
        && request.resource.contentType in ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    }
    
    // 유효한 파일인지 확인
    function isValidFile() {
      return request.resource.contentType in [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
      ];
    }
    
    // 게시글 소유자인지 확인 (Firestore에서 확인)
    function isPostOwner(postId) {
      return exists(/databases/(default)/documents/posts/$(postId))
        && get(/databases/(default)/documents/posts/$(postId)).data.authorId == request.auth.uid;
    }
    
    // 채팅방 참여자인지 확인 (Firestore에서 확인)
    function isChatParticipant(chatRoomId) {
      return exists(/databases/(default)/documents/chatRooms/$(chatRoomId))
        && request.auth.uid in get(/databases/(default)/documents/chatRooms/$(chatRoomId)).data.participants;
    }
  }
}
```

## 4. 파일 업로드 구현

### 4.1 프로필 이미지 업로드
```typescript
interface ImageUploadResult {
  originalUrl: string;
  variants: {
    large: string;
    medium: string;
    small: string;
  };
}

const uploadProfileImage = async (
  userId: string,
  file: File
): Promise<ImageUploadResult> => {
  // 파일 유효성 검사
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
  }
  
  // 원본 이미지 업로드
  const originalRef = storageRef(storage, `profiles/avatars/${userId}/original.jpg`);
  const uploadTask = uploadBytesResumable(originalRef, file);
  
  await uploadTask;
  const originalUrl = await getDownloadURL(originalRef);
  
  // 이미지 크기별 변환 및 업로드
  const variants = await Promise.all([
    resizeAndUpload(file, `profiles/avatars/${userId}/large.jpg`, 400),
    resizeAndUpload(file, `profiles/avatars/${userId}/medium.jpg`, 200),
    resizeAndUpload(file, `profiles/avatars/${userId}/small.jpg`, 100)
  ]);
  
  return {
    originalUrl,
    variants: {
      large: variants[0],
      medium: variants[1],
      small: variants[2]
    }
  };
};

const resizeAndUpload = async (
  file: File,
  path: string,
  size: number
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      canvas.width = size;
      canvas.height = size;
      
      ctx.drawImage(img, 0, 0, size, size);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('이미지 변환에 실패했습니다.'));
          return;
        }
        
        const ref = storageRef(storage, path);
        await uploadBytes(ref, blob);
        const url = await getDownloadURL(ref);
        resolve(url);
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
    img.src = URL.createObjectURL(file);
  });
};
```

### 4.2 게시글 이미지 업로드
```typescript
const uploadPostImages = async (
  postId: string,
  files: File[]
): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const imageId = `image_${index}_${Date.now()}`;
    const imagePath = `posts/${postId}/images/${imageId}`;
    
    // 원본 이미지 업로드
    const originalRef = storageRef(storage, `${imagePath}/original.jpg`);
    await uploadBytes(originalRef, file);
    
    // 썸네일 생성 및 업로드
    const thumbnailBlob = await createThumbnail(file, 300, 300);
    const thumbnailRef = storageRef(storage, `${imagePath}/thumbnail.jpg`);
    await uploadBytes(thumbnailRef, thumbnailBlob);
    
    return await getDownloadURL(originalRef);
  });
  
  return Promise.all(uploadPromises);
};
```

### 4.3 채팅 파일 업로드
```typescript
const uploadChatFile = async (
  chatRoomId: string,
  messageId: string,
  file: File,
  type: 'image' | 'file'
): Promise<string> => {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `chats/${chatRoomId}/${type}s/${messageId}/${fileName}`;
  
  const fileRef = storageRef(storage, filePath);
  const uploadTask = uploadBytesResumable(fileRef, file);
  
  // 업로드 진행률 추적
  uploadTask.on('state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      // 진행률 업데이트 로직
    },
    (error) => {
      throw error;
    }
  );
  
  await uploadTask;
  return await getDownloadURL(fileRef);
};
```

## 5. 파일 관리 유틸리티

### 5.1 파일 삭제
```typescript
const deleteFile = async (filePath: string): Promise<void> => {
  const fileRef = storageRef(storage, filePath);
  await deleteObject(fileRef);
};

const deletePostFiles = async (postId: string): Promise<void> => {
  const postPath = `posts/${postId}`;
  
  // 모든 이미지 삭제
  const imagesRef = storageRef(storage, `${postPath}/images`);
  const imagesList = await listAll(imagesRef);
  
  const deletePromises = imagesList.items.map(item => deleteObject(item));
  await Promise.all(deletePromises);
};
```

### 5.2 파일 메타데이터 관리
```typescript
const updateFileMetadata = async (
  filePath: string,
  metadata: Record<string, string>
): Promise<void> => {
  const fileRef = storageRef(storage, filePath);
  await updateMetadata(fileRef, {
    customMetadata: metadata
  });
};

const getFileMetadata = async (filePath: string) => {
  const fileRef = storageRef(storage, filePath);
  return await getMetadata(fileRef);
};
```

## 6. 성능 최적화

### 6.1 이미지 최적화
- **WebP 포맷 사용**: 브라우저 지원 여부에 따라 WebP 또는 JPEG 제공
- **레이지 로딩**: 뷰포트에 들어올 때만 이미지 로드
- **CDN 활용**: Firebase Storage의 CDN을 통한 빠른 전송
- **이미지 크기별 제공**: 디바이스와 용도에 맞는 적절한 크기

### 6.2 업로드 최적화
- **청크 업로드**: 대용량 파일의 안정적 업로드
- **재시도 로직**: 네트워크 오류 시 자동 재시도
- **병렬 업로드**: 여러 파일 동시 업로드

```typescript
const uploadWithRetry = async (
  ref: StorageReference,
  file: File,
  maxRetries: number = 3
): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await uploadBytes(ref, file);
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // 지수 백오프로 재시도
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};
```

## 7. 보안 및 모니터링

### 7.1 악성 파일 검사
```typescript
const scanFile = async (file: File): Promise<boolean> => {
  // 파일 확장자 검사
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('허용되지 않는 파일 형식입니다.');
  }
  
  // 파일 크기 검사
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new Error('파일 크기가 너무 큽니다.');
  }
  
  // MIME 타입 검사
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'text/plain'
  ];
  
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('허용되지 않는 파일 타입입니다.');
  }
  
  return true;
};
```

### 7.2 저장소 사용량 모니터링
```typescript
const getStorageUsage = async (userId: string): Promise<number> => {
  const userPaths = [
    `profiles/avatars/${userId}`,
    `profiles/covers/${userId}`
  ];
  
  let totalSize = 0;
  
  for (const path of userPaths) {
    const ref = storageRef(storage, path);
    try {
      const list = await listAll(ref);
      for (const item of list.items) {
        const metadata = await getMetadata(item);
        totalSize += metadata.size || 0;
      }
    } catch (error) {
      // 폴더가 존재하지 않는 경우 무시
    }
  }
  
  return totalSize;
};
```

## 8. 정리 및 백업

### 8.1 임시 파일 정리
```typescript
// Cloud Functions으로 구현
const cleanupTempFiles = async () => {
  const tempRef = storageRef(storage, 'temp');
  const list = await listAll(tempRef);
  
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  for (const item of list.items) {
    const metadata = await getMetadata(item);
    const createdTime = new Date(metadata.timeCreated).getTime();
    
    if (createdTime < oneDayAgo) {
      await deleteObject(item);
    }
  }
};
```

### 8.2 파일 백업 전략
- **중요 파일 중복 저장**: 프로필 이미지 같은 중요 파일은 여러 지역에 백업
- **정기적 백업**: Cloud Storage Transfer Service 활용
- **버전 관리**: 파일 버전 관리를 통한 복구 가능성 확보
