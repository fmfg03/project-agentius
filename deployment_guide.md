# MCP System Deployment Guide

This document outlines the steps to deploy the MCP System to AWS.

## Prerequisites

- AWS account with appropriate permissions
- MongoDB Atlas account (or other MongoDB hosting)
- Node.js and npm installed locally
- OAuth provider credentials (GitHub, Google, etc.)

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mcp-system

# JWT
JWT_SECRET=your-secure-jwt-secret

# OAuth
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
OAUTH_CALLBACK_URL=https://your-api-domain.com/api/auth/callback

# Frontend
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=https://your-api-domain.com
```

## Backend Deployment to AWS Elastic Beanstalk

1. Install the AWS CLI and EB CLI:
```bash
pip install awscli
pip install awsebcli
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Initialize Elastic Beanstalk in the backend directory:
```bash
cd mcp-system/backend
eb init
```

4. Create an Elastic Beanstalk environment:
```bash
eb create mcp-system-backend
```

5. Deploy the application:
```bash
eb deploy
```

## Frontend Deployment to AWS Amplify

1. Build the frontend:
```bash
cd mcp-system/frontend
npm run build
```

2. Install the AWS Amplify CLI:
```bash
npm install -g @aws-amplify/cli
```

3. Configure Amplify:
```bash
amplify configure
```

4. Initialize Amplify in the frontend directory:
```bash
amplify init
```

5. Add hosting:
```bash
amplify add hosting
```

6. Publish the frontend:
```bash
amplify publish
```

## MongoDB Setup

1. Create a MongoDB Atlas cluster
2. Configure network access to allow connections from your AWS services
3. Create a database user with appropriate permissions
4. Update the `MONGODB_URI` environment variable with your connection string

## OAuth Configuration

1. Register your application with your OAuth provider
2. Configure the callback URL to point to your deployed backend
3. Update the OAuth environment variables with your client ID and secret

## SSL Configuration

1. Obtain SSL certificates for your domains
2. Configure SSL in AWS Elastic Beanstalk and Amplify

## Monitoring and Logging

1. Set up CloudWatch for monitoring and logging
2. Configure alerts for critical errors
3. Set up performance monitoring

## Scaling Configuration

1. Configure auto-scaling rules in Elastic Beanstalk
2. Set up a load balancer if needed
3. Configure MongoDB Atlas scaling options

## Backup and Recovery

1. Set up automated backups for MongoDB
2. Configure backup retention policies
3. Test recovery procedures

## Security Considerations

1. Ensure all API keys and secrets are stored securely
2. Configure appropriate IAM roles and permissions
3. Set up AWS WAF for additional security
4. Implement rate limiting for API endpoints
