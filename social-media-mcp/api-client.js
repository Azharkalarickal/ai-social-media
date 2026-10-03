require('dotenv').config();

class SynapseApiClient {
  constructor(baseUrl = process.env.SYNAPSE_API_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
    this.botUser = null;
  }

  setToken(token) {
    this.token = token;
  }

  async loginOrRegister(botConfig = {}) {
    const username = botConfig.username || process.env.BOT_USERNAME || 'bot_dr_kaizen';
    const password = botConfig.password || process.env.BOT_PASSWORD || 'bot_secret_password_123';
    const name = botConfig.name || process.env.BOT_NAME || 'Dr. Kaizen 🤖 (AI Research Bot)';
    const email = botConfig.email || process.env.BOT_EMAIL || 'kaizen.bot@synapse.ai';
    const roleTitle = botConfig.role_title || process.env.BOT_ROLE || 'Autonomous AI & Distributed Systems Scientist';
    const company = botConfig.company || process.env.BOT_COMPANY || 'Cognitive Nexus Labs';
    const bio = botConfig.bio || process.env.BOT_BIO || 'An autonomous Gemini-powered AI agent reviewing breakthroughs on Synapse AI.';
    const skills = botConfig.skills || process.env.BOT_SKILLS || 'Gemini Flash, PyTorch, vLLM, CUDA';
    const avatarUrl = botConfig.avatar_url || process.env.BOT_AVATAR || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150';

    try {
      // 1. Try to login
      const loginRes = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        this.token = data.token;
        this.botUser = data.user;
        console.log(`🤖 Logged in successfully as bot: ${this.botUser.name} (@${this.botUser.username})`);
        return data;
      }

      // 2. If login failed, register bot account
      console.log(`🤖 Bot user @${username} not found. Registering bot profile in Synapse database...`);
      const regRes = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          role_title: roleTitle,
          company,
          bio,
          skills,
          avatar_url: avatarUrl
        })
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        throw new Error(`Failed to register bot: ${regData.error}`);
      }

      this.token = regData.token;
      this.botUser = regData.user;
      console.log(`✅ Bot account registered successfully: ${this.botUser.name} (@${this.botUser.username})`);
      return regData;
    } catch (err) {
      console.error('❌ Synapse API Auth Error:', err.message);
      throw err;
    }
  }

  async getFeed(options = {}) {
    const { feed = 'for-you', category = '', tag = '', limit = 15 } = options;
    const params = new URLSearchParams();
    if (feed) params.set('feed', feed);
    if (category && category !== 'All') params.set('category', category);
    if (tag) params.set('tag', tag);
    if (limit) params.set('limit', limit);

    const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const res = await fetch(`${this.baseUrl}/api/posts?${params.toString()}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch feed: ${res.statusText}`);
    return await res.json();
  }

  async getPostDetails(postId) {
    const headers = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const res = await fetch(`${this.baseUrl}/api/posts/${postId}`, { headers });
    if (!res.ok) throw new Error(`Failed to get post #${postId}: ${res.statusText}`);
    return await res.json();
  }

  async createPost(postData) {
    if (!this.token) throw new Error('Authentication required to create post.');
    const res = await fetch(`${this.baseUrl}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(postData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Create post failed: ${data.error}`);
    return data;
  }

  async addComment(postId, commentData) {
    if (!this.token) throw new Error('Authentication required to comment.');
    const res = await fetch(`${this.baseUrl}/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(commentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Add comment failed: ${data.error}`);
    return data;
  }

  async likePost(postId) {
    if (!this.token) throw new Error('Authentication required to like.');
    const res = await fetch(`${this.baseUrl}/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await res.json();
  }

  async followUser(userId) {
    if (!this.token) throw new Error('Authentication required to follow.');
    const res = await fetch(`${this.baseUrl}/api/users/${userId}/follow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return await res.json();
  }

  async search(query) {
    const res = await fetch(`${this.baseUrl}/api/users/search?q=${encodeURIComponent(query)}`);
    return await res.json();
  }
}

module.exports = SynapseApiClient;
