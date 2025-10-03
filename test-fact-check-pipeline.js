#!/usr/bin/env node

/**
 * Test and Demo: Fact-Checking Pipeline
 * Shows how deniability detection feeds into structured claim extraction and verification
 */

const FactCheckPipeline = require('./backend/utils/fact-check-pipeline');

console.log('='.repeat(80));
console.log('FACT-CHECKING PIPELINE DEMONSTRATION');
console.log('Deniability Detection → Claim Extraction → Source Linking → Verification');
console.log('='.repeat(80));

// Sample document with deniability flags
const sampleDoc = {
    doc_id: 'ATTACK-AD-001',
    sentences: [
        'Everybody knows crime increased 40% last year.',
        'The committee will meet on Tuesday.',
        'I don\'t know, but I\'ve heard taxes were raised 12 times.',
        'Unemployment is at 3.7 percent according to the Bureau of Labor Statistics.',
        'My opponent voted against the infrastructure bill.'
    ],
    pd_flags: [
        { labels: ['AppealToObviousness'], score: 0.7 },  // High deniability
        { labels: [], score: 0.0 },                        // Neutral (procedural)
        { labels: ['HearsayShield'], score: 0.6 },         // High deniability
        { labels: [], score: 0.1 },                        // Low deniability (factual)
        { labels: [], score: 0.2 }                         // Low deniability (factual)
    ]
};

