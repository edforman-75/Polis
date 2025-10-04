/**
 * Script to check Spanberger press releases for grammar and AP Style
 */

const fs = require('fs');
const path = require('path');
const GrammarStyleChecker = require('../backend/services/grammar-style-checker');

const checker = new GrammarStyleChecker();

async function checkSpanbergerGrammar() {
  const examplesDir = path.join(__dirname, '../cpo_examples');
  const files = fs.readdirSync(examplesDir)
    .filter(f => f.startsWith('spanberger_') && f.endsWith('.txt'))
    .sort()
    .slice(0, 3); // Test first 3

  console.log(`\n${'='.repeat(80)}`);
  console.log('SPANBERGER GRAMMAR & AP STYLE CHECK');
  console.log(`${'='.repeat(80)}\n`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(examplesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = content.split('\n')[0];

    console.log(`\n📄 Checking: ${file}`);
    console.log(`   Title: ${title.substring(0, 70)}...`);

    const result = await checker.checkContent(content, {
      checkGrammar: true,
      checkAPStyle: true,
      checkCampaignStyle: true,
      checkClarity: true
    });

    results.push({ file, title, result });

    console.log(`   Overall Score: ${result.overallScore} (${result.summary.overallGrade})`);
    console.log(`   Total Issues: ${result.summary.totalIssues}`);
    console.log(`     Errors: ${result.summary.bySeverity.error}`);
    console.log(`     Warnings: ${result.summary.bySeverity.warning}`);
    console.log(`     Suggestions: ${result.summary.bySeverity.suggestion}`);

    if (result.summary.topIssues.length > 0) {
      console.log(`\n   Top Issues:`);
      result.summary.topIssues.forEach((issue, i) => {
        console.log(`     ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.message.substring(0, 60)}...`);
      });
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const avgScore = Math.round(results.reduce((sum, r) => sum + r.result.overallScore, 0) / results.length);
  const totalIssues = results.reduce((sum, r) => sum + r.result.summary.totalIssues, 0);

  console.log(`Average Score: ${avgScore}`);
  console.log(`Total Issues Found: ${totalIssues}`);

  const allIssueTypes = {};
  results.forEach(r => {
    r.result.issues.forEach(issue => {
      const key = `${issue.category}: ${issue.type}`;
      allIssueTypes[key] = (allIssueTypes[key] || 0) + 1;
    });
  });

  console.log(`\nMost Common Issues:`);
  Object.entries(allIssueTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  console.log(`\n\n`);
}

checkSpanbergerGrammar().catch(console.error);
