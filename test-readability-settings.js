const ReadabilityAnalyzer = require('./backend/utils/readability-analyzer');

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('           READABILITY SETTINGS CUSTOMIZATION TEST');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();

// Test 1: Load default settings
console.log('TEST 1: Default Settings (from config file)');
console.log('────────────────────────────────────────────');
const analyzer1 = new ReadabilityAnalyzer();
const defaultSettings = analyzer1.getSettings();
console.log('Press Release Target:', defaultSettings.contentTypes.press_release.target);
console.log('Social Media Target:', defaultSettings.contentTypes.social_media.target);
console.log('Tolerance:', defaultSettings.tolerance);
console.log();

// Test 2: Create analyzer with custom settings
console.log('TEST 2: Custom Settings via Constructor');
console.log('────────────────────────────────────────────');
const customSettings = {
    contentTypes: {
        'press_release': {
            target: 6,
            range: [5, 7],
            note: 'Campaign wants simpler language'
        }
    },
    tolerance: 0.5
};

const analyzer2 = new ReadabilityAnalyzer(customSettings);
const customLoadedSettings = analyzer2.getSettings();
console.log('Custom Press Release Target:', customLoadedSettings.contentTypes.press_release.target);
console.log('Custom Tolerance:', customLoadedSettings.tolerance);
console.log('Custom Note:', customLoadedSettings.contentTypes.press_release.note);
console.log();

// Test 3: Update settings dynamically
console.log('TEST 3: Update Settings Dynamically');
console.log('────────────────────────────────────────────');
const analyzer3 = new ReadabilityAnalyzer();
console.log('Original fundraising target:', analyzer3.getSettings('fundraising').target);

analyzer3.updateSettings('fundraising', {
    target: 7,
    range: [6, 8],
    note: 'Updated for younger donor demographic'
});

console.log('Updated fundraising target:', analyzer3.getSettings('fundraising').target);
console.log('Updated note:', analyzer3.getSettings('fundraising').note);
console.log();

// Test 4: Test readability analysis with custom target
console.log('TEST 4: Readability Analysis with Different Targets');
console.log('────────────────────────────────────────────');

const testText = "We must ensure that every family has access to affordable healthcare. The current system is broken and needs comprehensive reform.";

// Default analyzer (target 8)
const analysis1 = analyzer1.analyzeReadability(testText, 8, 'press_release');
console.log('Analysis with default target (8th grade):');
console.log('  Current Grade Level:', analysis1.averageGradeLevel);
console.log('  On Target?', analysis1.onTarget ? 'YES ✓' : 'NO ✗');
console.log('  Deviation:', analysis1.deviation.toFixed(1), 'grades');
console.log();

// Custom analyzer with lower target (6)
const analysis2 = analyzer2.analyzeReadability(testText, 6, 'press_release');
console.log('Analysis with custom target (6th grade):');
console.log('  Current Grade Level:', analysis2.averageGradeLevel);
console.log('  On Target?', analysis2.onTarget ? 'YES ✓' : 'NO ✗');
console.log('  Deviation:', analysis2.deviation.toFixed(1), 'grades');
console.log('  Suggestions:', analysis2.suggestions.length > 0 ? 'YES' : 'NONE');
console.log();

// Test 5: Create new content type
console.log('TEST 5: Create Custom Content Type');
console.log('────────────────────────────────────────────');
const analyzer4 = new ReadabilityAnalyzer();
analyzer4.updateSettings('voter_guide', {
    target: 5,
    range: [4, 6],
    note: 'Maximum accessibility for all voters'
});

console.log('New content type "voter_guide":');
console.log('  Target:', analyzer4.getSettings('voter_guide').target);
console.log('  Range:', analyzer4.getSettings('voter_guide').range);
console.log('  Note:', analyzer4.getSettings('voter_guide').note);
console.log();

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log();
console.log('Campaigns can customize readability targets in three ways:');
console.log();
console.log('1. EDIT CONFIG FILE: backend/config/readability-settings.json');
console.log('   Set campaignSettings.enabled = true and add content type overrides');
console.log();
console.log('2. USE CONSTRUCTOR: Pass custom settings when creating ReadabilityAnalyzer');
console.log('   const analyzer = new ReadabilityAnalyzer({ contentTypes: {...}, tolerance: 0.5 })');
console.log();
console.log('3. UPDATE DYNAMICALLY: Use updateSettings() method');
console.log('   analyzer.updateSettings("press_release", { target: 7, range: [6, 8] })');
console.log();
console.log('API Endpoints:');
console.log('  GET  /api/text-analysis/readability-settings');
console.log('  POST /api/text-analysis/readability-settings');
console.log('  POST /api/text-analysis/save-readability-settings');
console.log();
console.log('═══════════════════════════════════════════════════════════════════════════════');
