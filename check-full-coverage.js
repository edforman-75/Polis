#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const dir = 'cpo_examples';

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.txt') && !f.includes('.txt.'))
  .sort();

console.log('=== FULL COVERAGE CHECK ===\n');
console.log(`Checking ${files.length} press releases...\n`);

let hasType = 0;
let hasSubtype = 0;
let hasIssues = 0;
let missingAny = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const result = parser.parse(content);
  
  // Type is nested in release_type.type
  const hasT = result.release_type && result.release_type.type ? true : false;
  const hasS = result.subtypes && result.subtypes.length > 0;
  const hasI = result.issues && result.issues.length > 0;
  
  if (hasT) hasType++;
  if (hasS) hasSubtype++;
  if (hasI) hasIssues++;
  
  if (!hasT || !hasS || !hasI) {
    missingAny.push({
      file,
      type: hasT ? result.release_type.type : 'MISSING',
      subtypes: hasS ? result.subtypes.length : 0,
      issues: hasI ? result.issues.length : 0
    });
  }
});

console.log('COVERAGE SUMMARY:');
console.log(`Type:     ${hasType}/${files.length} (${(hasType/files.length*100).toFixed(1)}%)`);
console.log(`Subtype:  ${hasSubtype}/${files.length} (${(hasSubtype/files.length*100).toFixed(1)}%)`);
console.log(`Issues:   ${hasIssues}/${files.length} (${(hasIssues/files.length*100).toFixed(1)}%)`);
console.log();

if (missingAny.length > 0) {
  console.log(`\n⚠️  FILES MISSING ATTRIBUTES (${missingAny.length}):\n`);
  missingAny.forEach(item => {
    console.log(`${item.file}:`);
    console.log(`  Type: ${item.type}`);
    console.log(`  Subtypes: ${item.subtypes}`);
    console.log(`  Issues: ${item.issues}`);
    console.log();
  });
} else {
  console.log('✓ ALL FILES HAVE TYPE, SUBTYPE, AND ISSUES');
}
