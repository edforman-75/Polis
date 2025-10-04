/**
 * Setup Unified Validation Queue
 * Loads all Spanberger releases and runs all validators
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function setupUnifiedValidation() {
  console.log('\n🔧 Setting up Unified Validation Queue\n');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Load press releases
    console.log('1️⃣  Loading Spanberger press releases...');
    const loadResponse = await fetch(`${BASE_URL}/api/unified-validation/load-releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directory: './cpo_examples', added_by: 'setup-script' })
    });

    const loadResult = await loadResponse.json();
    console.log(`   ✓ ${loadResult.message}\n`);

    // 2. Analyze all items with all validators
    console.log('2️⃣  Analyzing all items with validators (Grammar + Compliance)...');
    const analyzeResponse = await fetch(`${BASE_URL}/api/unified-validation/analyze-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validators: ['grammar', 'compliance'] })
    });

    const analyzeResult = await analyzeResponse.json();
    console.log(`   ✓ ${analyzeResult.message}\n`);

    // 3. Get queue summary
    console.log('3️⃣  Queue Summary:\n');
    const summaryResponse = await fetch(`${BASE_URL}/api/unified-validation/summary`);
    const summaryResult = await summaryResponse.json();

    summaryResult.summary.forEach(item => {
      console.log(`   ${item.review_status.toUpperCase()}:`);
      console.log(`      Items: ${item.count}`);
      console.log(`      Avg Score: ${item.avg_score?.toFixed(1) || 'N/A'}`);
      console.log(`      Total Issues: ${item.total_issues || 0}`);
      console.log(`      Critical Issues: ${item.critical_issues || 0}\n`);
    });

    // 4. Get validator breakdowns
    console.log('4️⃣  Validator Summaries:\n');

    for (const validator of ['grammar', 'compliance']) {
      const validatorResponse = await fetch(`${BASE_URL}/api/unified-validation/summary/${validator}`);
      const validatorResult = await validatorResponse.json();

      console.log(`   ${validator.toUpperCase()}:`);
      validatorResult.summary.forEach(item => {
        console.log(`      ${item.status}: ${item.count} items (avg: ${item.avg_score?.toFixed(1) || 'N/A'})`);
      });
      console.log();
    }

    // 5. Show first pending item
    console.log('5️⃣  First pending item preview:\n');
    const nextResponse = await fetch(`${BASE_URL}/api/unified-validation/next`);
    const nextResult = await nextResponse.json();

    if (nextResult.item) {
      console.log(`   Title: ${nextResult.item.title}`);
      console.log(`   Overall Score: ${nextResult.item.overall_score?.toFixed(1)}`);
      console.log(`   Total Issues: ${nextResult.item.total_issues}`);
      console.log(`   Critical Issues: ${nextResult.item.critical_issues}\n`);

      console.log(`   Scores:`);
      console.log(`      Grammar: ${nextResult.item.grammar_score?.toFixed(1) || 'N/A'}`);
      console.log(`      Compliance: ${nextResult.item.compliance_score?.toFixed(1) || 'N/A'}`);
      console.log(`      Tone: ${nextResult.item.tone_score?.toFixed(1) || 'N/A'}`);
      console.log(`      Fact-Check: ${nextResult.item.fact_check_score?.toFixed(1) || 'N/A'}\n`);

      if (nextResult.item.issues && nextResult.item.issues.length > 0) {
        console.log(`   Sample Issues (showing first 3):\n`);
        nextResult.item.issues.slice(0, 3).forEach((issue, i) => {
          console.log(`   ${i + 1}. [${issue.validator_type}] ${issue.severity.toUpperCase()}: ${issue.category}`);
          console.log(`      "${issue.original_text?.substring(0, 60)}..."`);
          if (issue.suggested_correction) {
            console.log(`      → "${issue.suggested_correction.substring(0, 60)}..."`);
          }
          console.log();
        });
      }
    }

    console.log('='.repeat(80));
    console.log('\n✅ Unified Validation Queue Setup Complete!\n');
    console.log('📋 Access the unified review interface at:');
    console.log('   http://localhost:3001/unified-validator-review.html\n');
    console.log('📊 All validators running:');
    console.log('   ✓ Grammar & AP Style Checker');
    console.log('   ✓ Election Law Compliance Checker');
    console.log('   ✓ Tone Analysis (placeholder)');
    console.log('   ✓ Fact-Checking (placeholder)\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setupUnifiedValidation();
