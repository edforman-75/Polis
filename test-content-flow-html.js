const axios = require('axios');
const fs = require('fs');

const testText = `Senator Rodriguez Endorses Clean Energy Bill

SACRAMENTO, CA, October 3, 2025 — Senator Maria Rodriguez today announced her support for the Clean Energy Infrastructure Act, praising its comprehensive approach to renewable energy.

"This bill represents a watershed moment for California's clean energy future. We have the opportunity to lead the nation in renewable infrastructure," said Senator Rodriguez.

The bill allocates $50 billion for solar and wind projects across the state. It also includes provisions for job training programs in green energy sectors.

Governor John Chen joined Rodriguez in supporting the legislation. "Senator Rodriguez has been a champion for environmental protection. This bill will create thousands of jobs while fighting climate change," Chen said.

Environmental groups have also praised the measure. The California Environmental Coalition called it "the most ambitious climate legislation in state history."

Contact: Press Office, (555) 123-4567, press@rodriguez.senate.gov`;

async function generateHtmlWithContentFlow() {
    console.log('Generating HTML with Content Flow...\n');

    try {
        const response = await axios.post('http://localhost:3001/api/press-release-parser/generate-html', {
            text: testText,
            verifiedData: {
                release_type: 'NEWS_RELEASE',
                subtypes: ['endorsement'],
                issues: ['environment', 'energy'],
                reviewed_by: 'Test User'
            }
        });

        const outputPath = '/Users/edf/campaign-ai-editor/demo-html-output/content-flow-test.html';
        fs.writeFileSync(outputPath, response.data);

        console.log(`✅ HTML generated: ${outputPath}`);
        console.log('\nOpen the file to see content in original document order:');
        console.log('  Lead paragraph');
        console.log('  → Quote from Rodriguez');
        console.log('  → Body paragraph about $50B');
        console.log('  → Quote from Chen');
        console.log('  → Final paragraph about environmental groups\n');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

generateHtmlWithContentFlow();
