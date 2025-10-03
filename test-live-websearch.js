#!/usr/bin/env node

/**
 * Live WebSearch integration test
 * This script demonstrates how to use real WebSearch to verify comparative claims
 * NOTE: This script is designed to be run by Claude Code which has WebSearch access
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const ComparativeVerifier = require('./backend/utils/comparative-verifier');

const parser = new PressReleaseParser();

console.log('='.repeat(80));
console.log('LIVE WEBSEARCH COMPARATIVE CLAIM VERIFICATION');
console.log('='.repeat(80));

async function demonstrateLiveVerification() {
    const testClaim = "Our annual deficit is double what it was two years ago.";

    console.log(`\n📝 Test Claim: "${testClaim}"\n`);

    // Step 1: Detect
    console.log('STEP 1: Detection');
    console.log('─'.repeat(40));
    const detection = parser.detectComparativeClaim(testClaim);
    console.log(`✅ Detected as: ${detection.comparison_type}`);
    console.log(`   Metrics: ${detection.metrics.join(', ')}`);
    console.log(`   Time reference: ${detection.time_reference}`);

    // Step 2: Generate queries
    console.log('\n\nSTEP 2: Generate Search Queries');
    console.log('─'.repeat(40));
    const metric = detection.metrics[0] || 'deficit';
    const currentQuery = parser.generateSearchQuery(metric, null);
    const historicalQuery = parser.generateSearchQuery(metric, detection.time_reference);

    console.log(`\nCurrent query: "${currentQuery}"`);
    console.log(`Historical query: "${historicalQuery}"`);

    console.log('\n\n' + '='.repeat(80));
    console.log('TO USE WITH REAL WEBSEARCH:');
    console.log('─'.repeat(80));
    console.log('\n1. Run these WebSearch queries manually:');
    console.log(`\n   Query 1: ${currentQuery}`);
    console.log(`   Query 2: ${historicalQuery}`);
    console.log('\n2. Copy the search results');
    console.log('\n3. Call the API endpoint with the results:');
    console.log('\n   POST /api/fact-checking/:factCheckId/claims/:claimId/verify-comparative');
    console.log('\n   Body:');
    console.log('   {');
    console.log('     "webSearchResults": [');
    console.log('       {');
    console.log(`         "type": "current",`);
    console.log(`         "query": "${currentQuery}",`);
    console.log('         "content": "<paste search result 1 here>"');
    console.log('       },');
    console.log('       {');
    console.log(`         "type": "historical",`);
    console.log(`         "query": "${historicalQuery}",`);
    console.log('         "content": "<paste search result 2 here>"');
    console.log('       }');
    console.log('     ]');
    console.log('   }');
    console.log('\n4. The API will:');
    console.log('   - Extract numeric values from search results');
    console.log('   - Perform calculations');
    console.log('   - Generate verdict (TRUE/FALSE)');
    console.log('   - Store results in database');
    console.log('\n' + '='.repeat(80));
    console.log('\nAlternatively, this script can be enhanced to use Claude Code\'s');
    console.log('WebSearch tool when executed in that context.');
    console.log('='.repeat(80) + '\n');
}

demonstrateLiveVerification().catch(console.error);
