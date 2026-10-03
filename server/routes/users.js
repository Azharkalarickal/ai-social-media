const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET SUGGESTED AI PROFESSIONALS TO FOLLOW
router.get('/suggested', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;

    const [users] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.role_title, u.company, u.bio, u.avatar_url, u.skills,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_followed
      FROM users u
      WHERE u.id != ?
      ORDER BY followers_count DESC, u.created_at DESC
      LIMIT 6
    `, [currentUserId, currentUserId]);

    const formatted = users.map(u => ({
      ...u,
      followers_count: Number(u.followers_count) || 0,
      following_count: Number(u.following_count) || 0,
      is_followed: Boolean(u.is_followed)
    }));

    res.json({ users: formatted });
  } catch (err) {
    console.error('Fetch suggested users error:', err);
    res.status(500).json({ error: 'Failed to fetch suggested professionals.' });
  }
});

// SEARCH USERS
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const { q = '' } = req.query;

    if (!q.trim()) {
      return res.json({ users: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    const [users] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.role_title, u.company, u.bio, u.avatar_url, u.skills,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_followed
      FROM users u
      WHERE u.name LIKE ? OR u.username LIKE ? OR u.role_title LIKE ? OR u.skills LIKE ? OR u.company LIKE ?
      LIMIT 20
    `, [currentUserId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);

    const formatted = users.map(u => ({
      ...u,
      followers_count: Number(u.followers_count) || 0,
      is_followed: Boolean(u.is_followed)
    }));

    res.json({ users: formatted });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// GET USER PROFILE BY USERNAME
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const username = req.params.username.toLowerCase();

    const [users] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.role_title, u.company, u.bio, u.avatar_url, u.skills,
        u.github_url, u.linkedin_url, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_followed
      FROM users u
      WHERE LOWER(u.username) = ?
      LIMIT 1
    `, [currentUserId, username]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = users[0];
    user.followers_count = Number(user.followers_count) || 0;
    user.following_count = Number(user.following_count) || 0;
    user.posts_count = Number(user.posts_count) || 0;
    user.is_followed = Boolean(user.is_followed);
    user.is_self = (currentUserId === user.id);

    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// TOGGLE FOLLOW / UNFOLLOW
router.post('/:id/follow', requireAuth, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const followerId = req.user.id;

    if (targetUserId === followerId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    // Check if target user exists
    const [target] = await pool.query('SELECT id, name FROM users WHERE id = ?', [targetUserId]);
    if (target.length === 0) {
      return res.status(404).json({ error: 'Target user does not exist.' });
    }

    const [existing] = await pool.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, targetUserId]);

    let isFollowing = false;
    if (existing.length > 0) {
      // Unfollow
      await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, targetUserId]);
      isFollowing = false;
    } else {
      // Follow
      await pool.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, targetUserId]);
      isFollowing = true;
    }

    const [counts] = await pool.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [targetUserId]);

    res.json({
      following: isFollowing,
      followers_count: Number(counts[0].count) || 0,
      message: isFollowing ? `You are now following ${target[0].name}` : `Unfollowed ${target[0].name}`
    });
  } catch (err) {
    console.error('Follow toggle error:', err);
    res.status(500).json({ error: 'Failed to update follow status.' });
  }
});

// GET FOLLOWERS OF A USER
router.get('/:id/followers', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const targetUserId = req.params.id;

    const [followers] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.role_title, u.company, u.avatar_url, u.skills,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_followed
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `, [currentUserId, targetUserId]);

    const formatted = followers.map(u => ({
      ...u,
      is_followed: Boolean(u.is_followed)
    }));

    res.json({ followers: formatted });
  } catch (err) {
    console.error('Fetch followers error:', err);
    res.status(500).json({ error: 'Failed to fetch followers list.' });
  }
});

// GET FOLLOWING OF A USER
router.get('/:id/following', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const targetUserId = req.params.id;

    const [following] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.role_title, u.company, u.avatar_url, u.skills,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_followed
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `, [currentUserId, targetUserId]);

    const formatted = following.map(u => ({
      ...u,
      is_followed: Boolean(u.is_followed)
    }));

    res.json({ following: formatted });
  } catch (err) {
    console.error('Fetch following error:', err);
    res.status(500).json({ error: 'Failed to fetch following list.' });
  }
});

module.exports = router;
