const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const filePath = path.join(__dirname, 'cpo_examples', 'porter_02_momentum.txt');
const text = fs.readFileSync(filePath, 'utf8');

// Call extractRegularQuotes directly to get raw quotes
const rawQuotes = parser.extractRegularQuotes(text, []);

console.log('=== RAW QUOTES ===\n');
rawQuotes.forEach((q, i) => {
    console.log(`Quote ${i}:`);
    console.log(`  speaker_name: "${q.speaker_name}"`);
    console.log(`  full_attribution: "${q.full_attribution}"`);
    console.log(`  isMultiPart: ${q.isMultiPart}`);
    console.log(`  isEnd: ${q.isEnd}`);
    console.log(`  text: "${q.quote_text.substring(0, 50)}..."`);
    console.log('');
});

console.log('\n=== SIMULATING COMBINING LOGIC ===\n');

const combinedQuotes = [];
let i = 0;

while (i < rawQuotes.length) {
    const currentQuote = rawQuotes[i];
    let combinedText = currentQuote.quote_text;
    let j = i + 1;

    console.log(`\nProcessing Quote ${i}:`);
    console.log(`  isMultiPart: ${currentQuote.isMultiPart}`);

    if (currentQuote.isMultiPart) {
        combinedText = combinedText.slice(0, -1).trim();
        console.log(`  Removed comma, will try to combine with next quotes`);

        while (j < rawQuotes.length) {
            const nextQuote = rawQuotes[j];
            console.log(`\n  Checking Quote ${j} for combining:`);

            const distance = nextQuote.position - (currentQuote.position + 200);
            const sameSpeaker = nextQuote.speaker_name === currentQuote.speaker_name ||
                               nextQuote.speaker_name === '' ||
                               nextQuote.full_attribution === 'Unknown Speaker';
            const nextHasSeparateAttribution = nextQuote.full_attribution &&
                                              nextQuote.full_attribution !== 'Unknown Speaker' &&
                                              nextQuote.full_attribution !== currentQuote.full_attribution;

            console.log(`    distance: ${distance} (< 300? ${distance < 300})`);
            console.log(`    sameSpeaker: ${sameSpeaker}`);
            console.log(`      (nextQuote.speaker_name="${nextQuote.speaker_name}" vs currentQuote.speaker_name="${currentQuote.speaker_name}")`);
            console.log(`    nextHasSeparateAttribution: ${nextHasSeparateAttribution}`);
            console.log(`      (nextQuote.full_attribution="${nextQuote.full_attribution}" vs currentQuote.full_attribution="${currentQuote.full_attribution}")`);

            const shouldCombine = distance < 300 && sameSpeaker && !nextHasSeparateAttribution;
            console.log(`    shouldCombine: ${shouldCombine}`);

            if (shouldCombine) {
                console.log(`    → COMBINING`);
                let nextText = nextQuote.quote_text;
                if (nextQuote.isEnd) {
                    combinedText += ' ' + nextText;
                    j++;
                    break;
                } else if (nextQuote.isMultiPart) {
                    nextText = nextText.slice(0, -1).trim();
                    combinedText += ' ' + nextText;
                } else {
                    combinedText += ' ' + nextText;
                }
                j++;
            } else {
                console.log(`    → NOT COMBINING, breaking`);
                break;
            }
        }
    }

    console.log(`\n  Pushing combined quote, moving i from ${i} to ${j}`);
    combinedQuotes.push({
        quote_text: combinedText,
        speaker_name: currentQuote.speaker_name ||  '',
        full_attribution: currentQuote.full_attribution
    });

    i = j;
}

console.log('\n\n=== COMBINED QUOTES ===\n');
combinedQuotes.forEach((q, i) => {
    console.log(`Quote ${i}:`);
    console.log(`  speaker_name: "${q.speaker_name}"`);
    console.log(`  full_attribution: "${q.full_attribution}"`);
    console.log(`  text: "${q.quote_text.substring(0, 50)}..."`);
    console.log('');
});
