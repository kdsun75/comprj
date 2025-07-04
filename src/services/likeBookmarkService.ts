import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  increment,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// 데이터 모델 인터페이스
export interface PostLike {
  id: string;
  userId: string;
  postId: string;
  createdAt: Timestamp;
}

export interface BookMark {
  id: string;
  userId: string;
  postId: string;
  createdAt: Timestamp;
}

export interface LikeBookmarkStatus {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
}

class LikeBookmarkService {
  // ==================== 좋아요 기능 ====================
  
  /**
   * 게시글 좋아요 추가
   */
  async addPostLike(postId: string, userId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const likeId = `${userId}_${postId}`;
        const likeRef = doc(db, 'postLikes', likeId);
        const postRef = doc(db, 'posts', postId);
        
        // 이미 좋아요가 있는지 확인
        const existingLike = await transaction.get(likeRef);
        if (existingLike.exists()) {
          throw new Error('이미 좋아요를 누른 게시글입니다.');
        }
        
        // 게시글이 존재하는지 확인
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new Error('게시글을 찾을 수 없습니다.');
        }
        
        // 좋아요 추가
        transaction.set(likeRef, {
          userId,
          postId,
          createdAt: serverTimestamp()
        });
        
        // 게시글의 좋아요 수 증가
        transaction.update(postRef, {
          likeCount: increment(1),
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('좋아요 추가 중 오류:', error);
      throw new Error(error instanceof Error ? error.message : '좋아요 추가 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 좋아요 삭제
   */
  async removePostLike(postId: string, userId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const likeId = `${userId}_${postId}`;
        const likeRef = doc(db, 'postLikes', likeId);
        const postRef = doc(db, 'posts', postId);
        
        // 좋아요가 존재하는지 확인
        const existingLike = await transaction.get(likeRef);
        if (!existingLike.exists()) {
          throw new Error('좋아요를 찾을 수 없습니다.');
        }
        
        // 게시글이 존재하는지 확인
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new Error('게시글을 찾을 수 없습니다.');
        }
        
        // 좋아요 삭제
        transaction.delete(likeRef);
        
        // 게시글의 좋아요 수 감소 (0 이하로 내려가지 않도록)
        const currentLikeCount = postDoc.data()?.likeCount || 0;
        transaction.update(postRef, {
          likeCount: Math.max(0, currentLikeCount - 1),
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('좋아요 삭제 중 오류:', error);
      throw new Error(error instanceof Error ? error.message : '좋아요 삭제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 좋아요 토글 (추가/삭제)
   */
  async togglePostLike(postId: string, userId: string): Promise<boolean> {
    try {
      const isLiked = await this.isPostLiked(postId, userId);
      
      if (isLiked) {
        await this.removePostLike(postId, userId);
        return false;
      } else {
        await this.addPostLike(postId, userId);
        return true;
      }
    } catch (error) {
      console.error('좋아요 토글 중 오류:', error);
      throw error;
    }
  }

  /**
   * 게시글 좋아요 상태 확인
   */
  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const likeId = `${userId}_${postId}`;
      const likeRef = doc(db, 'postLikes', likeId);
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error('좋아요 상태 확인 중 오류:', error);
      return false;
    }
  }

  // ==================== 북마크 기능 ====================

  /**
   * 게시글 북마크 추가
   */
  async addBookmark(postId: string, userId: string): Promise<void> {
    try {
      const bookmarkId = `${userId}_${postId}`;
      const bookmarkRef = doc(db, 'bookMarks', bookmarkId);
      
      // 이미 북마크가 있는지 확인
      const existingBookmark = await getDoc(bookmarkRef);
      if (existingBookmark.exists()) {
        throw new Error('이미 북마크한 게시글입니다.');
      }
      
      // 게시글이 존재하는지 확인
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      
      // 북마크 추가
      await setDoc(bookmarkRef, {
        userId,
        postId,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('북마크 추가 중 오류:', error);
      throw new Error(error instanceof Error ? error.message : '북마크 추가 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 북마크 삭제
   */
  async removeBookmark(postId: string, userId: string): Promise<void> {
    try {
      const bookmarkId = `${userId}_${postId}`;
      const bookmarkRef = doc(db, 'bookMarks', bookmarkId);
      
      // 북마크가 존재하는지 확인
      const existingBookmark = await getDoc(bookmarkRef);
      if (!existingBookmark.exists()) {
        throw new Error('북마크를 찾을 수 없습니다.');
      }
      
      // 북마크 삭제
      await deleteDoc(bookmarkRef);
    } catch (error) {
      console.error('북마크 삭제 중 오류:', error);
      throw new Error(error instanceof Error ? error.message : '북마크 삭제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 북마크 토글 (추가/삭제)
   */
  async toggleBookmark(postId: string, userId: string): Promise<boolean> {
    try {
      const isBookmarked = await this.isPostBookmarked(postId, userId);
      
      if (isBookmarked) {
        await this.removeBookmark(postId, userId);
        return false;
      } else {
        await this.addBookmark(postId, userId);
        return true;
      }
    } catch (error) {
      console.error('북마크 토글 중 오류:', error);
      throw error;
    }
  }

  /**
   * 게시글 북마크 상태 확인
   */
  async isPostBookmarked(postId: string, userId: string): Promise<boolean> {
    try {
      const bookmarkId = `${userId}_${postId}`;
      const bookmarkRef = doc(db, 'bookMarks', bookmarkId);
      const bookmarkDoc = await getDoc(bookmarkRef);
      return bookmarkDoc.exists();
    } catch (error) {
      console.error('북마크 상태 확인 중 오류:', error);
      return false;
    }
  }

  // ==================== 상태 확인 및 조회 기능 ====================

  /**
   * 게시글의 좋아요 및 북마크 상태 확인
   */
  async getPostLikeBookmarkStatus(postId: string, userId: string): Promise<LikeBookmarkStatus> {
    try {
      const [isLiked, isBookmarked, postDoc] = await Promise.all([
        this.isPostLiked(postId, userId),
        this.isPostBookmarked(postId, userId),
        getDoc(doc(db, 'posts', postId))
      ]);

      const likeCount = postDoc.exists() ? (postDoc.data()?.likeCount || 0) : 0;

      return {
        isLiked,
        isBookmarked,
        likeCount
      };
    } catch (error) {
      console.error('상태 확인 중 오류:', error);
      return {
        isLiked: false,
        isBookmarked: false,
        likeCount: 0
      };
    }
  }

  /**
   * 사용자가 좋아요한 게시글 목록 조회
   */
  async getUserLikedPosts(userId: string, limitCount: number = 20): Promise<PostLike[]> {
    try {
      const likesRef = collection(db, 'postLikes');
      const q = query(
        likesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PostLike));
    } catch (error) {
      console.error('좋아요한 게시글 조회 중 오류:', error);
      throw new Error('좋아요한 게시글을 조회할 수 없습니다.');
    }
  }

  /**
   * 사용자가 북마크한 게시글 목록 조회
   */
  async getUserBookmarkedPosts(userId: string, limitCount: number = 20): Promise<BookMark[]> {
    try {
      const bookmarksRef = collection(db, 'bookMarks');
      const q = query(
        bookmarksRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BookMark));
    } catch (error) {
      console.error('북마크한 게시글 조회 중 오류:', error);
      throw new Error('북마크한 게시글을 조회할 수 없습니다.');
    }
  }

  /**
   * 게시글의 좋아요 수 실시간 구독
   */
  subscribeToPostLikeCount(
    postId: string,
    callback: (likeCount: number) => void
  ): () => void {
    const postRef = doc(db, 'posts', postId);

    return onSnapshot(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data?.likeCount || 0);
      } else {
        callback(0);
      }
    }, (error) => {
      console.error('좋아요 수 구독 중 오류:', error);
    });
  }

  /**
   * 사용자의 게시글 좋아요/북마크 상태 실시간 구독
   */
  subscribeToUserPostStatus(
    postId: string,
    userId: string,
    callback: (status: LikeBookmarkStatus) => void
  ): () => void {
    const likeId = `${userId}_${postId}`;
    const bookmarkId = `${userId}_${postId}`;
    
    const likeRef = doc(db, 'postLikes', likeId);
    const bookmarkRef = doc(db, 'bookMarks', bookmarkId);
    const postRef = doc(db, 'posts', postId);

    // 여러 문서를 동시에 구독하기 위해 각각 구독하고 상태를 합침
    let currentStatus: LikeBookmarkStatus = {
      isLiked: false,
      isBookmarked: false,
      likeCount: 0
    };

    const updateCallback = () => {
      callback(currentStatus);
    };

    const unsubscribeLike = onSnapshot(likeRef, (snapshot) => {
      currentStatus.isLiked = snapshot.exists();
      updateCallback();
    });

    const unsubscribeBookmark = onSnapshot(bookmarkRef, (snapshot) => {
      currentStatus.isBookmarked = snapshot.exists();
      updateCallback();
    });

    const unsubscribePost = onSnapshot(postRef, (snapshot) => {
      if (snapshot.exists()) {
        currentStatus.likeCount = snapshot.data()?.likeCount || 0;
      } else {
        currentStatus.likeCount = 0;
      }
      updateCallback();
    });

    // 모든 구독을 해제하는 함수 반환
    return () => {
      unsubscribeLike();
      unsubscribeBookmark();
      unsubscribePost();
    };
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const likeBookmarkService = new LikeBookmarkService();
export default likeBookmarkService; 