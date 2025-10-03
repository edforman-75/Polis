#!/usr/bin/env node

/**
 * Test Type Detection on Real Press Releases Only
 * Excludes hybrid_* and release_* (Jane Smith fake examples)
 */

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser.js');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function colorByConfidence(confidence) {
    if (confidence === 'high') return colors.green;
    if (confidence === 'medium') return colors.yellow;
    if (confidence === 'low') return colors.red;
    return colors.gray;
}

function testRealReleases() {
    const examplesDir = path.join(__dirname, 'cpo_examples');
    const allFiles = fs.readdirSync(examplesDir)
        .filter(file => file.endsWith('.txt') && !file.endsWith('.json'));

    // Filter to REAL press releases only
    const files = allFiles
        .filter(file => !file.startsWith('hybrid_') && !file.startsWith('release_'))
        .sort();

    console.log(`${colors.bright}${colors.cyan}Real Press Release Type Detection${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
    console.log(`Testing ${files.length} REAL press releases`);
    console.log(`Excluded ${allFiles.length - files.length} synthetic files (hybrid_* and release_*)\n`);

    const parser = new PressReleaseParser();
    const results = [];
    const typeCounts = {};

    files.forEach((file, index) => {
        const filePath = path.join(examplesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const result = parser.parse(content);
        const releaseType = result.release_type;

        // Track type counts
        typeCounts[releaseType.type] = (typeCounts[releaseType.type] || 0) + 1;

        // Store result
        results.push({
            file,
            type: releaseType.type,
            confidence: releaseType.confidence,
            score: releaseType.score,
            indicators: releaseType.indicators,
            all_scores: releaseType.all_scores
        });

        // Display result
        const confColor = colorByConfidence(releaseType.confidence);
        console.log(`${colors.gray}[${index + 1}/${files.length}]${colors.reset} ${colors.bright}${file}${colors.reset}`);
        console.log(`  Type: ${confColor}${releaseType.type}${colors.reset} (confidence: ${confColor}${releaseType.confidence}${colors.reset}, score: ${releaseType.score})`);

        if (releaseType.indicators.length > 0) {
            console.log(`  Indicators:`);
            releaseType.indicators.forEach(ind => {
                console.log(`    ${colors.gray}• ${ind}${colors.reset}`);
            });
        }

        // Show all scores for debugging
        if (releaseType.confidence !== 'none') {
            const scoresSummary = Object.entries(releaseType.all_scores)
                .filter(([_, score]) => score > 0)
                .map(([type, score]) => `${type}:${score}`)
                .join(', ');
            if (scoresSummary) {
                console.log(`  ${colors.gray}All scores: ${scoresSummary}${colors.reset}`);
            }
        }

        console.log('');
    });

    // Summary
    console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}SUMMARY${colors.reset}\n`);

    console.log(`${colors.bright}Type Distribution:${colors.reset}`);
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        const percentage = ((count / files.length) * 100).toFixed(1);
        console.log(`  ${type.padEnd(20)} ${count.toString().padStart(3)} files (${percentage}%)`);
    });

    // Confidence breakdown
    const confCounts = {
        high: results.filter(r => r.confidence === 'high').length,
        medium: results.filter(r => r.confidence === 'medium').length,
        low: results.filter(r => r.confidence === 'low').length,
        none: results.filter(r => r.confidence === 'none').length
    };

    console.log(`\n${colors.bright}Confidence Distribution:${colors.reset}`);
    Object.entries(confCounts).forEach(([conf, count]) => {
        const confColor = colorByConfidence(conf);
        const percentage = ((count / files.length) * 100).toFixed(1);
        console.log(`  ${confColor}${conf.toUpperCase().padEnd(8)}${colors.reset} ${count.toString().padStart(3)} files (${percentage}%)`);
    });

    // Save results
    const outputPath = path.join(__dirname, 'real-releases-type-detection.json');
    fs.writeFileSync(outputPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        total_files: files.length,
        excluded_files: allFiles.length - files.length,
        type_counts: typeCounts,
        confidence_counts: confCounts,
        results: results
    }, null, 2));

    console.log(`\n${colors.green}✓ Results saved to: ${outputPath}${colors.reset}\n`);
}

// Run
testRealReleases();
