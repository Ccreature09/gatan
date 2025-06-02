# WebSocket Deployment Guide for Vercel

## The Problem
Vercel's serverless functions don't support persistent WebSocket connections, which are required for real-time multiplayer games.

## Solution Options

### Option 1: Deploy Socket Server to Railway (Recommended)
Railway supports WebSockets and has excellent integration with GitHub.

1. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Set these environment variables in Railway:
     ```
     NODE_ENV=production
     PORT=3001
     ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
     ```
   - Set the start command to: `npm run start:socket-only:linux`

2. **Update Vercel Environment Variables:**
   ```
   NEXT_PUBLIC_USE_EXTERNAL_SOCKET=true
   NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-railway-domain.railway.app
   ```

### Option 2: Deploy Socket Server to Render
1. **Deploy to Render:**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Create a Web Service with:
     - Build Command: `npm install`
     - Start Command: `npm run start:socket-only:linux`
     - Environment Variables:
       ```
       NODE_ENV=production
       ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
       ```

### Option 3: Use Heroku (Requires Paid Plan)
Heroku's free tier was discontinued, but their paid plans support WebSockets.

1. **Deploy to Heroku:**
   - The `Procfile` is already configured
   - Set environment variables:
     ```
     NODE_ENV=production
     ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
     ```

### Option 4: Use DigitalOcean App Platform
1. **Deploy to DigitalOcean:**
   - Create a new app from your GitHub repository
   - Use the `socket-server.js` as the entry point
   - Set environment variables as needed

## Testing Your Deployment

1. **Verify Socket Server is Running:**
   Visit `https://your-socket-domain/api/health` - you should see a JSON response

2. **Test WebSocket Connection:**
   Open browser dev tools on your Vercel-deployed frontend and check for successful socket connections

## Recommended: Railway Deployment
Railway is the easiest option because:
- ✅ Free tier supports WebSockets
- ✅ Automatic HTTPS
- ✅ Easy GitHub integration
- ✅ Good performance for real-time apps
- ✅ Simple environment variable management
