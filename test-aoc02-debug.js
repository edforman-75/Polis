const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const text = fs.readFileSync('./cpo_examples/aoc_02_israel.txt', 'utf8');

console.log('=== AOC_02 Quote Debugging ===\n');

// Find the quote line
const lines = text.split('\n');
lines.forEach((line, i) => {
    if (line.includes('The Israeli government has now killed')) {
        console.log(`Line ${i + 1}: ${line}`);
        console.log(`\nChecking if this matches our patterns:\n`);

        // Check if "said Ocasio-Cortez" pattern matches
        const afterQuotePattern = /said Ocasio-Cortez/;
        if (afterQuotePattern.test(line)) {
            console.log('✓ Contains "said Ocasio-Cortez"');
        } else {
            console.log('✗ Does NOT contain "said Ocasio-Cortez"');
        }

        // Check the standard attribution pattern
        const standardPattern = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z][^,]+?)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|\.$|$)/i;
        const afterContext = line.substring(line.indexOf('"', line.indexOf('The Israeli')) + 1);
        console.log(`\nContext after quote: "${afterContext.substring(0, 80)}"`);

        const match = afterContext.match(standardPattern);
        if (match) {
            console.log(`✓ Standard pattern matched: "${match[0]}"`);
            console.log(`  Verb: ${match[1]}`);
            console.log(`  Name: ${match[2]}`);
        } else {
            console.log('✗ Standard pattern did NOT match');
        }
    }
});

// Now parse and check result
const result = parser.parse(text);
console.log('\n=== Parser Result ===');
console.log(`Total quotes: ${result.quotes.length}`);
if (result.quotes.length > 0) {
    console.log(`\nQuote 1:`);
    console.log(`  Speaker: ${result.quotes[0].speaker_name || 'UNKNOWN'}`);
    console.log(`  Attribution: ${result.quotes[0].full_attribution || 'N/A'}`);
    console.log(`  Text: ${result.quotes[0].quote_text.substring(0, 60)}...`);
}
