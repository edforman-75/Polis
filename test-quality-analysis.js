const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('PRESS RELEASE QUALITY ANALYSIS');
console.log('Analyzing all releases to identify common quality issues');
console.log('================================================================================\n');

const allFiles = [
    // Real campaigns
    { file: 'sherrill_01_trump_funding.txt', source: 'Sherrill (Real)' },
    { file: 'sherrill_02_lt_gov_debate.txt', source: 'Sherrill (Real)' },
    { file: 'sherrill_03_tax_returns.txt', source: 'Sherrill (Real)' },
    { file: 'sherrill_04_utility_emergency.txt', source: 'Sherrill (Real)' },
    { file: 'sherrill_05_pcm_endorse.txt', source: 'Sherrill (Real)' },
    { file: 'porter_01_launch.txt', source: 'Porter (Real)' },
    { file: 'porter_02_momentum.txt', source: 'Porter (Real)' },
    { file: 'porter_03_poll.txt', source: 'Porter (Real)' },
    { file: 'porter_04_min_endorsement.txt', source: 'Porter (Real)' },
    // Training examples
    { file: 'hybrid_release_01.txt', source: 'Hybrid (Training)' },
    { file: 'release_01.txt', source: 'Bad Example (Training)' },
];

const qualityIssues = {
    noDateline: [],
    noQuotes: [],
    noHeadline: [],
    tooShort: [],
    highUnknownSpeakers: [],
    noAttribution: [],
};

allFiles.forEach(({ file, source }) => {
    const filePath = path.join(__dirname, 'cpo_examples', file);

    if (!fs.existsSync(filePath)) {
        return;
    }

    const text = fs.readFileSync(filePath, 'utf8');
    const result = parser.parse(text);

    console.log(`\n--- ${file} (${source}) ---`);

    // Check for issues
    const issues = [];

    // Missing dateline
    if (!result.content_structure.dateline?.date && !result.content_structure.dateline?.location) {
        issues.push('❌ No dateline (location/date)');
        qualityIssues.noDateline.push(file);
    }

    // No quotes
    if (result.quotes.length === 0) {
        issues.push('❌ No quotes extracted');
        qualityIssues.noQuotes.push(file);
    }

    // No headline
    if (!result.content_structure.headline || result.content_structure.headline.length < 10) {
        issues.push('❌ No meaningful headline');
        qualityIssues.noHeadline.push(file);
    }

    // Too short
    const bodyLength = result.content_structure.body_paragraphs?.join(' ').length || 0;
    if (bodyLength < 100) {
        issues.push(`❌ Body too short (${bodyLength} chars)`);
        qualityIssues.tooShort.push(file);
    }

    // High percentage of unknown speakers
    const unknownCount = result.quotes.filter(q => !q.speaker_name || q.speaker_name === 'UNKNOWN').length;
    const unknownPct = result.quotes.length > 0 ? (unknownCount / result.quotes.length * 100) : 0;
    if (unknownPct > 50 && result.quotes.length > 1) {
        issues.push(`⚠️  High unknown speakers (${unknownPct.toFixed(0)}%)`);
        qualityIssues.highUnknownSpeakers.push(file);
    }

    // Quotes without attribution
    const noAttrCount = result.quotes.filter(q => !q.full_attribution || q.full_attribution === 'Unknown Speaker').length;
    if (noAttrCount > 0) {
        issues.push(`⚠️  ${noAttrCount} quotes without attribution`);
        qualityIssues.noAttribution.push(file);
    }

    if (issues.length === 0) {
        console.log('✅ Good quality - no major issues');
    } else {
        console.log('Issues found:');
        issues.forEach(issue => console.log(`  ${issue}`));
    }

    // Show summary
    console.log(`Summary: ${result.quotes.length} quotes, ${unknownCount} unknown speakers`);
});

console.log('\n\n================================================================================');
console.log('QUALITY ISSUES SUMMARY');
console.log('================================================================================');
console.log(`Missing dateline: ${qualityIssues.noDateline.length} files`);
console.log(`No quotes: ${qualityIssues.noQuotes.length} files`);
console.log(`No headline: ${qualityIssues.noHeadline.length} files`);
console.log(`Body too short: ${qualityIssues.tooShort.length} files`);
console.log(`High unknown speakers (>50%): ${qualityIssues.highUnknownSpeakers.length} files`);
console.log(`Quotes without attribution: ${qualityIssues.noAttribution.length} files`);

console.log('\n\nMost common issues to address:');
if (qualityIssues.highUnknownSpeakers.length > 0) {
    console.log('\n1. Unknown speakers - suggest adding proper attribution:');
    console.log('   "Quote text," said FirstName LastName.');
}
if (qualityIssues.noDateline.length > 0) {
    console.log('\n2. Missing dateline - suggest format:');
    console.log('   CITY, STATE — Month Day, Year');
}
if (qualityIssues.noQuotes.length > 0) {
    console.log('\n3. No quotes - suggest adding at least one quote with attribution');
}
