#!/usr/bin/env node

/**
 * Interactive Parser Verification Tool
 *
 * Allows human verification of parsing results release by release
 * Features:
 * - Shows parsed fields with confidence indicators
 * - Field-by-field confirmation/rejection
 * - Comment capture for incorrect fields
 * - Saves corrections for future analysis
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { parseReleaseToJSON } = require('./backend/utils/press-release-parser.js');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

class ParserVerifier {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.corrections = [];
        this.currentFile = null;
        this.currentResult = null;
    }

    // Confidence indicator with color coding
    confidenceIndicator(confidence) {
        if (!confidence) return `${colors.gray}[?? NONE]${colors.reset}`;

        const indicators = {
            'high': `${colors.green}[✓✓ HIGH]${colors.reset}`,
            'medium': `${colors.yellow}[~~ MED ]${colors.reset}`,
            'low': `${colors.red}[!! LOW ]${colors.reset}`,
            'none': `${colors.gray}[?? NONE]${colors.reset}`
        };

        return indicators[confidence.toLowerCase()] || `${colors.gray}[${confidence}]${colors.reset}`;
    }

    // Display a single field with confidence
    displayField(label, value, confidence, notes = '') {
        const confIndicator = this.confidenceIndicator(confidence);
        const displayValue = value || `${colors.gray}(not extracted)${colors.reset}`;

        console.log(`\n${colors.bright}${label}:${colors.reset}`);
        console.log(`  ${confIndicator} ${displayValue}`);
        if (notes) {
            console.log(`  ${colors.dim}${notes}${colors.reset}`);
        }
    }

    // Display all parsed fields
    displayParseResult(result) {
        console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
        console.log(`${colors.bright}${colors.cyan}PARSED RESULT${colors.reset}`);
        console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);

        // Headline
        this.displayField('HEADLINE', result.headline, 'high');

        // Subhead
        if (result.subhead) {
            this.displayField('SUBHEAD', result.subhead, 'medium');
        }

        // Date and Location
        const dateline = result.dateline || {};
        this.displayField(
            'DATE',
            dateline.date,
            dateline.confidence,
            dateline.format ? `Format detected: ${dateline.format}` : ''
        );
        this.displayField(
            'LOCATION',
            dateline.location,
            dateline.confidence,
            dateline.full ? `Full dateline: ${dateline.full}` : ''
        );

        // Lead Paragraph
        this.displayField(
            'LEAD PARAGRAPH',
            result.lead_paragraph,
            'high',
            `${(result.lead_paragraph || '').split(' ').length} words`
        );

        // Body Paragraphs
        if (result.body_paragraphs && result.body_paragraphs.length > 0) {
            console.log(`\n${colors.bright}BODY PARAGRAPHS:${colors.reset} ${result.body_paragraphs.length} paragraphs`);
            result.body_paragraphs.forEach((para, i) => {
                const preview = para.substring(0, 80) + (para.length > 80 ? '...' : '');
                console.log(`  ${colors.dim}${i + 1}. ${preview}${colors.reset}`);
            });
        }

        // Quotes
        if (result.quotes && result.quotes.length > 0) {
            console.log(`\n${colors.bright}QUOTES:${colors.reset} ${result.quotes.length} quotes extracted`);
            result.quotes.forEach((quote, i) => {
                const speakerConf = quote.speaker_name && quote.speaker_name !== 'UNKNOWN' ? 'high' : 'low';
                const titleConf = quote.speaker_title ? 'medium' : 'none';

                console.log(`\n  ${colors.bright}Quote ${i + 1}:${colors.reset}`);
                this.displayField('    Speaker', quote.speaker_name, speakerConf);
                if (quote.speaker_title) {
                    this.displayField('    Title', quote.speaker_title, titleConf);
                }

                const quotePreview = quote.text.substring(0, 100) + (quote.text.length > 100 ? '...' : '');
                console.log(`    ${colors.dim}Text: "${quotePreview}"${colors.reset}`);
            });
        }

        // Boilerplate
        if (result.boilerplate) {
            const preview = result.boilerplate.substring(0, 80) + (result.boilerplate.length > 80 ? '...' : '');
            this.displayField('BOILERPLATE', preview, 'medium');
        }

        console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
    }

    // Ask user a question and get response
    async ask(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    // Verify a single field
    async verifyField(fieldName, value, confidence) {
        console.log(`\n${colors.bright}Verifying: ${fieldName}${colors.reset}`);
        const confIndicator = this.confidenceIndicator(confidence);
        console.log(`Current value: ${confIndicator} ${value || '(not extracted)'}`);

        const response = await this.ask('Is this correct? (y/n/s to skip): ');

        if (response.toLowerCase() === 's') {
            return { verified: true, skipped: true };
        }

        if (response.toLowerCase() === 'y') {
            return { verified: true, correct: true };
        }

        // Incorrect - get correction
        const correctValue = await this.ask('What should the value be? ');
        const comment = await this.ask('Comment (optional, press enter to skip): ');

        return {
            verified: true,
            correct: false,
            correctValue,
            comment,
            originalValue: value,
            originalConfidence: confidence
        };
    }

    // Verify all quotes
    async verifyQuotes(quotes) {
        if (!quotes || quotes.length === 0) {
            const response = await this.ask('No quotes extracted. Is this correct? (y/n): ');
            if (response.toLowerCase() === 'n') {
                const comment = await this.ask('What quotes are missing? ');
                return [{
                    field: 'quotes',
                    verified: true,
                    correct: false,
                    comment,
                    originalValue: 'none',
                    originalConfidence: 'none'
                }];
            }
            return [];
        }

        const corrections = [];

        for (let i = 0; i < quotes.length; i++) {
            const quote = quotes[i];
            console.log(`\n${colors.bright}Quote ${i + 1} of ${quotes.length}${colors.reset}`);
            console.log(`Text: "${quote.text.substring(0, 100)}..."`);

            // Verify speaker
            const speakerResult = await this.verifyField(
                'Speaker Name',
                quote.speaker_name,
                quote.speaker_name !== 'UNKNOWN' ? 'high' : 'low'
            );

            if (!speakerResult.correct) {
                corrections.push({
                    field: `quote_${i + 1}_speaker`,
                    ...speakerResult
                });
            }

            // Verify title if present
            if (quote.speaker_title) {
                const titleResult = await this.verifyField(
                    'Speaker Title',
                    quote.speaker_title,
                    'medium'
                );

                if (!titleResult.correct) {
                    corrections.push({
                        field: `quote_${i + 1}_title`,
                        ...titleResult
                    });
                }
            }
        }

        return corrections;
    }

    // Full verification workflow for one file
    async verifyFile(filePath) {
        this.currentFile = filePath;
        console.log(`\n${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}VERIFYING: ${path.basename(filePath)}${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}${'='.repeat(80)}${colors.reset}\n`);

        // Parse the file
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = parseReleaseToJSON(content);
        this.currentResult = result;

        // Display parsed result
        this.displayParseResult(result);

        // Start verification
        const fileCorrections = {
            file: path.basename(filePath),
            timestamp: new Date().toISOString(),
            fields: []
        };

        // Quick accept all?
        const quickAccept = await this.ask(`\n${colors.bright}Accept all fields? (y/n):${colors.reset} `);
        if (quickAccept.toLowerCase() === 'y') {
            console.log(`${colors.green}✓ All fields accepted${colors.reset}`);
            return fileCorrections;
        }

        // Verify headline
        const headlineResult = await this.verifyField('Headline', result.headline, 'high');
        if (!headlineResult.skipped && !headlineResult.correct) {
            fileCorrections.fields.push({ field: 'headline', ...headlineResult });
        }

        // Verify date
        const dateline = result.dateline || {};
        const dateResult = await this.verifyField('Date', dateline.date, dateline.confidence);
        if (!dateResult.skipped && !dateResult.correct) {
            fileCorrections.fields.push({ field: 'date', ...dateResult });
        }

        // Verify location
        const locationResult = await this.verifyField('Location', dateline.location, dateline.confidence);
        if (!locationResult.skipped && !locationResult.correct) {
            fileCorrections.fields.push({ field: 'location', ...locationResult });
        }

        // Verify lead paragraph
        const leadResult = await this.verifyField('Lead Paragraph',
            result.lead_paragraph ? result.lead_paragraph.substring(0, 100) + '...' : null,
            'high');
        if (!leadResult.skipped && !leadResult.correct) {
            fileCorrections.fields.push({ field: 'lead_paragraph', ...leadResult });
        }

        // Verify quotes
        const quoteCorrections = await this.verifyQuotes(result.quotes);
        fileCorrections.fields.push(...quoteCorrections);

        // Summary
        if (fileCorrections.fields.length > 0) {
            console.log(`\n${colors.yellow}⚠ ${fileCorrections.fields.length} correction(s) recorded${colors.reset}`);
        } else {
            console.log(`\n${colors.green}✓ No corrections needed${colors.reset}`);
        }

        return fileCorrections;
    }

    // Save corrections to file
    saveCorrections(outputPath) {
        const data = {
            session: new Date().toISOString(),
            total_files: this.corrections.length,
            corrections: this.corrections
        };

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`\n${colors.green}✓ Corrections saved to: ${outputPath}${colors.reset}`);
    }

    // Main verification loop
    async run(files) {
        console.log(`${colors.bright}${colors.cyan}Parser Verification Tool${colors.reset}`);
        console.log(`Files to verify: ${files.length}\n`);

        for (let i = 0; i < files.length; i++) {
            console.log(`\n${colors.dim}[${i + 1}/${files.length}]${colors.reset}`);

            const corrections = await this.verifyFile(files[i]);
            this.corrections.push(corrections);

            // Continue?
            if (i < files.length - 1) {
                const continueResponse = await this.ask(`\n${colors.bright}Continue to next file? (y/n/q to quit):${colors.reset} `);
                if (continueResponse.toLowerCase() === 'n' || continueResponse.toLowerCase() === 'q') {
                    console.log('\nStopping verification session.');
                    break;
                }
            }
        }

        // Save corrections
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const outputPath = path.join(__dirname, `verification-corrections-${timestamp}.json`);
        this.saveCorrections(outputPath);

        this.rl.close();
        console.log(`\n${colors.bright}${colors.green}Verification session complete!${colors.reset}\n`);
    }
}

// CLI Entry Point
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node verify-parser.js <file1> [file2] [file3] ...');
        console.log('   or: node verify-parser.js cpo_examples/*.txt');
        console.log('\nExample:');
        console.log('  node verify-parser.js cpo_examples/aoc_01_kirk.txt');
        console.log('  node verify-parser.js cpo_examples/sherrill_*.txt');
        process.exit(1);
    }

    const files = args.filter(f => fs.existsSync(f));

    if (files.length === 0) {
        console.error('Error: No valid files found');
        process.exit(1);
    }

    const verifier = new ParserVerifier();
    await verifier.run(files);
}

// Run if called directly
if (require.main === module) {
    main().catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
}

module.exports = { ParserVerifier };
