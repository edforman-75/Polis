/**
 * Test Readability Analyzer
 * Demonstrates grade-level analysis and suggestions
 */

const ReadabilityAnalyzer = require('./backend/utils/readability-analyzer');

const analyzer = new ReadabilityAnalyzer();

const testCases = [
    {
        name: "Simple Press Release (Target: 8th grade)",
        text: `We need better healthcare. Families struggle to afford care. I will expand Medicaid. This will help 50,000 people access doctors and hospitals. Every person deserves quality care.`,
        targetGrade: 8,
        contentType: 'press_release'
    },
    {
        name: "Complex Press Release (Too Difficult)",
        text: `The comprehensive healthcare reform initiative encompasses multifaceted provisions designed to facilitate enhanced accessibility to medical services for economically disadvantaged populations. Through implementation of expanded Medicaid eligibility criteria and establishment of community-based healthcare facilities, we endeavor to ameliorate the systemic inadequacies that perpetuate healthcare disparities.`,
        targetGrade: 8,
        contentType: 'press_release'
    },
    {
        name: "Social Media Post (Target: 6th grade)",
        text: `Healthcare is a right! Join us Saturday at City Hall. We're fighting for families who can't afford care. Together, we can win! #HealthcareForAll`,
        targetGrade: 6,
        contentType: 'social_media'
    },
    {
        name: "Policy Document (Target: 12th grade)",
        text: `This legislation establishes a framework for healthcare expansion through three mechanisms: enhanced federal matching rates for state Medicaid programs, creation of health insurance cooperatives in underserved markets, and implementation of cost-sharing subsidies for individuals earning between 138% and 400% of the federal poverty level. The projected fiscal impact over ten years approximates $847 billion, offset partially through revenue provisions including adjustments to the Medicare payroll tax threshold.`,
        targetGrade: 12,
        contentType: 'policy_document'
    },
    {
        name: "Actual Campaign Text (Real Example)",
        text: `BOSTON, MA - State Senator John Smith announced his plan to expand healthcare access today. The plan will help working families afford coverage and prescription drugs.

"Too many families choose between paying rent and buying medicine," said Smith. "That's wrong. We can do better."

Smith's plan expands Medicaid to cover 150,000 more people. It also caps prescription drug costs at $50 per month for seniors.`,
        targetGrade: 8,
        contentType: 'press_release'
    }
];

console.log('📚 READABILITY ANALYZER TEST\n');
console.log('='.repeat(90));

testCases.forEach((testCase, idx) => {
    console.log(`\nTest ${idx + 1}: ${testCase.name}`);
    console.log('-'.repeat(90));
    console.log('TEXT:');
    console.log(testCase.text.substring(0, 200) + (testCase.text.length > 200 ? '...' : ''));
    console.log('\n');

    const analysis = analyzer.analyzeReadability(testCase.text, testCase.targetGrade, testCase.contentType);
    const report = analyzer.formatReport(analysis);

    console.log('📊 READABILITY SCORES:');
    console.log(`   Current Grade Level: ${report.summary.currentGrade.toFixed(1)} (${report.summary.gradeLabel})`);
    console.log(`   Target Grade Level: ${report.summary.targetGrade} (${testCase.contentType})`);
    console.log(`   Difficulty: ${report.summary.difficulty}`);
    console.log(`   Status: ${report.summary.onTarget ? '✅ ON TARGET' : '⚠️  OFF TARGET'}`);
    if (!report.summary.onTarget) {
        const direction = report.summary.deviation > 0 ? 'TOO DIFFICULT' : 'TOO SIMPLE';
        console.log(`   Deviation: ${Math.abs(report.summary.deviation).toFixed(1)} grades ${direction}`);
    }

    console.log('\n📈 MULTIPLE FORMULAS:');
    console.log(`   Flesch-Kincaid Grade: ${report.scores.fleschKincaid}`);
    console.log(`   Gunning Fog Index: ${report.scores.gunningFog}`);
    console.log(`   SMOG Index: ${report.scores.smog}`);
    console.log(`   Coleman-Liau Index: ${report.scores.colemanLiau}`);
    console.log(`   Automated Readability: ${report.scores.automatedReadability}`);
    console.log(`   Flesch Reading Ease: ${report.scores.fleschReadingEase}/100 (${report.fleschInterpretation})`);

    console.log('\n📏 TEXT STATISTICS:');
    console.log(`   Words: ${report.statistics.words}`);
    console.log(`   Sentences: ${report.statistics.sentences}`);
    console.log(`   Avg sentence length: ${report.statistics.avgSentenceLength.toFixed(1)} words`);
    console.log(`   Avg word length: ${report.statistics.avgWordLength.toFixed(1)} characters`);
    console.log(`   Avg syllables/word: ${report.statistics.avgSyllablesPerWord.toFixed(2)}`);
    console.log(`   Complex words (3+ syllables): ${report.statistics.complexWords} (${(report.statistics.complexWords / report.statistics.words * 100).toFixed(1)}%)`);

    if (report.suggestions.length > 0) {
        console.log('\n💡 SUGGESTIONS TO REACH TARGET:');
        report.suggestions.forEach((suggestion, i) => {
            const priorityIcon = suggestion.priority === 'high' ? '🔴' :
                                suggestion.priority === 'medium' ? '🟡' : '🟢';

            console.log(`\n   ${i + 1}. ${priorityIcon} ${suggestion.priority.toUpperCase()}`);

            if (suggestion.issue) {
                console.log(`      Issue: ${suggestion.issue}`);
            }
            if (suggestion.action) {
                console.log(`      Action: ${suggestion.action}`);
            }
            if (suggestion.target) {
                console.log(`      Target: ${suggestion.target}`);
            }
            if (suggestion.impact) {
                console.log(`      Impact: ${suggestion.impact}`);
            }
        });
    } else {
        console.log('\n✅ No suggestions needed - text is at target level!');
    }

    console.log('\n' + '='.repeat(90));
});

// Show recommended levels for all content types
console.log('\n📋 RECOMMENDED GRADE LEVELS BY CONTENT TYPE:\n');
Object.entries(analyzer.recommendedLevels).forEach(([type, info]) => {
    const gradeLabel = analyzer.gradeLevels[info.target].label;
    console.log(`   ${type.padEnd(20)} Target: ${info.target} (${gradeLabel.padEnd(20)}) Range: ${info.range[0]}-${info.range[1]}`);
    console.log(`   ${' '.repeat(20)} Note: ${info.note}`);
    console.log('');
});

console.log('\n✅ Test complete!\n');
