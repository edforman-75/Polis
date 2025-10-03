/**
 * Claim Verification and Scoring
 * Combines deniability scoring, source matching, and numeric consistency
 */

class ClaimVerifier {
    constructor(sourceLinkers) {
        this.sourceLinkers = sourceLinkers;
    }

    /**
     * Calculate numeric consistency between claim and evidence
     * Returns 0..1 score indicating how well evidence matches claimed numbers
     */
    numericConsistency(claim, evidenceItems) {
        if (!evidenceItems || evidenceItems.length === 0) {
            return 0.0;
        }

        const claimValue = claim.claim.quantity?.value;
        if (!claimValue) {
            // No numeric claim to verify
            return 0.6; // Default moderate confidence for non-numeric claims
        }

        // Extract numbers from evidence snippets
        const numberPattern = /\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(%|\$|percent|trillion|billion|million)?\b/g;

        let maxConsistency = 0.0;

        for (const evidence of evidenceItems) {
            const snippet = evidence.snippet || '';
            const matches = [...snippet.matchAll(numberPattern)];

            for (const match of matches) {
                const evidenceValue = parseFloat(match[1].replace(/,/g, ''));
                const unit = match[2] || '';

                // Check if units match
                if (claim.claim.quantity.unit === '%' && unit.includes('percent') || unit === '%') {
                    const diff = Math.abs(claimValue - evidenceValue);
                    const consistency = Math.max(0, 1 - (diff / Math.max(claimValue, evidenceValue)));
                    maxConsistency = Math.max(maxConsistency, consistency);
                } else if (claim.claim.quantity.unit === '$' && (unit === '$' || unit.includes('trillion') || unit.includes('billion'))) {
                    // For currency, allow some variation
                    const diff = Math.abs(claimValue - evidenceValue);
                    const threshold = Math.max(claimValue, evidenceValue) * 0.15; // 15% tolerance
                    const consistency = diff <= threshold ? 0.9 : Math.max(0, 1 - (diff / Math.max(claimValue, evidenceValue)));
                    maxConsistency = Math.max(maxConsistency, consistency);
                } else if (claim.claim.quantity.unit === 'count' && !unit) {
                    const diff = Math.abs(claimValue - evidenceValue);
                    const consistency = Math.max(0, 1 - (diff / Math.max(claimValue, evidenceValue)));
                    maxConsistency = Math.max(maxConsistency, consistency);
                }
            }
        }

        return Math.round(maxConsistency * 100) / 100;
    }

    /**
     * Decide verification status based on evidence and consistency
     * Returns: [status, confidence, notes]
     */
    decideStatus(claim, evidenceItems) {
        if (!evidenceItems || evidenceItems.length === 0) {
            // No evidence found
            if (claim.claim.deniability_markers && claim.claim.deniability_markers.length > 0) {
                return [
                    'unsupported',
                    0.4,
                    'No authoritative source matched; hedged phrasing present.'
                ];
            }
            return [
                'unsupported',
                0.5,
                'No authoritative source matched.'
            ];
        }

        // With evidence: compute consistency
        const consistencyScore = this.numericConsistency(claim, evidenceItems);

        if (consistencyScore >= 0.85) {
            return [
                'true',
                consistencyScore,
                'Strong numeric/textual alignment with authoritative sources.'
            ];
        }

        if (consistencyScore >= 0.55 && consistencyScore < 0.85) {
            return [
                'misleading',
                consistencyScore,
                'Partially supported or context may be cherry-picked.'
            ];
        }

        if (consistencyScore < 0.55 && consistencyScore > 0) {
            return [
                'false',
                1.0 - consistencyScore,
                'Evidence contradicts the core numeric/textual claim.'
            ];
        }

        return [
            'unsupported',
            0.5,
            'Insufficient data for verification.'
        ];
    }

    /**
     * Verify a claim by running source linkers and scoring
     */
    async verify(claim) {
        // Run all applicable source linkers
        const evidence = await this.sourceLinkers.runLinkers(claim);

        // Decide status based on evidence
        const [status, confidence, notes] = this.decideStatus(claim, evidence);

        // Apply hedge penalty if claim has deniability markers
        let finalConfidence = confidence;
        if (claim.claim.deniability_markers && claim.claim.deniability_markers.length > 0) {
            const hedgePenalty = Math.min(0.2, 0.05 * claim.claim.deniability_markers.length);
            finalConfidence = Math.max(0.0, Math.round((confidence - hedgePenalty) * 100) / 100);
        }

        // Update verification section
        claim.verification = {
            status: status,
            confidence: finalConfidence,
            method: (status === 'true' || status === 'false') ? 'exact' : 'numeric_range',
            evidence: evidence,
            notes: notes
        };

        return claim;
    }

    /**
     * Batch verify multiple claims
     */
    async verifyBatch(claims) {
        const verifiedClaims = [];

        for (const claim of claims) {
            const verified = await this.verify(claim);
            verifiedClaims.push(verified);
        }

        return verifiedClaims;
    }
}

module.exports = ClaimVerifier;
