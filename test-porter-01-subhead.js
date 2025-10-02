const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const filePath = path.join(__dirname, 'cpo_examples', 'porter_01_launch.txt');
const text = fs.readFileSync(filePath, 'utf8');
const result = parser.parse(text);

console.log('Headline:', result.content_structure.headline);
console.log('\nSubhead:', result.content_structure.subhead);
console.log('\nQuote 0 text:', "What California needs now is a little bit of hope and a whole lot of grit... That's why I am running for Governor");
console.log('\nSubhead includes quote?:', result.content_structure.subhead && result.content_structure.subhead.includes("What California needs now is a little bit of hope and a whole lot of grit... That's why I am running for Governor"));
