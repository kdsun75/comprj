import React from 'react';
import { deleteAllPostsAndFiles } from '../lib/deleteAllPostsAndFiles';

const AdminDeleteButton: React.FC = () => {
  const handleDelete = async () => {
    if (window.confirm('정말로 모든 게시글과 관련 파일을 삭제하시겠습니까?')) {
      try {
        await deleteAllPostsAndFiles();
      } catch (error) {
        console.error('삭제 중 오류 발생:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        padding: '10px 20px',
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      모든 게시글 삭제 (관리자용)
    </button>
  );
};

export default AdminDeleteButton;
