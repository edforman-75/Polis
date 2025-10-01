/**
 * Test Text Quality Analyzer
 * Demonstrates run-on sentence detection and other quality checks
 */

const TextQualityAnalyzer = require('./backend/utils/text-quality-analyzer');

const analyzer = new TextQualityAnalyzer();

// Test cases
const testCases = [
    {
        name: "Run-on with many conjunctions",
        text: "We need to invest in education and we need to support teachers and we must expand access to early childhood education and we should provide better resources for schools."
    },
    {
        name: "Run-on with many clauses",
        text: "Education is important, but we also need healthcare, and we must address climate change, which affects everyone, while ensuring economic growth, so that all families can thrive."
    },
    {
        name: "Very long sentence",
        text: "As State Senator, I have fought tirelessly for working families across our district, championing legislation that expands healthcare access, increases teacher salaries, protects our environment for future generations, and ensures that every child has the opportunity to succeed regardless of their zip code or family income."
    },
    {
        name: "Good paragraph with variety",
        text: "Healthcare is a right, not a privilege. I've spent my career fighting for universal coverage. Every family deserves access to quality care. Together, we can make this a reality."
    },
    {
        name: "Full press release body with issues",
        text: `BOSTON, MA - State Senator John Smith today announced his comprehensive plan to address healthcare access and affordability issues that are affecting families across Massachusetts.

"Healthcare costs are rising and families are struggling and we need to do something about it and I'm committed to fighting for change," said Smith. "We need to make sure that everyone has access to quality care."

The plan includes provisions that would expand Medicaid coverage and reduce prescription drug costs and create new community health centers and improve access to mental health services.

Smith has been a longtime advocate for healthcare reform and has sponsored multiple bills addressing these issues and has worked with community organizations to identify solutions.`
    }
];

console.log('🔍 TEXT QUALITY ANALYZER TEST\n');
console.log('='.repeat(80));

testCases.forEach((testCase, idx) => {
    console.log(`\nTest ${idx + 1}: ${testCase.name}`);
    console.log('-'.repeat(80));
    console.log('TEXT:');
    console.log(testCase.text);
    console.log('\n');

    const analysis = analyzer.analyzeText(testCase.text);

    console.log(`📊 Overall Score: ${analysis.overallScore}/100`);
    console.log(`📏 Statistics:`);
    console.log(`   - Words: ${analysis.statistics.wordCount}`);
    console.log(`   - Sentences: ${analysis.statistics.sentenceCount}`);
    console.log(`   - Paragraphs: ${analysis.statistics.paragraphCount}`);
    console.log(`   - Avg sentence length: ${analysis.statistics.avgSentenceLength} words`);
    console.log(`   - Longest sentence: ${analysis.statistics.longestSentence} words`);

    if (analysis.issues.length > 0) {
        console.log(`\n⚠️  Issues Found (${analysis.issues.length}):`);
        analysis.issues.forEach((issue, i) => {
            const display = analyzer.getSeverityDisplay(issue.severity);
            console.log(`\n   ${i + 1}. ${display.icon} ${issue.message}`);
            console.log(`      Location: ${issue.location}`);
            console.log(`      Details: ${issue.details}`);
            if (issue.sentenceText) {
                console.log(`      Sentence: "${issue.sentenceText}"`);
            }
            console.log(`      Suggestion: ${issue.suggestion}`);
        });
    } else {
        console.log('\n✅ No issues found!');
    }

    if (analysis.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        analysis.recommendations.forEach((rec, i) => {
            console.log(`\n   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
            console.log(`      Reason: ${rec.reason}`);
            if (rec.locations) {
                console.log(`      Locations: ${rec.locations.join(', ')}`);
            }
        });
    }

    console.log('\n' + '='.repeat(80));
});

console.log('\n✅ Test complete!\n');
