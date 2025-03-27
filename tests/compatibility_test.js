#!/usr/bin/env node
/**
 * Compatibility test for IPv6Poetry implementations
 * 
 * This script tests that the Python and JavaScript implementations produce
 * identical results for a set of test IPv6 addresses.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test addresses
const TEST_ADDRESSES = [
  '2001:db8::1',
  '2001:4860:4860::8888',
  '2620:0:2d0:200::7',
  'fe80::1',
  '::1',
  '2001:db8:85a3::8a2e:370:7334'
];

// Function to run Python converter
function runPythonConverter(address) {
  const pythonPath = path.resolve(__dirname, '../poetry-tools/python');
  
  // Try different Python commands to handle different environments
  const pythonCommands = ['python', 'python3', 'py', 'python3.11'];
  
  for (const pythonCmd of pythonCommands) {
    try {
      const result = spawnSync(pythonCmd, ['-m', 'ipv6poetry.cli', 'to-poetry', address], {
        cwd: pythonPath,
        encoding: 'utf8'
      });
      
      if (result.status === 0) {
        return result.stdout.trim();
      }
    } catch (error) {
      // Command not found, try the next one
      continue;
    }
  }
  
  console.error(`Error: Could not run Python converter with any available Python command`);
  return null;
}

// Function to run JavaScript converter
function runJsConverter(address) {
  const jsPath = path.resolve(__dirname, '../poetry-tools/js');
  
  // Try to use Bun first, fall back to Node if Bun is not available
  let result;
  
  try {
    result = spawnSync('bun', ['src/cli.ts', 'to-poetry', address], {
      cwd: jsPath,
      encoding: 'utf8'
    });
  } catch (error) {
    // If Bun is not available, fall back to Node with ts-node
    console.log('Bun not available, falling back to Node.js...');
    result = spawnSync('node', ['--loader', 'ts-node/esm', 'src/cli.ts', 'to-poetry', address], {
      cwd: jsPath,
      encoding: 'utf8'
    });
  }
  
  if (result.status !== 0) {
    console.error(`Error running JavaScript converter: ${result.stderr}`);
    return null;
  }
  
  return result.stdout.trim();
}

// Run the compatibility test
function runCompatibilityTest() {
  console.log('Running IPv6Poetry compatibility test...');
  console.log('=======================================');
  
  let allPassed = true;
  
  TEST_ADDRESSES.forEach(address => {
    console.log(`\nTesting address: ${address}`);
    
    const pythonResult = runPythonConverter(address);
    const jsResult = runJsConverter(address);
    
    // Extract the poetic phrase from the output
    const pythonPhrase = pythonResult ? pythonResult.match(/Poetic phrase: (.+)$/m)?.[1] : null;
    const jsPhrase = jsResult ? jsResult.match(/Poetic phrase: (.+)$/m)?.[1] : null;
    
    console.log(`Python: ${pythonResult}`);
    console.log(`JS:     ${jsResult}`);
    
    if (pythonPhrase && jsPhrase && pythonPhrase === jsPhrase) {
      console.log('✅ PASSED - Results match');
    } else {
      console.log('❌ FAILED - Results differ');
      allPassed = false;
    }
  });
  
  console.log('\n=======================================');
  if (allPassed) {
    console.log('✅ All compatibility tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some compatibility tests failed.');
    process.exit(1);
  }
}

// Run the test
runCompatibilityTest();