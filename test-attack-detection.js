#!/usr/bin/env node

/**
 * Test Attack Subtype Detection Against Manual Labels
 * Validates attack patterns from attack_tagger.py against real press releases
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

// Test data with manual labels (4 DNC releases successfully scraped)
const testCases = [
    // Sherrill URLs failed to scrape (JavaScript-rendered pages)
    // {
    //     id: "sherrill_bombshell",
    //     expected: ["attack_policy", "attack_fear"]
    // },
    // {
    //     id: "sherrill_maga_allies",
    //     expected: ["attack_rapid_response", "attack_character", "attack_association"]
    // },
    // {
    //     id: "sherrill_energy_ad",
    //     expected: ["attack_rapid_response", "attack_character"]
    // },
    // {
    //     id: "sherrill_ciattarelli_double_down",
    //     expected: ["attack_policy", "attack_association"]
    // },

    // DNC releases (successfully scraped)
    {
        id: "dnc_trump_seniors_vets",
        url: "https://democrats.org/news/trump-attacks-seniors-and-veterans-hard-earned-benefits/",
        headline: "Trump Attacks Seniors' and Veterans' Hard-Earned Benefits",
        expected: ["attack_policy", "attack_association", "attack_fear"]
    },
    {
        id: "dnc_trump_va",
        url: "https://democrats.org/news/new-after-his-advisor-attacked-veterans-as-not-fit-trump-is-firing-80000-va-employees-risking-benefits/",
        headline: "NEW: After His Advisor Attacked Veterans As 'Not Fit,' Trump Is Firing 80,000 VA Employees, Risking Benefits",
        expected: ["attack_fear", "attack_rapid_response"]
    },
    {
        id: "dnc_billboards_rural_hospitals",
        url: "https://democrats.org/news/icymi-new-dnc-billboards-outside-shuttering-rural-hospitals-blame-closure-on-trumps-gutting-of-health-care/",
        headline: "New DNC Billboards Outside Shuttering Rural Hospitals — Blame Closure on Trump's Gutting of Health Care",
        expected: ["attack_policy", "attack_fear", "attack_association"]
    },
    {
        id: "dnc_texas_gerrymandering",
        url: "https://democrats.org/news/icymi-new-dnc-organizing-campaign-targets-texas-gops-gerrymandering-scheme-mobilizes-grassroots-activists-to-fight-back/",
        headline: "New DNC Organizing Campaign Targets Texas GOP's Gerrymandering Scheme, Mobilizes Grassroots Activists to Fight Back",
        expected: ["attack_association", "attack_policy", "attack_fear"]
    }
];

async function testAttackDetection() {
    console.log(`${colors.bright}${colors.cyan}Attack Subtype Detection Test${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
    console.log(`Testing ${testCases.length} manually-labeled attack press releases\n`);

    const parser = new PressReleaseParser();
    const results = [];

    let totalExpected = 0;
    let totalDetected = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const testCase of testCases) {
        // Check if we already scraped this file
        const filePath = path.join(__dirname, 'cpo_examples', `${testCase.id}.txt`);

        if (!fs.existsSync(filePath)) {
            console.log(`${colors.yellow}⚠ Missing file: ${testCase.id}.txt${colors.reset}`);
            console.log(`  Please scrape: ${testCase.url}\n`);
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const result = parser.parse(content);

        // Extract only attack subtypes
        const detectedAttacks = result.subtypes
            .filter(st => st.subtype.startsWith('attack_'))
            .map(st => st.subtype);

        // Calculate metrics
        const expected = testCase.expected;
        totalExpected += expected.length;
        totalDetected += detectedAttacks.length;

        const tp = detectedAttacks.filter(d => expected.includes(d)).length;
        const fp = detectedAttacks.filter(d => !expected.includes(d)).length;
        const fn = expected.filter(e => !detectedAttacks.includes(e)).length;

        truePositives += tp;
        falsePositives += fp;
        falseNegatives += fn;

        // Display result
        console.log(`${colors.bright}${testCase.id}${colors.reset}`);
        console.log(`${colors.gray}${testCase.headline}${colors.reset}`);
        console.log(`${colors.cyan}Expected:${colors.reset} ${expected.map(e => e.replace('attack_', '')).join(', ')}`);
        console.log(`${colors.magenta}Detected:${colors.reset} ${detectedAttacks.map(d => d.replace('attack_', '')).join(', ') || '(none)'}`);

        // Show matches/misses
        const matched = detectedAttacks.filter(d => expected.includes(d));
        const missed = expected.filter(e => !detectedAttacks.includes(e));
        const extra = detectedAttacks.filter(d => !expected.includes(d));

        if (matched.length > 0) {
            console.log(`  ${colors.green}✓ Matched: ${matched.map(m => m.replace('attack_', '')).join(', ')}${colors.reset}`);
        }
        if (missed.length > 0) {
            console.log(`  ${colors.red}✗ Missed: ${missed.map(m => m.replace('attack_', '')).join(', ')}${colors.reset}`);
        }
        if (extra.length > 0) {
            console.log(`  ${colors.yellow}+ Extra: ${extra.map(e => e.replace('attack_', '')).join(', ')}${colors.reset}`);
        }

        console.log('');

        results.push({
            id: testCase.id,
            expected,
            detected: detectedAttacks,
            matched,
            missed,
            extra
        });
    }

    // Summary statistics
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}SUMMARY${colors.reset}\n`);

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    console.log(`${colors.bright}Metrics:${colors.reset}`);
    console.log(`  Total expected attack labels: ${totalExpected}`);
    console.log(`  Total detected attack labels: ${totalDetected}`);
    console.log(`  True positives: ${colors.green}${truePositives}${colors.reset}`);
    console.log(`  False positives: ${colors.yellow}${falsePositives}${colors.reset}`);
    console.log(`  False negatives: ${colors.red}${falseNegatives}${colors.reset}`);
    console.log('');
    console.log(`  ${colors.bright}Precision:${colors.reset} ${(precision * 100).toFixed(1)}% (of detected, how many correct)`);
    console.log(`  ${colors.bright}Recall:${colors.reset}    ${(recall * 100).toFixed(1)}% (of expected, how many found)`);
    console.log(`  ${colors.bright}F1 Score:${colors.reset}  ${(f1 * 100).toFixed(1)}%`);

    // Pattern-specific analysis
    console.log(`\n${colors.bright}Pattern Performance:${colors.reset}`);
    const attackTypes = ['policy', 'character', 'competence', 'values', 'association',
                        'hypocrisy', 'ethics', 'fear', 'contrast', 'rapid_response'];

    attackTypes.forEach(type => {
        const fullType = `attack_${type}`;
        const expectedCount = results.reduce((sum, r) => sum + (r.expected.includes(fullType) ? 1 : 0), 0);
        const detectedCount = results.reduce((sum, r) => sum + (r.detected.includes(fullType) ? 1 : 0), 0);
        const matchedCount = results.reduce((sum, r) => sum + (r.matched.includes(fullType) ? 1 : 0), 0);

        if (expectedCount > 0 || detectedCount > 0) {
            const recall = expectedCount > 0 ? (matchedCount / expectedCount * 100).toFixed(0) : 'N/A';
            const precision = detectedCount > 0 ? (matchedCount / detectedCount * 100).toFixed(0) : 'N/A';
            console.log(`  ${type.padEnd(20)} Expected: ${expectedCount}, Detected: ${detectedCount}, Matched: ${matchedCount} (P: ${precision}%, R: ${recall}%)`);
        }
    });

    // Save results
    const outputPath = path.join(__dirname, 'attack-detection-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        total_files: results.length,
        metrics: {
            precision: (precision * 100).toFixed(1),
            recall: (recall * 100).toFixed(1),
            f1_score: (f1 * 100).toFixed(1),
            true_positives: truePositives,
            false_positives: falsePositives,
            false_negatives: falseNegatives
        },
        results
    }, null, 2));

    console.log(`\n${colors.green}✓ Results saved to: ${outputPath}${colors.reset}\n`);
}

// Run
testAttackDetection();
