import React, { useState } from 'react';
import { CheckCircle, Info } from 'lucide-react';

const EditorTestGuide: React.FC = () => {
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());

  const toggleTest = (testId: string) => {
    const newCompleted = new Set(completedTests);
    if (newCompleted.has(testId)) {
      newCompleted.delete(testId);
    } else {
      newCompleted.add(testId);
    }
    setCompletedTests(newCompleted);
  };

  const testItems = [
    {
      id: 'basic-text',
      category: '기본 텍스트 편집',
      title: '텍스트 포맷팅',
      description: '굵게(Ctrl+B), 기울임(Ctrl+I), 취소선 버튼을 클릭하여 텍스트 스타일이 적용되는지 확인',
      priority: 'high'
    },
    {
      id: 'headings',
      category: '기본 텍스트 편집',
      title: '제목 스타일',
      description: 'H1, H2, H3 버튼을 클릭하여 제목 스타일이 적용되는지 확인',
      priority: 'high'
    },
    {
      id: 'lists',
      category: '기본 텍스트 편집',
      title: '목록 기능',
      description: '순서 있는/없는 목록 버튼을 클릭하여 목록이 생성되는지 확인',
      priority: 'medium'
    },
    {
      id: 'quote',
      category: '기본 텍스트 편집',
      title: '인용구',
      description: '인용구 버튼을 클릭하여 인용구 스타일이 적용되는지 확인',
      priority: 'medium'
    },
    {
      id: 'image-upload',
      category: '이미지 업로드',
      title: '파일 선택 업로드',
      description: '이미지 아이콘을 클릭하여 파일 선택 후 업로드가 되는지 확인',
      priority: 'high'
    },
    {
      id: 'drag-drop',
      category: '이미지 업로드',
      title: '드래그&드롭',
      description: '이미지 파일을 에디터 영역에 드래그하여 업로드가 되는지 확인',
      priority: 'high'
    },
    {
      id: 'copy-paste',
      category: '이미지 업로드',
      title: '복사&붙여넣기',
      description: '클립보드의 이미지를 Ctrl+V로 붙여넣어 업로드가 되는지 확인',
      priority: 'medium'
    },
    {
      id: 'youtube-embed',
      category: '유튜브 임베드',
      title: '유튜브 영상 삽입',
      description: '유튜브 아이콘을 클릭하여 유튜브 URL을 입력하고 영상이 임베드되는지 확인',
      priority: 'high'
    },
    {
      id: 'link-creation',
      category: '링크 처리',
      title: '링크 생성',
      description: '링크 아이콘을 클릭하여 URL을 입력하고 하이퍼링크가 생성되는지 확인',
      priority: 'medium'
    },
    {
      id: 'auto-link',
      category: '링크 처리',
      title: '자동 링크 감지',
      description: 'http://나 https://로 시작하는 URL을 입력했을 때 자동으로 링크가 되는지 확인',
      priority: 'medium'
    },
    {
      id: 'link-preview',
      category: '링크 처리',
      title: '링크 미리보기',
      description: '링크가 입력되었을 때 하단에 미리보기가 나타나는지 확인',
      priority: 'low'
    },
    {
      id: 'color-picker',
      category: '스타일링',
      title: '텍스트 색상',
      description: '컬러 피커를 사용하여 텍스트 색상이 변경되는지 확인',
      priority: 'low'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const categories = [...new Set(testItems.map(item => item.category))];
  const completionRate = Math.round((completedTests.size / testItems.length) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">TipTap 에디터 기능 테스트 가이드</h1>
        
        {/* 진행률 표시 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-800 font-semibold">테스트 진행률</span>
            <span className="text-blue-600 font-bold">{completedTests.size}/{testItems.length} ({completionRate}%)</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* 우선순위 범례 */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">높은 우선순위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">중간 우선순위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">낮은 우선순위</span>
          </div>
        </div>
      </div>

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-4">
            {category}
          </h2>
          
          <div className="space-y-3">
            {testItems
              .filter(item => item.category === category)
              .map(item => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                    completedTests.has(item.id)
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => toggleTest(item.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {completedTests.has(item.id) ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '중간' : '낮음'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm ml-8">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* 완료 상태 요약 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">테스트 완료 시 확인사항</h3>
        </div>
        <ul className="text-sm text-gray-600 space-y-1 ml-7">
          <li>• 모든 기능이 에러 없이 작동하는지 확인</li>
          <li>• 업로드된 이미지가 Firebase Storage에 저장되는지 확인</li>
          <li>• 게시글 작성 후 데이터가 Firestore에 저장되는지 확인</li>
          <li>• 브라우저 콘솔에 에러가 없는지 확인</li>
          <li>• 모바일/태블릿에서도 정상 작동하는지 확인</li>
        </ul>
      </div>

      {completionRate === 100 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <h3 className="font-semibold text-green-800">🎉 모든 테스트가 완료되었습니다!</h3>
              <p className="text-green-700 text-sm">TipTap 에디터가 정상적으로 작동하고 있습니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorTestGuide; 