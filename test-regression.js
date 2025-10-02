const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

console.log('================================================================================');
console.log('REGRESSION TEST SUITE');
console.log('Verifies parser maintains correctness on known-good examples');
console.log('================================================================================\n');

// Load baseline expectations
const baselinesPath = path.join(__dirname, 'test-data/parser-baselines.json');
const baselines = JSON.parse(fs.readFileSync(baselinesPath, 'utf-8'));

const parser = new PressReleaseParser();
const results = {
    total: baselines.length,
    passed: 0,
    failed: 0,
    regressions: []
};

baselines.forEach((baseline, index) => {
    console.log(`[${index + 1}/${baselines.length}] Testing: ${baseline.name}`);
    console.log('-'.repeat(80));

    const filePath = path.join(__dirname, baseline.file_path);
    const text = fs.readFileSync(filePath, 'utf-8');
    const result = parser.parse(text);

    let testPassed = true;
    const failures = [];

    // Check headline
    if (baseline.expected.headline) {
        if (result.content_structure?.headline !== baseline.expected.headline) {
            testPassed = false;
            failures.push({
                component: 'headline',
                expected: baseline.expected.headline,
                actual: result.content_structure?.headline
            });
        } else {
            console.log('  ✓ Headline correct');
        }
    }

    // Check dateline
    if (baseline.expected.dateline) {
        if (result.content_structure?.dateline?.full !== baseline.expected.dateline) {
            testPassed = false;
            failures.push({
                component: 'dateline',
                expected: baseline.expected.dateline,
                actual: result.content_structure?.dateline?.full
            });
        } else {
            console.log('  ✓ Dateline correct');
        }
    }

    // Check lead paragraph minimum length
    if (baseline.expected.lead_paragraph_min_length) {
        const leadLength = result.content_structure?.lead_paragraph?.length || 0;
        if (leadLength < baseline.expected.lead_paragraph_min_length) {
            testPassed = false;
            failures.push({
                component: 'lead_paragraph',
                expected: `At least ${baseline.expected.lead_paragraph_min_length} chars`,
                actual: `${leadLength} chars`
            });
        } else {
            console.log(`  ✓ Lead paragraph (${leadLength} chars)`);
        }
    }

    // Check quote count
    if (baseline.expected.quote_count !== undefined) {
        const quoteCount = result.quotes?.length || 0;
        if (quoteCount !== baseline.expected.quote_count) {
            testPassed = false;
            failures.push({
                component: 'quote_count',
                expected: baseline.expected.quote_count,
                actual: quoteCount
            });
        } else {
            console.log(`  ✓ Quote count (${quoteCount})`);
        }
    }

    // Check individual quotes
    if (baseline.expected.quotes) {
        baseline.expected.quotes.forEach((expectedQuote, i) => {
            const actualQuote = result.quotes?.[i];

            if (!actualQuote) {
                testPassed = false;
                failures.push({
                    component: `quote_${i + 1}`,
                    expected: 'Quote to exist',
                    actual: 'Quote missing'
                });
                return;
            }

            // Check speaker name
            if (expectedQuote.speaker_name && actualQuote.speaker_name !== expectedQuote.speaker_name) {
                testPassed = false;
                failures.push({
                    component: `quote_${i + 1}_speaker`,
                    expected: expectedQuote.speaker_name,
                    actual: actualQuote.speaker_name
                });
            }

            // Check speaker title
            if (expectedQuote.speaker_title && actualQuote.speaker_title !== expectedQuote.speaker_title) {
                testPassed = false;
                failures.push({
                    component: `quote_${i + 1}_title`,
                    expected: expectedQuote.speaker_title,
                    actual: actualQuote.speaker_title
                });
            }

            // Check quote text contains expected phrase
            if (expectedQuote.quote_text_contains) {
                if (!actualQuote.quote_text?.includes(expectedQuote.quote_text_contains)) {
                    testPassed = false;
                    failures.push({
                        component: `quote_${i + 1}_text`,
                        expected: `Contains "${expectedQuote.quote_text_contains}"`,
                        actual: actualQuote.quote_text?.substring(0, 60) + '...'
                    });
                }
            }

            if (testPassed || !failures.some(f => f.component.startsWith(`quote_${i + 1}`))) {
                console.log(`  ✓ Quote ${i + 1}: ${actualQuote.speaker_name}, ${actualQuote.speaker_title}`);
            }
        });
    }

    if (testPassed) {
        results.passed++;
        console.log('\n  ✅ PASS\n');
    } else {
        results.failed++;
        console.log('\n  ❌ FAIL - Regressions detected:\n');
        failures.forEach(failure => {
            console.log(`    Component: ${failure.component}`);
            console.log(`      Expected: ${failure.expected}`);
            console.log(`      Got:      ${failure.actual}\n`);
        });

        results.regressions.push({
            baseline: baseline.name,
            file: baseline.file_path,
            failures: failures
        });
    }
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('REGRESSION TEST SUMMARY');
console.log('='.repeat(80) + '\n');

console.log(`Total tests: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}\n`);

if (results.failed > 0) {
    console.log('❌ REGRESSION DETECTED!');
    console.log('\nRegressions found in:');
    results.regressions.forEach(reg => {
        console.log(`  - ${reg.baseline}`);
        console.log(`    File: ${reg.file}`);
        console.log(`    Issues: ${reg.failures.length}`);
    });
    console.log('\n⚠️  DO NOT DEPLOY - Fix regressions before continuing\n');
    process.exit(1);
} else {
    console.log('✅ ALL REGRESSION TESTS PASSED!');
    console.log('Parser maintains correctness on all baseline examples\n');
    process.exit(0);
}
