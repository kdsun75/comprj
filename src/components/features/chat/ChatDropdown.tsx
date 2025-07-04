import React, { useRef, useEffect } from 'react';
import { User, Clock } from 'lucide-react';
import { useChatContext } from '../../../contexts/ChatContext';

interface ChatDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDropdown: React.FC<ChatDropdownProps> = ({ isOpen, onClose }) => {
  const { userChats, openChat } = useChatContext();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 시간 포맷팅
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 채팅 클릭시 채팅창 열기
  const handleChatClick = async (chat: any) => {
    await openChat(chat.otherUserId, chat.otherUserName, chat.otherUserPhotoURL);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">메시지</h3>
      </div>

      {/* 채팅 목록 */}
      <div className="overflow-y-auto max-h-80">
        {userChats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              아직 대화한 사람이 없습니다.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              게시글이나 댓글의 사용자 이름을 클릭해보세요!
            </p>
          </div>
        ) : (
          userChats.map((chat) => (
            <div
              key={chat.chatId}
              onClick={() => handleChatClick(chat)}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                {/* 사용자 아바타 */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                    {chat.otherUserPhotoURL ? (
                      <img 
                        src={chat.otherUserPhotoURL} 
                        alt={chat.otherUserName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  {/* 읽지 않은 메시지 뱃지 */}
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </div>
                  )}
                </div>

                {/* 채팅 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {chat.otherUserName}
                    </h4>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTime(chat.lastMessageTime)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 푸터 */}
      {userChats.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            총 {userChats.length}개의 대화
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatDropdown; 