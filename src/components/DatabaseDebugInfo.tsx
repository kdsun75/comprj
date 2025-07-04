import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface DatabaseDebugInfoProps {
  postId?: string;
}

const DatabaseDebugInfo: React.FC<DatabaseDebugInfoProps> = ({ postId }) => {
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState<any>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [bookmarksCount, setBookmarksCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    try {
      setLoading(true);
      setError(null);

      // 전체 게시글 수 확인
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, limit(100));
      const postsSnapshot = await getDocs(postsQuery);
      setPostsCount(postsSnapshot.docs.length);

      // 북마크 컬렉션 확인
      try {
        const bookmarksRef = collection(db, 'bookmarks');
        const bookmarksQuery = query(bookmarksRef, limit(100));
        const bookmarksSnapshot = await getDocs(bookmarksQuery);
        setBookmarksCount(bookmarksSnapshot.docs.length);
      } catch (bookmarkError) {
        console.log('북마크 컬렉션이 존재하지 않음:', bookmarkError);
        setBookmarksCount(0);
      }

      // 특정 게시글 정보 확인
      if (postId) {
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);
        
        if (postDoc.exists()) {
          setPostData(postDoc.data());
        } else {
          setPostData(null);
        }
      }

    } catch (err) {
      console.error('Database 확인 중 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, [postId]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-blue-900">🗄️ 데이터베이스 상태</h3>
        <button
          onClick={checkDatabase}
          disabled={loading}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          <RefreshCw className={`h-3 w-3 inline mr-1 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded mb-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-white p-3 rounded border">
          <div className="font-medium text-gray-900 mb-1">📄 Posts 컬렉션</div>
          <div className="text-2xl font-bold text-blue-600">{postsCount}</div>
          <div className="text-gray-500">총 게시글 수</div>
        </div>

        <div className="bg-white p-3 rounded border">
          <div className="font-medium text-gray-900 mb-1">🔖 Bookmarks 컬렉션</div>
          <div className="text-2xl font-bold text-yellow-600">{bookmarksCount}</div>
          <div className="text-gray-500">총 북마크 수</div>
        </div>
      </div>

      {postId && (
        <div className="mt-4 bg-white p-3 rounded border">
          <div className="font-medium text-gray-900 mb-2">📊 현재 게시글 정보 (ID: {postId})</div>
          {postData ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>제목:</span>
                <span className="font-medium">{postData.title?.substring(0, 20) || 'N/A'}...</span>
              </div>
              <div className="flex justify-between">
                <span>likeCount:</span>
                <span className="font-medium text-red-600">{postData.likeCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>likedBy 배열:</span>
                <span className="font-medium text-blue-600">
                  [{(postData.likedBy || []).length}개] {JSON.stringify(postData.likedBy || [])}
                </span>
              </div>
              <div className="flex justify-between">
                <span>commentCount:</span>
                <span className="font-medium">{postData.commentCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>마이그레이션 상태:</span>
                <span className={`font-medium ${
                  (typeof postData.likeCount === 'number' && Array.isArray(postData.likedBy))
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(typeof postData.likeCount === 'number' && Array.isArray(postData.likedBy))
                    ? '✅ 완료' : '❌ 필요'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-red-600 text-xs">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              게시글을 찾을 수 없습니다
            </div>
          )}
        </div>
      )}

      <div className="mt-3 p-2 bg-gray-100 rounded text-2xs text-gray-600">
        <div className="font-medium mb-1">🔍 체크리스트:</div>
        <div className="space-y-0.5">
          <div className={postsCount > 0 ? 'text-green-600' : 'text-red-600'}>
            {postsCount > 0 ? '✅' : '❌'} Posts 컬렉션 존재 ({postsCount}개)
          </div>
          <div className={bookmarksCount >= 0 ? 'text-green-600' : 'text-red-600'}>
            {bookmarksCount >= 0 ? '✅' : '❌'} Bookmarks 컬렉션 접근 가능
          </div>
          {postId && postData && (
            <div className={
              (typeof postData.likeCount === 'number' && Array.isArray(postData.likedBy))
                ? 'text-green-600' : 'text-red-600'
            }>
              {(typeof postData.likeCount === 'number' && Array.isArray(postData.likedBy))
                ? '✅' : '❌'} 게시글 마이그레이션 완료
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseDebugInfo; 