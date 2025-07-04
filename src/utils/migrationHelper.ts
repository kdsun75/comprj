import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * 기존 게시글들에 좋아요 관련 필드를 추가하는 마이그레이션
 */
export const migratePosts = async (): Promise<void> => {
  try {
    console.log('게시글 마이그레이션 시작...');
    
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const updates: any = {};
      let needsUpdate = false;

      // likeCount 필드가 없으면 0으로 초기화
      if (typeof data.likeCount !== 'number') {
        updates.likeCount = 0;
        needsUpdate = true;
      }

      // likedBy 필드가 없으면 빈 배열로 초기화
      if (!Array.isArray(data.likedBy)) {
        updates.likedBy = [];
        needsUpdate = true;
      }

      // commentCount 필드가 없으면 0으로 초기화
      if (typeof data.commentCount !== 'number') {
        updates.commentCount = 0;
        needsUpdate = true;
      }

      // updatedAt 필드가 없으면 createdAt과 같은 값으로 설정
      if (!data.updatedAt && data.createdAt) {
        updates.updatedAt = data.createdAt;
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(doc(db, 'posts', docSnapshot.id), updates);
        updateCount++;
        console.log(`게시글 ${docSnapshot.id} 업데이트 예정:`, updates);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount}개의 게시글이 마이그레이션되었습니다.`);
    } else {
      console.log('마이그레이션이 필요한 게시글이 없습니다.');
    }

  } catch (error) {
    console.error('게시글 마이그레이션 중 오류:', error);
    throw new Error('마이그레이션에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
  }
};

/**
 * 특정 게시글의 좋아요 수를 실제 likedBy 배열 길이로 동기화
 */
export const syncLikeCounts = async (): Promise<void> => {
  try {
    console.log('좋아요 수 동기화 시작...');
    
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const likedBy = data.likedBy || [];
      const currentLikeCount = data.likeCount || 0;
      const actualLikeCount = likedBy.length;

      if (currentLikeCount !== actualLikeCount) {
        batch.update(doc(db, 'posts', docSnapshot.id), {
          likeCount: actualLikeCount
        });
        updateCount++;
        console.log(`게시글 ${docSnapshot.id} 좋아요 수 동기화: ${currentLikeCount} -> ${actualLikeCount}`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount}개의 게시글 좋아요 수가 동기화되었습니다.`);
    } else {
      console.log('동기화가 필요한 게시글이 없습니다.');
    }

  } catch (error) {
    console.error('좋아요 수 동기화 중 오류:', error);
    throw new Error('동기화에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
  }
};

/**
 * 전체 데이터베이스 상태 확인
 */
export const checkDatabaseStatus = async (): Promise<{
  totalPosts: number;
  postsWithLikeCount: number;
  postsWithLikedBy: number;
  postsWithCommentCount: number;
  postsNeedingMigration: number;
}> => {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    let postsWithLikeCount = 0;
    let postsWithLikedBy = 0;
    let postsWithCommentCount = 0;
    let postsNeedingMigration = 0;

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      
      if (typeof data.likeCount === 'number') postsWithLikeCount++;
      if (Array.isArray(data.likedBy)) postsWithLikedBy++;
      if (typeof data.commentCount === 'number') postsWithCommentCount++;
      
      // 마이그레이션이 필요한지 확인
      if (
        typeof data.likeCount !== 'number' ||
        !Array.isArray(data.likedBy) ||
        typeof data.commentCount !== 'number'
      ) {
        postsNeedingMigration++;
      }
    });

    return {
      totalPosts: snapshot.docs.length,
      postsWithLikeCount,
      postsWithLikedBy,
      postsWithCommentCount,
      postsNeedingMigration
    };

  } catch (error) {
    console.error('데이터베이스 상태 확인 중 오류:', error);
    throw new Error('상태 확인에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
  }
}; 