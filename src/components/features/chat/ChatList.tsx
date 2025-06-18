import React from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import Input from '../../ui/Input';

interface ChatRoom {
  id: string;
  participant: {
    name: string;
    avatar?: string;
    isOnline: boolean;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

interface ChatListProps {
  chatRooms: ChatRoom[];
  onChatSelect?: (chatId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chatRooms, onChatSelect }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">채팅</h2>
          <MessageCircle className="w-5 h-5 text-gray-400" />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="대화 검색..."
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-0">
          {chatRooms.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">아직 채팅이 없습니다</p>
              <p className="text-sm text-gray-400">다른 사용자와 대화를 시작해보세요</p>
            </div>
          ) : (
            chatRooms.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect?.(chat.id)}
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                    {chat.participant.avatar ? (
                      <img
                        src={chat.participant.avatar}
                        alt={chat.participant.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium">
                        {chat.participant.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  {chat.participant.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.participant.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">
                        {formatTime(chat.lastMessage.timestamp)}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm truncate ${
                    chat.lastMessage.isRead ? 'text-gray-500' : 'text-gray-900 font-medium'
                  }`}>
                    {chat.lastMessage.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatList; 