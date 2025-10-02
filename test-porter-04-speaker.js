const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const filePath = path.join(__dirname, 'cpo_examples', 'porter_04_min_endorsement.txt');
const text = fs.readFileSync(filePath, 'utf8');

// Test extractSpeakerName directly
console.log('=== Testing extractSpeakerName ===');
console.log('Input attribution: "Rep. Dave Min"');
const result = parser.extractSpeakerName('Rep. Dave Min', text);
console.log('Output speaker:', result);

console.log('\n=== Full parse result ===');
const parseResult = parser.parse(text);
console.log('Quote 1:');
console.log('  Full Attribution:', parseResult.quotes[0].full_attribution);
console.log('  Speaker:', parseResult.quotes[0].speaker_name);
console.log('  Title:', parseResult.quotes[0].speaker_title);
