const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('HYBRID RELEASE FILES TEST');
console.log('Testing if improvements help with hybrid training data');
console.log('================================================================================\n');

// Test a sample of hybrid release files
const testFiles = [
    'hybrid_release_01.txt',
    'hybrid_release_05.txt',
    'hybrid_release_10.txt',
    'hybrid_release_15.txt',
    'hybrid_release_20.txt',
    'hybrid_release_25.txt'
];

let totalQuotes = 0;
let quotesWithSpeaker = 0;
let quotesWithUnknown = 0;
const issuesList = [];

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
            issuesList.push(`${filename} Quote ${i+1}: UNKNOWN speaker`);
        } else {
            quotesWithSpeaker++;
        }

        console.log(`  Quote ${i + 1}:`);
        console.log(`    Speaker: ${speaker}`);
        if (q.speaker_title) {
            console.log(`    Title: ${q.speaker_title}`);
        }
        console.log(`    Text: ${q.quote_text.substring(0, 60)}...`);
    });

    console.log('');
});

console.log('================================================================================');
console.log('SUMMARY');
console.log('================================================================================');
console.log(`Total quotes extracted: ${totalQuotes}`);
console.log(`Quotes with identified speaker: ${quotesWithSpeaker} (${Math.round(quotesWithSpeaker/totalQuotes*100)}%)`);
console.log(`Quotes with UNKNOWN speaker: ${quotesWithUnknown} (${Math.round(quotesWithUnknown/totalQuotes*100)}%)`);

if (issuesList.length > 0) {
    console.log('\nIssues found:');
    issuesList.forEach(issue => console.log(`  - ${issue}`));
}
console.log('');
