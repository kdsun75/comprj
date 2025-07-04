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
  updateDoc,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/config';

// 데이터 모델 인터페이스
export interface BookMark {
  id: string;
  userId: string;
  postId: string;
  createdAt: Timestamp;
  note?: string; // 개인 메모 (선택적)
}

export interface LikeBookmarkStatus {
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
}

class LikeBookmarkServiceV2 {
  // ==================== 좋아요 기능 (기존 posts 구조 활용) ====================
  
  /**
   * 게시글 좋아요 추가 (posts 컬렉션의 likedBy 배열 사용)
   */
  async addPostLike(postId: string, userId: string): Promise<void> {
    console.log('🔍 likeBookmarkServiceV2 - addPostLike 시작:', { postId, userId });
    
    try {
      const postRef = doc(db, 'posts', postId);
      console.log('📍 likeBookmarkServiceV2 - postRef 경로:', postRef.path);
      
      // 게시글이 존재하는지 확인
      console.log('🔄 likeBookmarkServiceV2 - 게시글 존재 확인');
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        console.log('❌ likeBookmarkServiceV2 - 게시글을 찾을 수 없음');
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      console.log('📊 likeBookmarkServiceV2 - 현재 게시글 데이터:', { 
        likeCount: postData.likeCount, 
        likedByLength: likedBy.length,
        likedBy: likedBy.slice(0, 3) // 첫 3개만 로그
      });
      
      // 이미 좋아요가 있는지 확인
      if (likedBy.includes(userId)) {
        console.log('⚠️ likeBookmarkServiceV2 - 이미 좋아요를 누른 상태');
        throw new Error('이미 좋아요를 누른 게시글입니다.');
      }
      
      // 좋아요 추가
      console.log('🔄 likeBookmarkServiceV2 - Firestore 업데이트 실행');
      await updateDoc(postRef, {
        likedBy: arrayUnion(userId),
        likeCount: (postData.likeCount || 0) + 1,
        updatedAt: serverTimestamp()
      });
      console.log('✅ likeBookmarkServiceV2 - 좋아요 추가 Firestore 업데이트 완료');
    } catch (error) {
      console.error('❌ likeBookmarkServiceV2 - 좋아요 추가 중 오류:', error);
      throw new Error(error instanceof Error ? error.message : '좋아요 추가 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 좋아요 삭제
   */
  async removePostLike(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', postId);
      
      // 게시글이 존재하는지 확인
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      
      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      
      // 좋아요가 있는지 확인
      if (!likedBy.includes(userId)) {
        throw new Error('좋아요를 찾을 수 없습니다.');
      }
      
      // 좋아요 삭제
      await updateDoc(postRef, {
        likedBy: arrayRemove(userId),
        likeCount: Math.max(0, (postData.likeCount || 1) - 1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('좋아요 삭제 중 오류:', error);
      throw new Error(error instanceof Error ? error.message : '좋아요 삭제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 게시글 좋아요 토글
   */
  async togglePostLike(postId: string, userId: string): Promise<boolean> {
    console.log('🔍 likeBookmarkServiceV2 - togglePostLike 시작:', { postId, userId });
    
    try {
      console.log('🔄 likeBookmarkServiceV2 - 현재 좋아요 상태 확인');
      const isLiked = await this.isPostLiked(postId, userId);
      console.log('📊 likeBookmarkServiceV2 - 현재 상태:', { isLiked });
      
      if (isLiked) {
        console.log('🔄 likeBookmarkServiceV2 - 좋아요 제거 실행');
        await this.removePostLike(postId, userId);
        console.log('✅ likeBookmarkServiceV2 - 좋아요 제거 완료');
        return false;
      } else {
        console.log('🔄 likeBookmarkServiceV2 - 좋아요 추가 실행');
        await this.addPostLike(postId, userId);
        console.log('✅ likeBookmarkServiceV2 - 좋아요 추가 완료');
        return true;
      }
    } catch (error) {
      console.error('❌ likeBookmarkServiceV2 - 좋아요 토글 중 오류:', error);
      throw error;
    }
  }

  /**
   * 게시글 좋아요 상태 확인
   */
  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        return false;
      }
      
      const likedBy = postDoc.data()?.likedBy || [];
      return likedBy.includes(userId);
    } catch (error) {
      console.error('좋아요 상태 확인 중 오류:', error);
      return false;
    }
  }

  /**
   * 사용자가 좋아요한 게시글 목록 조회 (posts 컬렉션에서 검색)
   */
  async getUserLikedPosts(userId: string, limitCount: number = 20): Promise<any[]> {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('likedBy', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('좋아요한 게시글 조회 중 오류:', error);
      throw new Error('좋아요한 게시글을 조회할 수 없습니다.');
    }
  }

  // ==================== 북마크 기능 (새로운 bookmarks 컬렉션) ====================

  /**
   * 게시글 북마크 추가
   */
  async addBookmark(postId: string, userId: string, note?: string): Promise<void> {
    try {
      const bookmarkId = `${userId}_${postId}`;
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
      
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
      const bookmarkData: any = {
        userId,
        postId,
        createdAt: serverTimestamp()
      };
      
      if (note) {
        bookmarkData.note = note;
      }
      
      await setDoc(bookmarkRef, bookmarkData);
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
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
      
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
   * 게시글 북마크 토글
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
      const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
      const bookmarkDoc = await getDoc(bookmarkRef);
      return bookmarkDoc.exists();
    } catch (error) {
      console.error('북마크 상태 확인 중 오류:', error);
      return false;
    }
  }

  /**
   * 사용자가 북마크한 게시글 목록 조회
   */
  async getUserBookmarkedPosts(userId: string, limitCount: number = 20): Promise<BookMark[]> {
    try {
      const bookmarksRef = collection(db, 'bookmarks');
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
    const bookmarkId = `${userId}_${postId}`;
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    const postRef = doc(db, 'posts', postId);

    let currentStatus: LikeBookmarkStatus = {
      isLiked: false,
      isBookmarked: false,
      likeCount: 0
    };

    const updateCallback = () => {
      callback(currentStatus);
    };

    // 게시글 구독 (좋아요 상태와 좋아요 수)
    const unsubscribePost = onSnapshot(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const likedBy = data?.likedBy || [];
        currentStatus.isLiked = likedBy.includes(userId);
        currentStatus.likeCount = data?.likeCount || 0;
      } else {
        currentStatus.isLiked = false;
        currentStatus.likeCount = 0;
      }
      updateCallback();
    });

    // 북마크 구독
    const unsubscribeBookmark = onSnapshot(bookmarkRef, (snapshot) => {
      currentStatus.isBookmarked = snapshot.exists();
      updateCallback();
    });

    // 모든 구독을 해제하는 함수 반환
    return () => {
      unsubscribePost();
      unsubscribeBookmark();
    };
  }

  /**
   * 북마크 컬렉션 초기화 (개발/테스트용)
   */
  async initializeBookmarksCollection(): Promise<void> {
    try {
      // 더미 북마크를 하나 생성해서 컬렉션이 보이도록 함
      const dummyId = 'dummy_initialization';
      const bookmarkRef = doc(db, 'bookmarks', dummyId);
      
      await setDoc(bookmarkRef, {
        userId: 'system',
        postId: 'initialization',
        createdAt: serverTimestamp(),
        note: '컬렉션 초기화용 더미 데이터'
      });
      
      console.log('bookmarks 컬렉션이 초기화되었습니다.');
      
      // 잠시 후 더미 데이터 삭제
      setTimeout(async () => {
        try {
          await deleteDoc(bookmarkRef);
          console.log('더미 북마크 데이터가 삭제되었습니다.');
        } catch (err) {
          console.log('더미 데이터 삭제 실패 (이미 삭제되었을 수 있음)');
        }
      }, 5000);
      
    } catch (error) {
      console.error('북마크 컬렉션 초기화 중 오류:', error);
      throw new Error('컬렉션 초기화에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const likeBookmarkServiceV2 = new LikeBookmarkServiceV2();
export default likeBookmarkServiceV2; 