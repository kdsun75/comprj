# Realtime Database Structure for 1:1 Chat

## 1. 데이터베이스 구조 개요

Firebase Realtime Database를 사용하여 실시간 1:1 채팅 기능을 구현합니다.
메시지의 실시간 동기화와 효율적인 쿼리를 위한 구조를 설계합니다.

## 2. 데이터 구조

### 2.1 채팅방 (chatRooms)
```json
{
  "chatRooms": {
    "chatRoomId": {
      "participants": {
        "userId1": true,
        "userId2": true
      },
      "lastMessage": {
        "content": "마지막 메시지 내용",
        "senderId": "userId1",
        "timestamp": 1703123456789,
        "type": "text"
      },
      "createdAt": 1703123456789,
      "updatedAt": 1703123456789
    }
  }
}
```

### 2.2 메시지 (messages)
```json
{
  "messages": {
    "chatRoomId": {
      "messageId": {
        "content": "메시지 내용",
        "senderId": "userId1",
        "timestamp": 1703123456789,
        "type": "text", // text, image, file
        "status": "sent", // sent, delivered, read
        "fileUrl": "optional_file_url",
        "fileName": "optional_file_name",
        "fileSize": 12345
      }
    }
  }
}
```

### 2.3 사용자 채팅 목록 (userChats)
```json
{
  "userChats": {
    "userId": {
      "chatRoomId": {
        "lastReadTimestamp": 1703123456789,
        "unreadCount": 3,
        "isActive": true,
        "updatedAt": 1703123456789
      }
    }
  }
}
```

### 2.4 온라인 상태 (presence)
```json
{
  "presence": {
    "userId": {
      "isOnline": true,
      "lastSeen": 1703123456789,
      "status": "online" // online, away, offline
    }
  }
}
```

## 3. 보안 규칙 (Security Rules)

