/**
 * Demo: API-based Validation
 *
 * Shows how to use programmatic validation with schema.org API
 */

const fs = require('fs');
const JSONLDValidator = require('./backend/utils/jsonld-validator');

async function demo() {
    console.log('🔌 API Validation Demo\n');
    console.log('='.repeat(70));

    // Load a generated JSON-LD file
    const jsonldPath = './test-output/booker_01_shutdown.jsonld';
    console.log(`\n📄 Loading: ${jsonldPath}\n`);

    const jsonld = JSON.parse(fs.readFileSync(jsonldPath, 'utf-8'));

    const validator = new JSONLDValidator();

    // Test 1: Local AJV validation (fast)
    console.log('1️⃣  LOCAL VALIDATION (AJV)');
    console.log('─'.repeat(70));
    const ajvResult = validator.validate(jsonld);
    console.log(validator.generateReport(ajvResult));

    // Test 2: Schema.org API validation (requires network)
    console.log('\n2️⃣  SCHEMA.ORG API VALIDATION');
    console.log('─'.repeat(70));
    console.log('Attempting to validate with schema.org API...\n');

    const schemaOrgResult = await validator.validateWithSchemaOrg(jsonld);

    if (schemaOrgResult.success) {
        console.log('✅ Schema.org API validation successful!');
        console.log('Note:', schemaOrgResult.note);
        console.log('\nResponse:', JSON.stringify(schemaOrgResult.schemaOrgResult, null, 2).substring(0, 500) + '...');
    } else {
        console.log('❌ Schema.org API validation failed');
        console.log('Error:', schemaOrgResult.error);
        console.log('Note:', schemaOrgResult.note);
    }

    // Test 3: Comprehensive validation
    console.log('\n\n3️⃣  COMPREHENSIVE VALIDATION');
    console.log('─'.repeat(70));
    console.log('Running both validators...\n');

    const comprehensiveResult = await validator.validateComprehensive(jsonld, {
        useSchemaOrg: true
    });

    console.log('SUMMARY:');
    console.log('  AJV Valid:', comprehensiveResult.summary.ajvValid ? '✅' : '❌');
    console.log('  Schema.org Valid:',
        comprehensiveResult.summary.schemaOrgValid === null ? '⏭️  Skipped' :
        comprehensiveResult.summary.schemaOrgValid ? '✅' : '❌'
    );
    console.log('  All Valid:', comprehensiveResult.summary.allValid ? '✅' : '❌');
    console.log('  Total Errors:', comprehensiveResult.summary.totalErrors);
    console.log('  Total Warnings:', comprehensiveResult.summary.totalWarnings);

    console.log('\n' + '='.repeat(70));
    console.log('\n📋 VALIDATION METHODS AVAILABLE:\n');
    console.log('1. ✅ AJV (Local) - Fast, always available, CPO-aware');
    console.log('2. ⚠️  Schema.org API - Unofficial, may be rate-limited');
    console.log('3. ❌ Google Rich Results - No public API (web UI only)');
    console.log('\n💡 RECOMMENDATION:');
    console.log('   Use AJV for automated testing (100% reliable)');
    console.log('   Use web UI for final Google-specific checks:');
    console.log('   https://search.google.com/test/rich-results\n');
}

demo().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
