const text = `RICHMOND, Va — Oct 03, 2025`;

// Current patterns from parser
const patterns = [
    /([A-Z][A-Z ,]+)[ ]*[–—-][ ]*([A-Z][a-z]+ +\d+,? +\d{4})/,
    /([A-Z][a-zA-Z ,\.]+)[ ]*[–—-][ ]*([A-Z][a-z]+ +\d+,? +\d{4})/,
];

console.log('Testing dateline:', text);
console.log('Character codes:', [...text].map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(' '));
console.log();

patterns.forEach((pattern, i) => {
    console.log(`Pattern ${i + 1}:`, pattern);
    const match = text.match(pattern);
    if (match) {
        console.log('  ✓ MATCH!');
        console.log('  Full match:', match[0]);
        console.log('  Location:', match[1]);
        console.log('  Date:', match[2]);
    } else {
        console.log('  ✗ No match');
    }
    console.log();
});
