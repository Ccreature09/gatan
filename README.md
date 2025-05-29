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

This project uses WebSockets for real-time game communication. For deployment on Vercel, there are two options:

### Option 1: Using Vercel's Serverless Functions (Default)

This project is configured to use Socket.IO through Vercel's serverless functions by default. The implementation is in `pages/api/socketio.js`.

Benefits:
- No additional server needed
- Works well for games with fewer concurrent users
- Simpler deployment - just deploy to Vercel

Limitations:
- Limited by serverless function execution time (may reconnect during long games)
- Connection quality depends on Vercel's serverless function performance

### Option 2: Using a Separate WebSocket Server

For games with many concurrent users or longer session times, you can deploy a separate WebSocket server.

1. Set `NEXT_PUBLIC_USE_EXTERNAL_SOCKET=true` in your Vercel environment variables
2. Set `NEXT_PUBLIC_SOCKET_SERVER_URL` to your WebSocket server URL
3. Deploy the WebSocket server using one of these options:

**Deploying a Dedicated Socket Server:**

1. **Using a VPS or Cloud Provider**
   - Set up a server on DigitalOcean, AWS, etc.
   - Run `npm run start:socket-only` to start the WebSocket server
   - Use a process manager like PM2: `pm2 start npm --name "gatan-socket-server" -- run start:socket-only`

2. **Using Platforms that Support WebSockets**
   - Heroku: Deploy using the included Procfile (requires Eco or Basic plan)
   - Railway, Render, or Fly.io: Deploy the repository and set the start command to `npm run start:socket-only:linux`
