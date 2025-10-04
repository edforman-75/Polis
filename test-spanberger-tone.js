const toneAnalyzer = require('./backend/services/tone-analyzer');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const parser = new PressReleaseParser();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('          SPANBERGER PRESS RELEASE TONE ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Test with first release to understand the analysis
const testFile = 'spanberger_01_mass_firings.txt';
const filepath = path.join('./cpo_examples', testFile);
const text = fs.readFileSync(filepath, 'utf8');

// Extract structure
const structure = parser.extractContentStructure(text);
const bodyText = [structure.lead_paragraph, ...structure.body_paragraphs]
    .filter(p => p.trim().length > 0)
    .join('\n\n');

console.log(`ANALYZING: ${testFile}`);
console.log(`HEADLINE: ${structure.headline}`);
console.log();

// Analyze tone for press release context
const toneAnalysis = toneAnalyzer.analyzeTone(bodyText, {
    contentType: 'press_release',
    targetAudience: 'general_public',
    candidateName: 'Spanberger'
});

console.log('TONE ANALYSIS RESULTS:');
console.log('─'.repeat(79));
console.log();

console.log('EMOTIONAL TONE:');
console.log(`  Overall: ${toneAnalysis.emotional.overall}`);
console.log(`  Sentiment: ${toneAnalysis.emotional.sentiment}`);
console.log(`  Intensity: ${toneAnalysis.emotional.intensity}/10`);
if (toneAnalysis.emotional.dominantEmotions) {
    console.log(`  Dominant Emotions: ${toneAnalysis.emotional.dominantEmotions.join(', ')}`);
}
console.log();

console.log('RHETORICAL STYLE:');
console.log(`  Approach: ${toneAnalysis.rhetorical.approach}`);
console.log(`  Stance: ${toneAnalysis.rhetorical.stance}`);
if (toneAnalysis.rhetorical.techniques) {
    console.log(`  Techniques: ${toneAnalysis.rhetorical.techniques.join(', ')}`);
}
console.log();

console.log('FORMALITY:');
console.log(`  Level: ${toneAnalysis.formality.level}`);
console.log(`  Score: ${toneAnalysis.formality.score}/10`);
console.log();

console.log('URGENCY:');
console.log(`  Level: ${toneAnalysis.urgency.level}`);
console.log(`  Score: ${toneAnalysis.urgency.score}/10`);
console.log();

if (toneAnalysis.linguisticMarkers) {
    console.log('LINGUISTIC MARKERS:');
    Object.entries(toneAnalysis.linguisticMarkers).forEach(([marker, data]) => {
        if (data.present) {
            console.log(`  • ${marker}: ${data.strength || 'detected'}`);
            if (data.examples && data.examples.length > 0) {
                console.log(`    Examples: "${data.examples.slice(0, 2).join('", "')}"`);
            }
        }
    });
    console.log();
}

if (toneAnalysis.recommendations && toneAnalysis.recommendations.length > 0) {
    console.log('RECOMMENDATIONS:');
    toneAnalysis.recommendations.forEach((rec, idx) => {
        console.log(`  ${idx + 1}. ${rec}`);
    });
    console.log();
}

console.log('OVERALL ASSESSMENT:');
if (toneAnalysis.overallAssessment) {
    console.log(`  ${toneAnalysis.overallAssessment}`);
}
console.log();

// Show context requirements
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('CONTEXT FOR DEMOCRATIC CAMPAIGNS:');
console.log('─'.repeat(79));
console.log();
console.log('For accurate tone evaluation, the analyzer needs context about:');
console.log('  1. Target audience (base supporters, swing voters, media, etc.)');
console.log('  2. Campaign phase (primary, general, final stretch, etc.)');
console.log('  3. Situational context (normal ops, crisis response, policy rollout)');
console.log('  4. Desired emotional tone (inspiring, combative, reassuring, etc.)');
console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
