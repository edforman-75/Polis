const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('AOC RELEASE DEBUGGING');
console.log('================================================================================\n');

const files = [
    'aoc_01_kirk.txt',
    'aoc_02_israel.txt',
    'aoc_03_healthy_start.txt'
];

files.forEach(filename => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${filename}`);
    console.log('='.repeat(80));

    const filePath = path.join(__dirname, 'cpo_examples', filename);
    const text = fs.readFileSync(filePath, 'utf8');

    const result = parser.parse(text);

    // Check dateline
    console.log('\n--- DATELINE ---');
    console.log(`Date: ${result.content_structure.dateline?.date || 'MISSING'}`);
    console.log(`Location: ${result.content_structure.dateline?.location || 'MISSING'}`);
    console.log(`Format: ${result.content_structure.dateline?.format || 'N/A'}`);

    // Check first 10 lines
    console.log('\n--- FIRST 10 LINES ---');
    text.split('\n').slice(0, 10).forEach((line, i) => {
        console.log(`${i + 1}: ${line}`);
    });

    // Check quotes
    console.log('\n--- QUOTES ---');
    if (result.quotes.length === 0) {
        console.log('NO QUOTES FOUND');
    } else {
        result.quotes.forEach((q, i) => {
            console.log(`\nQuote ${i + 1}:`);
            console.log(`  Speaker: ${q.speaker_name || 'UNKNOWN'}`);
            console.log(`  Title: ${q.speaker_title || 'N/A'}`);
            console.log(`  Attribution: ${q.full_attribution || 'N/A'}`);
            console.log(`  Text: ${q.quote_text.substring(0, 80)}...`);
        });
    }
});

console.log('\n\n' + '='.repeat(80));
console.log('PATTERNS IDENTIFIED');
console.log('='.repeat(80));
console.log('\n1. DATELINE FORMAT:');
console.log('   AOC releases have:');
console.log('     Line 1: Headline');
console.log('     Line 3: Date only (e.g., "September 19, 2025")');
console.log('     Line 5: Location only (e.g., "Washington, D.C.")');
console.log('   Instead of standard: "LOCATION — Date" format');
console.log('');
console.log('2. STATEMENT FORMAT (aoc_01_kirk.txt):');
console.log('   "Representative ... released a statement..."');
console.log('   Then multiple paragraphs of quoted text without attribution');
console.log('');
console.log('3. Check if "said Ocasio-Cortez" is being parsed correctly');
console.log('');