```javascript
{
  "rules": {
    // 채팅방 접근 제어
    "chatRooms": {
      "$chatRoomId": {
        ".read": "auth != null && (data.child('participants').child(auth.uid).exists())",
        ".write": "auth != null && (data.child('participants').child(auth.uid).exists() || !data.exists())",
        
        "participants": {
          ".validate": "newData.hasChildren() && newData.numChildren() == 2"
        },
        
        "lastMessage": {
          ".validate": "auth != null && newData.child('senderId').val() == auth.uid"
        }
      }
    },
    
    // 메시지 접근 제어
    "messages": {
      "$chatRoomId": {
        ".read": "auth != null && root.child('chatRooms').child($chatRoomId).child('participants').child(auth.uid).exists()",
        
        "$messageId": {
          ".write": "auth != null && newData.child('senderId').val() == auth.uid && root.child('chatRooms').child($chatRoomId).child('participants').child(auth.uid).exists()",
          ".validate": "newData.hasChildren(['content', 'senderId', 'timestamp', 'type'])"
        }
      }
    },
    
    // 사용자 채팅 목록 접근 제어
    "userChats": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    
    // 온라인 상태 접근 제어
    "presence": {
      "$userId": {
        ".read": true,
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

## 4. 주요 기능 구현

### 4.1 채팅방 생성
```typescript
const createChatRoom = async (currentUserId: string, targetUserId: string) => {
  const chatRoomId = generateChatRoomId(currentUserId, targetUserId);
  
  const chatRoomData = {
    participants: {
      [currentUserId]: true,
      [targetUserId]: true
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await set(ref(database, `chatRooms/${chatRoomId}`), chatRoomData);
  
  // 사용자별 채팅 목록에 추가
  await Promise.all([
    set(ref(database, `userChats/${currentUserId}/${chatRoomId}`), {
      lastReadTimestamp: serverTimestamp(),
      unreadCount: 0,
      isActive: true,
      updatedAt: serverTimestamp()
    }),
    set(ref(database, `userChats/${targetUserId}/${chatRoomId}`), {
      lastReadTimestamp: serverTimestamp(),
      unreadCount: 0,
      isActive: true,
      updatedAt: serverTimestamp()
    })
  ]);
  
  return chatRoomId;
};
```

### 4.2 메시지 전송
```typescript
const sendMessage = async (
  chatRoomId: string,
  senderId: string,
  content: string,
  type: 'text' | 'image' | 'file',
  fileData?: FileData
) => {
  const messageId = push(ref(database, `messages/${chatRoomId}`)).key;
  
  const messageData = {
    content,
    senderId,
    timestamp: serverTimestamp(),
    type,
    status: 'sent',
    ...(fileData && {
      fileUrl: fileData.url,
      fileName: fileData.name,
      fileSize: fileData.size
    })
  };
  
  // 메시지 저장
  await set(ref(database, `messages/${chatRoomId}/${messageId}`), messageData);
  
  // 채팅방 마지막 메시지 업데이트
  await update(ref(database, `chatRooms/${chatRoomId}`), {
    lastMessage: {
      content: type === 'text' ? content : `${type === 'image' ? '이미지' : '파일'}을 보냈습니다.`,
      senderId,
      timestamp: serverTimestamp(),
      type
    },
    updatedAt: serverTimestamp()
  });
  
  // 상대방 안읽은 메시지 수 증가
  const participants = await get(ref(database, `chatRooms/${chatRoomId}/participants`));
  const targetUserId = Object.keys(participants.val()).find(id => id !== senderId);
  
  if (targetUserId) {
    await update(ref(database, `userChats/${targetUserId}/${chatRoomId}`), {
      unreadCount: increment(1),
      updatedAt: serverTimestamp()
    });
  }
};
```

### 4.3 메시지 읽음 처리
```typescript
const markMessagesAsRead = async (userId: string, chatRoomId: string) => {
  await update(ref(database, `userChats/${userId}/${chatRoomId}`), {
    lastReadTimestamp: serverTimestamp(),
    unreadCount: 0,
    updatedAt: serverTimestamp()
  });
};
```

### 4.4 온라인 상태 관리
```typescript
const setupPresence = (userId: string) => {
  const presenceRef = ref(database, `presence/${userId}`);
  const connectedRef = ref(database, '.info/connected');
  
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      // 온라인 상태 설정
      set(presenceRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        status: 'online'
      });
      
      // 연결 해제 시 오프라인 상태로 변경
      onDisconnect(presenceRef).set({
        isOnline: false,
        lastSeen: serverTimestamp(),
        status: 'offline'
      });
    }
  });
};
```

## 5. 인덱싱 및 성능 최적화

### 5.1 인덱스 설정
```json
{
  "rules": {
    "messages": {
      "$chatRoomId": {
        ".indexOn": ["timestamp"]
      }
    },
    "userChats": {
      "$userId": {
        ".indexOn": ["updatedAt"]
      }
    }
  }
}
```

### 5.2 쿼리 최적화
- 메시지는 페이지네이션을 사용하여 최근 50개씩 로드
- 채팅방 목록은 최근 업데이트 순으로 정렬
- 오래된 메시지는 별도 아카이브 처리

## 6. 실시간 리스너 설정

### 6.1 메시지 리스너
```typescript
const subscribeToMessages = (chatRoomId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(database, `messages/${chatRoomId}`);
  const messagesQuery = query(
    messagesRef,
    orderByChild('timestamp'),
    limitToLast(50)
  );
  
  return onValue(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(messages);
  });
};
```

### 6.2 채팅방 목록 리스너
```typescript
const subscribeToUserChats = (userId: string, callback: (chats: UserChat[]) => void) => {
  const userChatsRef = ref(database, `userChats/${userId}`);
  const userChatsQuery = query(
    userChatsRef,
    orderByChild('updatedAt')
  );
  
  return onValue(userChatsQuery, (snapshot) => {
    const chats: UserChat[] = [];
    snapshot.forEach((childSnapshot) => {
      chats.push({
        chatRoomId: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(chats.reverse());
  });
};
```

## 7. 데이터 정리 및 유지보수

### 7.1 자동 정리
- 30일 이상 비활성 채팅방 아카이브
- 오래된 온라인 상태 정보 정리
- 삭제된 사용자의 채팅 데이터 정리

### 7.2 백업 전략
- 중요한 채팅 데이터는 Firestore에 주기적 백업
- 사용자별 채팅 히스토리 내보내기 기능
