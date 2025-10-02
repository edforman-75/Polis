const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

// Monkey-patch to intercept raw quotes before combining
const originalParse = PressReleaseParser.prototype.parse;
PressReleaseParser.prototype.parse = function(text) {
    const originalExtract = this.extractRegularQuotes;
    this.extractRegularQuotes = function(text, skipPositions) {
        const rawQuotes = originalExtract.call(this, text, skipPositions);

        console.log('\n=== RAW QUOTES (before combining) ===');
        rawQuotes.forEach((q, i) => {
            console.log(`\nRaw Quote ${i + 1}:`);
            console.log(`  Text: "${q.quote_text.substring(0, 60)}..."`);
            console.log(`  Speaker: ${q.speaker_name || 'UNKNOWN'}`);
            console.log(`  Full attribution: "${q.full_attribution}"`);
            console.log(`  isMultiPart: ${q.isMultiPart}`);
            console.log(`  isEnd: ${q.isEnd}`);
        });
        console.log('\n');

        return rawQuotes;
    };

    return originalParse.call(this, text);
};

const parser = new PressReleaseParser();
const filePath = path.join(__dirname, 'cpo_examples', 'porter_02_momentum.txt');
const text = fs.readFileSync(filePath, 'utf8');
const result = parser.parse(text);

console.log('=== FINAL QUOTES (after combining) ===');
result.quotes.forEach((q, i) => {
    console.log(`\nFinal Quote ${i + 1}:`);
    console.log(`  Text: "${q.quote_text.substring(0, 60)}..."`);
    console.log(`  Speaker: ${q.speaker_name || 'UNKNOWN'}`);
    console.log(`  Full attribution: "${q.full_attribution}"`);
});
