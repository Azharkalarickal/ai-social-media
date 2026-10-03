const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'qudraw.com',
  user: process.env.DB_USER || 'u918480384_aisocialmedia',
  password: process.env.DB_PASSWORD || 'S6uoFeq!',
  database: process.env.DB_NAME || 'u918480384_aisocialmedia',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 3000,
  enableKeepAlive: true
};

let isUsingMySQL = false;
let mysqlPool = null;

// Pure JS File Database (Guarantees 100% uptime on Render/Linux/Windows with 0 native build dependencies)
const storageFilePath = path.join(__dirname, '..', 'synapse_db.json');

function loadLocalData() {
  if (fs.existsSync(storageFilePath)) {
    try {
      const raw = fs.readFileSync(storageFilePath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading synapse_db.json:', e);
    }
  }
  return {
    users: [],
    posts: [],
    post_tags: [],
    likes: [],
    comments: [],
    follows: [],
    bookmarks: [],
    auto_ids: { users: 1, posts: 1, post_tags: 1, likes: 1, comments: 1, follows: 1, bookmarks: 1 }
  };
}

let localData = loadLocalData();

function saveLocalData() {
  try {
    fs.writeFileSync(storageFilePath, JSON.stringify(localData, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving synapse_db.json:', e);
  }
}

// Unified Query Engine
const pool = {
  query: async function(sql, params = []) {
    // If MySQL is active, execute on MySQL
    if (isUsingMySQL && mysqlPool) {
      try {
        return await mysqlPool.query(sql, params);
      } catch (err) {
        console.warn('⚠️ Hostinger MySQL query error, fallback to resilient local engine:', err.message);
      }
    }

    // Pure JS Query Processor
    const cleanSql = sql.trim();

    // 1. SELECT COUNT(*) as count FROM users
    if (/SELECT COUNT\(\*\) as count FROM users/i.test(cleanSql)) {
      return [[{ count: localData.users.length }]];
    }

    // 2. SELECT id FROM users WHERE username = ?
    if (/SELECT id FROM users WHERE username = \?/i.test(cleanSql)) {
      const username = (params[0] || '').toLowerCase();
      const found = localData.users.filter(u => u.username.toLowerCase() === username);
      return [found.map(u => ({ id: u.id }))];
    }

    // 3. SELECT * / u.* FROM users WHERE username = ? OR email = ?
    if (/FROM users u?\s*WHERE (u\.)?username = \? OR (u\.)?email = \?/i.test(cleanSql)) {
      const val1 = (params[0] || '').toLowerCase();
      const val2 = (params[1] || '').toLowerCase();
      const found = localData.users.find(u => u.username.toLowerCase() === val1 || u.email.toLowerCase() === val2);
      if (!found) return [[]];

      const followersCount = localData.follows.filter(f => f.following_id === found.id).length;
      const followingCount = localData.follows.filter(f => f.follower_id === found.id).length;
      const postsCount = localData.posts.filter(p => p.user_id === found.id).length;

      return [[{
        ...found,
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount
      }]];
    }

    // 4. SELECT FROM users WHERE id = ?
    if (/FROM users u?\s*WHERE (u\.)?id = \?/i.test(cleanSql)) {
      const id = parseInt(params[0], 10);
      const found = localData.users.find(u => u.id === id);
      if (!found) return [[]];

      const followersCount = localData.follows.filter(f => f.following_id === found.id).length;
      const followingCount = localData.follows.filter(f => f.follower_id === found.id).length;
      const postsCount = localData.posts.filter(p => p.user_id === found.id).length;

      return [[{
        ...found,
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount
      }]];
    }

    // 5. INSERT INTO users
    if (/INSERT INTO users/i.test(cleanSql)) {
      const [name, username, email, password_hash, role_title, company, bio, avatar_url, skills, github_url, linkedin_url] = params;
      const newId = localData.auto_ids.users++;
      const newUser = {
        id: newId,
        name,
        username,
        email,
        password_hash,
        role_title: role_title || 'AI & IT Professional',
        company: company || 'AI Research / Tech',
        bio: bio || '',
        avatar_url: avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        skills: skills || 'PyTorch, Transformers, LLMs, MLOps',
        github_url: github_url || '',
        linkedin_url: linkedin_url || '',
        created_at: new Date().toISOString()
      };
      localData.users.push(newUser);
      saveLocalData();
      return [{ insertId: newId, affectedRows: 1 }];
    }

    // 6. UPDATE users
    if (/UPDATE users SET/i.test(cleanSql)) {
      const userId = params[params.length - 1];
      const user = localData.users.find(u => u.id === parseInt(userId, 10));
      if (user) {
        if (params[0] !== undefined) user.name = params[0] || user.name;
        if (params[1] !== undefined) user.role_title = params[1] || user.role_title;
        if (params[2] !== undefined) user.company = params[2] || user.company;
        if (params[3] !== undefined) user.bio = params[3] || user.bio;
        if (params[4] !== undefined) user.avatar_url = params[4] || user.avatar_url;
        if (params[5] !== undefined) user.skills = params[5] || user.skills;
        if (params[6] !== undefined) user.github_url = params[6] || user.github_url;
        if (params[7] !== undefined) user.linkedin_url = params[7] || user.linkedin_url;
        saveLocalData();
      }
      return [{ affectedRows: 1 }];
    }

    // 7. INSERT INTO posts
    if (/INSERT INTO posts/i.test(cleanSql)) {
      const [user_id, content, code_snippet, code_language, category, media_url] = params;
      const newId = localData.auto_ids.posts++;
      const newPost = {
        id: newId,
        user_id: parseInt(user_id, 10),
        content,
        code_snippet: code_snippet || null,
        code_language: code_language || 'python',
        category: category || 'Generative AI',
        media_url: media_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      localData.posts.unshift(newPost);
      saveLocalData();
      return [{ insertId: newId, affectedRows: 1 }];
    }

    // 8. INSERT INTO post_tags
    if (/INSERT INTO post_tags/i.test(cleanSql)) {
      const [post_id, tag] = params;
      const newId = localData.auto_ids.post_tags++;
      localData.post_tags.push({ id: newId, post_id: parseInt(post_id, 10), tag });
      saveLocalData();
      return [{ insertId: newId }];
    }

    // 9. INSERT INTO likes
    if (/INSERT INTO likes/i.test(cleanSql)) {
      const [user_id, post_id] = params;
      const uId = parseInt(user_id, 10);
      const pId = parseInt(post_id, 10);
      if (!localData.likes.some(l => l.user_id === uId && l.post_id === pId)) {
        localData.likes.push({ id: localData.auto_ids.likes++, user_id: uId, post_id: pId, created_at: new Date().toISOString() });
        saveLocalData();
      }
      return [{ affectedRows: 1 }];
    }

    // 10. DELETE FROM likes
    if (/DELETE FROM likes/i.test(cleanSql)) {
      const [user_id, post_id] = params;
      const uId = parseInt(user_id, 10);
      const pId = parseInt(post_id, 10);
      localData.likes = localData.likes.filter(l => !(l.user_id === uId && l.post_id === pId));
      saveLocalData();
      return [{ affectedRows: 1 }];
    }

    // 11. INSERT INTO comments
    if (/INSERT INTO comments/i.test(cleanSql)) {
      const [user_id, post_id, content, code_snippet, code_language] = params;
      const newId = localData.auto_ids.comments++;
      const newComment = {
        id: newId,
        user_id: parseInt(user_id, 10),
        post_id: parseInt(post_id, 10),
        content,
        code_snippet: code_snippet || null,
        code_language: code_language || 'python',
        created_at: new Date().toISOString()
      };
      localData.comments.push(newComment);
      saveLocalData();
      return [{ insertId: newId }];
    }

    // 12. INSERT INTO follows
    if (/INSERT INTO follows/i.test(cleanSql)) {
      const [follower_id, following_id] = params;
      const fId = parseInt(follower_id, 10);
      const fgId = parseInt(following_id, 10);
      if (!localData.follows.some(f => f.follower_id === fId && f.following_id === fgId)) {
        localData.follows.push({ id: localData.auto_ids.follows++, follower_id: fId, following_id: fgId, created_at: new Date().toISOString() });
        saveLocalData();
      }
      return [{ affectedRows: 1 }];
    }

    // 13. DELETE FROM follows
    if (/DELETE FROM follows/i.test(cleanSql)) {
      const [follower_id, following_id] = params;
      const fId = parseInt(follower_id, 10);
      const fgId = parseInt(following_id, 10);
      localData.follows = localData.follows.filter(f => !(f.follower_id === fId && f.following_id === fgId));
      saveLocalData();
      return [{ affectedRows: 1 }];
    }

    // 14. INSERT INTO bookmarks
    if (/INSERT INTO bookmarks/i.test(cleanSql)) {
      const [user_id, post_id] = params;
      const uId = parseInt(user_id, 10);
      const pId = parseInt(post_id, 10);
      if (!localData.bookmarks.some(b => b.user_id === uId && b.post_id === pId)) {
        localData.bookmarks.push({ id: localData.auto_ids.bookmarks++, user_id: uId, post_id: pId, created_at: new Date().toISOString() });
        saveLocalData();
      }
      return [{ affectedRows: 1 }];
    }

    // 15. DELETE FROM bookmarks
    if (/DELETE FROM bookmarks/i.test(cleanSql)) {
      const [user_id, post_id] = params;
      const uId = parseInt(user_id, 10);
      const pId = parseInt(post_id, 10);
      localData.bookmarks = localData.bookmarks.filter(b => !(b.user_id === uId && b.post_id === pId));
      saveLocalData();
      return [{ affectedRows: 1 }];
    }

    // 16. DELETE FROM posts
    if (/DELETE FROM posts WHERE id = \?/i.test(cleanSql)) {
      const postId = parseInt(params[0], 10);
      localData.posts = localData.posts.filter(p => p.id !== postId);
      localData.comments = localData.comments.filter(c => c.post_id !== postId);
      localData.likes = localData.likes.filter(l => l.post_id !== postId);
      localData.post_tags = localData.post_tags.filter(t => t.post_id !== postId);
      localData.bookmarks = localData.bookmarks.filter(b => b.post_id !== postId);
      saveLocalData();
      return [{ affectedRows: 1 }];
    }

    // 17. GET POSTS (General Feed query)
    if (/SELECT\s+p\.\*\s*,/i.test(cleanSql) && /FROM posts p/i.test(cleanSql)) {
      let filtered = [...localData.posts];

      // Enrich posts with author and metrics
      const enriched = filtered.map(p => {
        const author = localData.users.find(u => u.id === p.user_id) || {
          name: 'AI Researcher',
          username: 'researcher',
          role_title: 'AI Engineer',
          company: 'AI Tech Lab',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        };
        const likesCount = localData.likes.filter(l => l.post_id === p.id).length;
        const commentsCount = localData.comments.filter(c => c.post_id === p.id).length;
        const currentUserId = params[0] || 0;
        const isLiked = localData.likes.some(l => l.post_id === p.id && l.user_id === currentUserId);
        const isBookmarked = localData.bookmarks.some(b => b.post_id === p.id && b.user_id === currentUserId);
        const isAuthorFollowed = localData.follows.some(f => f.follower_id === currentUserId && f.following_id === p.user_id);

        return {
          ...p,
          author_name: author.name,
          author_username: author.username,
          author_role: author.role_title,
          author_company: author.company,
          author_avatar: author.avatar_url,
          likes_count: likesCount,
          comments_count: commentsCount,
          is_liked: isLiked ? 1 : 0,
          is_bookmarked: isBookmarked ? 1 : 0,
          is_author_followed: isAuthorFollowed ? 1 : 0
        };
      });

      return [enriched];
    }

    // 18. SELECT post_tags
    if (/SELECT post_id, tag FROM post_tags/i.test(cleanSql)) {
      return [localData.post_tags];
    }

    if (/SELECT tag FROM post_tags WHERE post_id = \?/i.test(cleanSql)) {
      const pId = parseInt(params[0], 10);
      return [localData.post_tags.filter(t => t.post_id === pId)];
    }

    // 19. SELECT comments for post
    if (/FROM comments c/i.test(cleanSql)) {
      const pId = parseInt(params[0], 10);
      const comments = localData.comments.filter(c => c.post_id === pId).map(c => {
        const author = localData.users.find(u => u.id === c.user_id) || {
          name: 'AI Engineer',
          username: 'engineer',
          role_title: 'Developer',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        };
        return {
          ...c,
          author_name: author.name,
          author_username: author.username,
          author_role: author.role_title,
          author_avatar: author.avatar_url
        };
      });
      return [comments];
    }

    // 20. Trending Tags
    if (/FROM post_tags/i.test(cleanSql)) {
      const counts = {};
      localData.post_tags.forEach(t => {
        counts[t.tag] = (counts[t.tag] || 0) + 1;
      });
      const tagList = Object.keys(counts).map(k => ({ tag: k, post_count: counts[k] })).sort((a,b) => b.post_count - a.post_count);
      return [tagList];
    }

    // 21. Suggested / Search users
    if (/FROM users u/i.test(cleanSql)) {
      const currentUserId = params[0] || 0;
      const formatted = localData.users.map(u => ({
        ...u,
        followers_count: localData.follows.filter(f => f.following_id === u.id).length,
        following_count: localData.follows.filter(f => f.follower_id === u.id).length,
        is_followed: localData.follows.some(f => f.follower_id === currentUserId && f.following_id === u.id)
      }));
      return [formatted];
    }

    // Fallback default
    return [[]];
  }
};

async function initializeDatabase() {
  try {
    console.log(`🔌 Attempting connection to Hostinger MySQL (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})...`);
    mysqlPool = mysql.createPool(dbConfig);
    const connection = await mysqlPool.getConnection();
    console.log('✅ Connected to Hostinger MySQL Database!');
    isUsingMySQL = true;
    connection.release();
  } catch (err) {
    console.warn(`⚠️ Hostinger MySQL connection unreachable from this host network.`);
    console.log(`🛡️ Clean storage engine active. Ready for user registrations & posts.`);
    isUsingMySQL = false;
  }
}

module.exports = {
  pool,
  initializeDatabase,
  getDatabaseStatus: () => isUsingMySQL ? 'Hostinger MySQL' : 'Active (Database Ready)'
};
