/**
 * End-to-End Fact-Checking Pipeline
 * Connects: Deniability Detection → Claim Extraction → Source Linking → Verification
 */

const ClaimExtractor = require('./claim-extractor');
const { SourceLinkers } = require('./source-linkers');
const ClaimVerifier = require('./claim-verifier');

class FactCheckPipeline {
    constructor(webSearchFn = null) {
        this.extractor = new ClaimExtractor();
        this.sourceLinkers = new SourceLinkers(webSearchFn);
        this.verifier = new ClaimVerifier(this.sourceLinkers);
    }

    /**
     * Select assertive sentences worthy of fact-checking
     * Strategy:
     *   - assertiveness = 1 - min(1, deniability_score)
     *   - keep if assertiveness >= 0.5 OR contains numbers/dates
     */
    selectAssertiveSentences(doc) {
        const selected = [];

        for (let i = 0; i < doc.sentences.length; i++) {
            const sentence = doc.sentences[i];
            const pdFlags = doc.pd_flags && doc.pd_flags[i] ? doc.pd_flags[i] : { labels: [], score: 0.0 };

            const assertiveness = this.extractor.calculateAssertiveness(pdFlags.score || 0.0);
            const shouldCheck = this.extractor.shouldFactCheck(sentence, pdFlags.score || 0.0);

            if (shouldCheck) {
                selected.push({
                    sentence: sentence,
                    sentence_id: i + 1,
                    deniability_labels: pdFlags.labels || [],
                    assertiveness: assertiveness
                });
            }
        }

        return selected;
    }

    /**
     * Process a complete document through the fact-checking pipeline
     *
     * Expected doc format:
     * {
     *   doc_id: "PRESS-001",
     *   sentences: ["Text of sentence 1", "Text of sentence 2", ...],
     *   pd_flags: [
     *     {labels: ["HearsayShield"], score: 0.6},
     *     {labels: [], score: 0.0},
     *     ...
     *   ]
     * }
     *
     * Optional: fallback_actor (e.g., "Opponent Name" or "Candidate Name")
     */
    async processDocument(doc, fallbackActor = '') {
        // Step 1: Select assertive sentences
        const assertiveSentences = this.selectAssertiveSentences(doc);

        console.log(`Selected ${assertiveSentences.length} assertive sentences from ${doc.sentences.length} total`);

        // Step 2: Extract structured claims
        const claims = assertiveSentences.map(item => {
            return this.extractor.buildClaim({
                sentence: item.sentence,
                docId: doc.doc_id,
                sentenceId: item.sentence_id,
                deniabilityLabels: item.deniability_labels,
                assertiveness: item.assertiveness,
                fallbackActor: fallbackActor
            });
        });

        console.log(`Extracted ${claims.length} structured claims`);

        // Step 3: Verify claims (link to sources and score)
        const verifiedClaims = await this.verifier.verifyBatch(claims);

        console.log(`Verified ${verifiedClaims.length} claims`);

        return verifiedClaims;
    }

    /**
     * Process a single sentence into a verified claim
     */
    async processSentence(sentence, options = {}) {
        const {
            docId = 'SINGLE',
            sentenceId = 1,
            deniabilityScore = 0.0,
            deniabilityLabels = [],
            fallbackActor = ''
        } = options;

        const assertiveness = this.extractor.calculateAssertiveness(deniabilityScore);

        // Build claim
        const claim = this.extractor.buildClaim({
            sentence: sentence,
            docId: docId,
            sentenceId: sentenceId,
            deniabilityLabels: deniabilityLabels,
            assertiveness: assertiveness,
            fallbackActor: fallbackActor
        });

        // Verify claim
        const verified = await this.verifier.verify(claim);

        return verified;
    }

    /**
     * Get summary statistics from verified claims
     */
    getSummaryStats(verifiedClaims) {
        const stats = {
            total: verifiedClaims.length,
            by_status: {
                true: 0,
                false: 0,
                misleading: 0,
                unsupported: 0,
                unverified: 0
            },
            by_predicate: {},
            avg_assertiveness: 0,
            avg_confidence: 0,
            with_evidence: 0
        };

        let totalAssertiveness = 0;
        let totalConfidence = 0;

        for (const claim of verifiedClaims) {
            // Count by status
            const status = claim.verification.status;
            if (stats.by_status.hasOwnProperty(status)) {
                stats.by_status[status]++;
            }

            // Count by predicate
            const predicate = claim.claim.predicate;
            stats.by_predicate[predicate] = (stats.by_predicate[predicate] || 0) + 1;

            // Accumulate averages
            totalAssertiveness += claim.claim.assertiveness;
            totalConfidence += claim.verification.confidence;

            // Count with evidence
            if (claim.verification.evidence && claim.verification.evidence.length > 0) {
                stats.with_evidence++;
            }
        }

        if (verifiedClaims.length > 0) {
            stats.avg_assertiveness = Math.round((totalAssertiveness / verifiedClaims.length) * 100) / 100;
            stats.avg_confidence = Math.round((totalConfidence / verifiedClaims.length) * 100) / 100;
        }

        return stats;
    }
}

module.exports = FactCheckPipeline;
