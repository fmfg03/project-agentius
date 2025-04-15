# MCP System Setup Guide

This guide will help you set up the MCP System with the provided API keys.

## Environment Setup

1. Create a `.env` file in the backend directory:

```bash
cd mcp-system/backend
cp env.sample .env
```

2. Edit the `.env` file and add your API keys:

```
# LLM API Keys
ANTHROPIC_API_KEY=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
OPENAI_API_KEY=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
OPENAI_ORG_ID=org-Oih5jcfYGlyLDHVX7bEpGKup

# GitHub Configuration
GITHUB_TOKEN=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
```

3. Set appropriate permissions for the `.env` file:

```bash
chmod 600 .env
```

## Starting the System

### Backend

1. Install dependencies:

```bash
cd mcp-system/backend
npm install
```

2. Start the backend server:

```bash
npm start
```

### Frontend

1. Install dependencies:

```bash
cd mcp-system/frontend
npm install
```

2. Start the frontend development server:

```bash
npm start
```

## Security Reminder

Remember to:

1. Rotate these API keys after development
2. Never commit the `.env` file to version control
3. Use different API keys for production
4. Consider using a secrets management service in production

## Testing the LangChain Integration

To verify the LangChain integration is working correctly:

1. Create a new user account
2. Navigate to the Profile page
3. Enter the API keys in the appropriate fields
4. Create a new project
5. Start a conversation
6. Send prompts to both the Builder and Judge agents
7. Verify that the responses include context from previous messages

## Troubleshooting

If you encounter issues with the LangChain integration:

1. Check the backend logs for any errors
2. Verify that the API keys are correctly set in the `.env` file
3. Ensure all dependencies are installed
4. Check that the LangChain services are properly imported in the controllers

For more detailed information, refer to the documentation in the `docs` directory.
