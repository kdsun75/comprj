import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, X, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onWriteClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onWriteClick }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currentUser, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 네비게이션 */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xl font-display font-bold text-gray-900 dark:text-white tracking-tight">Community</span>
                  <span className="text-2xs text-gray-500 dark:text-gray-400 font-medium -mt-1">AI 커뮤니티</span>
                </div>
              </div>
            </div>

            {/* 데스크톱 네비게이션 */}
            <nav className="hidden lg:ml-8 lg:flex lg:space-x-1">
              <Link 
                to="/" 
                className="relative px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105"
              >
                <span className="relative z-10">홈</span>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-slate-600/10 rounded-xl opacity-50"></div>
              </Link>
              <div className="relative group">
                <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105 flex items-center">
                  카테고리
                  <ChevronDown className="ml-1 h-3 w-3" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <a href="/?category=ai" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">🤖 AI</a>
                  <a href="/?category=ml" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">📊 머신러닝</a>
                  <a href="/?category=deep" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">🧠 딥러닝</a>
                  <a href="/?category=nlp" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">💬 NLP</a>
                  <a href="/?category=cv" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">👁️ Computer Vision</a>
                  <a href="/?category=other" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">📋 기타</a>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105">
                인기글
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105">
                최신글
              </button>
              <Link
                to="/profile"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
              >
                프로필
              </Link>
            </nav>
          </div>

          {/* 검색 및 사용자 메뉴 */}
          <div className="flex items-center space-x-3">
            {/* 검색 */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center animate-scale-in">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="AI, 머신러닝, 커뮤니티 검색..."
                      className="w-64 h-10 pl-4 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:focus:ring-slate-400/20 focus:border-slate-300 dark:focus:border-slate-500 transition-all duration-200 shadow-sm"
                      autoFocus
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="ml-2 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-105 group"
                >
                  <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                </button>
              )}
            </div>

            {/* 알림 */}
            <button className="relative p-2.5 text-gray-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-105 group">
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm">
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                <span className="relative block h-full w-full rounded-full bg-emerald-500"></span>
              </span>
            </button>

            {/* 다크모드 토글 */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-105 group"
              title={isDark ? '라이트 모드로 변경' : '다크 모드로 변경'}
            >
              {isDark ? (
                <Sun className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              ) : (
                <Moon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>

            {/* 글쓰기 버튼 */}
            <button
              onClick={onWriteClick}
              className="hidden sm:flex items-center px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white text-sm font-medium rounded-xl hover:from-slate-800 hover:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              글 작성
            </button>

            {/* 사용자 메뉴 */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105 group"
                >
                  <div className="relative">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="프로필"
                        className="h-8 w-8 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-slate-700 group-hover:ring-slate-200 dark:group-hover:ring-slate-600 transition-all duration-200"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-700 group-hover:ring-slate-200 dark:group-hover:ring-slate-600 transition-all duration-200">
                        <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 dark:bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-900"></div>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {currentUser.displayName || '사용자'}
                    </span>
                    <span className="text-2xs text-gray-500 dark:text-gray-400">온라인</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-200 group-hover:rotate-180" />
                </button>

                {/* 드롭다운 메뉴 */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 animate-scale-in">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt="프로필"
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl flex items-center justify-center">
                              <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 dark:bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">{currentUser.displayName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</div>
                          <div className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium">● 온라인</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span>프로필 설정</span>
                      </button>
                      <button className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3">
                        <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>설정</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center space-x-3"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>로그아웃</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="primary" size="sm" className="rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                로그인
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 