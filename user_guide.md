# MCP System User Guide

## Introduction

The MCP System (Multi-Client Protocol) is a collaborative platform that leverages Claude and ChatGPT as autonomous agents for website development. The system implements a dual-agent architecture where one acts as a Builder and the other as a Judge, with the ability to switch roles as needed.

This guide will help you understand how to use the MCP System effectively.

## Getting Started

### Logging In

1. Navigate to the MCP System login page
2. Click "Sign in with OAuth" to authenticate using your preferred OAuth provider
3. You will be redirected to the Dashboard after successful authentication

### Setting Up Your Profile

Before using the system, configure your profile settings:

1. Click on your profile icon in the top-right corner and select "Profile"
2. In the "API Keys" tab:
   - Enter your Claude API key from Anthropic
   - Enter your ChatGPT API key from OpenAI
3. In the "Preferences" tab:
   - Set your default Builder and Judge models
   - Choose your preferred technology stack
4. In the "Advanced" tab (optional):
   - Configure storage settings
   - Set up notification webhooks

## Creating a Project

1. From the Dashboard, click "New Project"
2. Enter a project name and description
3. Select a technology stack (Next.js, Flask, Static HTML, etc.)
4. Click "Create Project"

## Working with Conversations

### Starting a Conversation

1. From the Project Details page, click "New Conversation"
2. Enter a title for the conversation
3. Select the Builder and Judge models (defaults to your profile preferences)
4. Click "Create Conversation"

### Using the Conversation Interface

The Conversation page has several key components:

1. **Chat Interface**: The main area where you interact with the Builder and Judge agents
2. **Role Tabs**: Switch between Builder and Judge to direct your prompts
3. **Code Editor**: Access the integrated code editor for viewing and modifying code
4. **Preview Panel**: See a live preview of the code being developed

### Interacting with Agents

1. Type your prompt in the input field at the bottom of the chat
2. Select which agent to send the prompt to (Builder or Judge)
3. Click "Send" or press Enter

### Working with Code

1. Click the "Code Editor" button to open the integrated editor
2. View and edit code directly in the Monaco/VS Code-style editor
3. Toggle the preview panel to see the results
4. Approve or reject code changes using the buttons provided

### Role Switching

1. Click the "Switch Roles" button to swap the Builder and Judge roles
2. This is useful when you want to change the perspective or expertise

## Managing Projects

### Viewing Projects

The Dashboard displays all your projects with:
- Project name and description
- Current status
- Creation date
- Quick access buttons

### Project Details

Click on a project to view its details:
- Project information
- List of conversations
- Project assets
- Development progress

### Deleting Projects

1. From the Dashboard, click the delete icon next to a project
2. Confirm the deletion in the dialog
3. Note: This action cannot be undone and will delete all associated conversations and assets

## Advanced Features

### LangChain Integration

The MCP System uses LangChain for enhanced context-aware reasoning:

- **Intelligent Memory Management**: The system automatically summarizes long conversations to optimize token usage while preserving important information
- **Role-Specific Memory**: Each agent maintains specialized memory based on its role (Builder remembers code snippets and decisions, Judge remembers feedback and suggestions)
- **Context-Aware Reasoning**: Agents have access to project details, conversation history, and role-specific memory to provide more coherent and consistent responses

### Memory Management

The system maintains persistent memory across sessions:
- Each agent has access to the full project brief
- Ongoing transcript is maintained
- Role-based context is preserved
- Memory is saved per project folder and reusable in future sessions

### Debugging Tools

For troubleshooting:
1. Access the "Advanced" tab in your profile
2. Toggle developer tools to show memory and inspect prompts
3. View the transcript and error logs

## Best Practices

1. **Clear Instructions**: Provide clear, specific instructions to the agents
2. **Role Specialization**: Use the Builder for implementation tasks and the Judge for critique and review
3. **Iterative Development**: Work in small, incremental steps
4. **Review Code**: Always review and test code before approving
5. **Save Progress**: Regularly save important assets and code

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your Claude and ChatGPT API keys are valid and have sufficient credits
2. **Connection Issues**: Check your internet connection and refresh the page
3. **Agent Not Responding**: Try switching roles or starting a new conversation
4. **Code Preview Not Working**: Check for JavaScript errors in the console

### Getting Help

If you encounter issues not covered in this guide:
1. Check the FAQ section
2. Contact support through the help button
3. Report bugs through the feedback form
