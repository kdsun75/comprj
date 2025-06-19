import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likeCount: number;
  likedBy: string[]; // 좋아요를 누른 사용자들의 ID 배열
}

export interface CommentInput {
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
}

class CommentService {
  // 댓글 추가 (트랜잭션으로 commentCount도 함께 업데이트)
  async addComment(postId: string, commentData: CommentInput): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // 게시글 문서 참조
        const postRef = doc(db, 'posts', postId);
        
        // 댓글 서브컬렉션에 새 댓글 추가
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const newCommentRef = doc(commentsRef);
        
        // undefined 필드를 제거한 데이터 객체 생성
        const cleanCommentData: any = {
          content: commentData.content,
          authorId: commentData.authorId,
          authorName: commentData.authorName,
          likeCount: 0,
          likedBy: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // authorPhotoURL이 존재하고 undefined가 아닐 때만 추가
        if (commentData.authorPhotoURL !== undefined && commentData.authorPhotoURL !== null) {
          cleanCommentData.authorPhotoURL = commentData.authorPhotoURL;
        }
        
        transaction.set(newCommentRef, cleanCommentData);
        
        // 게시글의 commentCount 증가
        transaction.update(postRef, {
          commentCount: increment(1)
        });
        
        return newCommentRef.id;
      });
    } catch (error) {
      console.error('댓글 추가 중 오류:', error);
      throw new Error('댓글을 추가할 수 없습니다.');
    }
  }

  // 댓글 삭제 (트랜잭션으로 commentCount도 함께 업데이트)
  async deleteComment(postId: string, commentId: string): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        // 게시글 문서 참조
        const postRef = doc(db, 'posts', postId);
        
        // 댓글 문서 참조
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);
        
        transaction.delete(commentRef);
        
        // 게시글의 commentCount 감소
        transaction.update(postRef, {
          commentCount: increment(-1)
        });
      });
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      throw new Error('댓글을 삭제할 수 없습니다.');
    }
  }

  // 댓글 수정
  async updateComment(postId: string, commentId: string, content: string): Promise<void> {
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await updateDoc(commentRef, {
        content,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
      throw new Error('댓글을 수정할 수 없습니다.');
    }
  }

  // 댓글 좋아요 토글
  async toggleCommentLike(postId: string, commentId: string, userId: string): Promise<void> {
    console.log('toggleCommentLike 시작:', { postId, commentId, userId });
    
    try {
      // 트랜잭션 대신 간단한 업데이트로 먼저 테스트
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      console.log('댓글 문서 경로:', commentRef.path);
      
      // 먼저 문서가 존재하는지 확인
      const commentDoc = await getDoc(commentRef);
      console.log('댓글 문서 존재 여부:', commentDoc.exists());
      
      if (!commentDoc.exists()) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }
      
      const commentData = commentDoc.data();
      const likedBy = commentData.likedBy || [];
      const currentLikeCount = commentData.likeCount || 0;
      const isLiked = likedBy.includes(userId);
      
      console.log('현재 좋아요 상태:', { 
        currentLikeCount, 
        likedBy, 
        isLiked, 
        userId 
      });
      
      if (isLiked) {
        // 좋아요 취소
        console.log('좋아요 취소 실행');
        await updateDoc(commentRef, {
          likeCount: Math.max(0, currentLikeCount - 1),
          likedBy: likedBy.filter((id: string) => id !== userId),
          updatedAt: serverTimestamp()
        });
      } else {
        // 좋아요 추가
        console.log('좋아요 추가 실행');
        await updateDoc(commentRef, {
          likeCount: currentLikeCount + 1,
          likedBy: [...likedBy, userId],
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('toggleCommentLike 업데이트 완료');
    } catch (error) {
      console.error('댓글 좋아요 토글 중 오류:', error);
      throw new Error('좋아요 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  }

  // 댓글 실시간 구독
  subscribeToComments(
    postId: string,
    callback: (comments: Comment[]) => void
  ): () => void {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const comments: Comment[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        likeCount: doc.data().likeCount || 0,
        likedBy: doc.data().likedBy || []
      } as Comment));
      
      callback(comments);
    }, (error) => {
      console.error('댓글 구독 중 오류:', error);
    });
  }

  // 댓글 수 실시간 구독
  subscribeToCommentCount(
    postId: string,
    callback: (count: number) => void
  ): () => void {
    const postRef = doc(db, 'posts', postId);

    return onSnapshot(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.commentCount || 0);
      } else {
        callback(0);
      }
    }, (error) => {
      console.error('댓글 수 구독 중 오류:', error);
    });
  }
}

export const commentService = new CommentService();
export default commentService; 