import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Users, UserPlus, Check } from 'lucide-react';

export default function UserListModal({ isOpen, onClose, title, users = [], onFollowToggle }) {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title">
            <Users size={20} color="#38bdf8" />
            <span>{title} ({users.length})</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
          {users.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '30px 0' }}>No users found in this list.</p>
          ) : (
            users.map(u => (
              <div 
                key={u.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <Link 
                  to={`/profile/${u.username}`} 
                  onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', flex: 1, overflow: 'hidden' }}
                >
                  <img src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={u.name} className="avatar avatar-sm" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
                      @{u.username}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {u.role_title}
                    </div>
                  </div>
                </Link>

                {user && user.id !== u.id && (
                  <button
                    className={`btn btn-sm ${u.is_followed ? 'btn-secondary' : 'btn-outline'}`}
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={() => onFollowToggle && onFollowToggle(u)}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
