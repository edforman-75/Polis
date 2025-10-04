const fs = require('fs');
const text = fs.readFileSync('./cpo_examples/spanberger_13_trump_tax_ad.txt', 'utf8');

const rawText = text.trim();

// Find dateline
const datelinePattern = /([A-Z][a-zA-Z\s,\.]+)\s*[–—-]\s*([A-Z][a-z]+\s+\d+,?\s+\d{4})/;
const match = rawText.match(datelinePattern);

if (match) {
    console.log('Dateline match found!');
    console.log('Full match:', JSON.stringify(match[0]));
    console.log('Match index:', match.index);

    const datelineIndex = match.index;
    const beforeDateline = rawText.substring(0, datelineIndex).trim();

    console.log('\nBefore dateline:', JSON.stringify(beforeDateline));
    console.log('\nBefore dateline length:', beforeDateline.length);

    const beforeLines = beforeDateline.split('\n');
    console.log('\nLines before dateline:', beforeLines.length);

    const candidates = [];
    for (let i = 0; i < beforeLines.length; i++) {
        const line = beforeLines[i].trim();

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
            console.log('  Length:', line.length);
        }
    }

    console.log('\n=== FILTERING ===');
    const headlines = candidates.filter(c => {
        const hasColon = c.includes(':') && !c.startsWith('ICYMI:') && !c.startsWith('NEW:');
        const hasQuotes = /[""]/.test(c);
        const skip = hasColon && hasQuotes;
        console.log(`Checking: "${c.substring(0, 50)}..."`);
        console.log(`  Has colon (excludes ICYMI:/NEW:): ${hasColon}`);
        console.log(`  Has quotes: ${hasQuotes}`);
        console.log(`  Skip?: ${skip}`);
        return !skip;
    });

    console.log('\n=== RESULT ===');
    const best = headlines.length > 0 ? headlines : candidates;
    const result = best.sort((a, b) => b.length - a.length)[0];
    console.log('FINAL HEADLINE:', JSON.stringify(result));
    console.log('LENGTH:', result.length);
} else {
    console.log('No dateline match found!');
}
