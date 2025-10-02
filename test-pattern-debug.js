// Test the afterPattern directly
const text = '"Katie is a true fighter for the people... She\'s not afraid to stand up for what\'s right and deliver for Californians," said Rep. Dave Min.';

// Find the quote end position
const quoteEndPos = text.indexOf(',"') + 2;
const contextAfter = text.substring(quoteEndPos, quoteEndPos + 200);

console.log('Context after quote:', JSON.stringify(contextAfter));
console.log('');

// Original broken pattern
const brokenPattern = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([^."]+?)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|\.|$)/i;
const brokenMatch = contextAfter.match(brokenPattern);
console.log('Broken pattern match:', brokenMatch);
if (brokenMatch) {
    console.log('  Verb:', brokenMatch[1]);
    console.log('  Speaker:', brokenMatch[2]);
}
console.log('');

// New fixed pattern
const fixedPattern = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z][\w\s.-]+?)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|[,.](?:\s|$)|$)/i;
const fixedMatch = contextAfter.match(fixedPattern);
console.log('Fixed pattern match:', fixedMatch);
if (fixedMatch) {
    console.log('  Verb:', fixedMatch[1]);
    console.log('  Speaker:', fixedMatch[2]);
}
