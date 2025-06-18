import React, { useState } from 'react';
import Header from './Header';
import Modal from '../Modal';
import CreatePost from '../CreatePost';
import { usePost } from '../../contexts/PostContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { refreshPosts } = usePost();

  const handleWriteClick = () => {
    setIsPostModalOpen(true);
  };

  const handleClosePostModal = async () => {
    setIsPostModalOpen(false);
  };

  const handlePostCreated = async () => {
    setIsPostModalOpen(false);
    refreshPosts(); // 새 글 작성 후 게시글 목록 새로고침 트리거
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header onWriteClick={handleWriteClick} />
      
      {/* Main Content */}
      <main className="w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      <Modal isOpen={isPostModalOpen} onClose={handleClosePostModal}>
        <CreatePost onPostCreated={handlePostCreated} onCancel={handleClosePostModal} />
      </Modal>
    </div>
  );
};

export default Layout; 