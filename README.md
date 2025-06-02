This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## WebSocket Configuration for Vercel

⚠️ **Important**: Vercel's serverless functions don't support persistent WebSocket connections. For multiplayer functionality in production, you need to deploy the Socket.IO server separately.

### Quick Solution: Deploy to Render (Recommended)

1. **Deploy Socket Server**:
   - Go to [render.com](https://render.com)
   - Create Web Service from GitHub with start command: `npm run start:socket-only:linux`
   - Set environment variables: `NODE_ENV=production`, `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app`

2. **Update Vercel Environment Variables**:
   ```
   NEXT_PUBLIC_USE_EXTERNAL_SOCKET=true
   NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-render-url.onrender.com
   ```

3. **Test**: Run `npm run test:socket https://your-render-url.onrender.com`

📖 **Detailed Instructions**: See `DEPLOY_RENDER.md` for step-by-step deployment guide.

### Alternative Platforms
- **Railway.app**: Similar setup, also has free tier
- **Heroku**: Requires paid plan (no free tier)
- **Fly.io**: Good for real-time applications

### Local Development
- Use `npm run dev` (includes integrated Socket.IO server)
- Test socket server: `npm run test:socket:local`
