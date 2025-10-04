const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Test server URL
const API_URL = 'http://localhost:3001/api/press-release-parser/parse';

// Create test database
const db = new sqlite3.Database(':memory:');
const dbRun = promisify(db.run.bind(db));

async function setupTestDatabase() {
    console.log('Setting up test database...');

    // Create table
    await dbRun(`
        CREATE TABLE IF NOT EXISTS type_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            detected_type TEXT,
            detected_confidence TEXT,
            detected_score REAL,
            corrected_type TEXT NOT NULL,
            subtypes TEXT,
            issues TEXT,
            notes TEXT,
            verified_at DATETIME
        )
    `);

    // Insert test data
    await dbRun(`
        INSERT INTO type_verifications
        (filename, detected_type, detected_confidence, detected_score, corrected_type, subtypes, issues, notes, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
        'test-statement.txt',
        'NEWS_RELEASE',  // AI detected it as NEWS_RELEASE
        'medium',
        0.65,
        'STATEMENT',     // Human corrected to STATEMENT
        JSON.stringify(['response_statement']),
        JSON.stringify(['infrastructure']),
        'Corrected from NEWS_RELEASE to STATEMENT'
    ]);

    console.log('✓ Test database set up\n');
}

async function testAutoDetection() {
    console.log('TEST 1: Auto-detection (no verified data)');
    console.log('='.repeat(60));

    const text = `Senator Martinez Responds to Infrastructure Veto

WASHINGTON, D.C., October 3, 2025 — Senator Carlos Martinez released the following statement in response to today's infrastructure bill veto:

"This veto is a betrayal of American workers."

Contact: Sarah Johnson`;

    try {
        const response = await axios.post(API_URL, { text });

        console.log(`✓ API call successful`);
        console.log(`  Classification Source: ${response.data.parsed.verification_metadata.classification_source}`);
        console.log(`  Detected Type: ${response.data.parsed.verification_metadata.verified_type}`);
        console.log(`  Used Verified Data: ${response.data.used_verified_data}`);

        if (response.data.parsed.verification_metadata.classification_source === 'auto_detected') {
            console.log(`✓ PASS: Auto-detection working correctly\n`);
            return true;
        } else {
            console.log(`✗ FAIL: Expected auto_detected, got ${response.data.parsed.verification_metadata.classification_source}\n`);
            return false;
        }
    } catch (error) {
        console.error(`✗ FAIL: ${error.message}\n`);
        return false;
    }
}

async function testExplicitVerifiedData() {
    console.log('TEST 2: Explicit verified data');
    console.log('='.repeat(60));

    const text = `Governor Chen Endorses Senator Rodriguez

Governor Chen today endorsed Senator Rodriguez for re-election.`;

    const verifiedData = {
        release_type: 'NEWS_RELEASE',
        subtypes: ['endorsement'],
        issues: ['healthcare'],
        reviewed_by: 'Test User'
    };

    try {
        const response = await axios.post(API_URL, {
            text,
            verifiedData
        });

        console.log(`✓ API call successful`);
        console.log(`  Classification Source: ${response.data.parsed.verification_metadata.classification_source}`);
        console.log(`  Verified Type: ${response.data.parsed.verification_metadata.verified_type}`);
        console.log(`  Verified Subtypes: ${response.data.parsed.verification_metadata.verified_subtypes.join(', ')}`);
        console.log(`  Reviewed By: ${response.data.parsed.verification_metadata.reviewed_by}`);
        console.log(`  Used Verified Data: ${response.data.used_verified_data}`);

        // Check type-specific metadata
        if (response.data.parsed.type_specific_metadata?.endorsement) {
            console.log(`  Endorsement Metadata: Found`);
            console.log(`    Endorser: ${response.data.parsed.type_specific_metadata.endorsement.endorser?.name || 'N/A'}`);
            console.log(`    Endorsee: ${response.data.parsed.type_specific_metadata.endorsement.endorsee?.name || 'N/A'}`);
        }

        if (response.data.parsed.verification_metadata.classification_source === 'human_verified' &&
            response.data.parsed.verification_metadata.verified_type === 'NEWS_RELEASE' &&
            response.data.parsed.verification_metadata.verified_subtypes.includes('endorsement')) {
            console.log(`✓ PASS: Explicit verified data working correctly\n`);
            return true;
        } else {
            console.log(`✗ FAIL: Verified data not correctly applied\n`);
            return false;
        }
    } catch (error) {
        console.error(`✗ FAIL: ${error.message}\n`);
        if (error.response) {
            console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        return false;
    }
}

async function testTypeSpecificParsing() {
    console.log('TEST 3: Type-specific parsing with verified data');
    console.log('='.repeat(60));

    const text = `INFRASTRUCTURE INVESTMENT PLAN

KEY INVESTMENTS:
- $50 billion for roads and bridges
- $25 billion for public transit

Contact: Policy Team`;

    const verifiedData = {
        release_type: 'FACT_SHEET',
        subtypes: [],
        issues: ['infrastructure', 'economy'],
        reviewed_by: 'Test User'
    };

    try {
        const response = await axios.post(API_URL, {
            text,
            verifiedData
        });

        console.log(`✓ API call successful`);
        console.log(`  Classification Source: ${response.data.parsed.verification_metadata.classification_source}`);
        console.log(`  Verified Type: ${response.data.parsed.verification_metadata.verified_type}`);

        // Check type-specific fields
        if (response.data.parsed.sections) {
            console.log(`  Sections Found: ${response.data.parsed.sections.length}`);
        }
        if (response.data.parsed.key_figures) {
            console.log(`  Statistics Found: ${response.data.parsed.key_figures.length}`);
        }
        if (response.data.parsed.type_specific_metadata) {
            console.log(`  Type Metadata: section_count=${response.data.parsed.type_specific_metadata.section_count}, statistic_count=${response.data.parsed.type_specific_metadata.statistic_count}`);
        }

        if (response.data.parsed.verification_metadata.verified_type === 'FACT_SHEET' &&
            response.data.parsed.sections &&
            response.data.parsed.key_figures) {
            console.log(`✓ PASS: Type-specific FACT_SHEET parsing working correctly\n`);
            return true;
        } else {
            console.log(`✗ FAIL: Type-specific parsing not applied\n`);
            return false;
        }
    } catch (error) {
        console.error(`✗ FAIL: ${error.message}\n`);
        return false;
    }
}

async function runTests() {
    console.log('\n' + '='.repeat(70));
    console.log('PRESS RELEASE PARSER - VERIFIED DATA INTEGRATION TEST');
    console.log('='.repeat(70) + '\n');

    console.log('NOTE: This test requires the server to be running on port 3001\n');

    const results = [];

    // Run tests
    results.push(await testAutoDetection());
    results.push(await testExplicitVerifiedData());
    results.push(await testTypeSpecificParsing());

    // Summary
    console.log('='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`Tests Passed: ${passed}/${total}`);

    if (passed === total) {
        console.log('\n✓ ALL TESTS PASSED!\n');
        console.log('The verified data integration is working correctly:');
        console.log('  ✓ Auto-detection works when no verified data provided');
        console.log('  ✓ Explicit verified data is accepted and applied');
        console.log('  ✓ Type-specific parsing uses verified types');
        process.exit(0);
    } else {
        console.log(`\n✗ ${total - passed} TEST(S) FAILED\n`);
        process.exit(1);
    }
}

// Check if server is running before starting tests
axios.get('http://localhost:3001')
    .then(() => {
        console.log('✓ Server is running\n');
        return runTests();
    })
    .catch(error => {
        console.error('\n✗ ERROR: Server not accessible on port 3001');
        console.error('Please start the server with: node server.js\n');
        process.exit(1);
    });
