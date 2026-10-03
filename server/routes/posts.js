const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// GET POSTS (Feed, Category, Tag, Search, Following, User Posts)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const { feed, tag, category, userId, search, limit = 25, offset = 0 } = req.query;

    let whereClauses = ['1=1'];
    let queryParams = [];

    if (userId) {
      whereClauses.push('p.user_id = ?');
      queryParams.push(userId);
    }

    if (category && category !== 'All') {
      whereClauses.push('p.category = ?');
      queryParams.push(category);
    }

    if (tag) {
      whereClauses.push('p.id IN (SELECT post_id FROM post_tags WHERE LOWER(tag) = LOWER(?))');
      queryParams.push(tag);
    }

    if (search) {
      const searchTerm = `%${search.trim()}%`;
      whereClauses.push('(p.content LIKE ? OR p.code_snippet LIKE ? OR u.name LIKE ? OR u.username LIKE ?)');
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (feed === 'following' && currentUserId > 0) {
      whereClauses.push('p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)');
      queryParams.push(currentUserId);
    }

    let orderBy = 'p.created_at DESC';
    if (feed === 'trending') {
      orderBy = '(likes_count * 2 + comments_count * 3) DESC, p.created_at DESC';
    }

    const sql = `
      SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        u.role_title as author_role,
        u.company as author_company,
        u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_author_followed
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.unshift(currentUserId, currentUserId, currentUserId);
    queryParams.push(parseInt(limit, 10), parseInt(offset, 10));

    const [posts] = await pool.query(sql, queryParams);

    // Fetch tags for these posts
    if (posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [tags] = await pool.query(`
        SELECT post_id, tag FROM post_tags WHERE post_id IN (?)
      `, [postIds]);

      const tagsByPost = {};
      tags.forEach(t => {
        if (!tagsByPost[t.post_id]) tagsByPost[t.post_id] = [];
        tagsByPost[t.post_id].push(t.tag);
      });

      posts.forEach(p => {
        p.tags = tagsByPost[p.id] || [];
        p.likes_count = Number(p.likes_count) || 0;
        p.comments_count = Number(p.comments_count) || 0;
        p.is_liked = Boolean(p.is_liked);
        p.is_bookmarked = Boolean(p.is_bookmarked);
        p.is_author_followed = Boolean(p.is_author_followed);
      });
    }

    res.json({ posts });
  } catch (err) {
    console.error('Fetch posts error:', err);
    res.status(500).json({ error: 'Failed to fetch posts: ' + err.message });
  }
});

// GET BOOKMARKED POSTS
router.get('/bookmarked', requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [posts] = await pool.query(`
      SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        u.role_title as author_role,
        u.company as author_company,
        u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        1 as is_bookmarked,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_author_followed
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [currentUserId, currentUserId, currentUserId]);

    if (posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const [tags] = await pool.query(`
        SELECT post_id, tag FROM post_tags WHERE post_id IN (?)
      `, [postIds]);

      const tagsByPost = {};
      tags.forEach(t => {
        if (!tagsByPost[t.post_id]) tagsByPost[t.post_id] = [];
        tagsByPost[t.post_id].push(t.tag);
      });

      posts.forEach(p => {
        p.tags = tagsByPost[p.id] || [];
        p.likes_count = Number(p.likes_count) || 0;
        p.comments_count = Number(p.comments_count) || 0;
        p.is_liked = Boolean(p.is_liked);
        p.is_bookmarked = true;
        p.is_author_followed = Boolean(p.is_author_followed);
      });
    }

    res.json({ posts });
  } catch (err) {
    console.error('Fetch bookmarks error:', err);
    res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
});

