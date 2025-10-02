#!/usr/bin/env node

const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();
const fs = require('fs');
const path = require('path');

const dir = 'cpo_examples';
const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.txt') && !f.includes('.txt.'))
  .sort();

let totalFiles = 0;
let withIssues = 0;
let withoutIssues = 0;
const issueCount = {};
const filesWithoutIssues = [];

console.log('=== ISSUES DETECTION ANALYSIS ===\n');

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const result = parser.parse(content);
  totalFiles++;

  if (result.issues && result.issues.length > 0) {
    withIssues++;
    result.issues.forEach(issueObj => {
      const issue = issueObj.issue || issueObj;
      issueCount[issue] = (issueCount[issue] || 0) + 1;
    });
  } else {
    withoutIssues++;
    filesWithoutIssues.push({
      file,
      headline: result.headline || 'No headline',
      type: result.type
    });
  }
});

console.log('Total files analyzed:', totalFiles);
console.log('Files WITH issues detected:', withIssues, '(' + (withIssues/totalFiles*100).toFixed(1) + '%)');
console.log('Files WITHOUT issues:', withoutIssues, '(' + (withoutIssues/totalFiles*100).toFixed(1) + '%)');

console.log('\nISSUE DISTRIBUTION:');
Object.entries(issueCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([issue, count]) => {
    console.log('  ' + count + 'x ' + issue);
  });

if (filesWithoutIssues.length > 0) {
  console.log('\nFILES WITHOUT ISSUES DETECTED:');
  filesWithoutIssues.forEach(f => {
    console.log(`\n${f.file} - ${f.type}`);
    console.log('  ' + f.headline.substring(0, 80) + (f.headline.length > 80 ? '...' : ''));
  });
}
