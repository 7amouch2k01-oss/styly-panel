# Deployment Guide

## GitHub Actions Workflows

This repository includes three automated workflows:

### 1. CI Workflow (`.github/workflows/ci.yml`)
**Trigger:** Push to `main`/`develop` or Pull Requests

**Steps:**
- Install dependencies with pnpm
- Run TypeScript type checking (`pnpm check`)
- Run tests (`pnpm test`)
- Build the project (`pnpm build`)
- Upload build artifacts to GitHub

**Status:** ✅ Automatically configured and ready

### 2. Deployment Workflow (`.github/workflows/deploy.yml`)
**Trigger:** Push to `main` branch or manual workflow dispatch

**Steps:**
- Install dependencies
- Build project with environment variables
- Deploy to your target platform
- Notify deployment status

**Setup Required:**
1. Configure deployment target (see options below)
2. Add required secrets to GitHub

### 3. Code Quality Workflow (`.github/workflows/code-quality.yml`)
**Trigger:** Push to `main`/`develop` or Pull Requests

**Steps:**
- Check code formatting with Prettier

**Status:** ✅ Automatically configured and ready

---

## Environment Setup

### Add Secrets to GitHub

Go to: **Settings → Secrets and variables → Actions** and add these secrets:

```
VITE_APP_ID              # Manus OAuth application ID
VITE_OAUTH_PORTAL_URL    # Manus login portal URL
VITE_FRONTEND_FORGE_API_URL    # Manus built-in APIs URL
VITE_FRONTEND_FORGE_API_KEY    # Bearer token for frontend APIs
DATABASE_URL             # MySQL/TiDB connection string (for deploy)
JWT_SECRET               # Session cookie signing secret (for deploy)
OAUTH_SERVER_URL         # Manus OAuth backend URL (for deploy)
BUILT_IN_FORGE_API_URL   # Manus built-in APIs server-side URL (for deploy)
BUILT_IN_FORGE_API_KEY   # Bearer token for server-side APIs (for deploy)
DEPLOY_TOKEN             # Your deployment platform token
```

### Create Production Environment

1. Go to **Settings → Environments**
2. Click **New environment** and name it `production`
3. (Optional) Set deployment branch rules to `main` only
4. Add any environment-specific secrets

---

## Deployment Options

### Option A: Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Add deployment step to `deploy.yml`:

```yaml
    - name: Deploy to Vercel
      run: vercel --prod
      env:
        VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### Option B: Deploy to Railway

1. Get Railway API token
2. Update `deploy.yml`:

```yaml
    - name: Deploy to Railway
      uses: raildotdev/deploy-action@main
      with:
        token: ${{ secrets.RAILWAY_TOKEN }}
        service: styly-panel
```

### Option C: Deploy to Docker (Self-hosted)

1. Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

2. Update `deploy.yml` to build and push Docker image:

```yaml
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: your-registry/styly-panel:latest
        registry: ${{ secrets.DOCKER_REGISTRY }}
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
```

### Option D: Deploy to GitHub Pages (Frontend only)

For static frontend deployment:

```yaml
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

---

## Monitoring & Debugging

### View Workflow Runs
- Go to **Actions** tab in your repository
- Click on a workflow to see detailed logs
- Check individual step outputs for errors

### Common Issues

**1. Build fails with missing env vars**
- Add missing secrets to GitHub Settings → Secrets
- Ensure secret names match the env vars in workflows

**2. Database migration fails**
- Ensure `DATABASE_URL` is correctly configured
- Run `pnpm db:push` locally first to test migrations

**3. Tests fail in CI but pass locally**
- Check for environment-specific issues
- Verify all dependencies are in `package.json`
- Check for hardcoded paths or local-only configs

---

## Local Testing

Test the build locally before pushing:

```bash
# Install dependencies
pnpm install

# Run type checks
pnpm check

# Run tests
pnpm test

# Build
pnpm build

# Run the built app
pnpm start
```

---

## Next Steps

1. ✅ Choose your deployment platform (Vercel, Railway, Docker, etc.)
2. ✅ Add required secrets to GitHub
3. ✅ Update `deploy.yml` with your deployment target
4. ✅ Create a pull request and merge to trigger workflows
5. ✅ Monitor the Actions tab for build/deployment status

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm Installation](https://pnpm.io/installation)
- [Manus Platform Docs](https://manus.ai)
