import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CommunityStats {
  totalPosts: number;
  activeUsers: number;
  todayPosts: number;
  totalComments: number;
  totalLikes: number;
  onlineUsers: number;
}

export interface DailyActivity {
  newPosts: number;
  comments: number;
  likes: number;
}

// 전체 통계 가져오기
export const getCommunityStats = async (): Promise<CommunityStats> => {
  try {
    // 전체 게시글 수
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    const totalPosts = postsSnapshot.size;

    // 전체 사용자 수 (활성 사용자로 간주)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const activeUsers = usersSnapshot.size;

    // 오늘 작성된 게시글 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const todayPostsQuery = query(
      collection(db, 'posts'),
      where('createdAt', '>=', todayTimestamp)
    );
    const todayPostsSnapshot = await getDocs(todayPostsQuery);
    const todayPosts = todayPostsSnapshot.size;

    // 전체 댓글 수 계산
    let totalComments = 0;
    postsSnapshot.forEach(doc => {
      const data = doc.data();
      totalComments += data.commentCount || 0;
    });

    // 전체 좋아요 수 계산
    let totalLikes = 0;
    postsSnapshot.forEach(doc => {
      const data = doc.data();
      totalLikes += data.likeCount || 0;
    });

    // 온라인 사용자 수 (최근 1시간 내 활동한 사용자)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneHourAgoTimestamp = Timestamp.fromDate(oneHourAgo);
    
    const onlineUsersQuery = query(
      collection(db, 'users'),
      where('lastActive', '>=', oneHourAgoTimestamp)
    );
    const onlineUsersSnapshot = await getDocs(onlineUsersQuery);
    const onlineUsers = onlineUsersSnapshot.size;

    return {
      totalPosts,
      activeUsers,
      todayPosts,
      totalComments,
      totalLikes,
      onlineUsers
    };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return {
      totalPosts: 0,
      activeUsers: 0,
      todayPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      onlineUsers: 0
    };
  }
};

// 오늘의 활동 통계 가져오기 (사이드바용)
export const getDailyActivity = async (): Promise<DailyActivity> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    // 오늘 작성된 게시글
    const todayPostsQuery = query(
      collection(db, 'posts'),
      where('createdAt', '>=', todayTimestamp)
    );
    const todayPostsSnapshot = await getDocs(todayPostsQuery);
    const newPosts = todayPostsSnapshot.size;

    // 오늘 작성된 댓글과 좋아요 수 계산
    let comments = 0;
    let likes = 0;
    
    todayPostsSnapshot.forEach(doc => {
      const data = doc.data();
      comments += data.commentCount || 0;
      likes += data.likeCount || 0;
    });

    return {
      newPosts,
      comments,
      likes
    };
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    return {
      newPosts: 0,
      comments: 0,
      likes: 0
    };
  }
};

// 커뮤니티 카테고리별 게시글 수 가져오기
export const getCategoryStats = async () => {
  try {
    const postsSnapshot = await getDocs(collection(db, 'posts'));
    const categoryStats: { [key: string]: number } = {
      'AI 뉴스': 0,
      '머신러닝': 0,
      '딥러닝': 0,
      '데이터 분석': 0,
      '개발도구': 0
    };

    postsSnapshot.forEach(doc => {
      const data = doc.data();
      const tags = data.tags || [];
      
      tags.forEach((tag: string) => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes('ai') || tagLower.includes('뉴스')) {
          categoryStats['AI 뉴스']++;
        } else if (tagLower.includes('머신러닝') || tagLower.includes('machine learning')) {
          categoryStats['머신러닝']++;
        } else if (tagLower.includes('딥러닝') || tagLower.includes('deep learning')) {
          categoryStats['딥러닝']++;
        } else if (tagLower.includes('데이터') || tagLower.includes('분석')) {
          categoryStats['데이터 분석']++;
        } else if (tagLower.includes('개발') || tagLower.includes('도구')) {
          categoryStats['개발도구']++;
        }
      });
    });

    return categoryStats;
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return {
      'AI 뉴스': 0,
      '머신러닝': 0,
      '딥러닝': 0,
      '데이터 분석': 0,
      '개발도구': 0
    };
  }
}; 