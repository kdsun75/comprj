import { db } from '../firebase/config';
import { doc, deleteDoc, updateDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';

export const deletePost = async (postId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error('게시물 삭제 중 오류:', error);
    throw new Error('게시물을 삭제할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
  }
};

export const updatePost = async (postId: string, updatedData: { title: string; content: string; category: string; tags: string[] }) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updatedData,
      tags: Array.isArray(updatedData.tags) ? updatedData.tags : [],
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('게시물 업데이트 중 오류:', error);
    throw new Error('게시물을 수정할 수 없습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
  }
};

// 게시글 좋아요 토글
export const togglePostLike = async (postId: string, userId: string): Promise<void> => {
  console.log('게시글 좋아요 토글 시작:', { postId, userId });
  
  try {
    const postRef = doc(db, 'posts', postId);
    console.log('게시글 문서 경로:', postRef.path);
    
    // 먼저 문서가 존재하는지 확인
    const postDoc = await getDoc(postRef);
    console.log('게시글 문서 존재 여부:', postDoc.exists());
    
    if (!postDoc.exists()) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    const postData = postDoc.data();
    const likedBy = postData.likedBy || [];
    const currentLikeCount = postData.likeCount || 0;
    const isLiked = likedBy.includes(userId);
    
    console.log('현재 게시글 좋아요 상태:', { 
      currentLikeCount, 
      likedBy, 
      isLiked, 
      userId 
    });
    
    if (isLiked) {
      // 좋아요 취소
      console.log('게시글 좋아요 취소 실행');
      await updateDoc(postRef, {
        likeCount: Math.max(0, currentLikeCount - 1),
        likedBy: likedBy.filter((id: string) => id !== userId),
        updatedAt: serverTimestamp()
      });
    } else {
      // 좋아요 추가
      console.log('게시글 좋아요 추가 실행');
      await updateDoc(postRef, {
        likeCount: currentLikeCount + 1,
        likedBy: [...likedBy, userId],
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('게시글 좋아요 토글 완료');
  } catch (error) {
    console.error('게시글 좋아요 토글 중 오류:', error);
    throw new Error('좋아요 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
  }
}; 