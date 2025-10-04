const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

// Test the three failing files
const files = [
    { name: 'spanberger_02_jobs_economy.txt', expected: 'Connor Joseph (lost ranking quote)' },
    { name: 'spanberger_07_msnbc_appearance.txt', expected: 'Spanberger (4 quotes)' },
    { name: 'spanberger_09_jobs_data.txt', expected: 'Connor Joseph' }
];

const parser = new PressReleaseParser();

files.forEach(file => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${file.name}`);
    console.log('='.repeat(80));

    const text = fs.readFileSync(`./cpo_examples/${file.name}`, 'utf8');
    const parsed = parser.parse(text);
    const quotes = parsed.quotes || [];

    console.log(`Total quotes found: ${quotes.length}\n`);

    quotes.forEach((quote, i) => {
        const speaker = quote.speaker_name || 'UNKNOWN';
        const preview = quote.quote_text.substring(0, 60);
        const isUnknown = speaker === 'Unknown Speaker' || speaker === 'UNKNOWN' || !speaker || speaker.trim() === '';

        console.log(`Quote ${i + 1}: ${isUnknown ? '❌' : '✓'}`);
        console.log(`  Speaker: "${speaker}"`);
        console.log(`  Text: "${preview}..."`);
        console.log(`  Attribution: "${quote.full_attribution}"`);

        // Show context around the quote in the original text
        const pos = text.indexOf(quote.quote_text);
        if (pos !== -1) {
            const before = text.substring(Math.max(0, pos - 50), pos);
            const after = text.substring(pos + quote.quote_text.length, pos + quote.quote_text.length + 50);
            console.log(`  Context before: "...${before}"`);
            console.log(`  Context after: "${after}..."`);
        }
        console.log();
    });
});
