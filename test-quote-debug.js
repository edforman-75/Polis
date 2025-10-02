const fs = require('fs');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const content = fs.readFileSync('cpo_examples/sherrill_07_gateway_trump.txt', 'utf-8');
const parser = new PressReleaseParser();

// First get the headline and subhead
const result = parser.parse(content);

console.log('='.repeat(80));
console.log('QUOTE EXTRACTION DEBUG');
console.log('='.repeat(80));
console.log();
console.log('Headline:', result.content_structure.headline);
console.log('Subhead:', result.content_structure.subhead);
console.log();
console.log('='.repeat(80));
console.log('QUOTES EXTRACTED:');
console.log('='.repeat(80));
console.log();

result.quotes.forEach((quote, i) => {
  console.log(`Quote ${i + 1}:`);
  console.log(`  Speaker: ${quote.speaker_name || 'UNKNOWN'}`);
  console.log(`  Title: ${quote.speaker_title || 'none'}`);
  console.log(`  Text (first 200 chars): "${quote.quote_text.substring(0, 200)}..."`);
  console.log(`  Text (last 50 chars): "...${quote.quote_text.substring(quote.quote_text.length - 50)}"`);
  console.log(`  Full length: ${quote.quote_text.length} characters`);
  console.log();
});

// Now let's find all quote marks in the text manually
console.log('='.repeat(80));
console.log('ALL QUOTED TEXT IN SOURCE:');
console.log('='.repeat(80));
console.log();

const quotePattern = /[""]([^""]+)[""]/g;
let match;
let num = 0;

while ((match = quotePattern.exec(content)) !== null) {
  num++;
  const quoteText = match[1];
  const preview = quoteText.length > 80 ? quoteText.substring(0, 80) + '...' : quoteText;
  const lineNum = content.substring(0, match.index).split('\n').length;

  // Check if filtered
  const inHeadline = result.content_structure.headline && result.content_structure.headline.includes(quoteText);
  const inSubhead = result.content_structure.subhead && result.content_structure.subhead.includes(quoteText);
  const filtered = inHeadline || inSubhead;

  console.log(`${num}. Line ~${lineNum} ${filtered ? '[FILTERED]' : ''}`);
  console.log(`   "${preview}"`);
  console.log();
}
