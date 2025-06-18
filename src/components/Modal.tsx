import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg relative w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-2xl bg-transparent hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="닫기"
          >
            ×
          </button>
          <h2 className="text-xl font-semibold">새 게시물 작성</h2>
        </div>
        <div className="flex-grow overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 