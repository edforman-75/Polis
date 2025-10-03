/**
 * WebSearch Adapter
 * Wraps the real WebSearch API for use with verification system
 */

class WebSearchAdapter {
    constructor(webSearchFunction) {
        this.webSearch = webSearchFunction;
    }

    /**
     * Execute a web search and return formatted results
     * @param {string} query - Search query
     * @returns {Promise<{content: string, source: string, url: string}>}
     */
    async search(query) {
        try {
            console.log(`   🔍 WebSearch: "${query}"`);

            // Call the real WebSearch API
            const results = await this.webSearch(query);

            // Format response for verification system
            if (results && results.length > 0) {
                const topResult = results[0];

                return {
                    content: topResult.content || topResult.snippet || '',
                    source: topResult.source || topResult.url || 'web',
                    url: topResult.url || '',
                    title: topResult.title || '',
                    allResults: results
                };
            }

            return {
                content: '',
                source: 'no_results',
                url: '',
                title: '',
                allResults: []
            };

        } catch (error) {
            console.error(`WebSearch error for "${query}":`, error.message);

            return {
                content: '',
                source: 'error',
                url: '',
                title: '',
                error: error.message,
                allResults: []
            };
        }
    }

    /**
     * Search multiple queries in parallel
     * @param {string[]} queries
     * @returns {Promise<Object[]>}
     */
    async searchMultiple(queries) {
        const promises = queries.map(query => this.search(query));
        return await Promise.all(promises);
    }

    /**
     * Extract numeric value from search results
     * Looks for patterns like: $1.8 trillion, 31%, 12 times
     */
    extractNumericValue(content) {
        if (!content) return null;

        // Pattern for currency with units (e.g., "$1.8 trillion")
        const currencyPattern = /\$?([\d,]+\.?\d*)\s*(trillion|billion|million|thousand)?/i;
        const currencyMatch = content.match(currencyPattern);

        if (currencyMatch) {
            const value = parseFloat(currencyMatch[1].replace(/,/g, ''));
            const unit = currencyMatch[2] ? currencyMatch[2].toLowerCase() : '';

            return {
                raw: currencyMatch[0],
                value: value,
                unit: unit,
                type: 'currency'
            };
        }

        // Pattern for percentages
        const percentPattern = /([\d,]+\.?\d*)\s*%/;
        const percentMatch = content.match(percentPattern);

        if (percentMatch) {
            return {
                raw: percentMatch[0],
                value: parseFloat(percentMatch[1].replace(/,/g, '')),
                unit: 'percent',
                type: 'percentage'
            };
        }

        // Pattern for counts (e.g., "12 times", "8 votes")
        const countPattern = /([\d,]+)\s*(times|votes|instances|cases)/i;
        const countMatch = content.match(countPattern);

        if (countMatch) {
            return {
                raw: countMatch[0],
                value: parseFloat(countMatch[1].replace(/,/g, '')),
                unit: countMatch[2].toLowerCase(),
                type: 'count'
            };
        }

        // Generic number pattern
        const numberPattern = /([\d,]+\.?\d*)/;
        const numberMatch = content.match(numberPattern);

        if (numberMatch) {
            return {
                raw: numberMatch[0],
                value: parseFloat(numberMatch[1].replace(/,/g, '')),
                unit: '',
                type: 'number'
            };
        }

        return null;
    }
}

module.exports = WebSearchAdapter;
