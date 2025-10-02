const fs = require('fs');

const content = fs.readFileSync('cpo_examples/sherrill_07_gateway_trump.txt', 'utf-8');

console.log('='.repeat(80));
console.log('MULTI-PARAGRAPH QUOTE DEBUG');
console.log('='.repeat(80));
console.log();

// Split into paragraphs
const paragraphs = content.split(/\n\n+/);

console.log(`Total paragraphs: ${paragraphs.length}`);
console.log();

// Look for paragraphs starting with quote
paragraphs.forEach((para, i) => {
    const trimmed = para.trim();
    if (trimmed.match(/^[""]/) && trimmed.length > 20) {
        const hasClosing = trimmed.match(/[""][^"""]*$/);
        console.log(`Para ${i}:`);
        console.log(`  Starts with quote: YES`);
        console.log(`  Has closing quote: ${hasClosing ? 'YES' : 'NO'}`);
        console.log(`  Length: ${trimmed.length} chars`);
        console.log(`  Preview: ${trimmed.substring(0, 100)}...`);
        console.log(`  Last 50: ...${trimmed.substring(trimmed.length - 50)}`);
        console.log();
    }
});
