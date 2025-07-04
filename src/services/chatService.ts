import { realtimeDb } from '../firebase/config';
import { 
  ref, 
  push, 
  set, 
  get, 
  onValue, 
  off, 
  query,
  orderByChild,
  limitToLast,
  update
} from 'firebase/database';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
  senderName: string;
  senderPhotoURL?: string;
}

export interface Chat {
  id: string;
  participants: { [userId: string]: boolean };
  lastMessage?: string;
  lastMessageTime?: number;
  lastSenderId?: string;
  createdAt?: number;
}

export interface UserChat {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhotoURL?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

class ChatService {
  // 두 사용자 간의 채팅방 ID 생성 (일관된 순서로)
  private generateChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  // 채팅방 생성 또는 가져오기
  async getOrCreateChat(user1Id: string, user2Id: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('getOrCreateChat 호출됨:', { user1Id, user2Id });
        
        const chatId = this.generateChatId(user1Id, user2Id);
        console.log('생성된 chatId:', chatId);
        
        const chatRef = ref(realtimeDb, `chats/${chatId}`);
        console.log('Firebase Realtime DB 참조 생성됨:', chatRef);
        
        console.log('🚀 간단한 방식으로 채팅방 생성 시도 (get() 호출 생략)');
        
        // get() 호출을 생략하고 바로 채팅방 생성
        // Firebase update 사용으로 기존 데이터 보존
        const chatData = {
          [`participants/${user1Id}`]: true,
          [`participants/${user2Id}`]: true,
          id: chatId
        };
        
        console.log('채팅방 데이터 생성:', chatData);
        
        try {
          console.log('Firebase update() 호출 시작...');
          await update(chatRef, chatData);
          console.log('✅ Firebase update() 완료! 채팅방 생성/업데이트 성공');
        } catch (updateError) {
          console.error('❌ Firebase update() 에러:', updateError);
          throw updateError;
        }
        
        console.log('📤 명시적 resolve 호출:', chatId);
        resolve(chatId);
        console.log('📬 resolve 완료');
        
      } catch (error) {
        console.error('채팅방 생성/조회 오류:', error);
        reject(error);
      }
    });
  }

  // 메시지 전송
  async sendMessage(
    senderId: string, 
    receiverId: string, 
    content: string,
    senderName: string,
    senderPhotoURL?: string
  ): Promise<void> {
    if (!content.trim()) return;

    const chatId = this.generateChatId(senderId, receiverId);
    const messagesRef = ref(realtimeDb, `chats/${chatId}/messages`);
    const chatRef = ref(realtimeDb, `chats/${chatId}`);
    
    try {
      // 메시지 추가
      const newMessageRef = push(messagesRef);
      const message: Omit<ChatMessage, 'id'> = {
        senderId,
        receiverId,
        content: content.trim(),
        timestamp: Date.now(),
        read: false,
        senderName,
        ...(senderPhotoURL && { senderPhotoURL })
      };
      
      await set(newMessageRef, message);

      // 채팅방 마지막 메시지 정보 업데이트
      await update(chatRef, {
        lastMessage: content.trim(),
        lastMessageTime: Date.now(),
        lastSenderId: senderId
      });

      // 사용자별 채팅 목록 업데이트
      await this.updateUserChatList(senderId, receiverId, chatId, content.trim(), Date.now());
      await this.updateUserChatList(receiverId, senderId, chatId, content.trim(), Date.now());

    } catch (error) {
      console.error('메시지 전송 오류:', error);
      throw error;
    }
  }

  // 사용자별 채팅 목록 업데이트
  private async updateUserChatList(
    userId: string, 
    otherUserId: string, 
    chatId: string, 
    lastMessage: string, 
    timestamp: number
  ): Promise<void> {
    const userChatRef = ref(realtimeDb, `userChats/${userId}/${chatId}`);
    
    try {
      const snapshot = await get(userChatRef);
      const currentData = snapshot.val() || {};
      
      // 읽지 않은 메시지 수 계산 (받는 사람만 증가)
      const unreadCount = userId === otherUserId ? currentData.unreadCount || 0 : (currentData.unreadCount || 0) + 1;
      
      await update(userChatRef, {
        chatId,
        otherUserId,
        lastMessage,
        lastMessageTime: timestamp,
        unreadCount: userId === otherUserId ? 0 : unreadCount
      });
    } catch (error) {
      console.error('사용자 채팅 목록 업데이트 오류:', error);
    }
  }

  // 메시지 실시간 구독
  subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesRef = ref(realtimeDb, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(50));
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        messages.push({
          id: childSnapshot.key!,
          ...message
        });
      });
      callback(messages);
    });

    return () => off(messagesRef, 'value', unsubscribe);
  }

  // 사용자의 채팅 목록 구독
  subscribeToUserChats(userId: string, callback: (chats: UserChat[]) => void): () => void {
    const userChatsRef = ref(realtimeDb, `userChats/${userId}`);
    
    const unsubscribe = onValue(userChatsRef, async (snapshot) => {
      const chatsData = snapshot.val() || {};
      const chats: UserChat[] = [];

      // 다른 사용자 정보를 가져오기 위해 Firestore에서 조회
      for (const chatId in chatsData) {
        const chatData = chatsData[chatId];
        try {
          // Firestore에서 사용자 정보 가져오기
          const { db } = await import('../firebase/config');
          const { doc, getDoc } = await import('firebase/firestore');
          
          const userDoc = await getDoc(doc(db, 'users', chatData.otherUserId));
          const userData = userDoc.data();
          
          chats.push({
            ...chatData,
            otherUserName: userData?.displayName || '알 수 없는 사용자',
            otherUserPhotoURL: userData?.photoURL
          });
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          chats.push({
            ...chatData,
            otherUserName: '알 수 없는 사용자'
          });
        }
      }

      // 마지막 메시지 시간순으로 정렬
      chats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      callback(chats);
    });

    return () => off(userChatsRef, 'value', unsubscribe);
  }

  // 메시지 읽음 처리
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // 사용자별 채팅 목록에서 읽지 않은 메시지 수 초기화
      const userChatRef = ref(realtimeDb, `userChats/${userId}/${chatId}/unreadCount`);
      await set(userChatRef, 0);
    } catch (error) {
      console.error('메시지 읽음 처리 오류:', error);
    }
  }

  // 총 읽지 않은 메시지 수 구독
  subscribeToUnreadCount(userId: string, callback: (count: number) => void): () => void {
    const userChatsRef = ref(realtimeDb, `userChats/${userId}`);
    
    const unsubscribe = onValue(userChatsRef, (snapshot) => {
      const chatsData = snapshot.val() || {};
      let totalUnread = 0;
      
      Object.values(chatsData).forEach((chat: any) => {
        totalUnread += chat.unreadCount || 0;
      });
      
      callback(totalUnread);
    });

    return () => off(userChatsRef, 'value', unsubscribe);
  }
}

export const chatService = new ChatService(); 