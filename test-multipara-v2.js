const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const content = fs.readFileSync('cpo_examples/sherrill_07_gateway_trump.txt', 'utf-8');

console.log('='.repeat(80));
console.log('TESTING extractMultiParagraphQuotes');
console.log('='.repeat(80));
console.log();

const parser = new PressReleaseParser();
const multiParaQuotes = parser.extractMultiParagraphQuotes(content);

console.log(`Found ${multiParaQuotes.length} multi-paragraph quotes`);
console.log();

multiParaQuotes.forEach((quote, i) => {
    console.log(`Multi-para Quote ${i + 1}:`);
    console.log(`  Speaker: ${quote.speaker_name || 'UNKNOWN'}`);
    console.log(`  Title: ${quote.speaker_title || 'none'}`);
    console.log(`  Attribution: ${quote.full_attribution}`);
    console.log(`  Text length: ${quote.quote_text.length} chars`);
    console.log(`  Preview: ${quote.quote_text.substring(0, 150)}...`);
    console.log();
});
