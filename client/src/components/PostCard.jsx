import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Copy, 
  Check, 
  Trash2, 
  UserPlus, 
  CheckCircle,
  ExternalLink,
  Tag
} from 'lucide-react';
import CommentSection from './CommentSection';

export default function PostCard({ post, onPostDeleted, onSelectTag }) {
  const { user, token, addToast } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(post.is_author_followed);
  const [loadingComments, setLoadingComments] = useState(false);

  // Toggle Like
  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch (err) {
      // Revert
      setLiked(!nextLiked);
      setLikesCount(prev => !nextLiked ? prev + 1 : Math.max(0, prev - 1));
      addToast(err.message, 'error');
    }
  };

  // Toggle Bookmark
  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookmarked(data.bookmarked);
      addToast(data.message, 'success');
    } catch (err) {
      setBookmarked(!nextBookmarked);
      addToast(err.message, 'error');
    }
  };

  // Toggle Comments View & Fetch if not loaded
  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0 && commentsCount > 0) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${post.id}`);
        const data = await res.json();
        if (data.post && data.post.comments) {
          setComments(data.post.comments);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  // Add Comment Handler
  const handleCommentAdded = (newComment, newCount) => {
    setComments(prev => [...prev, newComment]);
    setCommentsCount(newCount);
  };

  // Copy Code to Clipboard
  const handleCopyCode = () => {
    if (!post.code_snippet) return;
    navigator.clipboard.writeText(post.code_snippet);
    setCopiedCode(true);
    addToast('Code snippet copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Share Post
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    addToast('Post link copied to clipboard! 📋', 'success');
  };

  // Follow Author shortcut
  const handleFollowAuthor = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`/api/users/${post.user_id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsFollowingAuthor(data.following);
      addToast(data.message, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this technical discussion?')) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast('Post deleted successfully.', 'info');
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const isOwner = user && user.id === post.user_id;

  return (
    <article className="glass-card post-card" id={`post-${post.id}`}>
      {/* Header */}
      <div className="post-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to={`/profile/${post.author_username}`}>
            <img 
              src={post.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={post.author_name} 
              className="avatar" 
            />
          </Link>
          <div className="author-names">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to={`/profile/${post.author_username}`} style={{ textDecoration: 'none' }} className="author-name">
                {post.author_name}
              </Link>
              <span className="author-company">@{post.author_username}</span>
              {user && user.id !== post.user_id && !isFollowingAuthor && (
                <button
                  onClick={handleFollowAuthor}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <UserPlus size={11} />
                  <span>Follow</span>
                </button>
              )}
            </div>
            <div className="author-role">{post.author_role} • <span style={{ color: '#94a3b8' }}>{post.author_company}</span></div>
            <div className="post-time">{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="post-category-badge">{post.category || 'Generative AI'}</span>
          {isOwner && (
            <button
              onClick={handleDeletePost}
              className="action-btn"
              style={{ padding: 4, color: '#ef4444' }}
              title="Delete Post"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Content Text */}
      <div className="post-content">
        {post.content}
      </div>

      {/* Code Snippet Block */}
      {post.code_snippet && (
        <div className="code-block-wrapper">
          <div className="code-header">
            <span className="code-lang-tag">{post.code_language || 'python'}</span>
            <button className="copy-btn" onClick={handleCopyCode}>
              {copiedCode ? (
                <>
                  <Check size={13} color="#38bdf8" />
                  <span style={{ color: '#38bdf8' }}>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="code-content">
            <code>{post.code_snippet}</code>
          </pre>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="tags-container">
          {post.tags.map(t => (
            <span 
              key={t} 
              className="tag-badge"
              onClick={() => {
                if (onSelectTag) onSelectTag(t);
                else navigate(`/?tag=${encodeURIComponent(t)}`);
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="post-footer">
        <div className="action-btn-group">
          {/* Like */}
          <button 
            className={`action-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            id={`like-btn-${post.id}`}
          >
            <Heart size={18} />
            <span>{likesCount}</span>
          </button>

          {/* Comment */}
          <button 
            className="action-btn"
            onClick={handleToggleComments}
            id={`comment-btn-${post.id}`}
          >
            <MessageSquare size={18} />
            <span>{commentsCount}</span>
          </button>

          {/* Bookmark */}
          <button 
            className={`action-btn ${bookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmark}
            id={`bookmark-btn-${post.id}`}
          >
            <Bookmark size={18} />
          </button>
        </div>

        <div className="action-btn-group">
          {/* Share */}
          <button className="action-btn" onClick={handleShare} title="Share Discussion">
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Expanded Comments */}
      {showComments && (
        <CommentSection
          postId={post.id}
          comments={comments}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </article>
  );
}
