const mysql = require('mysql2/promise');
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
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

console.log(`🔌 Initializing database connection to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} as ${dbConfig.user}...`);

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to Hostinger MySQL Database!');

    // 1. Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(150) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role_title VARCHAR(150) DEFAULT 'AI & IT Professional',
        company VARCHAR(150) DEFAULT 'AI Research / Tech',
        bio TEXT,
        avatar_url TEXT,
        skills VARCHAR(255) DEFAULT 'PyTorch, Transformers, LLMs, MLOps',
        github_url VARCHAR(255) DEFAULT '',
        linkedin_url VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Posts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        code_snippet MEDIUMTEXT,
        code_language VARCHAR(50) DEFAULT 'python',
        category VARCHAR(50) DEFAULT 'Generative AI',
        media_url TEXT,
        paper_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (category),
        INDEX (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Post Tags table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        tag VARCHAR(50) NOT NULL,
        INDEX (tag),
        INDEX (post_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Likes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_post_like (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Comments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        content TEXT NOT NULL,
        code_snippet TEXT,
        code_language VARCHAR(50) DEFAULT 'python',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Follows table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id),
        INDEX (follower_id),
        INDEX (following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Bookmarks / Saved table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_bookmark (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Database schema verified and tables ready.');

    // Check if initial seed is needed
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log('🌱 Database is empty. Seeding initial AI tech leaders and technical discussions...');
      await seedDatabase(connection);
    }

    connection.release();
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      console.warn('⚠️ Hostinger Remote MySQL connection could not be reached directly from this local network. Please verify Hostinger Remote MySQL settings or check IP whitelist.');
    }
  }
}

