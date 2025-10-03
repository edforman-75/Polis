#!/usr/bin/env node

/**
 * Enhanced batch processor for fact-checking
 * Extracts both factual claims AND non-factual statements
 * Stores non-factual statements with explanations in database
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const PressReleaseParser = require('./backend/utils/press-release-parser');

const parser = new PressReleaseParser();
const examplesDir = './cpo_examples';
const dbPath = process.env.DATABASE_PATH || './campaign.db';

// Open database connection
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

async function processAllFiles() {
    try {
        const files = fs.readdirSync(examplesDir)
            .filter(f => f.endsWith('.txt') && f !== 'README.md');

        console.log(`\n📊 Processing ${files.length} files...`);
        console.log('=' .repeat(60));

        const results = {
            totalFiles: files.length,
            totalStatements: 0,
            totalFactualClaims: 0,
            totalNonFactual: 0,
            byCategory: {
                opinion_characterization: 0,
                prediction_future: 0,
                motivation_intent: 0,
                value_judgment: 0
            },
            files: []
        };

        // Get admin user ID for created_by field
        const admin = await dbGet('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
        const userId = admin ? admin.id : 1;

        for (const file of files) {
            const filePath = path.join(examplesDir, file);
            const content = fs.readFileSync(filePath, 'utf8');

            console.log(`\n📄 Processing: ${file}`);

            // Extract factual claims
            const factualClaims = parser.extractProvableFacts(content);

            // Extract non-factual statements
            const nonFactualStatements = parser.extractNonFactualStatements(content);

            // Count total statements (rough estimate)
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
            const totalSentences = sentences.length;

            console.log(`   ✅ Factual claims: ${factualClaims.length}`);
            console.log(`   ❌ Non-factual: ${nonFactualStatements.length}`);
            console.log(`   📊 Total sentences: ${totalSentences}`);

            // Store non-factual statements in database
            for (const nfs of nonFactualStatements) {
                try {
                    await dbRun(`
                        INSERT INTO non_factual_statements (
                            statement_text, reason_category, detailed_explanation,
                            source_file, sentence_index, appears_factual_confidence,
                            keywords_detected, created_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        nfs.statement,
                        nfs.reasonCategory,
                        nfs.detailedExplanation,
                        file,
                        nfs.sentenceIndex,
                        nfs.appearsFactualConfidence,
                        JSON.stringify({ keyword: nfs.matchedKeyword, pattern: nfs.matchedPattern }),
                        userId
                    ]);

                    // Update category counts
                    results.byCategory[nfs.reasonCategory]++;
                } catch (err) {
                    console.error(`   ⚠️  Error storing non-factual statement: ${err.message}`);
                }
            }

            results.files.push({
                file,
                totalSentences,
                factualClaims: factualClaims.length,
                nonFactual: nonFactualStatements.length,
                nonFactualByCategory: nonFactualStatements.reduce((acc, nfs) => {
                    acc[nfs.reasonCategory] = (acc[nfs.reasonCategory] || 0) + 1;
                    return acc;
                }, {})
            });

            results.totalStatements += totalSentences;
            results.totalFactualClaims += factualClaims.length;
            results.totalNonFactual += nonFactualStatements.length;
        }

        // Write summary to file
        fs.writeFileSync(
            './batch-results-with-non-factual.json',
            JSON.stringify(results, null, 2)
        );

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 PROCESSING COMPLETE');
        console.log('='.repeat(60));
        console.log(`✅ Files processed: ${results.totalFiles}`);
        console.log(`📊 Total statements: ${results.totalStatements}`);
        console.log(`✅ Factual claims: ${results.totalFactualClaims} (${((results.totalFactualClaims/results.totalStatements)*100).toFixed(1)}%)`);
        console.log(`❌ Non-factual: ${results.totalNonFactual} (${((results.totalNonFactual/results.totalStatements)*100).toFixed(1)}%)`);
        console.log('\n📈 Non-factual breakdown:');
        console.log(`   Opinion/Characterization: ${results.byCategory.opinion_characterization}`);
        console.log(`   Predictions/Future: ${results.byCategory.prediction_future}`);
        console.log(`   Motivations/Intent: ${results.byCategory.motivation_intent}`);
        console.log(`   Value Judgments: ${results.byCategory.value_judgment}`);
        console.log(`\n💾 Results saved to: batch-results-with-non-factual.json`);
        console.log(`💾 Database updated: ${dbPath}`);
        console.log('\n🎉 All non-factual statements stored in database with explanations!');

    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    } finally {
        db.close();
    }
}

processAllFiles().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
