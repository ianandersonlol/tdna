/**
 * Check database status and import sample genes if needed before starting the server
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Helper function to run a command
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, { 
      ...options, 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Check if genes table has data using the check-database script
function checkDatabase() {
  return new Promise((resolve, reject) => {
    exec('cd data_import && node check-database.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Error checking database:', error);
        return reject(error);
      }
      
      console.log(stdout);
      
      // Check if "Gene count: 0" appears in the output
      const noGenes = stdout.includes('Gene count: 0');
      const at1g25320Missing = !stdout.includes('AT1G25320 exists: true');
      
      resolve({ isEmpty: noGenes, at1g25320Missing });
    });
  });
}

// Main function
async function main() {
  try {
    // Step 1: Check database status
    console.log('Checking database status...');
    const dbStatus = await checkDatabase();
    
    // Step 2: Import sample genes if needed
    if (dbStatus.isEmpty || dbStatus.at1g25320Missing) {
      console.log('Database is missing genes. Importing sample genes...');
      try {
        await runCommand('npm', ['run', 'import-sample-genes']);
        console.log('Sample genes imported successfully');
      } catch (error) {
        console.error('Failed to import sample genes:', error);
        // Continue anyway, maybe the server will work
      }
    } else {
      console.log('Database has genes. No need to import sample data.');
    }
    
    // Step 3: Start the server
    console.log('Starting server...');
    
    // Use spawn directly to make sure it stays alive
    const serverProcess = spawn('npm', ['start'], { 
      cwd: path.join(process.cwd(), 'server'),
      stdio: 'inherit',
      shell: true,
      detached: false
    });
    
    // Keep the script running
    serverProcess.on('error', (error) => {
      console.error('Server process error:', error);
    });
    
    // This keeps the main script running while the server runs
    process.on('SIGINT', () => {
      serverProcess.kill();
      process.exit();
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();