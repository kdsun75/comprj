import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import TipTapEditor from '../components/TipTapEditor';
import { updatePost } from '../services/postService';
import { usePost } from '../contexts/PostContext';
import { Plus, X, Save } from 'lucide-react';

const EditPostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { setShouldRefresh } = usePost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ai');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 옵션
  const categoryOptions = [
    { id: 'ai', label: 'AI', description: '인공지능 일반' },
    { id: 'ml', label: '머신러닝', description: '머신러닝 관련' },
    { id: 'deep', label: '딥러닝', description: '딥러닝 관련' },
    { id: 'nlp', label: 'NLP', description: '자연어 처리' },
    { id: 'cv', label: 'Computer Vision', description: '컴퓨터 비전' },
    { id: 'other', label: '기타', description: '기타 AI 관련 주제' }
  ];

  useEffect(() => {
    if (!postId) {
      navigate('/');
      return;
    }

    const fetchPost = async () => {
      try {
        setError(null);
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const postData = postSnap.data();
          // 권한 확인
          if (postData.authorId !== currentUser?.uid) {
            setError('이 게시물을 수정할 권한이 없습니다.');
            setTimeout(() => navigate('/'), 2000);
            return;
          }
          setTitle(postData.title);
          setContent(postData.content);
          setCategory(postData.category || 'ai');
          setTags(postData.tags || []);
        } else {
          setError('게시물을 찾을 수 없습니다.');
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error) {
        console.error("게시물 로드 오류:", error);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPost();
    }
  }, [postId, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let newTags = tags;
    if (currentTag.trim()) {
      const trimmedTag = currentTag.trim();
      if (!tags.includes(trimmedTag) && tags.length < 10) {
        newTags = [...tags, trimmedTag];
        setTags(newTags);
        setCurrentTag('');
      }
    }

    if (!currentUser || !postId) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력하세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    console.log('수정 시 전달되는 tags:', newTags);
    try {
      await updatePost(postId, {
        title: title.trim() || '제목 없음',
        content,
        category,
        tags: newTags,
      });
      setShouldRefresh(true);
      navigate('/'); // 홈으로 리디렉션
    } catch (error) {
      console.error('게시물 업데이트 오류:', error);
      setError('게시물 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">게시물 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">게시글 수정</h1>
        <p className="text-gray-600">내용을 수정하고 저장 버튼을 눌러주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
            제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="게시글 제목을 입력하세요..."
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            내용
          </label>
          <TipTapEditor
            content={content}
            onChange={setContent}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700">
            카테고리
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {categoryOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-semibold text-gray-700">
            태그 (최대 10개)
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3">
            <input
              type="text"
              id="tags"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
              className="flex-1 py-3 border-none focus:ring-0"
              placeholder="태그를 입력하고 Enter를 누르세요"
            />
            <button type="button" onClick={addTag} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <div key={tag} className="flex items-center bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm">
                <span>{tag}</span>
                <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-blue-500 hover:text-blue-700">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            취소
          </button>
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
            {isSubmitting ? '저장 중...' : <><Save size={16} /> 저장하기</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage; 