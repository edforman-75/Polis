const toneAnalyzer = require('./backend/services/tone-analyzer');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const parser = new PressReleaseParser();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('       SPANBERGER TONE ANALYSIS (Basic Linguistic Markers)');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Analyze first release
const testFile = 'spanberger_01_mass_firings.txt';
const filepath = path.join('./cpo_examples', testFile);
const text = fs.readFileSync(filepath, 'utf8');

const structure = parser.extractContentStructure(text);
const bodyText = [structure.lead_paragraph, ...structure.body_paragraphs]
    .filter(p => p.trim().length > 0)
    .join('\n\n');

console.log(`FILE: ${testFile}`);
console.log(`HEADLINE: ${structure.headline}`);
console.log();
console.log('─'.repeat(79));
console.log();

// 1. Linguistic Markers (rule-based, no AI needed)
console.log('LINGUISTIC MARKERS:');
console.log('─'.repeat(79));
const markers = toneAnalyzer.analyzeLinguisticMarkers(bodyText);
if (markers.markers && markers.markers.length > 0) {
    markers.markers.forEach(marker => {
        console.log(`✓ ${marker.type}: ${marker.strength} strength`);
        if (marker.examples && marker.examples.length > 0) {
            console.log(`  Examples: "${marker.examples.slice(0, 2).join('", "')}"`);
        }
    });
} else {
    console.log('  No significant linguistic markers detected');
}
console.log(`Overall Score: ${markers.score}/100`);
console.log();

// 2. Emotional Dimensions
console.log('EMOTIONAL TONE:');
console.log('─'.repeat(79));
const emotional = toneAnalyzer.analyzeEmotionalDimensions(bodyText);
console.log(`  Dominant: ${emotional.dominant}`);
console.log(`  Sentiment: ${emotional.sentiment}`);
console.log(`  Intensity: ${emotional.intensity}/10`);
if (emotional.emotions && emotional.emotions.length > 0) {
    console.log(`  Detected emotions: ${emotional.emotions.join(', ')}`);
}
console.log();

// 3. Rhetorical Style
console.log('RHETORICAL STYLE:');
console.log('─'.repeat(79));
const rhetorical = toneAnalyzer.analyzeRhetoricalStyle(bodyText);
console.log(`  Type: ${rhetorical.type}`);
console.log(`  Stance: ${rhetorical.stance}`);
if (rhetorical.techniques && rhetorical.techniques.length > 0) {
    console.log(`  Techniques: ${rhetorical.techniques.join(', ')}`);
}
console.log();

// 4. Formality Level
console.log('FORMALITY:');
console.log('─'.repeat(79));
const formality = toneAnalyzer.analyzeFormalityLevel(bodyText);
console.log(`  Level: ${formality.level}`);
console.log(`  Score: ${formality.score}/10`);
if (formality.indicators && formality.indicators.length > 0) {
    console.log(`  Indicators: ${formality.indicators.join(', ')}`);
}
console.log();

// 5. Urgency
console.log('URGENCY:');
console.log('─'.repeat(79));
const urgency = toneAnalyzer.analyzeUrgency(bodyText);
console.log(`  Level: ${urgency.level}`);
console.log(`  Score: ${urgency.score}/10`);
if (urgency.indicators && urgency.indicators.length > 0) {
    console.log(`  Indicators: ${urgency.indicators.slice(0, 3).join(', ')}`);
}
console.log();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();
console.log('KEY QUESTION FOR DEMOCRATIC CAMPAIGNS:');
console.log();
console.log('Looking at this tone analysis, what should the ideal tone be for');
console.log('Spanberger\'s press releases when addressing:');
console.log();
console.log('  a) Trump administration actions (like mass firings)?');
console.log('  b) Impact on Virginia constituents?');
console.log('  c) Policy criticisms?');
console.log();
console.log('Current detected tone: ' + emotional.dominant + ', ' + rhetorical.type);
console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
