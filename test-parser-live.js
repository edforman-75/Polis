#!/usr/bin/env node
/**
 * Live Parser Test
 * Shows exactly how the parser processes press releases
 */

const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    red: '\x1b[31m'
};

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {}
        };

        if (body) {
            const postData = JSON.stringify(body);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function testParser() {
    console.log('\n' + colors.cyan + colors.bright + '╔═══════════════════════════════════════════════════════════╗' + colors.reset);
    console.log(colors.cyan + colors.bright + '║          PRESS RELEASE PARSER - LIVE DEMO                ║' + colors.reset);
    console.log(colors.cyan + colors.bright + '╚═══════════════════════════════════════════════════════════╝' + colors.reset);

    // Read sample press release
    const pressRelease = fs.readFileSync('/tmp/sample-press-release.txt', 'utf-8');

    console.log('\n' + colors.blue + '📄 ORIGINAL PRESS RELEASE:' + colors.reset);
    console.log(colors.gray + '─'.repeat(63) + colors.reset);
    console.log(colors.gray + pressRelease.substring(0, 300) + '...' + colors.reset);

    // Parse the press release
    console.log('\n' + colors.yellow + '⚙️  PARSING...' + colors.reset);

    const parseResponse = await makeRequest('POST', '/api/press-release-parser/parse', {
        text: pressRelease
    });

    if (parseResponse.status !== 200 || !parseResponse.data.success) {
        console.log(colors.red + '\n❌ Parser error!' + colors.reset);
        return;
    }

    const parsed = parseResponse.data;
    const fields = parsed.parsed?.fields_data || parsed.fields_data || {};

    console.log(colors.green + '✅ PARSING COMPLETE!\n' + colors.reset);

    // Show extracted fields
    console.log(colors.cyan + '📋 EXTRACTED FIELDS:' + colors.reset);
    console.log(colors.gray + '─'.repeat(63) + colors.reset);

    const fieldNames = [
        'headline', 'dateline', 'lead_paragraph', 'body_paragraphs',
        'quotes', 'contact_name', 'contact_phone', 'contact_email'
    ];

    fieldNames.forEach(fieldName => {
        const value = fields[fieldName];
        if (value) {
            console.log(colors.blue + `\n${fieldName.toUpperCase().replace(/_/g, ' ')}:` + colors.reset);

            if (Array.isArray(value)) {
                value.forEach((item, i) => {
                    if (typeof item === 'object') {
                        console.log(colors.gray + `  ${i + 1}. "${item.text || JSON.stringify(item)}"` + colors.reset);
                        if (item.speaker) {
                            console.log(colors.gray + `     Speaker: ${item.speaker}` + colors.reset);
                        }
                    } else {
                        console.log(colors.gray + `  ${i + 1}. ${item}` + colors.reset);
                    }
                });
            } else if (typeof value === 'object') {
                console.log(colors.gray + `  ${JSON.stringify(value, null, 2)}` + colors.reset);
            } else {
                const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
                console.log(colors.gray + `  ${displayValue}` + colors.reset);
            }
        }
    });

    // Show metadata
    const metadata = parsed.parsed?.metadata || parsed.metadata;
    if (metadata) {
        console.log('\n' + colors.cyan + '📊 METADATA:' + colors.reset);
        console.log(colors.gray + '─'.repeat(63) + colors.reset);
        console.log(colors.gray + `  Word count: ${metadata.word_count || 'N/A'}` + colors.reset);
        console.log(colors.gray + `  Paragraph count: ${metadata.paragraph_count || 'N/A'}` + colors.reset);
        console.log(colors.gray + `  Quote count: ${metadata.has_quotes ? 'Yes' : 'No'}` + colors.reset);
        console.log(colors.gray + `  Inferred type: ${metadata.inferred_type || 'N/A'}` + colors.reset);
    }

    // Show field accuracy
    console.log('\n' + colors.cyan + '✅ FIELD EXTRACTION SUCCESS:' + colors.reset);
    console.log(colors.gray + '─'.repeat(63) + colors.reset);

    let extractedCount = 0;
    let totalFields = fieldNames.length;

    fieldNames.forEach(fieldName => {
        const value = fields[fieldName];
        const hasValue = value && (Array.isArray(value) ? value.length > 0 : value.toString().length > 0);

        if (hasValue) {
            extractedCount++;
            console.log(colors.green + `  ✓ ${fieldName.replace(/_/g, ' ')}` + colors.reset);
        } else {
            console.log(colors.gray + `  ○ ${fieldName.replace(/_/g, ' ')} (not found)` + colors.reset);
        }
    });

    const successRate = Math.round((extractedCount / totalFields) * 100);
    console.log('\n' + colors.cyan + `  Success Rate: ${successRate}% (${extractedCount}/${totalFields} fields)` + colors.reset);

    // Show confidence scores if available
    if (parsed.confidence_scores) {
        console.log('\n' + colors.cyan + '📈 CONFIDENCE SCORES:' + colors.reset);
        console.log(colors.gray + '─'.repeat(63) + colors.reset);
        Object.entries(parsed.confidence_scores).forEach(([field, score]) => {
            const percentage = Math.round(score * 100);
            const bar = '█'.repeat(Math.floor(percentage / 5));
            const color = percentage >= 80 ? colors.green : percentage >= 60 ? colors.yellow : colors.red;
            console.log(color + `  ${field.padEnd(20)} ${bar} ${percentage}%` + colors.reset);
        });
    }

    console.log('\n' + colors.green + colors.bright + '✨ Parser test complete!' + colors.reset);
    console.log('\n' + colors.cyan + '💡 TIP: Open http://localhost:3001/press-release-canvas.html' + colors.reset);
    console.log(colors.gray + '   Click "📋 Import Draft", paste this release, and see it parsed live!' + colors.reset);
    console.log('');
}

// Run test
testParser().catch(error => {
    console.error(colors.red + '\n❌ Test error:' + colors.reset, error.message);
    process.exit(1);
});
