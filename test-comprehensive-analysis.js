const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('COMPREHENSIVE PARSING PERFORMANCE ANALYSIS');
console.log('Analyzing all example files to identify improvement opportunities');
console.log('================================================================================\n');

// Get all example files
const examplesDir = path.join(__dirname, 'cpo_examples');
const files = fs.readdirSync(examplesDir)
    .filter(f => f.endsWith('.txt') && !f.endsWith('.txt.json'))
    .sort();

const analysis = {
    total_files: 0,
    total_quotes: 0,
    unknown_speakers: 0,
    missing_dates: 0,
    missing_locations: 0,
    missing_headlines: 0,
    files_with_issues: [],
    speaker_extraction_failures: [],
    dateline_extraction_failures: [],
    headline_extraction_failures: []
};

const issuesByType = {
    'unknown_speakers': [],
    'missing_dateline': [],
    'missing_headline': [],
    'poor_structure': []
};

console.log(`Found ${files.length} example files\n`);
console.log('Analyzing...\n');

files.forEach(filename => {
    const filePath = path.join(examplesDir, filename);
    const text = fs.readFileSync(filePath, 'utf8');

    try {
        const result = parser.parse(text);
        analysis.total_files++;

        const issues = [];
        let hasIssues = false;

        // Check quotes
        const quotes = result.quotes || [];
        analysis.total_quotes += quotes.length;

        const unknownCount = quotes.filter(q => !q.speaker_name || q.speaker_name === 'UNKNOWN').length;
        analysis.unknown_speakers += unknownCount;

        if (unknownCount > 0 && quotes.length > 0) {
            const pct = Math.round((unknownCount / quotes.length) * 100);
            issues.push(`${unknownCount}/${quotes.length} unknown speakers (${pct}%)`);
            hasIssues = true;

            issuesByType.unknown_speakers.push({
                file: filename,
                count: unknownCount,
                total: quotes.length,
                percentage: pct
            });

            // Log specific unknown quotes for review
            quotes.forEach((q, i) => {
                if (!q.speaker_name || q.speaker_name === 'UNKNOWN') {
                    analysis.speaker_extraction_failures.push({
                        file: filename,
                        quote_num: i + 1,
                        attribution: q.full_attribution || 'NO ATTRIBUTION',
                        text: q.quote_text.substring(0, 60) + '...'
                    });
                }
            });
        }

        // Check dateline
        const hasDate = result.content_structure.dateline?.date;
        const hasLocation = result.content_structure.dateline?.location;

        if (!hasDate) {
            analysis.missing_dates++;
            issues.push('Missing date');
            hasIssues = true;
            issuesByType.missing_dateline.push(filename);
            analysis.dateline_extraction_failures.push({
                file: filename,
                type: 'date',
                first_lines: text.split('\n').slice(0, 5).join(' | ')
            });
        }

        if (!hasLocation) {
            analysis.missing_locations++;
            issues.push('Missing location');
            hasIssues = true;
            analysis.dateline_extraction_failures.push({
                file: filename,
                type: 'location',
                first_lines: text.split('\n').slice(0, 5).join(' | ')
            });
        }

        // Check headline
        const headline = result.content_structure.headline;
        if (!headline || headline.length < 10) {
            analysis.missing_headlines++;
            issues.push('Missing/short headline');
            hasIssues = true;
            issuesByType.missing_headline.push(filename);
            analysis.headline_extraction_failures.push({
                file: filename,
                extracted: headline || 'NONE',
                first_lines: text.split('\n').slice(0, 3).join(' | ')
            });
        }

        if (hasIssues) {
            analysis.files_with_issues.push({
                file: filename,
                issues: issues
            });
        }

    } catch (error) {
        console.log(`ERROR parsing ${filename}: ${error.message}`);
    }
});

// Print summary
console.log('================================================================================');
console.log('OVERALL STATISTICS');
console.log('================================================================================\n');

console.log(`Files analyzed: ${analysis.total_files}`);
console.log(`Total quotes extracted: ${analysis.total_quotes}`);
console.log(`Unknown speakers: ${analysis.unknown_speakers} (${Math.round(analysis.unknown_speakers/analysis.total_quotes*100)}%)`);
console.log(`Files missing dates: ${analysis.missing_dates} (${Math.round(analysis.missing_dates/analysis.total_files*100)}%)`);
console.log(`Files missing locations: ${analysis.missing_locations} (${Math.round(analysis.missing_locations/analysis.total_files*100)}%)`);
console.log(`Files missing headlines: ${analysis.missing_headlines} (${Math.round(analysis.missing_headlines/analysis.total_files*100)}%)`);
console.log(`Files with issues: ${analysis.files_with_issues.length}/${analysis.total_files} (${Math.round(analysis.files_with_issues.length/analysis.total_files*100)}%)`);

