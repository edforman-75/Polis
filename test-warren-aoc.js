const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Warren press releases
const warrenFiles = [
    'warren_01_shutdown.txt',
    'warren_02_crypto.txt',
    'warren_03_social_security.txt'
];

// AOC press releases
const aocFiles = [
    'aoc_01_kirk.txt',
    'aoc_02_israel.txt',
    'aoc_03_healthy_start.txt'
];

console.log('\n=== WARREN PRESS RELEASES ===\n');

warrenFiles.forEach(file => {
    const filePath = path.join(__dirname, 'cpo_examples', file);
    const text = fs.readFileSync(filePath, 'utf8');
    const result = parser.parse(text);

    console.log(`\n--- ${file} ---`);
    console.log('Headline:', result.content_structure.headline || 'NOT FOUND');
    console.log('Date:', result.release_info.release_date || 'NOT FOUND');
    console.log('Location:', result.release_info.location || 'NOT FOUND');
    console.log('Quotes:', result.quotes.length);
    result.quotes.forEach((q, i) => {
        console.log(`  Quote ${i + 1}:`);
        console.log(`    Speaker: ${q.speaker_name || 'UNKNOWN'}`);
        console.log(`    Text: "${q.quote_text.substring(0, 80)}..."`);
    });
});

console.log('\n\n=== AOC PRESS RELEASES ===\n');

aocFiles.forEach(file => {
    const filePath = path.join(__dirname, 'cpo_examples', file);
    const text = fs.readFileSync(filePath, 'utf8');
    const result = parser.parse(text);

    console.log(`\n--- ${file} ---`);
    console.log('Headline:', result.content_structure.headline || 'NOT FOUND');
    console.log('Date:', result.release_info.release_date || 'NOT FOUND');
    console.log('Location:', result.release_info.location || 'NOT FOUND');
    console.log('Quotes:', result.quotes.length);
    result.quotes.forEach((q, i) => {
        console.log(`  Quote ${i + 1}:`);
        console.log(`    Speaker: ${q.speaker_name || 'UNKNOWN'}`);
        console.log(`    Text: "${q.quote_text.substring(0, 80)}..."`);
    });
});

console.log('\n\n=== SUMMARY ===\n');
console.log('Total Warren releases tested:', warrenFiles.length);
console.log('Total AOC releases tested:', aocFiles.length);
