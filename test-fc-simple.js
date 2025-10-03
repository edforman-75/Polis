const db = require('./backend/database/init');

async function testDatabase() {
    console.log('🧪 Testing Fact-Checking Database\n');

    await db.database.initialize();

    // Test 1: Check claim_types
    console.log('1️⃣  Checking claim_types table');
    const types = await db.database.all('SELECT * FROM claim_types');
    console.log(`   ✅ Found ${types.length} claim types:`);
    types.forEach(type => {
        console.log(`      - ${type.type_name}: ${type.verification_approach}`);
    });
    console.log('');

    // Test 2: Check fact_checks
    console.log('2️⃣  Checking fact_checks table');
    const factChecks = await db.database.all('SELECT id, status, LENGTH(content) as len FROM fact_checks');
    console.log(`   ✅ Found ${factChecks.length} fact-checks:`);
    factChecks.forEach(fc => {
        console.log(`      - ${fc.id}: ${fc.status} (${fc.len} chars)`);
    });
    console.log('');

    // Test 3: Check extracted_claims
    console.log('3️⃣  Checking extracted_claims table');
    const claims = await db.database.all(`
        SELECT id, fact_check_id, claim_type, status,
               SUBSTR(claim_text, 1, 50) as claim_preview
        FROM extracted_claims
    `);
    console.log(`   ✅ Found ${claims.length} extracted claims:`);
    claims.forEach(claim => {
        console.log(`      - [${claim.claim_type}] ${claim.claim_preview}... (${claim.status})`);
    });
    console.log('');

    // Test 4: Check claim_verifications
    console.log('4️⃣  Checking claim_verifications table');
    const verifications = await db.database.all(`
        SELECT cv.*, ec.claim_type
        FROM claim_verifications cv
        JOIN extracted_claims ec ON cv.claim_id = ec.id
    `);
    console.log(`   ✅ Found ${verifications.length} verifications:`);
    verifications.forEach(v => {
        console.log(`      - Claim ${v.claim_id} (${v.claim_type}): ${v.verification_status} - ${v.rating || 'N/A'}`);
    });
    console.log('');

    // Test 5: Check verification_sources
    console.log('5️⃣  Checking verification_sources table');
    const sources = await db.database.all(`
        SELECT id, verification_id, domain, credibility_tier, supports_claim
        FROM verification_sources
    `);
    console.log(`   ✅ Found ${sources.length} verification sources:`);
    sources.forEach(s => {
        console.log(`      - ${s.domain} (${s.credibility_tier}): ${s.supports_claim ? 'Supports' : 'Disputes'}`);
    });
    console.log('');

    console.log('✅ All database tests passed!\n');
    process.exit(0);
}

testDatabase().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
