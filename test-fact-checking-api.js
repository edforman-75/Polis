#!/usr/bin/env node

/**
 * Test script for fact-checking API endpoints
 */

const baseUrl = 'http://localhost:3001/api/fact-checking';
const authUrl = 'http://localhost:3001/api/auth';

async function login() {
    console.log('🔐 Logging in...');
    const response = await fetch(`${authUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'researcher@campaign.com',
            password: 'demo123'
        })
    });

    const data = await response.json();
    if (!data.token) {
        throw new Error('Login failed');
    }
    console.log('✅ Logged in successfully\n');
    return data.token;
}

async function testEndpoints() {
    console.log('🧪 Testing Fact-Checking API Endpoints\n');

    try {
        // Login first
        const token = await login();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        // Test 1: Get all pending fact-checks
        console.log('1️⃣  Testing GET /api/fact-checking/pending/all');
        const pendingResponse = await fetch(`${baseUrl}/pending/all`, { headers });
        const pendingData = await pendingResponse.json();
        console.log(`   ✅ Found ${pendingData.length} pending fact-checks`);
        console.log(`   Sample:`, pendingData[0]);
        console.log('');

        // Test 2: Get claim types
        console.log('2️⃣  Testing GET /api/fact-checking/meta/claim-types');
        const typesResponse = await fetch(`${baseUrl}/meta/claim-types`, { headers });
        const typesData = await typesResponse.json();
        console.log(`   ✅ Found ${typesData.length} claim types:`);
        typesData.forEach(type => {
            console.log(`      - ${type.type_name}: ${type.verification_approach}`);
        });
        console.log('');

        // Test 3: Get specific fact-check with claims
        console.log('3️⃣  Testing GET /api/fact-checking/:id');
        const factCheckId = 'FC-2025-001';
        const detailResponse = await fetch(`${baseUrl}/${factCheckId}`, { headers });
        const detailData = await detailResponse.json();
        console.log(`   ✅ Retrieved fact-check ${factCheckId}`);
        console.log(`   Claims: ${detailData.claims.length}`);
        detailData.claims.forEach((claim, i) => {
            console.log(`   ${i + 1}. [${claim.claim_type}] ${claim.claim_text.substring(0, 60)}...`);
            console.log(`      Verifiable: ${claim.verifiable}, Status: ${claim.status}`);
            if (claim.verifications && claim.verifications.length > 0) {
                console.log(`      Verifications: ${claim.verifications.length}`);
            }
        });
        console.log('');

        // Test 4: Create a new fact-check
        console.log('4️⃣  Testing POST /api/fact-checking/create');
        const createResponse = await fetch(`${baseUrl}/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                content: 'The economy has grown by 3% this quarter according to the Bureau of Economic Analysis. Everyone agrees this is unprecedented growth.',
                assignmentId: null
            })
        });
        const createData = await createResponse.json();
        console.log(`   ✅ Created fact-check: ${createData.factCheckId}`);
        const newFactCheckId = createData.factCheckId;
        console.log('');

        // Test 5: Extract claims from the new fact-check
        console.log('5️⃣  Testing POST /api/fact-checking/:id/extract-claims');
        const extractResponse = await fetch(`${baseUrl}/${newFactCheckId}/extract-claims`, {
            method: 'POST',
            headers
        });
        const extractData = await extractResponse.json();
        console.log(`   ✅ Extracted ${extractData.claimsExtracted} claims`);
        extractData.claims.forEach((claim, i) => {
            console.log(`   ${i + 1}. [${claim.claimType}] ${claim.text.substring(0, 60)}...`);
        });
        console.log('');

        // Test 6: Update fact-check status
        console.log('6️⃣  Testing PATCH /api/fact-checking/:id');
        const updateResponse = await fetch(`${baseUrl}/${newFactCheckId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                status: 'in_progress',
                assignedTo: 11
            })
        });
        const updateData = await updateResponse.json();
        console.log(`   ✅ Updated fact-check status:`, updateData);
        console.log('');

        // Test 7: Verify a claim (using a claim from the existing fact-check)
        console.log('7️⃣  Testing POST /api/fact-checking/:factCheckId/claims/:claimId/verify');
        const verifyResponse = await fetch(`${baseUrl}/${factCheckId}/claims/2/verify`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                status: 'verified_true',
                rating: 'true',
                notes: 'Confirmed via FBI UCR data',
                method: 'manual_source_check',
                timeSpent: 300,
                sources: [
                    {
                        url: 'https://ucr.fbi.gov/crime-in-the-u.s/2024/preliminary',
                        domain: 'fbi.gov',
                        title: 'FBI Uniform Crime Report 2024',
                        credibilityTier: 'federal_government',
                        credibilityScore: 1.0,
                        supportsClaim: true,
                        relevanceScore: 0.95,
                        excerpt: 'Crime decreased 15.2% in the district'
                    }
                ]
            })
        });
        const verifyData = await verifyResponse.json();
        console.log(`   ✅ Claim verified:`, verifyData);
        console.log('');

        console.log('✅ All API endpoint tests passed!\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    }
}

// Run tests
testEndpoints();
