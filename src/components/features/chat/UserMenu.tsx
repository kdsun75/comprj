import React, { useRef, useEffect } from 'react';
import { MessageCircle, User } from 'lucide-react';
import { useChatContext } from '../../../contexts/ChatContext';
import { useAuth } from '../../../contexts/AuthContext';

interface UserMenuProps {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  userId, 
  userName, 
  userPhotoURL, 
  isOpen, 
  onClose, 
  children 
}) => {
  const { currentUser } = useAuth();
  const { openChat } = useChatContext();
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  // 대화하기 클릭
  const handleStartChat = async () => {
    console.log('대화하기 버튼 클릭됨:', { userId, userName, currentUser: currentUser?.uid });
    
    if (!currentUser?.uid) {
      console.error('사용자가 로그인되지 않았습니다.');
      return;
    }
    
    if (userId === currentUser.uid) {
      console.log('본인과는 대화할 수 없습니다.');
      return;
    }
    
    console.log('openChat 함수 호출 시도...');
    try {
      await openChat(userId, userName, userPhotoURL);
      console.log('openChat 함수 호출 성공');
      onClose();
    } catch (error) {
      console.error('openChat 함수 호출 오류:', error);
    }
  };

  // 현재 사용자 본인인지 확인
  const isCurrentUser = currentUser?.uid === userId;

  return (
    <div className="relative inline-block">
      {/* 트리거 (사용자 이름) */}
      <div 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 사용자 정보 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                {userPhotoURL ? (
                  <img 
                    src={userPhotoURL} 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  {userName}
                </h4>
                {isCurrentUser && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    본인
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 메뉴 항목 */}
          <div className="py-1">
            {!isCurrentUser && currentUser && (
              <button
                onClick={handleStartChat}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                <span>대화하기</span>
              </button>
            )}
            
            {/* 추가 메뉴 항목들 (미래 확장용) */}
            {/* 
            <button
              onClick={() => {}}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>프로필 보기</span>
            </button>
            */}
          </div>

          {/* 로그인하지 않은 경우 */}
          {!currentUser && (
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                대화하려면 로그인이 필요합니다
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMenu; 