const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('ORIGINAL RELEASE FILES TEST');
console.log('Testing if improvements help with the original training data');
console.log('================================================================================\n');

// Test a sample of release files
const testFiles = [
    'release_01.txt',
    'release_05.txt',
    'release_10.txt',
    'release_15.txt',
    'release_20.txt',
    'release_25.txt'
];

let totalQuotes = 0;
let quotesWithSpeaker = 0;
let quotesWithUnknown = 0;

testFiles.forEach(filename => {
    const filePath = path.join(__dirname, 'cpo_examples', filename);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}\n`);
        return;
    }

    const text = fs.readFileSync(filePath, 'utf8');
    const result = parser.parse(text);

    console.log(`--- ${filename} ---`);
    console.log(`Date: ${result.content_structure.dateline?.date || 'NOT FOUND'}`);
    console.log(`Location: ${result.content_structure.dateline?.location || 'NOT FOUND'}`);
    console.log(`Quotes: ${result.quotes.length}`);

    result.quotes.forEach((q, i) => {
        totalQuotes++;
        const speaker = q.speaker_name || 'UNKNOWN';
        if (speaker === 'UNKNOWN') {
            quotesWithUnknown++;
        } else {
            quotesWithSpeaker++;
        }

        console.log(`  Quote ${i + 1}:`);
        console.log(`    Speaker: ${speaker}`);
        console.log(`    Attribution: ${q.full_attribution || 'N/A'}`);
        console.log(`    Text: ${q.quote_text.substring(0, 80)}...`);
    });

    console.log('');
});

console.log('================================================================================');
console.log('SUMMARY');
console.log('================================================================================');
console.log(`Total quotes extracted: ${totalQuotes}`);
console.log(`Quotes with identified speaker: ${quotesWithSpeaker} (${Math.round(quotesWithSpeaker/totalQuotes*100)}%)`);
console.log(`Quotes with UNKNOWN speaker: ${quotesWithUnknown} (${Math.round(quotesWithUnknown/totalQuotes*100)}%)`);
console.log('');
