import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, Eye, Calendar, User, Tag, TrendingUp, MoreVertical, ExternalLink, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { deletePost } from '../../../services/postService';
import { usePost } from '../../../contexts/PostContext';
import { commentService } from '../../../services/commentService';
import LikeBookmarkButtons from '../../LikeBookmarkButtons';
import DebugLikeButton from '../../DebugLikeButton';
import DatabaseDebugInfo from '../../DatabaseDebugInfo';
import UserMenu from '../chat/UserMenu';
// Note: LikeBookmarkButtons는 이미 useLikeBookmarkV2를 사용하고 있습니다

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: {
      name: string;
      photoURL?: string;
    };
    authorId: string;
    createdAt: string;
    likes: number;
    comments: number;
    tags: string[];
    imageUrl?: string;
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const menuRef = useRef<HTMLDivElement>(null);

  const { currentUser } = useAuth();
  const { setShouldRefresh } = usePost();
  const navigate = useNavigate();

  const isAuthor = currentUser && currentUser.uid === post.authorId;

  // 댓글 수 실시간 구독
  useEffect(() => {
    const unsubscribe = commentService.subscribeToCommentCount(post.id, (count) => {
      setCommentCount(count);
    });

    return () => unsubscribe();
  }, [post.id]);



  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) {
        return '방금 전';
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}일 전`;
      } else {
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return '날짜 정보 없음';
    }
  };





  const handleDelete = async () => {
    const confirmMessage = `정말로 "${post.title || '이 게시물'}"을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    
    if (window.confirm(confirmMessage)) {
      setIsDeleting(true);
      try {
        await deletePost(post.id);
        setShouldRefresh(true); // 목록 새로고침
        // 성공 메시지는 간단하게
        console.log('게시물이 삭제되었습니다.');
      } catch (error) {
        console.error("게시물 삭제 오류:", error);
        alert('게시물 삭제에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/edit-post/${post.id}`);
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    const textContent = content.replace(/<[^>]*>/g, '');
    if (textContent.length <= maxLength) {
        return content; 
    }
    return content.slice(0, content.lastIndexOf(' ', maxLength)) + '...';
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
    ];
    const index = tag.length % colors.length;
    return colors[index];
  };

  return (
    <article className="bg-white rounded-2xl shadow-soft border border-gray-100/50 hover:shadow-medium transition-all duration-300 hover:scale-[1.02] group overflow-hidden">
      {/* 이미지 섹션 */}
      {post.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-white hover:scale-110">
            <ExternalLink className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      )}

      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              {post.author.photoURL ? (
                <img
                  src={post.author.photoURL}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-100 group-hover:ring-primary-200 transition-all duration-300"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center ring-2 ring-primary-100 group-hover:ring-primary-200 transition-all duration-300">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-400 rounded-full ring-2 ring-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <UserMenu
                userId={post.authorId}
                userName={post.author.name}
                userPhotoURL={post.author.photoURL}
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
              >
                <h4 
                  className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors duration-200 cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                >
                  {post.author.name}
                </h4>
              </UserMenu>
              <div className="flex items-center text-sm text-gray-500 space-x-2">
                <Calendar className="h-3 w-3" />
                <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>조회 {Math.floor(Math.random() * 1000) + 100}</span>
                </div>
              </div>
            </div>
          </div>
          {isAuthor && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleEdit();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" /> 수정하기
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleDelete();
                    }}
                    disabled={isDeleting}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      isDeleting 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> 
                    {isDeleting ? '삭제 중...' : '삭제하기'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 제목 */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors duration-200 cursor-pointer">
          {post.title}
        </h2>

        {/* 내용 */}
        <div className="prose prose-sm max-w-none mb-4">
          <div
            className="text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: showFullContent ? post.content : truncateContent(post.content) }}
          />
          {post.content.replace(/<[^>]*>/g, '').length > 200 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="mt-2 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
            >
              {showFullContent ? '간략히' : '더보기'}
            </button>
          )}
        </div>

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-3 py-1 text-2xs font-medium rounded-full border ${getTagColor(tag)} hover:scale-105 transition-transform duration-200 cursor-pointer`}
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="inline-flex items-center px-3 py-1 text-2xs font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200">
                +{post.tags.length - 3}개 더
              </span>
            )}
          </div>
        )}

        {/* 디버그 도구들 (개발용 - 나중에 제거) */}
        <DatabaseDebugInfo postId={post.id} />
        <DebugLikeButton postId={post.id} />

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {/* 좋아요 및 북마크 버튼 */}
            <LikeBookmarkButtons 
              postId={post.id} 
              size="md" 
              showCounts={true}
            />

            <button 
              onClick={() => navigate(`/post/${post.id}`)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{commentCount}</span>
            </button>

            <button className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-105">
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">공유</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* 인기도 표시 */}
            {post.likes > 10 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-600 rounded-lg">
                <TrendingUp className="h-3 w-3" />
                <span className="text-2xs font-bold">HOT</span>
              </div>
            )}
          </div>
        </div>

        {/* 추가 상호작용 미리보기 */}
        <div className="mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center justify-between text-2xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>💡 {Math.floor(Math.random() * 5) + 1}명이 이 글을 유용하다고 생각합니다</span>
            </div>
            <button className="text-primary-500 hover:text-primary-600 font-medium">
              댓글 보기 →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard; 