// Top issues
console.log('\n\n================================================================================');
console.log('TOP IMPROVEMENT OPPORTUNITIES (Ranked)');
console.log('================================================================================\n');

const improvements = [
    {
        priority: 1,
        issue: 'Unknown Speaker Attribution',
        count: analysis.unknown_speakers,
        total: analysis.total_quotes,
        percentage: Math.round(analysis.unknown_speakers/analysis.total_quotes*100),
        impact: 'HIGH - Affects quote usefulness'
    },
    {
        priority: 2,
        issue: 'Missing Dateline Location',
        count: analysis.missing_locations,
        total: analysis.total_files,
        percentage: Math.round(analysis.missing_locations/analysis.total_files*100),
        impact: 'MEDIUM - Affects context'
    },
    {
        priority: 3,
        issue: 'Missing Dateline Date',
        count: analysis.missing_dates,
        total: analysis.total_files,
        percentage: Math.round(analysis.missing_dates/analysis.total_files*100),
        impact: 'MEDIUM - Affects timeliness'
    },
    {
        priority: 4,
        issue: 'Missing/Poor Headline',
        count: analysis.missing_headlines,
        total: analysis.total_files,
        percentage: Math.round(analysis.missing_headlines/analysis.total_files*100),
        impact: 'LOW - Can extract from content'
    }
];

improvements
    .sort((a, b) => b.percentage - a.percentage)
    .forEach((imp, i) => {
        console.log(`${i + 1}. ${imp.issue}`);
        console.log(`   Issue Rate: ${imp.count}/${imp.total} (${imp.percentage}%)`);
        console.log(`   Impact: ${imp.impact}`);
        console.log('');
    });

// Detailed analysis for top issues
console.log('\n================================================================================');
console.log('DETAILED ISSUE ANALYSIS');
console.log('================================================================================\n');

if (analysis.speaker_extraction_failures.length > 0) {
    console.log('--- Unknown Speaker Examples (First 10) ---\n');
    analysis.speaker_extraction_failures.slice(0, 10).forEach((failure, i) => {
        console.log(`${i + 1}. ${failure.file} - Quote ${failure.quote_num}`);
        console.log(`   Attribution: ${failure.attribution}`);
        console.log(`   Text: ${failure.text}`);
        console.log('');
    });
}

if (analysis.dateline_extraction_failures.length > 0) {
    console.log('\n--- Dateline Extraction Failures (First 5) ---\n');
    analysis.dateline_extraction_failures.slice(0, 5).forEach((failure, i) => {
        console.log(`${i + 1}. ${failure.file} (${failure.type})`);
        console.log(`   First lines: ${failure.first_lines.substring(0, 100)}...`);
        console.log('');
    });
}

console.log('\n\n================================================================================');
console.log('RECOMMENDED NEXT STEPS');
console.log('================================================================================\n');

console.log('Based on this analysis, prioritize:');
console.log('');
console.log('1. 🎯 SPEAKER ATTRIBUTION IMPROVEMENT');
console.log(`   • ${analysis.unknown_speakers}/${analysis.total_quotes} quotes have unknown speakers`);
console.log('   • Review attribution patterns in failed cases');
console.log('   • Add new attribution patterns');
console.log('   • Improve pronoun resolution');
console.log('');
console.log('2. 📍 DATELINE EXTRACTION IMPROVEMENT');
console.log(`   • ${analysis.missing_locations} files missing location`);
console.log(`   • ${analysis.missing_dates} files missing date`);
console.log('   • Review dateline format variations');
console.log('   • Add fallback extraction methods');
console.log('');
console.log('3. 📋 MANUAL REVIEW NEEDED');
console.log('   • Review top 20 failing files manually');
console.log('   • Create test cases for each failure pattern');
console.log('   • Build regression tests');
console.log('');

// Save detailed report
const reportPath = path.join(__dirname, 'parsing-performance-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
        total_files: analysis.total_files,
        total_quotes: analysis.total_quotes,
        unknown_speakers: analysis.unknown_speakers,
        missing_dates: analysis.missing_dates,
        missing_locations: analysis.missing_locations,
        missing_headlines: analysis.missing_headlines
    },
    failures: {
        speaker_extraction: analysis.speaker_extraction_failures,
        dateline_extraction: analysis.dateline_extraction_failures,
        headline_extraction: analysis.headline_extraction_failures
    },
    files_with_issues: analysis.files_with_issues
}, null, 2));

console.log(`\n📊 Detailed report saved to: parsing-performance-report.json`);
console.log('');
