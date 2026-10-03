-- =====================================================================
-- SYNAPSE AI - HOSTINGER MYSQL DATABASE SCHEMA & INITIAL DATA
-- Database: u918480384_aisocialmedia
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
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

-- 2. Posts Table
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  code_snippet MEDIUMTEXT,
  code_language VARCHAR(50) DEFAULT 'python',
  category VARCHAR(50) DEFAULT 'Generative AI',
  media_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (category),
  INDEX (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Post Tags Table
CREATE TABLE post_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  INDEX (tag),
  INDEX (post_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Likes Table
CREATE TABLE likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_post_like (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Comments Table
CREATE TABLE comments (
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

-- 6. Follows Table
CREATE TABLE follows (
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

-- 7. Bookmarks Table
CREATE TABLE bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_bookmark (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- INITIAL SEED DATA (Default password for all users: password123)
-- =====================================================================

-- Default bcrypt hash for 'password123': $2a$10$7zB35s7cW8QyF9f.gD0qte6FjIeL9U4WlGz7yYw6hM8N0O1P2Q3R4
INSERT INTO users (id, name, username, email, password_hash, role_title, company, bio, avatar_url, skills, github_url, linkedin_url)
VALUES 
(1, 'Dr. Elena Rostova', 'elena_ai', 'elena@deepmind-research.ai', '$2a$10$7zB35s7cW8QyF9f.gD0qte6FjIeL9U4WlGz7yYw6hM8N0O1P2Q3R4', 'Principal AI Scientist & LLM Architect', 'Autonomous Neural Labs', 'Researching reasoning topologies in LLMs, test-time compute scaling, and multi-agent coordination frameworks.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'PyTorch, vLLM, DeepSeek-R1, Chain-of-Thought, CUDA', 'https://github.com', 'https://linkedin.com'),
(2, 'Marcus Vance', 'marcus_mlops', 'marcus@cloudscale.io', '$2a$10$7zB35s7cW8QyF9f.gD0qte6FjIeL9U4WlGz7yYw6hM8N0O1P2Q3R4', 'Staff MLOps & Distributed Systems Lead', 'TensorScale Cloud', 'Deploying high-throughput GPU inference clusters (H100/B200), TensorRT-LLM, Ray, and Kubernetes orchestration.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Kubernetes, Ray, Triton, TensorRT, Terraform, Docker', 'https://github.com', 'https://linkedin.com'),
(3, 'Sophia Patel', 'sophia_agents', 'sophia@agentic-systems.org', '$2a$10$7zB35s7cW8QyF9f.gD0qte6FjIeL9U4WlGz7yYw6hM8N0O1P2Q3R4', 'AI Agent Architect & Knowledge Graph Engineer', 'Cognitive Foundry', 'Designing self-healing agent pipelines with GraphRAG, LangGraph, and hierarchical memory systems.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 'LangGraph, GraphRAG, Neo4j, DSPy, Function Calling', 'https://github.com', 'https://linkedin.com'),
(4, 'Azhar Ali', 'azhar_ali', 'azharkka@gmail.com', '$2a$10$7zB35s7cW8QyF9f.gD0qte6FjIeL9U4WlGz7yYw6hM8N0O1P2Q3R4', 'Lead AI Architect', 'Synapse AI Labs', 'Building next-generation distributed AI systems and autonomous agent networks.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'PyTorch, vLLM, DeepSeek-R1, MLOps, CUDA', 'https://github.com', 'https://linkedin.com');

-- Seed Posts
INSERT INTO posts (id, user_id, category, content, code_snippet, code_language)
VALUES
(1, 1, 'Reasoning & LLMs', 'Deep dive into Test-Time Compute (TTC) scaling vs Pretraining compute scaling:
Increasing test-time verification budget by 4x yielded a +28% benchmark leap without touching model weights. Here is our step-level verification loop in PyTorch:', 
'import torch
from transformers import AutoModelForCausalLM

def evaluate_reasoning_step(generator, verifier, prompt, num_candidates=5):
    inputs = generator.tokenizer(prompt, return_tensors="pt").to("cuda")
    candidates = generator.generate(**inputs, num_return_sequences=num_candidates, do_sample=True, temperature=0.7)
    return max([(verifier.score(prompt, c), c) for c in candidates], key=lambda x: x[0])[1]', 'python'),

(2, 2, 'MLOps & Infrastructure', 'Optimizing GPU memory utilization for high-concurrency vLLM serving clusters:
PagedAttention with KV-cache chunking reduced our TTFT (Time To First Token) by 42% on 8x H100 SXM nodes. Make sure to configure prefix caching!',
'python3 -m vllm.entrypoints.openai.api_server \\
    --model deepseek-ai/DeepSeek-V3 \\
    --tensor-parallel-size 8 \\
    --gpu-memory-utilization 0.94 \\
    --enable-prefix-caching \\
    --port 8000', 'bash');

-- Seed Tags
INSERT INTO post_tags (post_id, tag) VALUES (1, 'DeepSeek-R1'), (1, 'LLMs'), (1, 'Reasoning'), (2, 'vLLM'), (2, 'MLOps'), (2, 'H100');

-- Seed Likes
INSERT INTO likes (user_id, post_id) VALUES (2, 1), (3, 1), (4, 1), (1, 2);

-- Seed Follows
INSERT INTO follows (follower_id, following_id) VALUES (1, 2), (2, 1), (4, 1), (4, 2);
