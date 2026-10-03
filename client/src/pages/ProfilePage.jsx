import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import UserListModal from '../components/UserListModal';
import { 
  UserPlus, 
  Check, 
  Edit3, 
  Briefcase, 
  Calendar, 
  Globe,
  Link2,
  Cpu, 
  Terminal,
  Sparkles,
  X,
  Save
} from 'lucide-react';

export default function ProfilePage({ onOpenCreatePost }) {
  const { username } = useParams();
  const { user: currentUser, token, updateUser, addToast } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // User list modal state
  const [modalType, setModalType] = useState(null); // 'followers' | 'following'
  const [modalUsers, setModalUsers] = useState([]);

  // Edit profile modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    role_title: '',
    company: '',
    bio: '',
    skills: '',
    avatar_url: '',
    github_url: '',
    linkedin_url: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Load profile data
  useEffect(() => {
    setLoading(true);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(`/api/users/${username}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('User not found');
        return res.json();
      })
      .then(data => {
        setProfileUser(data.user);
        setEditForm({
          name: data.user.name || '',
          role_title: data.user.role_title || '',
          company: data.user.company || '',
          bio: data.user.bio || '',
          skills: data.user.skills || '',
          avatar_url: data.user.avatar_url || '',
          github_url: data.user.github_url || '',
          linkedin_url: data.user.linkedin_url || ''
        });

        // Fetch user posts
        return fetch(`/api/posts?userId=${data.user.id}`, { headers });
      })
      .then(res => res.json())
      .then(postData => {
        setUserPosts(postData.posts || []);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [username, token]);

  // Toggle Follow / Unfollow
  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`/api/users/${profileUser.id}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfileUser(prev => ({
        ...prev,
        is_followed: data.following,
        followers_count: data.followers_count
      }));
      addToast(data.message, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Open Followers or Following Modal
  const openUserList = async (type) => {
    setModalType(type);
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/users/${profileUser.id}/${type}`, { headers });
      const data = await res.json();
      setModalUsers(data[type] || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Save profile edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfileUser(prev => ({ ...prev, ...data.user }));
      updateUser(data.user);
      setIsEditing(false);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
        <Sparkles size={32} style={{ animation: 'spin 2s linear infinite' }} />
        <p style={{ marginTop: 12 }}>Loading AI engineer profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="glass-card empty-state">
        <h2>User not found</h2>
        <p>The profile @{username} does not exist in the Synapse AI network.</p>
      </div>
    );
  }

  const isSelf = currentUser && currentUser.id === profileUser.id;

  return (
    <div>
      {/* Profile Card */}
      <div className="glass-card profile-header-card">
        <div className="profile-banner"></div>
        
        <div className="profile-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <img 
                src={profileUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt={profileUser.name} 
                className="avatar avatar-lg"
              />
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
                  {profileUser.name}
                </h1>
                <div style={{ fontSize: '0.92rem', color: '#38bdf8', fontWeight: 600 }}>
                  @{profileUser.username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, color: '#94a3b8', fontSize: '0.86rem' }}>
                  <Briefcase size={14} />
                  <span>{profileUser.role_title} • <strong style={{ color: '#cbd5e1' }}>{profileUser.company}</strong></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {isSelf ? (
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(true)}
                  id="edit-profile-btn"
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  className={`btn btn-sm ${profileUser.is_followed ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleFollowToggle}
                  id="profile-follow-toggle-btn"
                >
                  {profileUser.is_followed ? (
                    <>
                      <Check size={15} />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <p style={{ marginTop: 18, color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 }}>
              {profileUser.bio}
            </p>
          )}

          {/* Skills Badges */}
          {profileUser.skills && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
              {profileUser.skills.split(',').map((skill, idx) => (
                <span key={idx} className="badge-tech">
                  {skill.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Interactive Follower & Post Counters */}
          <div className="profile-stats">
            <div className="stat-item" onClick={() => openUserList('followers')} id="profile-followers-stat">
              <span className="stat-number">{profileUser.followers_count || 0}</span>
              <span>Followers</span>
            </div>
            <div className="stat-item" onClick={() => openUserList('following')} id="profile-following-stat">
              <span className="stat-number">{profileUser.following_count || 0}</span>
              <span>Following</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{profileUser.posts_count || userPosts.length}</span>
              <span>Discussions</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts Feed */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Terminal size={18} color="#38bdf8" />
        <span>Technical Publications & Discussions ({userPosts.length})</span>
      </h3>

      {userPosts.length === 0 ? (
        <div className="glass-card empty-state">
          <Terminal size={32} className="empty-state-icon" />
          <h4>No discussions published yet</h4>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
            {isSelf ? "You haven't posted any AI discussions yet." : `@${profileUser.username} hasn't published discussions yet.`}
          </p>
          {isSelf && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={onOpenCreatePost}>
              Post First Discussion
            </button>
          )}
        </div>
      ) : (
        userPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onPostDeleted={(id) => setUserPosts(prev => prev.filter(p => p.id !== id))}
          />
        ))
      )}

      {/* Followers / Following Modal */}
      <UserListModal
        isOpen={Boolean(modalType)}
        onClose={() => setModalType(null)}
        title={modalType === 'followers' ? 'Followers' : 'Following'}
        users={modalUsers}
        onFollowToggle={async (targetUser) => {
          try {
            const res = await fetch(`/api/users/${targetUser.id}/follow`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setModalUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_followed: data.following } : u));
            addToast(data.message, 'success');
          } catch (err) {
            addToast(err.message, 'error');
          }
        }}
      />

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Edit3 size={20} color="#38bdf8" />
                <span>Edit AI Engineer Profile</span>
              </div>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Role Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.role_title}
                    onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company / Lab</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tech Stack & Skills (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                  placeholder="PyTorch, Transformers, vLLM, MLOps, CUDA"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={savingProfile} className="btn btn-primary">
                  <Save size={15} />
                  <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
