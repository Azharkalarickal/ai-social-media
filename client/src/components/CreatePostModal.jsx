import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Code, Tag, Sparkles, Send, Terminal, Link2, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  'Reasoning & LLMs',
  'MLOps & Infrastructure',
  'Autonomous Agents',
  'Computer Vision',
  'Generative AI',
  'AI Safety & Alignment',
  'Open Source AI'
];

const SUGGESTED_TAGS = [
  'DeepSeek-R1', 'LLMs', 'Reasoning', 'vLLM', 'LangGraph', 'PyTorch', 'CUDA', 'MLOps', 'Agents', '3DGS', 'GraphRAG'
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user, token, addToast } = useAuth();
  
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Reasoning & LLMs');
  const [showCode, setShowCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedTags, setSelectedTags] = useState(['LLMs']);
  const [mediaUrl, setMediaUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast('Please enter technical discussion content.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Process manual tag input if any
      let finalTags = [...selectedTags];
      if (tagsInput.trim()) {
        const manual = tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
        finalTags = Array.from(new Set([...finalTags, ...manual]));
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          category,
          code_snippet: showCode && codeSnippet.trim() ? codeSnippet.trim() : null,
          code_language: codeLanguage,
          tags: finalTags,
          media_url: mediaUrl.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err) {}

      addToast('🚀 Discussion published to AI feed!', 'success');
      if (onPostCreated) {
        onPostCreated(data.post);
      }
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={22} color="#38bdf8" />
            <span>Create AI Tech Discussion</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          {/* Category Select */}
          <div className="form-group">
            <label className="form-label">Domain / Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Main Content */}
          <div className="form-group">
            <label className="form-label">Discussion Content & Technical Insight</label>
            <textarea
              className="form-textarea"
              placeholder="What architecture breakthroughs, benchmarks, scaling laws, or IT challenges are you exploring today?"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Code Snippet Attachment Toggle */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Code Block & PyTorch / Script Snippet</label>
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className={`btn btn-sm ${showCode ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 10px', fontSize: '0.78rem' }}
              >
                <Code size={13} />
                <span>{showCode ? 'Remove Code Snippet' : 'Attach Code Snippet'}</span>
              </button>
            </div>

            {showCode && (
              <div style={{ background: '#090d16', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Language:</span>
                  <select
                    className="form-select"
                    style={{ width: 160, padding: '4px 8px', fontSize: '0.8rem' }}
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                  >
                    <option value="python">Python (PyTorch/Transformers)</option>
                    <option value="bash">Bash / CLI (vLLM/Docker)</option>
                    <option value="javascript">JavaScript / TypeScript</option>
                    <option value="sql">SQL / Vector Query</option>
                    <option value="rust">Rust</option>
                    <option value="cpp">C++ / CUDA</option>
                  </select>
                </div>
                <textarea
                  className="form-textarea code-area"
                  placeholder="// Paste your Python / PyTorch / CUDA or configuration code here..."
                  rows={6}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* AI Tags */}
          <div className="form-group">
            <label className="form-label">AI Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {selectedTags.map(t => (
                <span key={t} className="tag-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  #{t}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type tag & press Enter or comma (e.g. TestTimeCompute, MLOps)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    if (tagsInput.trim()) {
                      handleAddTag(tagsInput);
                      setTagsInput('');
                    }
                  }
                }}
              />
            </div>

            {/* Quick suggested chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', alignSelf: 'center' }}>Suggested:</span>
              {SUGGESTED_TAGS.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddTag(st)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94a3b8',
                    padding: '2px 7px',
                    borderRadius: 4,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  +{st}
                </button>
              ))}
            </div>
          </div>

          {/* Paper / Media URL */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link2 size={14} />
              <span>Reference Link / arXiv Paper URL / Benchmark (Optional)</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://arxiv.org/abs/... or https://github.com/..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" id="publish-post-submit-btn">
              <Send size={16} />
              <span>{submitting ? 'Publishing...' : 'Publish Discussion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
