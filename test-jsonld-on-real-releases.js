/**
 * Test JSON-LD Generator on Real Press Releases
 *
 * Processes real press releases from cpo_examples/ directory
 * and validates the generated JSON-LD
 */

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const JSONLDGenerator = require('./backend/utils/jsonld-generator');
const JSONLDValidator = require('./backend/utils/jsonld-validator');

async function testReleases() {
    console.log('🧪 Testing JSON-LD Generator on Real Releases\n');
    console.log('='.repeat(70));

    const examplesDir = path.join(__dirname, 'cpo_examples');
    const outputDir = path.join(__dirname, 'test-output');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Get all .txt files from cpo_examples
    const files = fs.readdirSync(examplesDir)
        .filter(f => f.endsWith('.txt'))
        .slice(0, 10); // Test first 10

    console.log(`\nFound ${files.length} releases to test\n`);

    const parser = new PressReleaseParser();
    const generator = new JSONLDGenerator();
    const validator = new JSONLDValidator();

    const results = {
        total: files.length,
        valid: 0,
        withWarnings: 0,
        withErrors: 0,
        details: []
    };

    for (const file of files) {
        console.log(`\n${'─'.repeat(70)}`);
        console.log(`📄 Processing: ${file}`);
        console.log('─'.repeat(70));

        try {
            // Read press release
            const filePath = path.join(examplesDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Parse
            console.log('\n1️⃣  Parsing...');
            const rawParseResult = parser.parse(content);

            // Transform to generator format
            const parseResult = {
                type: rawParseResult.release_type.type,
                subtypes: rawParseResult.subtypes,
                issues: rawParseResult.issues,
                headline: rawParseResult.content_structure.headline,
                fullText: content,
                tone: rawParseResult.release_type.tone
            };

            console.log(`   ✓ Type: ${parseResult.type}`);
            console.log(`   ✓ Headline: ${parseResult.headline.substring(0, 60)}...`);
            console.log(`   ✓ Issues: ${parseResult.issues.map(i => i.issue || i).join(', ')}`);

            // Generate JSON-LD
            console.log('\n2️⃣  Generating JSON-LD...');
            const metadata = {
                slug: file.replace('.txt', ''),
                baseUrl: 'https://example.org',
                organizationName: 'Campaign Organization',
                organizationUrl: 'https://example.org',
                pressEmail: 'press@example.org',
                datePublished: new Date().toISOString().split('T')[0],
                language: 'en'
            };

            const jsonld = generator.generate(parseResult, null, metadata);
            console.log(`   ✓ Generated ${Object.keys(jsonld).length} properties`);

            // Save JSON-LD
            const jsonldPath = path.join(outputDir, `${file.replace('.txt', '')}.jsonld`);
            fs.writeFileSync(jsonldPath, JSON.stringify(jsonld, null, 2));

            // Validate
            console.log('\n3️⃣  Validating...');
            const validationResult = validator.validate(jsonld);

            if (validationResult.valid) {
                console.log('   ✅ VALID');
                results.valid++;
            } else {
                console.log('   ❌ INVALID');
                results.withErrors++;
            }

            if (validationResult.errors.length > 0) {
                console.log(`   └─ ${validationResult.errors.length} errors`);
                validationResult.errors.slice(0, 3).forEach(err => {
                    console.log(`      • ${err.field}: ${err.message}`);
                });
            }

            if (validationResult.warnings.length > 0) {
                console.log(`   └─ ${validationResult.warnings.length} warnings`);
                results.withWarnings++;
                validationResult.warnings.slice(0, 3).forEach(warn => {
                    console.log(`      ⚠️  ${warn.field}: ${warn.message}`);
                });
            }

            // Save validation report
            const reportPath = path.join(outputDir, `${file.replace('.txt', '')}.validation.txt`);
            fs.writeFileSync(reportPath, validator.generateReport(validationResult));

            // Record results
            results.details.push({
                file,
                valid: validationResult.valid,
                errorCount: validationResult.errors.length,
                warningCount: validationResult.warnings.length,
                recommendationCount: validationResult.recommendations.length,
                releaseType: parseResult.type,
                issueCount: parseResult.issues.length
            });

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            results.withErrors++;
            results.details.push({
                file,
                error: error.message
            });
        }
    }

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nTotal Releases: ${results.total}`);
    console.log(`Valid: ${results.valid} (${Math.round(results.valid / results.total * 100)}%)`);
    console.log(`With Warnings: ${results.withWarnings} (${Math.round(results.withWarnings / results.total * 100)}%)`);
    console.log(`With Errors: ${results.withErrors} (${Math.round(results.withErrors / results.total * 100)}%)`);

    // Breakdown by release type
    console.log('\n📈 By Release Type:');
    const byType = {};
    results.details.forEach(d => {
        if (d.releaseType) {
            byType[d.releaseType] = (byType[d.releaseType] || 0) + 1;
        }
    });
    Object.entries(byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
    });

    // Common issues
    console.log('\n⚠️  Common Issues:');
    const allWarnings = {};
    results.details.forEach(d => {
        if (d.warningCount > 0) {
            // Read validation file to get warnings
            const validationPath = path.join(outputDir, `${d.file.replace('.txt', '')}.validation.txt`);
            if (fs.existsSync(validationPath)) {
                const report = fs.readFileSync(validationPath, 'utf-8');
                const warningMatches = report.match(/⚠️  (.*?):/g);
                if (warningMatches) {
                    warningMatches.forEach(w => {
                        const field = w.replace('⚠️  ', '').replace(':', '').trim();
                        allWarnings[field] = (allWarnings[field] || 0) + 1;
                    });
                }
            }
        }
    });

    Object.entries(allWarnings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([field, count]) => {
            console.log(`   ${field}: ${count} releases`);
        });

    // Output locations
    console.log(`\n📁 Output Directory: ${outputDir}`);
    console.log(`   • JSON-LD files: *.jsonld`);
    console.log(`   • Validation reports: *.validation.txt`);

    // Google validator link
    console.log('\n🔗 Online Validation:');
    console.log(`   Google Rich Results: https://search.google.com/test/rich-results`);
    console.log(`   Schema.org Validator: https://validator.schema.org/`);
    console.log(`   \n   Copy any .jsonld file and paste into the validators above.`);

    console.log('\n✅ Test Complete!\n');
}

// Run test
testReleases().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
