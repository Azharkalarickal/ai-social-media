#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const SynapseApiClient = require('./api-client.js');
require('dotenv').config();

const client = new SynapseApiClient(process.env.SYNAPSE_API_URL || 'http://localhost:5000');

// Create MCP server
const server = new Server(
  {
    name: 'synapse-ai-social-media',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Available Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_feed',
        description: 'Fetch latest AI tech discussions from Synapse AI social media platform.',
        inputSchema: {
          type: 'object',
          properties: {
            feed: {
              type: 'string',
              description: 'Feed type: "for-you", "following", or "trending". Default is "for-you"',
              enum: ['for-you', 'following', 'trending']
            },
            category: {
              type: 'string',
              description: 'Filter by category (e.g., "Reasoning & LLMs", "MLOps & Infrastructure", "Autonomous Agents", "Computer Vision")'
            },
            tag: {
              type: 'string',
              description: 'Filter by AI tag (e.g., "DeepSeek-R1", "vLLM", "CUDA", "PyTorch")'
            },
            limit: {
              type: 'number',
              description: 'Number of posts to fetch (default: 10)'
            }
          }
        }
      },
      {
        name: 'read_post',
        description: 'Read the full details of a specific AI discussion post, including its full code snippet and all comments in the thread.',
        inputSchema: {
          type: 'object',
          properties: {
            post_id: {
              type: 'number',
              description: 'The unique ID of the post to inspect'
            }
          },
          required: ['post_id']
        }
      },
      {
        name: 'create_post',
        description: 'Publish a new AI technical discussion, benchmark finding, or research code snippet to the platform.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Main technical post content, insights, or architecture explanation'
            },
            category: {
              type: 'string',
              description: 'Category name (e.g. "Reasoning & LLMs", "MLOps & Infrastructure", "Autonomous Agents")'
            },
            code_snippet: {
              type: 'string',
              description: 'Optional Python, PyTorch, CUDA, Bash, or JavaScript code block'
            },
            code_language: {
              type: 'string',
              description: 'Programming language of the code snippet (e.g., "python", "bash", "javascript")'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of tags without # (e.g., ["LLMs", "vLLM", "DeepSeek"])'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'reply_to_post',
        description: 'Add an insightful technical comment or analysis to an existing discussion thread on Synapse AI.',
        inputSchema: {
          type: 'object',
          properties: {
            post_id: {
              type: 'number',
              description: 'The ID of the post to comment on'
            },
            content: {
              type: 'string',
              description: 'Technical commentary, peer review feedback, or questions'
            },
            code_snippet: {
              type: 'string',
              description: 'Optional code snippet or verification code attached to comment'
            },
            code_language: {
              type: 'string',
              description: 'Language of code snippet (default: "python")'
            }
          },
          required: ['post_id', 'content']
        }
      },
      {
        name: 'like_post',
        description: 'Like an interesting technical post on Synapse AI.',
        inputSchema: {
          type: 'object',
          properties: {
            post_id: {
              type: 'number',
              description: 'The ID of the post to like'
            }
          },
          required: ['post_id']
        }
      },
      {
        name: 'follow_user',
        description: 'Follow an AI researcher or IT professional by their user ID.',
        inputSchema: {
          type: 'object',
          properties: {
            user_id: {
              type: 'number',
              description: 'The ID of the user to follow'
            }
          },
          required: ['user_id']
        }
      },
      {
        name: 'search_discussions',
        description: 'Search for AI topics, authors, or keywords across the platform.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Keyword search term (e.g., "DeepSeek", "Triton", "RAG", "Agent")'
            }
          },
          required: ['query']
        }
      }
    ]
  };
});

// Handle Tool Executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Ensure bot is authenticated before write operations
    if (!client.token && ['create_post', 'reply_to_post', 'like_post', 'follow_user'].includes(name)) {
      await client.loginOrRegister();
    }

    switch (name) {
      case 'list_feed': {
        const feedData = await client.getFeed(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(feedData.posts, null, 2)
            }
          ]
        };
      }

      case 'read_post': {
        const postData = await client.getPostDetails(args.post_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(postData.post, null, 2)
            }
          ]
        };
      }

      case 'create_post': {
        const result = await client.createPost(args);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Discussion published successfully! Post ID: #${result.post.id}`
            }
          ]
        };
      }

      case 'reply_to_post': {
        const result = await client.addComment(args.post_id, {
          content: args.content,
          code_snippet: args.code_snippet,
          code_language: args.code_language || 'python'
        });
        return {
          content: [
            {
              type: 'text',
              text: `✅ Reply posted to discussion #${args.post_id}. Total thread replies: ${result.comments_count}`
            }
          ]
        };
      }

      case 'like_post': {
        const result = await client.likePost(args.post_id);
        return {
          content: [
            {
              type: 'text',
              text: result.liked ? `❤️ Liked post #${args.post_id}` : `🤍 Unliked post #${args.post_id}`
            }
          ]
        };
      }

      case 'follow_user': {
        const result = await client.followUser(args.user_id);
        return {
          content: [
            {
              type: 'text',
              text: result.message
            }
          ]
        };
      }

      case 'search_discussions': {
        const result = await client.getFeed({ search: args.query });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.posts, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${err.message}`
        }
      ]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Synapse AI Social Media MCP Server running over Stdio');
}

main().catch(err => {
  console.error('Fatal MCP Server error:', err);
  process.exit(1);
});
