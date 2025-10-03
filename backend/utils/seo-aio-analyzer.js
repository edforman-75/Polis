/**
 * SEO + AIO Analyzer
 *
 * Analyzes press releases for optimization in:
 * - SEO: Traditional search engines (Google, Bing)
 * - AIO: AI-powered search (ChatGPT, Perplexity, Claude)
 */

class SEOAIOAnalyzer {
    constructor() {
        this.scores = {
            seo: 0,
            aio: 0,
            overall: 0
        };
        this.issues = [];
        this.recommendations = [];
    }

    /**
     * Analyze press release and JSON-LD for SEO + AIO optimization
     *
     * @param {string} content - Press release text
     * @param {Object} jsonld - Generated JSON-LD
     * @param {Object} parseResult - Parser output
     * @returns {Object} - Analysis report with scores and recommendations
     */
    analyze(content, jsonld, parseResult) {
        this.scores = { seo: 0, aio: 0, overall: 0 };
        this.issues = [];
        this.recommendations = [];

        // SEO Analysis
        this.analyzeSEO(content, jsonld, parseResult);

        // AIO Analysis
        this.analyzeAIO(content, jsonld, parseResult);

        // Calculate overall score
        this.scores.overall = Math.round((this.scores.seo + this.scores.aio) / 2);

        return {
            scores: this.scores,
            issues: this.issues,
            recommendations: this.recommendations,
            summary: this.generateSummary()
        };
    }

    /**
     * SEO Analysis - Traditional Search Engine Optimization
     */
    analyzeSEO(content, jsonld, parseResult) {
        let seoScore = 100;
        const seoIssues = [];

        // 1. Headline Analysis
        const headline = jsonld.headline || parseResult.headline;
        if (!headline) {
            seoScore -= 20;
            seoIssues.push({
                severity: 'critical',
                category: 'SEO',
                issue: 'Missing headline',
                recommendation: 'Add a clear, compelling headline'
            });
        } else {
            // Headline length
            if (headline.length < 30) {
                seoScore -= 5;
                seoIssues.push({
                    severity: 'warning',
                    category: 'SEO',
                    issue: 'Headline too short (< 30 chars)',
                    recommendation: `Expand headline to 50-70 characters. Current: ${headline.length} chars`
                });
            } else if (headline.length > 70) {
                seoScore -= 3;
                seoIssues.push({
                    severity: 'info',
                    category: 'SEO',
                    issue: 'Headline too long (> 70 chars)',
                    recommendation: `Shorten headline for better SERP display. Current: ${headline.length} chars`
                });
            }

            // Headline quality
            if (!/[0-9]/.test(headline) && !/\b(new|announces|launches|unveils)\b/i.test(headline)) {
                seoScore -= 3;
                seoIssues.push({
                    severity: 'info',
                    category: 'SEO',
                    issue: 'Headline could be more compelling',
                    recommendation: 'Consider adding numbers or action words (announces, launches, unveils)'
                });
            }
        }

        // 2. Meta Description (from content)
        const metaDescription = content.substring(0, 160);
        if (metaDescription.length < 120) {
            seoScore -= 5;
            seoIssues.push({
                severity: 'warning',
                category: 'SEO',
                issue: 'Lead paragraph too short for meta description',
                recommendation: 'First paragraph should be 120-160 characters for optimal meta description'
            });
        }

        // 3. Structured Data Completeness
        if (!jsonld['@id']) {
            seoScore -= 10;
            seoIssues.push({
                severity: 'error',
                category: 'SEO',
                issue: 'Missing canonical URL (@id)',
                recommendation: 'Add @id field with canonical URL for this content'
            });
        }

        if (!jsonld.datePublished) {
            seoScore -= 5;
            seoIssues.push({
                severity: 'error',
                category: 'SEO',
                issue: 'Missing publication date',
                recommendation: 'Add datePublished to improve freshness signals'
            });
        }

        if (!jsonld.author || !jsonld.author.name) {
            seoScore -= 5;
            seoIssues.push({
                severity: 'warning',
                category: 'SEO',
                issue: 'Missing author information',
                recommendation: 'Add author/organization name for E-A-T signals'
            });
        }

        // 4. Content Length
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 300) {
            seoScore -= 10;
            seoIssues.push({
                severity: 'warning',
                category: 'SEO',
                issue: `Content too short (${wordCount} words)`,
                recommendation: 'Aim for 300-800 words for better ranking potential'
            });
        }

