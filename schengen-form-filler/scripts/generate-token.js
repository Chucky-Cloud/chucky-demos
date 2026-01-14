#!/usr/bin/env node

/**
 * Generate a Chucky JWT token for the Schengen Form Filler demo
 *
 * Usage:
 *   npm run token
 *   npm run token -- --expires 3600
 *   npm run token -- --user my-user-id
 */

import { createToken, createBudget } from '@chucky.cloud/sdk';

// Configuration - update these with your project credentials
const CONFIG = {
  projectId: 'jd77az049xjwsv0pbjqbrkfjws7z5136',
  secret: 'hk_live_dc2c80302ae442c98f5c8ab8dcc66198',
};

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const userId = getArg('user', 'demo-user');
const expiresIn = parseInt(getArg('expires', '86400'), 10); // Default: 24 hours
const aiDollars = parseFloat(getArg('ai', '5.00'));
const computeHours = parseFloat(getArg('compute', '2'));

async function main() {
  console.log('\n🔐 Generating Chucky Token\n');
  console.log('Configuration:');
  console.log(`  Project ID: ${CONFIG.projectId}`);
  console.log(`  User ID: ${userId}`);
  console.log(`  Expires in: ${expiresIn} seconds (${(expiresIn / 3600).toFixed(1)} hours)`);
  console.log(`  AI Budget: $${aiDollars.toFixed(2)}`);
  console.log(`  Compute Budget: ${computeHours} hours`);
  console.log('');

  const token = await createToken({
    userId,
    projectId: CONFIG.projectId,
    secret: CONFIG.secret,
    expiresIn,
    budget: createBudget({
      aiDollars,
      computeHours,
      window: 'day',
    }),
  });

  console.log('✅ Token generated:\n');
  console.log(token);
  console.log('\n📋 To use this token, update src/context/ChuckyContext.tsx:');
  console.log('');
  console.log('   const DEMO_MODE = false');
  console.log(`   const CHUCKY_TOKEN = '${token}'`);
  console.log('');
}

main().catch(console.error);
