/**
 * Comparative Claim Automated Verifier
 * Uses WebSearch to automatically verify comparative claims
 */

class ComparativeVerifier {
    constructor(webSearchFn = null) {
        this.webSearch = webSearchFn;
    }

    /**
     * Automatically verify a comparative claim using WebSearch
     * @param {Object} claim - Detected comparative claim
     * @param {Object} parser - PressReleaseParser instance for query generation
     * @returns {Object} Verification result with verdict, data, and sources
     */
    async verify(claim, parser) {
        const result = {
            claim_text: claim.text || claim.statement,
            comparison_type: claim.comparison_type,
            verification_date: new Date().toISOString(),
            automated: true,
            verdict: null,
            confidence: 0,
            left_value: null,
            right_value: null,
            calculated_result: null,
            expected_result: null,
            search_queries: [],
            data_extraction_log: [],
            calculation_steps: [],
            sources: [],
            notes: [],
            error: null
        };

        try {
            if (!this.webSearch) {
                throw new Error('WebSearch function not configured');
            }

            // Handle different comparison types
            if (claim.is_temporal || claim.is_trend) {
                return await this.verifyTemporal(claim, parser, result);
            } else {
                return await this.verifyStandard(claim, parser, result);
            }

        } catch (error) {
            result.error = error.message;
            result.verdict = 'ERROR';
            result.notes.push(`Verification failed: ${error.message}`);
            return result;
        }
    }

    /**
     * Verify temporal/trend comparative claims
     */
    async verifyTemporal(claim, parser, result) {
        const metric = claim.metrics[0] || 'value';
        const timeRef = claim.time_reference;

        result.notes.push(`Verifying temporal claim: ${metric} comparison over time`);

        // Step 1: Look up current value
        const currentQuery = parser.generateSearchQuery(metric, null);
        result.search_queries.push({ step: 1, type: 'current', query: currentQuery });

        const currentSearch = await this.webSearch(currentQuery);
        const currentValue = this.extractNumericValue(currentSearch, metric);

        result.left_value = currentValue;
        result.data_extraction_log.push({
            step: 1,
            query: currentQuery,
            extracted: currentValue,
            raw_snippet: currentSearch.substring(0, 200)
        });

        // Step 2: Look up historical value
        const historicalQuery = parser.generateSearchQuery(metric, timeRef);
        result.search_queries.push({ step: 2, type: 'historical', query: historicalQuery });

        const historicalSearch = await this.webSearch(historicalQuery);
        const historicalValue = this.extractNumericValue(historicalSearch, metric);

        result.right_value = historicalValue;
        result.data_extraction_log.push({
            step: 2,
            query: historicalQuery,
            extracted: historicalValue,
            raw_snippet: historicalSearch.substring(0, 200)
        });

        // Step 3: Calculate and compare
        if (currentValue && historicalValue) {
            return this.calculateTemporalComparison(
                claim,
                currentValue,
                historicalValue,
                result
            );
        } else {
            result.verdict = 'INSUFFICIENT_DATA';
            result.notes.push('Could not extract numeric values from search results');
            return result;
        }
    }

    /**
     * Verify standard comparative claims
     */
    async verifyStandard(claim, parser, result) {
        // Extract metrics from claim
        const leftMetric = claim.verification_steps?.[0]?.left_metric || 'left value';
        const rightMetric = claim.verification_steps?.[0]?.right_metric || 'right value';

        result.notes.push(`Verifying standard comparison: ${leftMetric} vs ${rightMetric}`);

        // Step 1: Look up left value
        const leftQuery = this.buildStandardQuery(leftMetric);
        result.search_queries.push({ step: 1, type: 'left', query: leftQuery });

        const leftSearch = await this.webSearch(leftQuery);
        const leftValue = this.extractNumericValue(leftSearch, leftMetric);

        result.left_value = leftValue;
        result.data_extraction_log.push({
            step: 1,
            query: leftQuery,
            extracted: leftValue,
            raw_snippet: leftSearch.substring(0, 200)
        });

        // Step 2: Look up right value
        const rightQuery = this.buildStandardQuery(rightMetric);
        result.search_queries.push({ step: 2, type: 'right', query: rightQuery });

        const rightSearch = await this.webSearch(rightQuery);
        const rightValue = this.extractNumericValue(rightSearch, rightMetric);

        result.right_value = rightValue;
        result.data_extraction_log.push({
            step: 2,
            query: rightQuery,
            extracted: rightValue,
            raw_snippet: rightSearch.substring(0, 200)
        });

        // Step 3: Calculate and compare
        if (leftValue && rightValue) {
            return this.calculateStandardComparison(
                claim,
                leftValue,
                rightValue,
                result
            );
        } else {
            result.verdict = 'INSUFFICIENT_DATA';
            result.notes.push('Could not extract numeric values from search results');
            return result;
        }
    }

