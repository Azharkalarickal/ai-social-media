import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, LogIn, UserPlus, Sparkles, Shield, Terminal, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { login, register, user, addToast } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [name, setName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [roleTitle, setRoleTitle] = useState('Senior AI Engineer');
  const [company, setCompany] = useState('AI Labs & Research');
  const [skills, setSkills] = useState('PyTorch, Transformers, LLMs, MLOps');
  const [bio, setBio] = useState('Building next-generation intelligent systems & deep learning architectures.');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to feed
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginUsername, loginPassword);
      navigate('/');
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        name,
        username: regUsername,
        email,
        password: regPassword,
        role_title: roleTitle,
        company,
        skills,
        bio
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Sign In
  const handleQuickDemo = (demoUser, demoPass) => {
    setLoginUsername(demoUser);
    setLoginPassword(demoPass);
    login(demoUser, demoPass)
      .then(() => navigate('/'))
      .catch(err => {
        setError(err.message);
        addToast(err.message, 'error');
      });
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 520, padding: 36, position: 'relative' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', color: '#070a13', marginBottom: 14, boxShadow: '0 0 25px rgba(0, 242, 254, 0.4)' }}>
            <Cpu size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            Synapse<span style={{ color: '#38bdf8' }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: 4 }}>
            The premier network for AI researchers, ML architects, and IT specialists
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(15, 23, 42, 0.8)', padding: 4, borderRadius: 'var(--radius-md)', marginBottom: 24, border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
            onClick={() => { setActiveTab('login'); setError(''); }}
            id="login-tab-btn"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.88rem' }}
            onClick={() => { setActiveTab('register'); setError(''); }}
            id="register-tab-btn"
          >
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 18, fontSize: '0.86rem' }}>
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. elena_ai or your email"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                id="login-username-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                id="login-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 10, padding: 12 }}
              id="login-submit-btn"
            >
              <LogIn size={17} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Synapse'}</span>
            </button>

            {/* Quick Demo Logins for Fast Pair Testing */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                ⚡ Quick Demo Profiles (Password: <code style={{ color: '#38bdf8' }}>password123</code>):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickDemo('elena_ai', 'password123')}
                  style={{ fontSize: '0.76rem' }}
                >
                  Elena (LLM Lead)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickDemo('marcus_mlops', 'password123')}
                  style={{ fontSize: '0.76rem' }}
                >
                  Marcus (MLOps)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickDemo('sophia_agents', 'password123')}
                  style={{ fontSize: '0.76rem' }}
                >
                  Sophia (Agents)
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Dr. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  id="reg-name-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="alex_ai"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                  id="reg-username-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="alex@neuraltech.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="reg-email-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password (6+ chars)</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                id="reg-password-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">AI / IT Role Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior MLOps Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company / Affiliation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DeepScale AI"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Core Tech Stack / Skills</label>
              <input
                type="text"
                className="form-input"
                placeholder="PyTorch, vLLM, LangGraph, CUDA"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Bio</label>
              <textarea
                className="form-textarea"
                rows={2}
                style={{ minHeight: 60 }}
                placeholder="Research focus, tech interests, or engineering bio..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 10, padding: 12 }}
              id="reg-submit-btn"
            >
              <UserPlus size={17} />
              <span>{loading ? 'Creating Profile...' : 'Join AI Professional Network'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
