import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { Flame, Users, Sparkles, Filter, Terminal, Search, X } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Reasoning & LLMs',
  'MLOps & Infrastructure',
  'Autonomous Agents',
  'Computer Vision',
  'Generative AI',
  'Open Source AI'
];

export default function FeedPage({ onOpenCreatePost }) {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeFeed = searchParams.get('feed') || 'for-you';
  const activeCategory = searchParams.get('category') || 'All';
  const activeTag = searchParams.get('tag') || '';
  const searchQuery = searchParams.get('search') || '';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts whenever filters change
  useEffect(() => {
    setLoading(true);

    const query = new URLSearchParams();
    if (activeFeed !== 'for-you') query.set('feed', activeFeed);
    if (activeCategory !== 'All') query.set('category', activeCategory);
    if (activeTag) query.set('tag', activeTag);
    if (searchQuery) query.set('search', searchQuery);

    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(`/api/posts?${query.toString()}`, { headers })
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || []);
      })
      .catch(err => {
        console.error('Fetch posts error:', err);
      })
      .finally(() => setLoading(false));
  }, [activeFeed, activeCategory, activeTag, searchQuery, token]);

  const setFeedTab = (feedType) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('feed', feedType);
    setSearchParams(newParams);
  };

  const setCategoryFilter = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') newParams.delete('category');
    else newParams.set('category', cat);
    setSearchParams(newParams);
  };

  const clearTag = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    setSearchParams(newParams);
  };

  const clearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
  };

  const handlePostDeleted = (deletedId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedId));
  };

  return (
    <div>
      {/* Search / Tag Banner if active */}
      {(activeTag || searchQuery) && (
        <div className="glass-card" style={{ padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(56, 189, 248, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTag && (
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#38bdf8' }}>
                Showing posts tagged with <strong>#{activeTag}</strong>
              </span>
            )}
            {searchQuery && (
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#38bdf8' }}>
                Search results for <strong>"{searchQuery}"</strong>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              if (activeTag) clearTag();
              if (searchQuery) clearSearch();
            }}
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 8px', fontSize: '0.76rem' }}
          >
            <X size={13} />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Quick Post Box for Logged In User */}
      {user && (
        <div className="glass-card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={user.name} className="avatar avatar-sm" />
            <button
              onClick={onOpenCreatePost}
              style={{
                flex: 1,
                textAlign: 'left',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: '10px 18px',
                color: '#94a3b8',
                fontSize: '0.92rem',
                cursor: 'pointer'
              }}
              id="feed-quick-post-prompt"
            >
              Share an AI breakthrough, LLM benchmark, or PyTorch code snippet...
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={onOpenCreatePost}
              style={{ padding: '8px 14px' }}
            >
              <Terminal size={15} />
              <span>Post</span>
            </button>
          </div>
        </div>
      )}

      {/* Feed Filter Navigation Tabs */}
      <div className="feed-tabs">
        <button
          className={`feed-tab ${activeFeed === 'for-you' ? 'active' : ''}`}
          onClick={() => setFeedTab('for-you')}
          id="tab-for-you"
        >
          <Sparkles size={16} />
          <span>For You</span>
        </button>

        <button
          className={`feed-tab ${activeFeed === 'following' ? 'active' : ''}`}
          onClick={() => setFeedTab('following')}
          id="tab-following"
        >
          <Users size={16} />
          <span>Following</span>
        </button>

        <button
          className={`feed-tab ${activeFeed === 'trending' ? 'active' : ''}`}
          onClick={() => setFeedTab('trending')}
          id="tab-trending"
        >
          <Flame size={16} />
          <span>Trending Topics</span>
        </button>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className="btn btn-sm"
            style={{
              padding: '4px 12px',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-full)',
              background: (activeCategory === cat || (cat === 'All' && !searchParams.get('category')))
                ? 'rgba(56, 189, 248, 0.2)' 
                : 'rgba(255,255,255,0.04)',
              color: (activeCategory === cat || (cat === 'All' && !searchParams.get('category')))
                ? '#38bdf8' 
                : '#94a3b8',
              border: (activeCategory === cat || (cat === 'All' && !searchParams.get('category')))
                ? '1px solid rgba(56, 189, 248, 0.4)' 
                : '1px solid rgba(255,255,255,0.06)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <Sparkles size={32} className="empty-state-icon" style={{ animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: 12 }}>Loading technical discussions...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card empty-state">
          <Terminal size={36} className="empty-state-icon" />
          <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: 6 }}>No discussions found</h3>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: 420, margin: '0 auto 18px' }}>
            {activeFeed === 'following'
              ? "You haven't followed any AI engineers yet. Check the 'Who to follow' sidebar to connect with researchers!"
              : "No discussions match your filter criteria. Be the first to start a conversation!"}
          </p>
          {user && (
            <button className="btn btn-primary" onClick={onOpenCreatePost}>
              Start a Discussion
            </button>
          )}
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onPostDeleted={handlePostDeleted}
            onSelectTag={(tag) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('tag', tag);
              setSearchParams(newParams);
            }}
          />
        ))
      )}
    </div>
  );
}
