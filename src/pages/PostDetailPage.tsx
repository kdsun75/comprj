import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { deletePost } from '../services/postService';
import { Trash2, Edit } from 'lucide-react';

interface PostDetail {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    photoURL?: string;
  };
  authorId: string;
  createdAt: string;
  category: string;
  tags: string[];
  imageUrl?: string;
}

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      setLoading(true);
      setError(null);
      try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const data = postSnap.data();
          setPost({
            id: postSnap.id,
            title: data.title || '',
            content: data.content || '',
            author: {
              name: data.authorName || '익명',
              photoURL: data.authorPhotoURL,
            },
            authorId: data.authorId || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : '',
            category: data.category || '',
            tags: data.tags || [],
            imageUrl: data.imageUrl,
          });
        } else {
          setError('게시글을 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleEdit = () => {
    if (post) navigate(`/edit-post/${post.id}`);
  };

  const handleDelete = async () => {
    if (!post) return;
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    try {
      await deletePost(post.id);
      alert('게시글이 삭제되었습니다.');
      navigate('/');
    } catch (err) {
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="py-12 text-center">로딩 중...</div>;
  if (error) return <div className="py-12 text-center text-red-500">{error}</div>;
  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:underline">← 뒤로가기</button>
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{post.title}</h1>
      <div className="text-gray-500 text-sm mb-4 dark:text-gray-300">{new Date(post.createdAt).toLocaleString()}</div>
      <div className="mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-200">
        <span className="font-medium">작성자:</span> {post.author.name}
        {currentUser && post.authorId && currentUser.uid === post.authorId && (
          <>
            <button onClick={handleEdit} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 text-sm">
              <Edit size={16} /> 수정
            </button>
            <button onClick={handleDelete} className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1 text-sm">
              <Trash2 size={16} /> 삭제
            </button>
          </>
        )}
      </div>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="게시글 이미지" className="mb-4 rounded-lg max-h-96 object-contain" />
      )}
      <div className="prose max-w-none mb-4 dark:prose-invert text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: post.content }} />
      <div className="flex flex-wrap gap-2 mt-4">
        {post.tags.map((tag, idx) => (
          <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">#{tag}</span>
        ))}
      </div>
    </div>
  );
};

export default PostDetailPage; 