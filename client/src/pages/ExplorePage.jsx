import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Search, Users, Flame, UserPlus, Check, Sparkles } from 'lucide-react';

export default function ExplorePage() {
  const { user, token, addToast } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load trending tags
    fetch('/api/tags/trending')
      .then(res => res.json())
      .then(data => setTrendingTags(data.tags || []))
      .catch(console.error);

    // Initial popular users
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/users/suggested', { headers })
      .then(res => res.json())
      .then(data => setSearchResults(data.users || []))
      .catch(console.error);
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, { headers })
      .then(res => res.json())
      .then(data => {
        setSearchResults(data.users || []);
      })
      .catch(err => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  const handleFollowToggle = async (targetUser) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`/api/users/${targetUser.id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSearchResults(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_followed: data.following } : u));
      addToast(data.message, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: 24, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, rgba(14, 23, 42, 0.8) 0%, rgba(26, 38, 68, 0.8) 100%)' }}>
        <Compass size={36} color="#38bdf8" style={{ marginBottom: 10 }} />
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>
          Explore AI & IT Pioneers
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', maxWidth: 500, margin: '0 auto 20px' }}>
          Connect with researchers, ML engineers, and infrastructure architects building state-of-the-art AI.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ maxWidth: 500, margin: '0 auto', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by skill (PyTorch, CUDA), role, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 18px' }}>
            Find
          </button>
        </form>
      </div>

      {/* Trending Topics Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flame size={18} color="#f59e0b" />
        <span>Hot Topics & Research Tags</span>
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {trendingTags.map(t => (
          <Link
            key={t.tag}
            to={`/?tag=${encodeURIComponent(t.tag)}`}
            className="tag-badge"
            style={{ padding: '6px 14px', fontSize: '0.88rem' }}
          >
            #{t.tag} <span style={{ opacity: 0.7, fontSize: '0.78rem' }}>({t.post_count})</span>
          </Link>
        ))}
      </div>

      {/* AI Engineers List */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={18} color="#38bdf8" />
        <span>Featured AI & IT Engineers</span>
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          <Sparkles size={24} style={{ animation: 'spin 2s linear infinite' }} />
        </div>
      ) : searchResults.length === 0 ? (
        <div className="glass-card empty-state">
          <p>No professionals matched your search query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {searchResults.map(u => (
            <div key={u.id} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <img src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={u.name} className="avatar" />
                  <div style={{ overflow: 'hidden' }}>
                    <Link to={`/profile/${u.username}`} style={{ textDecoration: 'none', color: '#f8fafc', fontWeight: 700, fontSize: '0.98rem' }}>
                      {u.name}
                    </Link>
                    <div style={{ fontSize: '0.76rem', color: '#38bdf8' }}>@{u.username}</div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {u.role_title}
                    </div>
                  </div>
                </div>

                {u.bio && (
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {u.bio}
                  </p>
                )}

                {u.skills && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                    {u.skills.split(',').slice(0, 3).map((s, idx) => (
                      <span key={idx} className="badge-tech" style={{ fontSize: '0.7rem' }}>{s.trim()}</span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  <strong>{u.followers_count || 0}</strong> followers
                </span>

                {user && user.id !== u.id && (
                  <button
                    className={`btn btn-sm ${u.is_followed ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                    onClick={() => handleFollowToggle(u)}
                  >
                    {u.is_followed ? (
                      <>
                        <Check size={12} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={12} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
