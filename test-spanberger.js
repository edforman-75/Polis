/**
 * Test: Spanberger Jobs/Economy Release
 */

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const JSONLDGenerator = require('./backend/utils/jsonld-generator');
const SEOAIOAnalyzer = require('./backend/utils/seo-aio-analyzer');

async function test() {
    console.log('🎯 SPANBERGER JOBS/ECONOMY RELEASE - SEO + AIO ANALYSIS\n');
    console.log('='.repeat(70));

    const releasePath = './cpo_examples/spanberger_02_jobs_economy.txt';
    const content = fs.readFileSync(releasePath, 'utf-8');

    // Parse
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

    console.log('\n📰 PRESS RELEASE INFO:');
    console.log('─'.repeat(70));
    console.log(`Title: ${parseResult.headline}`);
    console.log(`Type: ${parseResult.type}`);
    console.log(`Subtypes: ${parseResult.subtypes.map(s => s.subtype || s).join(', ')}`);
    console.log(`Issues: ${parseResult.issues.map(i => i.issue || i).join(', ')}`);
    console.log(`Tone: ${parseResult.tone}`);
    console.log(`Word Count: ${content.split(/\s+/).length}`);

    // Generate JSON-LD
    const generator = new JSONLDGenerator();
    const metadata = {
        slug: 'spanberger-jobs-economy-data',
        baseUrl: 'https://spanbergerforvirginia.com',
        organizationName: 'Abigail Spanberger for Governor',
        organizationUrl: 'https://spanbergerforvirginia.com',
        pressEmail: 'press@spanbergerforvirginia.com',
        datePublished: '2025-10-02',
        language: 'en'
    };

    const jsonld = generator.generate(parseResult, null, metadata);

    // Analyze SEO + AIO
    const analyzer = new SEOAIOAnalyzer();
    const analysis = analyzer.analyze(content, jsonld, parseResult);

    console.log('\n');
    console.log(analyzer.generateReport());

    // Generate HTML
    const html = generator.generateHTML(jsonld, content, metadata);

    // Save outputs
    const outputDir = './spanberger-analysis';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(path.join(outputDir, 'release.jsonld'), JSON.stringify(jsonld, null, 2));
    fs.writeFileSync(path.join(outputDir, 'release.html'), html);
    fs.writeFileSync(path.join(outputDir, 'analysis.txt'), analyzer.generateReport());

    console.log('\n📁 FILES SAVED:');
    console.log(`  • ${outputDir}/release.jsonld`);
    console.log(`  • ${outputDir}/release.html`);
    console.log(`  • ${outputDir}/analysis.txt`);

    // Show some extracted facts
    console.log('\n📊 KEY DATA POINTS DETECTED:');
    console.log('─'.repeat(70));
    const numbers = content.match(/\b\d+(\,\d{3})*(\.\d+)?%?\b/g) || [];
    const uniqueNumbers = [...new Set(numbers)];
    console.log(`Numbers found: ${uniqueNumbers.slice(0, 10).join(', ')}`);

    console.log('\n💡 TOP RECOMMENDATIONS:');
    console.log('─'.repeat(70));
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical' || i.severity === 'error');
    if (criticalIssues.length > 0) {
        criticalIssues.slice(0, 3).forEach((issue, idx) => {
            console.log(`${idx + 1}. [${issue.category}] ${issue.issue}`);
            console.log(`   → ${issue.recommendation}\n`);
        });
    } else {
        console.log('✅ No critical issues! This release is well-optimized.\n');
    }

    console.log('='.repeat(70));
    console.log(`\n📈 FINAL SCORES:`);
    console.log(`   SEO:     ${analysis.scores.seo}/100 (${analysis.summary.seoGrade})`);
    console.log(`   AIO:     ${analysis.scores.aio}/100 (${analysis.summary.aioGrade})`);
    console.log(`   Overall: ${analysis.scores.overall}/100 (${analysis.summary.overallGrade})`);
    console.log(`\n   ${analysis.summary.status}`);
    console.log(`   Ready to Publish: ${analysis.summary.readyToPublish ? '✅ YES' : '⚠️  Fix critical issues first'}\n`);
}

test().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
