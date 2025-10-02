const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const examplesDir = path.join(__dirname, 'cpo_examples');

// Get all release files
const releaseFiles = fs.readdirSync(examplesDir)
    .filter(f => f.startsWith('release_') && f.endsWith('.txt'))
    .sort();

console.log(`\n${'='.repeat(80)}`);
console.log('PRESS RELEASE PARSER - COMPREHENSIVE TEST SUITE');
console.log(`Testing ${releaseFiles.length} press releases from Jane Smith campaign`);
console.log(`${'='.repeat(80)}\n`);

const results = [];
const issues = [];

releaseFiles.forEach((filename, index) => {
    const filePath = path.join(examplesDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`\n[${ index + 1}/${releaseFiles.length}] Testing: ${filename}`);
    console.log('-'.repeat(80));

    try {
        const result = parser.parse(content);

        // Collect stats
        const stats = {
            filename,
            success: true,
            headline: result.content_structure?.headline || null,
            dateline: result.content_structure?.dateline?.full || null,
            lead_length: result.content_structure?.lead_paragraph?.length || 0,
            body_paragraphs: result.content_structure?.body_paragraphs?.length || 0,
            quotes_found: result.quotes?.length || 0,
            has_boilerplate: !!result.content_structure?.boilerplate,
            content_length: content.length
        };

        // Display key info
        console.log(`  Headline: ${stats.headline ? '✓' : '✗'} ${stats.headline || '(not found)'}`);
        console.log(`  Dateline: ${stats.dateline ? '✓' : '✗'} ${stats.dateline || '(not found)'}`);
        console.log(`  Lead paragraph: ${stats.lead_length > 0 ? '✓' : '✗'} (${stats.lead_length} chars)`);
        console.log(`  Body paragraphs: ${stats.body_paragraphs}`);
        console.log(`  Quotes: ${stats.quotes_found}`);

        // Check for issues
        if (!stats.headline) {
            issues.push({ file: filename, issue: 'No headline found' });
        }
        if (!stats.dateline) {
            issues.push({ file: filename, issue: 'No dateline found' });
        }
        if (stats.lead_length === 0) {
            issues.push({ file: filename, issue: 'No lead paragraph found' });
        }

        // Show quotes
        if (result.quotes && result.quotes.length > 0) {
            result.quotes.forEach((quote, i) => {
                console.log(`  Quote ${i + 1}: "${quote.quote_text.substring(0, 60)}..."`);
                console.log(`    Speaker: ${quote.speaker_name || '(unknown)'}`);
                console.log(`    Title: ${quote.speaker_title || '(unknown)'}`);

                // Flag potential issues
                if (!quote.speaker_name) {
                    issues.push({ file: filename, issue: `Quote ${i + 1}: No speaker name` });
                }
            });
        }

        results.push(stats);

    } catch (error) {
        console.log(`  ✗ PARSING ERROR: ${error.message}`);
        results.push({
            filename,
            success: false,
            error: error.message
        });
        issues.push({ file: filename, issue: `Parse error: ${error.message}` });
    }
});

// Generate summary report
console.log(`\n\n${'='.repeat(80)}`);
console.log('SUMMARY REPORT');
console.log(`${'='.repeat(80)}\n`);

const successful = results.filter(r => r.success);
const failed = results.filter(r => !r.success);

console.log(`Total files tested: ${results.length}`);
console.log(`Successful parses: ${successful.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
console.log(`Failed parses: ${failed.length}\n`);

// Component extraction stats
const withHeadline = successful.filter(r => r.headline).length;
const withDateline = successful.filter(r => r.dateline).length;
const withLead = successful.filter(r => r.lead_length > 0).length;
const withQuotes = successful.filter(r => r.quotes_found > 0).length;

console.log('Component Extraction Success Rates:');
console.log(`  Headlines: ${withHeadline}/${successful.length} (${(withHeadline/successful.length*100).toFixed(1)}%)`);
console.log(`  Datelines: ${withDateline}/${successful.length} (${(withDateline/successful.length*100).toFixed(1)}%)`);
console.log(`  Lead paragraphs: ${withLead}/${successful.length} (${(withLead/successful.length*100).toFixed(1)}%)`);
console.log(`  Quotes: ${withQuotes}/${successful.length} (${(withQuotes/successful.length*100).toFixed(1)}%)\n`);

// Quote statistics
const totalQuotes = successful.reduce((sum, r) => sum + r.quotes_found, 0);
const avgQuotesPerRelease = totalQuotes / successful.length;
console.log(`Quote Statistics:`);
console.log(`  Total quotes found: ${totalQuotes}`);
console.log(`  Average per release: ${avgQuotesPerRelease.toFixed(1)}`);
console.log(`  Releases with quotes: ${withQuotes}/${successful.length}\n`);

// Issues found
if (issues.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`ISSUES DETECTED (${issues.length} total)`);
    console.log(`${'='.repeat(80)}\n`);

    // Group issues by type
    const issuesByType = {};
    issues.forEach(({ file, issue }) => {
        if (!issuesByType[issue]) {
            issuesByType[issue] = [];
        }
        issuesByType[issue].push(file);
    });

    Object.entries(issuesByType).forEach(([issueType, files]) => {
        console.log(`${issueType}: ${files.length} files`);
        files.forEach(f => console.log(`  - ${f}`));
        console.log('');
    });
}

// Failed files
if (failed.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('FAILED PARSES');
    console.log(`${'='.repeat(80)}\n`);
    failed.forEach(f => {
        console.log(`${f.filename}: ${f.error}`);
    });
}

console.log(`\n${'='.repeat(80)}`);
console.log('TEST SUITE COMPLETE');
console.log(`${'='.repeat(80)}\n`);
