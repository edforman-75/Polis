#!/usr/bin/env node

const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();

console.log('=== CLAIM GROUNDING / VERIFICATION SYSTEM ===\n');

// Test source credibility scoring
console.log('1. SOURCE CREDIBILITY SCORING\n');
console.log('Testing various source URLs:\n');

const testUrls = [
    'https://www.congress.gov/bill/117th-congress/house-bill/1234',
    'https://www.nytimes.com/2025/politics/senate-vote.html',
    'https://www.politico.com/news/article',
    'https://www.foxnews.com/politics/breaking-news',
    'https://www.brookings.edu/research/study',
    'https://www.factcheck.org/2025/claim-analysis',
    'https://www.random-blog.com/opinion'
];

testUrls.forEach(url => {
    const credibility = parser.scoreSourceCredibility(url);
    console.log(`${url}`);
    console.log(`  Credibility: ${(credibility.score * 100).toFixed(0)}% | Tier: ${credibility.tier} | Trusted: ${credibility.is_credible ? 'YES' : 'NO'}`);
    console.log();
});

// Test search query generation
console.log('\n2. SEARCH QUERY GENERATION\n');
console.log('From sample factual claims:\n');

const sampleClaims = [
    {
        statement: "Porter leads with 21% in the Politico poll.",
        numeric_claims: [{text: '21%', type: 'percentage', value: '21'}],
        has_attribution: false
    },
    {
        statement: "According to the CDC, COVID-19 hospitalizations increased by 15% last month.",
        numeric_claims: [{text: '15%', type: 'percentage', value: '15'}],
        has_attribution: true,
        attribution_source: 'the CDC'
    },
    {
        statement: "The bill H.R. 1234 passed with a vote of 218-210.",
        numeric_claims: [
            {text: '218', type: 'number', value: '218'},
            {text: '210', type: 'number', value: '210'}
        ],
        has_attribution: false
    }
];

sampleClaims.forEach((claim, idx) => {
    console.log(`Claim ${idx + 1}: "${claim.statement}"`);
    const queries = parser.generateSearchQueries(claim);
    console.log('Generated search queries:');
    queries.forEach((q, qIdx) => {
        console.log(`  ${qIdx + 1}. [${q.type}] "${q.query}"`);
    });
    console.log();
});

// Test content support validation
console.log('\n3. CONTENT VALIDATION\n');
console.log('Testing if source content supports claims:\n');

const testClaim = {
    statement: "Porter leads with 21% in the Politico poll.",
    numeric_claims: [{text: '21%', type: 'percentage', value: '21'}]
};

// Simulated source content that supports the claim
const supportingContent = `
Katie Porter has emerged as the frontrunner in the California Governor's race, according to
a new Politico poll released today. The poll shows Porter with 21% support among likely
Democratic voters, giving her a commanding lead over her nearest competitor. Porter's
campaign has gained significant momentum in recent weeks.
`;

// Simulated content that doesn't support the claim
const nonSupportingContent = `
The California Governor's race remains highly competitive with no clear frontrunner.
Multiple candidates are polling in the mid-teens, and the race is considered a toss-up.
Political analysts say it's too early to predict a winner.
`;

console.log('Claim: "Porter leads with 21% in the Politico poll."\n');

console.log('Testing SUPPORTING content:');
const support1 = parser.doesContentSupportClaim(testClaim, supportingContent);
console.log(`  Supported: ${support1.supported ? 'YES' : 'NO'}`);
console.log(`  Confidence: ${(support1.confidence * 100).toFixed(1)}%`);
console.log(`  Matched terms: ${support1.matched_terms.join(', ')}`);
console.log(`  Term match ratio: ${(support1.term_match_ratio * 100).toFixed(1)}%`);
console.log(`  Excerpt: "${support1.excerpt.substring(0, 150)}..."`);

console.log('\nTesting NON-SUPPORTING content:');
const support2 = parser.doesContentSupportClaim(testClaim, nonSupportingContent);
console.log(`  Supported: ${support2.supported ? 'YES' : 'NO'}`);
console.log(`  Confidence: ${(support2.confidence * 100).toFixed(1)}%`);
console.log(`  Matched terms: ${support2.matched_terms.join(', ')}`);
console.log(`  Term match ratio: ${(support2.term_match_ratio * 100).toFixed(1)}%`);

// Show how a complete verification would work
console.log('\n\n4. COMPLETE VERIFICATION WORKFLOW\n');
console.log('For claim: "Porter raised over $3 million from grassroots donors."\n');

const fundraisingClaim = {
    statement: "Porter raised over $3 million from grassroots donors.",
    type: ['statistical-claim'],
    confidence: 0.8,
    numeric_claims: [{text: '$3 million', type: 'currency', value: '3', magnitude: 'million'}],
    has_attribution: false,
    requires_verification: true
};

console.log('Step 1: Generate search queries');
const queries = parser.generateSearchQueries(fundraisingClaim);
queries.forEach((q, idx) => {
    console.log(`  ${idx + 1}. [${q.type}] "${q.query}"`);
});

console.log('\nStep 2: Execute web search (would use WebSearch tool)');
console.log('  -> Find: https://www.politico.com/news/2025/08/21/porter-fundraising');
console.log('  -> Find: https://www.apnews.com/article/porter-governor-race');
console.log('  -> Find: https://www.fec.gov/data/candidate/...');

console.log('\nStep 3: Score source credibility');
const source1 = parser.scoreSourceCredibility('https://www.politico.com/news/article');
const source2 = parser.scoreSourceCredibility('https://www.fec.gov/data/candidate');
console.log(`  politico.com: ${(source1.score * 100).toFixed(0)}% (${source1.tier})`);
console.log(`  fec.gov: ${(source2.score * 100).toFixed(0)}% (${source2.tier})`);

console.log('\nStep 4: Fetch and validate content (would use WebFetch tool)');
console.log('  -> Fetching content from each source...');
console.log('  -> Checking if content supports claim...');

console.log('\nStep 5: Return verification result');
console.log('  {');
console.log('    claim: "Porter raised over $3 million from grassroots donors.",');
console.log('    verified: true,');
console.log('    confidence: 0.85,');
console.log('    sources: [');
console.log('      {');
console.log('        url: "https://www.fec.gov/data/candidate/...",');
console.log('        credibility: 0.95,');
console.log('        credibility_tier: "federal_agencies",');
console.log('        supports_claim: true,');
console.log('        confidence: 0.9,');
console.log('        checked_at: "2025-10-02T12:00:00Z"');
console.log('      }');
console.log('    ],');
console.log('    checked_at: "2025-10-02T12:00:00Z"');
console.log('  }');

console.log('\n\n=== SUMMARY ===\n');
console.log('The claim grounding system:');
console.log('1. ✓ Generates targeted search queries from claims');
console.log('2. ✓ Scores source credibility using tier1_sources.json');
console.log('3. ✓ Validates if content supports the claim');
console.log('4. ✓ Returns verification with URL and timestamp');
console.log('\nNext step: Integrate WebSearch and WebFetch for live verification');
