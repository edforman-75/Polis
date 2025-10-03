#!/usr/bin/env node

/**
 * Test: Impact of Structured Claim Extraction on Verification
 * Compares existing extraction vs. new pipeline approach
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const FactCheckPipeline = require('./backend/utils/fact-check-pipeline');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('IMPACT ANALYSIS: Structured Claim Extraction vs. Existing System');
console.log('='.repeat(80));

const parser = new PressReleaseParser();
const pipeline = new FactCheckPipeline(null);

// Test with a real press release
const testFile = './examples/example-press-releases/spanberger-announces-legislation.txt';

if (!fs.existsSync(testFile)) {
    console.log('\n⚠️  Test file not found. Using sample text instead.\n');
    runWithSampleText();
} else {
    const text = fs.readFileSync(testFile, 'utf-8');
    runComparison(text, 'Spanberger Press Release');
}

async function runComparison(text, docName) {
    console.log(`\n📄 Document: ${docName}`);
    console.log('─'.repeat(80));

    // EXISTING SYSTEM
    console.log('\n\n🔵 EXISTING SYSTEM (press-release-parser.js)');
    console.log('─'.repeat(80));

    const existingFacts = parser.extractProvableFacts(text);

    console.log(`\nTotal facts extracted: ${existingFacts.length}`);
    console.log('\nBreakdown by type:');

    const typeCount = {};
    existingFacts.forEach(f => {
        const types = Array.isArray(f.type) ? f.type : [f.type];
        types.forEach(t => {
            typeCount[t] = (typeCount[t] || 0) + 1;
        });
    });

    Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    // Show sample facts
    console.log('\nSample extracted facts:');
    existingFacts.slice(0, 5).forEach((f, i) => {
        console.log(`\n  [${i + 1}] "${f.text.substring(0, 80)}${f.text.length > 80 ? '...' : ''}"`);
        console.log(`      Type: ${Array.isArray(f.type) ? f.type.join(', ') : f.type}`);
        console.log(`      Verifiable: ${f.verifiable ? 'YES' : 'NO'}`);
        console.log(`      Verification type: ${f.verification_type || 'N/A'}`);
    });

    // NEW PIPELINE SYSTEM
    console.log('\n\n🟢 NEW PIPELINE (fact-check-pipeline.js)');
    console.log('─'.repeat(80));

    // Split into sentences
    const sentences = parser.splitIntoSentences(text);

    // Create mock pd_flags (in production, these come from deniability detector)
    const pdFlags = sentences.map(sent => {
        // Simple heuristic: look for hedging words
        const hedgeWords = ['I think', 'maybe', 'possibly', 'reportedly', 'allegedly', 'some say'];
        const hasHedge = hedgeWords.some(word => sent.toLowerCase().includes(word.toLowerCase()));
        return {
            labels: hasHedge ? ['HedgedModality'] : [],
            score: hasHedge ? 0.6 : 0.1
        };
    });

    const doc = {
        doc_id: 'TEST-001',
        sentences: sentences,
        pd_flags: pdFlags
    };

    const structuredClaims = await pipeline.processDocument(doc, 'Representative Spanberger');

    console.log(`\nTotal structured claims: ${structuredClaims.length}`);

    // Analyze structured claims
    const predicateCount = {};
    const withQuantity = structuredClaims.filter(c => c.claim.quantity && c.claim.quantity.value !== null);
    const withTime = structuredClaims.filter(c => c.claim.time && c.claim.time.as_text);
    const withAction = structuredClaims.filter(c => c.claim.action);

    structuredClaims.forEach(c => {
        predicateCount[c.claim.predicate] = (predicateCount[c.claim.predicate] || 0) + 1;
    });

    console.log('\nBreakdown by predicate:');
    Object.entries(predicateCount).forEach(([pred, count]) => {
        console.log(`  ${pred}: ${count}`);
    });

    console.log(`\nWith structured data:`);
    console.log(`  Quantity extracted: ${withQuantity.length}`);
    console.log(`  Time reference: ${withTime.length}`);
    console.log(`  Action identified: ${withAction.length}`);

    // Show sample structured claims
    console.log('\nSample structured claims:');
    structuredClaims.slice(0, 5).forEach((claim, i) => {
        console.log(`\n  [${i + 1}] "${claim.claim.text.substring(0, 80)}${claim.claim.text.length > 80 ? '...' : ''}"`);
        console.log(`      Predicate: ${claim.claim.predicate}`);
        console.log(`      Assertiveness: ${claim.claim.assertiveness.toFixed(2)}`);

        if (claim.claim.action) {
            console.log(`      Action: "${claim.claim.action}"`);
        }
        if (claim.claim.object) {
            console.log(`      Object: "${claim.claim.object}"`);
        }
        if (claim.claim.quantity && claim.claim.quantity.value !== null) {
            console.log(`      Quantity: ${claim.claim.quantity.value} ${claim.claim.quantity.unit || ''}`);
        }
        if (claim.claim.time && claim.claim.time.as_text) {
            console.log(`      Time: ${claim.claim.time.as_text}`);
        }
    });

    // COMPARISON
    console.log('\n\n⚖️  COMPARISON: What Does the New Pipeline Add?');
    console.log('─'.repeat(80));

    console.log('\n✅ Existing System Strengths:');
    console.log('   • Comprehensive fact detection');
    console.log('   • Plausible deniability scoring');
    console.log('   • Comparative claim detection (14 types)');
    console.log('   • Non-factual statement tracking');

    console.log('\n✅ New Pipeline Additions:');
    console.log('   • Structured extraction (actor/action/object)');
    console.log('   • Quantity normalization (%, $, counts)');
    console.log('   • Time reference extraction');
    console.log('   • Source linker registry');
    console.log('   • Assertiveness scoring (1 - deniability)');
    console.log('   • Verification status (TRUE/FALSE/MISLEADING)');

    console.log('\n📊 Coverage Analysis:');
    console.log(`   Existing facts: ${existingFacts.length}`);
    console.log(`   Structured claims: ${structuredClaims.length}`);
    console.log(`   Difference: ${Math.abs(existingFacts.length - structuredClaims.length)}`);

    // Find comparative claims in existing system
    const comparativeClaims = existingFacts.filter(f =>
        (Array.isArray(f.type) && f.type.includes('comparative-claim')) ||
        f.verification_type === 'multi-step-comparative'
    );

    console.log(`\n   Comparative claims (existing): ${comparativeClaims.length}`);
    console.log(`   → These should use comparative-verifier.js`);

    const quantityClaims = structuredClaims.filter(c => c.claim.predicate === 'quantity');
    const eventClaims = structuredClaims.filter(c => c.claim.predicate === 'event');

    console.log(`\n   Quantity claims (new): ${quantityClaims.length}`);
    console.log(`   Event claims (new): ${eventClaims.length}`);
    console.log(`   → These should use fact-check-pipeline.js`);

    // Integration recommendation
    console.log('\n\n💡 INTEGRATION STRATEGY');
    console.log('─'.repeat(80));
    console.log('\nRecommended routing:');
    console.log('\n1. Run existing parser.extractProvableFacts()');
    console.log('   ↓');
    console.log('2. For each fact, check type:');
    console.log('   ');
    console.log('   a) Comparative claim?');
    console.log('      → Use comparative-verifier.js (already integrated)');
    console.log('      → Handles temporal ratios, trends, comparisons');
    console.log('   ');
    console.log('   b) Non-factual statement?');
    console.log('      → Store in non_factual_statements table');
    console.log('      → Already tracked with explanations');
    console.log('   ');
    console.log('   c) Simple fact (vote, quote, stat)?');
    console.log('      → Use fact-check-pipeline.js (NEW)');
    console.log('      → Extract actor/action/object structure');
    console.log('      → Link to appropriate sources');
    console.log('   ');
    console.log('3. Store all results in unified database');

    // Database impact
    console.log('\n\n💾 DATABASE IMPACT');
    console.log('─'.repeat(80));
    console.log('\nCurrent schema (claim_verifications):');
    console.log('  ✓ comparison_type, left_value, right_value (for comparative)');
    console.log('  ✓ calculated_result, expected_result');
    console.log('  ✓ search_queries_used, data_extraction_log');
    console.log('  ✓ automated flag');

    console.log('\nSuggested additions for structured claims:');
    console.log('  + predicate (event|quantity|quote|status|etc.)');
    console.log('  + actor (normalized entity name)');
    console.log('  + action (voted against|raised|filed|etc.)');
    console.log('  + object (bill name|program|metric)');
    console.log('  + quantity_value, quantity_unit, quantity_direction');
    console.log('  + time_reference (as_text, start_date, end_date)');

    // Summary stats
    console.log('\n\n📈 SUMMARY STATISTICS');
    console.log('─'.repeat(80));

    const stats = pipeline.getSummaryStats(structuredClaims);

    console.log(`\nStructured claims analyzed: ${stats.total}`);
    console.log(`Average assertiveness: ${(stats.avg_assertiveness * 100).toFixed(0)}%`);
    console.log(`\nPredicate distribution:`);
    Object.entries(stats.by_predicate).forEach(([pred, count]) => {
        const pct = ((count / stats.total) * 100).toFixed(0);
        console.log(`  ${pred}: ${count} (${pct}%)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('CONCLUSION');
    console.log('='.repeat(80));
    console.log('\nThe new pipeline COMPLEMENTS rather than REPLACES existing work:');
    console.log('\n  ✅ Keep comparative-verifier.js for complex comparisons');
    console.log('  ✅ Keep non-factual tracking for opinion/prediction/etc.');
    console.log('  ✅ Add fact-check-pipeline.js for simple factual claims');
    console.log('  ✅ All three systems work together via unified routing');
    console.log('\nNext step: Create unified API endpoint that routes to correct verifier');
    console.log('='.repeat(80) + '\n');
}

function runWithSampleText() {
    const sampleText = `
Representative Spanberger announced new legislation today to support small businesses.
The bill would provide $50 million in funding over three years.
Crime has decreased by 15% in the district since 2020.
My opponent voted against infrastructure improvements 12 times.
Unemployment in the region stands at 3.2 percent according to recent statistics.
`;

    runComparison(sampleText, 'Sample Text');
}

runComparison.apply(null, process.argv.length > 2 ? [fs.readFileSync(process.argv[2], 'utf-8'), process.argv[2]] : []);
