const ReadabilityAnalyzer = require('./backend/utils/readability-analyzer');
const PressReleaseParser = require('./backend/utils/press-release-parser');
const fs = require('fs');
const path = require('path');

const analyzer = new ReadabilityAnalyzer();
const parser = new PressReleaseParser();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('           SPANBERGER PRESS RELEASE READABILITY ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Get all Spanberger files
const files = fs.readdirSync('./cpo_examples')
    .filter(f => f.startsWith('spanberger_'))
    .sort();

const results = [];

files.forEach((filename, idx) => {
    const filepath = path.join('./cpo_examples', filename);
    const text = fs.readFileSync(filepath, 'utf8');

    // Extract body paragraphs only (no headline, dateline)
    const structure = parser.extractContentStructure(text);
    const bodyText = [structure.lead_paragraph, ...structure.body_paragraphs]
        .filter(p => p.trim().length > 0)
        .join('\n\n');

    // Analyze readability
    const analysis = analyzer.analyzeReadability(bodyText, 8, 'press_release');

    results.push({
        filename,
        gradeLevel: analysis.averageGradeLevel,
        onTarget: analysis.onTarget,
        deviation: analysis.deviation,
        difficulty: analysis.difficulty,
        wordCount: analysis.statistics.words,
        sentences: analysis.statistics.sentences,
        avgSentenceLength: analysis.statistics.avgSentenceLength,
        complexWords: analysis.statistics.complexWords,
        suggestionCount: analysis.suggestions.length,
        suggestions: analysis.suggestions
    });
});

// Summary statistics
const avgGradeLevel = results.reduce((sum, r) => sum + r.gradeLevel, 0) / results.length;
const onTargetCount = results.filter(r => r.onTarget).length;
const tooHigh = results.filter(r => r.deviation > 1).length;
const tooLow = results.filter(r => r.deviation < -1).length;

console.log('SUMMARY STATISTICS:');
console.log('──────────────────────────────────────────────────────────────');
console.log(`Total releases analyzed: ${results.length}`);
console.log(`Average grade level: ${avgGradeLevel.toFixed(1)} (target: 8.0)`);
console.log(`On target (within 1 grade): ${onTargetCount}/${results.length} (${(onTargetCount/results.length*100).toFixed(0)}%)`);
console.log(`Too difficult (9+): ${tooHigh}/${results.length}`);
console.log(`Too simple (7-): ${tooLow}/${results.length}`);
console.log();

// Show detailed results
console.log('INDIVIDUAL RELEASE ANALYSIS:');
console.log('──────────────────────────────────────────────────────────────');
results.forEach((r, idx) => {
    const statusIcon = r.onTarget ? '✓' : '✗';
    const diffIcon = r.deviation > 1 ? '📈' : r.deviation < -1 ? '📉' : '➡️';

    console.log(`${idx + 1}. ${r.filename}`);
    console.log(`   Grade Level: ${r.gradeLevel.toFixed(1)} ${diffIcon} (${r.deviation > 0 ? '+' : ''}${r.deviation.toFixed(1)} from target) ${statusIcon}`);
    console.log(`   Difficulty: ${r.difficulty}`);
    console.log(`   Stats: ${r.wordCount} words, ${r.sentences} sentences, avg ${r.avgSentenceLength.toFixed(1)} words/sentence`);
    console.log(`   Complex words: ${r.complexWords} (${(r.complexWords/r.wordCount*100).toFixed(1)}%)`);

    if (r.suggestionCount > 0) {
        console.log(`   Issues: ${r.suggestionCount} suggestions`);
    }
    console.log();
});

// Show most problematic releases
console.log('MOST DIFFICULT RELEASES (need simplification):');
console.log('──────────────────────────────────────────────────────────────');
const difficult = results
    .filter(r => r.deviation > 1)
    .sort((a, b) => b.gradeLevel - a.gradeLevel)
    .slice(0, 3);

if (difficult.length === 0) {
    console.log('None - all releases are at or below target! 🎉');
} else {
    difficult.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.filename} - Grade ${r.gradeLevel.toFixed(1)}`);
        console.log(`   Top suggestions:`);
        r.suggestions.slice(0, 3).forEach(s => {
            console.log(`   • ${s.type}: ${s.message}`);
        });
        console.log();
    });
}

// Show word replacement suggestions across all releases
console.log('TOP WORD SIMPLIFICATION OPPORTUNITIES:');
console.log('──────────────────────────────────────────────────────────────');
const wordReplacements = new Map();
results.forEach(r => {
    r.suggestions
        .filter(s => s.type === 'word_replacement')
        .forEach(s => {
            const key = `${s.searchText} → ${s.replaceWith}`;
            wordReplacements.set(key, (wordReplacements.get(key) || 0) + 1);
        });
});

const topReplacements = Array.from(wordReplacements.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

if (topReplacements.length > 0) {
    topReplacements.forEach(([replacement, count]) => {
        console.log(`${replacement} (found in ${count} release${count > 1 ? 's' : ''})`);
    });
} else {
    console.log('No common complex words found across releases.');
}

console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              RECOMMENDATIONS');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();
console.log('Overall Assessment:');
console.log(`  Campaign average: ${avgGradeLevel.toFixed(1)} grade level`);
if (avgGradeLevel <= 9) {
    console.log(`  ✓ Good! Writing is accessible to general public`);
} else {
    console.log(`  ⚠ Writing skews complex - aim for simpler language`);
}
console.log();
console.log('Key Actions:');
if (tooHigh > 0) {
    console.log(`  1. Simplify ${tooHigh} release${tooHigh > 1 ? 's' : ''} that read above 9th grade`);
    console.log('     • Break long sentences (aim for 15-20 words)');
    console.log('     • Replace complex words with everyday alternatives');
    console.log('     • Use active voice');
}
if (topReplacements.length > 0) {
    console.log('  2. Replace common complex words across all releases');
}
console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
