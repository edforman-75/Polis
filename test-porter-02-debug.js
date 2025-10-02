const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

const filePath = path.join(__dirname, 'cpo_examples', 'porter_02_momentum.txt');
const text = fs.readFileSync(filePath, 'utf8');

console.log('=== RAW TEXT ===');
console.log(text);
console.log('\n=== PARSING ===\n');

const result = parser.parse(text);

console.log('Quotes found:', result.quotes.length);
result.quotes.forEach((q, i) => {
    console.log(`\nQuote ${i + 1}:`);
    console.log(`  Speaker: ${q.speaker_name || 'UNKNOWN'}`);
    console.log(`  Full text: "${q.quote_text}"`);
    console.log(`  Attribution: ${q.full_attribution}`);
});

console.log('\n\n=== EXPECTED QUOTES ===');
console.log('1. "Kamala Harris is a focused leader..." said Porter');
console.log('2. "Our state faces serious challenges..." Porter continued');
console.log('3. "Donald Trump is doing everything..." she added');
