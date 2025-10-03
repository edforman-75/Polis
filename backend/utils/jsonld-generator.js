/**
 * JSON-LD Generator
 *
 * Generates schema.org-compliant JSON-LD for press releases
 * using CPO (Campaign Press Ontology) templates
 */

const fs = require('fs');
const path = require('path');

class JSONLDGenerator {
    constructor() {
        this.templatesPath = path.join(__dirname, '../../cpo_templates');
        this.templates = {};
        this.loadTemplates();
    }

    /**
     * Load all JSON-LD templates
     */
    loadTemplates() {
        const templateFiles = {
            'press_release': 'press_release_template.jsonld',
            'statement': 'statement_template.jsonld',
            'policy': 'policy_release.jsonld',
            'endorsement': 'endorsement_release.jsonld',
            'fundraising': 'fundraising_release.jsonld',
            'crisis': 'crisis_release.jsonld',
            'mobilization': 'mobilization_release.jsonld',
            'operations': 'operations_release.jsonld',
            'news_article': 'news_article_variant.jsonld',
            'claimreview': 'claimreview_template.jsonld'
        };

        for (const [key, filename] of Object.entries(templateFiles)) {
            const filePath = path.join(this.templatesPath, filename);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                this.templates[key] = JSON.parse(content);
            } catch (error) {
                console.error(`Error loading template ${filename}:`, error.message);
            }
        }
    }

    /**
     * Generate JSON-LD from parsed content and fact-checking results
     *
     * @param {Object} parseResult - Result from PressReleaseParser.parse()
     * @param {Object} factCheckResults - Results from fact-checking system
     * @param {Object} metadata - Additional metadata (author, URLs, etc.)
     * @returns {Object} - Complete JSON-LD object
     */
    generate(parseResult, factCheckResults = null, metadata = {}) {
        // Determine which template to use based on release type
        const releaseType = parseResult.type?.toLowerCase() || 'press_release';
        const templateKey = this.getTemplateKey(releaseType);
        const template = JSON.parse(JSON.stringify(this.templates[templateKey] || this.templates['press_release']));

        // Populate basic fields
        this.populateBasicFields(template, parseResult, metadata);

        // Add CPO-specific fields
        this.populateCPOFields(template, parseResult, metadata);

        // Add claims if fact-checking results are available
        if (factCheckResults && factCheckResults.length > 0) {
            this.populateClaims(template, factCheckResults, metadata);
        }

        // Add CTA if detected
        this.populateCTA(template, parseResult, metadata);

        // Clean up template placeholders
        this.cleanupPlaceholders(template);

        return template;
    }

    /**
     * Get appropriate template key based on release type
     */
    getTemplateKey(releaseType) {
        const typeMap = {
            'statement': 'statement',
            'policy': 'policy',
            'endorsement': 'endorsement',
            'fundraising': 'fundraising',
            'crisis': 'crisis',
            'clarification': 'crisis',
            'mobilization': 'mobilization',
            'operations': 'operations',
            'news': 'news_article',
            'announcement': 'press_release'
        };

        return typeMap[releaseType] || 'press_release';
    }

    /**
     * Populate basic schema.org fields
     */
    populateBasicFields(template, parseResult, metadata) {
        // Headline
        if (parseResult.headline) {
            template.headline = parseResult.headline;
        }

        // Date
        const publishDate = metadata.datePublished || new Date().toISOString().split('T')[0];
        template.datePublished = publishDate;

        // @id and URL
        if (metadata.slug) {
            template['@id'] = `${metadata.baseUrl || 'https://example.org'}/press/${metadata.slug}`;
        }

        // Author/Organization
        if (metadata.organizationName) {
            template.author = template.author || {};
            template.author.name = metadata.organizationName;

            if (metadata.organizationUrl) {
                template.author.url = metadata.organizationUrl;
            }

            if (metadata.pressEmail) {
                template.author.contactPoint = template.author.contactPoint || {
                    "@type": "ContactPoint",
                    "contactType": "press"
                };
                template.author.contactPoint.email = metadata.pressEmail;
            }
        }

        // Article body
        if (parseResult.fullText) {
            template.articleBody = parseResult.fullText;
        }

        // Language
        template.inLanguage = metadata.language || 'en';

        return template;
    }

    /**
     * Populate CPO-specific fields
     */
    populateCPOFields(template, parseResult, metadata) {
        // Release type
        if (parseResult.type) {
            template['cpo:releaseType'] = parseResult.type.toLowerCase();
        }

        // Subtype (from parser's detected subtypes)
        if (parseResult.subtypes && parseResult.subtypes.length > 0) {
            // Use the highest confidence subtype
            const primarySubtype = parseResult.subtypes[0];
            template['cpo:subtype'] = primarySubtype.subtype || primarySubtype.code || primarySubtype;
        }

        // Tone
        if (parseResult.tone) {
            template['cpo:tone'] = parseResult.tone;
        } else if (parseResult.type) {
            // Infer tone from type
            const toneMap = {
                'crisis': 'neutral',
                'clarification': 'neutral',
                'contrast': 'contrast',
                'attack': 'contrast',
                'policy': 'positive',
                'endorsement': 'positive',
                'fundraising': 'positive',
                'mobilization': 'positive'
            };
            template['cpo:tone'] = toneMap[parseResult.type.toLowerCase()] || 'neutral';
        }

        // Issue areas
        if (parseResult.issues && parseResult.issues.length > 0) {
            // Use primary issue
            const primaryIssue = parseResult.issues[0];
            const issueValue = typeof primaryIssue === 'string' ? primaryIssue : primaryIssue.issue;
            template['cpo:issueArea'] = issueValue.toLowerCase();
        }

        return template;
    }

    /**
     * Populate claims array with fact-checking results
     */
    populateClaims(template, factCheckResults, metadata) {
        if (!Array.isArray(factCheckResults) || factCheckResults.length === 0) {
            return template;
        }

        template['cpo:claims'] = factCheckResults.map((claim, index) => {
            const claimObj = {
                "@type": "cpo:Claim",
                "@id": `claim:${metadata.slug || 'release'}-${index + 1}`,
                "cpo:claimText": claim.text || claim.claim_text
            };

            // Add verification status if available
            if (claim.verification_status || claim.verdict) {
                claimObj['cpo:verificationStatus'] = claim.verification_status || claim.verdict;
            }

            // Add confidence score
            if (claim.confidence !== undefined) {
                claimObj['cpo:confidence'] = claim.confidence;
            }

            // Add evidence sources
            if (claim.sources && claim.sources.length > 0) {
                claimObj['cpo:evidence'] = claim.sources.map(source => ({
                    "@type": "CreativeWork",
                    "url": source.url || source,
                    "name": source.name || source.title,
                    "cpo:excerpt": source.excerpt || ""
                }));
            }

            // Add manual references if available
            if (claim.manual_references && claim.manual_references.length > 0) {
                if (!claimObj['cpo:evidence']) {
                    claimObj['cpo:evidence'] = [];
                }

                claim.manual_references.forEach(ref => {
                    if (ref.validation_status === 'valid') {
                        claimObj['cpo:evidence'].push({
                            "@type": "CreativeWork",
                            "url": ref.url,
                            "name": ref.title || "Reference",
                            "description": ref.description || "",
                            "cpo:substantiationStatus": ref.substantiation_status,
                            "cpo:substantiationConfidence": ref.substantiation_confidence
                        });
                    }
                });
            }

            return claimObj;
        });

        return template;
    }

    /**
     * Populate call-to-action
     */
    populateCTA(template, parseResult, metadata) {
        // Check if CTA is already in metadata
        if (metadata.cta) {
            template['cpo:cta'] = {
                "@type": "cpo:CTA",
                "cpo:type": metadata.cta.type || "learn",
                "url": metadata.cta.url
            };
            return template;
        }

        // Try to detect CTA from content
        const ctaPatterns = {
            'donate': /donate|contribute|chip in|give/i,
            'volunteer': /volunteer|join (us|our team)|get involved/i,
            'rsvp': /rsvp|register|sign up|attend/i,
            'share': /share|spread the word|tell your friends/i,
            'learn': /learn more|read more|visit|find out/i
        };

        const text = parseResult.fullText || '';

        for (const [type, pattern] of Object.entries(ctaPatterns)) {
            if (pattern.test(text)) {
                template['cpo:cta'] = {
                    "@type": "cpo:CTA",
                    "cpo:type": type,
                    "url": metadata.baseUrl || "https://example.org"
                };
                break;
            }
        }

        return template;
    }

    /**
     * Generate ClaimReview JSON-LD for a specific claim
     */
    generateClaimReview(claim, metadata = {}) {
        const template = JSON.parse(JSON.stringify(this.templates['claimreview']));

        // Basic fields
        template['@id'] = `${metadata.baseUrl || 'https://example.org'}/fact/checks/${metadata.slug || 'claim'}`;
        template.url = template['@id'];
        template.datePublished = metadata.datePublished || new Date().toISOString().split('T')[0];

        // Author
        template.author.name = metadata.organizationName
            ? `${metadata.organizationName} Fact Desk`
            : "Campaign Fact Desk";

        // Claim text
        template.claimReviewed = claim.text || claim.claim_text;

        // Rating
        if (claim.verification_status || claim.verdict) {
            const ratingMap = {
                'TRUE': { value: 5, name: 'True' },
                'MOSTLY_TRUE': { value: 4, name: 'Mostly True' },
                'HALF_TRUE': { value: 3, name: 'Half True' },
                'MOSTLY_FALSE': { value: 2, name: 'Mostly False' },
                'FALSE': { value: 1, name: 'False' },
                'UNSUPPORTED': { value: 0, name: 'Unverified' }
            };

            const status = (claim.verification_status || claim.verdict).toUpperCase();
            const rating = ratingMap[status] || { value: 0, name: 'Unverified' };

            template.reviewRating.ratingValue = rating.value.toString();
            template.reviewRating.alternateName = rating.name;
        }

        // Item reviewed (original source)
        if (metadata.originReleaseUrl) {
            template.itemReviewed['@id'] = metadata.originReleaseUrl;
        }

        return template;
    }

    /**
     * Generate SEO meta tags
     */
    generateSEOMetaTags(jsonld, content, metadata = {}) {
        const title = jsonld.headline || 'Press Release';
        const description = this.extractMetaDescription(content);
        const url = jsonld['@id'] || metadata.baseUrl || '';
        const imageUrl = metadata.imageUrl || '';
        const author = jsonld.author?.name || '';
        const keywords = this.extractKeywords(content, jsonld);

        return `
    <!-- Basic SEO -->
    <meta name="description" content="${this.escapeHtml(description)}">
    <meta name="keywords" content="${this.escapeHtml(keywords)}">
    <meta name="author" content="${this.escapeHtml(author)}">
    <link rel="canonical" href="${url}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${this.escapeHtml(title)}">
    <meta property="og:description" content="${this.escapeHtml(description)}">
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
    <meta property="og:site_name" content="${this.escapeHtml(author)}">
    <meta property="article:published_time" content="${jsonld.datePublished}">
    ${jsonld['cpo:issueArea'] ? `<meta property="article:section" content="${jsonld['cpo:issueArea']}">` : ''}
    ${jsonld['cpo:releaseType'] ? `<meta property="article:tag" content="${jsonld['cpo:releaseType']}">` : ''}

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url}">
    <meta name="twitter:title" content="${this.escapeHtml(title)}">
    <meta name="twitter:description" content="${this.escapeHtml(description)}">
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}

    <!-- Additional SEO -->
    <meta name="robots" content="index, follow">
    <meta name="language" content="${jsonld.inLanguage || 'en'}">
    <meta name="revisit-after" content="7 days">
    <meta name="rating" content="general">`;
    }

    /**
     * Extract meta description from content
     */
    extractMetaDescription(content) {
        // Get first paragraph or first 160 chars
        const firstPara = content.split('\n\n').find(p => p.trim().length > 50);
        if (firstPara) {
            return this.truncate(firstPara.replace(/\s+/g, ' ').trim(), 160);
        }
        return this.truncate(content.replace(/\s+/g, ' ').trim(), 160);
    }

    /**
     * Extract keywords from content and JSON-LD
     */
    extractKeywords(content, jsonld) {
        const keywords = [];

        // Add issue area
        if (jsonld['cpo:issueArea']) {
            keywords.push(jsonld['cpo:issueArea'].replace(/_/g, ' '));
        }

        // Add release type
        if (jsonld['cpo:releaseType']) {
            keywords.push(jsonld['cpo:releaseType'].replace(/_/g, ' '));
        }

        // Add author name
        if (jsonld.author?.name) {
            keywords.push(jsonld.author.name);
        }

        // Add common political keywords from content
        const politicalTerms = [
            'campaign', 'congress', 'senate', 'house', 'legislation',
            'policy', 'healthcare', 'economy', 'veterans', 'education'
        ];

        politicalTerms.forEach(term => {
            if (new RegExp(`\\b${term}\\b`, 'i').test(content)) {
                keywords.push(term);
            }
        });

        return keywords.slice(0, 10).join(', ');
    }

    /**
     * Generate complete HTML with embedded JSON-LD and SEO meta tags
     */
    generateHTML(jsonld, content, metadata = {}) {
        const title = jsonld.headline || 'Press Release';
        const date = jsonld.datePublished || new Date().toISOString().split('T')[0];

        return `<!DOCTYPE html>
<html lang="${jsonld.inLanguage || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
${this.generateSEOMetaTags(jsonld, content, metadata)}

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
    </script>

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
        }
        .press-release-header {
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .release-type {
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            margin-bottom: 10px;
        }
        h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
            line-height: 1.2;
        }
        .date {
            color: #666;
            font-size: 14px;
        }
        .content {
            white-space: pre-wrap;
        }
        .contact {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <article class="press-release">
        <header class="press-release-header">
            <div class="release-type">${this.escapeHtml(jsonld['cpo:releaseType'] || 'Press Release')}</div>
            <h1>${this.escapeHtml(title)}</h1>
            <div class="date">${date}</div>
        </header>

        <div class="content">
${this.escapeHtml(content)}
        </div>

        ${metadata.pressEmail ? `
        <div class="contact">
            <strong>Press Contact:</strong> ${this.escapeHtml(metadata.pressEmail)}
        </div>
        ` : ''}
    </article>
</body>
</html>`;
    }

    /**
     * Helper: Escape HTML special characters
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Helper: Truncate text to specified length
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength - 3) + '...';
    }

    /**
     * Clean up template placeholders from JSON-LD
     * Removes fields that still have placeholder values like "<value1|value2|...>" or "<placeholder>"
     */
    cleanupPlaceholders(obj) {
        // Check for placeholder patterns
        const isPlaceholder = (value) => {
            if (typeof value !== 'string') return false;
            // Match placeholders like <value1|value2> or <placeholder> or URLs with <placeholder>
            return (value.startsWith('<') && value.endsWith('>')) ||
                   (value.includes('/<') && value.includes('>'));
        };

        // Recursively clean object
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];

                if (isPlaceholder(value)) {
                    // Remove fields with placeholder values
                    delete obj[key];
                } else if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                        // Clean array items
                        obj[key] = value.filter(item => {
                            if (isPlaceholder(item)) return false;
                            if (typeof item === 'object') {
                                this.cleanupPlaceholders(item);
                                // Remove if object is now empty
                                return Object.keys(item).length > 0;
                            }
                            return true;
                        });
                        // Remove array if empty
                        if (obj[key].length === 0) {
                            delete obj[key];
                        }
                    } else {
                        // Recursively clean nested objects
                        this.cleanupPlaceholders(value);
                        // Remove if object is now empty or only has @type
                        const keys = Object.keys(value);
                        if (keys.length === 0 || (keys.length === 1 && keys[0] === '@type')) {
                            delete obj[key];
                        }
                    }
                }
            }
        }
    }
}

module.exports = JSONLDGenerator;
