const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const files = [
    'spanberger_01_mass_firings.txt',
    'spanberger_02_jobs_economy.txt',
    'spanberger_03_abortion_ad.txt',
    'spanberger_04_shutdown_statement.txt',
    'spanberger_05_trump_norfolk_visit.txt',
    'spanberger_06_one_month_election.txt',
    'spanberger_07_msnbc_appearance.txt',
    'spanberger_08_mass_firings_shutdown.txt',
    'spanberger_09_jobs_data.txt',
    'spanberger_10_abortion_ad.txt',
    'spanberger_11_fire_fighters_endorsement.txt',
    'spanberger_12_votevets_endorsement.txt',
    'spanberger_13_trump_tax_ad.txt',
    'spanberger_14_healthcare_costs.txt'
];

console.log('='.repeat(80));
console.log('SPANBERGER EXAMPLE ANALYSIS - EDGE CASE DISCOVERY');
console.log('='.repeat(80));
console.log();

const issues = {
    headlines: [],
    datelines: [],
    quotes: [],
    body: [],
    other: []
};

files.forEach((filename, index) => {
    const filepath = path.join('./cpo_examples', filename);
    const text = fs.readFileSync(filepath, 'utf8');

    console.log(`\n[${ index + 1}/14] ${filename}`);
    console.log('-'.repeat(80));

    // Show first 3 lines for context
    const firstLines = text.trim().split('\n').slice(0, 3);
    console.log('First 3 lines:');
    firstLines.forEach((line, i) => {
        console.log(`  ${i + 1}: ${line.substring(0, 75)}${line.length > 75 ? '...' : ''}`);
    });

    // Parse
    const parsed = parser.parse(text);

    // Extract headline
    const headline = parsed.content_structure?.headline || 'NOT FOUND';
    console.log(`\nHeadline: ${headline}`);

    // Check for issues
    if (headline === 'NOT FOUND' || headline.length < 10) {
        issues.headlines.push({ file: filename, issue: 'Missing or too short', headline });
    }
    if (headline.includes('-') && !headline.includes(' - ')) {
        issues.headlines.push({ file: filename, issue: 'Contains hyphen (not dateline separator)', headline });
    }

    // Extract dateline
    const datelineObj = parsed.content_structure?.dateline;
    const dateline = datelineObj?.full || datelineObj || 'NOT FOUND';
    console.log(`Dateline: ${dateline}`);

    if (!datelineObj || dateline === 'NOT FOUND' || !datelineObj.full) {
        issues.datelines.push({ file: filename, issue: 'Not found or incomplete', dateline: dateline });
    }

    // Check quotes
    const quotes = parsed.quotes || [];
    console.log(`Quotes: ${quotes.length} found`);

    if (quotes.length > 0) {
        quotes.forEach((q, i) => {
            const speaker = q.speaker_name || 'Unknown';
            const preview = q.quote_text.substring(0, 50);
            console.log(`  ${i + 1}. ${speaker}: "${preview}${q.quote_text.length > 50 ? '...' : ''}"`);

            if (speaker === 'Unknown' || speaker === 'Unknown Speaker') {
                issues.quotes.push({
                    file: filename,
                    issue: 'Unknown speaker',
                    quote: preview
                });
            }
        });
    }

    // Check body paragraphs
    const body = parsed.content_structure?.body_paragraphs || [];
    console.log(`Body paragraphs: ${body.length}`);

    if (body.length === 0) {
        issues.body.push({ file: filename, issue: 'No body paragraphs extracted' });
    }
});

// Summary
console.log('\n\n');
console.log('='.repeat(80));
console.log('EDGE CASES & ISSUES SUMMARY');
console.log('='.repeat(80));

console.log('\n📰 HEADLINE ISSUES:');
if (issues.headlines.length === 0) {
    console.log('  ✓ All headlines extracted correctly');
} else {
    issues.headlines.forEach(item => {
        console.log(`  ❌ ${item.file}: ${item.issue}`);
        console.log(`     "${item.headline}"`);
    });
}

console.log('\n📍 DATELINE ISSUES:');
if (issues.datelines.length === 0) {
    console.log('  ✓ All datelines extracted correctly');
} else {
    issues.datelines.forEach(item => {
        console.log(`  ❌ ${item.file}: ${item.issue}`);
    });
}

console.log('\n💬 QUOTE ISSUES:');
if (issues.quotes.length === 0) {
    console.log('  ✓ All quotes have speakers');
} else {
    issues.quotes.forEach(item => {
        console.log(`  ❌ ${item.file}: ${item.issue}`);
        console.log(`     "${item.quote}"`);
    });
}

console.log('\n📝 BODY ISSUES:');
if (issues.body.length === 0) {
    console.log('  ✓ All releases have body paragraphs');
} else {
    issues.body.forEach(item => {
        console.log(`  ❌ ${item.file}: ${item.issue}`);
    });
}

console.log('\n');
console.log('='.repeat(80));
console.log(`Analysis complete. Total issues found: ${
    issues.headlines.length +
    issues.datelines.length +
    issues.quotes.length +
    issues.body.length
}`);
console.log('='.repeat(80));
