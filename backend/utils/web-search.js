/**
 * WebSearch wrapper for comparative claim verification
 * Provides a standardized interface to web search functionality
 */

class WebSearchWrapper {
    constructor(webSearchFn) {
        this.webSearchFn = webSearchFn;
    }

    /**
     * Perform a web search and return formatted results
     * @param {string} query - The search query
     * @returns {Promise<string>} Combined text from search results
     */
    async search(query) {
        if (!this.webSearchFn) {
            throw new Error('WebSearch function not configured');
        }

        try {
            // Call the WebSearch function
            const results = await this.webSearchFn(query);

            // The results should be a string with search result snippets
            // Return it directly for the ComparativeVerifier to parse
            return results || '';

        } catch (error) {
            console.error('WebSearch error:', error);
            throw new Error(`WebSearch failed: ${error.message}`);
        }
    }

    /**
     * Create a WebSearch wrapper for use in Express routes
     * This uses the WebSearch tool available in Claude Code
     */
    static createForClaudeCode() {
        return new WebSearchWrapper(async (query) => {
            // This will be called from the API endpoint
            // The actual WebSearch call will be made by the endpoint
            // using the Claude Code WebSearch tool
            throw new Error('WebSearch must be called from API endpoint context');
        });
    }
}

module.exports = WebSearchWrapper;
