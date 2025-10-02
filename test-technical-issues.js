/**
 * Test cases for technical parsing issues
 * These are structural/encoding problems, not content quality issues
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

console.log('================================================================================');
console.log('TECHNICAL PARSEABILITY ISSUES TEST');
console.log('Testing for structural/technical problems that break parsing');
console.log('================================================================================\n');

const technicalTestCases = [
    {
        name: 'Normal text (baseline)',
        text: 'FOR IMMEDIATE RELEASE\n\nWASHINGTON, D.C. — Oct 2, 2025\n\nSenator Announces Bill\n\n"Quote," said Smith.',
        expectedIssue: null
    },
    {
        name: 'All one line (no line breaks)',
        text: 'FOR IMMEDIATE RELEASE WASHINGTON, D.C. — Oct 2, 2025 Senator Announces Bill "Quote," said Smith.',
        expectedIssue: 'no_structure'
    },
    {
        name: 'Only whitespace',
        text: '     \n\n    \n\n     ',
        expectedIssue: 'empty_or_whitespace'
    },
    {
        name: 'Extremely short (< 10 chars)',
        text: 'Hello',
        expectedIssue: 'too_short'
    },
    {
        name: 'Binary/corrupt data',
        text: '\x00\x01\x02\x03\x04\xFF\xFE',
        expectedIssue: 'invalid_encoding'
    },
    {
        name: 'Extremely long single line (> 10000 chars)',
        text: 'A'.repeat(15000),
        expectedIssue: 'extremely_long_line'
    },
    {
        name: 'Mixed encoding issues',
        text: 'FOR IMMEDIATE RELEASE\n\n���\n\nText with weird chars',
        expectedIssue: 'encoding_issues'
    },
    {
        name: 'HTML/XML instead of plain text',
        text: '<html><body><h1>Press Release</h1><p>Content</p></body></html>',
        expectedIssue: 'html_detected'
    },
    {
        name: 'JSON instead of text',
        text: '{"press_release": "This is JSON data", "quotes": []}',
        expectedIssue: 'json_detected'
    },
    {
        name: 'Only special characters',
        text: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        expectedIssue: 'no_text_content'
    },
    {
        name: 'Extremely nested quotes (potential ReDoS)',
        text: '"' + '"'.repeat(1000) + ' text ' + '"'.repeat(1000),
        expectedIssue: 'malformed_quotes'
    },
    {
        name: 'Normal length, but all garbage',
        text: 'asdfkjasldkfjalskdjf laksjdflkasjdf laksdjflkasjdf lkajsdflkajsdf lkajsdflkajsdf laksdjflkasjdflkajsdf',
        expectedIssue: 'no_recognizable_structure'
    }
];

technicalTestCases.forEach(testCase => {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    console.log(`Expected Issue: ${testCase.expectedIssue || 'None'}`);

    try {
        const result = parser.parse(testCase.text);

        console.log(`✓ Parser did not crash`);
        console.log(`  Headline: ${result.content_structure.headline || 'NOT FOUND'}`);
        console.log(`  Quotes: ${result.quotes.length}`);
        console.log(`  Body paragraphs: ${result.content_structure.body_paragraphs?.length || 0}`);

        // Check if extraction was successful
        const hasAnyExtraction = result.content_structure.headline ||
                                result.quotes.length > 0 ||
                                (result.content_structure.body_paragraphs?.length || 0) > 0;

        if (!hasAnyExtraction) {
            console.log(`⚠️  WARNING: Parser ran but extracted nothing`);
        }
    } catch (error) {
        console.log(`❌ PARSER CRASHED: ${error.message}`);
        console.log(`   Stack: ${error.stack.split('\n')[0]}`);
    }
});

console.log('\n\n================================================================================');
console.log('SUMMARY: Technical Issues to Detect');
console.log('================================================================================');
console.log(`
Technical parseability issues (not content quality):

1. STRUCTURAL ISSUES:
   • Empty or whitespace-only input
   • Too short to be meaningful (< 50 chars)
   • All one line (no structure)
   • Extremely long lines (> 5000 chars)

2. ENCODING ISSUES:
   • Binary/corrupt data (null bytes, invalid UTF-8)
   • Mixed encoding problems
   • Control characters

3. FORMAT ISSUES:
   • HTML/XML instead of plain text
   • JSON instead of plain text
   • No recognizable text content

4. EXTRACTION FAILURES:
   • Parser runs but extracts nothing
   • No headlines, quotes, or paragraphs found

5. SECURITY ISSUES:
   • Potential ReDoS patterns (deeply nested quotes)
   • Extremely large input (> 1MB)
   • Suspicious patterns that could crash parser

These should be detected BEFORE attempting quality validation.
`);
