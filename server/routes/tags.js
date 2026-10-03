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

    // Fallback if no tags in db yet
    const defaultTrending = [
      { tag: 'DeepSeek-R1', post_count: 42 },
      { tag: 'LLMs', post_count: 38 },
      { tag: 'Reasoning', post_count: 31 },
      { tag: 'Agents', post_count: 27 },
      { tag: 'vLLM', post_count: 22 },
      { tag: 'LangGraph', post_count: 19 },
      { tag: 'PyTorch', post_count: 18 },
      { tag: 'CUDA', post_count: 15 },
      { tag: '3DGS', post_count: 12 },
      { tag: 'MLOps', post_count: 10 }
    ];

    res.json({ tags: tags.length > 0 ? tags : defaultTrending });
  } catch (err) {
    console.error('Fetch trending tags error:', err);
    res.json({
      tags: [
        { tag: 'DeepSeek', post_count: 25 },
        { tag: 'Agents', post_count: 18 },
        { tag: 'PyTorch', post_count: 14 },
        { tag: 'Transformers', post_count: 12 }
      ]
    });
  }
});

module.exports = router;
