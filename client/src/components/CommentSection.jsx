import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, Code, CornerDownRight } from 'lucide-react';

export default function CommentSection({ postId, comments = [], onCommentAdded }) {
  const { user, token, addToast } = useAuth();
  const [content, setContent] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!user) {
      addToast('Please log in to participate in the discussion.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          code_snippet: showCodeInput && codeSnippet.trim() ? codeSnippet : null,
          code_language: codeLanguage
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setContent('');
      setCodeSnippet('');
      setShowCodeInput(false);
      if (onCommentAdded) {
        onCommentAdded(data.comment, data.comments_count);
      }
      addToast('Comment posted to discussion.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Existing Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {comments.length === 0 ? (
          <p style={{ fontSize: '0.84rem', color: '#64748b', fontStyle: 'italic' }}>
            No comments yet. Be the first AI engineer to share insights!
          </p>
        ) : (
          comments.map(c => (
            <div 
              key={c.id} 
              style={{
                background: 'rgba(11, 17, 32, 0.7)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Link 
                  to={`/profile/${c.author_username}`} 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}
                >
                  <img src={c.author_avatar} alt={c.author_name} className="avatar avatar-sm" style={{ width: 26, height: 26 }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc' }}>{c.author_name}</span>
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8', marginLeft: 6 }}>@{c.author_username}</span>
                  </div>
                </Link>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {c.content}
              </div>

              {c.code_snippet && (
                <div className="code-block-wrapper" style={{ margin: '8px 0 4px' }}>
                  <div className="code-header" style={{ padding: '4px 10px' }}>
                    <span className="code-lang-tag" style={{ fontSize: '0.72rem' }}>{c.code_language || 'python'}</span>
                  </div>
                  <pre className="code-content" style={{ fontSize: '0.8rem', padding: 10 }}>
                    {c.code_snippet}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input Form */}
      {user ? (
        <form onSubmit={handleSubmitComment}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <img 
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={user.name} 
              className="avatar avatar-sm" 
              style={{ width: 34, height: 34, marginTop: 4 }}
            />
            <div style={{ flex: 1 }}>
              <textarea
                className="form-input"
                placeholder="Share your technical analysis, benchmark question, or feedback..."
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ resize: 'vertical', fontSize: '0.88rem', minHeight: 60 }}
              />

              {showCodeInput && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <select 
                      className="form-select" 
                      style={{ width: 140, padding: '4px 8px', fontSize: '0.78rem' }}
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                    >
                      <option value="python">Python</option>
                      <option value="bash">Bash / CLI</option>
                      <option value="javascript">JavaScript</option>
                      <option value="sql">SQL</option>
                      <option value="rust">Rust</option>
                      <option value="cpp">C++ / CUDA</option>
                    </select>
                  </div>
                  <textarea
                    className="form-textarea code-area"
                    placeholder="// Paste code snippet or model config..."
                    rows={4}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    style={{ fontSize: '0.82rem', minHeight: 80 }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCodeInput(!showCodeInput)}
                  className={`btn btn-sm ${showCodeInput ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  <Code size={13} />
                  <span>{showCodeInput ? 'Hide Code' : 'Attach Code'}</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '6px 14px' }}
                >
                  <Send size={14} />
                  <span>{submitting ? 'Posting...' : 'Reply'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
          <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
            <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>Log in</Link> to join this AI technical discussion.
          </span>
        </div>
      )}
    </div>
  );
}
