const PressReleaseParser = require('./backend/utils/press-release-parser');
const parser = new PressReleaseParser();

const fullText = `Ocasio-Cortez Joins House Members and Advocates

Representative Alexandria Ocasio-Cortez joined Members of Congress for a press conference.

"The Israeli government has now killed over 64,000 human beings in Gaza," said Ocasio-Cortez.`;

console.log('Testing extractSpeakerName with "Ocasio-Cortez"');
console.log('================================================\n');

const result = parser.extractSpeakerName('Ocasio-Cortez', fullText);
console.log('Input attribution: "Ocasio-Cortez"');
console.log('Full text contains: "said Ocasio-Cortez"');
console.log('\nResult:', result);
console.log('Expected: "Ocasio-Cortez" or "Alexandria Ocasio-Cortez"');
