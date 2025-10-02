const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const examplesDir = './cpo_examples';

console.log('\n' + '='.repeat(80));
console.log('HYBRID PRESS RELEASE PARSER TEST SUITE');
console.log('Testing 25 hybrid press releases (better structured than Jane Smith)');
console.log('='.repeat(80) + '\n');

// Get all hybrid release files
const releaseFiles = fs.readdirSync(examplesDir)
    .filter(f => f.startsWith('hybrid_release_') && f.endsWith('.txt'))
    .sort();

const results = [];
let totalQuotes = 0;
let releasesWithQuotes = 0;

releaseFiles.forEach((filename, index) => {
    const filepath = path.join(examplesDir, filename);
    const text = fs.readFileSync(filepath, 'utf-8');

    console.log(`\n[${index + 1}/${releaseFiles.length}] Testing: ${filename}`);
    console.log('-'.repeat(80));

    try {
        const result = parser.parse(text);

        const stats = {
            filename,
            success: true,
            headline: result.content_structure?.headline || null,
            dateline: result.content_structure?.dateline?.full || null,
            dateline_location: result.content_structure?.dateline?.location || null,
            dateline_date: result.content_structure?.dateline?.date || null,
            dateline_confidence: result.content_structure?.dateline?.confidence || null,
            lead_paragraph_length: result.content_structure?.lead_paragraph?.length || 0,
            body_paragraphs: result.content_structure?.body_paragraphs?.length || 0,
            quotes_found: result.quotes?.length || 0,
            quotes: result.quotes || []
        };

        results.push(stats);

        // Debug output
        console.log(`Debug - Lead paragraph length: ${stats.lead_paragraph_length}`);
        console.log(`Debug - Body paragraphs count: ${stats.body_paragraphs}`);
        console.log(`  Headline: ${stats.headline ? '✓' : '✗'} ${stats.headline || '(not found)'}`);
        console.log(`  Dateline: ${stats.dateline ? '✓' : '✗'} ${stats.dateline || '(not found)'}`);
        if (stats.dateline) {
            console.log(`    Location: ${stats.dateline_location || 'N/A'}`);
            console.log(`    Date: ${stats.dateline_date || 'N/A'}`);
            console.log(`    Confidence: ${stats.dateline_confidence || 'N/A'}`);
        }
        console.log(`  Lead paragraph: ${stats.lead_paragraph_length > 0 ? '✓' : '✗'} (${stats.lead_paragraph_length} chars)`);
        console.log(`  Body paragraphs: ${stats.body_paragraphs}`);
        console.log(`  Quotes: ${stats.quotes_found}`);

        if (stats.quotes_found > 0) {
            totalQuotes += stats.quotes_found;
            releasesWithQuotes++;
            stats.quotes.forEach((quote, i) => {
                const quoteText = quote.quote_text || quote.text || '';
                console.log(`  Quote ${i + 1}: "${quoteText.substring(0, 50)}${quoteText.length > 50 ? '...' : ''}"`);
                console.log(`    Speaker: ${quote.speaker_name || '(unknown)'}`);
                console.log(`    Title: ${quote.speaker_title || '(unknown)'}`);
            });
        }

    } catch (error) {
        console.log(`  ❌ PARSE FAILED: ${error.message}`);
        results.push({
            filename,
            success: false,
            error: error.message
        });
    }
});

// Summary statistics
console.log('\n\n' + '='.repeat(80));
console.log('SUMMARY REPORT');
console.log('='.repeat(80) + '\n');

const successful = results.filter(r => r.success);
const failed = results.filter(r => !r.success);

console.log(`Total files tested: ${releaseFiles.length}`);
console.log(`Successful parses: ${successful.length} (${(successful.length/releaseFiles.length*100).toFixed(1)}%)`);
console.log(`Failed parses: ${failed.length}`);

if (successful.length > 0) {
    const withHeadlines = successful.filter(r => r.headline).length;
    const withDatelines = successful.filter(r => r.dateline).length;
    const withLeadParagraphs = successful.filter(r => r.lead_paragraph_length > 0).length;
    const withQuotes = successful.filter(r => r.quotes_found > 0).length;

    console.log('\nComponent Extraction Success Rates:');
    console.log(`  Headlines: ${withHeadlines}/${successful.length} (${(withHeadlines/successful.length*100).toFixed(1)}%)`);
    console.log(`  Datelines: ${withDatelines}/${successful.length} (${(withDatelines/successful.length*100).toFixed(1)}%)`);
    console.log(`  Lead paragraphs: ${withLeadParagraphs}/${successful.length} (${(withLeadParagraphs/successful.length*100).toFixed(1)}%)`);
    console.log(`  Quotes: ${withQuotes}/${successful.length} (${(withQuotes/successful.length*100).toFixed(1)}%)`);

    console.log('\nQuote Statistics:');
    console.log(`  Total quotes found: ${totalQuotes}`);
    console.log(`  Average per release: ${(totalQuotes/successful.length).toFixed(1)}`);
    console.log(`  Releases with quotes: ${releasesWithQuotes}/${successful.length}`);

    // Dateline confidence distribution
    const confidenceCounts = {
        high: successful.filter(r => r.dateline_confidence === 'high').length,
        medium: successful.filter(r => r.dateline_confidence === 'medium').length,
        low: successful.filter(r => r.dateline_confidence === 'low').length,
        none: successful.filter(r => r.dateline_confidence === 'none' || !r.dateline_confidence).length
    };

    console.log('\nDateline Confidence Distribution:');
    console.log(`  High: ${confidenceCounts.high}`);
    console.log(`  Medium: ${confidenceCounts.medium}`);
    console.log(`  Low: ${confidenceCounts.low}`);
    console.log(`  None: ${confidenceCounts.none}`);
}

console.log('\n\n' + '='.repeat(80));
console.log('TEST SUITE COMPLETE');
console.log('='.repeat(80) + '\n');
