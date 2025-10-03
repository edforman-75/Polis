#!/usr/bin/env node

const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

const testText = `
Our internal polling shows we're 20 points ahead.
As you heard President Trump say, no one's taxes will go up.
According to the Congressional Budget Office, taxes will increase by 15%.
People are telling me there were massive problems with the vote.
The bill passed on September 15, 2025 with a vote of 218-210.
`;

console.log('=== COMPREHENSIVE FACT-CHECKING TEST ===\n');
console.log('Input text:', testText);
console.log('\n' + '='.repeat(80) + '\n');

const facts = parser.extractProvableFacts(testText);

facts.forEach((fact, idx) => {
    console.log(`[${idx + 1}] ${fact.type[0].toUpperCase()}`);
    console.log(`    "${fact.statement}"`);
    console.log(`    Verifiable: ${fact.verifiable !== false ? 'YES' : 'NO'}`);
    console.log(`    Confidence: ${(fact.confidence * 100).toFixed(0)}%`);

    if (fact.type.includes('private-data-claim')) {
        console.log(`    ❌ UNVERIFIABLE - ${fact.reason_unverifiable}`);
    } else if (fact.type.includes('hearsay')) {
        console.log(`    ⚠️  TWO-STEP VERIFICATION REQUIRED`);
        console.log(`    Original Speaker: ${fact.original_speaker}`);
        console.log(`    Must verify: (1) attribution (2) claim`);
    } else if (fact.type.includes('plausible-deniability')) {
        console.log(`    ⚠️  DENIABLE CLAIM (${(fact.deniability_score * 100).toFixed(0)}%)`);
        console.log(`    Reason: ${fact.deniability_reason}`);
    } else {
        console.log(`    ✅ DIRECT FACTUAL CLAIM`);
    }
    console.log();
});

console.log('=== SUMMARY ===\n');
console.log(`Total statements analyzed: ${facts.length}`);
console.log(`Verifiable claims: ${facts.filter(f => f.verifiable !== false).length}`);
console.log(`Unverifiable (private data): ${facts.filter(f => f.type.includes('private-data-claim')).length}`);
console.log(`Hearsay (two-step): ${facts.filter(f => f.type.includes('hearsay')).length}`);
console.log(`Deniable claims: ${facts.filter(f => f.type.includes('plausible-deniability')).length}`);
console.log(`Direct factual: ${facts.filter(f => !f.type.includes('private-data-claim') && !f.type.includes('hearsay') && !f.type.includes('plausible-deniability')).length}`);
