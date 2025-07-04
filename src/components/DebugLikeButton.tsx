import React, { useState } from 'react';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import likeBookmarkServiceV2 from '../services/likeBookmarkServiceV2';

interface DebugLikeButtonProps {
  postId: string;
}

const DebugLikeButton: React.FC<DebugLikeButtonProps> = ({ postId }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-4), logMessage]); // 최근 5개만 유지
    console.log('🔍 DebugLikeButton:', logMessage);
  };

  const checkStatus = async () => {
    if (!currentUser) {
      addLog('❌ 사용자가 로그인되지 않음');
      return;
    }

    try {
      addLog(`📊 상태 확인 시작 - postId: ${postId}, userId: ${currentUser.uid}`);
      const status = await likeBookmarkServiceV2.getPostLikeBookmarkStatus(postId, currentUser.uid);
      setIsLiked(status.isLiked);
      setLikeCount(status.likeCount);
      addLog(`✅ 상태 확인 완료 - liked: ${status.isLiked}, count: ${status.likeCount}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      addLog(`❌ 상태 확인 실패: ${errorMsg}`);
      setError(errorMsg);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      addLog('❌ 로그인 필요');
      setError('로그인이 필요합니다');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      addLog(`🔄 좋아요 토글 시작 - postId: ${postId}, userId: ${currentUser.uid}`);
      
      const newLikedState = await likeBookmarkServiceV2.togglePostLike(postId, currentUser.uid);
      addLog(`✅ 좋아요 토글 완료 - newState: ${newLikedState}`);
      
      // 상태 재확인
      await checkStatus();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      addLog(`❌ 좋아요 토글 실패: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">🔍 디버그 좋아요 버튼</h3>
        <button
          onClick={checkStatus}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
        >
          상태 확인
        </button>
      </div>

      <div className="flex items-center space-x-3 mb-3">
        <button
          onClick={handleToggleLike}
          disabled={loading || !currentUser}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          )}
          <span>{isLiked ? '좋아요 취소' : '좋아요'}</span>
          <span className="bg-white px-2 py-0.5 rounded text-sm">{likeCount}</span>
        </button>

        <div className="text-xs text-gray-500">
          {currentUser ? `로그인됨: ${currentUser.email}` : '로그인 안됨'}
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded mb-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="text-xs text-gray-600">
        <div className="font-medium mb-1">📝 로그:</div>
        <div className="space-y-1 max-h-20 overflow-y-auto bg-white p-2 rounded border">
          {logs.length === 0 ? (
            <div className="text-gray-400">로그가 없습니다</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="font-mono text-2xs break-all">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugLikeButton; 