/**
 * Source Linkers Registry
 * Maps claim types to appropriate data source verification functions
 */

class Evidence {
    constructor(sourceId, title, url, snippet, matchScore) {
        this.source_id = sourceId;
        this.title = title;
        this.url = url;
        this.snippet = snippet;
        this.match_score = matchScore;
    }
}

class SourceLinkers {
    constructor(webSearchFn = null) {
        this.webSearch = webSearchFn;

        // Registry maps predicate types to verification functions
        this.registry = {
            'event': [this.linkVote.bind(this)],
            'quantity': [this.linkEconomy.bind(this)],
            'status': [],
            'causal': [this.linkEconomy.bind(this)],
            'comparative': [this.linkEconomy.bind(this)],
            'quote': [],
            'attribution': []
        };
    }

    /**
     * Link vote-related claims to legislative records
     * TODO: Implement Congress.gov or state legislature API integration
     */
    async linkVote(claim) {
        const evidence = [];

        // Placeholder - would integrate with:
        // - Congress.gov API for federal votes
        // - State legislature APIs
        // - VoteSmart API

        if (this.webSearch && claim.claim.action.includes('voted')) {
            try {
                const query = `${claim.claim.actor} ${claim.claim.action} ${claim.claim.object} site:congress.gov OR site:govtrack.us`;
                const results = await this.webSearch(query);

                if (results) {
                    evidence.push(new Evidence(
                        'congress:vote:pending',
                        'Congressional Vote Record',
                        'https://www.congress.gov',
                        results.substring(0, 200),
                        0.7
                    ));
                }
            } catch (error) {
                console.error('Vote lookup error:', error);
            }
        }

        return evidence;
    }

    /**
     * Link economic/statistical claims to official data sources
     * Handles: unemployment, inflation, GDP, crime, etc.
     */
    async linkEconomy(claim) {
        const evidence = [];

        if (!this.webSearch) {
            return evidence;
        }

        const claimText = claim.claim.text.toLowerCase();

        // Determine which economic data source to target
        let query = '';
        let sourceId = '';

        if (claimText.includes('unemployment')) {
            query = `unemployment rate ${claim.claim.time?.as_text || ''} site:bls.gov`;
            sourceId = 'bls:unemployment';
        } else if (claimText.includes('inflation') || claimText.includes('cpi')) {
            query = `CPI inflation ${claim.claim.time?.as_text || ''} site:bls.gov`;
            sourceId = 'bls:cpi';
        } else if (claimText.includes('gdp') || claimText.includes('economic growth')) {
            query = `GDP ${claim.claim.time?.as_text || ''} site:bea.gov OR site:worldbank.org`;
            sourceId = 'bea:gdp';
        } else if (claimText.includes('crime')) {
            query = `crime statistics ${claim.claim.time?.as_text || ''} site:bjs.gov OR site:fbi.gov`;
            sourceId = 'bjs:crime';
        } else if (claimText.includes('deficit') || claimText.includes('debt')) {
            query = `federal deficit ${claim.claim.time?.as_text || ''} site:treasury.gov OR site:cbo.gov`;
            sourceId = 'treasury:deficit';
        }

        if (query) {
            try {
                const results = await this.webSearch(query);

                if (results) {
                    evidence.push(new Evidence(
                        sourceId,
                        `Official Economic Data`,
                        query,
                        results.substring(0, 300),
                        0.8
                    ));
                }
            } catch (error) {
                console.error('Economy data lookup error:', error);
            }
        }

        return evidence;
    }

    /**
     * Link financial/campaign finance claims
     * TODO: Integrate FEC API for political contributions, SEC for corporate filings
     */
    async linkFinance(claim) {
        const evidence = [];

        // Placeholder - would integrate with:
        // - FEC API for campaign finance
        // - SEC EDGAR for corporate filings
        // - OpenSecrets API

        return evidence;
    }

    /**
     * Run all applicable linkers for a claim
     */
    async runLinkers(claim) {
        const predicate = claim.claim.predicate;
        const linkerFunctions = this.registry[predicate] || [];

        const evidencePromises = linkerFunctions.map(async (fn) => {
            try {
                return await fn(claim);
            } catch (error) {
                console.error(`Linker error for ${predicate}:`, error);
                return [];
            }
        });

        const evidenceArrays = await Promise.all(evidencePromises);

        // Flatten array of arrays
        return evidenceArrays.reduce((acc, arr) => acc.concat(arr), []);
    }

    /**
     * Add a custom linker function for a predicate type
     */
    registerLinker(predicate, linkerFunction) {
        if (!this.registry[predicate]) {
            this.registry[predicate] = [];
        }
        this.registry[predicate].push(linkerFunction.bind(this));
    }
}

module.exports = { SourceLinkers, Evidence };
