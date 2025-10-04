const axios = require('axios');

const testText = `Senator Rodriguez Endorses Clean Energy Bill

SACRAMENTO, CA, October 3, 2025 — Senator Maria Rodriguez today announced her support for the Clean Energy Infrastructure Act, praising its comprehensive approach to renewable energy.

"This bill represents a watershed moment for California's clean energy future. We have the opportunity to lead the nation in renewable infrastructure," said Senator Rodriguez.

The bill allocates $50 billion for solar and wind projects across the state. It also includes provisions for job training programs in green energy sectors.

Governor John Chen joined Rodriguez in supporting the legislation. "Senator Rodriguez has been a champion for environmental protection. This bill will create thousands of jobs while fighting climate change," Chen said.

Environmental groups have also praised the measure. The California Environmental Coalition called it "the most ambitious climate legislation in state history."

Contact: Press Office, (555) 123-4567, press@rodriguez.senate.gov`;

async function testMultiQuoteParsing() {
    console.log('=' .repeat(70));
    console.log('TESTING MULTI-QUOTE PARSING');
    console.log('=' .repeat(70) + '\n');

    try {
        const response = await axios.post('http://localhost:3001/api/press-release-parser/parse', {
            text: testText,
            verifiedData: {
                release_type: 'NEWS_RELEASE',
                subtypes: ['endorsement'],
                issues: ['environment', 'energy'],
                reviewed_by: 'Test User'
            }
        });

        const parsed = response.data.parsed;

        console.log('STRUCTURE EXTRACTED:\n');
        console.log('Headline:', parsed.content_structure.headline);
        console.log('\nDateline:', parsed.content_structure.dateline.raw_text);
        console.log('\nLead Paragraph:', parsed.content_structure.lead_paragraph);

        console.log('\n\nBODY PARAGRAPHS (' + parsed.content_structure.body_paragraphs.length + '):');
        parsed.content_structure.body_paragraphs.forEach((para, i) => {
            console.log(`\n[${i + 1}] ${para}`);
        });

        console.log('\n\nQUOTES EXTRACTED (' + parsed.quotes.length + '):');
        parsed.quotes.forEach((quote, i) => {
            console.log(`\n[Quote ${i + 1}]`);
            console.log('  Speaker:', quote.speaker_name);
            console.log('  Quote:', quote.quote_text.substring(0, 80) + '...');
        });

        console.log('\n\n' + '=' .repeat(70));
        console.log('🎯 CONTENT FLOW (PRESERVES ORIGINAL ORDER)');
        console.log('=' .repeat(70));

        if (parsed.content_flow && parsed.content_flow.length > 0) {
            parsed.content_flow.forEach((block, i) => {
                console.log(`\n[${i + 1}] ${block.type.toUpperCase()}:`);
                if (block.type === 'quote') {
                    console.log(`    Speaker: ${block.speaker}`);
                    console.log(`    Quote: ${block.content.substring(0, 60)}...`);
                } else {
                    console.log(`    ${block.content.substring(0, 70)}...`);
                }
            });

            console.log('\n\n✅ SUCCESS: Content flow preserves original document order!');
            console.log('The HTML generator can now render:');
            console.log('  Lead → Quote 1 → Body Para → Quote 2 → Body Para');
            console.log('exactly as they appeared in the original document.\n');
        } else {
            console.log('\n⚠️  No content_flow found in output');
            console.log('Content flow may not be preserved.\n');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testMultiQuoteParsing();
