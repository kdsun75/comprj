import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import { useInitializeCollections } from '../hooks/useLikeBookmarkV2';
import { migratePosts, syncLikeCounts, checkDatabaseStatus } from '../utils/migrationHelper';

interface DatabaseStatus {
  totalPosts: number;
  postsWithLikeCount: number;
  postsWithLikedBy: number;
  postsWithCommentCount: number;
  postsNeedingMigration: number;
}

interface AdminDatabaseManagerProps {
  className?: string;
}

const AdminDatabaseManager: React.FC<AdminDatabaseManagerProps> = ({
  className = ''
}) => {
  const { initializeBookmarks, initializing, error: initError } = useInitializeCollections();
  
  const [migrating, setMigrating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // 데이터베이스 상태 확인
  const loadDatabaseStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await checkDatabaseStatus();
      setDbStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    loadDatabaseStatus();
  }, []);

  // 게시글 마이그레이션
  const handleMigratePosts = async () => {
    if (!window.confirm('기존 게시글들에 좋아요/북마크 필드를 추가하시겠습니까?\n\n이 작업은 모든 게시글을 업데이트합니다.')) {
      return;
    }

    try {
      setMigrating(true);
      setError(null);
      await migratePosts();
      setSuccess('게시글 마이그레이션이 완료되었습니다!');
      await loadDatabaseStatus(); // 상태 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setMigrating(false);
    }
  };

  // 좋아요 수 동기화
  const handleSyncLikeCounts = async () => {
    if (!window.confirm('좋아요 수를 실제 데이터와 동기화하시겠습니까?')) {
      return;
    }

    try {
      setSyncing(true);
      setError(null);
      await syncLikeCounts();
      setSuccess('좋아요 수 동기화가 완료되었습니다!');
      await loadDatabaseStatus(); // 상태 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  // 북마크 컬렉션 초기화
  const handleInitializeBookmarks = async () => {
    if (window.confirm('북마크 컬렉션을 초기화하시겠습니까?\n\n이 작업은 Firebase Console에서 bookmarks 컬렉션이 보이도록 합니다.')) {
      await initializeBookmarks();
      if (!initError) {
        setSuccess('북마크 컬렉션이 초기화되었습니다!');
      }
    }
  };

  // 성공 메시지 자동 제거
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const isAnyLoading = migrating || syncing || initializing || loading;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center space-x-3 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          데이터베이스 관리 도구
        </h3>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
          개발용
        </span>
      </div>

      {/* 상태 메시지 */}
      <div className="space-y-3 mb-6">
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {initError && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{initError}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}
      </div>

      {/* 데이터베이스 상태 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>데이터베이스 상태</span>
          </h4>
          <button
            onClick={loadDatabaseStatus}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {dbStatus ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">총 게시글</div>
              <div className="text-2xl font-bold text-blue-600">{dbStatus.totalPosts}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">마이그레이션 필요</div>
              <div className={`text-2xl font-bold ${dbStatus.postsNeedingMigration > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {dbStatus.postsNeedingMigration}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">좋아요 필드</div>
              <div className="text-lg font-semibold text-gray-700">
                {dbStatus.postsWithLikeCount}/{dbStatus.totalPosts}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-gray-900">likedBy 배열</div>
              <div className="text-lg font-semibold text-gray-700">
                {dbStatus.postsWithLikedBy}/{dbStatus.totalPosts}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">상태를 불러오는 중...</div>
        )}
      </div>

      {/* 관리 도구들 */}
      <div className="space-y-3">
        {/* 게시글 마이그레이션 */}
        <button
          onClick={handleMigratePosts}
          disabled={isAnyLoading}
          className={`
            w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
            ${migrating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : dbStatus && dbStatus.postsNeedingMigration > 0
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }
          `}
        >
          {migrating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>마이그레이션 중...</span>
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              <span>
                게시글 마이그레이션 
                {dbStatus && dbStatus.postsNeedingMigration > 0 && ` (${dbStatus.postsNeedingMigration}개 필요)`}
              </span>
            </>
          )}
        </button>

        {/* 좋아요 수 동기화 */}
        <button
          onClick={handleSyncLikeCounts}
          disabled={isAnyLoading}
          className={`
            w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
            ${syncing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            }
          `}
        >
          {syncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>동기화 중...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>좋아요 수 동기화</span>
            </>
          )}
        </button>

        {/* 북마크 컬렉션 초기화 */}
        <button
          onClick={handleInitializeBookmarks}
          disabled={isAnyLoading}
          className={`
            w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
            ${initializing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {initializing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>초기화 중...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>북마크 컬렉션 초기화</span>
            </>
          )}
        </button>
      </div>

      {/* 도움말 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">🔧 사용 가이드</h4>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li><strong>게시글 마이그레이션</strong>: 기존 게시글에 좋아요 관련 필드 추가</li>
          <li><strong>좋아요 수 동기화</strong>: likeCount를 실제 likedBy 배열 길이와 맞춤</li>
          <li><strong>북마크 컬렉션 초기화</strong>: Firebase Console에 bookmarks 컬렉션 생성</li>
          <li><strong>⚠️ 프로덕션에서는 이 도구를 제거하세요</strong></li>
        </ol>
      </div>
    </div>
  );
};

export default AdminDatabaseManager; 