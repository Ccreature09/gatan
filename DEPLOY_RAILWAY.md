# Deploy Socket Server Script for Railway

## Quick Deploy Instructions

### 1. Prepare for Railway Deployment

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select this repository**

### 2. Configure Railway Settings

**Build & Deploy Settings:**
- **Start Command**: `npm run start:socket-only:linux`
- **Build Command**: `npm install` (default)

**Environment Variables:**
```
NODE_ENV=production
PORT=$PORT
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-app-git-main.vercel.app
```

Replace `your-vercel-app` with your actual Vercel project name.

### 3. Get Railway Domain

After deployment, Railway will give you a domain like:
`https://your-project-name.railway.app`

### 4. Update Vercel Environment Variables

Go to your Vercel project settings and add:

```
NEXT_PUBLIC_USE_EXTERNAL_SOCKET=true
NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-project-name.railway.app
```

### 5. Test Deployment

1. **Check Socket Server**: Visit `https://your-project-name.railway.app/api/health`
   - Should show JSON with server status
2. **Test Game**: Try creating a multiplayer room
3. **Check Browser Console**: Should show "Using external socket server" message

### 6. Troubleshooting

**If connections fail:**
1. Check Railway logs for errors
2. Verify ALLOWED_ORIGINS includes your Vercel domain
3. Make sure Vercel environment variables are set correctly
4. Try redeploying both Railway and Vercel

**Common Issues:**
- **CORS errors**: Update ALLOWED_ORIGINS in Railway
- **404 errors**: Check that start command is correct
- **Connection timeouts**: Railway might be sleeping (free tier)

### Alternative: Render Deployment

If Railway doesn't work:

1. **Go to Render**: https://render.com
2. **New Web Service** from GitHub
3. **Settings**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:socket-only:linux`
   - **Environment Variables**: Same as Railway

## Files Already Configured

✅ `socket-server.js` - Standalone socket server
✅ `package.json` - Has start commands
✅ `Procfile` - For Heroku (if needed)
✅ `vercel.json` - Updated to use external socket
✅ `socketService.ts` - Detects external server automatically

Your code is ready to deploy - just follow the steps above!
