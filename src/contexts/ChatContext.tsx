import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { chatService, UserChat, ChatMessage } from '../services/chatService';

interface OpenChat {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhotoURL?: string;
  isMinimized: boolean;
  messages: ChatMessage[];
}

interface ChatContextType {
  // 상태
  userChats: UserChat[];
  openChats: OpenChat[];
  unreadCount: number;
  loading: boolean;

  // 액션
  openChat: (otherUserId: string, otherUserName: string, otherUserPhotoURL?: string) => Promise<void>;
  closeChat: (chatId: string) => void;
  minimizeChat: (chatId: string) => void;
  maximizeChat: (chatId: string) => void;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  markAsRead: (chatId: string) => void;
  addTestChat: () => void; // 테스트용
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    console.error('ChatContext가 null입니다! ChatProvider 내부에서 사용되지 않았습니다.');
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 상태 변화 감지
  React.useEffect(() => {
    console.log('ChatContext - openChats 상태 변경됨:', openChats);
  }, [openChats]);

  React.useEffect(() => {
    console.log('ChatContext - currentUser 변경됨:', currentUser?.uid);
  }, [currentUser]);

  // 사용자 채팅 목록 구독
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = chatService.subscribeToUserChats(
      currentUser.uid,
      (chats) => {
        setUserChats(chats);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  // 읽지 않은 메시지 수 구독
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = chatService.subscribeToUnreadCount(
      currentUser.uid,
      (count) => {
        setUnreadCount(count);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  // 메시지 구독 관리 (무한 리렌더링 방지를 위해 ref 사용)
  const messagesSubscriptionsRef = React.useRef<Map<string, () => void>>(new Map());

  // 새로운 채팅창이 추가되면 메시지 구독 시작
  React.useEffect(() => {
    openChats.forEach((chat) => {
      // 이미 구독 중인 채팅방은 건너뛰기
      if (messagesSubscriptionsRef.current.has(chat.chatId)) {
        return;
      }

      console.log('새 채팅방 메시지 구독 시작:', chat.chatId);
      const unsubscribe = chatService.subscribeToMessages(
        chat.chatId,
        (messages) => {
          console.log('메시지 업데이트:', chat.chatId, messages.length);
          setOpenChats(prev => 
            prev.map(openChat => 
              openChat.chatId === chat.chatId 
                ? { ...openChat, messages }
                : openChat
            )
          );
        }
      );
      
      messagesSubscriptionsRef.current.set(chat.chatId, unsubscribe);
    });

    // 닫힌 채팅방의 구독 해제
    const currentChatIds = new Set(openChats.map(chat => chat.chatId));
    messagesSubscriptionsRef.current.forEach((unsubscribe, chatId) => {
      if (!currentChatIds.has(chatId)) {
        console.log('채팅방 구독 해제:', chatId);
        unsubscribe();
        messagesSubscriptionsRef.current.delete(chatId);
      }
    });
  });

  // 컴포넌트 언마운트 시 모든 구독 해제
  React.useEffect(() => {
    return () => {
      console.log('모든 메시지 구독 해제');
      messagesSubscriptionsRef.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      messagesSubscriptionsRef.current.clear();
    };
  }, []);

  // 채팅창 열기 (중복 호출 방지)
  const openingChatsRef = React.useRef<Set<string>>(new Set());
  
  const openChat = async (otherUserId: string, otherUserName: string, otherUserPhotoURL?: string) => {
    console.log('openChat 함수 호출됨:', { otherUserId, otherUserName, currentUser: currentUser?.uid });
    
    if (!currentUser?.uid) {
      console.error('현재 사용자가 없습니다.');
      return;
    }

    // 자기 자신과 채팅 방지
    if (currentUser.uid === otherUserId) {
      console.error('❌ 자기 자신과는 채팅할 수 없습니다!');
      alert('자기 자신과는 채팅할 수 없습니다.');
      return;
    }

    // 중복 호출 방지
    if (openingChatsRef.current.has(otherUserId)) {
      console.log('⚠️ 이미 처리 중인 채팅방:', otherUserId);
      return;
    }

    try {
      openingChatsRef.current.add(otherUserId);
      setLoading(true);
      console.log('채팅창 열기 시작...');
      
      // 이미 열린 채팅창인지 확인
      const existingChat = openChats.find(chat => chat.otherUserId === otherUserId);
      if (existingChat) {
        console.log('이미 열린 채팅창 발견:', existingChat.chatId);
        // 이미 열린 채팅창이면 최대화
        maximizeChat(existingChat.chatId);
        return;
      }

      console.log('새 채팅방 생성 중...');
      // 채팅방 ID 가져오기 또는 생성
      let chatId;
      try {
        console.log('🔄 getOrCreateChat 호출 직전');
        chatId = await chatService.getOrCreateChat(currentUser.uid, otherUserId);
        console.log('🎉 getOrCreateChat 완료! 반환값:', chatId);
        console.log('🔍 chatId 타입 검사:', typeof chatId, 'length:', chatId?.length);
      } catch (chatError) {
        console.error('❌ getOrCreateChat 에러:', chatError);
        throw chatError;
      }
      
      console.log('✅ await 완료, 다음 단계 진행 중...');
      
      if (!chatId) {
        console.error('❌ chatId가 null 또는 undefined입니다!');
        throw new Error('채팅방 ID를 가져올 수 없습니다.');
      }
      
      // 새 채팅창 추가
      const newChat: OpenChat = {
        chatId,
        otherUserId,
        otherUserName,
        otherUserPhotoURL,
        isMinimized: false,
        messages: []
      };

      console.log('새 채팅창 객체 생성됨:', newChat);
      console.log('setOpenChats 호출 직전...');
      
      try {
        console.log('🔄 React 상태 업데이트 시작...');
        
        setOpenChats(prev => {
          console.log('🎯 setOpenChats 콜백 실행됨!');
          console.log('이전 openChats 상태:', prev);
          console.log('추가할 newChat:', newChat);
          const updated = [...prev, newChat];
          console.log('새로운 openChats 상태:', updated);
          console.log('✅ 상태 업데이트 완료');
          return updated;
        });
        
        console.log('React 상태 업데이트 호출 완료');
        
        // 읽음 처리
        try {
          markAsRead(chatId);
          console.log('markAsRead 완료');
        } catch (markError) {
          console.error('markAsRead 에러 (무시):', markError);
        }
        
        console.log('✅ openChat 함수 실행 완료');
        
      } catch (stateError) {
        console.error('❌ setState 에러:', stateError);
        throw stateError;
      }
      
    } catch (error) {
      console.error('채팅창 열기 오류:', error);
    } finally {
      openingChatsRef.current.delete(otherUserId);
      setLoading(false);
    }
  };

  // 채팅창 닫기
  const closeChat = (chatId: string) => {
    setOpenChats(prev => prev.filter(chat => chat.chatId !== chatId));
  };

  // 채팅창 최소화
  const minimizeChat = (chatId: string) => {
    setOpenChats(prev => 
      prev.map(chat => 
        chat.chatId === chatId 
          ? { ...chat, isMinimized: true }
          : chat
      )
    );
  };

  // 채팅창 최대화
  const maximizeChat = (chatId: string) => {
    setOpenChats(prev => 
      prev.map(chat => 
        chat.chatId === chatId 
          ? { ...chat, isMinimized: false }
          : chat
      )
    );
  };

  // 메시지 전송
  const sendMessage = async (chatId: string, content: string) => {
    if (!currentUser?.uid || !currentUser.displayName) return;

    const chat = openChats.find(c => c.chatId === chatId);
    if (!chat) return;

    try {
      await chatService.sendMessage(
        currentUser.uid,
        chat.otherUserId,
        content,
        currentUser.displayName,
        currentUser.photoURL || undefined
      );
    } catch (error) {
      console.error('메시지 전송 오류:', error);
    }
  };

  // 읽음 처리
  const markAsRead = (chatId: string) => {
    if (!currentUser?.uid) return;
    chatService.markMessagesAsRead(chatId, currentUser.uid);
  };

  // 테스트용: 강제로 채팅창 추가
  const addTestChat = () => {
    console.log('테스트 채팅창 강제 추가!');
    const testChat: OpenChat = {
      chatId: 'test-chat-123',
      otherUserId: 'test-user',
      otherUserName: '테스트 사용자',
      otherUserPhotoURL: undefined,
      isMinimized: false,
      messages: []
    };
    
    setOpenChats(prev => {
      console.log('테스트 채팅창 추가 - 이전 상태:', prev);
      const updated = [...prev, testChat];
      console.log('테스트 채팅창 추가 - 새 상태:', updated);
      return updated;
    });
  };

  const value: ChatContextType = {
    userChats,
    openChats,
    unreadCount,
    loading,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    sendMessage,
    markAsRead,
    addTestChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 