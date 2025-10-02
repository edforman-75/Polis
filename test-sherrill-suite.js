const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

console.log('='.repeat(80));
console.log('SHERRILL PRESS RELEASE PARSING TEST SUITE');
console.log('='.repeat(80));
console.log();

const files = [
  'sherrill_01_trump_funding.txt',
  'sherrill_02_lt_gov_debate.txt',
  'sherrill_03_tax_returns.txt',
  'sherrill_04_utility_emergency.txt',
  'sherrill_05_pcm_endorse.txt'
];

files.forEach((filename, index) => {
  const filePath = path.join(__dirname, 'cpo_examples', filename);
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST ${index + 1}: ${filename}`);
  console.log('='.repeat(80));

  const parser = new PressReleaseParser();
  const result = parser.parse(content);

  // Show basic structure
  console.log('\n📋 BASIC INFO:');
  console.log(`   Headline: ${result.content_structure.headline || 'NOT FOUND'}`);
  console.log(`   Subheadline: ${result.content_structure.subhead || 'NOT FOUND'}`);
  console.log(`   Date: ${result.content_structure.dateline.date || 'NOT FOUND'}`);
  console.log(`   Location: ${result.content_structure.dateline.location || 'NOT FOUND'}`);
  console.log(`   Dateline confidence: ${result.content_structure.dateline.confidence || 'none'}`);
  console.log(`   Word count: ${result.metadata.word_count}`);

  // Show paragraphs
  console.log('\n📝 PARAGRAPHS:');
  console.log(`   Lead paragraph: ${result.content_structure.lead_paragraph.substring(0, 80)}...`);
  console.log(`   Body paragraphs: ${result.content_structure.body_paragraphs.length}`);
  console.log(`   Total paragraphs: ${result.content_structure.total_paragraphs}`);

  // Show quotes
  console.log('\n💬 QUOTES:');
  if (result.quotes && result.quotes.length > 0) {
    console.log(`   Total quotes: ${result.quotes.length}`);
    result.quotes.forEach((quote, i) => {
      const preview = (quote.quote_text || '').substring(0, 80);
      const speaker = quote.speaker_name || 'UNKNOWN';
      console.log(`   ${i + 1}. [${speaker}]: "${preview}..."`);
    });
  } else {
    console.log('   ❌ No quotes found');
  }

  // Show issues
  if (result.content_structure.dateline.issues && result.content_structure.dateline.issues.length > 0) {
    console.log('\n⚠️  DATELINE ISSUES:');
    result.content_structure.dateline.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }

  console.log();
});

console.log('='.repeat(80));
console.log('TEST SUITE COMPLETE');
console.log('='.repeat(80));
