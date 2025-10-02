const fs = require('fs');
const path = require('path');

// Monkey-patch to add comprehensive logging
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    const module = originalRequire.apply(this, arguments);

    if (id === './backend/utils/press-release-parser') {
        const originalParse = module.prototype.parse;

        module.prototype.parse = function(text) {
            console.log('\n========== PARSE() START ==========\n');

            // Capture extractMultiParagraphQuotes
            const origMultiPara = this.extractMultiParagraphQuotes;
            this.extractMultiParagraphQuotes = function(text) {
                const result = origMultiPara.call(this, text);
                console.log(`[extractMultiParagraphQuotes] returned ${result.length} quotes`);
                result.forEach((q, i) => console.log(`  ${i}: "${q.quote_text.substring(0, 40)}..."`));
                return result;
            };

            // Capture extractRegularQuotes
            const origRegular = this.extractRegularQuotes;
            this.extractRegularQuotes = function(text, skip) {
                const result = origRegular.call(this, text, skip);
                console.log(`\n[extractRegularQuotes] returned ${result.length} quotes`);
                result.forEach((q, i) => console.log(`  ${i}: speaker="${q.speaker_name}", attr="${q.full_attribution}", text="${q.quote_text.substring(0, 40)}..."`));
                return result;
            };

            const result = originalParse.call(this, text);

            console.log(`\n[parse()] returning ${result.quotes.length} quotes`);
            result.quotes.forEach((q, i) => console.log(`  ${i}: speaker="${q.speaker_name}", text="${q.quote_text.substring(0, 40)}..."`));
            console.log('\n========== PARSE() END ==========\n');

            return result;
        };
    }

    return module;
};

const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

const filePath = path.join(__dirname, 'cpo_examples', 'porter_01_launch.txt');
const text = fs.readFileSync(filePath, 'utf8');

const result = parser.parse(text);

console.log('\n===== FINAL RESULT =====');
console.log(`Total quotes: ${result.quotes.length}`);
console.log('Headline:', result.content_structure.headline);
