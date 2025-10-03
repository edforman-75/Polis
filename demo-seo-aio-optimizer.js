/**
 * Demo: SEO + AIO Optimization
 *
 * Complete demonstration of SEO and AIO optimization for press releases
 */

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const JSONLDGenerator = require('./backend/utils/jsonld-generator');
const SEOAIOAnalyzer = require('./backend/utils/seo-aio-analyzer');

async function demo() {
    console.log('🚀 SEO + AIO Optimization Demo\n');
    console.log('='.repeat(70));

    // Load a real press release
    const releasePath = './cpo_examples/booker_01_shutdown.txt';
    console.log(`\n📄 Analyzing: ${releasePath}\n`);

    const content = fs.readFileSync(releasePath, 'utf-8');

    // Step 1: Parse
    console.log('1️⃣  PARSING PRESS RELEASE');
    console.log('─'.repeat(70));
    const parser = new PressReleaseParser();
    const rawParseResult = parser.parse(content);

    const parseResult = {
        type: rawParseResult.release_type.type,
        subtypes: rawParseResult.subtypes,
        issues: rawParseResult.issues,
        headline: rawParseResult.content_structure.headline,
        fullText: content,
        tone: rawParseResult.release_type.tone
    };

    console.log(`Type: ${parseResult.type}`);
    console.log(`Headline: ${parseResult.headline}`);
    console.log(`Issues: ${parseResult.issues.map(i => i.issue || i).join(', ')}\n`);

    // Step 2: Generate JSON-LD
    console.log('2️⃣  GENERATING JSON-LD WITH SEO META TAGS');
    console.log('─'.repeat(70));
    const generator = new JSONLDGenerator();
    const metadata = {
        slug: 'booker-shutdown-statement',
        baseUrl: 'https://booker.senate.gov',
        organizationName: 'Office of Senator Cory Booker',
        organizationUrl: 'https://booker.senate.gov',
        pressEmail: 'press@booker.senate.gov',
        datePublished: '2025-10-01',
        language: 'en'
    };

    const jsonld = generator.generate(parseResult, null, metadata);
    console.log(`✓ Generated JSON-LD with ${Object.keys(jsonld).length} properties`);

    const html = generator.generateHTML(jsonld, content, metadata);
    console.log(`✓ Generated HTML with comprehensive SEO meta tags\n`);

    // Step 3: SEO + AIO Analysis
    console.log('3️⃣  SEO + AIO OPTIMIZATION ANALYSIS');
    console.log('─'.repeat(70));
    const analyzer = new SEOAIOAnalyzer();
    const analysis = analyzer.analyze(content, jsonld, parseResult);

    console.log(analyzer.generateReport());

    // Step 4: Save outputs
    console.log('4️⃣  SAVING OUTPUTS');
    console.log('─'.repeat(70));
    const outputDir = path.join(__dirname, 'seo-aio-output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Save JSON-LD
    const jsonldPath = path.join(outputDir, 'optimized-release.jsonld');
    fs.writeFileSync(jsonldPath, JSON.stringify(jsonld, null, 2));
    console.log(`✓ Saved JSON-LD: ${jsonldPath}`);

    // Save HTML with full SEO meta tags
    const htmlPath = path.join(outputDir, 'optimized-release.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`✓ Saved HTML: ${htmlPath}`);

    // Save analysis report
    const reportPath = path.join(outputDir, 'seo-aio-report.txt');
    fs.writeFileSync(reportPath, analyzer.generateReport());
    console.log(`✓ Saved Analysis: ${reportPath}\n`);

    // Step 5: Show HTML meta tags sample
    console.log('5️⃣  SAMPLE SEO META TAGS');
    console.log('─'.repeat(70));
    const metaTagsSection = html.match(/<head>([\s\S]*?)<\/head>/)[1];
    const metaTags = metaTagsSection.match(/<meta[^>]*>/g) || [];

    console.log('\nFirst 10 meta tags generated:\n');
    metaTags.slice(0, 10).forEach(tag => {
        console.log(tag);
    });
    console.log(`\n... and ${metaTags.length - 10} more\n`);

    // Step 6: Recommendations
    console.log('6️⃣  KEY RECOMMENDATIONS');
    console.log('─'.repeat(70));
    const topRecs = analysis.recommendations.slice(0, 5);
    if (topRecs.length > 0) {
        topRecs.forEach((rec, idx) => {
            console.log(`${idx + 1}. ${rec}`);
        });
    } else {
        console.log('✅ No critical recommendations - content is well-optimized!');
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n✨ OPTIMIZATION COMPLETE!\n');
    console.log('Your press release now includes:');
    console.log('  ✅ Valid JSON-LD structured data');
    console.log('  ✅ Comprehensive SEO meta tags (title, description, keywords)');
    console.log('  ✅ Open Graph tags (Facebook, LinkedIn)');
    console.log('  ✅ Twitter Card tags');
    console.log('  ✅ Canonical URL');
    console.log('  ✅ AIO-optimized structured claims');
    console.log('\nScores:');
    console.log(`  SEO: ${analysis.scores.seo}/100 (${analysis.summary.seoGrade})`);
    console.log(`  AIO: ${analysis.scores.aio}/100 (${analysis.summary.aioGrade})`);
    console.log(`  Overall: ${analysis.scores.overall}/100 (${analysis.summary.overallGrade})`);
    console.log(`\n  Status: ${analysis.summary.status}`);
    console.log(`  Ready to Publish: ${analysis.summary.readyToPublish ? '✅ YES' : '❌ NO - Address critical issues first'}\n`);

    console.log('Files generated in:', outputDir);
    console.log('  • optimized-release.jsonld - Structured data');
    console.log('  • optimized-release.html - Publication-ready HTML');
    console.log('  • seo-aio-report.txt - Full analysis report\n');
}

demo().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
