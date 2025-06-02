#!/usr/bin/env node

/**
 * Quick setup script for Render deployment
 * Run: node setup-render.js
 */

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Gatan Game - Render Deployment Setup\n');

async function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    console.log('This script will help you configure environment variables for Render deployment.\n');
    
    const vercelDomain = await ask('Enter your Vercel app domain (e.g., my-game.vercel.app): ');
    const renderUrl = await ask('Enter your Render service URL (e.g., gatan-socket-server.onrender.com): ');
    
    console.log('\n📋 Configuration Summary:');
    console.log('================================');
    
    console.log('\n🔧 Render Environment Variables:');
    console.log('NODE_ENV=production');
    console.log('PORT=10000');
    console.log(`ALLOWED_ORIGINS=https://${vercelDomain}`);
    
    console.log('\n⚡ Vercel Environment Variables:');
    console.log('NEXT_PUBLIC_USE_EXTERNAL_SOCKET=true');
    console.log(`NEXT_PUBLIC_SOCKET_SERVER_URL=https://${renderUrl}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Copy the Render environment variables to your Render service settings');
    console.log('2. Copy the Vercel environment variables to your Vercel project settings');
    console.log('3. Redeploy both services');
    console.log('4. Test with: npm run test:socket https://' + renderUrl);
    
    console.log('\n🎉 Your multiplayer game will be ready!');
    
    // Save config to file for reference
    const config = {
      render: {
        NODE_ENV: 'production',
        PORT: '10000',
        ALLOWED_ORIGINS: `https://${vercelDomain}`
      },
      vercel: {
        NEXT_PUBLIC_USE_EXTERNAL_SOCKET: 'true',
        NEXT_PUBLIC_SOCKET_SERVER_URL: `https://${renderUrl}`
      },
      testCommand: `npm run test:socket https://${renderUrl}`,
      healthCheck: `https://${renderUrl}/api/health`
    };
    
    fs.writeFileSync('render-config.json', JSON.stringify(config, null, 2));
    console.log('\n💾 Configuration saved to render-config.json');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
