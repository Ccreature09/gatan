# Deploy Socket.IO Server to Render

## Step-by-Step Guide

### 1. Deploy to Render

1. **Go to Render**: Visit [render.com](https://render.com) and sign up/login with GitHub

2. **Create New Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your `gatan` repository

3. **Configure Deployment**:
   - **Name**: `gatan-socket-server` (or any name you prefer)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (uses repo root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:socket-only:linux`

4. **Environment Variables**:
   Click "Advanced" and add these environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```
   ⚠️ **Important**: Replace `your-vercel-app.vercel.app` with your actual Vercel domain

5. **Deploy**: Click "Create Web Service"

### 2. Update Vercel Environment Variables

Once your Render deployment is complete, you'll get a URL like `https://gatan-socket-server.onrender.com`

1. Go to your **Vercel Dashboard**
2. Select your project → **Settings** → **Environment Variables**
3. Add/Update these variables:
   ```
   NEXT_PUBLIC_USE_EXTERNAL_SOCKET=true
   NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-render-url.onrender.com
   ```
4. **Redeploy** your Vercel app (push a small change or trigger manual deploy)

### 3. Test the Setup

1. **Check Socket Server Health**:
   Visit: `https://your-render-url.onrender.com/api/health`
   
   You should see JSON response like:
   ```json
   {
     "status": "ok",
     "service": "gatan-socket-server",
     "activeConnections": 0,
     "uptime": 123
   }
   ```

2. **Test Socket Connection**:
   ```powershell
   npm run test:socket https://your-render-url.onrender.com
   ```

3. **Test Your Game**:
   - Open your Vercel-deployed game
   - Open browser dev tools (F12)
   - Look for successful Socket.IO connection messages
   - Try creating/joining a multiplayer room

## Render-Specific Notes

### Free Tier Limitations
- ✅ **Free tier supports WebSockets**
- ⚠️ **Sleep after 15 minutes of inactivity** (spins up on first request)
- ⚠️ **Monthly usage limits** (750 hours/month on free tier)

### Cold Start Handling
Render free tier "sleeps" after inactivity. The first connection might take 30-60 seconds to wake up.

### Upgrading (Optional)
- **Starter Plan ($7/month)**: No sleep, faster response times
- **Standard Plan ($25/month)**: More resources, better for production

## Troubleshooting

### Common Issues

1. **Connection Timeouts**:
   - Check that `ALLOWED_ORIGINS` includes your Vercel domain
   - Verify the Render URL is correct in Vercel env vars

2. **"Service Unavailable"**:
   - Service might be sleeping (free tier)
   - Check Render logs for errors
   - Verify the start command is correct

3. **CORS Errors**:
   - Double-check `ALLOWED_ORIGINS` environment variable
   - Make sure it matches your Vercel domain exactly

### Checking Logs
1. Go to your Render dashboard
2. Select your service
3. Click "Logs" tab to see real-time logs

### Alternative Start Commands
If `npm run start:socket-only:linux` doesn't work, try:
- `node socket-server.js`
- `NODE_ENV=production node socket-server.js`

## Success Indicators

✅ **You'll know it's working when**:
- Render health check returns status "ok"
- Browser dev tools show "Connected to server successfully"
- You can create and join multiplayer rooms
- No CORS errors in console

🎉 **Your multiplayer game should now work in production!**