async function seedDatabase(connection) {
  try {
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // Seed realistic IT & AI professionals
    const seedUsers = [
      {
        name: 'Dr. Elena Rostova',
        username: 'elena_ai',
        email: 'elena@deepmind-research.ai',
        role_title: 'Principal AI Scientist & LLM Architect',
        company: 'Autonomous Neural Labs',
        bio: 'Researching reasoning topologies in LLMs, test-time compute scaling, and multi-agent coordination frameworks.',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        skills: 'PyTorch, vLLM, DeepSeek-R1, Chain-of-Thought, CUDA',
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com'
      },
      {
        name: 'Marcus Vance',
        username: 'marcus_mlops',
        email: 'marcus@cloudscale.io',
        role_title: 'Staff MLOps & Distributed Systems Lead',
        company: 'TensorScale Cloud',
        bio: 'Deploying high-throughput GPU inference clusters (H100/B200), TensorRT-LLM, Ray, and Kubernetes orchestration.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        skills: 'Kubernetes, Ray, Triton, TensorRT, Terraform, Docker',
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com'
      },
      {
        name: 'Aiden Chen',
        username: 'aiden_vision',
        email: 'aiden@visionary-ai.tech',
        role_title: 'Computer Vision & Spatial Intelligence Specialist',
        company: 'Spatial Robotics AI',
        bio: 'Working on Multimodal Transformers, Diffusion Policies for Robotics, and 3D Gaussian Splatting.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        skills: 'Vision Transformers, CLIP, NeRF, 3DGS, OpenCV, JAX',
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com'
      },
      {
        name: 'Sophia Patel',
        username: 'sophia_agents',
        email: 'sophia@agentic-systems.org',
        role_title: 'AI Agent Architect & Knowledge Graph Engineer',
        company: 'Cognitive Foundry',
        bio: 'Designing self-healing agent pipelines with GraphRAG, LangGraph, and hierarchical memory systems.',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        skills: 'LangGraph, GraphRAG, Neo4j, DSPy, Function Calling',
        github_url: 'https://github.com',
        linkedin_url: 'https://linkedin.com'
      }
    ];

    const userIds = [];
    for (const u of seedUsers) {
      const [res] = await connection.query(`
        INSERT INTO users (name, username, email, password_hash, role_title, company, bio, avatar_url, skills, github_url, linkedin_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [u.name, u.username, u.email, defaultPasswordHash, u.role_title, u.company, u.bio, u.avatar_url, u.skills, u.github_url, u.linkedin_url]);
      userIds.push(res.insertId);
    }

    // Follow relationships between seeded users
    await connection.query(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [userIds[0], userIds[1]]);
    await connection.query(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [userIds[0], userIds[2]]);
    await connection.query(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [userIds[1], userIds[0]]);
    await connection.query(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [userIds[2], userIds[0]]);
    await connection.query(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [userIds[3], userIds[0]]);
    await connection.query(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [userIds[3], userIds[1]]);

    // Seed rich technical posts
    const seedPosts = [
      {
        user_id: userIds[0],
        category: 'Reasoning & LLMs',
        content: `Deep dive into Test-Time Compute (TTC) scaling vs Pretraining compute scaling:
We benchmarked dynamic search rollout topologies (Monte Carlo Tree Search + PRM verification) against raw token generation on difficult competition math and code synthesis problems.

Key takeaway: Increasing test-time verification budget by 4x yielded a +28% benchmark leap without touching model weights. Here is the distilled verification loop in PyTorch / HuggingFace Transformers:`,
        code_snippet: `import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def evaluate_reasoning_step(generator, verifier, prompt, num_candidates=5):
    inputs = generator.tokenizer(prompt, return_tensors="pt").to("cuda")
    candidates = generator.generate(
        **inputs,
        num_return_sequences=num_candidates,
        do_sample=True,
        temperature=0.7,
        max_new_tokens=512
    )
    
    # Process-Supervised Reward Model (PRM) scoring
    scores = []
    for cand in candidates:
        decoded = generator.tokenizer.decode(cand, skip_special_tokens=True)
        score = verifier.score_step(prompt, decoded)
        scores.append((score, decoded))
        
    # Return highest reward trajectory
    best_trajectory = max(scores, key=lambda x: x[0])
    return best_trajectory

print("✓ Step-level verification pipeline ready")`,
        code_language: 'python',
        tags: ['LLMs', 'Reasoning', 'TestTimeCompute', 'DeepSeek', 'PyTorch']
      },
      {
        user_id: userIds[1],
        category: 'MLOps & Infrastructure',
        content: `Optimizing GPU memory utilization for high-concurrency vLLM serving clusters:
PagedAttention with KV-cache chunking reduced our TTFT (Time To First Token) by 42% on 8x H100 SXM nodes.
If you're running multi-tenant enterprise RAG pipelines, make sure to configure prefix caching and continuous batching!

Here is our production vLLM startup config:`,
        code_snippet: `python3 -m vllm.entrypoints.openai.api_server \\
    --model deepseek-ai/DeepSeek-V3 \\
    --tensor-parallel-size 8 \\
    --gpu-memory-utilization 0.94 \\
    --max-model-len 32768 \\
    --enable-prefix-caching \\
    --block-size 16 \\
    --kv-cache-dtype auto \\
    --port 8000`,
        code_language: 'bash',
        tags: ['MLOps', 'vLLM', 'H100', 'Inference', 'DistributedSystems']
      },
      {
        user_id: userIds[3],
        category: 'Autonomous Agents',
        content: `Architecting Hierarchical Multi-Agent Systems with State Graph Routing:
Standard linear chains fall apart when dealing with ambiguous tasks. In our latest enterprise deployment, we separated the Router, Critic, Executor, and Verification nodes using stateful checkpointing.

Notice how state transitions validate tool schema execution before passing context to downstream specialists.`,
        code_snippet: `from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    current_agent: str
    verification_passed: bool
    intermediate_artifacts: dict

def supervisor_router(state: AgentState) -> str:
    if not state.get("verification_passed"):
        return "verifier_agent"
    if "code" in state["intermediate_artifacts"]:
        return "execution_sandbox_agent"
    return "synthesis_agent"`,
        code_language: 'python',
        tags: ['Agents', 'LangGraph', 'AIWorkflows', 'StateMachines']
      },
      {
        user_id: userIds[2],
        category: 'Computer Vision',
        content: `Spatial Intelligence & 3D Gaussian Splatting (3DGS) meets Robotics:
We are combining real-time camera feeds with 3DGS radiance representations so robotic arms can predict volumetric collision envelopes with millimeter precision at 60 FPS!

Excited to publish the paper next month at CVPR. What are your thoughts on real-time neural rendering in physical automation?`,
        code_snippet: `import torch
import gsplat

# Initialize 3D Gaussians position & spherical harmonics
means3d = torch.randn(100000, 3, device="cuda")
scales = torch.exp(torch.randn(100000, 3, device="cuda"))
quats = torch.randn(100000, 4, device="cuda")
colors = torch.sigmoid(torch.randn(100000, 3, device="cuda"))

# Forward rasterization pass
renders, alphas, meta = gsplat.rasterization(
    means=means3d,
    scales=scales,
    quats=quats,
    colors=colors,
    viewmats=torch.eye(4, device="cuda").unsqueeze(0),
    Ks=torch.eye(3, device="cuda").unsqueeze(0),
    width=1920,
    height=1080
)`,
        code_language: 'python',
        tags: ['ComputerVision', '3DGS', 'SpatialAI', 'Robotics', 'CVPR']
      }
    ];

    for (const post of seedPosts) {
      const [pRes] = await connection.query(`
        INSERT INTO posts (user_id, content, code_snippet, code_language, category)
        VALUES (?, ?, ?, ?, ?)
      `, [post.user_id, post.content, post.code_snippet, post.code_language, post.category]);
      const postId = pRes.insertId;

      for (const tag of post.tags) {
        await connection.query(`INSERT INTO post_tags (post_id, tag) VALUES (?, ?)`, [postId, tag]);
      }

      // Add sample likes
      await connection.query(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [userIds[1], postId]);
      await connection.query(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, [userIds[2], postId]);

      // Add a sample technical comment
      await connection.query(`
        INSERT INTO comments (user_id, post_id, content, code_snippet, code_language)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userIds[3],
        postId,
        'Excellent methodology! Have you measured the memory overhead difference between FP8 and BF16 during candidate ranking?',
        '# Example candidate token memory consumption\nmem_fp8 = num_tokens * hidden_dim * 1\nmem_bf16 = num_tokens * hidden_dim * 2',
        'python'
      ]);
    }

    console.log('✅ Seed completed with AI industry professionals, code snippets, tags, and comments.');
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
}

module.exports = {
  pool,
  initializeDatabase
};
