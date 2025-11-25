# Deployment Guide

## Backend Deployment

The backend is a Node.js application that can be deployed to any container-based hosting service (AWS ECS, Google Cloud Run, DigitalOcean App Platform, Railway, Render, etc.).

### Docker Build

Create a `backend/Dockerfile` to package the API/worker. Example:

```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY contracts/package.json contracts/
COPY packages packages
RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app/backend
RUN pnpm db:entities:gen
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=build /app/backend/dist ./dist
COPY backend/package.json ./
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

Build it with:

```bash
docker build -f backend/Dockerfile -t my-backend .
```

2.  **Environment Variables**:
    Ensure the following variables are set in your production environment:
    - `DATABASE_URL`: Connection string to your Postgres database.
    - `REDIS_URL`: Connection string to your Redis instance.
    - `PORT`: Port to listen on (default 3000).
    - `ROLE`: Set to `all` for single-container deployments, or split into `api` and `worker` services.

### Database Migrations

Run migrations before starting the new version of the app. This can be done via a release command or an init container.

```bash
node dist/scripts/migrations-up.js
# or via pnpm if available
pnpm db:migrate:up
```

## Frontend Deployment

The frontend applications are React-Vite based Single Page Applications (SPAs). They can be deployed to any static site host (Cloudflare Pages, Vercel, Netlify, AWS S3+CloudFront).

### Cloudflare Pages (Recommended)

1.  **Build**:

    ```bash
    pnpm build --filter=frontend/user_app
    ```

2.  **Output Directory**:
    The build output is located in `frontend/user_app/dist`.

3.  **Routing**:
    Ensure your host is configured to rewrite all 404s to `index.html` (SPA routing).

### Environment Variables

- `VITE_RPC_URL`: The URL of your deployed backend API (e.g., `https://api.myapp.com`).

## Infrastructure (Optional)

The `infra` folder contains a `docker-compose.yml` for local development. For production, we recommend managed services:

- **Database**: AWS RDS, Google Cloud SQL, Neon, Supabase.
- **Redis**: AWS ElastiCache, Google Cloud Memorystore, Upstash.
