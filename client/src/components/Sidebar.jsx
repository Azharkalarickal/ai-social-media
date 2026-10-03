import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, Bookmark, User, Plus, Terminal, Sparkles } from 'lucide-react';

export default function Sidebar({ onOpenCreatePost }) {
  const { user } = useAuth();

  return (
    <aside className="left-sidebar">
      <div>
        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="sidebar-feed-link"
          >
            <div className="nav-link-icon"><Home size={20} /></div>
            <span>Tech Feed</span>
          </NavLink>

          <NavLink 
            to="/explore" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            id="sidebar-explore-link"
          >
            <div className="nav-link-icon"><Compass size={20} /></div>
            <span>Explore AI Topics</span>
          </NavLink>

          {user && (
            <>
              <NavLink 
                to="/bookmarks" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="sidebar-bookmarks-link"
              >
                <div className="nav-link-icon"><Bookmark size={20} /></div>
                <span>Saved Snippets</span>
              </NavLink>

              <NavLink 
                to={`/profile/${user.username}`} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                id="sidebar-profile-link"
              >
                <div className="nav-link-icon"><User size={20} /></div>
                <span>My Profile</span>
              </NavLink>
            </>
          )}
        </nav>

        {user && (
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 20 }}
            onClick={onOpenCreatePost}
            id="sidebar-post-btn"
          >
            <Terminal size={18} />
            <span>Post AI Discussion</span>
          </button>
        )}
      </div>

      {/* User Micro Profile Card */}
      {user ? (
        <div className="glass-card" style={{ padding: 14, marginTop: 'auto' }}>
          <Link 
            to={`/profile/${user.username}`} 
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}
          >
            <img 
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={user.name} 
              className="avatar avatar-sm" 
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                @{user.username}
              </div>
            </div>
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.76rem', color: '#94a3b8' }}>
            <span><strong>{user.followers_count || 0}</strong> Followers</span>
            <span><strong>{user.following_count || 0}</strong> Following</span>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
          <Sparkles size={24} color="#38bdf8" style={{ marginBottom: 6 }} />
          <h4 style={{ fontSize: '0.92rem', marginBottom: 6 }}>Join IT & AI Leaders</h4>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 12 }}>
            Share benchmarks, architecture insights, and code snippets.
          </p>
          <Link to="/login?tab=register" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
            Sign Up Free
          </Link>
        </div>
      )}
    </aside>
  );
}
