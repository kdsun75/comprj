import React, { useState, useEffect } from 'react';
import CreatePost from '../components/CreatePost';
import PostList from '../components/features/posts/PostList';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Post } from '../components/features/posts/PostList';

const Home: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const { currentUser } = useAuth();

  const fetchPosts = async () => {
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
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
        // author 객체가 항상 붙도록 보장
        return { ...post, author };
      })
    );

    setPosts(postsWithAuthor as Post[]);
  };

  useEffect(() => {
    fetchPosts();
  }, [refresh]);

  const handlePostCreated = async () => {
    setShowCreateForm(false);
    await fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        {currentUser ? (
          <div className="mb-8">
            {showCreateForm ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">새 글 작성</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <CreatePost onPostCreated={handlePostCreated} />
              </div>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                새 글 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">
              게시글을 작성하려면 로그인이 필요합니다.
            </p>
          </div>
        )}
        <PostList posts={posts} loading={false} />
      </div>
    </div>
  );
};

export default Home; 