const fs = require('fs');
const path = require('path');

// Inject debug logging into the parser
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    const module = originalRequire.apply(this, arguments);

    if (id === './backend/utils/press-release-parser') {
        const originalParse = module.prototype.extractRegularQuotes;

        module.prototype.extractRegularQuotes = function(text, skipPositions) {
            const result = originalParse.call(this, text, skipPositions);

            console.log('\n=== INTERNAL: Combined quotes returned by extractRegularQuotes ===');
            result.forEach((q, i) => {
                console.log(`\nQuote ${i}:`);
                console.log(`  speaker: "${q.speaker_name}"`);
                console.log(`  attribution: "${q.full_attribution}"`);
                console.log(`  text: "${q.quote_text.substring(0, 60)}..."`);
            });

            return result;
        };
    }

    return module;
};

const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

const filePath = path.join(__dirname, 'cpo_examples', 'porter_01_launch.txt');
const text = fs.readFileSync(filePath, 'utf8');

console.log('=== PORTER_01 QUOTES ===\n');

// Show raw text of quotes
const lines = text.split('\n');
lines.forEach((line, i) => {
    if (line.includes('"')) {
        console.log(`Line ${i + 1}: ${line}`);
    }
});

const result = parser.parse(text);

console.log('\n\n=== FINAL OUTPUT ===');
console.log(`Total quotes: ${result.quotes.length}`);
