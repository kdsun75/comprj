import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const deleteAllPosts = async () => {
  const postsRef = collection(db, 'posts');
  const snapshot = await getDocs(postsRef);

  const deletePromises = snapshot.docs.map((docSnap) =>
    deleteDoc(doc(db, 'posts', docSnap.id))
  );

  await Promise.all(deletePromises);
  alert('모든 게시글이 삭제되었습니다!');
};
