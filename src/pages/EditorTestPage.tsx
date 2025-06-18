import React from 'react';
import EditorTestGuide from '../components/EditorTestGuide';
import CreatePost from '../components/CreatePost';

const EditorTestPage: React.FC = () => {
  const handlePostCreated = async () => {
    // 테스트 환경에서는 실제로 post를 다시 로드할 필요 없음
    console.log('Post created successfully in test mode');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 왼쪽: 테스트 가이드 */}
        <div className="xl:order-1">
          <EditorTestGuide />
        </div>
        
        {/* 오른쪽: 실제 에디터 */}
        <div className="xl:order-2">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">TipTap 에디터 테스트</h2>
            <CreatePost onPostCreated={handlePostCreated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorTestPage; 