    /**
     * Calculate temporal comparison result
     */
    calculateTemporalComparison(claim, currentValue, historicalValue, result) {
        const current = this.parseValue(currentValue);
        const historical = this.parseValue(historicalValue);

        if (!current || !historical) {
            result.verdict = 'INSUFFICIENT_DATA';
            result.notes.push('Could not parse numeric values');
            return result;
        }

        result.calculation_steps.push({
            step: 1,
            action: 'parse_values',
            current: current.value,
            historical: historical.value,
            current_unit: current.unit,
            historical_unit: historical.unit
        });

        // Calculate ratio
        const ratio = current.value / historical.value;
        result.calculated_result = ratio.toFixed(2);

        result.calculation_steps.push({
            step: 2,
            action: 'calculate_ratio',
            formula: `${current.value} / ${historical.value}`,
            result: ratio
        });

        // Determine expected result based on claim type
        if (claim.comparison_type === 'temporal_ratio') {
            // Extract expected multiplier from claim
            if (claim.text.includes('double')) {
                result.expected_result = '2.0';
                result.verdict = Math.abs(ratio - 2.0) < 0.1 ? 'TRUE' : 'FALSE';
                result.confidence = Math.abs(ratio - 2.0) < 0.1 ? 0.95 : 0.95;
            } else if (claim.text.includes('triple')) {
                result.expected_result = '3.0';
                result.verdict = Math.abs(ratio - 3.0) < 0.1 ? 'TRUE' : 'FALSE';
                result.confidence = 0.95;
            } else if (claim.text.includes('half')) {
                result.expected_result = '0.5';
                result.verdict = Math.abs(ratio - 0.5) < 0.1 ? 'TRUE' : 'FALSE';
                result.confidence = 0.95;
            }

            result.notes.push(`Actual ratio: ${ratio.toFixed(2)}x, Expected: ${result.expected_result}x`);
            result.notes.push(`The current value is ${ratio.toFixed(2)} times the historical value`);

        } else if (claim.comparison_type === 'temporal_comparison') {
            // Simple greater than / less than
            if (claim.text.match(/\b(higher|greater|more)\b/i)) {
                result.expected_result = 'current > historical';
                result.verdict = current.value > historical.value ? 'TRUE' : 'FALSE';
                result.confidence = 0.95;
            } else if (claim.text.match(/\b(lower|less|fewer)\b/i)) {
                result.expected_result = 'current < historical';
                result.verdict = current.value < historical.value ? 'TRUE' : 'FALSE';
                result.confidence = 0.95;
            }
        }

        result.calculation_steps.push({
            step: 3,
            action: 'determine_verdict',
            expected: result.expected_result,
            actual: result.calculated_result,
            verdict: result.verdict
        });

        return result;
    }

    /**
     * Calculate standard comparison result
     */
    calculateStandardComparison(claim, leftValue, rightValue, result) {
        const left = this.parseValue(leftValue);
        const right = this.parseValue(rightValue);

        if (!left || !right) {
            result.verdict = 'INSUFFICIENT_DATA';
            result.notes.push('Could not parse numeric values');
            return result;
        }

        result.calculation_steps.push({
            step: 1,
            action: 'parse_values',
            left: left.value,
            right: right.value,
            left_unit: left.unit,
            right_unit: right.unit
        });

        // Determine verdict based on comparison type
        switch (claim.comparison_type) {
            case 'greater_than':
                result.expected_result = 'left > right';
                result.calculated_result = `${left.value} ${left.value > right.value ? '>' : '<='} ${right.value}`;
                result.verdict = left.value > right.value ? 'TRUE' : 'FALSE';
                result.confidence = 0.95;
                break;

            case 'less_than':
                result.expected_result = 'left < right';
                result.calculated_result = `${left.value} ${left.value < right.value ? '<' : '>='} ${right.value}`;
                result.verdict = left.value < right.value ? 'TRUE' : 'FALSE';
                result.confidence = 0.95;
                break;

            case 'equal_to':
                result.expected_result = 'left ≈ right';
                const percentDiff = Math.abs((left.value - right.value) / right.value) * 100;
                result.calculated_result = `${left.value} vs ${right.value} (${percentDiff.toFixed(1)}% difference)`;
                result.verdict = percentDiff < 5 ? 'TRUE' : 'FALSE';
                result.confidence = 0.90;
                break;

            default:
                result.verdict = 'UNSUPPORTED_COMPARISON_TYPE';
                result.notes.push(`Comparison type '${claim.comparison_type}' not yet supported`);
        }

        result.calculation_steps.push({
            step: 2,
            action: 'perform_comparison',
            type: claim.comparison_type,
            result: result.verdict
        });

        return result;
    }

    /**
     * Extract numeric value from search results text
     */
    extractNumericValue(text, metric) {
        // Common patterns for numeric values with units
        const patterns = [
            // Trillion, billion, million
            /\$?(\d+(?:\.\d+)?)\s*(trillion|billion|million)/i,
            // Percentage
            /(\d+(?:\.\d+)?)\s*(?:percent|%)/i,
            // Plain numbers
            /\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(trillion|billion|million|thousand)?/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    raw: match[0],
                    value: match[1],
                    unit: match[2] || ''
                };
            }
        }

        return null;
    }

    /**
     * Parse value string into numeric value
     */
    parseValue(valueObj) {
        if (!valueObj) return null;

        let value = parseFloat(valueObj.value.replace(/,/g, ''));
        const unit = valueObj.unit.toLowerCase();

        // Convert to base unit (trillions)
        if (unit.includes('billion')) {
            value = value / 1000;
        } else if (unit.includes('million')) {
            value = value / 1000000;
        } else if (unit.includes('thousand')) {
            value = value / 1000000000;
        }

        return {
            value: value,
            unit: valueObj.unit,
            original: valueObj.raw
        };
    }

    /**
     * Build search query for standard comparisons
     */
    buildStandardQuery(metric) {
        const currentYear = new Date().getFullYear();
        return `${metric} ${currentYear} official statistics`;
    }
}

module.exports = ComparativeVerifier;
