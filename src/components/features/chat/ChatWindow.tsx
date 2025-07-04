import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Send, User } from 'lucide-react';
import { ChatMessage } from '../../../services/chatService';
import { useChatContext } from '../../../contexts/ChatContext';
import { useAuth } from '../../../contexts/AuthContext';

interface ChatWindowProps {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhotoURL?: string;
  isMinimized: boolean;
  messages: ChatMessage[];
  position: number; // 여러 채팅창 위치 계산용
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  otherUserId,
  otherUserName,
  otherUserPhotoURL,
  isMinimized,
  messages,
  position
}) => {
  const { currentUser } = useAuth();
  const { closeChat, minimizeChat, maximizeChat, sendMessage, markAsRead } = useChatContext();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(chatId, newMessage);
    setNewMessage('');
  };

  // 엔터키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // 메시지 목록을 아래로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 새 메시지가 오면 스크롤 및 읽음 처리
  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
      markAsRead(chatId);
    }
  }, [messages, isMinimized, chatId, markAsRead]);

  // 채팅창이 최대화되면 포커스
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // 시간 포맷팅
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 채팅창 위치 계산 (오른쪽에서부터)
  const rightPosition = 20 + (position * 320);

  console.log('ChatWindow 렌더링됨:', {
    otherUserName,
    position,
    rightPosition,
    isMinimized,
    messagesCount: messages.length
  });

  return (
    <div 
      className={`fixed bottom-0 border-4 border-yellow-400 rounded-t-lg shadow-2xl transition-all duration-300 ${
        isMinimized ? 'h-12' : 'h-96'
      }`}
      style={{ 
        right: `${rightPosition}px`,
        width: '300px',
        backgroundColor: '#ff0000',
        zIndex: 99999,
        boxShadow: '0 0 20px rgba(255, 0, 0, 0.8)'
      }}
    >
      {/* 채팅창 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
          {/* 사용자 아바타 */}
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
            {otherUserPhotoURL ? (
              <img 
                src={otherUserPhotoURL} 
                alt={otherUserName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </div>
          
          {/* 사용자 이름 */}
          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {otherUserName}
          </span>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => isMinimized ? maximizeChat(chatId) : minimizeChat(chatId)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => closeChat(chatId)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* 채팅창 내용 (최대화된 경우만) */}
      {!isMinimized && (
        <>
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-3 h-64 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                {otherUserName}님과 대화를 시작해보세요!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                        message.senderId === currentUser?.uid
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="break-words">{message.content}</div>
                      <div 
                        className={`text-xs mt-1 ${
                          message.senderId === currentUser?.uid 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 메시지 입력 폼 */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatWindow; 