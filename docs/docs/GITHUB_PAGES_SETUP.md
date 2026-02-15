# GitHub Pages Deployment Setup

This document describes how BioPath is configured for GitHub Pages deployment.

## Overview

BioPath is deployed automatically to GitHub Pages whenever changes are pushed to the `main` branch. The frontend React application and documentation are served from the `docs/` folder at the root of the repository.

### Live Site
**https://contactdharsan-blip.github.io/BioPath/**

## Deployment Structure

```
docs/
├── index.html              # Main React app entry point
├── 404.html                # SPA routing configuration
├── _config.yml             # Jekyll/GitHub Pages config
├── assets/                 # Built CSS/JS files
├── docs/                   # Documentation subdirectory
│   ├── README.md
│   ├── USAGE.md
│   ├── DEPLOYMENT.md
│   └── ... (other docs)
└── ... (other static files)
```

## Configuration Files

### 1. Vite Configuration (`frontend/vite.config.ts`)

```typescript
export default defineConfig({
  base: '/BioPath/',  // Base URL for GitHub Pages
  // ... other config
})
```

The `base: '/BioPath/'` setting ensures all assets load correctly from the GitHub Pages URL structure.

### 2. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

Automated deployment pipeline that:
1. Triggers on push to `main` branch
2. Installs dependencies
3. Builds the frontend with `npm run build`
4. Copies build artifacts to `docs/` folder
5. Uploads to GitHub Pages

### 3. GitHub Pages Configuration (`docs/_config.yml`)

Jekyll configuration for GitHub Pages processing:
```yaml
title: BioPath
description: Chemical-Target-Pathway Analysis Framework
remote_theme: jekyll/minima
```

### 4. SPA Routing (`docs/404.html`)

Ensures single-page app routing works correctly on GitHub Pages by redirecting 404s to the main app.

## Manual Deployment

### One-time Setup

1. **Enable GitHub Pages in Repository Settings**
   - Go to: `Settings` → `Pages`
   - Source: Select `Deploy from a branch`
   - Branch: Select `main`
   - Folder: Select `/ (root)`
   - Click `Save`

### Deploy Manually

If automatic deployment doesn't work, you can deploy manually:

```bash
# From the repository root
npm run deploy

# Or manually:
cd frontend
npm run build
cd ..
node scripts/copy-to-docs.js
```

Then commit and push:
```bash
git add docs/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## Automatic Deployment

The GitHub Actions workflow automatically:
1. Builds the frontend when changes are pushed to `main`
2. Copies the build to the `docs/` folder
3. Updates GitHub Pages

**To enable automatic deployment:**

1. Ensure `.github/workflows/deploy.yml` exists (it's already committed)
2. Go to `Settings` → `Pages`
3. Verify source is set to `main` branch, `/ (root)` folder
4. GitHub Pages will automatically deploy on every push to `main`

## Build and Deployment Commands

### Frontend Build
```bash
cd frontend
npm install
npm run build
```

### Prepare for GitHub Pages
```bash
# Copies frontend build and docs to docs/ folder
npm run deploy

# Or manually:
node scripts/copy-to-docs.js
```

### Testing Locally
```bash
# Navigate to docs/ folder and serve locally
cd docs
python -m http.server 8000

# Visit: http://localhost:8000/BioPath/
```

## Troubleshooting

### Site Not Updating After Push

1. **Check Actions Tab**: Verify the workflow completed successfully
   - Go to `Actions` tab in repository
   - Check the latest workflow run

2. **Clear Browser Cache**: GitHub Pages might cache the old version
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

3. **Check GitHub Pages Settings**:
   - Go to `Settings` → `Pages`
   - Verify source is set to `main` branch

### Assets Not Loading

Make sure:
- `base: '/BioPath/'` is set in `frontend/vite.config.ts`
- Files are present in `docs/` folder
- GitHub Pages has finished deploying (check Actions tab)

### 404 on Navigation

This is expected behavior managed by `docs/404.html`. The SPA should redirect to the main app automatically. If not:
1. Try hard refresh
2. Clear browser cache
3. Check browser console for errors

## Development Workflow

### Local Development
```bash
cd frontend
npm run dev
```

### Before Pushing to Main
```bash
# Build and test
npm run build

# Verify it will deploy correctly
npm run deploy

# Review changes in docs/ folder
git status
```

### Pushing Changes
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add new analysis feature"

# Push to main (this triggers automatic deployment)
git push origin main

# Check deployment status
# - Visit: https://github.com/contactdharsan-blip/BioPath/actions
```

## Performance Optimization

The frontend is already optimized for GitHub Pages:
- Minified CSS and JavaScript
- Gzip compression enabled
- Static asset caching
- Lazy loading of modules

## Documentation Updates

Documentation files are automatically copied from `documentation/` to `docs/docs/`:

1. Add/update `.md` files in `documentation/` folder
2. Run `npm run deploy` or `node scripts/copy-to-docs.js`
3. Documentation will be available at `/docs/` subdirectory

## SSL/HTTPS

GitHub Pages automatically provides HTTPS for all sites. The site is served over:
- **https://contactdharsan-blip.github.io/BioPath/**

No additional configuration needed.

## Backend API Access

The frontend connects to backend APIs using absolute URLs. For GitHub Pages deployment:
- Local development: `http://localhost:8000/api`
- GitHub Pages deployment: Remote API or backend server

Update the API endpoint configuration in frontend code if needed:
- `frontend/src/api/` - API configuration files

## SEO and Meta Tags

GitHub Pages with Jekyll processes `_config.yml` for metadata. The current setup includes:
- Site title and description
- Remote theme for visual styling
- Proper meta tag generation

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Jekyll Documentation](https://jekyllrb.com/)

## Next Steps

To complete the GitHub Pages setup:

1. ✅ Configuration files committed
2. ✅ Workflow created
3. Go to repository `Settings` → `Pages`
4. Select `main` branch as source
5. Select `/` (root) folder
6. Click `Save`
7. Wait for the first deployment (check Actions tab)
8. Visit: https://contactdharsan-blip.github.io/BioPath/

---

**Questions?** Check the [GitHub Pages Documentation](https://docs.github.com/pages) or review the workflow in `.github/workflows/deploy.yml`
