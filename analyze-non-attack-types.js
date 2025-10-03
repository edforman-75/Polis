#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser.js');

const examplesDir = path.join(__dirname, 'cpo_examples');
const allFiles = fs.readdirSync(examplesDir)
  .filter(file => file.endsWith('.txt'))
  .filter(file => !file.endsWith('.txt.json'))
  .filter(file => !file.startsWith('hybrid_') && !file.startsWith('release_') && !file.startsWith('dnc_'));

const parser = new PressReleaseParser();

console.log('=== NON-ATTACK PRESS RELEASE ANALYSIS ===\n');
console.log('Analyzing', allFiles.length, 'real press releases\n');

const subtypeDistribution = {};
const typeDistribution = {};
const fileDetails = [];

allFiles.forEach(file => {
  const text = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
  const result = parser.parse(text);

  typeDistribution[result.release_type.type] = (typeDistribution[result.release_type.type] || 0) + 1;

  const nonAttackSubtypes = result.subtypes.filter(st => !st.subtype.startsWith('attack_'));

  nonAttackSubtypes.forEach(st => {
    subtypeDistribution[st.subtype] = (subtypeDistribution[st.subtype] || 0) + 1;
  });

  fileDetails.push({
    file,
    type: result.release_type.type,
    subtypes: nonAttackSubtypes.map(st => st.subtype),
    headline: text.split('\n')[0]
  });
});

console.log('TYPE DISTRIBUTION:');
Object.entries(typeDistribution).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log('  ' + count + 'x', type);
});

console.log('\nNON-ATTACK SUBTYPE DISTRIBUTION:');
Object.entries(subtypeDistribution).sort((a, b) => b[1] - a[1]).forEach(([subtype, count]) => {
  console.log('  ' + count + 'x', subtype);
});

console.log('\n\nFILE DETAILS:');
fileDetails.forEach(f => {
  console.log('\n' + f.file);
  console.log('  Type:', f.type);
  console.log('  Subtypes:', f.subtypes.join(', ') || '(none)');
  console.log('  Headline:', f.headline.substring(0, 80) + (f.headline.length > 80 ? '...' : ''));
});

// Save results
const outputPath = path.join(__dirname, 'non-attack-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  total_files: allFiles.length,
  type_distribution: typeDistribution,
  subtype_distribution: subtypeDistribution,
  file_details: fileDetails
}, null, 2));

console.log('\n✓ Results saved to:', outputPath);
