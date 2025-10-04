/**
 * Setup Validation Queue
 * Loads Spanberger press releases and analyzes them
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function setupValidationQueue() {
  console.log('\n🔧 Setting up Validation Queue\n');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Load press releases into queue
    console.log('1️⃣  Loading Spanberger press releases into queue...');
    const loadResponse = await fetch(`${BASE_URL}/api/validation/load-press-releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addedBy: 'setup-script' })
    });

    const loadResult = await loadResponse.json();
    console.log(`   ✓ Loaded ${loadResult.loaded} press releases\n`);

    // 2. Analyze all items
    console.log('2️⃣  Analyzing all items for issues...');
    const analyzeResponse = await fetch(`${BASE_URL}/api/validation/analyze-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const analyzeResult = await analyzeResponse.json();
    console.log(`   ✓ Analyzed ${analyzeResult.analyzed} items\n`);

    // 3. Get queue summary
    console.log('3️⃣  Queue Summary:');
    const summaryResponse = await fetch(`${BASE_URL}/api/validation/summary`);
    const summaryResult = await summaryResponse.json();

    summaryResult.summary.forEach(item => {
      console.log(`   - ${item.review_status}: ${item.count} items (avg score: ${item.avg_score?.toFixed(1) || 'N/A'}, ${item.total_issues} issues)`);
    });

    // 4. Show first item preview
    console.log('\n4️⃣  First item preview:');
    const nextResponse = await fetch(`${BASE_URL}/api/validation/next`);
    const nextResult = await nextResponse.json();

    if (nextResult.item) {
      console.log(`   Title: ${nextResult.item.title}`);
      console.log(`   Score: ${nextResult.item.overall_score}`);
      console.log(`   Issues: ${nextResult.item.issues.length}`);
      console.log(`\n   Top 3 Issues:`);

      nextResult.item.issues.slice(0, 3).forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity}] ${issue.category} - ${issue.type}`);
        console.log(`      "${issue.original_text}" → "${issue.suggested_correction || 'N/A'}"`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Validation queue setup complete!\n');
    console.log('📋 Access the review interface at:');
    console.log('   http://localhost:3001/validation-review.html\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupValidationQueue();
