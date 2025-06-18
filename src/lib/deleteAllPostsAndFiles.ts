import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { ref, listAll, deleteObject } from 'firebase/storage';

const deleteAllFilesInPath = async (path: string) => {
  const dirRef = ref(storage, path);
  const list = await listAll(dirRef);
  const deletePromises = list.items.map(item => deleteObject(item));
  await Promise.all(deletePromises);
};

const deletePostFiles = async (postId: string) => {
  await deleteAllFilesInPath(`post_images/${postId}`);
  // 필요시 첨부파일 경로도 추가
  // await deleteAllFilesInPath(`post_attachments/${postId}`);
};

export const deleteAllPostsAndFiles = async () => {
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);

  const deletePromises = snapshot.docs.map(async (docSnap) => {
    const postId = docSnap.id;
    // 1. Storage 파일 삭제
    await deletePostFiles(postId);
    // 2. Firestore 문서 삭제
    await deleteDoc(doc(db, 'posts', postId));
  });

  await Promise.all(deletePromises);
  alert('모든 게시글과 관련 파일이 삭제되었습니다!');
};
