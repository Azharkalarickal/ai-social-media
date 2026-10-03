const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET POPULAR / TRENDING AI TOPICS AND TAGS
router.get('/trending', async (req, res) => {
  try {
    const [tags] = await pool.query(`
      SELECT tag, COUNT(*) as post_count
      FROM post_tags
      GROUP BY tag
      ORDER BY post_count DESC
      LIMIT 12
    `);

    res.json({ tags: tags || [] });
  } catch (err) {
    console.error('Fetch trending tags error:', err);
    res.json({ tags: [] });
  }
});

module.exports = router;
