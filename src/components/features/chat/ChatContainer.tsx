import React from 'react';
import { useChatContext } from '../../../contexts/ChatContext';
import ChatWindow from './ChatWindow';

const ChatContainer: React.FC = () => {
  const { openChats } = useChatContext();

  console.log('ChatContainer 렌더링됨. openChats 길이:', openChats.length);
  console.log('openChats 상태:', openChats);

  return (
    <>
      {openChats.length > 0 && (
        <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
          <div className="text-xs bg-green-500 text-white p-2 mb-2 rounded">
            열린 채팅창 수: {openChats.length}
          </div>
        </div>
      )}
      {openChats.map((chat, index) => {
        console.log(`ChatWindow 렌더링: ${chat.otherUserName}, 위치: ${index}`);
        return (
          <ChatWindow
            key={chat.chatId}
            chatId={chat.chatId}
            otherUserId={chat.otherUserId}
            otherUserName={chat.otherUserName}
            otherUserPhotoURL={chat.otherUserPhotoURL}
            isMinimized={chat.isMinimized}
            messages={chat.messages}
            position={index}
          />
        );
      })}
    </>
  );
};

export default ChatContainer; 