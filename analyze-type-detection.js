#!/usr/bin/env node

/**
 * Analyze Type Detection Robustness
 * Examines confidence scores and type accuracy across test files
 */

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser.js');

const examplesDir = path.join(__dirname, 'cpo_examples');
const allFiles = fs.readdirSync(examplesDir)
    .filter(file => file.endsWith('.txt'))
    .filter(file => !file.endsWith('.txt.json'))
    .filter(file => !file.startsWith('hybrid_') && !file.startsWith('release_'));

const parser = new PressReleaseParser();

console.log('=== TYPE DETECTION ROBUSTNESS ANALYSIS ===\n');
console.log('Analyzing', allFiles.length, 'press releases\n');

const typeStats = {};
const confidenceByType = {};
const lowConfidenceFiles = [];

allFiles.forEach(file => {
    const text = fs.readFileSync(path.join(examplesDir, file), 'utf-8');
    const result = parser.parse(text);

    const type = result.release_type.type;
    const confidence = result.release_type.confidence;
    const score = result.release_type.score || 0;

    // Track type distribution
    if (!typeStats[type]) {
        typeStats[type] = { count: 0, high: 0, medium: 0, low: 0, scores: [] };
    }
    typeStats[type].count++;
    typeStats[type][confidence]++;
    typeStats[type].scores.push(score);

    // Track low confidence files
    if (confidence === 'low') {
        lowConfidenceFiles.push({ file, type, confidence, score, headline: text.split('\n')[0] });
    }

    // Track confidence distribution by type
    if (!confidenceByType[type]) {
        confidenceByType[type] = [];
    }
    confidenceByType[type].push({ file, confidence, score });
});

// Display type statistics
console.log('TYPE DISTRIBUTION:\n');
Object.entries(typeStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([type, stats]) => {
        const avgScore = (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length).toFixed(1);
        const minScore = Math.min(...stats.scores);
        const maxScore = Math.max(...stats.scores);

        console.log(`${type}:`);
        console.log(`  Count: ${stats.count}`);
        console.log(`  Confidence: High=${stats.high}, Medium=${stats.medium}, Low=${stats.low}`);
        console.log(`  Scores: avg=${avgScore}, min=${minScore}, max=${maxScore}`);
        console.log('');
    });

// Display low confidence files
if (lowConfidenceFiles.length > 0) {
    console.log('\nLOW CONFIDENCE FILES:\n');
    lowConfidenceFiles.forEach(f => {
        console.log(`${f.file} - ${f.type} (score: ${f.score})`);
        console.log(`  ${f.headline.substring(0, 80)}${f.headline.length > 80 ? '...' : ''}`);
        console.log('');
    });
}

// Identify weakest type
console.log('\nWEAKEST TYPE ANALYSIS:\n');
const typeWeakness = Object.entries(typeStats).map(([type, stats]) => {
    const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
    const lowPct = (stats.low / stats.count * 100).toFixed(1);
    const mediumPct = (stats.medium / stats.count * 100).toFixed(1);
    const highPct = (stats.high / stats.count * 100).toFixed(1);

    return {
        type,
        avgScore,
        lowPct: parseFloat(lowPct),
        mediumPct: parseFloat(mediumPct),
        highPct: parseFloat(highPct),
        count: stats.count
    };
}).sort((a, b) => a.avgScore - b.avgScore);

typeWeakness.forEach(t => {
    console.log(`${t.type}:`);
    console.log(`  Avg score: ${t.avgScore.toFixed(1)}`);
    console.log(`  Low: ${t.lowPct}%, Medium: ${t.mediumPct}%, High: ${t.highPct}%`);
    console.log(`  Files: ${t.count}`);
    console.log('');
});

// Recommend which type to improve
const weakestType = typeWeakness[0];
console.log(`\nRECOMMENDATION: Improve ${weakestType.type} detection`);
console.log(`  Current avg score: ${weakestType.avgScore.toFixed(1)}`);
console.log(`  ${weakestType.lowPct}% of ${weakestType.type} files have low confidence`);

// Save results
const outputPath = path.join(__dirname, 'type-detection-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_files: allFiles.length,
    type_stats: typeStats,
    low_confidence_files: lowConfidenceFiles,
    type_weakness: typeWeakness,
    recommendation: weakestType.type
}, null, 2));

console.log(`\n✓ Results saved to: ${outputPath}\n`);
