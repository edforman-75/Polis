#!/usr/bin/env node

const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Test a few files to see what locations are being extracted
const testFiles = [
  'porter_05_launch.txt',
  'stein_01_hurricane_recovery.txt',
  'schumer_01_project_2025.txt',
  'jeffries_01_shutdown_statement.txt',
  'spanberger_01_mass_firings.txt'
];

testFiles.forEach(file => {
  const content = fs.readFileSync(`cpo_examples/${file}`, 'utf-8');
  const result = parser.parse(content);
  
  console.log(`\n=== ${file} ===`);
  console.log('Location extracted:', result.release_info.location || '(none)');
  console.log('Date extracted:', result.release_info.date || '(none)');
  console.log('\nFirst 300 chars:');
  console.log(content.substring(0, 300).replace(/\n/g, ' ¶ '));
});
