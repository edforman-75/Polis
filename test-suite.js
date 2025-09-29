#!/usr/bin/env node
// Comprehensive Test Suite for Campaign Content Editor
// Tests all analyzers individually and systematically

const fs = require('fs');
const path = require('path');

console.log('🧪 CAMPAIGN CONTENT EDITOR - COMPREHENSIVE TEST SUITE');
console.log('='.repeat(60));

// Test content
const testText = `
U.S. Congresswoman Abigail Spanberger (VA-07) is serving her third term in the U.S. House of Representatives. In Congress, she serves on the U.S. House Permanent Select Committee on Intelligence and the U.S. House Agriculture Committee — and she has risen to become one of the most bipartisan lawmakers in the country.

Before Congress, Spanberger served as a federal law enforcement officer — tracking narcotics traffickers and working money laundering cases — and as a CIA case officer — working undercover on counterterrorism and nuclear counterproliferation cases. She and her husband Adam are the proud parents of three school-aged daughters.
`.trim();

console.log('📝 Test content length:', testText.length, 'characters');
console.log('');

// Helper function to safely test an analyzer
function testAnalyzer(name, analyzerPath, options = {}) {
    console.log(`🔍 Testing ${name}...`);

    try {
        // Clear require cache
        delete require.cache[require.resolve(analyzerPath)];

        const AnalyzerClass = require(analyzerPath);

        // Create instance
        let analyzer;
        if (options.campaignProfile) {
            analyzer = new AnalyzerClass(options.campaignProfile);
        } else {
            analyzer = new AnalyzerClass();
        }

        console.log(`   ✅ ${name} loaded successfully`);

        // Test analyze method
        const result = analyzer.analyze(testText);

        console.log(`   ✅ ${name} analysis completed`);
        console.log(`   📊 Result keys:`, Object.keys(result));

        // Validate result structure
        if (typeof result !== 'object' || result === null) {
            throw new Error(`${name} returned invalid result type: ${typeof result}`);
        }

        console.log(`   ✅ ${name} validation passed`);
        console.log('');

        return { success: true, result };

    } catch (error) {
        console.error(`   ❌ ${name} FAILED:`);
        console.error(`   📋 Error name: ${error.name}`);
        console.error(`   💬 Error message: ${error.message}`);
        console.error(`   🗂️ Stack trace:`, error.stack);
        console.log('');

        return { success: false, error };
    }
}

// Test all analyzers
const testResults = {};

// 1. Tone Analyzer
testResults.tone = testAnalyzer('Tone Analyzer', './analyzers/tone-analyzer', {
    campaignProfile: {
        candidateName: 'Test Candidate',
        communicationStyle: 'balanced',
        primaryTones: ['professional', 'confident'],
        targetAudience: 'general',
        formalityLevel: 'formal'
    }
});

// 2. Grammar Analyzer
testResults.grammar = testAnalyzer('Grammar Analyzer', './analyzers/grammar-analyzer');

// 3. Narrative Analyzer
testResults.narrative = testAnalyzer('Narrative Analyzer', './analyzers/narrative-analyzer');

// 4. AI Optimization Analyzer
testResults.aiOptimization = testAnalyzer('AI Optimization Analyzer', './analyzers/ai-optimization-analyzer');

// 5. Compliance Analyzer
testResults.compliance = testAnalyzer('Compliance Analyzer', './analyzers/compliance-analyzer');

// 6. Fact-Checking Analyzer
testResults.factChecking = testAnalyzer('Fact-Checking Analyzer', './analyzers/fact-checking-analyzer');

// 7. Content Field Analyzer
testResults.contentFields = testAnalyzer('Content Field Analyzer', './analyzers/content-field-analyzer');

// 8. Recommendations Engine
console.log('🔍 Testing Recommendations Engine...');
try {
    delete require.cache[require.resolve('./analyzers/recommendations-engine')];

    const RecommendationsEngine = require('./analyzers/recommendations-engine');
    const engine = new RecommendationsEngine();

    console.log('   ✅ Recommendations Engine loaded successfully');

    // Create mock analysis results for testing
    const mockAnalysisResults = {
        narrative: testResults.narrative.success ? testResults.narrative.result : {},
        aiOptimization: testResults.aiOptimization.success ? testResults.aiOptimization.result : {},
        compliance: testResults.compliance.success ? testResults.compliance.result : {},
        factChecking: testResults.factChecking.success ? testResults.factChecking.result : {},
        contentFields: testResults.contentFields.success ? testResults.contentFields.result : {}
    };

    const recommendations = engine.generateUnifiedRecommendations(mockAnalysisResults);

    console.log('   ✅ Recommendations Engine analysis completed');
    console.log('   📊 Result keys:', Object.keys(recommendations));
    console.log('');

    testResults.recommendations = { success: true, result: recommendations };

} catch (error) {
    console.error('   ❌ Recommendations Engine FAILED:');
    console.error('   📋 Error name:', error.name);
    console.error('   💬 Error message:', error.message);
    console.error('   🗂️ Stack trace:', error.stack);
    console.log('');

    testResults.recommendations = { success: false, error };
}

// Summary
console.log('📋 TEST SUMMARY');
console.log('='.repeat(40));

let passedTests = 0;
let totalTests = 0;

Object.entries(testResults).forEach(([testName, result]) => {
    totalTests++;
    if (result.success) {
        passedTests++;
        console.log(`✅ ${testName}: PASSED`);
    } else {
        console.log(`❌ ${testName}: FAILED - ${result.error.message}`);
    }
});

console.log('');
console.log(`🎯 Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! The system is ready to use.');
} else {
    console.log('⚠️  Some tests failed. Check the errors above for details.');
}

console.log('');
console.log('🚀 Test completed!');