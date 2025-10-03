#!/usr/bin/env node

const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Test files to see subhead vs date detection
const files = fs.readdirSync('cpo_examples')
  .filter(f => f.endsWith('.txt') && !f.includes('.txt.'))
  .slice(0, 10);

files.forEach(file => {
  const content = fs.readFileSync(`cpo_examples/${file}`, 'utf-8');
  const result = parser.parse(content);
  
  console.log(`\n=== ${file} ===`);
  console.log('Headline:', result.content_structure.headline.substring(0, 60));
  console.log('Subhead:', result.content_structure.subhead || '(none)');
  console.log('Date (release_info):', result.release_info.date || '(none)');
  console.log('\nFirst 250 chars:');
  console.log(content.substring(0, 250).replace(/\n/g, ' ¶ '));
});
