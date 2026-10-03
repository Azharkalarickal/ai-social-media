import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Search, PlusCircle, LogIn, UserPlus, LogOut, User, Sparkles, Database } from 'lucide-react';

export default function Navbar({ onOpenCreatePost, onSearch, initialSearchQuery = '' }) {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="brand">
          <div className="brand-icon">
            <Cpu size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span>Synapse<span style={{ color: '#38bdf8' }}>AI</span></span>
          </div>
          <span className="brand-badge">Tech Network</span>
        </Link>

        {/* Search Bar */}
        <form className="nav-search" onSubmit={handleSearchSubmit}>
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search AI models, papers, code snippets, engineers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Action Buttons */}
        <div className="nav-actions">
          {user ? (
            <>
              <button 
                className="btn btn-primary btn-sm"
                onClick={onOpenCreatePost}
                id="navbar-create-post-btn"
              >
                <PlusCircle size={16} />
                <span>New Discussion</span>
              </button>

              {/* User Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  id="user-profile-dropdown-trigger"
                >
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={user.name}
                    className="avatar avatar-sm"
                  />
                </button>

                {dropdownOpen && (
                  <div 
                    className="glass-card" 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 48,
                      width: 220,
                      padding: 12,
                      zIndex: 150,
                      boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                      border: '1px solid rgba(56, 189, 248, 0.3)'
                    }}
                  >
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>{user.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>@{user.username}</div>
                    </div>

                    <Link 
                      to={`/profile/${user.username}`} 
                      className="nav-link" 
                      style={{ padding: '8px 10px', fontSize: '0.88rem' }}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={15} />
                      <span>My AI Profile</span>
                    </Link>

                    <Link 
                      to="/bookmarks" 
                      className="nav-link" 
                      style={{ padding: '8px 10px', fontSize: '0.88rem' }}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Sparkles size={15} />
                      <span>Saved Discussions</span>
                    </Link>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8, paddingTop: 6 }}>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="nav-link"
                        style={{ width: '100%', padding: '8px 10px', fontSize: '0.88rem', color: '#fca5a5' }}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn btn-secondary btn-sm" id="nav-login-btn">
                <LogIn size={15} />
                <span>Log In</span>
              </Link>
              <Link to="/login?tab=register" className="btn btn-primary btn-sm" id="nav-register-btn">
                <UserPlus size={15} />
                <span>Join Network</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
