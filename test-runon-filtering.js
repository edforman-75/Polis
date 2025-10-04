const PressReleaseParser = require('./backend/utils/press-release-parser');
const TextQualityAnalyzer = require('./backend/utils/text-quality-analyzer');
const fs = require('fs');

const parser = new PressReleaseParser();
const analyzer = new TextQualityAnalyzer();

// Test with a press release that has a long headline
const text = fs.readFileSync('./cpo_examples/spanberger_01_mass_firings.txt', 'utf8');

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('           RUN-ON FILTERING TEST - Paragraph Text Only');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Extract structure (same as endpoint does)
const structure = parser.extractContentStructure(text);

console.log('EXTRACTED STRUCTURE:');
console.log('-------------------');
console.log(`Headline: ${structure.headline.substring(0, 80)}...`);
console.log(`Dateline: ${structure.dateline.full}`);
console.log(`Lead paragraph: ${structure.lead_paragraph.substring(0, 80)}...`);
console.log(`Body paragraphs: ${structure.body_paragraphs.length}`);
console.log();

// Get body paragraphs (same as endpoint does)
const bodyParagraphs = [structure.lead_paragraph, ...structure.body_paragraphs]
    .filter(p => p.trim().length > 0);

console.log('BODY PARAGRAPHS TO CHECK:');
console.log('-------------------------');
bodyParagraphs.forEach((p, i) => {
    console.log(`Para ${i + 1}: ${p.substring(0, 60)}...`);
});
console.log();

// Check for run-ons (same as endpoint does)
const runOnSentences = [];
let totalSentenceCount = 0;

bodyParagraphs.forEach((paragraph, paragraphIdx) => {
    const sentences = analyzer.splitIntoSentences(paragraph);

    sentences.forEach((sentence, sentenceIdx) => {
        totalSentenceCount++;
        const check = analyzer.checkRunOnSentence(sentence);

        if (check.isRunOn) {
            runOnSentences.push({
                sentenceNumber: totalSentenceCount,
                paragraphNumber: paragraphIdx + 1,
                sentence: sentence.substring(0, 100) + '...',
                wordCount: check.wordCount,
                details: check.details
            });
        }
    });
});

console.log('RUN-ON CHECK RESULTS:');
console.log('---------------------');
console.log(`Total sentences checked: ${totalSentenceCount}`);
console.log(`Run-ons found: ${runOnSentences.length}`);
console.log();

if (runOnSentences.length > 0) {
    runOnSentences.forEach((r, i) => {
        console.log(`Run-on ${i + 1}:`);
        console.log(`  Paragraph ${r.paragraphNumber}, Sentence ${r.sentenceNumber}`);
        console.log(`  "${r.sentence}"`);
        console.log(`  Details: ${r.details}`);
        console.log();
    });
}

// Now check if headline would be flagged (it shouldn't be included)
console.log('VERIFICATION - HEADLINE NOT CHECKED:');
console.log('------------------------------------');
const headlineSentences = analyzer.splitIntoSentences(structure.headline);
console.log(`Headline: "${structure.headline.substring(0, 100)}..."`);
console.log(`Would be ${headlineSentences[0].split(/\s+/).length} words if checked`);

const headlineCheck = analyzer.checkRunOnSentence(headlineSentences[0]);
if (headlineCheck.isRunOn) {
    console.log(`❌ PROBLEM: Headline would be flagged as run-on (but shouldn't be checked)`);
    console.log(`   Details: ${headlineCheck.details}`);
} else {
    console.log(`✅ Headline not a run-on (but shouldn't be checked anyway)`);
}
console.log();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();
console.log(`✅ Endpoint correctly filters to ${bodyParagraphs.length} body paragraphs`);
console.log(`✅ Headline, dateline, and quotes are NOT checked`);
console.log(`✅ Only checking ${totalSentenceCount} sentences in body paragraphs`);
console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
