#!/usr/bin/env node

/**
 * Script to generate a bcrypt hash for admin password
 * Usage: node scripts/generate-password-hash.js <password>
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: node scripts/generate-password-hash.js <password>');
    console.error('\nExample:');
    console.error('  node scripts/generate-password-hash.js mySecurePassword123');
    process.exit(1);
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log('\n==============================================');
    console.log('Password Hash Generated Successfully!');
    console.log('==============================================\n');
    console.log('Add this to your .env file:');
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log('\nAlso add these if not already present:');
    console.log('ADMIN_USERNAME=admin');
    console.log(`JWT_SECRET="${generateRandomSecret(32)}"`);
    console.log('JWT_EXPIRES_IN=24h');
    console.log('\n==============================================');
  } catch (error) {
    console.error('Error generating hash:', error);
    process.exit(1);
  }
}

function generateRandomSecret(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  let secret = '';

  for (let i = 0; i < length; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }

  return secret;
}

generateHash();