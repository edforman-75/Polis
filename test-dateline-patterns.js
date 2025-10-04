const text = `RICHMOND, Va — Oct 03, 2025`;

console.log('Testing extractDatelineEnhanced patterns...\n');
console.log('Text:', JSON.stringify(text));
console.log();

// Current patterns from extractDatelineEnhanced (lines 3440-3444)
const currentPatterns = [
    /([A-Z][A-Z ,]+(?:[ ]+[A-Z][a-z]*\.?)?)(?:[ ]*[–—-][ ]*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[ ]+\d{4})/g,
    /([A-Z][A-Z ,]+(?:[ ]+[A-Z][a-z]*\.?)?)(?:[ ]*[–—-][ ]*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[ ]+\d+,?[ ]+\d{4})/g,
];

console.log('=== CURRENT PATTERNS (from extractDatelineEnhanced) ===\n');

currentPatterns.forEach((pattern, i) => {
    console.log(`Pattern ${i + 1}:`, pattern);
    const match = pattern.exec(text);
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

console.log('=== ANALYSIS ===\n');

// Test what [A-Z][A-Z ,]+ matches
const cityPattern = /[A-Z][A-Z ,]+/;
const cityMatch = text.match(cityPattern);
console.log('What does [A-Z][A-Z ,]+ match?');
console.log('  Match:', JSON.stringify(cityMatch ? cityMatch[0] : null));
console.log('  Remaining text:', JSON.stringify(text.substring(cityMatch ? cityMatch[0].length : 0)));
console.log();

// Proposed fix: pattern that doesn't require space before state abbreviation
console.log('=== PROPOSED FIX ===\n');

const fixedPatterns = [
    // Allow state abbreviation to follow comma+space without requiring extra space
    /([A-Z][A-Z ,]+[A-Z][a-z]+\.?)[ ]*[–—-][ ]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[ ]+\d+,?[ ]+\d{4})/g,
    // Alternative: use looser character class like test-dateline.js
    /([A-Z][a-zA-Z ,\.]+)[ ]*[–—-][ ]*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[ ]+\d+,?[ ]+\d{4})/g,
];

fixedPatterns.forEach((pattern, i) => {
    console.log(`Fixed Pattern ${i + 1}:`, pattern);
    const match = pattern.exec(text);
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
