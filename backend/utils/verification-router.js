/**
 * Unified Verification Router
 * Intelligently routes claims to the appropriate verification system
 */

const ComparativeVerifier = require('./comparative-verifier');
const FactCheckPipeline = require('./fact-check-pipeline');
const PressReleaseParser = require('./press-release-parser');

class VerificationRouter {
    constructor(webSearchFn = null) {
        this.webSearchFn = webSearchFn;
        this.parser = new PressReleaseParser();
        this.comparativeVerifier = new ComparativeVerifier(webSearchFn);
        this.factCheckPipeline = new FactCheckPipeline(webSearchFn);
    }

    /**
     * Determine which verification system to use for a claim
     * Returns: 'comparative' | 'structured' | 'standard'
     */
    determineVerificationMethod(claim) {
        // Check if it's a comparative claim
        const isComparative = this.isComparativeClaim(claim);
        if (isComparative) {
            return 'comparative';
        }

        // Check if it has structured data worth extracting
        const hasStructuredData = this.hasStructuredData(claim);
        if (hasStructuredData) {
            return 'structured';
        }

        // Default to standard verification
        return 'standard';
    }

    /**
     * Check if claim is a comparative type
     */
    isComparativeClaim(claim) {
        // If claim.type is an array
        if (Array.isArray(claim.type)) {
            return claim.type.includes('comparative-claim');
        }

        // If claim.type is a string
        if (typeof claim.type === 'string') {
            return claim.type === 'comparative-claim';
        }

        // Check verification_type
        if (claim.verification_type === 'multi-step-comparative') {
            return true;
        }

        // Check if it matches comparative patterns
        const detection = this.parser.detectComparativeClaim(claim.text);
        return detection.is_comparative;
    }

    /**
     * Check if claim has data worth structuring
     */
    hasStructuredData(claim) {
        const text = claim.text;

        // Has numbers or percentages
        const hasNumbers = /\d/.test(text);

        // Has action verbs (voted, raised, filed, etc.)
        const hasAction = /\b(voted|raised|filed|announced|introduced|opposed|supported|claimed|said)\b/i.test(text);

        // Has time references
        const hasTime = /\b(last year|this year|\d{4}|yesterday|today|Q[1-4]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(text);

        // Worth structuring if it has at least 2 of these
        const score = (hasNumbers ? 1 : 0) + (hasAction ? 1 : 0) + (hasTime ? 1 : 0);
        return score >= 2;
    }

    /**
     * Route a single claim to appropriate verifier
     */
    async verifyClaim(claim, options = {}) {
        const method = this.determineVerificationMethod(claim);

        const result = {
            claim_text: claim.text,
            verification_method: method,
            verification_date: new Date().toISOString(),
            original_claim: claim
        };

        try {
            switch (method) {
                case 'comparative':
                    result.verification = await this.verifyComparative(claim, options);
                    break;

                case 'structured':
                    result.verification = await this.verifyStructured(claim, options);
                    break;

                case 'standard':
                default:
                    result.verification = await this.verifyStandard(claim, options);
                    break;
            }

            result.success = true;
        } catch (error) {
            result.success = false;
            result.error = error.message;
            result.verification = {
                status: 'ERROR',
                confidence: 0,
                notes: `Verification failed: ${error.message}`
            };
        }

        return result;
    }

    /**
     * Verify using comparative verifier
     */
    async verifyComparative(claim, options) {
        const detection = this.parser.detectComparativeClaim(claim.text);
        detection.text = claim.text;

        const verification = await this.comparativeVerifier.verify(detection, this.parser);

        return {
            method: 'comparative',
            comparison_type: verification.comparison_type,
            verdict: verification.verdict,
            confidence: verification.confidence,
            left_value: verification.left_value,
            right_value: verification.right_value,
            calculated_result: verification.calculated_result,
            expected_result: verification.expected_result,
            search_queries: verification.search_queries,
            data_extraction_log: verification.data_extraction_log,
            calculation_steps: verification.calculation_steps,
            notes: verification.notes,
            sources: verification.sources || []
        };
    }

    /**
     * Verify using structured fact-check pipeline
     */
    async verifyStructured(claim, options) {
        const {
            deniabilityScore = 0.0,
            deniabilityLabels = [],
            fallbackActor = ''
        } = options;

        const structuredClaim = await this.factCheckPipeline.processSentence(
            claim.text,
            {
                docId: options.docId || 'SINGLE',
                sentenceId: options.sentenceId || 1,
                deniabilityScore: deniabilityScore,
                deniabilityLabels: deniabilityLabels,
                fallbackActor: fallbackActor
            }
        );

        return {
            method: 'structured',
            predicate: structuredClaim.claim.predicate,
            actor: structuredClaim.claim.actor,
            action: structuredClaim.claim.action,
            object: structuredClaim.claim.object,
            quantity: structuredClaim.claim.quantity,
            time: structuredClaim.claim.time,
            assertiveness: structuredClaim.claim.assertiveness,
            verdict: structuredClaim.verification.status,
            confidence: structuredClaim.verification.confidence,
            evidence: structuredClaim.verification.evidence,
            notes: structuredClaim.verification.notes
        };
    }

    /**
     * Verify using standard method (placeholder)
     */
    async verifyStandard(claim, options) {
        return {
            method: 'standard',
            verdict: 'MANUAL_VERIFICATION_REQUIRED',
            confidence: 0.5,
            notes: 'Standard verification requires manual fact-checking',
            evidence: []
        };
    }

    /**
     * Batch verify multiple claims with automatic routing
     */
    async verifyBatch(claims, options = {}) {
        const results = [];

        for (const claim of claims) {
            const result = await this.verifyClaim(claim, options);
            results.push(result);
        }

        return results;
    }

    /**
     * Get summary statistics from verification results
     */
    getSummaryStats(results) {
        const stats = {
            total: results.length,
            by_method: {
                comparative: 0,
                structured: 0,
                standard: 0
            },
            by_verdict: {},
            successful: 0,
            failed: 0,
            avg_confidence: 0
        };

        let totalConfidence = 0;

        for (const result of results) {
            // Count by method
            if (result.verification_method) {
                stats.by_method[result.verification_method]++;
            }

            // Count by verdict
            const verdict = result.verification?.verdict || result.verification?.status || 'UNKNOWN';
            stats.by_verdict[verdict] = (stats.by_verdict[verdict] || 0) + 1;

            // Success/failure
            if (result.success) {
                stats.successful++;
            } else {
                stats.failed++;
            }

            // Average confidence
            if (result.verification?.confidence) {
                totalConfidence += result.verification.confidence;
            }
        }

        if (results.length > 0) {
            stats.avg_confidence = Math.round((totalConfidence / results.length) * 100) / 100;
        }

        return stats;
    }
}

module.exports = VerificationRouter;
