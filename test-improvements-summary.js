const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('IMPROVEMENTS SUMMARY - Real-World Press Releases');
console.log('Testing Sherrill and Porter files with recent improvements');
console.log('================================================================================\n');

const categories = {
    'Sherrill (Mikie for NJ - Real Campaign)': [
        'sherrill_01_trump_funding.txt',
        'sherrill_02_lt_gov_debate.txt',
        'sherrill_03_tax_returns.txt',
        'sherrill_04_utility_emergency.txt',
        'sherrill_05_pcm_endorse.txt'
    ],
    'Porter (Katie for CA Governor - Real Campaign)': [
        'porter_01_launch.txt',
        'porter_02_momentum.txt',
        'porter_03_poll.txt',
        'porter_04_min_endorsement.txt'
    ]
};

let totalFiles = 0;
let totalQuotes = 0;
let quotesWithSpeaker = 0;
let quotesWithUnknown = 0;
const improvements = [];

Object.entries(categories).forEach(([category, files]) => {
    console.log(`\n=== ${category} ===\n`);

    files.forEach(filename => {
        const filePath = path.join(__dirname, 'cpo_examples', filename);

        if (!fs.existsSync(filePath)) {
            return;
        }

        totalFiles++;
        const text = fs.readFileSync(filePath, 'utf8');
        const result = parser.parse(text);

        console.log(`${filename}`);
        console.log(`  Quotes: ${result.quotes.length}`);

        result.quotes.forEach((q, i) => {
            totalQuotes++;
            const speaker = q.speaker_name || 'UNKNOWN';
            if (speaker === 'UNKNOWN') {
                quotesWithUnknown++;
            } else {
                quotesWithSpeaker++;
            }

            const status = speaker === 'UNKNOWN' ? '❌' : '✅';
            console.log(`  ${status} Quote ${i + 1}: ${speaker}`);

            // Track specific improvements
            if (filename.includes('porter_04') && speaker === 'Dave Min') {
                improvements.push('✅ porter_04: Fixed "Rep. Dave Min" extraction (was "Rep")');
            }
            if (filename.includes('porter_01') && result.quotes.length === 3) {
                improvements.push('✅ porter_01: Fixed subhead filter - now extracts all 3 quotes');
            }
            if (filename.includes('porter_02') && speaker === 'Porter' && q.full_attribution?.includes('continued')) {
                improvements.push('✅ porter_02: Fixed "Porter continued" reversed attribution pattern');
            }
        });

        console.log('');
    });
});

console.log('================================================================================');
console.log('OVERALL RESULTS');
console.log('================================================================================');
console.log(`Files tested: ${totalFiles}`);
console.log(`Total quotes extracted: ${totalQuotes}`);
console.log(`Quotes with identified speaker: ${quotesWithSpeaker} (${Math.round(quotesWithSpeaker/totalQuotes*100)}%)`);
console.log(`Quotes with UNKNOWN speaker: ${quotesWithUnknown} (${Math.round(quotesWithUnknown/totalQuotes*100)}%)`);

console.log('\n================================================================================');
console.log('KEY IMPROVEMENTS FROM THIS SESSION');
console.log('================================================================================');
const uniqueImprovements = [...new Set(improvements)];
uniqueImprovements.forEach(imp => console.log(imp));

console.log('\n📋 Technical Improvements:');
console.log('  1. Fixed attribution pattern to handle abbreviated titles (Rep., Sen., etc.)');
console.log('  2. Enhanced extractSpeakerName to capture multi-word names after titles');
console.log('  3. Fixed subhead extraction to exclude quoted statements');
console.log('  4. Added reversed attribution pattern support (Name verb format)');
console.log('  5. Implemented previous speaker tracking for pronoun resolution');
console.log('  6. Added institutional name filtering (School, Department, Office, etc.)');
console.log('  7. Added role phrase filtering (As Governor, As President, etc.)');
console.log('');
