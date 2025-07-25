#!/usr/bin/env node

console.log('🚀 Two-Main Project - Quick Setup');
console.log('====================================\n');

const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n⚡ Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function setupSQLite() {
  console.log('\n📦 Setting up SQLite Database...');
  try {
    await runCommand('npx', ['prisma', 'generate']);
    await runCommand('npx', ['prisma', 'db', 'push']);
    await runCommand('npm', ['run', 'db:seed']);
    console.log('\n✅ SQLite setup completed!');
    console.log('🌐 Start app with: npm run dev');
  } catch (error) {
    console.error('❌ SQLite setup failed:', error.message);
  }
}

async function setupDocker() {
  console.log('\n🐳 Setting up Docker + PostgreSQL...');
  try {
    await runCommand('npm', ['run', 'docker:up']);
    console.log('\n⏳ Waiting for containers to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await runCommand('npm', ['run', 'docker:migrate']);
    await runCommand('npm', ['run', 'docker:seed']);
    console.log('\n✅ Docker setup completed!');
    console.log('🌐 App: http://localhost:3000');
    console.log('📊 Prisma Studio: http://localhost:5555');
  } catch (error) {
    console.error('❌ Docker setup failed:', error.message);
  }
}

function askSetupType() {
  console.log('Choose setup type:');
  console.log('1. SQLite (Quick & Simple)');
  console.log('2. Docker + PostgreSQL (Production-like)');
  
  rl.question('\nEnter your choice (1 or 2): ', async (choice) => {
    if (choice === '1') {
      await setupSQLite();
    } else if (choice === '2') {
      await setupDocker();
    } else {
      console.log('❌ Invalid choice. Please enter 1 or 2.');
      askSetupType();
      return;
    }
    rl.close();
  });
}

// Start the setup
askSetupType();
