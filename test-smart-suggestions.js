#!/usr/bin/env node
/**
 * Test Smart Suggestions System
 * Tests autocomplete suggestions and error prediction
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Color helpers for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        http.get(url, (res) => {
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
        }).on('error', reject);
    });
}

function makePostRequest(path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const postData = JSON.stringify(body);

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

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
        req.write(postData);
        req.end();
    });
}

async function testSmartSuggestions() {
    console.log('\n' + colors.blue + '🧪 Testing Smart Suggestions System' + colors.reset);
    console.log(colors.gray + '═'.repeat(60) + colors.reset + '\n');

    const tests = [
        {
            name: 'Seed Some Corrections',
            test: async () => {
                const corrections = [
                    {
                        fieldName: 'headline',
                        originalValue: 'Smith Says Education',
                        correctedValue: 'Smith Says Education Funding Critical',
                        originalText: 'Sample press release 1'
                    },
                    {
                        fieldName: 'headline',
                        originalValue: 'Smith Says Education',
                        correctedValue: 'Smith Says Education Funding Critical',
                        originalText: 'Sample press release 2'
                    },
                    {
                        fieldName: 'headline',
                        originalValue: 'Jones Says Healthcare',
                        correctedValue: 'Jones Says Healthcare Reform Needed',
                        originalText: 'Sample press release 3'
                    }
                ];

                for (const correction of corrections) {
                    await makePostRequest('/api/press-release-parser/feedback/correction', {
                        sessionId: 'test_session',
                        originalText: correction.originalText,
                        parsedResult: { fields_data: { [correction.fieldName]: correction.originalValue } },
                        correctedResult: { [correction.fieldName]: correction.correctedValue },
                        fieldName: correction.fieldName,
                        originalValue: correction.originalValue,
                        correctedValue: correction.correctedValue
                    });
                }

                return { success: true, message: `Seeded ${corrections.length} corrections` };
            }
        },
        {
            name: 'Get Suggestions for "Smith Says Education"',
            test: async () => {
                const response = await makeRequest(
                    '/api/press-release-parser/feedback/suggestions/headline?value=Smith%20Says%20Education'
                );

                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }

                if (!response.data.success) {
                    throw new Error('Response not successful');
                }

                if (!response.data.suggestions || response.data.suggestions.length === 0) {
                    throw new Error('No suggestions returned');
                }

                return {
                    success: true,
                    suggestions: response.data.suggestions
                };
            }
        },
        {
            name: 'Predict Error for "Smith Says Education"',
            test: async () => {
                const response = await makeRequest(
                    '/api/press-release-parser/feedback/predict-error/headline?value=Smith%20Says%20Education'
                );

                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }

                if (!response.data.success) {
                    throw new Error('Response not successful');
                }

                return {
                    success: true,
                    likelyWrong: response.data.likelyWrong,
                    confidence: response.data.confidence
                };
            }
        },
        {
            name: 'Get Metrics After Corrections',
            test: async () => {
                const response = await makeRequest('/api/press-release-parser/feedback/metrics?field=headline');

                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }

                if (!response.data.success) {
                    throw new Error('Response not successful');
                }

                return {
                    success: true,
                    metrics: response.data.metrics
                };
            }
        },
        {
            name: 'Get Learned Patterns',
            test: async () => {
                const response = await makeRequest('/api/press-release-parser/feedback/patterns/headline');

                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}`);
                }

                if (!response.data.success) {
                    throw new Error('Response not successful');
                }

                return {
                    success: true,
                    patternCount: response.data.patterns.length
                };
            }
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        process.stdout.write(colors.gray + `  ${test.name}... ` + colors.reset);

        try {
            const result = await test.test();
            console.log(colors.green + '✓ PASS' + colors.reset);

            // Show additional info
            if (result.suggestions) {
                result.suggestions.forEach(s => {
                    console.log(colors.gray + `    → "${s.text}" (${Math.round(s.confidence * 100)}%)` + colors.reset);
                });
            }
            if (result.likelyWrong !== undefined) {
                console.log(colors.gray + `    → Likely wrong: ${result.likelyWrong} (confidence: ${Math.round(result.confidence * 100)}%)` + colors.reset);
            }
            if (result.metrics) {
                console.log(colors.gray + `    → Accuracy: ${Math.round((result.metrics.accuracy_rate || 0) * 100)}%` + colors.reset);
            }
            if (result.patternCount !== undefined) {
                console.log(colors.gray + `    → Patterns learned: ${result.patternCount}` + colors.reset);
            }
            if (result.message) {
                console.log(colors.gray + `    → ${result.message}` + colors.reset);
            }

            passed++;
        } catch (error) {
            console.log(colors.red + '✗ FAIL' + colors.reset);
            console.log(colors.red + `    Error: ${error.message}` + colors.reset);
            failed++;
        }
    }

    console.log('\n' + colors.gray + '═'.repeat(60) + colors.reset);
    console.log(colors.green + `✓ ${passed} passed` + colors.reset + ' | ' +
                (failed > 0 ? colors.red : colors.gray) + `✗ ${failed} failed` + colors.reset);
    console.log('');

    return failed === 0;
}

// Run tests
testSmartSuggestions().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error(colors.red + '\nFatal error:' + colors.reset, error);
    process.exit(1);
});
