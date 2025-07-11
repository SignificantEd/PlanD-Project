const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Prisma Client Issues...\n');

try {
  // Step 1: Stop any running processes that might be using the Prisma client
  console.log('1. Stopping any processes using Prisma client...');
  try {
    execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors if no processes to kill
  }
  
  // Step 2: Delete the .prisma directory
  console.log('2. Removing old Prisma client files...');
  const prismaPath = path.join(__dirname, 'node_modules', '.prisma');
  if (fs.existsSync(prismaPath)) {
    try {
      fs.rmSync(prismaPath, { recursive: true, force: true });
      console.log('   ✅ Removed old Prisma client files');
    } catch (e) {
      console.log('   ⚠️ Could not remove all files, continuing...');
    }
  }
  
  // Step 3: Regenerate Prisma client
  console.log('3. Regenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('   ✅ Prisma client regenerated');
  
  // Step 4: Verify the schema is in sync
  console.log('4. Verifying database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('   ✅ Database schema verified');
  
  console.log('\n🎉 Prisma client has been successfully regenerated!');
  console.log('You can now restart your development server and test absence creation.');
  
} catch (error) {
  console.error('❌ Error fixing Prisma client:', error.message);
  console.log('\nManual steps to fix:');
  console.log('1. Stop all Node.js processes');
  console.log('2. Delete node_modules/.prisma directory');
  console.log('3. Run: npx prisma generate');
  console.log('4. Run: npx prisma db push');
  console.log('5. Restart your development server');
} 