const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Katie Porter press releases
const porterFiles = [
    'porter_01_launch.txt',
    'porter_02_momentum.txt',
    'porter_03_poll.txt',
    'porter_04_min_endorsement.txt'
];

console.log('\n=== KATIE PORTER PRESS RELEASES ===\n');

porterFiles.forEach(file => {
    const filePath = path.join(__dirname, 'cpo_examples', file);
    const text = fs.readFileSync(filePath, 'utf8');
    const result = parser.parse(text);

    console.log(`\n--- ${file} ---`);
    console.log('Headline:', result.content_structure.headline || 'NOT FOUND');
    console.log('Date:', result.content_structure.dateline.date || 'NOT FOUND');
    console.log('Location:', result.content_structure.dateline.location || 'NOT FOUND');
    console.log('Dateline confidence:', result.content_structure.dateline.confidence || 'N/A');
    console.log('Quotes:', result.quotes.length);
    result.quotes.forEach((q, i) => {
        console.log(`  Quote ${i + 1}:`);
        console.log(`    Speaker: ${q.speaker_name || 'UNKNOWN'}`);
        console.log(`    Text: "${q.quote_text.substring(0, 80)}..."`);
    });
});

console.log('\n\n=== SUMMARY ===\n');
console.log('Total Porter releases tested:', porterFiles.length);
console.log('\nThese are campaign-style press releases from Katie Porter\'s California Governor race.');
console.log('Expected format: FOR IMMEDIATE RELEASE, location, headline, quotes from Porter.');
