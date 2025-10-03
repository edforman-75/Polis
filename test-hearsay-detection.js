#!/usr/bin/env node

const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('=== HEARSAY / REPORTED SPEECH DETECTION ===\n');

const testCases = [
    {
        label: 'USER EXAMPLE',
        statement: "As you heard President Trump say, no one's taxes will go up because of this budget."
    },
    {
        label: 'DIRECT CLAIM',
        statement: "No one's taxes will go up because of this budget."
    },
    {
        label: 'ATTRIBUTION',
        statement: "According to the CBO, taxes will increase by 15% for middle-class families."
    },
    {
        label: 'HEARSAY (audience reference)',
        statement: "You heard the President say that healthcare costs will drop."
    },
    {
        label: 'HEARSAY (told us)',
        statement: "The Speaker told us that the bill would pass this week."
    },
    {
        label: 'HEARSAY (mentioned)',
        statement: "Governor Newsom mentioned that California will reach carbon neutrality by 2030."
    },
    {
        label: 'HEARSAY (as X said)',
        statement: "As Senator Warren said, we need to tax billionaires more heavily."
    },
    {
        label: 'HEARSAY (you\'ve heard)',
        statement: "You've heard Leader McConnell say we need to cut spending immediately."
    }
];

console.log('Testing each statement type:\n');
console.log('='.repeat(80));

testCases.forEach((test, idx) => {
    console.log(`\n[${idx + 1}] ${test.label}`);
    console.log(`Statement: "${test.statement}"\n`);

    const hearsay = parser.detectHearsay(test.statement);

    console.log(`Is Hearsay: ${hearsay.is_hearsay ? 'YES' : 'NO'} (confidence: ${(hearsay.confidence * 100).toFixed(0)}%)`);

    if (hearsay.is_hearsay) {
        console.log(`Type: ${hearsay.hearsay_type}`);
        console.log(`Original Speaker: ${hearsay.original_speaker || 'unknown'}`);
        console.log(`Verification: ${hearsay.verification_notes}`);
        console.log(`\nIndicators:`);
        hearsay.indicators.forEach(ind => {
            console.log(`  - [${ind.type}] "${ind.match}" (speaker: ${ind.speaker || 'n/a'})`);
        });
    }

    console.log('-'.repeat(80));
});

console.log('\n\n=== INTEGRATION WITH FACT EXTRACTION ===\n');

const sampleText = `
As you heard President Trump say, no one's taxes will go up because of this budget.
According to the Congressional Budget Office, the bill will increase taxes on 80% of middle-class families.
Our internal polling shows we are leading by 20 points.
The bill passed on September 15, 2025 with a vote of 218-210.
`;

console.log('Sample text:');
console.log(sampleText);
console.log('\nExtracted facts:\n');

const facts = parser.extractProvableFacts(sampleText);

facts.forEach((fact, idx) => {
    console.log(`[${idx + 1}] Type: ${fact.type.join(', ')}`);
    console.log(`    "${fact.statement}"`);
    console.log(`    Verifiable: ${fact.verifiable !== false ? 'YES' : 'NO'}`);

    if (fact.type.includes('hearsay')) {
        console.log(`    Hearsay Type: ${fact.hearsay_type}`);
        console.log(`    Original Speaker: ${fact.original_speaker}`);
        console.log(`    Verification: ${fact.verification_notes}`);
    }

    if (fact.type.includes('private-data-claim')) {
        console.log(`    Reason Unverifiable: ${fact.reason_unverifiable}`);
    }

    console.log();
});

console.log('\n=== KEY DISTINCTIONS ===\n');
console.log('1. DIRECT CLAIM:');
console.log('   "No one\'s taxes will go up"');
console.log('   → Speaker makes the claim directly\n');

console.log('2. ATTRIBUTION:');
console.log('   "According to the CBO, taxes will increase"');
console.log('   → Citing a verifiable source\n');

console.log('3. HEARSAY:');
console.log('   "As you heard President Trump say, no one\'s taxes will go up"');
console.log('   → Reporting what someone else said');
console.log('   → Requires TWO verifications:');
console.log('      (a) Did Trump actually say this?');
console.log('      (b) Is the claim factually accurate?\n');
