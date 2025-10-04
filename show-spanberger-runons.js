const DemocraticSpeechChecker = require('./backend/utils/democratic-speech-checker');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const checker = new DemocraticSpeechChecker();
const parser = new PressReleaseParser();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('          SPANBERGER RUN-ON SENTENCE EXAMPLES');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Get all Spanberger files
const files = fs.readdirSync('./cpo_examples')
    .filter(f => f.startsWith('spanberger_'))
    .sort();

const allRunOns = [];

files.forEach((filename) => {
    const filepath = path.join('./cpo_examples', filename);
    const text = fs.readFileSync(filepath, 'utf8');

    // Extract body paragraphs
    const structure = parser.extractContentStructure(text);
    const bodyText = [structure.lead_paragraph, ...structure.body_paragraphs]
        .filter(p => p.trim().length > 0)
        .join('\n\n');

    const result = checker.analyzeSpeech(bodyText);

    // Get critical and warning length issues
    const runOns = result.issues.filter(i =>
        i.type === 'sentence_length_critical' || i.type === 'sentence_length_warning'
    );

    runOns.forEach(issue => {
        allRunOns.push({
            file: filename,
            ...issue
        });
    });
});

// Sort by word count (worst first)
allRunOns.sort((a, b) => b.wordCount - a.wordCount);

console.log(`Found ${allRunOns.length} run-on sentences across ${files.length} releases`);
console.log();

// Show top 10 worst examples
console.log('TOP 10 WORST RUN-ON SENTENCES:');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

allRunOns.slice(0, 10).forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.file} - ${issue.wordCount} WORDS [${issue.severity.toUpperCase()}]`);
    console.log('─'.repeat(79));
    console.log();
    console.log('ORIGINAL:');
    console.log(`"${issue.sentence}"`);
    console.log();
    console.log('SUGGESTED REWRITE:');
    console.log(`"${issue.rewrite}"`);
    console.log();
    console.log('WHY IT\'S A PROBLEM:');
    console.log(`• ${issue.wordCount} words (target: max 25)`);
    console.log(`• ${issue.details}`);
    console.log();
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log();
});

// Group by severity
const critical = allRunOns.filter(i => i.severity === 'error');
const warnings = allRunOns.filter(i => i.severity === 'warning');

console.log('SUMMARY BY SEVERITY:');
console.log('─'.repeat(79));
console.log(`Critical (30+ words): ${critical.length}`);
console.log(`Warning (25-29 words): ${warnings.length}`);
console.log(`Total run-ons: ${allRunOns.length}`);
console.log();

// Show distribution
console.log('WORD COUNT DISTRIBUTION:');
console.log('─'.repeat(79));
const distribution = {};
allRunOns.forEach(r => {
    const bucket = Math.floor(r.wordCount / 5) * 5;
    distribution[bucket] = (distribution[bucket] || 0) + 1;
});

Object.keys(distribution).sort((a, b) => a - b).forEach(bucket => {
    const count = distribution[bucket];
    const bar = '█'.repeat(Math.ceil(count / 2));
    console.log(`${bucket}-${parseInt(bucket) + 4} words: ${bar} (${count})`);
});

console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
