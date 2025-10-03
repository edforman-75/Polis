/**
 * JSON-LD Validator
 *
 * Validates JSON-LD against schema.org and CPO requirements
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class JSONLDValidator {
    constructor() {
        this.ajv = new Ajv({
            allErrors: true,
            strict: false,
            allowUnionTypes: true
        });
        addFormats(this.ajv);

        this.schema = this.buildSchema();
    }

    /**
     * Build JSON Schema for CPO JSON-LD validation
     */
    buildSchema() {
        return {
            type: 'object',
            required: ['@context', '@type', 'headline', 'datePublished'],
            properties: {
                '@context': {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string' }
                },
                '@type': {
                    oneOf: [
                        { type: 'string' },
                        {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    ]
                },
                '@id': {
                    type: 'string',
                    format: 'uri'
                },
                'headline': {
                    type: 'string',
                    minLength: 10,
                    maxLength: 200
                },
                'datePublished': {
                    type: 'string',
                    pattern: '^\\d{4}-\\d{2}-\\d{2}'
                },
                'inLanguage': {
                    type: 'string',
                    pattern: '^[a-z]{2}(-[A-Z]{2})?$'
                },
                'author': {
                    type: 'object',
                    required: ['@type', 'name'],
                    properties: {
                        '@type': {
                            type: 'string',
                            enum: ['Person', 'Organization']
                        },
                        'name': { type: 'string' },
                        'url': {
                            type: 'string',
                            format: 'uri'
                        },
                        'contactPoint': {
                            type: 'object',
                            properties: {
                                '@type': {
                                    type: 'string',
                                    const: 'ContactPoint'
                                },
                                'contactType': { type: 'string' },
                                'email': {
                                    type: 'string',
                                    format: 'email'
                                }
                            }
                        }
                    }
                },
                'articleBody': {
                    type: 'string',
                    minLength: 50
                },
                'cpo:releaseType': {
                    type: 'string',
                    enum: [
                        'announcement', 'news_release', 'statement', 'policy',
                        'endorsement', 'fundraising', 'contrast', 'attack',
                        'crisis', 'clarification', 'mobilization', 'operations',
                        'fact_sheet'
                    ]
                },
                'cpo:subtype': {
                    type: 'string'
                },
                'cpo:tone': {
                    type: 'string',
                    enum: ['positive', 'neutral', 'contrast']
                },
                'cpo:issueArea': {
                    type: 'string'
                },
                'cpo:cta': {
                    type: 'object',
                    required: ['@type', 'cpo:type', 'url'],
                    properties: {
                        '@type': {
                            type: 'string',
                            const: 'cpo:CTA'
                        },
                        'cpo:type': {
                            type: 'string',
                            enum: ['rsvp', 'donate', 'volunteer', 'share', 'learn']
                        },
                        'url': {
                            type: 'string',
                            format: 'uri'
                        }
                    }
                },
                'cpo:claims': {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['@type', '@id', 'cpo:claimText'],
                        properties: {
                            '@type': {
                                type: 'string',
                                const: 'cpo:Claim'
                            },
                            '@id': { type: 'string' },
                            'cpo:claimText': {
                                type: 'string',
                                minLength: 10
                            },
                            'cpo:verificationStatus': {
                                type: 'string',
                                enum: ['TRUE', 'MOSTLY_TRUE', 'HALF_TRUE', 'MOSTLY_FALSE', 'FALSE', 'UNSUPPORTED']
                            },
                            'cpo:confidence': {
                                type: 'number',
                                minimum: 0,
                                maximum: 1
                            },
                            'cpo:evidence': {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    required: ['@type'],
                                    properties: {
                                        '@type': {
                                            type: 'string',
                                            const: 'CreativeWork'
                                        },
                                        'url': {
                                            type: 'string',
                                            format: 'uri'
                                        },
                                        'name': { type: 'string' },
                                        'cpo:excerpt': { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * Validate JSON-LD against schema
     *
     * @param {Object} jsonld - JSON-LD object to validate
     * @returns {Object} - { valid: boolean, errors: array, warnings: array }
     */
    validate(jsonld) {
        const result = {
            valid: false,
            errors: [],
            warnings: [],
            recommendations: []
        };

        // Schema validation
        const validate = this.ajv.compile(this.schema);
        const valid = validate(jsonld);

        if (!valid && validate.errors) {
            result.errors = validate.errors.map(err => ({
                field: err.instancePath || err.dataPath || 'root',
                message: err.message,
                params: err.params
            }));
        } else {
            result.valid = true;
        }

        // Additional CPO-specific checks
        this.checkCPORequirements(jsonld, result);

        // Recommendations
        this.addRecommendations(jsonld, result);

        return result;
    }

    /**
     * Check CPO-specific requirements beyond schema
     */
    checkCPORequirements(jsonld, result) {
        // Check for @context includes CPO namespace
        if (Array.isArray(jsonld['@context'])) {
            const hasCPO = jsonld['@context'].some(ctx =>
                typeof ctx === 'string' && ctx.includes('campaign-press-ontology')
            );
            if (!hasCPO) {
                result.warnings.push({
                    field: '@context',
                    message: 'CPO namespace not found in @context'
                });
            }
        }

        // Check headline quality
        if (jsonld.headline) {
            if (jsonld.headline.length < 30) {
                result.warnings.push({
                    field: 'headline',
                    message: 'Headline is very short (< 30 chars). Consider making it more descriptive.'
                });
            }
            if (jsonld.headline.length > 120) {
                result.warnings.push({
                    field: 'headline',
                    message: 'Headline is very long (> 120 chars). Consider shortening for SEO.'
                });
            }
        }

        // Check for missing recommended fields
        if (!jsonld['cpo:issueArea']) {
            result.warnings.push({
                field: 'cpo:issueArea',
                message: 'Issue area not specified. This helps categorize content.'
            });
        }

        if (!jsonld['cpo:cta']) {
            result.warnings.push({
                field: 'cpo:cta',
                message: 'No call-to-action specified. Consider adding one.'
            });
        }

        // Check claims
        if (jsonld['cpo:claims'] && jsonld['cpo:claims'].length > 0) {
            jsonld['cpo:claims'].forEach((claim, index) => {
                if (!claim['cpo:evidence'] || claim['cpo:evidence'].length === 0) {
                    result.warnings.push({
                        field: `cpo:claims[${index}]`,
                        message: 'Claim has no evidence sources'
                    });
                }
                if (!claim['cpo:verificationStatus']) {
                    result.warnings.push({
                        field: `cpo:claims[${index}]`,
                        message: 'Claim has no verification status'
                    });
                }
            });
        }
    }

    /**
     * Add recommendations for improving JSON-LD
     */
    addRecommendations(jsonld, result) {
        // Recommend adding claims if none exist
        if (!jsonld['cpo:claims'] || jsonld['cpo:claims'].length === 0) {
            result.recommendations.push({
                field: 'cpo:claims',
                message: 'Consider adding factual claims with evidence to strengthen credibility'
            });
        }

        // Recommend subtype if missing
        if (!jsonld['cpo:subtype']) {
            result.recommendations.push({
                field: 'cpo:subtype',
                message: 'Adding a specific subtype helps categorize the release more precisely'
            });
        }

        // Check if @id is set
        if (!jsonld['@id']) {
            result.recommendations.push({
                field: '@id',
                message: 'Add a canonical URL (@id) for this content'
            });
        }
    }

    /**
     * Validate ClaimReview JSON-LD
     */
    validateClaimReview(jsonld) {
        const schema = {
            type: 'object',
            required: ['@type', 'claimReviewed', 'reviewRating'],
            properties: {
                '@type': {
                    type: 'string',
                    const: 'ClaimReview'
                },
                '@id': {
                    type: 'string',
                    format: 'uri'
                },
                'url': {
                    type: 'string',
                    format: 'uri'
                },
                'claimReviewed': {
                    type: 'string',
                    minLength: 10
                },
                'reviewRating': {
                    type: 'object',
                    required: ['@type', 'ratingValue'],
                    properties: {
                        '@type': {
                            type: 'string',
                            const: 'Rating'
                        },
                        'ratingValue': {
                            type: 'string',
                            pattern: '^[0-5]$'
                        },
                        'bestRating': {
                            type: 'string',
                            const: '5'
                        },
                        'alternateName': {
                            type: 'string'
                        }
                    }
                },
                'author': {
                    type: 'object',
                    required: ['@type', 'name']
                },
                'datePublished': {
                    type: 'string',
                    pattern: '^\\d{4}-\\d{2}-\\d{2}'
                }
            }
        };

        const validate = this.ajv.compile(schema);
        const valid = validate(jsonld);

        return {
            valid,
            errors: valid ? [] : validate.errors.map(err => ({
                field: err.instancePath || err.dataPath,
                message: err.message
            }))
        };
    }

    /**
     * Generate validation report
     */
    generateReport(validationResult) {
        let report = '';

        if (validationResult.valid) {
            report += '✅ JSON-LD is valid!\n\n';
        } else {
            report += '❌ JSON-LD validation failed\n\n';
            report += 'ERRORS:\n';
            validationResult.errors.forEach(err => {
                report += `  • ${err.field}: ${err.message}\n`;
            });
            report += '\n';
        }

        if (validationResult.warnings.length > 0) {
            report += 'WARNINGS:\n';
            validationResult.warnings.forEach(warn => {
                report += `  ⚠️  ${warn.field}: ${warn.message}\n`;
            });
            report += '\n';
        }

        if (validationResult.recommendations.length > 0) {
            report += 'RECOMMENDATIONS:\n';
            validationResult.recommendations.forEach(rec => {
                report += `  💡 ${rec.field}: ${rec.message}\n`;
            });
            report += '\n';
        }

        return report;
    }

    /**
     * Get Google Rich Results Test URL
     *
     * @param {string} htmlUrl - URL of the HTML page with embedded JSON-LD
     * @returns {string} - Google Rich Results Test URL
     */
    getGoogleValidatorUrl(htmlUrl) {
        const encoded = encodeURIComponent(htmlUrl);
        return `https://search.google.com/test/rich-results?url=${encoded}`;
    }

    /**
     * Get Schema.org Validator URL
     *
     * @param {Object} jsonld - JSON-LD object
     * @returns {string} - Schema.org validator URL with encoded JSON
     */
    getSchemaOrgValidatorUrl(jsonld) {
        // Note: Schema.org validator doesn't support direct URL encoding
        // Recommend using https://validator.schema.org/ and pasting JSON
        return 'https://validator.schema.org/';
    }

    /**
     * Validate using schema.org validator API (unofficial)
     * Note: This is not an official API and may be rate-limited
     *
     * @param {Object} jsonld - JSON-LD object to validate
     * @returns {Promise<Object>} - Validation result from schema.org
     */
    async validateWithSchemaOrg(jsonld) {
        try {
            const response = await fetch('https://validator.schema.org/validator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    code: JSON.stringify(jsonld),
                    format: 'json-ld',
                    validate: true
                })
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `Schema.org validator returned ${response.status}`,
                    note: 'This is an unofficial API endpoint that may be rate-limited or unavailable'
                };
            }

            const data = await response.json();
            return {
                success: true,
                schemaOrgResult: data,
                note: 'Validated using unofficial schema.org API endpoint'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                note: 'Schema.org API validation failed. Use web interface at https://validator.schema.org/'
            };
        }
    }

    /**
     * Comprehensive validation using all available methods
     *
     * @param {Object} jsonld - JSON-LD object to validate
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} - Complete validation report
     */
    async validateComprehensive(jsonld, options = {}) {
        const results = {
            ajv: null,
            schemaOrg: null,
            timestamp: new Date().toISOString()
        };

        // Always run AJV validation (fast, local)
        results.ajv = this.validate(jsonld);

        // Optionally validate with schema.org (slower, requires network)
        if (options.useSchemaOrg) {
            results.schemaOrg = await this.validateWithSchemaOrg(jsonld);
        }

        // Combined summary
        results.summary = {
            allValid: results.ajv.valid && (!results.schemaOrg || results.schemaOrg.success),
            ajvValid: results.ajv.valid,
            schemaOrgValid: results.schemaOrg?.success ?? null,
            totalErrors: results.ajv.errors.length,
            totalWarnings: results.ajv.warnings.length
        };

        return results;
    }
}

module.exports = JSONLDValidator;
