import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

import { useSearchParams, useNavigate } from 'react-router-dom';

import { usePost } from '../contexts/PostContext';
import { TrendingUp, Zap, Star, Filter, Search, Plus } from 'lucide-react';


interface Post {
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
  category: string;
  tags: string[];
  imageUrl?: string;
}

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('latest');
  const { shouldRefresh, setShouldRefresh } = usePost();

  const categories = [
    { id: 'all', label: '전체', icon: TrendingUp, color: 'text-gray-600' },
    { id: 'ai', label: 'AI', icon: Zap, color: 'text-yellow-600' },
    { id: 'ml', label: '머신러닝', icon: Star, color: 'text-blue-600' },
    { id: 'deep', label: '딥러닝', icon: Filter, color: 'text-purple-600' },
    { id: 'nlp', label: 'NLP', icon: Filter, color: 'text-green-600' },
    { id: 'cv', label: 'Computer Vision', icon: Search, color: 'text-red-600' },
    { id: 'other', label: '기타', icon: Plus, color: 'text-gray-500' },
  ];

  useEffect(() => {
    fetchPosts();
  }, []);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, selectedCategory]);

  // PostContext의 shouldRefresh 상태를 감지하여 자동 새로고침
  useEffect(() => {
    if (shouldRefresh) {
      fetchPosts();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, setShouldRefresh]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('게시글 목록을 가져오는 중...');
      
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(postsQuery);
      console.log('Firestore에서 가져온 게시글 수:', querySnapshot.docs.length);
      
      const postsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Timestamp 객체를 문자열로 변환
          let createdAtString = '';
          if (data.createdAt instanceof Timestamp) {
            createdAtString = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtString = data.createdAt;
          } else {
            createdAtString = new Date().toISOString();
          }

          // 작성자 정보 가져오기
          let authorInfo = {
            name: '익명',
            photoURL: undefined
          };

          if (data.authorId) {
            try {
              const userDoc = await import('firebase/firestore').then(({ doc, getDoc }) => 
                getDoc(doc(db, 'users', data.authorId))
              );
              if (userDoc.exists()) {
                const userData = userDoc.data();
                authorInfo = {
                  name: userData.displayName || userData.name || '익명',
                  photoURL: userData.photoURL
                };
              }
            } catch (error) {
              console.error('사용자 정보 가져오기 실패:', error);
            }
          }

          const postData = {
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            author: authorInfo,
            authorId: data.authorId || '',
            createdAt: createdAtString,
            likes: data.likeCount || 0,
            comments: data.commentCount || 0,
            category: data.category || 'ai',
            tags: data.tags || [],
            imageUrl: data.imageUrl
          };
          
          // 디버깅을 위한 로그 (댓글 수만 확인)
          if (data.commentCount !== undefined) {
            console.log('게시글 댓글 수:', {
              docId: doc.id,
              title: data.title,
              commentCount: data.commentCount
            });
          }
          
          return postData;
        })
      );
       
      setPosts(postsData);
      console.log('게시글 목록 업데이트 완료:', postsData.length, '개의 게시글');
    } catch (error) {
      console.error('게시글 가져오기 오류:', error);
      setError('게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.likes - a.likes;
      case 'discussed':
        return b.comments - a.comments;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handlePostClick = (postId: string) => {
    // 게시글 상세 페이지로 이동
    navigate(`/post/${postId}`);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // URL 파라미터도 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      newSearchParams.delete('category');
    } else {
      newSearchParams.set('category', categoryId);
    }
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">AI 커뮤니티 로딩 중...</h3>
            <p className="text-gray-500">최신 AI 소식을 가져오고 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">문제가 발생했습니다</h3>
            <p className="text-gray-500">{error}</p>
          </div>
          <button 
            onClick={fetchPosts}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 섹션 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI 커뮤니티</h1>
          
          {/* 카테고리 탭 */}
          <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-slate-700 text-white dark:bg-slate-600' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleCategoryChange('all')}
            >
              전체
            </button>
            {categories.slice(1).map((category) => (
              <button 
                key={category.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-slate-700 text-white dark:bg-slate-600' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* 상단 액션 버튼들 */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              게시글을 클릭하는 즉 요청이 발생됩니다.
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                채팅
              </button>
              <button 
                className="px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setSortBy('popular')}
              >
                인기글
              </button>
              <button className="px-4 py-2 bg-slate-700 dark:bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                새 글 작성
              </button>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="AI, 머신러닝, 딥러닝 관련 내용을 검색해보세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-slate-500 dark:focus:border-slate-400"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
            >
              <option value="all">AI</option>
              {categories.slice(1).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="discussed">댓글순</option>
            </select>
          </div>

          {/* 활성 필터 표시 */}
          {(searchTerm || selectedCategory !== 'all') && (
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">활성 필터:</span>
              {searchTerm && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-medium">
                  검색: {searchTerm}
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-medium">
                  {categories.find(c => c.id === selectedCategory)?.label}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                초기화
              </button>
            </div>
          )}
        </div>

        {/* 게시글 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPosts.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">게시글이 없습니다</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? '검색 조건에 맞는 게시글을 찾을 수 없습니다.' 
                  : '아직 작성된 게시글이 없습니다. 첫 번째 글을 작성해보세요!'}
              </p>
              <button className="px-6 py-3 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-medium">
                글 작성하기
              </button>
            </div>
          ) : (
            sortedPosts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
                onClick={() => handlePostClick(post.id)}
              >
                {/* 게시글 정보 */}
                <div className="p-4">
                  {/* 작성자 정보 */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {post.author.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{post.author.name}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-block w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full"></span>
                    </div>
                  </div>

                  {/* 제목 */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* 내용 미리보기 */}
                  <div className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                    {post.content.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}
                  </div>

                  {/* 하단 액션 바 */}
                  <div className="flex items-center justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>{post.comments}</span>
                      </div>
                      <button 
                        className="flex items-center space-x-1 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('공유 클릭');
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <span>공유</span>
                      </button>
                    </div>
                    <button 
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 font-medium transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePostClick(post.id);
                      }}
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 하단 페이지네이션 또는 더보기 */}
        {sortedPosts.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
              더 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 