/**
 * Test Grammar Learning System
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testLearningSystem() {
  console.log('\n🧪 Testing Grammar Learning System\n');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Test terminology check
    console.log('1️⃣  Testing Custom Terminology Check...');
    const testText = `
      Winsome Earl-Sears announced today that the Trump Administration will
      implement DOGE. Abigail Spanberg supports the commonwealth.
    `;

    const response = await fetch(`${BASE_URL}/api/grammar-style/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText })
    });

    const result = await response.json();

    console.log(`   ✓ Grammar check completed`);
    console.log(`   Score: ${result.overallScore}`);
    console.log(`   Total Issues: ${result.issueCount}`);

    const customTermIssues = result.issues.filter(i => i.isCustomTerm);
    console.log(`   Custom Term Issues: ${customTermIssues.length}\n`);

    if (customTermIssues.length > 0) {
      console.log('   Custom Term Issues Found:');
      customTermIssues.forEach(issue => {
        console.log(`   - ${issue.message}`);
        console.log(`     Found: "${issue.context.text.substring(issue.context.highlightStart, issue.context.highlightStart + issue.context.highlightLength)}"`);
        console.log(`     Should be: "${issue.correction}"\n`);
      });
    }

    // 2. Test recording feedback
    console.log('\n2️⃣  Testing Feedback Recording...');

    if (customTermIssues.length > 0) {
      const feedbackResponse = await fetch(`${BASE_URL}/api/grammar-learning/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: customTermIssues[0].ruleId,
          category: customTermIssues[0].category,
          issueType: customTermIssues[0].type,
          originalText: customTermIssues[0].context.text.substring(
            customTermIssues[0].context.highlightStart,
            customTermIssues[0].context.highlightStart + customTermIssues[0].context.highlightLength
          ),
          suggestedCorrection: customTermIssues[0].correction,
          contextBefore: customTermIssues[0].context.text.substring(0, customTermIssues[0].context.highlightStart),
          contextAfter: customTermIssues[0].context.text.substring(
            customTermIssues[0].context.highlightStart + customTermIssues[0].context.highlightLength
          ),
          fullSentence: 'Test sentence',
          userAction: 'accepted',
          userId: 'test-user'
        })
      });

      const feedbackResult = await feedbackResponse.json();
      console.log(`   ✓ Feedback recorded: ID ${feedbackResult.feedbackId}\n`);
    }

    // 3. Test getting stats
    console.log('3️⃣  Testing Feedback Stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/grammar-learning/stats`);
    const statsResult = await statsResponse.json();
    console.log(`   ✓ Stats retrieved: ${statsResult.stats.length} records\n`);

    // 4. Test custom terminology list
    console.log('4️⃣  Testing Custom Terminology List...');
    const termsResponse = await fetch(`${BASE_URL}/api/grammar-learning/terminology`);
    const termsResult = await termsResponse.json();
    console.log(`   ✓ Custom terms: ${termsResult.count}`);

    termsResult.terms.forEach(term => {
      console.log(`     - ${term.correct_form} (${term.term_type})`);
      if (term.commonMisspellings.length > 0) {
        console.log(`       Common misspellings: ${term.commonMisspellings.join(', ')}`);
      }
    });

    // 5. Test pending clusters
    console.log('\n5️⃣  Testing Pending Clusters...');
    const clustersResponse = await fetch(`${BASE_URL}/api/grammar-learning/clusters/pending`);
    const clustersResult = await clustersResponse.json();
    console.log(`   ✓ Pending clusters: ${clustersResult.count}\n`);

    console.log('='.repeat(80));
    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testLearningSystem();
