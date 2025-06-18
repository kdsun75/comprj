import React, { createContext, useContext, useState, useCallback } from 'react';

interface PostContextType {
  refreshPosts: () => void;
  shouldRefresh: boolean;
  setShouldRefresh: (value: boolean) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const refreshPosts = useCallback(() => {
    setShouldRefresh(true);
  }, []);

  const value = {
    refreshPosts,
    shouldRefresh,
    setShouldRefresh,
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};

export default PostContext; 