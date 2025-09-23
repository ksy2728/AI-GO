#!/usr/bin/env node

const https = require('http');

async function clearApiCache() {
  try {
    console.log('🗑️ Clearing API cache...');

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/models',
      method: 'DELETE'
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      res.on('data', (data) => {
        console.log('Response:', data.toString());
      });
    });

    req.on('error', (error) => {
      console.log('Cache clear request failed (server may not be running):', error.message);
    });

    req.end();
  } catch (error) {
    console.log('Could not clear API cache:', error.message);
  }
}

clearApiCache();