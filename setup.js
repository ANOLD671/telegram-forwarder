const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');
const fs = require('fs');
require('dotenv').config();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Telegram Account Setup');
  console.log('─────────────────────────');
  
  let apiId = process.env.API_ID;
  let apiHash = process.env.API_HASH;

  // If API credentials are not in .env, ask for them
  if (!apiId || !apiHash) {
    console.log('❌ API credentials not found in .env file');
    apiId = await question('📱 Enter your API ID: ');
    apiHash = await question('🔑 Enter your API Hash: ');
    
    if (!apiId || !apiHash) {
      console.log('❌ API ID and Hash are required!');
      rl.close();
      return;
    }

    // Save to .env
    console.log('\n📋 Saving API credentials to .env file...');
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    // Update or add API credentials
    if (envContent.includes('API_ID=')) {
      envContent = envContent.replace(/API_ID=.*/g, `API_ID=${apiId}`);
    } else {
      envContent += `API_ID=${apiId}\n`;
    }
    
    if (envContent.includes('API_HASH=')) {
      envContent = envContent.replace(/API_HASH=.*/g, `API_HASH=${apiHash}`);
    } else {
      envContent += `API_HASH=${apiHash}\n`;
    }
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ API credentials saved to .env file!');
  } else {
    console.log('✅ Using API credentials from .env file');
  }

  // Now proceed with authentication
  console.log('\n🔐 Starting authentication...');
  
  const session = new StringSession("");
  const client = new TelegramClient(session, parseInt(apiId), apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => await question('📞 Enter your phone number (with country code, e.g., +1234567890): '),
      password: async () => await question('🔒 Enter your password (if 2FA enabled, press Enter if none): '),
      phoneCode: async () => await question('📲 Enter the verification code: '),
      onError: (err) => console.log('❌ Error:', err),
    });
    
    const me = await client.getMe();
    console.log('\n🎉 SUCCESS! Logged in as:', me.firstName, `(@${me.username})`);
    
    const sessionString = client.session.save();
    console.log('💾 Your session string:', sessionString);
    
    // Save session to .env
    let envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('SESSION_STRING=')) {
      envContent = envContent.replace(/SESSION_STRING=.*/g, `SESSION_STRING=${sessionString}`);
    } else {
      envContent += `SESSION_STRING=${sessionString}\n`;
    }
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ Session string saved to .env file!');
    
    console.log('\n🚀 Setup complete! You can now run: npm start');
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    console.log('💡 Make sure:');
    console.log('   - Phone number includes country code (+XXX)');
    console.log('   - Verification code is correct');
    console.log('   - You have internet connection');
  } finally {
    try {
      await client.disconnect();
    } catch (e) {}
    rl.close();
  }
}

main().catch(console.error);