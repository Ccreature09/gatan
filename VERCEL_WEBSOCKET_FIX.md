# Quick Fix for Vercel WebSocket Issues

## The Problem
Your WebSocket connections are failing on Vercel because **Vercel's serverless functions don't support persistent WebSocket connections**. The Socket.IO implementation in `pages/api/socketio.js` won't work reliably in production.

## Immediate Solution: Deploy Socket Server to Railway

### Step 1: Deploy Socket Server to Railway
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select this repository
4. In the deployment settings:
   - **Start Command**: `npm run start:socket-only:linux`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=3001
     ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
     ```
   - Replace `your-vercel-app.vercel.app` with your actual Vercel domain

### Step 2: Update Vercel Environment Variables
1. Go to your Vercel dashboard
2. Select your project → Settings → Environment Variables
3. Add these variables:
   ```
   NEXT_PUBLIC_USE_EXTERNAL_SOCKET=true
   NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-railway-domain.railway.app
   ```
   - Replace `your-railway-domain` with the domain Railway provides

### Step 3: Redeploy
1. Push any small change to trigger a Vercel redeploy
2. Your game should now connect to the Railway-hosted Socket server

## Why This Works
- ✅ Railway supports persistent WebSocket connections
- ✅ Your Next.js app (frontend) stays on Vercel (fast CDN)
- ✅ Socket.IO server runs on Railway (persistent connections)
- ✅ Free tiers available on both platforms

## Alternative Platforms
If Railway doesn't work for you:
- **Render.com**: Similar setup, also has free tier
- **Fly.io**: Good for real-time applications
- **Heroku**: Requires paid plan (no free tier)

## Testing
1. Check that Railway deployment is working: Visit `https://your-railway-domain.railway.app/api/health`
2. Open browser dev tools on your Vercel app and look for successful Socket.IO connections
3. Try creating/joining a multiplayer room

Your current configuration is already set up for this - you just need to deploy the socket server separately and update the environment variables!
