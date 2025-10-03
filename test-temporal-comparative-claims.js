#!/usr/bin/env node

/**
 * Test temporal and trend comparative claim detection
 * Tests the expanded detection patterns
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Test cases - temporal and trend comparisons
const testCases = [
    // Temporal comparisons - comparing to past values
    {
        claim: "Our annual deficit is double what it was two years ago.",
        expected: true,
        type: 'temporal_ratio'
    },
    {
        claim: "Unemployment is lower than it was in 2019.",
        expected: true,
        type: 'temporal_comparison'
    },
    {
        claim: "Crime is higher than it was last year.",
        expected: true,
        type: 'temporal_comparison'
    },
    {
        claim: "GDP has increased from 2020 levels.",
        expected: true,
        type: 'temporal_change'
    },
    {
        claim: "Inflation is half what it was a year ago.",
        expected: true,
        type: 'temporal_ratio'
    },

    // Trend comparisons - ongoing changes
    {
        claim: "The deficit keeps getting bigger every year.",
        expected: true,
        type: 'ongoing_trend' || 'periodic_trend'
    },
    {
        claim: "Prices continue rising month after month.",
        expected: true,
        type: 'ongoing_trend'
    },
    {
        claim: "Unemployment is declining every quarter.",
        expected: true,
        type: 'periodic_trend'
    },
    {
        claim: "We've seen consistent growth over the past five years.",
        expected: true,
        type: 'sustained_trend'
    },
    {
        claim: "Revenue has increased for 10 consecutive years.",
        expected: true,
        type: 'multi_period_trend'
    },

    // Standard comparisons (should still work)
    {
        claim: "Our deficit is greater than the GDP of the UK.",
        expected: true,
        type: 'greater_than'
    },

    // Not comparative
    {
        claim: "The economy is doing well.",
        expected: false,
        type: null
    }
];

console.log('\n' + '='.repeat(80));
console.log('TESTING TEMPORAL & TREND COMPARATIVE CLAIM DETECTION');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

for (const test of testCases) {
    console.log(`\n📝 Test: "${test.claim}"`);
    console.log(`   Expected: ${test.expected ? `✅ ${test.type}` : '❌ Not comparative'}`);

    const result = parser.detectComparativeClaim(test.claim);

    if (result.is_comparative === test.expected) {
        console.log(`   Result: ✅ PASS`);
        passed++;

        if (result.is_comparative) {
            console.log(`   🔍 Type detected: ${result.comparison_type}`);
            console.log(`   📊 Metrics: ${result.metrics.join(', ') || 'numeric'}`);
            console.log(`   🕒 Time reference: ${result.time_reference || 'none'}`);
            console.log(`   ⏱️  Is temporal: ${result.is_temporal}`);
            console.log(`   📈 Is trend: ${result.is_trend}`);
            console.log(`   ⚙️  Verification steps: ${result.verification_steps.length}`);

            // Show verification steps
            if (result.is_temporal || result.is_trend) {
                console.log(`\n   📋 Temporal/Trend Verification Process:`);
                result.verification_steps.forEach((step, i) => {
                    console.log(`      ${i+1}. ${step.description}`);
                });
            }
        }
    } else {
        console.log(`   Result: ❌ FAIL`);
        console.log(`   Got: ${result.is_comparative ? result.comparison_type : 'not detected'}`);
        failed++;
    }
}

console.log('\n' + '='.repeat(80));
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length} total`);
console.log('='.repeat(80));

// Now test search query generation
console.log('\n' + '='.repeat(80));
console.log('TESTING SEARCH QUERY GENERATION');
console.log('='.repeat(80));

const searchTests = [
    { metric: 'US deficit', timeRef: null },
    { metric: 'US deficit', timeRef: '2019' },
    { metric: 'US deficit', timeRef: 'last year' },
    { metric: 'US deficit', timeRef: '2 years ago' },
    { metric: 'unemployment rate', timeRef: '2020' },
    { metric: 'GDP growth', timeRef: null },
    { metric: 'inflation rate', timeRef: 'last year' }
];

for (const test of searchTests) {
    const query = parser.generateSearchQuery(test.metric, test.timeRef);
    console.log(`\n📊 Metric: ${test.metric}`);
    console.log(`   Time: ${test.timeRef || 'current'}`);
    console.log(`   🔍 Query: "${query}"`);
}

console.log('\n' + '='.repeat(80));
console.log('TESTING AUTOMATED VERIFICATION (FRAMEWORK)');
console.log('='.repeat(80));

// Test the verification framework
const testClaim = "Our deficit is double what it was two years ago.";
console.log(`\n📝 Claim: "${testClaim}"`);

const detection = parser.detectComparativeClaim(testClaim);
if (detection.is_comparative) {
    console.log('\n✅ Claim detected as comparative');
    console.log(`   Type: ${detection.comparison_type}`);
    console.log(`   Temporal: ${detection.is_temporal}`);
    console.log(`   Time reference: ${detection.time_reference}`);

    // Test verification (async)
    (async () => {
        detection.original_sentence = testClaim;
        const verification = await parser.verifyComparativeClaim(detection);

        console.log('\n📋 Verification Framework Result:');
        console.log(`   Verdict: ${verification.verdict}`);
        console.log(`   Notes:`);
        verification.notes.forEach(note => {
            console.log(`      - ${note}`);
        });
        console.log(`\n   Supporting data needed:`);
        Object.entries(verification.supporting_data).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
        });

        console.log('\n💡 TO COMPLETE VERIFICATION:');
        console.log('   1. Integrate WebSearch API');
        console.log('   2. Look up current US deficit');
        console.log('   3. Look up US deficit from 2 years ago');
        console.log('   4. Calculate ratio and verify claim');
        console.log('\n✅ Framework ready for WebSearch integration!\n');
    })();
} else {
    console.log('❌ Claim not detected as comparative');
}
