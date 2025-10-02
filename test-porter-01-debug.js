const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

const filePath = path.join(__dirname, 'cpo_examples', 'porter_01_launch.txt');
const text = fs.readFileSync(filePath, 'utf8');
const result = parser.parse(text);

console.log('=== PORTER_01 RESULTS ===\n');
console.log('Quotes found:', result.quotes.length);
result.quotes.forEach((q, i) => {
    console.log(`\nQuote ${i + 1}:`);
    console.log(`  Speaker: ${q.speaker_name || 'UNKNOWN'}`);
    console.log(`  Full text: "${q.quote_text}"`);
    console.log(`  Attribution: ${q.full_attribution}`);
});

console.log('\n\n=== EXPECTED ===');
console.log('3 quotes total');
console.log('Quote 1: "What California needs now..." - Porter');
console.log('Quote 2: "As Governor, I\'ll bring all voices..." - Porter');
console.log('Quote 3: "I\'ve only ever been motivated..." - Porter (via "she said")');
