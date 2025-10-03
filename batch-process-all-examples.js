#!/usr/bin/env node

/**
 * Batch process all CPO examples for fact-checking
 * Extracts claims and classifies them as factual vs non-factual
 */

const fs = require('fs');
const path = require('path');
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const examplesDir = './cpo_examples';

async function processAllFiles() {
    const files = fs.readdirSync(examplesDir)
        .filter(f => f.endsWith('.txt') && f !== 'README.md');

    console.log(`Processing ${files.length} files...\n`);

    const results = [];
    let totalStatements = 0;
    let totalFactualClaims = 0;
    let totalNonFactual = 0;

    for (const file of files) {
        const filePath = path.join(examplesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Extract facts using parser
        const facts = parser.extractProvableFacts(content);

        // Count statements (rough estimate: split by sentences)
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const totalSentences = sentences.length;
        const factualCount = facts.length;
        const nonFactualCount = totalSentences - factualCount;

        results.push({
            file,
            totalSentences,
            factualClaims: factualCount,
            nonFactual: nonFactualCount,
            claims: facts.map(f => ({
                text: f.text,
                type: f.type,
                verifiable: f.verifiable,
                verificationType: f.verification_type
            }))
        });

        totalStatements += totalSentences;
        totalFactualClaims += factualCount;
        totalNonFactual += nonFactualCount;
    }

    // Write results
    fs.writeFileSync(
        './all-claims-analysis.json',
        JSON.stringify({
            summary: {
                totalFiles: files.length,
                totalStatements,
                totalFactualClaims,
                totalNonFactual,
                factualPercentage: ((totalFactualClaims / totalStatements) * 100).toFixed(1)
            },
            files: results
        }, null, 2)
    );

    console.log('✅ Analysis complete!');
    console.log(`📊 Total files: ${files.length}`);
    console.log(`📊 Total statements: ${totalStatements}`);
    console.log(`✅ Factual claims: ${totalFactualClaims} (${((totalFactualClaims/totalStatements)*100).toFixed(1)}%)`);
    console.log(`❌ Non-factual: ${totalNonFactual} (${((totalNonFactual/totalStatements)*100).toFixed(1)}%)`);
    console.log(`\n📄 Results saved to: all-claims-analysis.json`);
}

processAllFiles().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
