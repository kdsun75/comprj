import React, { useState, useEffect } from 'react';
import { X, Home, Bookmark, Hash, Users, MessageSquare, TrendingUp, Calendar, Settings, HelpCircle, Zap, Star, Award, BarChart3 } from 'lucide-react';
import { getDailyActivity, getCategoryStats } from '../../services/statsService';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onWriteClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onWriteClick }) => {
  const [dailyActivity, setDailyActivity] = useState({
    newPosts: 0,
    comments: 0,
    likes: 0
  });
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: number }>({
    'AI 뉴스': 0,
    '머신러닝': 0,
    '딥러닝': 0,
    '데이터 분석': 0,
    '개발도구': 0
  });

  useEffect(() => {
    fetchSidebarStats();
  }, []);

  const fetchSidebarStats = async () => {
    try {
      const [activity, categories] = await Promise.all([
        getDailyActivity(),
        getCategoryStats()
      ]);
      setDailyActivity(activity);
      setCategoryStats(categories);
    } catch (error) {
      console.error('사이드바 통계 가져오기 오류:', error);
    }
  };

  const menuItems = [
    { icon: Home, label: '홈', href: '#', active: true },
    { icon: TrendingUp, label: '인기', href: '#', badge: 'HOT', badgeColor: 'from-red-500 to-orange-500' },
    { icon: Hash, label: '최신', href: '#' },
    { icon: Bookmark, label: '저장됨', href: '#' },
    { icon: Users, label: '커뮤니티', href: '#' },
    { icon: MessageSquare, label: '채팅', href: '#', count: 0 },
  ];

  const communityItems = [
    { icon: Zap, label: 'AI 뉴스', color: 'bg-yellow-100 text-yellow-600', href: '#', count: categoryStats['AI 뉴스'] },
    { icon: Star, label: '머신러닝', color: 'bg-blue-100 text-blue-600', href: '#', count: categoryStats['머신러닝'] },
    { icon: Award, label: '딥러닝', color: 'bg-purple-100 text-purple-600', href: '#', count: categoryStats['딥러닝'] },
    { icon: BarChart3, label: '데이터 분석', color: 'bg-green-100 text-green-600', href: '#', count: categoryStats['데이터 분석'] },
    { icon: Settings, label: '개발도구', color: 'bg-gray-100 text-gray-600', href: '#', count: categoryStats['개발도구'] },
  ];

  const quickActions = [
    { icon: Calendar, label: '이벤트', href: '#' },
    { icon: HelpCircle, label: '도움말', href: '#' },
    { icon: Settings, label: '설정', href: '#' },
  ];

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* 사이드바 */}
      <div className={`
        fixed top-16 left-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl z-50
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto md:shadow-none
      `}>
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Community</h2>
                <p className="text-2xs text-gray-500 dark:text-gray-400">AI 커뮤니티</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 글쓰기 버튼 */}
          <div className="p-4">
            <button
              onClick={onWriteClick}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 hover:scale-105 shadow-medium hover:shadow-large group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              새 글 작성
            </button>
          </div>

          {/* 메인 네비게이션 */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
            {/* 주요 메뉴 */}
            <div className="space-y-1">
              <h3 className="px-3 text-2xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                메인 메뉴
              </h3>
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className={`
                    relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group
                    ${item.active 
                      ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 shadow-soft' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-105'
                    }
                  `}
                >
                  <item.icon className={`
                    h-5 w-5 mr-3 transition-all duration-200
                    ${item.active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}
                    group-hover:scale-110
                  `} />
                  <span className="flex-1 text-left">{item.label}</span>
                  
                  {/* 뱃지 */}
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-2xs font-bold bg-gradient-to-r ${item.badgeColor} text-white rounded-md shadow-soft`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* 카운트 */}
                  {item.count && (
                    <span className="px-2 py-0.5 text-2xs font-bold bg-primary-100 text-primary-700 rounded-full">
                      {item.count}
                    </span>
                  )}

                  {/* 활성 상태 인디케이터 */}
                  {item.active && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-accent-500 rounded-r-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* 커뮤니티 섹션 */}
            <div className="space-y-1">
              <h3 className="px-3 text-2xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <span>커뮤니티</span>
                <div className="ml-2 w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
              </h3>
              {communityItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105 group"
                >
                  <div className={`p-1.5 rounded-lg mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-2xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* 빠른 실행 */}
            <div className="space-y-1">
              <h3 className="px-3 text-2xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                빠른 실행
              </h3>
              {quickActions.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 hover:scale-105 group"
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-600 group-hover:scale-110 transition-all duration-200" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>

            {/* 통계 카드 */}
            <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-2xl p-4 border border-primary-100/50 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">오늘의 활동</h4>
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xs text-gray-600">새 글</span>
                  <span className="text-sm font-bold text-primary-600">{dailyActivity.newPosts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xs text-gray-600">댓글</span>
                  <span className="text-sm font-bold text-accent-600">{dailyActivity.comments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xs text-gray-600">좋아요</span>
                  <span className="text-sm font-bold text-success-600">{dailyActivity.likes}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary-100">
                <div className="flex items-center text-2xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-success-400 rounded-full mr-2 animate-pulse"></div>
                  실시간 업데이트 중
                </div>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xs text-gray-500">© 2024 AI Community</p>
              <p className="text-2xs text-gray-400 mt-1">Made with ❤️ for AI enthusiasts</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 