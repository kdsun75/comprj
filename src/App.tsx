import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostContext';
import { ThemeProvider } from './contexts/ThemeContext';

import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import EditorTestPage from './pages/EditorTestPage';
import SurveyPage from './pages/SurveyPage';
import EditPostPage from './pages/EditPostPage';
import PostDetailPage from './pages/PostDetailPage';

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <PostProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUp />} />

              <Route path="/" element={<PrivateRoute><Layout><HomePage /></Layout></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
              <Route path="/editor-test" element={<PrivateRoute><Layout><EditorTestPage /></Layout></PrivateRoute>} />
              <Route path="/survey" element={<PrivateRoute><Layout><SurveyPage /></Layout></PrivateRoute>} />
              <Route path="/edit-post/:postId" element={<PrivateRoute><Layout><EditPostPage /></Layout></PrivateRoute>} />
              <Route path="/post/:postId" element={<PrivateRoute><Layout><PostDetailPage /></Layout></PrivateRoute>} />
            </Routes>
          </PostProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
