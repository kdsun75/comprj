import { db } from '../firebase/config';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

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