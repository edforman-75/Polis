#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('=== SAMPLE PARSING COMPARISON ===\n');

// Parse a file with quotes
console.log('--- FILE WITH QUOTES: porter_05_launch.txt ---\n');
let content = fs.readFileSync('cpo_examples/porter_05_launch.txt', 'utf-8');
let result = parser.parse(content);

console.log('Headline:', result.content_structure.headline);
console.log('Has Subhead:', result.content_structure.subhead ? 'YES' : 'NO');
console.log('Lead Length:', result.content_structure.lead_paragraph.length, 'chars');
console.log('Body Paragraphs:', result.content_structure.body_paragraphs.length);
console.log('Quotes:', result.quotes.length);
if (result.quotes.length > 0) {
  console.log('  Quote 1:', result.quotes[0].quote_text.substring(0, 60) + '...');
  console.log('  Speaker:', result.quotes[0].speaker_name || 'UNKNOWN');
}
console.log('Type:', result.release_type.type);
console.log('Subtypes:', result.subtypes.map(s => s.subtype).join(', '));
console.log('Issues:', result.issues.map(i => i.issue).join(', '));

// Parse a file without quotes
console.log('\n\n--- FILE WITHOUT QUOTES: jeffries_01_shutdown_statement.txt ---\n');
content = fs.readFileSync('cpo_examples/jeffries_01_shutdown_statement.txt', 'utf-8');
result = parser.parse(content);

console.log('Headline:', result.content_structure.headline);
console.log('Has Subhead:', result.content_structure.subhead ? 'YES' : 'NO');
console.log('Lead Length:', result.content_structure.lead_paragraph.length, 'chars');
console.log('Body Paragraphs:', result.content_structure.body_paragraphs.length);
console.log('Quotes:', result.quotes.length);
console.log('Type:', result.release_type.type);
console.log('Subtypes:', result.subtypes.map(s => s.subtype).join(', '));
console.log('Issues:', result.issues.map(i => i.issue).join(', '));

console.log('\n--- FIRST 500 CHARS OF FILE ---');
console.log(content.substring(0, 500));
