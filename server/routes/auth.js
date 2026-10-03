const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// Default modern tech avatars
const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
];

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, role_title, company, bio, skills, github_url, linkedin_url, avatar_url } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if username exists
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username is already taken by another AI professional.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedAvatar = avatar_url || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    const userEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@aisocial.network`;

    const [result] = await pool.query(`
      INSERT INTO users (name, username, email, password_hash, role_title, company, bio, avatar_url, skills, github_url, linkedin_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      cleanUsername,
      userEmail,
      passwordHash,
      role_title ? role_title.trim() : 'AI & IT Professional',
      company ? company.trim() : 'AI & Tech Industry',
      bio ? bio.trim() : 'Passionate about Artificial Intelligence, Machine Learning & Modern IT Architectures.',
      assignedAvatar,
      skills ? skills.trim() : 'PyTorch, Transformers, LLMs, MLOps',
      github_url ? github_url.trim() : '',
      linkedin_url ? linkedin_url.trim() : ''
    ]);

    const userId = result.insertId;

    const token = jwt.sign(
      { id: userId, username: cleanUsername, name: name.trim() },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const user = {
      id: userId,
      name: name.trim(),
      username: cleanUsername,
      email: userEmail,
      role_title: role_title ? role_title.trim() : 'AI & IT Professional',
      company: company ? company.trim() : 'AI & Tech Industry',
      bio: bio ? bio.trim() : 'Passionate about Artificial Intelligence, Machine Learning & Modern IT Architectures.',
      avatar_url: assignedAvatar,
      skills: skills ? skills.trim() : 'PyTorch, Transformers, LLMs, MLOps',
      github_url: github_url || '',
      linkedin_url: linkedin_url || '',
      followers_count: 0,
      following_count: 0,
      posts_count: 0
    };

    res.status(201).json({
      message: 'Account created successfully! Welcome to the AI Social Network.',
      token,
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed due to server error: ' + err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    const [users] = await pool.query(`
      SELECT u.*,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count
      FROM users u
      WHERE u.username = ? OR u.email = ?
      LIMIT 1
    `, [cleanUsername, cleanUsername]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const userRecord = users[0];
    const passwordValid = await bcrypt.compare(password, userRecord.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: userRecord.id, username: userRecord.username, name: userRecord.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      username: userRecord.username,
      email: userRecord.email,
      role_title: userRecord.role_title,
      company: userRecord.company,
      bio: userRecord.bio,
      avatar_url: userRecord.avatar_url,
      skills: userRecord.skills,
      github_url: userRecord.github_url,
      linkedin_url: userRecord.linkedin_url,
      created_at: userRecord.created_at,
      followers_count: Number(userRecord.followers_count) || 0,
      following_count: Number(userRecord.following_count) || 0,
      posts_count: Number(userRecord.posts_count) || 0
    };

    res.json({
      message: 'Logged in successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// GET CURRENT USER (/api/auth/me)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.*,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count
      FROM users u
      WHERE u.id = ?
      LIMIT 1
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userRecord = users[0];
    delete userRecord.password_hash;
    userRecord.followers_count = Number(userRecord.followers_count) || 0;
    userRecord.following_count = Number(userRecord.following_count) || 0;
    userRecord.posts_count = Number(userRecord.posts_count) || 0;

    res.json({ user: userRecord });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to fetch current user data.' });
  }
});

// UPDATE PROFILE
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, role_title, company, bio, avatar_url, skills, github_url, linkedin_url } = req.body;

    await pool.query(`
      UPDATE users SET
        name = COALESCE(?, name),
        role_title = COALESCE(?, role_title),
        company = COALESCE(?, company),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        skills = COALESCE(?, skills),
        github_url = COALESCE(?, github_url),
        linkedin_url = COALESCE(?, linkedin_url)
      WHERE id = ?
    `, [name, role_title, company, bio, avatar_url, skills, github_url, linkedin_url, req.user.id]);

    const [updated] = await pool.query(`
      SELECT u.*,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count
      FROM users u
      WHERE u.id = ?
    `, [req.user.id]);

    delete updated[0].password_hash;
    updated[0].followers_count = Number(updated[0].followers_count) || 0;
    updated[0].following_count = Number(updated[0].following_count) || 0;
    updated[0].posts_count = Number(updated[0].posts_count) || 0;

    res.json({ message: 'Profile updated successfully!', user: updated[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