async function runDemo() {
    console.log('\n📄 DOCUMENT ANALYSIS');
    console.log('─'.repeat(80));
    console.log(`Document ID: ${sampleDoc.doc_id}`);
    console.log(`Total sentences: ${sampleDoc.sentences.length}\n`);

    // Create pipeline (without WebSearch for now - would integrate later)
    const pipeline = new FactCheckPipeline(null);

    // Step 1: Show assertiveness calculation
    console.log('\nSTEP 1: ASSERTIVENESS SCORING');
    console.log('─'.repeat(80));
    console.log('Formula: assertiveness = 1 - deniability_score\n');

    sampleDoc.sentences.forEach((sent, i) => {
        const pd = sampleDoc.pd_flags[i];
        const assertiveness = pipeline.extractor.calculateAssertiveness(pd.score);
        const shouldCheck = pipeline.extractor.shouldFactCheck(sent, pd.score);

        console.log(`[${i + 1}] "${sent}"`);
        console.log(`    Deniability: ${pd.score.toFixed(2)} | Assertiveness: ${assertiveness.toFixed(2)}`);
        console.log(`    Labels: ${pd.labels.length > 0 ? pd.labels.join(', ') : 'none'}`);
        console.log(`    Fact-check: ${shouldCheck ? '✅ YES' : '❌ NO'}\n`);
    });

    // Step 2: Process document
    console.log('\nSTEP 2: CLAIM EXTRACTION');
    console.log('─'.repeat(80));

    const verifiedClaims = await pipeline.processDocument(sampleDoc, 'Opponent Smith');

    console.log(`\nExtracted ${verifiedClaims.length} claims:\n`);

    verifiedClaims.forEach((claim, i) => {
        console.log(`Claim ${i + 1}:`);
        console.log(`  Text: "${claim.claim.text}"`);
        console.log(`  Predicate: ${claim.claim.predicate}`);
        console.log(`  Action: ${claim.claim.action || 'N/A'}`);
        console.log(`  Object: ${claim.claim.object || 'N/A'}`);

        if (claim.claim.quantity && claim.claim.quantity.value !== null) {
            console.log(`  Quantity: ${claim.claim.quantity.value} ${claim.claim.quantity.unit || ''}`);
            if (claim.claim.quantity.direction) {
                console.log(`  Direction: ${claim.claim.quantity.direction}`);
            }
        }

        if (claim.claim.time && claim.claim.time.as_text) {
            console.log(`  Time: ${claim.claim.time.as_text}`);
        }

        console.log(`  Assertiveness: ${claim.claim.assertiveness.toFixed(2)}`);
        console.log(`  Deniability markers: ${claim.claim.deniability_markers.length}`);
        console.log('');
    });

    // Step 3: Verification results
    console.log('\nSTEP 3: VERIFICATION RESULTS');
    console.log('─'.repeat(80));
    console.log('Note: Without WebSearch integration, all claims show "unsupported"\n');

    verifiedClaims.forEach((claim, i) => {
        console.log(`Claim ${i + 1}:`);
        console.log(`  Status: ${claim.verification.status.toUpperCase()}`);
        console.log(`  Confidence: ${(claim.verification.confidence * 100).toFixed(0)}%`);
        console.log(`  Method: ${claim.verification.method || 'N/A'}`);
        console.log(`  Evidence sources: ${claim.verification.evidence.length}`);
        console.log(`  Notes: ${claim.verification.notes}`);
        console.log('');
    });

    // Step 4: Summary statistics
    console.log('\nSTEP 4: SUMMARY STATISTICS');
    console.log('─'.repeat(80));

    const stats = pipeline.getSummaryStats(verifiedClaims);

    console.log(`\nTotal claims analyzed: ${stats.total}`);
    console.log(`\nBy Verification Status:`);
    console.log(`  ✓ True: ${stats.by_status.true}`);
    console.log(`  ✗ False: ${stats.by_status.false}`);
    console.log(`  ⚠ Misleading: ${stats.by_status.misleading}`);
    console.log(`  ? Unsupported: ${stats.by_status.unsupported}`);
    console.log(`  — Unverified: ${stats.by_status.unverified}`);

    console.log(`\nBy Predicate Type:`);
    Object.entries(stats.by_predicate).forEach(([predicate, count]) => {
        console.log(`  ${predicate}: ${count}`);
    });

    console.log(`\nAverages:`);
    console.log(`  Assertiveness: ${(stats.avg_assertiveness * 100).toFixed(0)}%`);
    console.log(`  Verification confidence: ${(stats.avg_confidence * 100).toFixed(0)}%`);
    console.log(`  Claims with evidence: ${stats.with_evidence}/${stats.total}`);

    // Step 5: Integration notes
    console.log('\n\n' + '='.repeat(80));
    console.log('INTEGRATION WITH EXISTING SYSTEM');
    console.log('='.repeat(80));
    console.log('\nThis pipeline enhances the existing comparative verification system:');
    console.log('\n1. ✅ Deniability Detection');
    console.log('   - Already implemented in press-release-parser.js');
    console.log('   - Feeds assertiveness scores to this pipeline');
    console.log('\n2. ✅ Structured Claim Extraction');
    console.log('   - NEW: Extracts actor/action/object/quantity/time');
    console.log('   - Complements comparative claim detection');
    console.log('\n3. ✅ Source Linking Registry');
    console.log('   - NEW: Maps claim types to data sources');
    console.log('   - Extensible for votes, economy, finance data');
    console.log('\n4. ✅ Verification Scoring');
    console.log('   - NEW: Combines numeric consistency + deniability penalty');
    console.log('   - Returns TRUE/FALSE/MISLEADING/UNSUPPORTED verdicts');
    console.log('\n5. 🔄 WebSearch Integration (same as comparative verification)');
    console.log('   - Can use the same WebSearch integration');
    console.log('   - Source linkers query BLS, BEA, Congress.gov, etc.');
    console.log('\n6. 💾 Database Storage');
    console.log('   - Can use existing claim_verifications table');
    console.log('   - Add new fields for predicate, actor, action, object');
    console.log('\n' + '='.repeat(80));
    console.log('\nNext Steps:');
    console.log('  1. Expand database schema for structured claims');
    console.log('  2. Create API endpoint for pipeline processing');
    console.log('  3. Integrate WebSearch into source linkers');
    console.log('  4. Add unit tests for extraction patterns');
    console.log('  5. Build UI for claim verification workflow');
    console.log('='.repeat(80) + '\n');
}

runDemo().catch(console.error);
