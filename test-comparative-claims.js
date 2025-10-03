#!/usr/bin/env node

/**
 * Test comparative/computational claim detection
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

// Test cases
const testCases = [
    "Our annual deficit is greater than the GDP of the UK.",
    "Unemployment is lower than it was in 2019.",
    "We've raised more money than any other candidate in the primary.",
    "Inflation is higher than the EU average.",
    "Crime has doubled since 2020.",
    "Our state has three times the poverty rate of neighboring states.",
    "The budget exceeds last year's spending by 20%.",
    "Voter turnout surpassed the 2016 election.",
    "Medicare spending trails inflation by 5 percentage points.",
    "This bill will cost American families twice what they paid last year.", // This is also a prediction
    "The economy is doing well.", // NOT comparative
    "We need to reduce the deficit.", // NOT comparative
];

console.log('\n' + '='.repeat(70));
console.log('TESTING COMPARATIVE/COMPUTATIONAL CLAIM DETECTION');
console.log('='.repeat(70));

for (const testCase of testCases) {
    console.log(`\n📝 Test: "${testCase}"`);

    const result = parser.detectComparativeClaim(testCase);

    if (result.is_comparative) {
        console.log(`   ✅ COMPARATIVE CLAIM DETECTED`);
        console.log(`   📊 Type: ${result.comparison_type}`);
        console.log(`   🔍 Phrase: "${result.comparison_phrase}"`);
        console.log(`   📈 Metrics found: ${result.metrics.join(', ') || 'none (numeric comparison)'}`);
        console.log(`   🔢 Has numbers: ${result.has_numbers}`);
        console.log(`   📍 Left side: "${result.left_side}"`);
        console.log(`   📍 Right side: "${result.right_side}"`);
        console.log(`   ⚙️  Verification steps:`);
        result.verification_steps.forEach(step => {
            console.log(`      ${step.step}. ${step.description}`);
        });
    } else {
        console.log(`   ❌ Not a comparative claim`);
    }
}

console.log('\n' + '='.repeat(70));
console.log('Now testing full extraction with extractProvableFacts...');
console.log('='.repeat(70));

const fullText = `
Our annual deficit is greater than the GDP of the UK.
Unemployment is lower than it was in 2019.
We've raised more money than any other candidate.
The economy is doing well.
Crime has doubled since 2020.
`;

const facts = parser.extractProvableFacts(fullText);

console.log(`\n📊 Extracted ${facts.length} factual claims:\n`);

facts.forEach((fact, i) => {
    console.log(`${i + 1}. "${fact.text || fact.statement}"`);
    console.log(`   Type: ${Array.isArray(fact.type) ? fact.type.join(', ') : fact.type}`);
    console.log(`   Verification: ${fact.verification_type || 'standard'}`);
    if (fact.verification_steps) {
        console.log(`   Steps required: ${fact.verification_steps.length}`);
    }
    if (fact.comparison_type) {
        console.log(`   Comparison: ${fact.comparison_type}`);
    }
    console.log('');
});

console.log('✅ Test complete!\n');
