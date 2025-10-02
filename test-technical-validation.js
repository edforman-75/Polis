const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('TECHNICAL VALIDATION TEST');
console.log('Testing structural/encoding issue detection');
console.log('================================================================================\n');

const testCases = [
    {
        name: 'Valid press release',
        text: 'FOR IMMEDIATE RELEASE\n\nWASHINGTON, D.C. — Oct 2, 2025\n\nSenator Announces Bill\n\n"Quote," said Smith.\n\nBody text here.',
        shouldPass: true
    },
    {
        name: 'Empty input',
        text: '',
        shouldPass: false
    },
    {
        name: 'Only whitespace',
        text: '   \n\n   \n  ',
        shouldPass: false
    },
    {
        name: 'Too short (< 50 chars)',
        text: 'Hello world',
        shouldPass: false
    },
    {
        name: 'Binary data',
        text: '\x00\x01\x02Binary\xFFdata',
        shouldPass: false
    },
    {
        name: 'HTML instead of text',
        text: '<html><body><h1>Press Release</h1><p>Content here</p></body></html>',
        shouldPass: true // Passes but with warning
    },
    {
        name: 'JSON instead of text',
        text: '{"title": "Press Release", "content": "Some text here that makes it long enough"}',
        shouldPass: true // Passes but with warning
    },
    {
        name: 'No text content (only symbols)',
        text: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        shouldPass: false
    }
];

testCases.forEach(({ name, text, shouldPass }) => {
    console.log(`\n--- ${name} ---`);

    const result = parser.parseWithValidation(text);

    if (result.is_parseable === false) {
        // Technical validation failed
        console.log('❌ REJECTED - Not technically parseable');
        console.log(`Status: ${shouldPass ? 'UNEXPECTED FAIL' : 'EXPECTED FAIL'}`);
        console.log('\nTechnical Errors:');
        result.technical_validation.errors.forEach(err => {
            console.log(`  • ${err.message}`);
            console.log(`    → ${err.suggestion}`);
        });
    } else {
        // Technical validation passed
        console.log('✅ Technically parseable');

        if (result.technical_validation?.warnings?.length > 0) {
            console.log('\n⚠️  Technical Warnings:');
            result.technical_validation.warnings.forEach(warn => {
                console.log(`  • [${warn.severity}] ${warn.message}`);
                console.log(`    → ${warn.suggestion}`);
            });
        }

        if (result.validation) {
            console.log(`\nQuality Score: ${result.validation.quality_score}/100 (${result.validation.status})`);
        }
    }
});

console.log('\n\n================================================================================');
console.log('TECHNICAL VS QUALITY VALIDATION');
console.log('================================================================================\n');

console.log('TECHNICAL Validation (structural/encoding):');
console.log('  ❌ Empty input');
console.log('  ❌ Too short (< 50 chars)');
console.log('  ❌ Binary/corrupt data');
console.log('  ❌ No text content');
console.log('  ⚠️  HTML detected');
console.log('  ⚠️  JSON detected');
console.log('  ⚠️  Extremely long lines');
console.log('  ⚠️  No line breaks');
console.log('\nQUALITY Validation (content):');
console.log('  ❌ No FOR IMMEDIATE RELEASE');
console.log('  ❌ No quotes');
console.log('  ❌ No headline');
console.log('  ⚠️  Missing dateline');
console.log('  ⚠️  Unknown speakers');
console.log('\nValidation Order:');
console.log('  1. Technical validation (blocks parsing if fails)');
console.log('  2. Parse the text');
console.log('  3. Quality validation (suggests improvements)');
console.log('');
