const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('PRESS RELEASE VALIDATION SYSTEM TEST');
console.log('Testing quality validation with good and bad examples');
console.log('================================================================================\n');

const testFiles = [
    { file: 'porter_01_launch.txt', expected: 'excellent/good' },
    { file: 'sherrill_03_tax_returns.txt', expected: 'fair/poor' },
    { file: 'release_01.txt', expected: 'rejected' },
    { file: 'hybrid_release_01.txt', expected: 'good' },
];

testFiles.forEach(({ file, expected }) => {
    const filePath = path.join(__dirname, 'cpo_examples', file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}\n`);
        return;
    }

    const text = fs.readFileSync(filePath, 'utf8');
    const result = parser.parseWithValidation(text);
    const val = result.validation;

    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${file}`);
    console.log(`Expected: ${expected}`);
    console.log(`${'='.repeat(80)}`);

    // Status indicator
    const statusIcons = {
        'excellent': '✅',
        'good': '✅',
        'fair': '⚠️',
        'poor': '⚠️',
        'rejected': '❌'
    };

    console.log(`\n${statusIcons[val.status]} STATUS: ${val.status.toUpperCase()}`);
    console.log(`📊 Quality Score: ${val.quality_score}/100`);
    console.log(`${val.should_reject ? '🚫 SHOULD REJECT: Yes' : '✅ SHOULD REJECT: No'}`);

    // Metrics
    console.log('\n📋 METRICS:');
    console.log(`  • Quotes: ${val.metrics.quote_count}`);
    console.log(`  • Unknown speakers: ${val.metrics.unknown_speakers} (${val.metrics.unknown_speaker_percentage}%)`);
    console.log(`  • Body length: ${val.metrics.body_length} chars`);
    console.log(`  • Has dateline: ${val.metrics.has_dateline ? 'Yes' : 'No'}`);
    console.log(`  • Has headline: ${val.metrics.has_headline ? 'Yes' : 'No'}`);
    console.log(`  • Has FOR IMMEDIATE RELEASE: ${val.metrics.has_for_immediate_release ? 'Yes' : 'No'}`);

    // Errors
    if (val.errors.length > 0) {
        console.log('\n❌ ERRORS (Critical Issues):');
        val.errors.forEach((err, i) => {
            console.log(`  ${i + 1}. ${err.message}`);
            console.log(`     💡 ${err.suggestion}`);
        });
    }

    // Warnings
    if (val.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        val.warnings.forEach((warn, i) => {
            const severityIcon = {
                'high': '🔴',
                'medium': '🟡',
                'low': '🟢'
            }[warn.severity];
            console.log(`  ${severityIcon} [${warn.severity.toUpperCase()}] ${warn.message}`);
            console.log(`     💡 ${warn.suggestion}`);
        });
    }

    // Suggestions
    if (val.suggestions.length > 0) {
        console.log('\n💬 OVERALL SUGGESTIONS:');
        val.suggestions.forEach(sug => {
            console.log(`  • ${sug}`);
        });
    }

    // Verdict
    console.log('\n' + '─'.repeat(80));
    if (val.should_reject) {
        console.log('🚫 VERDICT: REJECTED - This press release cannot be processed.');
        console.log('   Please fix all critical errors and resubmit.');
    } else if (val.status === 'poor') {
        console.log('⚠️  VERDICT: ACCEPTED WITH MAJOR ISSUES');
        console.log('   This release can be parsed but has significant quality problems.');
    } else if (val.status === 'fair') {
        console.log('⚠️  VERDICT: ACCEPTED WITH MINOR ISSUES');
        console.log('   This release is parseable but could be improved.');
    } else {
        console.log('✅ VERDICT: ACCEPTED - Good quality press release.');
    }
});

console.log('\n\n' + '='.repeat(80));
console.log('VALIDATION SYSTEM SUMMARY');
console.log('='.repeat(80));
console.log('\nThe validation system checks:');
console.log('  ❌ CRITICAL ERRORS (auto-reject if score < 40):');
console.log('     • Missing FOR IMMEDIATE RELEASE header (-30 points)');
console.log('     • No quotes found (-40 points)');
console.log('     • No meaningful headline (-25 points)');
console.log('     • Insufficient content < 100 chars (-35 points)');
console.log('\n  ⚠️  HIGH-PRIORITY WARNINGS:');
console.log('     • Missing dateline (-15 points)');
console.log('     • >75% unknown speakers (-20 points)');
console.log('     • >50% unknown speakers (-10 points)');
console.log('\n  🟡 MEDIUM WARNINGS:');
console.log('     • Only 1 quote (-5 points)');
console.log('     • Some unknown speakers (-5 points)');
console.log('     • Short content < 200 chars (-5 points)');
console.log('\n📊 QUALITY TIERS:');
console.log('     • 90-100: Excellent');
console.log('     • 75-89:  Good');
console.log('     • 60-74:  Fair');
console.log('     • 40-59:  Poor (parseable with issues)');
console.log('     • 0-39:   Rejected (too many critical errors)');
console.log('');
