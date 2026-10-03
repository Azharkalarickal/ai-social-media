import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flame, Users, Database, Sparkles, UserPlus, Check, ExternalLink } from 'lucide-react';

export default function RightSidebar({ onSelectTag }) {
  const { user, token, addToast } = useAuth();
  const [trendingTags, setTrendingTags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [dbStatus, setDbStatus] = useState('Checking...');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch trending tags
    fetch('/api/tags/trending')
      .then(res => res.json())
      .then(data => setTrendingTags(data.tags || []))
      .catch(err => console.error(err));

    // Fetch suggested users
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch('/api/users/suggested', { headers })
      .then(res => res.json())
      .then(data => setSuggestedUsers(data.users || []))
      .catch(err => console.error(err));

    // Health / Database check
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setDbStatus(data.database?.status === 'connected' ? 'Hostinger Active' : 'Hostinger Sync');
      })
      .catch(() => setDbStatus('Active'));
  }, [token]);

  const handleFollowToggle = async (targetUser) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`/api/users/${targetUser.id}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuggestedUsers(prev => prev.map(u => {
        if (u.id === targetUser.id) {
          return {
            ...u,
            is_followed: data.following,
            followers_count: data.followers_count
          };
        }
        return u;
      }));

      addToast(data.message, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <aside className="right-sidebar">
      {/* Hostinger DB Status Card */}
      <div className="glass-card" style={{ padding: 14, marginBottom: 18, background: 'rgba(12, 19, 36, 0.75)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>Hostinger MySQL</span>
          </div>
          <span style={{ 
            fontSize: '0.72rem', 
            padding: '2px 8px', 
            borderRadius: 999, 
            background: 'rgba(16, 185, 129, 0.15)', 
            color: '#34d399', 
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span>
            {dbStatus}
          </span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 6 }}>
          Database: <code style={{ color: '#38bdf8' }}>u918480384_aisocialmedia</code>
        </div>
      </div>

      {/* Trending Topics & Tags */}
      <div className="glass-card" style={{ marginBottom: 18 }}>
        <div className="widget-title">
          <Flame size={18} color="#f59e0b" />
          <span>Trending AI Topics</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {trendingTags.slice(0, 7).map(tagItem => (
            <div 
              key={tagItem.tag} 
              className="trending-item"
              onClick={() => {
                if (onSelectTag) onSelectTag(tagItem.tag);
                else navigate(`/?tag=${encodeURIComponent(tagItem.tag)}`);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  #{tagItem.tag}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {tagItem.post_count} discussions
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested AI Leaders & Engineers */}
      <div className="glass-card">
        <div className="widget-title">
          <Users size={18} color="#38bdf8" />
          <span>Who to Follow</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suggestedUsers.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No other users yet.</p>
          ) : (
            suggestedUsers.map(sUser => (
              <div key={sUser.id} className="suggested-user-card">
                <Link 
                  to={`/profile/${sUser.username}`} 
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', flex: 1, overflow: 'hidden' }}
                >
                  <img src={sUser.avatar_url} alt={sUser.name} className="avatar avatar-sm" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {sUser.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                      @{sUser.username}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {sUser.role_title}
                    </div>
                  </div>
                </Link>

                <button
                  className={`btn btn-sm ${sUser.is_followed ? 'btn-secondary' : 'btn-outline'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => handleFollowToggle(sUser)}
                >
                  {sUser.is_followed ? (
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
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
