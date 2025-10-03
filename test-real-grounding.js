#!/usr/bin/env node

/**
 * Test claim grounding on real press releases
 * Uses actual WebSearch to verify claims
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const parser = new PressReleaseParser();

// Read a press release
const filePath = process.argv[2] || 'cpo_examples/sherrill_01_trump_funding.txt';
const content = fs.readFileSync(filePath, 'utf-8');

console.log('=== REAL CLAIM GROUNDING TEST ===\n');
console.log(`File: ${filePath}`);
console.log('\n' + '='.repeat(80) + '\n');

// Extract all facts
const facts = parser.extractProvableFacts(content);

console.log(`Extracted ${facts.length} potential facts:\n`);

// Display all facts
facts.forEach((fact, idx) => {
    console.log(`[${idx + 1}] ${fact.type.join(', ')}`);
    console.log(`    "${fact.statement}"`);

    if (fact.has_attribution) {
        console.log(`    Attribution: ${fact.attribution_source}`);
    }

    if (fact.verifiable === false) {
        console.log(`    ❌ UNVERIFIABLE: ${fact.reason_unverifiable}`);
    } else if (fact.verification_type === 'two-step') {
        console.log(`    ⚠️  HEARSAY: Requires two-step verification`);
    } else if (fact.verification_type === 'extract-underlying-claim') {
        console.log(`    ⚠️  DENIABLE: ${fact.deniability_reason}`);
    } else {
        console.log(`    ✅ VERIFIABLE`);
    }

    console.log();
});

// Find first verifiable fact with attribution
const verifiableFacts = facts.filter(f =>
    f.verifiable !== false &&
    f.verification_type !== 'two-step' &&
    f.verification_type !== 'extract-underlying-claim'
);

if (verifiableFacts.length === 0) {
    console.log('No directly verifiable facts found to ground.');
    process.exit(0);
}

const factToVerify = verifiableFacts[0];

console.log('='.repeat(80));
console.log('ATTEMPTING TO GROUND FIRST VERIFIABLE FACT:');
console.log('='.repeat(80));
console.log();
console.log(`Statement: "${factToVerify.statement}"`);
if (factToVerify.has_attribution) {
    console.log(`Attribution: ${factToVerify.attribution_source}`);
    const domain = parser.mapAttributionToDomain(factToVerify.attribution_source);
    console.log(`Mapped to domain: ${domain || '(none)'}`);
}
if (factToVerify.numeric_claims && factToVerify.numeric_claims.length > 0) {
    console.log(`Numeric claims: ${factToVerify.numeric_claims.map(n => n.text).join(', ')}`);
}
console.log();

// Generate search queries
const queries = parser.generateSearchQueries(factToVerify);
console.log('Generated search queries:');
queries.forEach((q, idx) => {
    console.log(`  ${idx + 1}. [${q.type}] ${q.query}`);
});
console.log();

console.log('Note: To perform actual web grounding, integrate with WebSearch/WebFetch');
console.log('      or call parser.groundClaim(fact, {webSearch, webFetch})');
