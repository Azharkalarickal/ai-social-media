import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { Bookmark, Sparkles, Terminal } from 'lucide-react';

export default function BookmarksPage({ onOpenCreatePost }) {
  const { user, token } = useAuth();
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    fetch('/api/posts/bookmarked', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setBookmarkedPosts(data.posts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, navigate]);

  return (
    <div>
      <div className="glass-card" style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
          <Bookmark size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            Saved Snippets & Research ({bookmarkedPosts.length})
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.86rem' }}>
            Your curated collection of model architectures, benchmark discussions, and scripts.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <Sparkles size={30} style={{ animation: 'spin 2s linear infinite' }} />
        </div>
      ) : bookmarkedPosts.length === 0 ? (
        <div className="glass-card empty-state">
          <Terminal size={36} className="empty-state-icon" />
          <h3>No saved discussions</h3>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: 400, margin: '8px auto 16px' }}>
            Save insightful AI papers, PyTorch snippets, and architecture designs using the bookmark icon on any post.
          </p>
        </div>
      ) : (
        bookmarkedPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onPostDeleted={(id) => setBookmarkedPosts(prev => prev.filter(p => p.id !== id))}
          />
        ))
      )}
    </div>
  );
}
