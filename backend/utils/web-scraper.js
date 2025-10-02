/**
 * Web scraper for campaign press releases
 * Extracts press release content from web pages and combines page metadata with parsed content
 */

class WebScraper {
    constructor(parser) {
        this.parser = parser;
    }

    /**
     * Extract press release from webpage content
     * @param {string} pageContent - Raw markdown/text from WebFetch
     * @param {string} url - Source URL
     * @returns {object} Structured press release data
     */
    extractFromPage(pageContent, url) {
        const lines = pageContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Try to find date near the top of the page
        // Common patterns: "Oct 01, 2025", "October 1, 2025", etc.
        let pageDate = null;
        const datePatterns = [
            // Abbreviated month with comma
            /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}$/i,
            // Full month with comma
            /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i,
            // Numeric
            /^\d{1,2}\/\d{1,2}\/\d{4}$/
        ];

        // Check first 10 lines for a standalone date
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i];
            // Skip markdown headers (lines starting with #)
            if (line.startsWith('#')) continue;

            for (const pattern of datePatterns) {
                if (pattern.test(line)) {
                    pageDate = line;
                    break;
                }
            }
            if (pageDate) break;
        }

        // Remove the page date line from content if found
        let cleanedContent = pageContent;
        if (pageDate) {
            cleanedContent = pageContent.replace(pageDate, '').trim();
        }

        // Parse the cleaned content
        const parseResult = this.parser.parse(cleanedContent);

        // If parser found a location but no date, and we have a page date, combine them
        if (pageDate && parseResult.content_structure.dateline) {
            const dateline = parseResult.content_structure.dateline;

            if (dateline.location && !dateline.date) {
                // Combine location from parsed content with date from page
                dateline.date = pageDate;
                dateline.full = `${dateline.location} — ${pageDate}`;
                dateline.confidence = 'medium'; // Medium because we combined from two sources
                dateline.issues = dateline.issues || [];
                dateline.issues.push('Date extracted from page metadata, location from content');
            } else if (!dateline.location && !dateline.date) {
                // No location or date found in content, use page date only
                dateline.date = pageDate;
                dateline.full = pageDate;
                dateline.confidence = 'low';
                dateline.issues = dateline.issues || [];
                dateline.issues.push('Date extracted from page metadata, no location found');
            }
        }

        // Add source URL to result
        return {
            source_url: url,
            page_date: pageDate,
            ...parseResult
        };
    }

    /**
     * Scrape press release from URL
     * This is a placeholder - actual implementation would use WebFetch
     */
    async scrapeUrl(url) {
        throw new Error('Not implemented - use WebFetch tool to get page content, then call extractFromPage');
    }
}

module.exports = WebScraper;
