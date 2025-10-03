#!/usr/bin/env node

/**
 * Test live claim verification using web search
 *
 * This demonstrates the groundClaim() method with real web fetching.
 * For production use, integrate with a search API (Google, Bing, etc.)
 */

const PressReleaseParser = require('./backend/utils/press-release-parser');
const https = require('https');
const http = require('http');

const parser = new PressReleaseParser();

// Helper to fetch URL content
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FactChecker/1.0)'
            }
        }, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// Simulated web search (in production, use Google Custom Search API, Bing API, etc.)
async function webSearch(query) {
    console.log(`🔍 Searching: "${query}"`);

    // For demonstration, return known URLs based on query keywords
    // In production, this would call a real search API

    if (query.includes('site:cbo.gov') || query.includes('Congressional Budget Office')) {
        return [
            {
                url: 'https://www.cbo.gov/topics/taxes',
                title: 'Taxes | Congressional Budget Office',
                snippet: 'CBO analyzes federal tax policies and estimates their effects...'
            }
        ];
    }

    if (query.includes('site:politico.com')) {
        return [
            {
                url: 'https://www.politico.com/news/2024/budget',
                title: 'Budget News - POLITICO',
                snippet: 'Latest news on federal budget and fiscal policy...'
            }
        ];
    }

    // Generic fallback
    return [
        {
            url: 'https://www.congress.gov/',
            title: 'Congress.gov | Library of Congress',
            snippet: 'Official source for federal legislative information'
        }
    ];
}

// Web fetch with content extraction
async function webFetch(url, prompt) {
    console.log(`📄 Fetching: ${url}`);

    try {
        const html = await fetchUrl(url);

        // Simple text extraction (strip HTML tags)
        const text = html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Return first 5000 characters for analysis
        return text.substring(0, 5000);

    } catch (error) {
        throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
}

// Test claims
const testText = `
According to the Congressional Budget Office, taxes will increase by 15% under the new plan.
The bill passed on September 15, 2025 with a vote of 218-210.
Politico reports that the federal deficit will reach $2 trillion this year.
`;

async function runTest() {
    console.log('=== LIVE CLAIM VERIFICATION TEST ===\n');
    console.log('Input text:', testText);
    console.log('\n' + '='.repeat(80) + '\n');

    // Extract claims
    const claims = parser.extractProvableFacts(testText);

    console.log(`Found ${claims.length} factual claims to verify:\n`);

    // Test verification on first claim
    const claimToVerify = claims.find(c => c.has_attribution);

    if (!claimToVerify) {
        console.log('No attributed claims found for verification');
        return;
    }

    console.log('CLAIM TO VERIFY:');
    console.log(`  Statement: "${claimToVerify.statement}"`);
    console.log(`  Attribution: ${claimToVerify.attribution_source}`);
    console.log(`  Confidence: ${(claimToVerify.confidence * 100).toFixed(0)}%`);
    console.log();

    // Map attribution to domain
    const domain = parser.mapAttributionToDomain(claimToVerify.attribution_source);
    console.log(`📍 Mapped attribution "${claimToVerify.attribution_source}" → ${domain || 'no specific domain'}`);
    console.log();

    try {
        console.log('🚀 Starting verification process...\n');

        const verification = await parser.groundClaim(claimToVerify, {
            webSearch,
            webFetch,
            maxResults: 2
        });

        console.log('\n' + '='.repeat(80));
        console.log('VERIFICATION RESULT:');
        console.log('='.repeat(80));
        console.log();
        console.log(`✅ Verified: ${verification.verified ? 'YES' : 'NO'}`);
        console.log(`📊 Confidence: ${(verification.confidence * 100).toFixed(1)}%`);
        console.log(`🔎 Query Used: "${verification.query}"`);
        console.log(`📌 Reason: ${verification.reason || 'verification_complete'}`);
        console.log(`💬 Message: ${verification.message || 'Claim verified successfully'}`);

        if (verification.source_url) {
            console.log();
            console.log(`🔗 Source URL: ${verification.source_url}`);
            console.log(`🌐 Domain: ${verification.source_domain}`);
            console.log(`⭐ Source Credibility: ${(verification.source_credibility * 100).toFixed(0)}%`);
            console.log(`📝 Tier: ${verification.source_tier}`);
        }

        if (verification.excerpt) {
            console.log();
            console.log('📄 Excerpt:');
            console.log(`   "${verification.excerpt.substring(0, 200)}..."`);
        }

        if (verification.matched_terms && verification.matched_terms.length > 0) {
            console.log();
            console.log(`🎯 Matched Terms: ${verification.matched_terms.join(', ')}`);
        }

        if (verification.all_attempts) {
            console.log();
            console.log(`🔄 Total Verification Attempts: ${verification.all_attempts.length}`);
            verification.all_attempts.forEach((attempt, idx) => {
                console.log(`   ${idx + 1}. ${attempt.domain || attempt.url}`);
                if (attempt.error) {
                    console.log(`      ❌ Error: ${attempt.error}`);
                } else {
                    console.log(`      Credibility: ${(attempt.credibility_score * 100).toFixed(0)}%, Match: ${attempt.content_match ? 'YES' : 'NO'} (${(attempt.match_confidence * 100).toFixed(0)}%)`);
                }
            });
        }

        if (verification.verified_at) {
            console.log();
            console.log(`🕐 Verified At: ${verification.verified_at}`);
        }

    } catch (error) {
        console.error('\n❌ Verification Error:', error.message);
        console.error(error.stack);
    }
}

// Run the test
runTest().catch(console.error);
