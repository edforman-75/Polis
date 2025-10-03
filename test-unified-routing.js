#!/usr/bin/env node

/**
 * Unified Verification Routing Test
 * Demonstrates automatic routing to appropriate verifier based on claim type
 */

const VerificationRouter = require('./backend/utils/verification-router');
const PressReleaseParser = require('./backend/utils/press-release-parser');

console.log('='.repeat(80));
console.log('UNIFIED VERIFICATION ROUTING - DEMONSTRATION');
console.log('='.repeat(80));

const parser = new PressReleaseParser();

// Test claims of different types
const testClaims = [
    {
        text: 'Our annual deficit is double what it was two years ago.',
        expectedMethod: 'comparative',
        description: 'Temporal ratio comparison'
    },
    {
        text: 'My opponent voted against the infrastructure bill 12 times.',
        expectedMethod: 'structured',
        description: 'Event with action/object and count'
    },
    {
        text: 'Crime has decreased by 15% in the district since 2020.',
        expectedMethod: 'structured',
        description: 'Statistical claim with quantity and time'
    },
    {
        text: 'Unemployment is higher than it was in 2019.',
        expectedMethod: 'comparative',
        description: 'Temporal comparison'
    },
    {
        text: 'The Senator announced new legislation yesterday.',
        expectedMethod: 'standard',
        description: 'Historical event without complex structure'
    }
];

