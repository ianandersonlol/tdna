const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runScript(scriptPath) {
  try {
    console.log(`Running script: ${scriptPath}`);
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    console.log(`Output from ${scriptPath}:`);
    console.log(stdout);
    if (stderr) {
      console.error(`Errors from ${scriptPath}:`);
      console.error(stderr);
    }
    return true;
  } catch (error) {
    console.error(`Error executing ${scriptPath}:`, error);
    return false;
  }
}

async function runAllImports() {
  console.log('Starting data import process');
  
  // First import gene data from GFF
  const gffResult = await runScript('./import-gff.js');
  if (!gffResult) {
    console.error('GFF import failed, aborting further imports');
    return;
  }
  
  // Then import T-DNA data
  const tdnaResult = await runScript('./import-tdna.js');
  if (!tdnaResult) {
    console.error('T-DNA import failed');
    return;
  }
  
  console.log('All data imports completed successfully');
}

runAllImports().catch(error => {
  console.error('Error in import process:', error);
  process.exit(1);
});