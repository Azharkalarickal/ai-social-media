# ⚡ Synapse AI — Professional Social Network for AI & IT Pioneers

A next-generation social network tailored for **AI Researchers, Machine Learning Engineers, and IT Professionals** to discuss large language models (LLMs), neural architectures, benchmarks, inference optimizations, and code snippets.

Powered by a **Node.js / Express backend**, a sleek **React (Vite) dark cyber frontend**, and **Hostinger Remote MySQL Database**.

---

## 🌟 Key Features

### 1. 🔐 Authentication & Identity
- **Sign In & Registration**: Create an account with name, unique username, password, AI role title, company/lab, tech stack skills, and bio.
- **JWT Authentication**: Token-based authentication with bcrypt-hashed passwords.
- **Fast Demo Accounts**: Pre-configured instant sign-in for testing (`elena_ai`, `marcus_mlops`, `sophia_agents`).

### 2. 📰 Interactive Tech Feed
- **Discussion Stream**: Filter by **For You**, **Following**, and **Trending** topics.
- **AI Domain Categories**: Filter discussions by *Reasoning & LLMs*, *MLOps & Infrastructure*, *Autonomous Agents*, *Computer Vision*, *Generative AI*, and *Open Source AI*.
- **Code Snippet Highlighting**: Post & read Python (PyTorch/Transformers), Bash/CLI, JavaScript, CUDA/C++, and SQL scripts with 1-click clipboard copying.
- **Tag Search & Filtering**: Explore hot tags (`#DeepSeek-R1`, `#vLLM`, `#LangGraph`, `#PyTorch`, `#TestTimeCompute`).

### 3. 💬 User Interactions & Discussions
- **Like & Unlike**: Instant animated reactions with dynamic counters.
- **Threaded Technical Comments**: Reply with detailed text and attach code snippets directly in discussion threads.
- **Follow / Unfollow System**: Connect with AI researchers, lead scientists, and MLOps architects.
- **Followers & Following Modals**: View interactive lists of connected engineers with 1-click follow toggle.
- **Bookmarks & Saved Snippets**: Save architecture designs and scripts for quick reference.
- **Share**: Copy direct discussion links with one click.

### 4. 👤 Professional Profiles
- Complete profile overview with role, company, skills badge pills, bio, and publication count.
- Dedicated user post feed.
- Profile editor modal to update details in real time.

### 5. 🗄️ Hostinger Remote MySQL Database
- Auto-initializes schema (`users`, `posts`, `post_tags`, `likes`, `comments`, `follows`, `bookmarks`) on first run.
- Automatically seeds initial AI discussions and researcher profiles.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Install Dependencies
```bash
# Install root (backend) dependencies
npm install

# Install client (frontend) dependencies
npm install --prefix client
```

### 3. Configure Environment Variables
Verify `.env` in the root folder (already configured for Hostinger MySQL):
```env
DB_HOST=qudraw.com
DB_USER=u918480384_aisocialmedia
DB_PASSWORD=S6uoFeq!
DB_NAME=u918480384_aisocialmedia
DB_PORT=3306

PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_synapse_ai_technology_network_2026
```

### 4. Run Locally
```bash
# Runs backend on http://localhost:5000 and frontend on http://localhost:5173 concurrently
npm run dev
```

---

## 🌐 Deploy to Render.com (Step-by-Step)

### Step 1: Push your code to your GitHub Repository
Open your terminal in this project directory:
```bash
# Initialize git repository
git init

# Add all project files
git add .

# Commit changes
git commit -m "feat: complete Synapse AI social media application with Hostinger MySQL"

# Rename branch to main
git branch -M main

# Add your GitHub remote (replace with your GitHub repository URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ai-social-media.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [Render.com](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`ai-social-media`).
3. Configure the settings:
   - **Name**: `synapse-ai-social-media`
   - **Environment**: `Node`
   - **Region**: Closest to your database (e.g. Frankfurt / Singapore / Oregon)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `DB_HOST`: `qudraw.com` (or your Hostinger MySQL Host IP)
   - `DB_USER`: `u918480384_aisocialmedia`
   - `DB_PASSWORD`: `S6uoFeq!`
   - `DB_NAME`: `u918480384_aisocialmedia`
   - `DB_PORT`: `3306`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your_random_secure_secret_key`
5. Click **Deploy Web Service**! Render will automatically install dependencies, build the React frontend into `client/dist`, and start the Node Express server.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Canvas Confetti, Vanilla CSS Glassmorphism Design System
- **Backend**: Node.js, Express.js, MySQL2, JSON Web Tokens (JWT), BcryptJS
- **Database**: Hostinger Cloud MySQL
- **Deployment**: Render Web Service (`render.yaml`)
