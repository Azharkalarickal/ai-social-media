const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

// GET EXPORT SQL FOR PHPMYADMIN
router.get('/export', async (req, res) => {
  try {
    const storageFilePath = path.join(__dirname, '..', '..', 'synapse_db.json');
    let data = { users: [], posts: [], post_tags: [], likes: [], comments: [], follows: [], bookmarks: [] };

    if (fs.existsSync(storageFilePath)) {
      data = JSON.parse(fs.readFileSync(storageFilePath, 'utf8'));
    }

    let sqlStatements = [];
    sqlStatements.push('-- ==============================================');
    sqlStatements.push('-- SYNAPSE AI - LIVE DATA SYNC FOR PHPMYADMIN');
    sqlStatements.push('-- ==============================================\n');

    // 1. Users
    if (data.users && data.users.length > 0) {
      sqlStatements.push('-- USERS');
      for (const u of data.users) {
        const name = (u.name || '').replace(/'/g, "''");
        const username = (u.username || '').replace(/'/g, "''");
        const email = (u.email || '').replace(/'/g, "''");
        const pass = (u.password_hash || '').replace(/'/g, "''");
        const role = (u.role_title || '').replace(/'/g, "''");
        const comp = (u.company || '').replace(/'/g, "''");
        const bio = (u.bio || '').replace(/'/g, "''");
        const avatar = (u.avatar_url || '').replace(/'/g, "''");
        const skills = (u.skills || '').replace(/'/g, "''");

        sqlStatements.push(`INSERT IGNORE INTO users (id, name, username, email, password_hash, role_title, company, bio, avatar_url, skills) VALUES (${u.id}, '${name}', '${username}', '${email}', '${pass}', '${role}', '${comp}', '${bio}', '${avatar}', '${skills}');`);
      }
      sqlStatements.push('');
    }

    // 2. Posts
    if (data.posts && data.posts.length > 0) {
      sqlStatements.push('-- POSTS');
      for (const p of data.posts) {
        const content = (p.content || '').replace(/'/g, "''");
        const code = p.code_snippet ? `'${p.code_snippet.replace(/'/g, "''")}'` : 'NULL';
        const lang = (p.code_language || 'python').replace(/'/g, "''");
        const cat = (p.category || 'Generative AI').replace(/'/g, "''");
        sqlStatements.push(`INSERT IGNORE INTO posts (id, user_id, category, content, code_snippet, code_language) VALUES (${p.id}, ${p.user_id}, '${cat}', '${content}', ${code}, '${lang}');`);
      }
      sqlStatements.push('');
    }

    // 3. Post Tags
    if (data.post_tags && data.post_tags.length > 0) {
      sqlStatements.push('-- POST TAGS');
      for (const t of data.post_tags) {
        const tag = (t.tag || '').replace(/'/g, "''");
        sqlStatements.push(`INSERT IGNORE INTO post_tags (id, post_id, tag) VALUES (${t.id}, ${t.post_id}, '${tag}');`);
      }
      sqlStatements.push('');
    }

    // 4. Likes
    if (data.likes && data.likes.length > 0) {
      sqlStatements.push('-- LIKES');
      for (const l of data.likes) {
        sqlStatements.push(`INSERT IGNORE INTO likes (id, user_id, post_id) VALUES (${l.id}, ${l.user_id}, ${l.post_id});`);
      }
      sqlStatements.push('');
    }

    // 5. Follows
    if (data.follows && data.follows.length > 0) {
      sqlStatements.push('-- FOLLOWS');
      for (const f of data.follows) {
        sqlStatements.push(`INSERT IGNORE INTO follows (id, follower_id, following_id) VALUES (${f.id}, ${f.follower_id}, ${f.following_id});`);
      }
      sqlStatements.push('');
    }

    const outputSql = sqlStatements.join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.send(outputSql || '-- No user data created yet.');
  } catch (err) {
    res.status(500).send('Error generating sync export: ' + err.message);
  }
});

module.exports = router;
