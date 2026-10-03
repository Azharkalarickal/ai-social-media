const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { initializeDatabase, pool } = require('./db');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');
const tagsRoutes = require('./routes/tags');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/sync', syncRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const [result] = await pool.query('SELECT 1 as test');
    if (result && result[0] && result[0].test === 1) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  res.json({
    status: 'online',
    appName: 'Synapse AI - Tech Professional Social Network',
    database: {
      provider: 'Hostinger Remote MySQL',
      status: dbStatus
    },
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend in production or when client/dist exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all route to serve SPA frontend
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Synapse AI API Server</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
              .card { background: #151d30; border: 1px solid #2a3b61; border-radius: 16px; padding: 40px; max-width: 550px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h1 { color: #38bdf8; margin-top: 0; }
              p { color: #94a3b8; line-height: 1.6; }
              .badge { background: #0369a1; color: #e0f2fe; padding: 4px 12px; border-radius: 999px; font-size: 0.85rem; display: inline-block; margin-bottom: 12px; }
              code { background: #0e1526; color: #a5f3fc; padding: 2px 6px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="badge">Backend API Active</span>
              <h1>⚡ Synapse AI Server</h1>
              <p>The AI Social Media API backend is running smoothly.</p>
              <p>For client frontend, build with <code>npm run build</code> or run Vite dev server via <code>npm run dev</code>.</p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Synapse AI Server running on http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
  
  // Initialize Database Tables and Schema
  await initializeDatabase();
});
