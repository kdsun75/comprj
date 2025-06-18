import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  createdAt: any;
  likeCount: number;
  commentCount: number;
  author: { name: string; avatar?: string };
}

const PostList: React.FC<{ refresh?: boolean }> = ({ refresh }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'ai', name: 'AI' },
    { id: 'programming', name: '프로그래밍' },
    { id: 'study', name: '학습' },
    { id: 'project', name: '프로젝트' },
  ];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, refresh]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      
      if (selectedCategory !== 'all') {
        q = query(
          collection(db, 'posts'),
          where('tags', 'array-contains', selectedCategory),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // author 정보 병합
      const postsWithAuthor = await Promise.all(
        postsData.map(async (post: any) => {
          let author = { name: '알 수 없음', avatar: undefined };
          if (post.authorId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', post.authorId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                author = {
                  name: userData.displayName || '알 수 없음',
                  avatar: userData.photoURL
                };
              }
            } catch {}
          }
          return { ...post, author };
        })
      );

      setPosts(postsWithAuthor);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Categories */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-4">로딩 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          {selectedCategory === 'all' ? '게시글이 없습니다.' : '해당 카테고리의 게시글이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex space-x-4">
                  <span>좋아요 {post.likeCount}</span>
                  <span>댓글 {post.commentCount}</span>
                </div>
                <div className="flex space-x-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList; 