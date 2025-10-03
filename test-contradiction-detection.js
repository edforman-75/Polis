#!/usr/bin/env node

/**
 * Test contradiction detection vs insufficient data
 *
 * Demonstrates three verification outcomes:
 * 1. VERIFIED - claim is supported
 * 2. CONTRADICTED - claim is actively contradicted (likely false)
 * 3. INSUFFICIENT - no evidence either way (unknown)
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

// Test cases with simulated content
const testCases = [
    {
        name: 'VERIFIED - Numbers match',
        claim: {
            statement: 'The unemployment rate fell to 3.7% in September.',
            numeric_claims: [{text: '3.7%', type: 'percentage', value: 3.7}]
        },
        content: 'The Bureau of Labor Statistics reported today that the unemployment rate dropped to 3.7% in September 2024, down from 3.9% the previous month.'
    },
    {
        name: 'CONTRADICTED - Different numbers',
        claim: {
            statement: 'The unemployment rate fell to 3.7% in September.',
            numeric_claims: [{text: '3.7%', type: 'percentage', value: 3.7}]
        },
        content: 'The Bureau of Labor Statistics reported today that the unemployment rate rose to 4.2% in September 2024, up from 4.0% the previous month.'
    },
    {
        name: 'CONTRADICTED - Explicit contradiction language',
        claim: {
            statement: 'Crime rates increased by 15% this year.',
            numeric_claims: [{text: '15%', type: 'percentage', value: 15}]
        },
        content: 'Contrary to recent claims, FBI data shows that violent crime rates actually decreased this year. Reports of a 15% increase are false and misleading.'
    },
    {
        name: 'INSUFFICIENT - No mention of the topic',
        claim: {
            statement: 'The infrastructure bill allocates $50 billion for bridges.',
            numeric_claims: [{text: '$50 billion', type: 'currency'}]
        },
        content: 'Congress passed several bills this session focused on healthcare reform and education funding. The legislation includes provisions for expanding Medicare and increasing teacher salaries.'
    },
    {
        name: 'INSUFFICIENT - Topic mentioned but no numbers',
        claim: {
            statement: 'The infrastructure bill allocates $50 billion for bridges.',
            numeric_claims: [{text: '$50 billion', type: 'currency'}]
        },
        content: 'The infrastructure bill passed with bipartisan support. It includes funding for roads, bridges, and public transit systems across the country.'
    }
];

console.log('=== CONTRADICTION DETECTION TEST ===\n');
console.log('Testing three verification outcomes:');
console.log('  ✅ VERIFIED - evidence supports claim');
console.log('  ❌ CONTRADICTED - evidence contradicts claim (likely FALSE)');
console.log('  ❓ INSUFFICIENT - no evidence either way (UNKNOWN)');
console.log('\n' + '='.repeat(80) + '\n');

testCases.forEach((test, idx) => {
    console.log(`[${idx + 1}] ${test.name}`);
    console.log(`    Claim: "${test.claim.statement}"`);
    console.log();

    const result = parser.doesContentSupportClaim(test.claim, test.content);

    console.log(`    Status: ${result.status.toUpperCase()}`);
    console.log(`    Confidence: ${(result.confidence * 100).toFixed(1)}%`);

    if (result.status === 'supported') {
        console.log(`    ✅ VERIFIED - Evidence supports this claim`);
        if (result.matched_terms.length > 0) {
            console.log(`    Matched terms: ${result.matched_terms.join(', ')}`);
        }
    } else if (result.status === 'contradicted') {
        console.log(`    ❌ CONTRADICTED - Likely FALSE`);

        if (result.contradictions.length > 0) {
            console.log(`    Contradictions found:`);
            result.contradictions.forEach(c => {
                console.log(`      • Claimed: ${c.claimed}, Found: ${c.found}`);
            });
        }

        if (result.has_contradiction_language) {
            console.log(`    Contains contradiction language (not, false, incorrect, etc.)`);
        }
    } else {
        console.log(`    ❓ INSUFFICIENT DATA - Cannot verify or contradict`);
        console.log(`    Term match: ${(result.term_match_ratio * 100).toFixed(0)}% (need >40% for verification)`);
    }

    console.log();
    console.log('    Content excerpt:');
    console.log(`    "${test.content.substring(0, 120)}..."`);
    console.log();
    console.log('    ' + '-'.repeat(76));
    console.log();
});

console.log('=== SUMMARY ===\n');
console.log('Three distinct verification outcomes:');
console.log();
console.log('1. VERIFIED (supported):');
console.log('   - Numbers match exactly');
console.log('   - Key terms align with claim');
console.log('   - Confidence score > 40%');
console.log();
console.log('2. CONTRADICTED (likely false):');
console.log('   - Different numbers in similar context');
console.log('   - Explicit contradiction language (not, false, incorrect, etc.)');
console.log('   - Flag as potentially misleading or false');
console.log();
console.log('3. INSUFFICIENT (unknown):');
console.log('   - Topic not mentioned or insufficient detail');
console.log('   - No numbers found');
console.log('   - Cannot make determination either way');
console.log();
console.log('💡 Key Distinction:');
console.log('   CONTRADICTED ≠ INSUFFICIENT');
console.log('   • Contradicted = Active evidence against the claim (likely a LIE)');
console.log('   • Insufficient = No evidence found (UNKNOWN, needs more research)');
