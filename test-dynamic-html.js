const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api/press-release-parser/generate-html';

// Test cases for each type
const testCases = [
    {
        name: 'STATEMENT',
        filename: 'statement-demo.html',
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
        name: 'NEWS_RELEASE (Endorsement)',
        filename: 'news-release-endorsement-demo.html',
        text: `Governor Chen Endorses Senator Rodriguez for Re-Election

SACRAMENTO, CA, October 3, 2025 — Governor John Chen today endorsed Senator Maria Rodriguez for re-election, calling her "a tireless advocate for California families."

"Senator Rodriguez has been a tireless advocate for California families. She delivers results, and I'm proud to support her re-election," said Governor Chen.

Senator Rodriguez responded, "Governor Chen's endorsement means a great deal. Together, we'll continue fighting for California's future."

Rodriguez has served in the U.S. Senate for six years, focusing on healthcare and infrastructure.

Contact: Press Office, (555) 123-4567, press@rodriguez.senate.gov`,
        verifiedData: {
            release_type: 'NEWS_RELEASE',
            subtypes: ['endorsement'],
            issues: ['healthcare', 'infrastructure'],
            reviewed_by: 'Demo User'
        }
    },
    {
        name: 'FACT_SHEET',
        filename: 'fact-sheet-demo.html',
        text: `INFRASTRUCTURE INVESTMENT PLAN

KEY INVESTMENTS:
- $50 billion for roads and bridges
- $25 billion for public transit
- $15 billion for clean water infrastructure

ECONOMIC IMPACT:
- Creates 500,000 new jobs
- Generates $100 billion in economic activity
- Reduces commute times by 20%

TIMELINE:
- Phase 1: Projects begin Q1 2026
- Phase 2: Full deployment by Q4 2027
- Phase 3: Completion by 2029

Contact: Economic Policy Team, policy@campaign.com`,
        verifiedData: {
            release_type: 'FACT_SHEET',
            subtypes: [],
            issues: ['infrastructure', 'economy', 'jobs'],
            reviewed_by: 'Demo User'
        }
    },
    {
        name: 'MEDIA_ADVISORY',
        filename: 'media-advisory-demo.html',
        text: `MEDIA ADVISORY: Healthcare Press Conference

WHO: Senator Rodriguez and healthcare advocates

WHAT: Press conference to unveil comprehensive healthcare legislation

WHEN: Tuesday, October 3, 2025 at 10:00 AM PDT

WHERE: State Capitol Building, Room 2000, Sacramento, CA

WHY: To unveil comprehensive healthcare legislation that will expand coverage to 2 million Californians

Media credentials required. Photo and video permitted.

Contact: Sarah Johnson, Press Secretary, (555) 123-4567, press@rodriguez.senate.gov`,
        verifiedData: {
            release_type: 'MEDIA_ADVISORY',
            subtypes: ['press_conference'],
            issues: ['healthcare'],
            reviewed_by: 'Demo User'
        }
    },
    {
        name: 'LETTER',
        filename: 'letter-demo.html',
        text: `October 3, 2025

Dear Majority Leader Smith:

RE: Urgent Action Needed on Infrastructure Bill

I write to urge immediate consideration of the Infrastructure Modernization Act.

Our communities cannot afford further delay. Bridges are failing, roads are crumbling, and families are at risk. The American people deserve better than partisan gridlock.

I respectfully request that you bring this bill to the floor for a vote within the next 30 days.

Respectfully,

Senator Maria Rodriguez
U.S. Senator, California`,
        verifiedData: {
            release_type: 'LETTER',
            subtypes: ['call_to_action'],
            issues: ['infrastructure'],
            reviewed_by: 'Demo User'
        }
    },
    {
        name: 'TRANSCRIPT',
        filename: 'transcript-demo.html',
        text: `Transcript: Interview with Senator Rodriguez

HOST: Welcome, Senator Rodriguez.

SENATOR RODRIGUEZ: Thank you for having me.

HOST: Let's talk about your infrastructure plan. What makes it different?

SENATOR RODRIGUEZ: Our plan focuses on three key areas: roads and bridges, public transit, and clean water. We're not just throwing money at the problem. We're investing strategically in projects that will create jobs and improve lives.

HOST: How will you pay for it?

SENATOR RODRIGUEZ: Through a combination of public-private partnerships and smart budgeting. We've done the math, and it works.

Contact: Press Office, press@rodriguez.senate.gov`,
        verifiedData: {
            release_type: 'TRANSCRIPT',
            subtypes: ['interview'],
            issues: ['infrastructure'],
            reviewed_by: 'Demo User'
        }
    }
];

async function generateHtmlDemos() {
    console.log('='.repeat(70));
    console.log('DYNAMIC HTML GENERATOR - DEMO');
    console.log('='.repeat(70) + '\n');

    const outputDir = path.join(__dirname, 'demo-html-output');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
        console.log(`✓ Created output directory: ${outputDir}\n`);
    }

    for (const testCase of testCases) {
        console.log(`Generating: ${testCase.name}...`);

        try {
            const response = await axios.post(API_URL, {
                text: testCase.text,
                verifiedData: testCase.verifiedData
            });

            const outputPath = path.join(outputDir, testCase.filename);
            fs.writeFileSync(outputPath, response.data);

            console.log(`  ✓ ${testCase.filename} created`);
            console.log(`  Type: ${testCase.verifiedData.release_type}`);
            console.log(`  Subtypes: ${testCase.verifiedData.subtypes.join(', ') || 'none'}`);
            console.log('');

        } catch (error) {
            console.error(`  ✗ Error: ${error.message}\n`);
        }
    }

    console.log('='.repeat(70));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(70));
    console.log(`\nGenerated HTML files are in: ${outputDir}`);
    console.log('\nOpen them in your browser to see the type-specific layouts!\n');
}

// Check if server is running
axios.get('http://localhost:3001')
    .then(() => {
        console.log('✓ Server is running\n');
        return generateHtmlDemos();
    })
    .catch(error => {
        console.error('\n✗ ERROR: Server not accessible on port 3001');
        console.error('Please start the server with: node server.js\n');
        process.exit(1);
    });