        // 5. Keyword Optimization
        const issueArea = jsonld['cpo:issueArea'];
        if (issueArea) {
            const issueKeyword = issueArea.replace(/_/g, ' ');
            const keywordDensity = (content.toLowerCase().match(new RegExp(issueKeyword, 'g')) || []).length;
            if (keywordDensity < 2) {
                seoScore -= 3;
                seoIssues.push({
                    severity: 'info',
                    category: 'SEO',
                    issue: `Low keyword density for "${issueKeyword}"`,
                    recommendation: `Mention "${issueKeyword}" 2-3 times naturally throughout the content`
                });
            }
        }

        // 6. Call-to-Action
        if (!jsonld['cpo:cta']) {
            seoScore -= 5;
            seoIssues.push({
                severity: 'warning',
                category: 'SEO',
                issue: 'Missing call-to-action',
                recommendation: 'Add CTA to improve engagement signals and conversions'
            });
        }

        this.scores.seo = Math.max(0, seoScore);
        this.issues.push(...seoIssues);
    }

    /**
     * AIO Analysis - AI Optimization for AI-powered search
     */
    analyzeAIO(content, jsonld, parseResult) {
        let aioScore = 100;
        const aioIssues = [];

        // 1. Structured Data Richness (Critical for AI extraction)
        if (!jsonld['cpo:claims'] || jsonld['cpo:claims'].length === 0) {
            aioScore -= 20;
            aioIssues.push({
                severity: 'critical',
                category: 'AIO',
                issue: 'No structured claims with evidence',
                recommendation: 'Add cpo:claims array with factual claims and evidence sources for AI fact-checking'
            });
        } else {
            // Check claim quality
            jsonld['cpo:claims'].forEach((claim, idx) => {
                if (!claim['cpo:evidence'] || claim['cpo:evidence'].length === 0) {
                    aioScore -= 5;
                    aioIssues.push({
                        severity: 'warning',
                        category: 'AIO',
                        issue: `Claim ${idx + 1} lacks evidence sources`,
                        recommendation: 'Add cpo:evidence array with authoritative sources for AI verification'
                    });
                }

                if (!claim['cpo:verificationStatus']) {
                    aioScore -= 3;
                    aioIssues.push({
                        severity: 'info',
                        category: 'AIO',
                        issue: `Claim ${idx + 1} missing verification status`,
                        recommendation: 'Add cpo:verificationStatus (TRUE/FALSE/UNSUPPORTED) for AI trust signals'
                    });
                }
            });
        }

        // 2. Entity Definition (Critical for knowledge graphs)
        if (!jsonld.author || !jsonld.author['@type']) {
            aioScore -= 10;
            aioIssues.push({
                severity: 'error',
                category: 'AIO',
                issue: 'Author entity not properly defined',
                recommendation: 'Define author as Organization or Person with @type for entity recognition'
            });
        }

        // 3. Context Completeness
        if (!jsonld['cpo:releaseType']) {
            aioScore -= 10;
            aioIssues.push({
                severity: 'error',
                category: 'AIO',
                issue: 'Missing release type classification',
                recommendation: 'Add cpo:releaseType to help AI understand content purpose'
            });
        }

        if (!jsonld['cpo:issueArea']) {
            aioScore -= 5;
            aioIssues.push({
                severity: 'warning',
                category: 'AIO',
                issue: 'Missing issue area categorization',
                recommendation: 'Add cpo:issueArea to help AI categorize and retrieve content'
            });
        }

        if (!jsonld['cpo:tone']) {
            aioScore -= 3;
            aioIssues.push({
                severity: 'info',
                category: 'AIO',
                issue: 'Missing tone indicator',
                recommendation: 'Add cpo:tone (positive/neutral/contrast) for sentiment analysis'
            });
        }

        // 4. Answer-Style Content (For AI extraction)
        const hasQuotes = /"([^"]+)"/.test(content);
        if (!hasQuotes) {
            aioScore -= 5;
            aioIssues.push({
                severity: 'info',
                category: 'AIO',
                issue: 'No direct quotes found',
                recommendation: 'Include direct quotes for AI to extract authoritative statements'
            });
        }

        // Check for question-answer patterns
        const hasQA = /\b(what|why|how|when|where|who)\b.*\?/i.test(content);
        if (!hasQA) {
            aioIssues.push({
                severity: 'info',
                category: 'AIO',
                issue: 'No Q&A format detected',
                recommendation: 'Consider adding FAQ-style content to improve AI answer extraction'
            });
        }

        // 5. Factual Precision (Numbers, dates, specifics)
        const numberCount = (content.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
        if (numberCount < 3) {
            aioScore -= 5;
            aioIssues.push({
                severity: 'warning',
                category: 'AIO',
                issue: 'Limited quantitative data',
                recommendation: 'Add specific numbers, percentages, or statistics for AI fact extraction'
            });
        }

        // 6. Source Attribution
        const hasURLs = /(https?:\/\/[^\s]+)/g.test(content);
        const hasSourceMentions = /\b(according to|source:|via|reported by)\b/i.test(content);
        if (!hasURLs && !hasSourceMentions && (!jsonld['cpo:claims'] || jsonld['cpo:claims'].length === 0)) {
            aioScore -= 10;
            aioIssues.push({
                severity: 'warning',
                category: 'AIO',
                issue: 'No source attribution detected',
                recommendation: 'Add sources or citations for AI to verify claims and build trust'
            });
        }

        // 7. Semantic Clarity
        const avgSentenceLength = content.split(/[.!?]+/).reduce((acc, s) => {
            const words = s.trim().split(/\s+/).length;
            return acc + words;
        }, 0) / (content.split(/[.!?]+/).length || 1);

        if (avgSentenceLength > 25) {
            aioScore -= 5;
            aioIssues.push({
                severity: 'info',
                category: 'AIO',
                issue: 'Complex sentence structure',
                recommendation: 'Simplify sentences (avg < 25 words) for better AI parsing and extraction'
            });
        }

        this.scores.aio = Math.max(0, aioScore);
        this.issues.push(...aioIssues);
    }

    /**
     * Generate summary and recommendations
     */
    generateSummary() {
        const seoGrade = this.getGrade(this.scores.seo);
        const aioGrade = this.getGrade(this.scores.aio);
        const overallGrade = this.getGrade(this.scores.overall);

        // Priority recommendations (top 5 most impactful)
        const priorityRecs = this.issues
            .filter(i => i.severity === 'critical' || i.severity === 'error')
            .slice(0, 5)
            .map(i => i.recommendation);

        return {
            seoGrade,
            aioGrade,
            overallGrade,
            readyToPublish: this.scores.overall >= 70,
            criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
            priorityRecommendations: priorityRecs,
            status: this.getStatus()
        };
    }

    /**
     * Get letter grade from score
     */
    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Get overall status
     */
    getStatus() {
        if (this.scores.overall >= 90) return 'Excellent - Highly optimized for SEO & AIO';
        if (this.scores.overall >= 80) return 'Good - Well optimized, minor improvements possible';
        if (this.scores.overall >= 70) return 'Fair - Acceptable, but significant improvements recommended';
        if (this.scores.overall >= 60) return 'Poor - Major optimization needed';
        return 'Critical - Requires substantial revision';
    }

    /**
     * Generate detailed report
     */
    generateReport() {
        let report = '';

        report += '📊 SEO + AIO OPTIMIZATION REPORT\n';
        report += '='.repeat(70) + '\n\n';

        report += '🎯 SCORES:\n';
        report += `  SEO Score: ${this.scores.seo}/100 (${this.getGrade(this.scores.seo)})\n`;
        report += `  AIO Score: ${this.scores.aio}/100 (${this.getGrade(this.scores.aio)})\n`;
        report += `  Overall:   ${this.scores.overall}/100 (${this.getGrade(this.scores.overall)})\n\n`;

        const summary = this.generateSummary();
        report += `📝 Status: ${summary.status}\n`;
        report += `✅ Ready to Publish: ${summary.readyToPublish ? 'YES' : 'NO'}\n\n`;

        // Critical issues
        const critical = this.issues.filter(i => i.severity === 'critical');
        if (critical.length > 0) {
            report += '🚨 CRITICAL ISSUES:\n';
            critical.forEach(issue => {
                report += `  • ${issue.issue}\n`;
                report += `    → ${issue.recommendation}\n`;
            });
            report += '\n';
        }

        // Errors
        const errors = this.issues.filter(i => i.severity === 'error');
        if (errors.length > 0) {
            report += '❌ ERRORS:\n';
            errors.forEach(issue => {
                report += `  • [${issue.category}] ${issue.issue}\n`;
                report += `    → ${issue.recommendation}\n`;
            });
            report += '\n';
        }

        // Warnings
        const warnings = this.issues.filter(i => i.severity === 'warning');
        if (warnings.length > 0) {
            report += '⚠️  WARNINGS:\n';
            warnings.forEach(issue => {
                report += `  • [${issue.category}] ${issue.issue}\n`;
                report += `    → ${issue.recommendation}\n`;
            });
            report += '\n';
        }

        // Info/Tips
        const tips = this.issues.filter(i => i.severity === 'info');
        if (tips.length > 0) {
            report += '💡 OPTIMIZATION TIPS:\n';
            tips.forEach(issue => {
                report += `  • [${issue.category}] ${issue.issue}\n`;
                report += `    → ${issue.recommendation}\n`;
            });
            report += '\n';
        }

        return report;
    }
}

module.exports = SEOAIOAnalyzer;
