import React from 'react';
import { Heart, Bookmark, Loader2 } from 'lucide-react';
import { useLikeBookmark } from '../hooks/useLikeBookmarkV2';

interface LikeBookmarkButtonsProps {
  postId: string;
  size?: 'sm' | 'md' | 'lg';
  showCounts?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const LikeBookmarkButtons: React.FC<LikeBookmarkButtonsProps> = ({
  postId,
  size = 'md',
  showCounts = true,
  orientation = 'horizontal',
  className = ''
}) => {
  const {
    isLiked,
    isBookmarked,
    likeCount,
    loading,
    error,
    toggleLike,
    toggleBookmark
  } = useLikeBookmark(postId);

  // 크기별 클래스 설정
  const sizeClasses = {
    sm: {
      button: 'p-1.5',
      icon: 'h-3 w-3',
      text: 'text-xs'
    },
    md: {
      button: 'p-2',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    lg: {
      button: 'p-3',
      icon: 'h-5 w-5',
      text: 'text-base'
    }
  };

  const currentSize = sizeClasses[size];

  // 배치 방향별 컨테이너 클래스
  const containerClass = orientation === 'horizontal' 
    ? 'flex items-center space-x-1' 
    : 'flex flex-col items-center space-y-1';

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 요소의 클릭 이벤트 방지
    console.log('🔍 LikeBookmarkButtons - handleLikeClick 시작:', { 
      postId, 
      loading, 
      isLiked, 
      likeCount 
    });
    try {
      await toggleLike();
      console.log('✅ LikeBookmarkButtons - handleLikeClick 완료');
    } catch (err) {
      console.error('❌ LikeBookmarkButtons - handleLikeClick 오류:', err);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 요소의 클릭 이벤트 방지
    console.log('🔍 LikeBookmarkButtons - handleBookmarkClick 시작:', { 
      postId, 
      loading, 
      isBookmarked 
    });
    try {
      await toggleBookmark();
      console.log('✅ LikeBookmarkButtons - handleBookmarkClick 완료');
    } catch (err) {
      console.error('❌ LikeBookmarkButtons - handleBookmarkClick 오류:', err);
    }
  };

  if (error) {
    console.error('LikeBookmarkButtons error:', error);
  }

  return (
    <div className={`${containerClass} ${className}`}>
      {/* 좋아요 버튼 */}
      <button
        onClick={handleLikeClick}
        disabled={loading}
        className={`
          ${currentSize.button}
          flex items-center space-x-1
          rounded-xl transition-all duration-200 hover:scale-105
          ${isLiked
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isLiked ? '좋아요 취소' : '좋아요'}
      >
        {loading ? (
          <Loader2 className={`${currentSize.icon} animate-spin`} />
        ) : (
          <Heart 
            className={`
              ${currentSize.icon} 
              ${isLiked ? 'fill-current' : ''} 
              transition-all duration-200
            `} 
          />
        )}
        {showCounts && (
          <span className={`${currentSize.text} font-medium`}>
            {likeCount}
          </span>
        )}
      </button>

      {/* 북마크 버튼 */}
      <button
        onClick={handleBookmarkClick}
        disabled={loading}
        className={`
          ${currentSize.button}
          rounded-xl transition-all duration-200 hover:scale-105
          ${isBookmarked
            ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
            : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isBookmarked ? '북마크 제거' : '북마크 추가'}
      >
        {loading ? (
          <Loader2 className={`${currentSize.icon} animate-spin`} />
        ) : (
          <Bookmark 
            className={`
              ${currentSize.icon} 
              ${isBookmarked ? 'fill-current' : ''} 
              transition-all duration-200
            `} 
          />
        )}
      </button>
    </div>
  );
};

export default LikeBookmarkButtons; 