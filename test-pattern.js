const text = " said Ocasio-Cortez.";
const pattern = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z][^,]+?)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|\.$|$)/i;

console.log('Testing pattern on:', `"${text}"`);
console.log('Pattern:', pattern);

const match = text.match(pattern);
if (match) {
    console.log('\n✓ MATCHED');
    console.log('Full match:', match[0]);
    console.log('Verb:', match[1]);
    console.log('Name:', match[2]);
} else {
    console.log('\n✗ NO MATCH');
}

// Test individual parts
console.log('\n--- Testing parts ---');
console.log('Starts with space/comma:', /^[,\s]*/.test(text));
console.log('Has said:', /said/i.test(text));
console.log('Has capital after said:', /said\s+[A-Z]/.test(text));
console.log('Ends with period:', /\.$/.test(text));
