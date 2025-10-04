/**
 * Script to check all Spanberger press releases for election law compliance
 */

const fs = require('fs');
const path = require('path');
const ElectionLawComplianceChecker = require('../backend/services/election-law-compliance-checker');

const checker = new ElectionLawComplianceChecker();

async function checkAllSpanbergerReleases() {
  const examplesDir = path.join(__dirname, '../cpo_examples');
  const files = fs.readdirSync(examplesDir)
    .filter(f => f.startsWith('spanberger_') && f.endsWith('.txt'))
    .sort();

  console.log(`\n${'='.repeat(80)}`);
  console.log('SPANBERGER CAMPAIGN COMPLIANCE CHECK');
  console.log('Election Law Compliance Analysis for Virginia Governor Race');
  console.log(`${'='.repeat(80)}\n`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(examplesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract title from first line
    const title = content.split('\n')[0];

    console.log(`\n📄 Checking: ${file}`);
    console.log(`   Title: ${title.substring(0, 80)}...`);

    const result = await checker.checkCompliance(content, {
      jurisdiction: 'virginia',
      communicationType: 'press_release',
      candidate: 'Abigail Spanberger',
      office: 'Governor',
      isFederalRace: false,
      medium: 'print'
    });

    results.push({
      file,
      title,
      result
    });

    console.log(`   Risk Level: ${result.riskLevel} (Score: ${result.overallRiskScore})`);
    console.log(`   Violations: ${result.violations.length}`);

    if (result.violations.length > 0) {
      result.violations.forEach((v, i) => {
        console.log(`     ${i + 1}. ${v.category}: ${v.type}`);
      });
    } else {
      console.log(`   ✓ No violations detected`);
    }
  }

  // Summary report
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('SUMMARY REPORT');
  console.log(`${'='.repeat(80)}\n`);

  const criticalCount = results.filter(r => r.result.riskLevel === 'CRITICAL').length;
  const highCount = results.filter(r => r.result.riskLevel === 'HIGH').length;
  const mediumCount = results.filter(r => r.result.riskLevel === 'MEDIUM').length;
  const lowCount = results.filter(r => r.result.riskLevel === 'LOW').length;
  const minimalCount = results.filter(r => r.result.riskLevel === 'MINIMAL').length;

  console.log(`Total Releases Checked: ${results.length}`);
  console.log(`\nRisk Level Distribution:`);
  console.log(`  CRITICAL: ${criticalCount}`);
  console.log(`  HIGH: ${highCount}`);
  console.log(`  MEDIUM: ${mediumCount}`);
  console.log(`  LOW: ${lowCount}`);
  console.log(`  MINIMAL: ${minimalCount}`);

  // Common violations
  const allViolations = {};
  results.forEach(r => {
    r.result.violations.forEach(v => {
      const key = `${v.category}: ${v.type}`;
      allViolations[key] = (allViolations[key] || 0) + 1;
    });
  });

  if (Object.keys(allViolations).length > 0) {
    console.log(`\nMost Common Violations:`);
    Object.entries(allViolations)
      .sort((a, b) => b[1] - a[1])
      .forEach(([violation, count]) => {
        console.log(`  ${violation}: ${count} occurrence(s)`);
      });
  }

  // Detailed violations
  const hasViolations = results.filter(r => r.result.violations.length > 0);
  if (hasViolations.length > 0) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('DETAILED VIOLATION REPORTS');
    console.log(`${'='.repeat(80)}\n`);

    hasViolations.forEach(({ file, title, result }) => {
      console.log(`\n📋 ${file}`);
      console.log(`   ${title}`);
      console.log(`   Risk: ${result.riskLevel} (${result.overallRiskScore})\n`);

      result.violations.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.category}: ${v.type.toUpperCase().replace(/_/g, ' ')}`);
        console.log(`      Description: ${v.description}`);
        console.log(`      Citation: ${v.regulatoryCitation}`);
        console.log(`      Penalty: ${v.penalty}`);
        console.log(`      Recommended Action: ${v.recommendedAction}`);
        console.log('');
      });
    });
  }

  // Compliant releases
  const compliant = results.filter(r => r.result.violations.length === 0);
  if (compliant.length > 0) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('COMPLIANT RELEASES (No Violations)');
    console.log(`${'='.repeat(80)}\n`);

    compliant.forEach(({ file, title }) => {
      console.log(`✓ ${file}: ${title.substring(0, 60)}...`);
    });
  }

  // Save detailed report
  const reportPath = path.join(__dirname, '../SPANBERGER-COMPLIANCE-REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\n📊 Detailed report saved to: SPANBERGER-COMPLIANCE-REPORT.json\n`);
}

checkAllSpanbergerReleases().catch(console.error);
