const DemocraticSpeechChecker = require('./backend/utils/democratic-speech-checker');
const fs = require('fs');

const checker = new DemocraticSpeechChecker();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('         DEMOCRATIC SPEECH SIMPLIFICATION - SPANBERGER TEST');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Test the problematic Connor Joseph quote from earlier
const connorQuote = `Amid the Trump Administration's DOGE attacks, tariff policies, and tax law driving up costs for Virginia families and causing chaos for businesses, Virginians are seeing their economic security threatened.`;

console.log('TEST 1: Connor Joseph Quote (38 words, passive voice, complex)');
console.log('────────────────────────────────────────────────────────────────');
console.log(`ORIGINAL: "${connorQuote}"`);
console.log();

const result1 = checker.analyzeSpeech(connorQuote);

console.log(`ISSUES FOUND: ${result1.summary.readableMessage}`);
console.log();

result1.issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
    console.log(`   ${issue.message}`);
    console.log(`   ${issue.details}`);
    if (issue.rewrite) {
        console.log(`   REWRITE: "${issue.rewrite}"`);
    }
    if (issue.replaceable && issue.searchText && issue.replaceWith) {
        console.log(`   ONE-CLICK: Replace "${issue.searchText}" → "${issue.replaceWith}"`);
    }
    console.log();
});

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Test on actual Spanberger release
console.log('TEST 2: Full Spanberger Release (Mass Firings)');
console.log('────────────────────────────────────────────────────────────────');

const spanbergerText = fs.readFileSync('./cpo_examples/spanberger_01_mass_firings.txt', 'utf8');

// Extract body text (skip headline/dateline)
const lines = spanbergerText.split('\n').filter(l => l.trim());
const bodyText = lines.slice(3).join(' '); // Skip first 3 lines (headline, blank, dateline)

const result2 = checker.analyzeSpeech(bodyText);

console.log(`TEXT: ${lines[0]}`); // Show headline
console.log();
console.log(`TOTAL SENTENCES: ${result2.totalSentences}`);
console.log(`ISSUES FOUND: ${result2.summary.readableMessage}`);
console.log();

// Group by severity
const errors = result2.issues.filter(i => i.severity === 'error');
const warnings = result2.issues.filter(i => i.severity === 'warning');
const info = result2.issues.filter(i => i.severity === 'info');

if (errors.length > 0) {
    console.log(`CRITICAL ISSUES (${errors.length}):`);
    console.log('─'.repeat(60));
    errors.forEach(issue => {
        console.log(`Sentence ${issue.sentenceNumber}: ${issue.message}`);
        if (issue.rewrite) {
            console.log(`  REWRITE: ${issue.rewrite.substring(0, 100)}${issue.rewrite.length > 100 ? '...' : ''}`);
        }
    });
    console.log();
}

if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length}):`);
    console.log('─'.repeat(60));
    warnings.forEach(issue => {
        console.log(`Sentence ${issue.sentenceNumber}: ${issue.message}`);
    });
    console.log();
}

if (info.length > 0) {
    console.log(`SUGGESTIONS (${info.length}):`);
    console.log('─'.repeat(60));

    // Group by type
    const passiveVoice = info.filter(i => i.type === 'passive_voice');
    const complexWords = info.filter(i => i.type === 'complex_word');

    if (passiveVoice.length > 0) {
        console.log(`\n  Passive Voice (${passiveVoice.length}):`);
        passiveVoice.forEach(issue => {
            console.log(`    • "${issue.passivePhrase}" → ${issue.suggestion}`);
        });
    }

    if (complexWords.length > 0) {
        console.log(`\n  Complex Words (${complexWords.length}) - One-Click Replacements:`);
        complexWords.forEach(issue => {
            console.log(`    • "${issue.complexWord}" → "${issue.replaceWith}"`);
        });
    }
    console.log();
}

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();
console.log('Democratic Speech Checker Features:');
console.log('  ✓ Sentence Length: Warning at 25 words, Critical at 30+');
console.log('  ✓ Passive Voice: Detects and suggests active alternatives');
console.log('  ✓ Complex Words: One-click replacements with simpler alternatives');
console.log('  ✓ Sentence Splitting: Auto-generates rewrites at natural break points');
console.log();
console.log('Each issue includes:');
console.log('  • Severity level (error/warning/info)');
console.log('  • Clear message explaining the problem');
console.log('  • Actionable suggestion or rewrite');
console.log('  • One-click replacement where applicable');
console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
