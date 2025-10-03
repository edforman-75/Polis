#!/usr/bin/env node

const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('=== PLAUSIBLE DENIABILITY DETECTION ===\n');

const testCases = [
    {
        label: 'Trump-style: People are saying',
        statement: "People are telling me there were tremendous problems—everybody knows it."
    },
    {
        label: 'Hearsay shield',
        statement: "I don't know, but that's what I've heard about the election."
    },
    {
        label: 'JAQing off (Just Asking Questions)',
        statement: "I'm not saying it's true, but isn't it interesting that the votes came in so late?"
    },
    {
        label: 'Rhetorical question',
        statement: "What if the system was rigged with massive fraud?"
    },
    {
        label: 'Passive authority',
        statement: "It is widely believed that there may be corruption in the process."
    },
    {
        label: 'Anonymous consensus',
        statement: "Many people think the media never talks about it."
    },
    {
        label: 'Noncommittal future',
        statement: "We'll see what happens with the investigation."
    },
    {
        label: 'Direct claim (no deniability)',
        statement: "The bill passed on September 15, 2025 with a vote of 218-210."
    },
    {
        label: 'Combo: Multiple patterns',
        statement: "Everybody knows people are saying there could be massive fraud—just asking questions."
    }
];

console.log('Testing individual patterns:\n');
console.log('='.repeat(80));

testCases.forEach((test, idx) => {
    console.log(`\n[${idx + 1}] ${test.label}`);
    console.log(`Statement: "${test.statement}"\n`);

    const result = parser.detectPlausibleDeniability(test.statement);

    console.log(`Has Deniability: ${result.has_deniability ? 'YES' : 'NO'} (score: ${(result.confidence * 100).toFixed(0)}%)`);

    if (result.has_deniability) {
        console.log(`Labels: ${result.labels.join(', ')}`);
        console.log(`Reason: ${result.reason}`);
        console.log(`\nMatched Patterns:`);
        result.matched_patterns.forEach(p => {
            console.log(`  - [${p.id}] "${p.match}" (weight: ${p.weight})`);
        });
    }

    console.log('-'.repeat(80));
});

console.log('\n\n=== INTEGRATION WITH FACT EXTRACTION ===\n');

const sampleText = `
People are telling me there were tremendous problems—everybody knows it.
I don't know, but that's what I've heard.
Isn't it interesting? What if the system was rigged?
It is widely believed that there may be fraud.
I'm not saying it's true, but many people think so.
We'll see what happens.
The bill actually passed on September 15, 2025 with a vote of 218-210.
According to the Congressional Budget Office, taxes will increase by 15%.
`;

console.log('Sample text (mix of deniable and direct claims):');
console.log(sampleText);
console.log('\nExtracted facts:\n');

const facts = parser.extractProvableFacts(sampleText);

facts.forEach((fact, idx) => {
    console.log(`[${idx + 1}] Type: ${fact.type.join(', ')}`);
    console.log(`    "${fact.statement}"`);
    console.log(`    Confidence: ${(fact.confidence * 100).toFixed(0)}%`);

    if (fact.type.includes('plausible-deniability')) {
        console.log(`    Deniability Score: ${(fact.deniability_score * 100).toFixed(0)}%`);
        console.log(`    Reason: ${fact.deniability_reason}`);
        console.log(`    Verification: ${fact.verification_type}`);
    }

    console.log();
});

console.log('\n=== KEY CONCEPTS ===\n');

console.log('1. DIRECT CLAIM (no deniability):');
console.log('   "The bill passed on September 15, 2025"');
console.log('   → Speaker directly asserts a fact\n');

console.log('2. PLAUSIBLE DENIABILITY:');
console.log('   "People are saying there were tremendous problems"');
console.log('   → Speaker suggests a claim without asserting it directly');
console.log('   → If challenged: "I didn\'t say it, other people did"\n');

console.log('3. JAQing OFF (Just Asking Questions):');
console.log('   "I\'m not saying it\'s true, but isn\'t it interesting?"');
console.log('   → Speaker plants suggestion through questions');
console.log('   → If challenged: "I was just asking questions"\n');

console.log('4. PASSIVE AUTHORITY:');
console.log('   "It is widely believed that..."');
console.log('   → Speaker cites vague authority');
console.log('   → If challenged: "I didn\'t say it, others believe it"\n');

console.log('\nWHY THIS MATTERS:');
console.log('These patterns allow politicians to:');
console.log('  • Make inflammatory claims without direct responsibility');
console.log('  • Avoid fact-checking by not making direct assertions');
console.log('  • Plant ideas in audience minds through suggestion');
console.log('  • Maintain deniability if claims are proven false');