async function testRouting() {
    console.log('\n📋 TEST CLAIMS\n');
    console.log('─'.repeat(80));

    // Create router without WebSearch (for routing logic test)
    const router = new VerificationRouter(null);

    for (let i = 0; i < testClaims.length; i++) {
        const test = testClaims[i];

        console.log(`\n${i + 1}. "${test.text}"`);
        console.log(`   Description: ${test.description}`);

        // Extract as existing system would
        const facts = parser.extractProvableFacts(test.text);
        const claim = facts[0] || { text: test.text, type: [] };

        // Determine method
        const method = router.determineVerificationMethod(claim);

        const match = method === test.expectedMethod;
        console.log(`   Expected method: ${test.expectedMethod}`);
        console.log(`   Actual method: ${method}`);
        console.log(`   Result: ${match ? '✅ CORRECT' : '❌ INCORRECT'}`);

        // Show what would happen
        if (method === 'comparative') {
            const detection = parser.detectComparativeClaim(claim.text);
            console.log(`   → Routes to comparative-verifier.js`);
            console.log(`   → Comparison type: ${detection.comparison_type}`);
            console.log(`   → Temporal: ${detection.is_temporal}, Trend: ${detection.is_trend}`);
        } else if (method === 'structured') {
            console.log(`   → Routes to fact-check-pipeline.js`);
            console.log(`   → Will extract: actor/action/object/quantity/time`);
        } else {
            console.log(`   → Routes to standard verification`);
            console.log(`   → Requires manual fact-checking`);
        }
    }

    // Full verification test with one claim
    console.log('\n\n' + '='.repeat(80));
    console.log('FULL VERIFICATION EXAMPLE');
    console.log('='.repeat(80));

    const exampleClaim = {
        text: 'My opponent voted against the infrastructure bill 12 times.',
        type: ['event', 'computational']
    };

    console.log(`\nClaim: "${exampleClaim.text}"\n`);

    const result = await router.verifyClaim(exampleClaim, {
        deniabilityScore: 0.1,
        deniabilityLabels: [],
        fallbackActor: 'Opponent Smith'
    });

    console.log('Routing Decision:');
    console.log(`  Method: ${result.verification_method}`);
    console.log(`  Success: ${result.success}`);

    console.log('\nVerification Result:');
    console.log(`  Verdict: ${result.verification?.verdict || 'N/A'}`);
    console.log(`  Confidence: ${result.verification?.confidence || 0}`);

    if (result.verification_method === 'structured') {
        console.log('\nStructured Data Extracted:');
        console.log(`  Predicate: ${result.verification.predicate}`);
        console.log(`  Actor: ${result.verification.actor || 'N/A'}`);
        console.log(`  Action: ${result.verification.action || 'N/A'}`);
        console.log(`  Object: ${result.verification.object || 'N/A'}`);

        if (result.verification.quantity) {
            console.log(`  Quantity: ${result.verification.quantity.value} ${result.verification.quantity.unit || ''}`);
        }

        console.log(`  Assertiveness: ${result.verification.assertiveness?.toFixed(2) || 'N/A'}`);
        console.log(`  Evidence sources: ${result.verification.evidence?.length || 0}`);
    }

    // Database storage format
    console.log('\n\n💾 DATABASE STORAGE');
    console.log('─'.repeat(80));

    if (result.verification_method === 'comparative') {
        console.log('\nStored in claim_verifications with COMPARATIVE fields:');
        console.log('  - comparison_type');
        console.log('  - left_value, right_value');
        console.log('  - calculated_result, expected_result');
        console.log('  - search_queries_used, data_extraction_log');
        console.log('  - calculation_steps');
    } else if (result.verification_method === 'structured') {
        console.log('\nStored in claim_verifications with STRUCTURED fields:');
        console.log('  - predicate (event, quantity, quote, status)');
        console.log('  - actor (normalized entity name)');
        console.log('  - action (voted against, raised, filed, etc.)');
        console.log('  - object (bill name, program, metric)');
        console.log('  - quantity_value, quantity_unit, quantity_direction');
        console.log('  - time_reference');
        console.log('  - assertiveness');
    } else {
        console.log('\nStored in claim_verifications with STANDARD fields:');
        console.log('  - verification_status: pending');
        console.log('  - Requires manual verification');
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('SUMMARY: How the Unified Router Works');
    console.log('='.repeat(80));

    console.log('\n1. CLAIM EXTRACTION (existing)');
    console.log('   parser.extractProvableFacts(text)');
    console.log('   → Detects all claims with types and patterns');

    console.log('\n2. VERIFICATION ROUTING (NEW)');
    console.log('   router.determineVerificationMethod(claim)');
    console.log('   → Analyzes claim type and content');
    console.log('   → Returns: "comparative" | "structured" | "standard"');

    console.log('\n3. VERIFICATION EXECUTION');
    console.log('   a) Comparative:');
    console.log('      → comparative-verifier.js');
    console.log('      → WebSearch → extract numbers → calculate → verdict');
    console.log('   ');
    console.log('   b) Structured:');
    console.log('      → fact-check-pipeline.js');
    console.log('      → Extract actor/action/object');
    console.log('      → Link to data sources (votes, stats)');
    console.log('      → Verify with evidence');
    console.log('   ');
    console.log('   c) Standard:');
    console.log('      → Manual verification required');
    console.log('      → Flag for human fact-checker');

    console.log('\n4. DATABASE STORAGE');
    console.log('   All methods → claim_verifications table');
    console.log('   Different fields populated based on method');
    console.log('   Unified storage format for reporting');

    console.log('\n\n✅ API ENDPOINTS AVAILABLE');
    console.log('─'.repeat(80));
    console.log('\n1. Unified Auto-Routing (RECOMMENDED):');
    console.log('   POST /api/fact-checking/:factCheckId/claims/:claimId/verify-auto');
    console.log('   → Automatically routes to correct verifier');
    console.log('   → Stores in database with appropriate fields');

    console.log('\n2. Specific Comparative Verification:');
    console.log('   POST /api/fact-checking/:factCheckId/claims/:claimId/verify-comparative');
    console.log('   → Forces comparative verification');
    console.log('   → Use when you know it\'s a comparative claim');

    console.log('\n3. Standard Verification (existing):');
    console.log('   POST /api/fact-checking/:factCheckId/claims/:claimId/verify');
    console.log('   → Manual verification workflow');

    console.log('\n' + '='.repeat(80));
    console.log('✅ UNIFIED ROUTING SYSTEM COMPLETE');
    console.log('='.repeat(80) + '\n');
}

testRouting().catch(console.error);
