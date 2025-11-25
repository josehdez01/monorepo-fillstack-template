# Deployment Guide

## Backend Deployment

The backend is a Node.js application that can be deployed to any container-based hosting service (AWS ECS, Google Cloud Run, DigitalOcean App Platform, Railway, Render, etc.).

### Docker Build

The repository includes a `Dockerfile` (or you can create one) optimized for Turborepo.

1.  **Build the image**:

    ```bash
    docker build -f backend/Dockerfile -t my-backend .
    ```

    _Note: You may need to adjust the Dockerfile path or context depending on your setup._

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
