/**
 * Test Clarity Checks
 * Demonstrates detection of double negatives and other confusing constructions
 */

const TextQualityAnalyzer = require('./backend/utils/text-quality-analyzer');

const analyzer = new TextQualityAnalyzer();

const testCases = [
    {
        name: "Double Negatives",
        text: "It's not uncommon for families to struggle with healthcare costs. We can't deny that this is a problem. The situation is not unlikely to worsen without action."
    },
    {
        name: "Nominalizations (Weak Verb Phrases)",
        text: "We will make a decision to provide assistance to families. After we conduct an investigation and perform an analysis, we'll have a discussion about the findings."
    },
    {
        name: "Complex Conditionals",
        text: "If the legislature were not to pass this bill, unless the governor fails to veto it, except if voters don't approve the measure, we could see changes."
    },
    {
        name: "Excessive Hedging",
        text: "It seems that healthcare costs might be rising. It appears that this could be a problem. Possibly we should probably do something about it."
    },
    {
        name: "Combined Issues",
        text: `The plan, which is not without its challenges, will make a decision on healthcare reform.

It seems that many families might be struggling, and it's not uncommon to see rising costs. We can't deny that this possibly requires action.

If we were not to provide assistance to these families, unless the situation fails to improve, we may need to have a discussion about other options.`
    },
    {
        name: "Clear and Direct (Good Example)",
        text: "Healthcare costs are rising. Families struggle to afford care. We must expand Medicaid coverage immediately. This will help 50,000 families access quality care."
    }
];

console.log('🔍 CLARITY CHECKS TEST\n');
console.log('='.repeat(80));

testCases.forEach((testCase, idx) => {
    console.log(`\nTest ${idx + 1}: ${testCase.name}`);
    console.log('-'.repeat(80));
    console.log('TEXT:');
    console.log(testCase.text);
    console.log('\n');

    const analysis = analyzer.analyzeText(testCase.text);

    console.log(`📊 Overall Score: ${analysis.overallScore}/100`);

    const clarityIssues = analysis.issues.filter(i =>
        ['double_negative', 'nominalization', 'complex_conditional', 'excessive_hedging'].includes(i.type)
    );

    if (clarityIssues.length > 0) {
        console.log(`\n⚠️  Clarity Issues Found (${clarityIssues.length}):`);
        clarityIssues.forEach((issue, i) => {
            const display = analyzer.getSeverityDisplay(issue.severity);
            console.log(`\n   ${i + 1}. ${display.icon} ${issue.message}`);
            console.log(`      Details: ${issue.details}`);
            console.log(`      Suggestion: ${issue.suggestion}`);
            if (issue.examples && issue.examples.length > 0) {
                console.log(`      Examples found: "${issue.examples.join('", "')}"`);
            }
        });
    } else {
        console.log('\n✅ No clarity issues found!');
    }

    // Show other issues too
    const otherIssues = analysis.issues.filter(i =>
        !['double_negative', 'nominalization', 'complex_conditional', 'excessive_hedging'].includes(i.type)
    );

    if (otherIssues.length > 0) {
        console.log(`\n📝 Other Issues (${otherIssues.length}):`);
        otherIssues.forEach((issue, i) => {
            const display = analyzer.getSeverityDisplay(issue.severity);
            console.log(`   ${i + 1}. ${display.icon} ${issue.type}: ${issue.message}`);
        });
    }

    console.log('\n' + '='.repeat(80));
});

console.log('\n✅ Test complete!\n');
