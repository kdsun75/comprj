import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import TipTapEditor from './TipTapEditor';
import LinkPreview from './LinkPreview';
import { deleteAllPosts } from '../lib/deleteAllPosts';
import { deleteAllPostsAndFiles } from '../lib/deleteAllPostsAndFiles';
import { Plus, X, Tag, Send, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface CreatePostProps {
  onPostCreated: () => Promise<void>;
  onCancel?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('ai');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [extractedLinks, setExtractedLinks] = useState<string[]>([]);
  const [selectedLinkForPreview, setSelectedLinkForPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  // 카테고리 옵션
  const categoryOptions = [
    { id: 'ai', label: 'AI', description: '인공지능 일반' },
    { id: 'ml', label: '머신러닝', description: '머신러닝 관련' },
    { id: 'deep', label: '딥러닝', description: '딥러닝 관련' },
    { id: 'nlp', label: 'NLP', description: '자연어 처리' },
    { id: 'cv', label: 'Computer Vision', description: '컴퓨터 비전' },
    { id: 'other', label: '기타', description: '기타 AI 관련 주제' }
  ];

  console.log('CreatePost 컴포넌트 렌더링됨', { 
    showPreview, 
    contentLength: content.length,
    currentUser: !!currentUser 
  });

  // 내용에서 링크 추출
  useEffect(() => {
    const extractLinksFromContent = () => {
      // URL 패턴 매칭을 위한 정규식
      const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
      
      // HTML에서 텍스트만 추출
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      const matches = textContent.match(urlRegex);
      const uniqueLinks = matches ? [...new Set(matches)] : [];
      
      setExtractedLinks(uniqueLinks);
      
      // 첫 번째 링크를 자동으로 미리보기로 선택
      if (uniqueLinks.length > 0 && !selectedLinkForPreview) {
        setSelectedLinkForPreview(uniqueLinks[0]);
      } else if (uniqueLinks.length === 0) {
        setSelectedLinkForPreview(null);
      }
    };

    const timeoutId = setTimeout(extractLinksFromContent, 500);
    return () => clearTimeout(timeoutId);
  }, [content, selectedLinkForPreview]);

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

    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력하세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        authorId: currentUser.uid,
        title: title.trim() || '제목 없음',
        content,
        category,
        tags: Array.isArray(newTags) ? newTags : [],
        linkPreview: selectedLinkForPreview ? { url: selectedLinkForPreview } : null,
        extractedLinks,
        images: [],
        attachments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likeCount: 0,
        likedBy: [],
        bookmarkCount: 0,
        commentCount: 0
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('게시글이 성공적으로 작성되었습니다. ID:', docRef.id);
      
      // Reset form
      setTitle('');
      setContent('');
      setCategory('ai');
      setTags([]);
      setCurrentTag('');
      setExtractedLinks([]);
      setSelectedLinkForPreview(null);
      setShowPreview(false);
      
      // 글 작성 완료 콜백 호출 (모달 닫기 & 새로고침 트리거)
      await onPostCreated();
      
      // 성공 메시지 (모달이 닫힌 후에 표시)
      setTimeout(() => {
        alert('게시글이 성공적으로 작성되었습니다! 🎉');
      }, 300);
    } catch (error) {
      console.error('Error creating post:', error);
      if (error instanceof Error) {
        alert('게시글 작성 중 오류가 발생했습니다: ' + error.message);
      } else {
        alert('게시글 작성 중 알 수 없는 오류가 발생했습니다.');
      }
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

  const clearForm = () => {
    if (window.confirm('작성 중인 내용이 모두 삭제됩니다. 계속하시겠습니까?')) {
      setTitle('');
      setContent('');
      setCategory('ai');
      setTags([]);
      setCurrentTag('');
      setExtractedLinks([]);
      setSelectedLinkForPreview(null);
      setShowPreview(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleLinkSelection = (url: string) => {
    setSelectedLinkForPreview(selectedLinkForPreview === url ? null : url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">새 게시글 작성</h1>
            <p className="text-gray-600 dark:text-gray-400">커뮤니티와 생각을 공유해보세요. 이미지, 동영상, 링크 등을 자유롭게 추가할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={togglePreview}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? '편집 모드' : '미리보기'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 입력 */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent transition duration-200 text-lg"
            placeholder="게시글 제목을 입력하세요..."
            maxLength={100}
          />
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            {title.length}/100
          </div>
        </div>

        {/* 카테고리 선택 */}
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            카테고리
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent transition duration-200"
          >
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            게시글에 적합한 카테고리를 선택해주세요
          </p>
        </div>

        {/* 내용 입력/미리보기 */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            내용
          </label>
          
          {showPreview ? (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 min-h-[300px]">
              <div className="prose prose-sm dark:prose-invert sm:prose lg:prose-lg xl:prose-2xl max-w-none">
                <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{title || '제목 없음'}</h1>
                <div 
                  className="text-gray-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: content || '<p className="text-gray-500 dark:text-gray-400">내용을 입력하세요...</p>' }} 
                />
              </div>
            </div>
          ) : (
            <TipTapEditor
              content={content}
              onChange={setContent}
            />
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            💡 팁: 이미지는 드래그&드롭으로 추가하거나, 툴바의 이미지 버튼을 클릭하세요. 유튜브 링크와 일반 웹 링크도 지원됩니다.
          </div>
        </div>

        {/* 링크 관리 */}
        {extractedLinks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">감지된 링크</h4>
            <div className="space-y-2">
              {extractedLinks.map((link, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <input
                    type="radio"
                    id={`link-${index}`}
                    name="selectedLink"
                    checked={selectedLinkForPreview === link}
                    onChange={() => handleLinkSelection(link)}
                    className="text-slate-600 dark:text-slate-400 focus:ring-slate-500 dark:focus:ring-slate-400"
                  />
                  <label htmlFor={`link-${index}`} className="flex-1 cursor-pointer">
                    <span className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 break-all">
                      {link}
                    </span>
                  </label>
                </div>
              ))}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                선택된 링크는 게시글에 미리보기로 표시됩니다.
              </div>
            </div>
          </div>
        )}

        {/* 링크 미리보기 */}
        {selectedLinkForPreview && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">링크 미리보기</h4>
            <LinkPreview
              url={selectedLinkForPreview}
              onRemove={() => setSelectedLinkForPreview(null)}
            />
          </div>
        )}

        {/* 태그 입력 */}
        <div className="space-y-2">
          <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            태그 <span className="text-gray-500 dark:text-gray-400 font-normal">(최대 10개)</span>
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent transition duration-200"
                placeholder="태그를 입력하고 Enter를 누르세요..."
                maxLength={20}
                disabled={tags.length >= 10}
              />
              <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            </div>
            <button
              type="button"
              onClick={addTag}
              disabled={!currentTag.trim() || tags.length >= 10}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
          
          {/* 태그 목록 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-full text-sm font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 ml-1"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={clearForm}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition duration-200 flex items-center gap-2"
            >
              <X size={16} />
              초기화
            </button>
          </div>
          
          <div className="flex gap-3 items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {content.replace(/<[^>]*>/g, '').length} 글자
            </div>
            
            {/* 취소 버튼 */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200 flex items-center gap-2 font-medium"
              >
                <X size={16} />
                취소
              </button>
            )}
            
            {/* 작성 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-semibold shadow-sm hover:shadow-md hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  게시 중...
                </>
              ) : (
                <>
                  <Send size={16} />
                  게시글 작성
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 개발/관리용 버튼들 */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">관리자 도구</h3>
          </div>
          <div className="flex gap-3">
            <button
              onClick={deleteAllPosts}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition duration-200 flex items-center gap-2 text-sm"
            >
              <Trash2 size={14} />
              모든 게시글 삭제
            </button>
            <button
              onClick={deleteAllPostsAndFiles}
              className="px-4 py-2 bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-300 dark:hover:bg-red-900/80 transition duration-200 flex items-center gap-2 text-sm"
            >
              <Trash2 size={14} />
              모든 게시글+파일 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost; 