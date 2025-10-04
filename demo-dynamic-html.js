const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const DynamicHTMLGenerator = require('./backend/utils/dynamic-html-generator');

// Test cases for each type
const testCases = [
    {
        name: 'STATEMENT',
        text: `Senator Martinez Responds to Infrastructure Veto

WASHINGTON, D.C., October 3, 2025 — Senator Carlos Martinez released the following statement in response to today's infrastructure bill veto:

"This veto is a betrayal of American workers. Millions of jobs hang in the balance, and this administration has chosen politics over people. I will continue fighting for the infrastructure investments our communities desperately need."

Contact: Sarah Johnson, (202) 555-1234, press@martinez.senate.gov`,
        verifiedData: {
            release_type: 'STATEMENT',
            subtypes: ['response_statement'],
            issues: ['infrastructure'],
            reviewed_by: 'Demo User'
        }
    },
    {
        name: 'NEWS_RELEASE_ENDORSEMENT',
        text: `Governor Chen Endorses Senator Rodriguez for Re-Election

SACRAMENTO, CA, October 3, 2025 — Governor John Chen today endorsed Senator Maria Rodriguez for re-election, calling her "a tireless advocate for California families."

"Senator Rodriguez has been a tireless advocate for California families. She delivers results, and I'm proud to support her re-election," said Governor Chen.

Senator Rodriguez responded, "Governor Chen's endorsement means a great deal. Together, we'll continue fighting for California's future."

Contact: Press Office, (555) 123-4567, press@rodriguez.gov`,
        verifiedData: {
            release_type: 'NEWS_RELEASE',
            subtypes: ['endorsement'],
            issues: ['healthcare', 'economy'],
            reviewed_by: 'Demo User'
        }
    },
    {
        name: 'FACT_SHEET',
        text: `INFRASTRUCTURE INVESTMENT PLAN

OVERVIEW
Bold plan to rebuild America's infrastructure and create millions of jobs

KEY INVESTMENTS:
- $50 billion for roads and bridges
- $25 billion for public transit
- $15 billion for clean water infrastructure
- $10 billion for broadband expansion

ECONOMIC IMPACT:
- Creates 500,000 new jobs
- Generates $100 billion in economic activity
- Reduces commute times by 20%

TIMELINE:
Implementation begins Q1 2026 with completion targeted for 2030

Contact: Policy Team, policy@senate.gov`,
        verifiedData: {
            release_type: 'FACT_SHEET',
            subtypes: [],
            issues: ['infrastructure', 'jobs', 'economy'],
            reviewed_by: 'Demo User'
        }
    },
    {
        name: 'MEDIA_ADVISORY',
        text: `MEDIA ADVISORY: Healthcare Press Conference

WHO: Senator Rodriguez and healthcare advocates

WHAT: Press conference to unveil comprehensive healthcare legislation

WHEN: Tuesday, October 3, 2025 at 10:00 AM PDT

WHERE: State Capitol Building, Room 2000, Sacramento, CA

WHY: To unveil comprehensive healthcare legislation that will expand coverage to 2 million uninsured Californians

Media credentials required. Photo and video permitted.

Contact: Sarah Johnson, Press Secretary, (555) 123-4567`,
        verifiedData: {
            release_type: 'MEDIA_ADVISORY',
            subtypes: ['press_conference'],
            issues: ['healthcare'],
            reviewed_by: 'Demo User'
        }
    }
];

console.log('='.repeat(70));
console.log('DYNAMIC HTML GENERATOR DEMO');
console.log('='.repeat(70));
console.log('');

const parser = new PressReleaseParser();
const htmlGenerator = new DynamicHTMLGenerator();

testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. Generating ${testCase.name} HTML...`);

    // Parse the press release
    const parsedData = parser.parse(testCase.text, testCase.verifiedData);

    // Generate HTML
    const html = htmlGenerator.generate(parsedData);

    // Save to file
    const filename = `demo-${testCase.name.toLowerCase()}.html`;
    const filepath = path.join(__dirname, 'public', filename);
    fs.writeFileSync(filepath, html);

    console.log(`   ✓ Saved to: public/${filename}`);
    console.log(`   ✓ View at: http://localhost:3001/${filename}`);
    console.log('');
});

console.log('='.repeat(70));
console.log('✓ All HTML files generated successfully!');
console.log('');
console.log('To view the demos:');
console.log('1. Make sure the server is running: node server.js');
console.log('2. Open your browser to:');
testCases.forEach((testCase) => {
    const filename = `demo-${testCase.name.toLowerCase()}.html`;
    console.log(`   http://localhost:3001/${filename}`);
});
console.log('='.repeat(70));
