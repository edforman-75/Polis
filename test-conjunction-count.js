const sentence = 'A recent UVA forecast projects virtually no job growth in Virginia for 2026, and Virginia recently lost its CNBC ranking as "America\'s Top State for Business."';

// Same regex from text-quality-analyzer.js line 436
const conjunctions = (sentence.match(/\b(and|but|or|nor|for|so|yet)\b/gi) || []);

console.log('Sentence:', sentence);
console.log('\nConjunctions found:', conjunctions.length);
console.log('Matches:', conjunctions);
console.log('\nAnalysis:');
conjunctions.forEach(match => {
    const index = sentence.indexOf(match);
    const context = sentence.substring(Math.max(0, index - 20), Math.min(sentence.length, index + 20));
    console.log(`  "${match}" in context: "...${context}..."`);
});
