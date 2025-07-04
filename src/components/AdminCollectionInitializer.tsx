import React from 'react';
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useInitializeCollections } from '../hooks/useLikeBookmarkV2';

interface AdminCollectionInitializerProps {
  className?: string;
}

const AdminCollectionInitializer: React.FC<AdminCollectionInitializerProps> = ({
  className = ''
}) => {
  const { initializeBookmarks, initializing, error } = useInitializeCollections();

  const handleInitialize = async () => {
    if (window.confirm('북마크 컬렉션을 초기화하시겠습니까?\n\n이 작업은 Firebase Console에서 bookmarks 컬렉션이 보이도록 합니다.')) {
      await initializeBookmarks();
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Database className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          컬렉션 초기화 도구
        </h3>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            Firestore에서 북마크 기능이 제대로 작동하려면 <code className="bg-gray-100 px-1 py-0.5 rounded">bookmarks</code> 컬렉션이 생성되어야 합니다.
          </p>
          <p>
            아직 북마크를 추가한 적이 없다면 이 버튼을 클릭하여 컬렉션을 초기화하세요.
          </p>
        </div>

        {/* 상태 표시 */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {initializing && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
            <span className="text-sm text-blue-700">컬렉션을 초기화하고 있습니다...</span>
          </div>
        )}

        {/* 초기화 버튼 */}
        <button
          onClick={handleInitialize}
          disabled={initializing}
          className={`
            w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${initializing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
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

        {/* 도움말 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">📝 참고사항</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 이 작업은 더미 데이터를 생성한 후 자동으로 삭제합니다.</li>
            <li>• Firebase Console에서 bookmarks 컬렉션이 생성된 것을 확인할 수 있습니다.</li>
            <li>• 실제 북마크 기능은 로그인 후 사용할 수 있습니다.</li>
            <li>• 프로덕션 환경에서는 이 컴포넌트를 제거하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminCollectionInitializer; 