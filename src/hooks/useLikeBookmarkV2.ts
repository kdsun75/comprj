import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import likeBookmarkServiceV2, { LikeBookmarkStatus } from '../services/likeBookmarkServiceV2';

interface UseLikeBookmarkReturn {
  // 상태
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  loading: boolean;
  error: string | null;
  
  // 액션
  toggleLike: () => Promise<void>;
  toggleBookmark: () => Promise<void>;
}

/**
 * 게시글의 좋아요와 북마크 상태를 관리하는 커스텀 Hook (V2 - 기존 구조 활용)
 */
export const useLikeBookmark = (postId: string): UseLikeBookmarkReturn => {
  const { user } = useAuth();
  const [status, setStatus] = useState<LikeBookmarkStatus>({
    isLiked: false,
    isBookmarked: false,
    likeCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 상태 로딩
  useEffect(() => {
    if (!user || !postId) return;

    const loadInitialStatus = async () => {
      try {
        setLoading(true);
        const initialStatus = await likeBookmarkServiceV2.getPostLikeBookmarkStatus(postId, user.uid);
        setStatus(initialStatus);
      } catch (err) {
        console.error('상태 로딩 중 오류:', err);
        setError('상태를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialStatus();
  }, [postId, user]);

  // 실시간 상태 구독
  useEffect(() => {
    if (!user || !postId) return;

    const unsubscribe = likeBookmarkServiceV2.subscribeToUserPostStatus(
      postId,
      user.uid,
      (newStatus) => {
        setStatus(newStatus);
      }
    );

    return unsubscribe;
  }, [postId, user]);

  // 좋아요 토글
  const toggleLike = useCallback(async () => {
    console.log('🔍 useLikeBookmarkV2 - toggleLike 시작:', { postId, user: user?.uid });
    
    if (!user) {
      console.log('❌ useLikeBookmarkV2 - 로그인 필요');
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('🔄 useLikeBookmarkV2 - likeBookmarkServiceV2.togglePostLike 호출');
      const newLikedState = await likeBookmarkServiceV2.togglePostLike(postId, user.uid);
      
      // 상태는 실시간 구독으로 자동 업데이트됨
      console.log(`✅ useLikeBookmarkV2 - 좋아요 ${newLikedState ? '추가' : '제거'} 완료`);
    } catch (err) {
      console.error('❌ useLikeBookmarkV2 - 좋아요 토글 중 오류:', err);
      setError(err instanceof Error ? err.message : '좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  // 북마크 토글
  const toggleBookmark = useCallback(async () => {
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      const newBookmarkedState = await likeBookmarkServiceV2.toggleBookmark(postId, user.uid);
      
      // 상태는 실시간 구독으로 자동 업데이트됨
      console.log(`북마크 ${newBookmarkedState ? '추가' : '제거'} 완료`);
    } catch (err) {
      console.error('북마크 토글 중 오류:', err);
      setError(err instanceof Error ? err.message : '북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  return {
    isLiked: status.isLiked,
    isBookmarked: status.isBookmarked,
    likeCount: status.likeCount,
    loading,
    error,
    toggleLike,
    toggleBookmark
  };
};

/**
 * 사용자가 좋아요한 게시글 목록을 관리하는 Hook (V2)
 */
export const useUserLikedPosts = (limitCount: number = 20) => {
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLikedPosts = useCallback(async () => {
    if (!user) {
      setLikedPosts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const posts = await likeBookmarkServiceV2.getUserLikedPosts(user.uid, limitCount);
      setLikedPosts(posts);
    } catch (err) {
      console.error('좋아요한 게시글 로딩 중 오류:', err);
      setError('좋아요한 게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, limitCount]);

  useEffect(() => {
    loadLikedPosts();
  }, [loadLikedPosts]);

  return {
    likedPosts,
    loading,
    error,
    refetch: loadLikedPosts
  };
};

/**
 * 사용자가 북마크한 게시글 목록을 관리하는 Hook (V2)
 */
export const useUserBookmarkedPosts = (limitCount: number = 20) => {
  const { user } = useAuth();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarkedPosts = useCallback(async () => {
    if (!user) {
      setBookmarkedPosts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const posts = await likeBookmarkServiceV2.getUserBookmarkedPosts(user.uid, limitCount);
      setBookmarkedPosts(posts);
    } catch (err) {
      console.error('북마크한 게시글 로딩 중 오류:', err);
      setError('북마크한 게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, limitCount]);

  useEffect(() => {
    loadBookmarkedPosts();
  }, [loadBookmarkedPosts]);

  return {
    bookmarkedPosts,
    loading,
    error,
    refetch: loadBookmarkedPosts
  };
};

/**
 * 컬렉션 초기화 Hook (관리자용)
 */
export const useInitializeCollections = () => {
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeBookmarks = useCallback(async () => {
    try {
      setInitializing(true);
      setError(null);
      await likeBookmarkServiceV2.initializeBookmarksCollection();
      console.log('북마크 컬렉션 초기화 완료');
    } catch (err) {
      console.error('초기화 중 오류:', err);
      setError(err instanceof Error ? err.message : '초기화 중 오류가 발생했습니다.');
    } finally {
      setInitializing(false);
    }
  }, []);

  return {
    initializeBookmarks,
    initializing,
    error
  };
}; 