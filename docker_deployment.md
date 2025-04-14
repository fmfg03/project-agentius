# MCP System - Docker Deployment

This document provides instructions for deploying the MCP System using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- MongoDB instance (can be containerized or external)
- OAuth provider credentials (GitHub, Google, etc.)

## Project Structure

Ensure your project structure looks like this:

```
mcp-system/
├── backend/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
└── docker-compose.yml
```

## Docker Configuration

### Backend Dockerfile

Create a `Dockerfile` in the backend directory:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Frontend Dockerfile

Create a `Dockerfile` in the frontend directory:

```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create an `nginx.conf` file in the frontend directory:

```
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker Compose

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3'

services:
  mongodb:
    image: mongo:latest
    container_name: mcp-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    networks:
      - mcp-network

  backend:
    build: ./backend
    container_name: mcp-backend
    restart: always
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      - PORT=5000
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/mcp-system?authSource=admin
      - JWT_SECRET=your-secure-jwt-secret
      - OAUTH_CLIENT_ID=your-oauth-client-id
      - OAUTH_CLIENT_SECRET=your-oauth-client-secret
      - OAUTH_CALLBACK_URL=http://localhost:5000/api/auth/callback
      - FRONTEND_URL=http://localhost:3000
    networks:
      - mcp-network

  frontend:
    build: ./frontend
    container_name: mcp-frontend
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge

volumes:
  mongodb_data:
```

## Deployment Steps

1. Build and start the containers:

```bash
docker-compose up -d
```

2. Check if the containers are running:

```bash
docker-compose ps
```

3. View logs:

```bash
docker-compose logs -f
```

## Environment Configuration

For production deployment, update the environment variables in the `docker-compose.yml` file:

- Replace `JWT_SECRET` with a secure random string
- Update `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` with your OAuth provider credentials
- Update `OAUTH_CALLBACK_URL` and `FRONTEND_URL` with your production URLs
- Update `MONGODB_URI` if using an external MongoDB instance

## Scaling

For production environments, consider using Docker Swarm or Kubernetes for orchestration and scaling:

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy the stack
docker stack deploy -c docker-compose.yml mcp-system
```

## Backup and Restore

To backup the MongoDB data:

```bash
docker exec -it mcp-mongodb mongodump --out /data/backup
docker cp mcp-mongodb:/data/backup ./backup
```

To restore from backup:

```bash
docker cp ./backup mcp-mongodb:/data/
docker exec -it mcp-mongodb mongorestore /data/backup
```

## Troubleshooting

- If the frontend cannot connect to the backend, check the `REACT_APP_API_URL` environment variable
- If the backend cannot connect to MongoDB, check the `MONGODB_URI` environment variable
- Check container logs for error messages: `docker-compose logs -f service_name`
