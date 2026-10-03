import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import CreatePostModal from './components/CreatePostModal';
import Toast from './components/Toast';

import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ExplorePage from './pages/ExplorePage';
import BookmarksPage from './pages/BookmarksPage';

function AppContent() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [tagToFilter, setTagToFilter] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOpenCreatePost = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setCreatePostOpen(true);
  };

  const handleSelectTag = (tag) => {
    navigate(`/?tag=${encodeURIComponent(tag)}`);
  };

  const handleSearch = (query) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="app-container">
      <Navbar
        onOpenCreatePost={handleOpenCreatePost}
        onSearch={handleSearch}
      />

      <div className="main-layout">
        <Sidebar onOpenCreatePost={handleOpenCreatePost} />

        <main style={{ minWidth: 0 }}>
          <Routes>
            <Route path="/" element={<FeedPage onOpenCreatePost={handleOpenCreatePost} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/bookmarks" element={<BookmarksPage onOpenCreatePost={handleOpenCreatePost} />} />
            <Route path="/profile/:username" element={<ProfilePage onOpenCreatePost={handleOpenCreatePost} />} />
          </Routes>
        </main>

        <RightSidebar onSelectTag={handleSelectTag} />
      </div>

      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={() => {
          // Trigger feed reload / redirect to top
          if (window.location.pathname === '/') {
            window.location.reload();
          } else {
            navigate('/');
          }
        }}
      />

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
