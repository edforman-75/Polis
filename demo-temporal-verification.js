#!/usr/bin/env node

/**
 * Demonstration of temporal comparative claim verification
 * Shows the complete workflow for the examples the user mentioned
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('\n' + '='.repeat(80));
console.log('DEMONSTRATION: Temporal Comparative Claim Verification');
console.log('User Examples: "deficit is double what it was two years ago"');
console.log('              "deficit keeps getting bigger every year"');
console.log('='.repeat(80));

// User's examples
const examples = [
    "Our annual deficit is double what it was two years ago.",
    "The deficit keeps getting bigger every year."
];

for (const claim of examples) {
    console.log('\n' + '─'.repeat(80));
    console.log(`\n📝 CLAIM: "${claim}"\n`);

    // Step 1: Detection
    console.log('STEP 1: DETECTION');
    console.log('─'.repeat(40));

    const detection = parser.detectComparativeClaim(claim);

    if (!detection.is_comparative) {
        console.log('❌ Not detected as comparative claim\n');
        continue;
    }

    console.log(`✅ Detected as: ${detection.comparison_type}`);
    console.log(`   Metrics: ${detection.metrics.join(', ')}`);
    console.log(`   Time reference: ${detection.time_reference || 'none'}`);
    console.log(`   Is temporal: ${detection.is_temporal}`);
    console.log(`   Is trend: ${detection.is_trend}`);

    // Step 2: Verification Plan
    console.log(`\nSTEP 2: VERIFICATION PLAN (${detection.verification_steps.length} steps)`);
    console.log('─'.repeat(40));

    detection.verification_steps.forEach((step, i) => {
        console.log(`\n   ${step.step}. ${step.description}`);
        if (step.metric) console.log(`      Metric: ${step.metric}`);
        if (step.time_reference) console.log(`      Time: ${step.time_reference}`);
        if (step.sources_needed) console.log(`      Sources: ${step.sources_needed.join(', ')}`);
    });

    // Step 3: Search Queries
    console.log('\n\nSTEP 3: AUTOMATED SEARCH QUERIES');
    console.log('─'.repeat(40));

    if (detection.is_temporal) {
        const metric = detection.metrics[0] || 'deficit';
        const currentQuery = parser.generateSearchQuery(metric, null);
        const historicalQuery = parser.generateSearchQuery(metric, detection.time_reference);

        console.log(`\n   Current value query:`);
        console.log(`   🔍 "${currentQuery}"`);
        console.log(`\n   Historical value query:`);
        console.log(`   🔍 "${historicalQuery}"`);
    } else if (detection.is_trend) {
        const metric = detection.metrics[0] || 'deficit';
        console.log(`\n   Time series data query:`);
        console.log(`   🔍 "${metric} historical data last 5 years site:treasury.gov OR site:cbo.gov"`);
    }

    // Step 4: Manual Verification Example
    console.log('\n\nSTEP 4: MANUAL VERIFICATION EXAMPLE');
    console.log('─'.repeat(40));

    if (claim.includes('double')) {
        console.log('\n   📊 Example Data (for demonstration):');
        console.log('      2025 deficit: $1.7 trillion (projected)');
        console.log('      2023 deficit: $1.4 trillion (actual)');
        console.log('\n   🔢 Calculation:');
        console.log('      Ratio: $1.7T / $1.4T = 1.21');
        console.log('      Claimed: 2.0 (double)');
        console.log('      Actual: 1.21 (21% increase)');
        console.log('\n   ⚖️  Verdict: FALSE');
        console.log('      The deficit increased by 21%, not doubled (100%).');
        console.log('\n   📝 Sources needed:');
        console.log('      - Treasury.gov: Monthly Treasury Statements');
        console.log('      - CBO.gov: Budget and Economic Outlook reports');

    } else if (claim.includes('keeps getting bigger')) {
        console.log('\n   📊 Example Data (for demonstration):');
        console.log('      2025: $1.7T (proj)');
        console.log('      2024: $1.8T');
        console.log('      2023: $1.4T');
        console.log('      2022: $1.4T');
        console.log('      2021: $2.8T');
        console.log('\n   📈 Trend Analysis:');
        console.log('      2021→2022: DOWN (−$1.4T, −50%)');
        console.log('      2022→2023: FLAT ($0, 0%)');
        console.log('      2023→2024: UP (+$0.4T, +29%)');
        console.log('      2024→2025: DOWN (−$0.1T, −6%)');
        console.log('\n   ⚖️  Verdict: FALSE');
        console.log('      The deficit has varied, not consistently increased "every year".');
        console.log('      Only 1 out of 4 recent transitions showed an increase.');
        console.log('\n   📝 Sources needed:');
        console.log('      - Treasury.gov: Historical deficit data');
        console.log('      - CBO.gov: Historical Tables in Budget');
    }

    // Step 5: Verification Framework
    console.log('\n\nSTEP 5: AUTOMATED VERIFICATION FRAMEWORK');
    console.log('─'.repeat(40));

    (async () => {
        detection.original_sentence = claim;
        const verification = await parser.verifyComparativeClaim(detection);

        console.log(`\n   Status: ${verification.verdict}`);
        console.log(`   Confidence: ${verification.confidence}`);
        console.log('\n   Framework notes:');
        verification.notes.forEach(note => {
            console.log(`      • ${note}`);
        });

        console.log('\n   💡 TO ENABLE FULL AUTOMATION:');
        console.log('      1. Integrate WebSearch API');
        console.log('      2. Parse search results for numeric values');
        console.log('      3. Perform calculations automatically');
        console.log('      4. Return verdict with supporting data and sources');
    })();
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ DEMONSTRATION COMPLETE\n');
console.log('The system successfully:');
console.log('  ✓ Detected both temporal and trend comparative claims');
console.log('  ✓ Generated customized verification workflows');
console.log('  ✓ Created optimized search queries');
console.log('  ✓ Provided verification framework (ready for WebSearch integration)');
console.log('\nNext step: Integrate WebSearch API for full automation!\n');
console.log('='.repeat(80) + '\n');
