#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const dir = 'cpo_examples';

const files = fs.readdirSync(dir)
  .filter(f => f.endsWith('.txt') && !f.includes('.txt.'))
  .sort();

console.log('=== STRUCTURAL PARSING COVERAGE TEST ===\n');
console.log(`Testing ${files.length} press releases...\n`);

let stats = {
  headline: 0,
  subhead: 0,
  lead: 0,
  body: 0,
  quotes: 0,
  contact: 0,
  date: 0,
  location: 0
};

let detailsByFile = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  const result = parser.parse(content);
  
  const hasHeadline = result.content_structure?.headline?.length > 0;
  const hasSubhead = result.content_structure?.subhead?.length > 0;
  const hasLead = result.content_structure?.lead_paragraph?.length > 0;
  const hasBody = result.content_structure?.body_paragraphs?.length > 0;
  const hasQuotes = result.quotes?.length > 0;
  const hasContact = result.contact_info?.email || result.contact_info?.phone || result.contact_info?.website;
  const hasDate = result.release_info?.date?.length > 0;
  const hasLocation = result.release_info?.location?.length > 0;
  
  if (hasHeadline) stats.headline++;
  if (hasSubhead) stats.subhead++;
  if (hasLead) stats.lead++;
  if (hasBody) stats.body++;
  if (hasQuotes) stats.quotes++;
  if (hasContact) stats.contact++;
  if (hasDate) stats.date++;
  if (hasLocation) stats.location++;
  
  detailsByFile.push({
    file,
    headline: hasHeadline,
    subhead: hasSubhead,
    lead: hasLead,
    body: hasBody,
    quotes: hasQuotes ? result.quotes.length : 0,
    contact: hasContact,
    date: hasDate,
    location: hasLocation
  });
});

console.log('STRUCTURAL ELEMENT COVERAGE:\n');
console.log(`Headline:       ${stats.headline}/${files.length} (${(stats.headline/files.length*100).toFixed(1)}%)`);
console.log(`Subhead:        ${stats.subhead}/${files.length} (${(stats.subhead/files.length*100).toFixed(1)}%)`);
console.log(`Lead Paragraph: ${stats.lead}/${files.length} (${(stats.lead/files.length*100).toFixed(1)}%)`);
console.log(`Body Content:   ${stats.body}/${files.length} (${(stats.body/files.length*100).toFixed(1)}%)`);
console.log(`Quotes:         ${stats.quotes}/${files.length} (${(stats.quotes/files.length*100).toFixed(1)}%)`);
console.log(`Contact Info:   ${stats.contact}/${files.length} (${(stats.contact/files.length*100).toFixed(1)}%)`);
console.log(`Date:           ${stats.date}/${files.length} (${(stats.date/files.length*100).toFixed(1)}%)`);
console.log(`Location:       ${stats.location}/${files.length} (${(stats.location/files.length*100).toFixed(1)}%)`);

// Files missing critical elements
const missingCritical = detailsByFile.filter(d => !d.headline || !d.lead || !d.quotes);

if (missingCritical.length > 0) {
  console.log(`\n\n⚠️  FILES MISSING CRITICAL ELEMENTS (${missingCritical.length}):\n`);
  missingCritical.forEach(d => {
    console.log(`${d.file}:`);
    if (!d.headline) console.log('  ✗ No headline');
    if (!d.subhead) console.log('  ✗ No subhead');
    if (!d.lead) console.log('  ✗ No lead paragraph');
    if (!d.quotes || d.quotes === 0) console.log('  ✗ No quotes');
    console.log();
  });
}

// Files with excellent coverage
const excellent = detailsByFile.filter(d => 
  d.headline && d.lead && d.body && d.quotes > 0 && d.contact
);

console.log(`\n✓ FILES WITH EXCELLENT COVERAGE: ${excellent.length}/${files.length} (${(excellent.length/files.length*100).toFixed(1)}%)`);

