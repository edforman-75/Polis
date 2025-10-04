const fs = require('fs');
const text = fs.readFileSync('./cpo_examples/spanberger_07_msnbc_appearance.txt', 'utf8');

const rawText = text.trim();
const datelineIndex = rawText.indexOf('RICHMOND, Va. — Oct 03, 2025');
const beforeDateline = rawText.substring(0, datelineIndex).trim();

console.log('Before dateline:', JSON.stringify(beforeDateline));
console.log('');

const beforeLines = beforeDateline.split('\n');
console.log('Number of lines:', beforeLines.length);
console.log('');

const candidates = [];
for (let i = 0; i < beforeLines.length; i++) {
    const line = beforeLines[i].trim();

    // Skip checks from the code
    if (!line ||
        line.includes('FOR IMMEDIATE RELEASE') ||
        line.includes('FOR RELEASE') ||
        /^Contact:/i.test(line) ||
        /^Media Contact:/i.test(line) ||
        /^Press Contact:/i.test(line) ||
        (line.includes('@') && line.length < 50) ||
        /^\w+\s+\d+,?\s+\d{4}$/.test(line) ||
        line.startsWith('"') && line.endsWith('"')) {
        console.log('SKIP line', i + ':', JSON.stringify(line));
        continue;
    }

    if (line.length > 10) {
        candidates.push(line);
        console.log('CANDIDATE', candidates.length + ':', JSON.stringify(line));
    }
}

console.log('');
console.log('Filtering for headlines (no colon+quotes)...');
const headlines = candidates.filter(c => {
    const hasColon = c.includes(':') && !c.startsWith('ICYMI:') && !c.startsWith('NEW:');
    const hasQuotes = /[""]/.test(c);
    const skip = hasColon && hasQuotes;
    if (skip) console.log('FILTERED OUT:', JSON.stringify(c.substring(0, 50)));
    return !skip;
});

console.log('');
console.log('Best candidates:', headlines.length);
const best = headlines.length > 0 ? headlines : candidates;
const result = best.sort((a, b) => b.length - a.length)[0];

console.log('');
console.log('FINAL RESULT:', JSON.stringify(result));
console.log('LENGTH:', result.length);
