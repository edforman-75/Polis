#!/usr/bin/env node

const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Test with a sample release
const content = fs.readFileSync('cpo_examples/booker_01_shutdown.txt', 'utf-8');

console.log('=== FACT EXTRACTION TEST ===\n');
console.log('File: booker_01_shutdown.txt\n');

const facts = parser.extractProvableFacts(content);

console.log(`Found ${facts.length} provable factual claims\n`);
console.log('='.repeat(80));

facts.forEach((fact, idx) => {
    console.log(`\n[FACT ${idx + 1}] Confidence: ${(fact.confidence * 100).toFixed(1)}%`);
    console.log(`Type: ${fact.type.join(', ')}`);
    console.log(`Statement: "${fact.statement}"`);

    if (fact.numeric_claims.length > 0) {
        console.log('\nNumeric Claims:');
        fact.numeric_claims.forEach(claim => {
            console.log(`  - ${claim.type}: ${claim.text} (value: ${claim.value}${claim.magnitude ? ' ' + claim.magnitude : ''}${claim.unit ? ' ' + claim.unit : ''})`);
        });
    }

    if (fact.has_attribution) {
        console.log(`\nAttribution: ${fact.attribution_source}`);
    }

    if (fact.hedging_detected.length > 0) {
        console.log('\nHedging Detected:');
        fact.hedging_detected.forEach(hedge => {
            console.log(`  - ${hedge.type}: "${hedge.match}" (weight: ${hedge.weight})`);
        });
    }

    console.log(`\nFactual Elements: ${fact.factual_elements.join(', ')}`);
    console.log(`Requires Verification: ${fact.requires_verification ? 'YES' : 'NO'}`);
    console.log('-'.repeat(80));
});

// Now test with some example sentences to show hedging detection
console.log('\n\n=== HEDGING DETECTION EXAMPLES ===\n');

const testSentences = [
    "There could be as many as 1,000,000 people affected by this policy.",
    "There are 1,000 people in my state whose health care costs will double next year.",
    "The bill passed on September 15, 2025 with a vote of 218-210.",
    "This might impact thousands of families across the country.",
    "According to the CDC, COVID-19 hospitalizations increased by 15% last month.",
    "The economy would suffer if this policy were enacted.",
    "Republicans voted against the bill 200 times.",
    "This appears to be a growing trend in healthcare costs."
];

testSentences.forEach((sentence, idx) => {
    console.log(`\n[${idx + 1}] "${sentence}"`);
    const hedging = parser.detectHedging(sentence);
    console.log(`   Hedged: ${hedging.is_hedged ? 'YES' : 'NO'} (confidence: ${(hedging.confidence * 100).toFixed(1)}%)`);
    if (hedging.markers.length > 0) {
        console.log(`   Markers: ${hedging.markers.map(m => `"${m.match}" (${m.type})`).join(', ')}`);
    }

    const factualElements = parser.identifyFactualElements(sentence);
    console.log(`   Factual Score: ${(factualElements.score * 100).toFixed(1)}%`);
    console.log(`   Elements: ${factualElements.elements.join(', ') || 'none'}`);
});
