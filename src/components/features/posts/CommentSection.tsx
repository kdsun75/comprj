import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, Edit3, X, Check, Heart } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { commentService, Comment } from '../../../services/commentService';
import Button from '../../ui/Button';
import UserMenu from '../chat/UserMenu';

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'popular' | 'newest'>('popular');
  const [openUserMenus, setOpenUserMenus] = useState<{ [commentId: string]: boolean }>({});
  const { currentUser } = useAuth();

  useEffect(() => {
    // 댓글 실시간 구독
    const unsubscribeComments = commentService.subscribeToComments(postId, (updatedComments) => {
      // 정렬 타입에 따라 댓글 정렬
      const sortedComments = sortType === 'popular' 
        ? updatedComments.sort((a, b) => {
            if (b.likeCount !== a.likeCount) {
              return b.likeCount - a.likeCount;
            }
            return a.createdAt.toMillis() - b.createdAt.toMillis();
          })
        : updatedComments.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      
      setComments(sortedComments);
    });

    // 댓글 수 실시간 구독
    const unsubscribeCount = commentService.subscribeToCommentCount(postId, (count) => {
      setCommentCount(count);
    });

    return () => {
      unsubscribeComments();
      unsubscribeCount();
    };
  }, [postId, sortType]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await commentService.addComment(postId, {
        content: newComment.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '익명',
        authorPhotoURL: currentUser.photoURL || null
      });
      setNewComment('');
    } catch (err) {
      setError('댓글을 추가하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await commentService.deleteComment(postId, commentId);
    } catch (err) {
      setError('댓글을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingComment || !editingComment.content.trim()) return;

    try {
      await commentService.updateComment(postId, commentId, editingComment.content.trim());
      setEditingComment(null);
    } catch (err) {
      setError('댓글을 수정하는 중 오류가 발생했습니다.');
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment({ id: comment.id, content: comment.content });
  };

  const cancelEditing = () => {
    setEditingComment(null);
  };

  const handleToggleLike = async (commentId: string, comment: Comment) => {
    if (!currentUser) {
      console.log('로그인이 필요합니다.');
      return;
    }
    
    // 본인이 작성한 댓글에는 좋아요를 누를 수 없음
    if (comment.authorId === currentUser.uid) {
      console.log('본인이 작성한 댓글에는 좋아요를 누를 수 없습니다.');
      setError('본인이 작성한 댓글에는 좋아요를 누를 수 없습니다.');
      setTimeout(() => setError(null), 3000); // 3초 후 에러 메시지 제거
      return;
    }
    
    console.log('좋아요 토글 시도:', { postId, commentId, userId: currentUser.uid });
    
    try {
      await commentService.toggleCommentLike(postId, commentId, currentUser.uid);
      console.log('좋아요 토글 성공');
    } catch (err) {
      console.error('좋아요 토글 오류:', err);
      setError('좋아요 처리 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
    }
  };

  const isCommentLikedByUser = (comment: Comment) => {
    const isLiked = currentUser ? comment.likedBy?.includes(currentUser.uid) || false : false;
    console.log('댓글 좋아요 상태 확인:', { 
      commentId: comment.id, 
      currentUserId: currentUser?.uid, 
      likedBy: comment.likedBy, 
      isLiked 
    });
    return isLiked;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-8 border-t pt-6 dark:border-gray-700">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            댓글 ({commentCount})
          </h3>
        </div>
        
        {/* 정렬 옵션 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">정렬:</span>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSortType('popular')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                sortType === 'popular'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              ❤️ 인기순
            </button>
            <button
              onClick={() => setSortType('newest')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                sortType === 'newest'
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              🕐 최신순
            </button>
          </div>
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      {currentUser ? (
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="flex gap-3">
            {currentUser.photoURL && (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || '사용자'} 
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                rows={3}
                disabled={loading}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentUser.displayName || '익명'}
                </span>
                <Button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? '작성 중...' : '댓글 작성'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            댓글을 작성하려면 로그인이 필요합니다.
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8 dark:text-gray-400">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 flex-1">
                  {comment.authorPhotoURL && (
                    <img 
                      src={comment.authorPhotoURL} 
                      alt={comment.authorName} 
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <UserMenu
                        userId={comment.authorId}
                        userName={comment.authorName}
                        userPhotoURL={comment.authorPhotoURL}
                        isOpen={openUserMenus[comment.id] || false}
                        onClose={() => setOpenUserMenus(prev => ({ ...prev, [comment.id]: false }))}
                      >
                        <span 
                          className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenUserMenus(prev => ({ ...prev, [comment.id]: !prev[comment.id] }));
                          }}
                        >
                          {comment.authorName}
                        </span>
                      </UserMenu>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          (수정됨)
                        </span>
                      )}
                    </div>
                    
                    {editingComment && editingComment.id === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingComment.content}
                          onChange={(e) => setEditingComment({ 
                            ...editingComment, 
                            content: e.target.value 
                          })}
                          className="w-full p-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditComment(comment.id)}
                            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            <Check className="w-3 h-3" />
                            저장
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X className="w-3 h-3" />
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                        {comment.content}
                      </p>
                    )}
                    
                    {/* 댓글 좋아요 및 액션 */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {/* 좋아요 버튼 */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('좋아요 버튼 클릭됨:', comment.id);
                            handleToggleLike(comment.id, comment);
                          }}
                          disabled={!currentUser || (currentUser && comment.authorId === currentUser.uid)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all duration-200 ${
                            isCommentLikedByUser(comment)
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20'
                          } ${!currentUser || (currentUser && comment.authorId === currentUser.uid) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          title={
                            !currentUser ? '로그인이 필요합니다' :
                            currentUser && comment.authorId === currentUser.uid ? '본인이 작성한 댓글에는 좋아요를 누를 수 없습니다' :
                            isCommentLikedByUser(comment) ? '좋아요 취소' : '좋아요'
                          }
                        >
                          <Heart 
                            className={`w-4 h-4 ${isCommentLikedByUser(comment) ? 'fill-current' : ''}`} 
                          />
                          <span className="font-medium">{comment.likeCount || 0}</span>
                        </button>
                        
                        {/* 인기 댓글 표시 */}
                        {comment.likeCount >= 5 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs font-bold rounded-full dark:from-yellow-900/20 dark:to-orange-900/20 dark:text-yellow-400">
                            ⭐ 인기
                          </span>
                        )}
                      </div>
                      
                      {/* 본인 댓글 액션 버튼 */}
                      {currentUser && currentUser.uid === comment.authorId && (
                        <div className="flex gap-1">
                          {(!editingComment || editingComment.id !== comment.id) && (
                            <>
                              <button
                                onClick={() => startEditing(comment)}
                                className="p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                                title="수정"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection; 