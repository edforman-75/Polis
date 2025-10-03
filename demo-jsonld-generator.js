/**
 * Demo: JSON-LD Generator
 *
 * Shows how to generate publication-ready JSON-LD from parsed content
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const JSONLDGenerator = require('./backend/utils/jsonld-generator');
const fs = require('fs');

// Sample press release content
const sampleRelease = `For Immediate Release
October 3, 2025

Contact: Jane Smith Press Team
press@janesmithforcongress.org

Jane Smith Announces Comprehensive Economic Recovery Plan

WASHINGTON - Jane Smith today unveiled a bold economic recovery plan that will create jobs, reduce the deficit, and restore fiscal responsibility to Washington.

"For too long, Washington has failed to deliver real solutions for American families," said Smith. "While politicians play games, hardworking Americans are paying the price. That ends now."

The comprehensive plan addresses several critical areas:

Job Creation and Economic Growth

Our plan will create 50,000 new jobs in the first year through targeted infrastructure investments and support for small businesses.

More than 25% of VA workers are veterans, demonstrating our commitment to those who served.

Fiscal Responsibility

The deficit has doubled in the last two years, placing an enormous burden on future generations. Our plan takes a balanced approach to deficit reduction.

Learn more at janesmithforcongress.org/plan

###`;

async function demo() {
    console.log('🚀 JSON-LD Generator Demo\n');
    console.log('=' .repeat(60));

    // Step 1: Parse the content
    console.log('\n📄 Step 1: Parsing press release...\n');
    const parser = new PressReleaseParser();
    const rawParseResult = parser.parse(sampleRelease);

    // Transform parser output to format expected by JSON-LD generator
    const parseResult = {
        type: rawParseResult.release_type.type,
        subtypes: rawParseResult.subtypes,
        issues: rawParseResult.issues,
        headline: rawParseResult.content_structure.headline,
        fullText: sampleRelease,
        tone: rawParseResult.release_type.tone
    };

    console.log('✓ Detected type:', parseResult.type);
    console.log('✓ Detected subtypes:', parseResult.subtypes.map(s => s.subtype || s.code || s).join(', '));
    console.log('✓ Detected issues:', parseResult.issues.map(i => i.issue || i).join(', '));

    // Step 2: Mock fact-checking results
    console.log('\n🔍 Step 2: Mock fact-checking results...\n');
    const factCheckResults = [
        {
            text: "Our plan will create 50,000 new jobs",
            verdict: "TRUE",
            confidence: 0.92,
            sources: [
                {
                    name: "Economic Policy White Paper",
                    url: "https://janesmithforcongress.org/plan/economic-policy.pdf",
                    excerpt: "Modeling suggests 48,000-52,000 jobs..."
                }
            ]
        },
        {
            text: "More than 25% of VA workers are veterans",
            verdict: "TRUE",
            confidence: 0.95,
            sources: [
                {
                    name: "VA Workforce Dashboard",
                    url: "https://www.va.gov/EMPLOYEE/docs/Section-505-Annual-Report-2024.pdf"
                }
            ]
        },
        {
            text: "The deficit has doubled in the last two years",
            verdict: "FALSE",
            confidence: 0.98,
            sources: [
                {
                    name: "CBO Budget Outlook 2025",
                    url: "https://www.cbo.gov/publication/60870"
                }
            ]
        }
    ];

    console.log('✓ Verified', factCheckResults.filter(f => f.verdict === 'TRUE').length, 'claims');
    console.log('✓ Flagged', factCheckResults.filter(f => f.verdict === 'FALSE').length, 'claims');

    // Step 3: Set up metadata
    console.log('\n⚙️  Step 3: Setting up metadata...\n');
    const metadata = {
        slug: 'economic-recovery-plan',
        baseUrl: 'https://janesmithforcongress.org',
        organizationName: 'Jane Smith for Congress',
        organizationUrl: 'https://janesmithforcongress.org',
        pressEmail: 'press@janesmithforcongress.org',
        datePublished: '2025-10-03',
        language: 'en',
        cta: {
            type: 'learn',
            url: 'https://janesmithforcongress.org/plan'
        }
    };

    console.log('✓ Organization:', metadata.organizationName);
    console.log('✓ Slug:', metadata.slug);
    console.log('✓ URL:', `${metadata.baseUrl}/press/${metadata.slug}`);

    // Step 4: Generate JSON-LD
    console.log('\n🏗️  Step 4: Generating JSON-LD...\n');
    const generator = new JSONLDGenerator();
    const jsonld = generator.generate(parseResult, factCheckResults, metadata);

    console.log('✓ Generated JSON-LD with', Object.keys(jsonld).length, 'top-level properties');
    console.log('✓ Schema types:', Array.isArray(jsonld['@type']) ? jsonld['@type'].join(', ') : jsonld['@type']);
    console.log('✓ CPO release type:', jsonld['cpo:releaseType']);
    console.log('✓ CPO subtype:', jsonld['cpo:subtype']);
    console.log('✓ Claims included:', jsonld['cpo:claims'] ? jsonld['cpo:claims'].length : 0);

    // Step 5: Save JSON-LD
    console.log('\n💾 Step 5: Saving output...\n');
    const outputDir = __dirname;

    // Save just the JSON-LD
    const jsonldPath = `${outputDir}/output-press-release.jsonld`;
    fs.writeFileSync(jsonldPath, JSON.stringify(jsonld, null, 2));
    console.log('✓ Saved JSON-LD:', jsonldPath);

    // Save complete HTML with embedded JSON-LD
    const html = generator.generateHTML(jsonld, sampleRelease, metadata);
    const htmlPath = `${outputDir}/output-press-release.html`;
    fs.writeFileSync(htmlPath, html);
    console.log('✓ Saved HTML:', htmlPath);

    // Step 6: Generate ClaimReview for flagged claim
    console.log('\n⚠️  Step 6: Generating ClaimReview for flagged claim...\n');
    const flaggedClaim = factCheckResults.find(f => f.verdict === 'FALSE');
    if (flaggedClaim) {
        const claimReview = generator.generateClaimReview(flaggedClaim, {
            ...metadata,
            slug: 'deficit-doubled-claim',
            originReleaseUrl: `${metadata.baseUrl}/press/${metadata.slug}`
        });

        const claimReviewPath = `${outputDir}/output-claimreview.jsonld`;
        fs.writeFileSync(claimReviewPath, JSON.stringify(claimReview, null, 2));
        console.log('✓ Saved ClaimReview:', claimReviewPath);
        console.log('✓ Rating:', claimReview.reviewRating.alternateName);
    }

    // Display sample output
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Sample JSON-LD Output:\n');
    console.log(JSON.stringify(jsonld, null, 2).split('\n').slice(0, 40).join('\n'));
    console.log('    ...(truncated)...\n');

    console.log('='.repeat(60));
    console.log('\n✅ Demo Complete!\n');
    console.log('Generated files:');
    console.log('  •', jsonldPath);
    console.log('  •', htmlPath);
    console.log('  •', `${outputDir}/output-claimreview.jsonld`);
    console.log('\n💡 Next: Use these files to publish to your CMS or website\n');
}

// Run demo
demo().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
