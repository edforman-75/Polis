const TextQualityAnalyzer = require('./backend/utils/text-quality-analyzer');

const analyzer = new TextQualityAnalyzer();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('           DOUBLE NEGATIVE DETECTION TEST');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

const testSentences = [
    {
        text: "This is not uncommon in political campaigns.",
        expected: "Should detect 'not uncommon'"
    },
    {
        text: "We can't deny that healthcare costs are rising and families are struggling to make ends meet.",
        expected: "Should detect 'can't deny' (30 words, 2 'and's)"
    },
    {
        text: "The administration won't fail to deliver on promises.",
        expected: "Should detect 'won't fail to'"
    },
    {
        text: "There is no lack of commitment to our values.",
        expected: "Should detect 'no lack of'"
    },
    {
        text: "This policy is not without its problems.",
        expected: "Should detect 'not without'"
    },
    {
        text: "Healthcare costs are rising.",
        expected: "No double negatives"
    },
    {
        text: "We can't deny that healthcare costs are not uncommon challenges and families are struggling to make ends meet with rising prices and stagnant wages and they need solutions that will address these problems.",
        expected: "Complex run-on: double negatives + long + conjunctions"
    }
];

testSentences.forEach((test, i) => {
    console.log(`Test ${i + 1}: ${test.expected}`);
    console.log(`Sentence: "${test.text}"`);

    const result = analyzer.checkRunOnSentence(test.text);

    console.log(`  Words: ${result.wordCount}`);
    console.log(`  Conjunctions: ${result.conjunctions}`);
    console.log(`  Clauses: ${result.clauses}`);
    console.log(`  Double negatives: ${result.doubleNegatives}`);

    if (result.doubleNegativeExamples && result.doubleNegativeExamples.length > 0) {
        console.log(`  Examples: "${result.doubleNegativeExamples.join('", "')}"`);
    }

    console.log(`  Is run-on: ${result.isRunOn ? '❌ YES' : '✅ NO'}`);

    if (result.isRunOn && result.details) {
        console.log(`  Details: ${result.details}`);
    }

    if (result.fixSuggestions && result.fixSuggestions.length > 0) {
        console.log(`  Fix suggestions:`);
        result.fixSuggestions.forEach((fix, i) => {
            console.log(`    ${i + 1}. ${fix}`);
        });
    }

    console.log();
});

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();
console.log('Double negative detection integrated into run-on checking:');
console.log('  • Detects 7 types of double negatives');
console.log('  • Flags as run-on if combined with other complexity (25+ words, 2+ conjunctions, 3+ clauses)');
console.log('  • Returns examples in results');
console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