// GET SINGLE POST WITH COMMENTS
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user ? req.user.id : 0;
    const postId = req.params.id;

    const [posts] = await pool.query(`
      SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        u.role_title as author_role,
        u.company as author_company,
        u.avatar_url as author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_author_followed
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [currentUserId, currentUserId, currentUserId, postId]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = posts[0];
    post.likes_count = Number(post.likes_count) || 0;
    post.comments_count = Number(post.comments_count) || 0;
    post.is_liked = Boolean(post.is_liked);
    post.is_bookmarked = Boolean(post.is_bookmarked);
    post.is_author_followed = Boolean(post.is_author_followed);

    // Fetch tags
    const [tags] = await pool.query('SELECT tag FROM post_tags WHERE post_id = ?', [postId]);
    post.tags = tags.map(t => t.tag);

    // Fetch comments
    const [comments] = await pool.query(`
      SELECT 
        c.*,
        u.name as author_name,
        u.username as author_username,
        u.role_title as author_role,
        u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    post.comments = comments;

    res.json({ post });
  } catch (err) {
    console.error('Get post details error:', err);
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

// CREATE NEW POST
router.post('/', requireAuth, async (req, res) => {
  try {
    const { content, code_snippet, code_language, category, media_url, tags = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const [result] = await pool.query(`
      INSERT INTO posts (user_id, content, code_snippet, code_language, category, media_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      content.trim(),
      code_snippet ? code_snippet.trim() : null,
      code_language || 'python',
      category || 'Generative AI',
      media_url || null
    ]);

    const postId = result.insertId;

    // Insert tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tag of tags) {
        const cleanTag = tag.trim().replace(/^#/, '');
        if (cleanTag) {
          await pool.query('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)', [postId, cleanTag]);
        }
      }
    }

    // Return the newly created post formatted
    const [createdPosts] = await pool.query(`
      SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        u.role_title as author_role,
        u.company as author_company,
        u.avatar_url as author_avatar,
        0 as likes_count,
        0 as comments_count,
        0 as is_bookmarked,
        0 as is_liked,
        0 as is_author_followed
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId]);

    const newPost = createdPosts[0];
    newPost.tags = tags.map(t => t.replace(/^#/, ''));
    newPost.comments = [];

    res.status(201).json({
      message: 'Post published successfully!',
      post: newPost
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to create post: ' + err.message });
  }
});

// LIKE / UNLIKE POST
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if already liked
    const [existing] = await pool.query('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);

    let isLiked = false;
    if (existing.length > 0) {
      // Unlike
      await pool.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      isLiked = false;
    } else {
      // Like
      await pool.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      isLiked = true;
    }

    const [likesCount] = await pool.query('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);

    res.json({
      liked: isLiked,
      likes_count: Number(likesCount[0].count) || 0
    });
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// BOOKMARK / UNBOOKMARK POST
router.post('/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const [existing] = await pool.query('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId]);

    let isBookmarked = false;
    if (existing.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [userId, postId]);
      isBookmarked = false;
    } else {
      await pool.query('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      isBookmarked = true;
    }

    res.json({
      bookmarked: isBookmarked,
      message: isBookmarked ? 'Post saved to bookmarks' : 'Post removed from bookmarks'
    });
  } catch (err) {
    console.error('Bookmark error:', err);
    res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
});

// ADD COMMENT TO POST
router.post('/:id/comment', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, code_snippet, code_language } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const [result] = await pool.query(`
      INSERT INTO comments (user_id, post_id, content, code_snippet, code_language)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      postId,
      content.trim(),
      code_snippet ? code_snippet.trim() : null,
      code_language || 'python'
    ]);

    const commentId = result.insertId;

    const [comments] = await pool.query(`
      SELECT 
        c.*,
        u.name as author_name,
        u.username as author_username,
        u.role_title as author_role,
        u.avatar_url as author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [commentId]);

    const [countResult] = await pool.query('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [postId]);

    res.status(201).json({
      message: 'Comment added successfully!',
      comment: comments[0],
      comments_count: Number(countResult[0].count) || 0
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// DELETE POST
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check ownership
    const [posts] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post.' });
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

module.exports = router;
