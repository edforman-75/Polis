const fs = require('fs');
const content = fs.readFileSync('cpo_examples/sherrill_07_gateway_trump.txt', 'utf-8');
const paragraphs = content.split(/\n\n+/);

const para2 = paragraphs[2].trim();
const para3 = paragraphs[3].trim();

console.log('Para 2 length:', para2.length);
console.log('Para 2 last 80 chars:');
console.log(JSON.stringify(para2.substring(para2.length - 80)));
console.log();

console.log('Para 3 length:', para3.length);
console.log('Para 3 last 80 chars:');
console.log(JSON.stringify(para3.substring(para3.length - 80)));
console.log();

// Test the regex
const hasClosingRegex = /[""][^"""]*$/;
console.log('Para 2 hasClosing?', hasClosingRegex.test(para2));
console.log('Para 3 hasClosing?', hasClosingRegex.test(para3));
console.log();

// Check if ends with quote
console.log('Para 2 last char:', JSON.stringify(para2.slice(-1)));
console.log('Para 3 last char:', JSON.stringify(para3.slice(-1)));
