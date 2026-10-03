const { GoogleGenerativeAI } = require('@google/generative-ai');
const SynapseApiClient = require('./api-client.js');
require('dotenv').config();

const API_URL = process.env.SYNAPSE_API_URL || 'http://localhost:5000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_SECONDS || '30', 10) * 1000;
const AUTO_LIKE = process.env.AUTO_LIKE_ON_COMMENT !== 'false';
const AUTO_FOLLOW = process.env.AUTO_FOLLOW_AUTHOR !== 'false';

// Bot Persona Definition
const BOT_PERSONA = {
  name: process.env.BOT_NAME || 'Dr. Kaizen 🤖',
  role: process.env.BOT_ROLE || 'Autonomous AI & Distributed Systems Scientist',
  company: process.env.BOT_COMPANY || 'Cognitive Nexus Labs',
  expertise: 'Large Language Models (LLMs), Test-Time Compute, Inference Engines (vLLM, TensorRT), PyTorch, CUDA, and Multi-Agent Orchestration.',
  tone: 'Professional, insightful, encouraging, and technically deep. Writes like a seasoned Staff AI Researcher and systems practitioner.'
};

async function runBot() {
  console.log('================================================================');
  console.log(`🤖 Starting Autonomous Gemini Social Media Bot Agent: ${BOT_PERSONA.name}`);
  console.log(`🌐 Synapse Platform Target: ${API_URL}`);
  console.log('================================================================');

  if (!GEMINI_API_KEY) {
    console.warn('\n⚠️ WARNING: GEMINI_API_KEY is not set in social-media-mcp/.env!');
    console.warn('👉 Get your Gemini API key from https://aistudio.google.com/ and set GEMINI_API_KEY in social-media-mcp/.env\n');
  }

  const client = new SynapseApiClient(API_URL);

  // 1. Authenticate / Register Bot User
  try {
    await client.loginOrRegister();
  } catch (err) {
    console.error('❌ Failed to authenticate bot on Synapse platform:', err.message);
    return;
  }

  // 2. Initialize Gemini AI Client
  let genAI = null;
  let model = null;
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  // Track posts we have already replied to in memory
  const processedPostIds = new Set();

  async function checkAndInteract() {
    try {
      console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Checking Synapse AI feed for new technical discussions...`);
      const feedData = await client.getFeed({ feed: 'for-you', limit: 10 });
      const posts = feedData.posts || [];

      console.log(`📊 Found ${posts.length} discussions in feed.`);

      for (const post of posts) {
        // Skip posts by the bot itself
        if (post.user_id === client.botUser.id || post.author_username === client.botUser.username) {
          continue;
        }

        // Check full post details to see if bot already commented
        const postDetails = await client.getPostDetails(post.id);
        const fullPost = postDetails.post;
        const comments = fullPost.comments || [];

        const hasAlreadyCommented = comments.some(
          c => c.user_id === client.botUser.id || c.author_username === client.botUser.username
        );

        if (hasAlreadyCommented || processedPostIds.has(post.id)) {
          processedPostIds.add(post.id);
          continue;
        }

        console.log(`\n🎯 New discussion detected from ${post.author_name} (@${post.author_username}):`);
        console.log(`   Title/Category: [${post.category}] | Post ID: #${post.id}`);
        console.log(`   Snippet: "${post.content.substring(0, 90)}..."`);

        let replyContent = '';
        let replyCodeSnippet = null;
        let replyCodeLang = 'python';

        if (model) {
          console.log(`🧠 Invoking Gemini AI to formulate technical peer review response...`);
          
          const prompt = `
You are ${BOT_PERSONA.name}, a ${BOT_PERSONA.role} at ${BOT_PERSONA.company}.
Your expertise includes: ${BOT_PERSONA.expertise}.
Your communication tone is: ${BOT_PERSONA.tone}.

You are reading a technical discussion posted on the Synapse AI social media network by ${post.author_name} (@${post.author_username}, ${post.author_role} at ${post.author_company}).

---
POST CATEGORY: ${post.category}
POST CONTENT:
${post.content}

${post.code_snippet ? `POST CODE SNIPPET (${post.code_language}):\n\`\`\`${post.code_language}\n${post.code_snippet}\n\`\`\`` : ''}
---

TASK:
Write a thoughtful, authentic, high-value technical comment responding to this post.
- Acknowledge a specific technical nuance in their approach.
- Provide a complementary benchmark, practical insight, optimization tip, or constructive question.
- If relevant, provide a 3-8 line code snippet illustration (or leave code null if not needed).
- Format your output strictly in JSON:
{
  "comment": "Your 2-4 sentence comment text",
  "code_snippet": "Optional concise code snippet or null",
  "code_language": "python"
}
`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();

          try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            replyContent = parsed.comment;
            replyCodeSnippet = parsed.code_snippet;
            replyCodeLang = parsed.code_language || 'python';
          } catch (e) {
            replyContent = responseText.replace(/```[a-z]*/g, '').trim();
          }
        } else {
          // Fallback if Gemini API key not yet provided
          replyContent = `Fascinating insight on ${post.category}! In our tests, optimizing memory access patterns and continuous batching yielded significant throughput improvements on similar workloads. Great breakdown!`;
        }

        // 1. Post Comment
        console.log(`💬 Publishing bot comment: "${replyContent.substring(0, 80)}..."`);
        await client.addComment(post.id, {
          content: replyContent,
          code_snippet: replyCodeSnippet,
          code_language: replyCodeLang
        });

        // 2. Auto Like Post
        if (AUTO_LIKE && !post.is_liked) {
          await client.likePost(post.id);
          console.log(`❤️ Liked post #${post.id}`);
        }

        // 3. Auto Follow Author
        if (AUTO_FOLLOW && !post.is_author_followed) {
          await client.followUser(post.user_id);
          console.log(`👤 Followed author @${post.author_username}`);
        }

        processedPostIds.add(post.id);
        console.log(`✅ Successfully interacted with post #${post.id}`);
      }
    } catch (err) {
      console.error('⚠️ Bot loop error:', err.message);
    }
  }

  // Run initial check
  await checkAndInteract();

  // Schedule periodic polling
  console.log(`\n⏳ Autonomous bot is active! Watching feed every ${POLL_INTERVAL / 1000} seconds... (Press Ctrl+C to stop)`);
  setInterval(checkAndInteract, POLL_INTERVAL);
}

runBot().catch(err => {
  console.error('Fatal bot error:', err);
});
