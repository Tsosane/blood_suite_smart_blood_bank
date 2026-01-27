# Cloud Deployment Guide for Blood Suite

## Quick Deployment Options

### 1. Railway (Recommended - Easiest)
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Railway will auto-detect Node.js and deploy
5. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (Railway provides PostgreSQL)
   - `JWT_SECRET` (generate a strong random key)
   - `NODE_ENV=production`

### 2. Heroku
1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
5. Set environment variables:
   ```bash
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set NODE_ENV=production
   ```
6. Deploy: `git push heroku main`

### 3. Render
1. Go to [render.com](https://render.com)
2. Click "New + Web Service"
3. Connect your GitHub repository
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add PostgreSQL database
5. Set environment variables in dashboard

### 4. Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Configure environment variables:
   - `DATABASE_URL` (use external PostgreSQL)
   - `JWT_SECRET`
   - `NODE_ENV=production`

## Required Environment Variables
All platforms need these variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random secret key
- `NODE_ENV=production` - Production mode

## Database Setup
Most platforms provide managed PostgreSQL. The app will auto-create tables on first run.

## Health Check
Your deployed app should respond to:
`https://your-domain.com/api/health`

## Troubleshooting
- Check platform logs for errors
- Verify environment variables are set
- Ensure database connection is working
- Check if all dependencies installed correctly

## Next Steps After Deployment
1. Test the health endpoint
2. Register first admin user
3. Verify all features work
4. Set up custom domain (optional)
