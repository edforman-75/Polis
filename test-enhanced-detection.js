#!/usr/bin/env node

/**
 * Test Enhanced Detection (Type, Subtype, Issue) on Real Press Releases
 * Validates the new pattern-based detection methods
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
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m'
};

function testEnhancedDetection() {
    const examplesDir = path.join(__dirname, 'cpo_examples');
    const allFiles = fs.readdirSync(examplesDir)
        .filter(file => file.endsWith('.txt') && !file.endsWith('.json'));

    // Filter to REAL press releases only
    const files = allFiles
        .filter(file => !file.startsWith('hybrid_') && !file.startsWith('release_'))
        .sort();

    console.log(`${colors.bright}${colors.cyan}Enhanced Detection Test (Type + Subtype + Issue)${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
    console.log(`Testing ${files.length} real press releases\n`);

    const parser = new PressReleaseParser();
    const results = [];

    files.forEach((file, index) => {
        const filePath = path.join(examplesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const result = parser.parse(content);

        // Store result
        results.push({
            file,
            type: result.release_type.type,
            type_confidence: result.release_type.confidence,
            subtypes: result.subtypes,
            issues: result.issues
        });

        // Display result
        console.log(`${colors.gray}[${index + 1}/${files.length}]${colors.reset} ${colors.bright}${file}${colors.reset}`);
        console.log(`  ${colors.cyan}Type:${colors.reset} ${result.release_type.type} (${result.release_type.confidence})`);

        // Display subtypes
        if (result.subtypes && result.subtypes.length > 0) {
            console.log(`  ${colors.magenta}Subtypes:${colors.reset}`);
            result.subtypes.forEach(st => {
                const conf = st.confidence === 'high' ? colors.green : st.confidence === 'medium' ? colors.yellow : colors.red;
                console.log(`    ${conf}• ${st.subtype}${colors.reset} (${st.confidence})`);
            });
        }

        // Display issues
        if (result.issues && result.issues.length > 0) {
            console.log(`  ${colors.blue}Issues:${colors.reset}`);
            result.issues.forEach(issue => {
                const conf = issue.confidence === 'high' ? colors.green : issue.confidence === 'medium' ? colors.yellow : colors.red;
                console.log(`    ${conf}• ${issue.issue}${colors.reset} (${issue.confidence})`);
            });
        }

        console.log('');
    });

    // Summary statistics
    console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}SUMMARY${colors.reset}\n`);

    // Subtype distribution
    const subtypeCounts = {};
    results.forEach(r => {
        r.subtypes.forEach(st => {
            subtypeCounts[st.subtype] = (subtypeCounts[st.subtype] || 0) + 1;
        });
    });
    console.log(`${colors.bright}Subtype Distribution:${colors.reset}`);
    Object.entries(subtypeCounts).sort((a, b) => b[1] - a[1]).forEach(([subtype, count]) => {
        console.log(`  ${subtype.padEnd(25)} ${count.toString().padStart(3)} occurrences`);
    });

    // Issue distribution
    const issueCounts = {};
    results.forEach(r => {
        r.issues.forEach(issue => {
            issueCounts[issue.issue] = (issueCounts[issue.issue] || 0) + 1;
        });
    });
    console.log(`\n${colors.bright}Issue Distribution:${colors.reset}`);
    Object.entries(issueCounts).sort((a, b) => b[1] - a[1]).forEach(([issue, count]) => {
        console.log(`  ${issue.padEnd(25)} ${count.toString().padStart(3)} occurrences`);
    });

    // Save results
    const outputPath = path.join(__dirname, 'enhanced-detection-results.json');
    fs.writeFileSync(outputPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        total_files: files.length,
        subtype_counts: subtypeCounts,
        issue_counts: issueCounts,
        results: results
    }, null, 2));

    console.log(`\n${colors.green}✓ Results saved to: ${outputPath}${colors.reset}\n`);
}

// Run
testEnhancedDetection();
