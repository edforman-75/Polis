/**
 * Press Release Parser
 * Analyzes press release text and extracts components for multi-surface editor
 */

class PressReleaseParser {
    constructor() {
        this.releasePatterns = {
            // Release status patterns
            release_type: /^(FOR\s+(?:IMMEDIATE\s+)?RELEASE|FOR\s+EMBARGOED?\s+RELEASE|EMBARGOED?\s+UNTIL)/im,
            embargo: /EMBARGO[:\s]*(.*?)(?:\n|$)/im,

            // Header patterns
            contact_info: /(?:CONTACT|MEDIA\s+CONTACT)[:\s]*([\s\S]*?)(?=\n\n|\n[A-Z]|Press Releases|$)/im,
            paid_for: /PAID\s+FOR\s+BY[:\s]*(.*?)(?:\n|$)/im,
            iso_date: /^Date:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)\s*$/im,

            // Content patterns
            headline: /^[^\n]*?(?=\n)/m, // First non-empty line
            dateline: /^([A-Z][a-z\s,]+)\s*[–-]\s*(.+?)(?:\n|$)/m,

            // Quotes patterns
            quotes: /"([^"]+)"\s*(?:said|according\s+to|stated)\s+([^.]+)/gim,

            // Structure markers
            paragraph_breaks: /\n\s*\n/g,
            end_marker: /(?:###|---|-30-|END)/im
        };

        // List of titles/offices - NOT first names
        this.titles = [
            'Governor', 'Lt. Governor', 'Lieutenant Governor',
            'Senator', 'State Senator', 'U.S. Senator',
            'Representative', 'Rep.', 'State Representative', 'U.S. Representative',
            'Congressman', 'Congresswoman', 'Congressperson',
            'Mayor',
            'President', 'Vice President',
            'Secretary',
            'Attorney General',
            'Delegate',
            'Assemblyman', 'Assemblywoman', 'Assembly Member', 'Assembly Speaker',
            'Council Member', 'Councilman', 'Councilwoman',
            'Supervisor',
            'Commissioner',
            'Chief',
            'Director',
            'Chair', 'Chairman', 'Chairwoman', 'Chairperson',
            'Speaker',
            'Leader', 'Majority Leader', 'Minority Leader',
            'Whip', 'Majority Whip', 'Minority Whip',
            'Dr.', 'Doctor',
            'Professor', 'Prof.',
            'Mr.', 'Ms.', 'Mrs.', 'Miss'
        ];
    }

    /**
     * Infer state from context in the text
     * Looks for state names, "for Governor of X", etc.
     */
    inferStateFromContext(text) {
        // State name patterns (full names and common variations)
        const statePatterns = [
            // "New Jersey Governor", "running for Governor of New Jersey", etc.
            /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i,
            // "for governor" context
            /\bfor\s+(?:Governor|Lt\.\s+Governor|Lieutenant\s+Governor|Senate|Congress)\s+(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
            // State-specific references
            /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:Governor|Senator|Congressman|Congresswoman|Representative)\b/i
        ];

        for (const pattern of statePatterns) {
            const match = text.match(pattern);
            if (match) {
                const stateName = match[1];
                // Convert to abbreviation
                return this.getStateAbbreviation(stateName);
            }
        }

        return null;
    }

    /**
     * Get state abbreviation from full name
     */
    getStateAbbreviation(stateName) {
        const stateMap = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
            'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
            'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
            'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
            'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
            'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
            'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
            'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
            'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
            'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
            'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
        };

        // Normalize case for lookup
        const normalized = Object.keys(stateMap).find(
            key => key.toLowerCase() === stateName.toLowerCase()
        );

        return normalized ? stateMap[normalized] : null;
    }

    /**
     * Parse a complete press release and extract all components
     *
     * @param {string} pressReleaseText - The press release text to parse
     * @param {object} verifiedData - Optional verified categorization from QC dashboard
     *                                 { release_type, subtypes, issues, reviewed_by }
     * @returns {object} Parsed press release with structure and metadata
     */
    parse(pressReleaseText, verifiedData = null) {
        const text = pressReleaseText.trim();

        let release_type, subtypes, issues, reviewed_by;

        // NEW: Accept verified data from QC dashboard
        if (verifiedData && verifiedData.release_type) {
            // Use human-verified categorization
            release_type = {
                type: verifiedData.release_type,
                confidence: 'verified',
                score: 100,
                indicators: ['Human verified'],
                all_scores: { [verifiedData.release_type]: 100 }
            };
            subtypes = verifiedData.subtypes || [];
            issues = verifiedData.issues || [];
            reviewed_by = verifiedData.reviewed_by;
        } else {
            // BACKWARD COMPATIBILITY: Auto-detect using TypeClassifier
            const typeClassifier = require('./type-classifier');
            const classification = typeClassifier.classify(text);

            release_type = {
                type: classification.release_type,
                confidence: classification.confidence,
                score: classification.score,
                indicators: classification.indicators,
                all_scores: classification.all_scores
            };
            subtypes = classification.subtype_details;
            issues = classification.issue_details;
            reviewed_by = null;
        }

        // Store verified data for type-specific parsers
        this.verified_type = release_type.type;
        this.verified_subtypes = Array.isArray(subtypes) && subtypes.length > 0
            ? (typeof subtypes[0] === 'string' ? subtypes : subtypes.map(s => s.subtype))
            : [];
        this.verified_issues = Array.isArray(issues) && issues.length > 0
            ? (typeof issues[0] === 'string' ? issues : issues.map(i => i.issue))
            : [];

        // Route to type-specific parser based on verified type
        let type_specific_data = {};
        switch (release_type.type) {
            case 'STATEMENT':
                type_specific_data = this.parseStatement(text);
                break;
            case 'NEWS_RELEASE':
                type_specific_data = this.parseNewsRelease(text);
                break;
            case 'FACT_SHEET':
                type_specific_data = this.parseFactSheet(text);
                break;
            case 'MEDIA_ADVISORY':
                type_specific_data = this.parseMediaAdvisory(text);
                break;
            case 'LETTER':
                type_specific_data = this.parseLetter(text);
                break;
            case 'TRANSCRIPT':
                type_specific_data = this.parseTranscript(text);
                break;
            default:
                // Fall back to standard parsing for unknown types
                const content_structure = this.extractContentStructure(text);
                type_specific_data = {
                    content_structure: content_structure,
                    quotes: this.extractQuotes(text, content_structure.headline, content_structure.subhead)
                };
        }

        return {
            // Verification metadata (always included)
            verification_metadata: {
                verified_type: release_type.type,
                verified_subtypes: this.verified_subtypes,
                verified_issues: this.verified_issues,
                reviewed_by: reviewed_by,
                confidence: release_type.confidence,
                classification_source: verifiedData ? 'human_verified' : 'auto_detected'
            },
            release_info: this.extractReleaseInfo(text),
            release_type: release_type,  // Type detection metadata
            subtypes: subtypes,  // Subtype detection
            issues: issues,  // Issue detection

            // Type-specific parsed data
            ...type_specific_data,

            // Standard metadata (backward compatibility)
            contact_info: this.extractContactInfo(text),
            metadata: this.extractMetadata(text),
            fields_data: this.mapToFieldsData(text),
            gutenberg_blocks: this.convertToGutenbergBlocks(text),
            clean_text: this.extractCleanText(text)
        };
    }

    /**
     * Extract release information (type, embargo, date)
     */
    extractReleaseInfo(text) {
        const releaseTypeMatch = text.match(this.releasePatterns.release_type);
        const embargoMatch = text.match(this.releasePatterns.embargo);

        let releaseType = 'FOR IMMEDIATE RELEASE';
        let embargoDate = null;
        let embargoTime = null;

        if (releaseTypeMatch) {
            const matched = releaseTypeMatch[0].toUpperCase();
            if (matched.includes('EMBARGOED') || matched.includes('EMBARGO')) {
                releaseType = 'FOR EMBARGOED RELEASE';

                if (embargoMatch) {
                    const embargoText = embargoMatch[1];
                    const dateTimeMatch = embargoText.match(/(\w+,?\s+\w+\s+\d+,?\s+\d+)[,\s]*(\d+:\d+\s*(?:AM|PM)?)/i);

                    if (dateTimeMatch) {
                        embargoDate = this.parseDate(dateTimeMatch[1]);
                        embargoTime = this.parseTime(dateTimeMatch[2]);
                    }
                }
            }
        }

        // Extract date from press release
        // Common patterns: "March 11, 2025", "October 1, 2025", "Wednesday, September 17, 2025", "Oct 02, 2025"
        let date = '';
        const datePatterns = [
            /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
            /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/,
            /([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                date = match[1] || match[0];
                break;
            }
        }

        // Extract location from press release
        // Common patterns: "CITY, STATE -" or "CITY, STATE" on its own line
        // Handles both "D.C." and "DC" formats
        let location = '';
        const locationPatterns = [
            // Pattern 1: Location with dash (e.g., "IRVINE, CA - ", "WASHINGTON, D.C. -")
            /([A-Z][A-Z\s.]+,\s+[A-Z.]{2,})\s*-/,
            // Pattern 2: Location on its own line (e.g., "WASHINGTON, D.C.", "WASHINGTON, DC")
            /^([A-Z][A-Z\s.]+,\s+(?:[A-Z]{2}|[A-Z]\.[A-Z]\.|DC|D\.C\.))$/m,
            // Pattern 3: Location in first few lines without dash
            /^(?:.*?\n){1,5}([A-Z][A-Z\s.]+,\s+(?:[A-Z]{2}|[A-Z]\.[A-Z]\.|DC|D\.C\.))\s*$/m
        ];

        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
                location = match[1].trim();
                break;
            }
        }

        return {
            releaseType,
            embargoDate,
            embargoTime,
            timing_classification: releaseType === 'FOR EMBARGOED RELEASE' ? 'Embargoed Release' : 'Immediate Release',
            date: date,
            location: location
        };
    }

    /**
     * Extract content structure (headline, dateline, paragraphs)
     */
    /**
     * Calculate confidence score for an extracted field
     * @param {Object} criteria - Scoring criteria
     * @returns {number} Confidence score 0-1
     */
    calculateFieldConfidence(criteria) {
        let score = 0;
        let maxScore = 0;

        // Pattern match strength (0-40 points)
        if (criteria.patternMatch !== undefined) {
            maxScore += 40;
            if (criteria.patternMatch === 'strong') score += 40;
            else if (criteria.patternMatch === 'medium') score += 25;
            else if (criteria.patternMatch === 'weak') score += 10;
        }

        // Expected position (0-20 points)
        if (criteria.expectedPosition !== undefined) {
            maxScore += 20;
            if (criteria.expectedPosition) score += 20;
            else score += 5;
        }

        // Completeness (0-20 points)
        if (criteria.completeness !== undefined) {
            maxScore += 20;
            score += criteria.completeness * 20;
        }

        // Format validation (0-20 points)
        if (criteria.formatValid !== undefined) {
            maxScore += 20;
            if (criteria.formatValid) score += 20;
        }

        return maxScore > 0 ? score / maxScore : 0.5;
    }

    extractContentStructure(text) {
        const lines = text.split('\n').filter(line => line.trim());

        // Skip release type and contact info at top
        let contentStartIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (!this.isHeaderLine(lines[i])) {
                contentStartIndex = i;
                break;
            }
        }

        const contentLines = lines.slice(contentStartIndex);

        // Enhanced headline detection - look for short, impactful opening
        const headline = this.findHeadlineEnhanced(text);
        const headlineConfidence = this.calculateFieldConfidence({
            patternMatch: headline && headline.length < 100 ? 'strong' : headline ? 'medium' : 'weak',
            expectedPosition: contentStartIndex < 3,
            completeness: headline ? 1.0 : 0,
            formatValid: headline && headline.length > 0
        });

        // Flexible dateline extraction with confidence scoring
        const dateline = this.extractDatelineFlexible(text);

        // Enhanced paragraph extraction with better segmentation
        const paragraphs = this.extractParagraphsEnhanced(text);

        // Strip dateline from lead paragraph if present
        let leadParagraph = paragraphs[0] || '';
        if (leadParagraph && dateline && (dateline.location || dateline.date)) {
            // Build flexible pattern that handles:
            // - "RICHMOND, VA" vs "RICHMOND, Va." (case + period)
            // - Different dash types: - – —
            // - Optional trailing dash

            if (dateline.location && dateline.date) {
                // Escape and make pattern flexible for state abbreviations with/without periods
                // e.g., "VA" or "Va." both match
                let loc = dateline.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Add optional period for state abbreviations
                loc = loc.replace(/([A-Z]{2})$/i, '$1\\.?');

                const date = dateline.date.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`^${loc}\\s*[-–—]\\s*${date}\\s*[-–—]?\\s*`, 'i');
                leadParagraph = leadParagraph.replace(pattern, '').trim();
            } else if (dateline.date) {
                // Only date, no location
                const date = dateline.date.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`^${date}\\s*[-–—]?\\s*`, 'i');
                leadParagraph = leadParagraph.replace(pattern, '').trim();
            }
        }

        return {
            headline: headline || '',
            headline_confidence: headlineConfidence,
            subhead: this.findSubhead(contentLines, headline),
            dateline: dateline,
            lead_paragraph: leadParagraph,
            lead_confidence: leadParagraph ? 0.9 : 0.3,
            body_paragraphs: paragraphs.slice(1),
            total_paragraphs: paragraphs.length
        };
    }

    /**
     * Detect statement format and extract the speaker
     * Pattern: "X released the following statement:" or "Statement from X:"
     * Returns: { speaker: 'Full Name', position: index_where_found }
     */
    detectStatementFormat(text) {
        // UPDATED: Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
        const statementPatterns = [
            // "Representative Alexandria Ocasio-Cortez (NY-14) released a statement"
            // Handles titles + names + district info + "released a statement" (without "the following")
            /(?:Representative|Senator|Congresswoman|Congressman|Governor|Mayor)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s*(?:\([^)]+\))?\s+released\s+a\s+statement/i,
            // "Mikie Sherrill released the following statement:"
            /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+released\s+the\s+following\s+statement/i,
            // "Statement from Mikie Sherrill:"
            /Statement\s+from\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)/i,
            // "Campaign Manager Alex Ball released the following statement"
            /(?:Campaign\s+Manager|Press\s+Secretary|Spokesperson)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+released\s+the\s+following\s+statement/i,
            // "X said in a statement:"
            /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+said\s+in\s+a\s+statement/i
        ];

        for (const pattern of statementPatterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    speaker: match[1].trim(),
                    position: match.index
                };
            }
        }

        return null;
    }

    /**
     * Detect the type of press release
     * Returns: { type: string, confidence: string, indicators: array }
     *
     * Types:
     * - STATEMENT: "X released a statement" format, single speaker
     * - NEWS_RELEASE: Traditional format with dateline, multiple possible speakers
     * - MEDIA_ADVISORY: Event announcement with WHO/WHAT/WHEN/WHERE
     * - LETTER: "Dear X" format
     * - TRANSCRIPT: Speech or Q&A format
     * - FACT_SHEET: Data/bullet point heavy
     * - UNKNOWN: Cannot determine type
     */
    detectReleaseType(text) {
        const indicators = [];
        let scores = {
            STATEMENT: 0,
            NEWS_RELEASE: 0,
            MEDIA_ADVISORY: 0,
            LETTER: 0,
            TRANSCRIPT: 0,
            FACT_SHEET: 0
        };

        // STATEMENT indicators
        if (this.detectStatementFormat(text)) {
            scores.STATEMENT += 10;
            indicators.push('Statement format detected');
        }
        if (text.match(/\breleased\s+(?:a|the\s+following)\s+statement/i)) {
            scores.STATEMENT += 5;
            indicators.push('Contains "released a statement"');
        }
        if (text.match(/^Statement\s+(?:from|by)/im)) {
            scores.STATEMENT += 5;
            indicators.push('Starts with "Statement from/by"');
        }

        // NEWS_RELEASE indicators
        if (text.match(/^[A-Z][a-z\s,]+\s*[–—-]\s*[A-Z]/m)) {
            scores.NEWS_RELEASE += 5;
            indicators.push('Has dateline format');
        }
        if (text.match(/FOR\s+(?:IMMEDIATE\s+)?RELEASE/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Has "FOR IMMEDIATE RELEASE"');
        }
        // Check for multiple potential speakers (quotes with different attribution)
        const attributionMatches = text.match(/(?:said|stated|according to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
        if (attributionMatches && attributionMatches.length >= 2) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Multiple speaker attributions found');
        }
        // "issued the following statement" pattern (news release context, not pure statement)
        if (text.match(/issued\s+the\s+following\s+statement/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains "issued the following statement"');
        }
        // End marker
        if (text.match(/^\s*#{3,}\s*$/m)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Has ### end marker');
        }
        // Third-person narrative verbs (indicates news release vs statement)
        if (text.match(/\b(?:argues|highlights|emphasizes|notes|explains|details|outlines|criticized|challenged)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains third-person narrative verbs');
        }
        // Date patterns (various formats)
        if (text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains formatted date');
        }
        // Location patterns (dateline with dash)
        if (text.match(/^(?:[A-Z][A-Z\s]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:[A-Z]{2}|D\.C\.)?\s*[–—-]/m)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Has location header');
        }
        // Standalone location line (Washington, D.C. or City, STATE)
        if (text.match(/^(?:Washington,?\s+D\.C\.|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z]{2})$/m)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Has standalone location line');
        }
        // Legislative/committee action language
        if (text.match(/\b(?:subcommittee|committee|congress|senate|house)\s+(?:passed|advanced|approved|voted\s+on)\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains legislative action language');
        }
        if (text.match(/\b(?:will|now)\s+(?:move|proceed)(?:s)?\s+to\s+(?:the\s+)?(?:full\s+)?(?:committee|floor|vote|senate|house)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains legislative process language');
        }
        // Organizational/campaign action language
        if (text.match(/\b(?:launched|unveiled|kicked\s+off|rolled\s+out|announced)\s+(?:new|a\s+new)?\s*(?:campaign|initiative|program|billboards?|ads?|effort)/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains organizational action language');
        }
        // Letter/correspondence references
        if (text.match(/\b(?:sent|wrote|delivered)\s+(?:a\s+)?letter\s+to\b|\bpressed?\s+[A-Z][a-zA-Z\s]+\s+(?:on|about)\b|\burged?\s+[A-Z][a-zA-Z\s]+\s+to\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains letter/correspondence reference');
        }
        // Announcement/reveal language
        if (text.match(/\b(?:announced|revealed|disclosed)\s+(?:that|today|yesterday|this\s+week)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains announcement language');
        }
        // News update prefixes (ICYMI, NEW, etc.)
        if (text.match(/^(?:NEW|NEWS|BREAKING|UPDATE|ICYMI|LATEST|PHOTOS|PHOTO|VIDEO|WATCH|LISTEN):/im)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Has news update prefix');
        }
        // Temporal news connections
        if (text.match(/\b(?:on\s+the\s+heels\s+of|following|in\s+response\s+to|after|amid)\s+[a-z]+/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains temporal news connection');
        }
        // Hearing/testimony activity (adds to NEWS_RELEASE confidence)
        if (text.match(/\b(?:at\s+a|questioned?\s+witnesses?\s+at|testimony\s+(?:at|from)|hearing\s+on)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains hearing/testimony activity');
        }
        // Floor speech/action
        if (text.match(/\b(?:delivered|gave)\s+(?:a\s+)?(?:speech|remarks?|address)\s+on\s+the\s+(?:senate|house)\s+floor/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains floor speech reference');
        }
        // Source citations (journalism-style)
        if (text.match(/\b(?:according\s+to|cites?|sources?\s+(?:say|said|include)|as\s+reported\s+by)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains source citations');
        }
        // Press event/conference language
        if (text.match(/\b(?:held|held\s+a|hosted)\s+(?:a\s+)?(?:press\s+event|press\s+conference|media\s+briefing|news\s+conference)/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains press event reference');
        }
        // Bill introduction with cosponsor counts
        if (text.match(/\b(?:introduced|cosponsored\s+by)\s+(?:the\s+)?[\w\s]+\s+(?:by\s+)?\d+\s+(?:senator|representative|member|lawmaker)s?\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains bill introduction with cosponsor count');
        }
        // Amendment introduction language
        if (text.match(/\b(?:introduce|introducing|offered?|offering)\s+(?:an\s+)?amendment\s+(?:to|which|that)\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains amendment introduction');
        }
        // Demanding/calling for action
        if (text.match(/\b(?:demanding|calling\s+(?:for|on)|urging)\s+(?:[A-Z][\w\s]+\s+)?(?:to|for|answers)/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains demand/call for action');
        }
        // Leadership title patterns
        if (text.match(/\b(?:Leader|Whip|Chair|Ranking\s+Member|Chairwoman|Chairman)\s+[A-Z][a-z]+/)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains leadership title');
        }
        // Companion legislation references
        if (text.match(/\bcompanion\s+(?:legislation|bill)\s+in\s+the\s+(?:house|senate)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains companion legislation reference');
        }
        // Stakeholder/organization quotes (non-politician)
        if (text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+\s+\([^)]+(?:Association|Coalition|Union|Organization|Foundation|Institute|Alliance|Council|Federation)\)/)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains stakeholder organization quote');
        }
        // Bill reintroduction language
        if (text.match(/\b(?:reintroduce[sd]?|reintroducing|relaunching)\s+(?:his|her|their|the)\s+(?:landmark|updated|revised)?\s*(?:bill|legislation|proposal|act)\b/i)) {
            scores.NEWS_RELEASE += 4;
            indicators.push('Contains bill reintroduction');
        }
        // Organizational support language
        if (text.match(/\b(?:supported\s+by|endorsed\s+by)\s+(?:numerous|several|many|multiple)?\s*(?:organizations|groups|advocates)\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains organizational support');
        }
        // Event participant language
        if (text.match(/\b(?:was\s+joined\s+by|joined\s+by|accompanied\s+by)\s+(?:local|state|federal|community)?\s*(?:leaders?|officials?|representatives?)\b/i)) {
            scores.NEWS_RELEASE += 3;
            indicators.push('Contains event participant language');
        }
        // Advocacy/warning language
        if (text.match(/\b(?:warn|warned|warning)\s+(?:against|about|of)|(?:call|called|calling)\s+out\b/i)) {
            scores.NEWS_RELEASE += 2;
            indicators.push('Contains advocacy/warning language');
        }

        // MEDIA_ADVISORY indicators
        if (text.match(/MEDIA\s+ADVISOR/i)) {
            scores.MEDIA_ADVISORY += 10;
            indicators.push('Title contains "MEDIA ADVISORY"');
        }
        if (text.match(/(?:WHO|WHAT|WHEN|WHERE|WHY):/gi)) {
            const whCount = (text.match(/(?:WHO|WHAT|WHEN|WHERE|WHY):/gi) || []).length;
            scores.MEDIA_ADVISORY += whCount * 2;
            indicators.push(`Contains ${whCount} WH-question headers`);
        }
        if (text.match(/(?:VISUALS|LIVESTREAM|RSVP):/i)) {
            scores.MEDIA_ADVISORY += 3;
            indicators.push('Contains event logistics markers');
        }

        // LETTER indicators
        if (text.match(/^Dear\s+(?:Mr\.|Ms\.|Mrs\.|Dr\.|Senator|Representative|Governor)/im)) {
            scores.LETTER += 10;
            indicators.push('Starts with "Dear" salutation');
        }
        if (text.match(/Sincerely,?\s*\n\s*\n\s*[A-Z]/i)) {
            scores.LETTER += 5;
            indicators.push('Contains "Sincerely" closing');
        }

        // TRANSCRIPT indicators
        if (text.match(/^(?:SPEAKER|MODERATOR|Q:|A:)/im)) {
            scores.TRANSCRIPT += 10;
            indicators.push('Contains speaker/Q&A labels');
        }
        if (text.match(/\[(?:APPLAUSE|LAUGHTER|CROSSTALK)\]/i)) {
            scores.TRANSCRIPT += 5;
            indicators.push('Contains transcript annotations');
        }

        // FACT_SHEET indicators
        if (text.match(/FACT\s+SHEET/i)) {
            scores.FACT_SHEET += 10;
            indicators.push('Title contains "FACT SHEET"');
        }
        const bulletCount = (text.match(/^\s*[•·●∙◦▪▫-]\s+/gm) || []).length;
        if (bulletCount >= 5) {
            scores.FACT_SHEET += bulletCount;
            indicators.push(`Contains ${bulletCount} bullet points`);
        }

        // Determine winning type
        let maxScore = 0;
        let detectedType = 'UNKNOWN';
        for (const [type, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                detectedType = type;
            }
        }

        // Determine confidence based on score
        let confidence = 'none';
        if (maxScore >= 10) {
            confidence = 'high';
        } else if (maxScore >= 5) {
            confidence = 'medium';
        } else if (maxScore > 0) {
            confidence = 'low';
        }

        return {
            type: detectedType,
            confidence: confidence,
            score: maxScore,
            indicators: indicators,
            all_scores: scores
        };
    }

    /**
     * Detect press release subtypes using pattern matching
     * Based on training from real press releases
     * Returns array of detected subtypes with confidence scores
     * @param {string} text - The press release text
     * @param {string} releaseType - The detected release type (STATEMENT, NEWS_RELEASE, etc.)
     */
    detectSubtypes(text, releaseType = 'UNKNOWN') {
        const detected = [];
        const textLower = text.toLowerCase();

        // STATEMENT-specific subtypes
        if (releaseType === 'STATEMENT') {
            // Response to events/opposition
            if (textLower.match(/\b(?:responds?\s+to|in\s+response\s+to|reacts?\s+to)/i)) {
                detected.push({ subtype: 'response_statement', confidence: 'high', keywords: ['responds to', 'in response to'] });
            }
            // Opposition/condemnation
            if (textLower.match(/\b(?:condemns?|denounces?|opposes?|rejects?)/i)) {
                detected.push({ subtype: 'condemnation', confidence: 'high', keywords: ['condemns', 'denounces', 'opposes'] });
            }
            // Support/praise
            if (textLower.match(/\b(?:praises?|applauds?|commends?|supports?|celebrates?)/i)) {
                detected.push({ subtype: 'support_statement', confidence: 'high', keywords: ['praises', 'supports', 'commends'] });
            }
            // Policy position
            if (textLower.match(/\b(?:position\s+on|stance\s+on|believes?|calls?\s+for)/i)) {
                detected.push({ subtype: 'policy_position', confidence: 'medium', keywords: ['position on', 'calls for'] });
            }
        }

        // NEWS_RELEASE and FACT_SHEET-specific subtypes (including attack subtypes)
        if (releaseType === 'NEWS_RELEASE' || releaseType === 'FACT_SHEET') {
            // Campaign announcement
            if (textLower.match(/\b(?:announced?\s+(?:his|her|their)\s+candidacy|launches?\s+campaign|running\s+for|campaign\s+for\s+(?:governor|senate|congress|president))/i)) {
                detected.push({ subtype: 'campaign_announcement', confidence: 'high', keywords: ['announced candidacy', 'launches campaign', 'running for'] });
            }

            // Endorsement
            if (textLower.match(/\b(?:endorses?|endorsement|announced?\s+(?:his|her|their)\s+endorsement|support\s+(?:in\s+this\s+race|for\s+[A-Z]))/i)) {
                detected.push({ subtype: 'endorsement', confidence: 'high', keywords: ['endorses', 'endorsement', 'support in this race'] });
            }

            // Response to opposition (includes calls/challenges to opponent)
            if (textLower.match(/\b(?:responds?\s+to|criticizes?|slams?|calls?\s+out|hits?\s+back|refuses?\s+to\s+stand\s+up|while\s+[A-Z][a-z]+\s+(?:rips?|refuses?|does))/i)) {
                detected.push({ subtype: 'response_opposition', confidence: 'high', keywords: ['responds to', 'criticizes', 'refuses to stand up'] });
            }
            // Calls/challenges to opponent to take action
            if (textLower.match(/\bcalls?\s+on\s+\w+\s+to\b|\bwhat(?:'?s|\s+is)\s+\w+\s+hiding\b|\brefused?\s+to\s+(?:release|disclose|answer|provide)/i)) {
                if (!detected.find(d => d.subtype === 'response_opposition')) {
                    detected.push({ subtype: 'response_opposition', confidence: 'high', keywords: ['calls on', 'hiding', 'refused to release'] });
                }
            }
            // Additional opposition patterns
            if (textLower.match(/\b(?:attacks?|challenges?|condemns?|opposes?|denounces?|blasts?)/i) &&
                textLower.match(/\b(?:Trump|Republicans?|Democrats?|opponent)/i)) {
                if (!detected.find(d => d.subtype === 'response_opposition')) {
                    detected.push({ subtype: 'response_opposition', confidence: 'medium', keywords: ['attacks', 'condemns', 'opposes'] });
                }
            }

            // Policy announcement
            if (textLower.match(/\b(?:introduces?|legislation|bill|act|proposes?|unveils?)\s+(?:the|new|a)\s+[A-Z]/i)) {
                detected.push({ subtype: 'policy_announcement', confidence: 'high', keywords: ['introduces', 'legislation', 'bill', 'act'] });
            }

            // Legislative action (includes bill passage, hearings, floor actions)
            if (textLower.match(/\b(?:hearing|questioned?\s+witnesses?|(?:senate|house)\s+floor|press\s+conference|speech|testimony|questions?|(?:subcommittee|committee|congress)\s+(?:passed|advances?)|reauthorizes?|(?:move|moved)\s+to\s+(?:the\s+)?(?:full\s+)?(?:committee|floor|vote))/i)) {
                detected.push({ subtype: 'legislative_action', confidence: 'medium', keywords: ['hearing', 'committee passed', 'reauthorizes', 'floor speech'] });
            }

            // Letter/press campaign (sending letters, seeking answers)
            if (textLower.match(/\b(?:pressed?|sent\s+(?:a\s+)?letter|wrote\s+(?:to|a\s+letter)|seek(?:s|ing)?\s+answers?|demand(?:s|ing)?\s+(?:answers?|transparency))\b/i)) {
                detected.push({ subtype: 'legislative_action', confidence: 'medium', keywords: ['pressed', 'sent letter', 'seek answers'] });
            }

            // Funding announcement
            if (textLower.match(/\b(?:secures?|announces?\s+(?:\$|funding)|grants?|federal\s+funding|awards?)\s+(?:\$[\d,]+|\d+\s+million)/i)) {
                detected.push({ subtype: 'funding_announcement', confidence: 'high', keywords: ['secures funding', 'federal funding', 'grants'] });
            }

            // Personnel announcement
            if (textLower.match(/\b(?:appoints?|announces?\s+appointment|names?|hires?|joins?\s+(?:campaign|team))/i)) {
                detected.push({ subtype: 'personnel_announcement', confidence: 'medium', keywords: ['appoints', 'names', 'joins campaign'] });
            }

            // Poll/survey results
            if (textLower.match(/\b(?:poll|survey|shows?\s+lead|momentum)/i)) {
                detected.push({ subtype: 'poll_results', confidence: 'medium', keywords: ['poll', 'survey', 'lead'] });
            }

            // ATTACK SUBTYPES (based on attack_tagger.py patterns)

            // Policy-based attack (voting record, legislative actions, policy positions)
            if (textLower.match(/\bvoted?\s+(?:against|to|for)\b|\bwould\s+(?:ban|defund|cut|raise|eliminate|gut)\b|\b(?:cutting|firing|gutting|slashing|eliminating)\b|\b(?:on|their|his|her)\s+(?:plan|policy|record|bill|agenda)\b|\bfunding\s+cuts?|\bbudget\s+(?:betrayal|cuts?|deal)|\brig(?:ged|ging)?\s+(?:the|congressional|election)|\battacking?\s+(?:benefits?|rights?|services?)/i)) {
                detected.push({ subtype: 'attack_policy', confidence: 'high', keywords: ['voted against', 'their record', 'funding cuts', 'budget betrayal', 'rig', 'attacking benefits'] });
            }

            // Character attack
            if (textLower.match(/\blie(?:d|s|ing)\b|\bdishonest\b|\bcann?ot be trusted\b|\bresum[eé]\b|\bscandal\b/i)) {
                detected.push({ subtype: 'attack_character', confidence: 'high', keywords: ['lie', 'dishonest', 'cannot be trusted', 'scandal'] });
            }

            // Competence/effectiveness attack
            if (textLower.match(/\bfailed?\s+(?:to|on)\b|\bunfit\b|\bnot\s+(?:ready|qualified)\b|\b(?:incompetent|ineffective|weak|squirming)\b|\brefuses?\s+to\s+(?:stand|fight|act|lead)\b/i)) {
                detected.push({ subtype: 'attack_competence', confidence: 'high', keywords: ['failed to', 'unfit', 'refuses to stand', 'ineffective'] });
            }

            // Values/identity attack
            if (textLower.match(/\b(?:out of step|does(?:n'?|\s+no)t share our values)\b|\b(?:extreme|radical)\b|\banti-(?:family|freedom|faith|choice)\b/i)) {
                detected.push({ subtype: 'attack_values', confidence: 'high', keywords: ['extreme', 'radical', 'out of step', 'anti-'] });
            }

            // Association attack (connect opponent to unpopular figures/groups)
            if (textLower.match(/\b(?:tied|linked|aligned)\s+(?:to|with)\b|\bfunded by\b|\b(?:backed|bankrolled)\s+by\b|\b(?:lobby|special interests?|dark money)\b|\b(?:trump|maga)\s+(?:and|'s|agenda|allies|republicans?)\b|\b(?:scheme|plot)\b|\b(?:betrayal|deal)\b|\bin\s+bed\s+with|\bdoing\s+the\s+bidding\s+of|\bserves?\s+\w+\s+not\s+\w+/i)) {
                detected.push({ subtype: 'attack_association', confidence: 'high', keywords: ['tied to', 'funded by', 'special interests', 'Trump', 'MAGA', 'scheme', 'betrayal'] });
            }

            // Hypocrisy attack
            if (textLower.match(/\b(?:hypocrisy|hypocrite|double standard)\b|\bsays\s+.*\s+but\s+(?:votes|voted|does|did)\b|\b(?:then|yet)\s+(?:voted|did)\b/i)) {
                detected.push({ subtype: 'attack_hypocrisy', confidence: 'high', keywords: ['hypocrisy', 'double standard', 'says...but'] });
            }

            // Ethics/corruption attack
            if (textLower.match(/\b(?:illegal|unlawful|ethics|corrupt(?:ion)?|pay[- ]?to[- ]?play|quid pro quo)\b|\bconflict of interest\b/i)) {
                detected.push({ subtype: 'attack_ethics', confidence: 'high', keywords: ['corruption', 'illegal', 'ethics', 'conflict of interest'] });
            }

            // Fear/risk attack (emphasize harm, loss, consequences)
            if (textLower.match(/\b(?:danger(?:ous)?|threat(?:en)?(?:s|ing|ed)?|risk(?:s|ing|ed)?|endanger(?:s|ing|ed)?|attack(?:s|ing|ed)?\s+on\s+(?:democracy|freedom|rights))\b|\bputs?\s+(?:at\s+)?risk|\bforced?\s+to\s+(?:close|shut\s+down|go\s+without)|\bcut\s+back\s+(?:services|care|benefits)|\b(?:severe|critical|dangerous)\s+shortages?|\bdelayed?\s+(?:payments?|checks?|benefits?)|\bdisenfranchis(?:e|ing|ed)|\bscrew(?:s|ing|ed)?\s+(?:over|the)|\b(?:will|would|could|may)\s+suffer|\bat\s+the\s+expense\s+of/i)) {
                detected.push({ subtype: 'attack_fear', confidence: 'high', keywords: ['danger', 'threat', 'risk', 'forced to close', 'severe shortages', 'delayed payments', 'disenfranchise', 'suffer'] });
            }

            // Contrast attack
            if (textLower.match(/\bwhile\s+(?:they|opponent)\s+.*\s+(?:we|our\s+(?:campaign|plan))\b|\bthe(?:m|ir)\s+vs\.?\s+us\b|\bby the numbers\b|\b(?:in contrast|whereas)\b/i)) {
                detected.push({ subtype: 'attack_contrast', confidence: 'medium', keywords: ['while they', 'them vs us', 'in contrast'] });
            }

            // Rapid response/counterattack (support more phrasings)
            if (textLower.match(/\b(?:in response to|on the heels of|minutes after|following|after)\s+(?:last night'?s|the|their|his|her)\b|\b(?:claim|charge|attack)\s+is\s+(?:false|misleading|a lie)\b|\b(?:correct the record|fact check(?:ed)?|set the record straight)\b/i)) {
                detected.push({ subtype: 'attack_rapid_response', confidence: 'high', keywords: ['in response to', 'on the heels of', 'false claim', 'correct the record'] });
            }
        }

        // MEDIA_ADVISORY-specific subtypes
        if (releaseType === 'MEDIA_ADVISORY') {
            if (textLower.match(/\b(?:press\s+conference|news\s+conference)/i)) {
                detected.push({ subtype: 'press_conference', confidence: 'high', keywords: ['press conference'] });
            }
            if (textLower.match(/\b(?:photo\s+op|photo\s+opportunity|visual)/i)) {
                detected.push({ subtype: 'photo_opportunity', confidence: 'high', keywords: ['photo op', 'visual'] });
            }
            if (textLower.match(/\b(?:interview|availability|media\s+availability)/i)) {
                detected.push({ subtype: 'interview_availability', confidence: 'high', keywords: ['interview', 'availability'] });
            }
            if (textLower.match(/\b(?:event|rally|town\s+hall)/i)) {
                detected.push({ subtype: 'event_announcement', confidence: 'medium', keywords: ['event', 'rally', 'town hall'] });
            }
        }

        // LETTER-specific subtypes
        if (releaseType === 'LETTER') {
            if (textLower.match(/\b(?:calls?\s+for|urges?|demands?)/i)) {
                detected.push({ subtype: 'call_to_action', confidence: 'high', keywords: ['calls for', 'urges', 'demands'] });
            }
            if (textLower.match(/\b(?:inquiry|investigation|concerns?)/i)) {
                detected.push({ subtype: 'inquiry_letter', confidence: 'medium', keywords: ['inquiry', 'investigation'] });
            }
        }

        // TRANSCRIPT-specific subtypes
        if (releaseType === 'TRANSCRIPT') {
            if (textLower.match(/\b(?:debate|forum)/i)) {
                detected.push({ subtype: 'debate_transcript', confidence: 'high', keywords: ['debate', 'forum'] });
            }
            if (textLower.match(/\b(?:interview|q&a|questions?\s+and\s+answers?)/i)) {
                detected.push({ subtype: 'interview_transcript', confidence: 'high', keywords: ['interview', 'Q&A'] });
            }
            if (textLower.match(/\b(?:speech|remarks?|address)/i)) {
                detected.push({ subtype: 'speech_transcript', confidence: 'high', keywords: ['speech', 'remarks', 'address'] });
            }
        }

        return detected.length > 0 ? detected : [{ subtype: 'general', confidence: 'low', keywords: [] }];
    }

    /**
     * Detect issues/topics from press release content
     * Based on training from real press releases
     * Returns array of detected issues with confidence scores
     */
    detectIssues(text) {
        const detected = [];
        const textLower = text.toLowerCase();

        // HEALTHCARE
        if (textLower.match(/\b(?:health\s*care|healthcare|medical|coverage|affordable\s+care\s+act|medicaid|medicare|insurance|hospital)/i)) {
            detected.push({ issue: 'healthcare', confidence: 'high' });
        }

        // INFRASTRUCTURE
        if (textLower.match(/\b(?:infrastructure|gateway|transit|roads?|bridges?|transportation|rail)/i)) {
            detected.push({ issue: 'infrastructure', confidence: 'high' });
        }

        // ISRAEL/PALESTINE
        if (textLower.match(/\b(?:israel|gaza|palestine|israeli\s+government|block\s+the\s+bombs|middle\s+east|hostages)/i)) {
            detected.push({ issue: 'israel_palestine', confidence: 'high' });
        }

        // CRYPTOCURRENCY
        if (textLower.match(/\b(?:crypto|bitcoin|cryptocurrency|digital\s+assets?|blockchain)/i)) {
            detected.push({ issue: 'cryptocurrency', confidence: 'high' });
        }

        // GOVERNMENT SHUTDOWN
        if (textLower.match(/\b(?:government\s+shutdown|shutdown|keep\s+the\s+government\s+open)/i)) {
            detected.push({ issue: 'government_shutdown', confidence: 'high' });
        }

        // TAXES
        if (textLower.match(/\b(?:tax(?:es|ation)?|IRS|tax\s+(?:cuts?|reform|code|policy))/i)) {
            detected.push({ issue: 'taxes', confidence: 'high' });
        }

        // ELECTIONS
        if (textLower.match(/\b(?:election|campaign|voter|ballot|poll|primary|general\s+election)/i)) {
            detected.push({ issue: 'elections', confidence: 'medium' });
        }

        // CIVIL RIGHTS
        if (textLower.match(/\b(?:civil\s+rights\s+act|discrimination|segregation|voting\s+rights|equality)/i)) {
            detected.push({ issue: 'civil_rights', confidence: 'high' });
        }

        // FREE SPEECH
        if (textLower.match(/\b(?:free\s+speech|first\s+amendment|censorship)/i)) {
            detected.push({ issue: 'free_speech', confidence: 'high' });
        }

        // POLITICAL VIOLENCE
        if (textLower.match(/\b(?:political\s+violence|assassination|murder|killing|attack)/i)) {
            detected.push({ issue: 'political_violence', confidence: 'high' });
        }

        // FOREIGN POLICY (general)
        if (textLower.match(/\b(?:foreign\s+policy|international|diplomatic|ambassador|state\s+department)/i)) {
            detected.push({ issue: 'foreign_policy', confidence: 'medium' });
        }

        // EDUCATION
        if (textLower.match(/\b(?:education|school|student|teacher|university|college)/i)) {
            detected.push({ issue: 'education', confidence: 'medium' });
        }

        // CLIMATE
        if (textLower.match(/\b(?:climate|environment|clean\s+energy|renewable|carbon|emissions)/i)) {
            detected.push({ issue: 'climate', confidence: 'medium' });
        }

        // IMMIGRATION
        if (textLower.match(/\b(?:immigration|immigrant|border|DACA|asylum|deportation)/i)) {
            detected.push({ issue: 'immigration', confidence: 'high' });
        }

        // ECONOMY
        if (textLower.match(/\b(?:economy|economic|jobs|employment|unemployment|inflation|recession)/i)) {
            detected.push({ issue: 'economy', confidence: 'medium' });
        }

        // HOUSING
        if (textLower.match(/\b(?:housing|affordable\s+housing|homelessness|rent)/i)) {
            detected.push({ issue: 'housing', confidence: 'high' });
        }

        // CRIMINAL JUSTICE
        if (textLower.match(/\b(?:criminal\s+justice|police|law\s+enforcement|incarceration|prison)/i)) {
            detected.push({ issue: 'criminal_justice', confidence: 'medium' });
        }

        // GUN CONTROL
        if (textLower.match(/\b(?:gun|firearm|second\s+amendment|shooting|NRA)/i)) {
            detected.push({ issue: 'gun_control', confidence: 'high' });
        }

        // ABORTION
        if (textLower.match(/\b(?:abortion|reproductive|Roe\s+v\.?\s+Wade|pro-choice|pro-life)/i)) {
            detected.push({ issue: 'abortion', confidence: 'high' });
        }

        // SOCIAL SECURITY
        if (textLower.match(/\b(?:social\s+security|retirement\s+age|retirees|seniors|medicare\s+and\s+social\s+security)/i)) {
            detected.push({ issue: 'social_security', confidence: 'high' });
        }

        // VETERANS
        if (textLower.match(/\b(?:veteran|veterans|VA|department\s+of\s+veterans\s+affairs|military\s+service|service\s+members)/i)) {
            detected.push({ issue: 'veterans', confidence: 'high' });
        }

        // DISASTER RECOVERY / EMERGENCY MANAGEMENT
        if (textLower.match(/\b(?:hurricane|disaster|emergency|recovery|FEMA|flooding|wildfire|storm|damage|rebuild|relief)/i)) {
            detected.push({ issue: 'disaster_recovery', confidence: 'high' });
        }

        // TRUMP/OPPONENT RECORD
        if (textLower.match(/\b(?:Trump|opponent)\b/i) &&
            textLower.match(/\b(?:record|administration|policies|actions|failed|refuses)/i)) {
            detected.push({ issue: 'opponent_record', confidence: 'medium' });
        }

        return detected.length > 0 ? detected : [{ issue: 'general', confidence: 'low' }];
    }

    /**
     * Extract all quotes and their attribution
     * Handles both standard quotes and multi-paragraph journalism-style quotes
     * Multi-paragraph format: Each paragraph starts with " but only last has closing "
     * @param {string} text - The press release text
     * @param {string} headline - The headline (to filter out false positive quotes)
     * @param {string} subhead - The subheadline (to filter out false positive quotes)
     */
    extractQuotes(text, headline = '', subhead = '') {
        const quotes = [];

        // STEP 0: Detect statement format - if someone "released a statement", apply speaker to all quotes
        const statementFormat = this.detectStatementFormat(text);

        // STEP 0.25: Extract ad transcript dialogue (Speaker: "Quote" format)
        const adTranscriptQuotes = this.extractAdTranscriptDialogue(text);

        // STEP 0.5: Extract joint statements (unquoted statement text after "released the following statement:")
        const jointStatementQuotes = this.extractJointStatements(text);

        // STEP 1: Detect and extract multi-paragraph journalism-style quotes first
        // Format: "Para 1...\n\n"Para 2...\n\n"Para 3..." said Speaker
        const multiParaQuotes = this.extractMultiParagraphQuotes(text);

        // Track positions of quotes to skip them in regular extraction
        const skipPositions = [];

        // Add multi-paragraph quote positions
        multiParaQuotes.forEach(q => {
            skipPositions.push({
                start: q.position,
                end: q.position + q.fullText.length
            });
        });

        // Add ad transcript quote positions
        adTranscriptQuotes.forEach(q => {
            skipPositions.push({
                start: q.position,
                end: q.position + q.quote_text.length + 20  // Add buffer for quote marks and speaker
            });
        });

        // STEP 2: Extract regular quotes (single paragraph or properly paired)
        const regularQuotes = this.extractRegularQuotes(text, skipPositions);

        // STEP 3: Combine and filter
        const allQuotes = [...adTranscriptQuotes, ...jointStatementQuotes, ...multiParaQuotes, ...regularQuotes];

        // Find Background section position (to exclude quotes from it)
        const backgroundMatch = text.match(/^Background:/im);
        const backgroundStart = backgroundMatch ? backgroundMatch.index : -1;

        // Filter out quotes from headline/subhead and Background section
        const filteredQuotes = allQuotes.filter(quote => {
            const quoteText = quote.quote_text;

            // Filter out headline/subhead quotes
            if ((headline && headline.includes(quoteText)) || (subhead && subhead.includes(quoteText))) {
                return false;
            }

            // Filter out quotes from Background section
            if (backgroundStart >= 0 && quote.position >= backgroundStart) {
                return false;
            }

            return true;
        });

        // STEP 4: Apply statement speaker to quotes without attribution
        if (statementFormat && statementFormat.speaker) {
            filteredQuotes.forEach(quote => {
                // If quote has no speaker or empty speaker, apply statement speaker
                if (!quote.speaker_name || quote.speaker_name.trim() === '' || quote.speaker_name === 'Unknown Speaker') {
                    quote.speaker_name = statementFormat.speaker;
                    quote.speaker_title = quote.speaker_title || '';
                    quote.full_attribution = `Statement from ${statementFormat.speaker}`;
                }
            });
        }

        // STEP 5: Sort by position in document
        filteredQuotes.sort((a, b) => a.position - b.position);

        return filteredQuotes;
    }

    /**
     * Extract ad transcript dialogue
     * Format: Speaker: "Quote"
     * Handles TV/radio ad scripts with dialogue between speakers
     * Example:
     *   AD TRANSCRIPT:
     *   V/O: "Opponent's name"
     *   Opponent: "Quote from opponent"
     */
    extractAdTranscriptDialogue(text) {
        const quotes = [];

        // Look for "AD TRANSCRIPT:" or similar markers
        const adMarkerPattern = /(?:AD|VIDEO|RADIO)\s+(?:TRANSCRIPT|SCRIPT):/i;
        const adMarkerMatch = text.match(adMarkerPattern);

        if (!adMarkerMatch) {
            return quotes; // No ad transcript found
        }

        // Extract the text after the ad marker
        const startPos = adMarkerMatch.index + adMarkerMatch[0].length;
        const adSection = text.substring(startPos);

        // Pattern: Speaker: "Quote" or Speaker: "Quote"
        // Common speakers: V/O (voice-over), Sears, opponent names, etc.
        const dialoguePattern = /^([A-Z][A-Za-z/]*(?:\s+[A-Z][A-Za-z]*)?)\s*:\s*[""](.+?)[""]$/gm;

        let match;
        let lineNum = 0;
        const adLines = adSection.split('\n');

        for (const line of adLines) {
            // Stop if we hit another section marker
            if (line.match(/^Background:/i) ||
                line.match(/^###/) ||
                line.match(/^Contact:/i) ||
                line.match(/^The ad /i)) {
                break;
            }

            const trimmed = line.trim();
            const dialogueMatch = trimmed.match(/^([A-Z][A-Za-z/]*(?:\s+[A-Z][A-Za-z]*)?)\s*:\s*["""](.+?)["""]$/);

            if (dialogueMatch) {
                let speakerLabel = dialogueMatch[1].trim();
                const quoteText = dialogueMatch[2].trim();

                // Expand speaker labels using general rules
                let speakerName = speakerLabel;
                let speakerTitle = '';

                if (speakerLabel === 'V/O' || speakerLabel === 'VO') {
                    // General rule: V/O is voice-over narrator in any ad
                    speakerName = 'Narrator';
                    speakerTitle = 'Voice-over';
                } else {
                    // General rule: Search document for full name containing this label
                    // Speaker label is likely a last name - search backward for full name
                    const contextWindow = text.substring(0, text.indexOf(trimmed));

                    // Look for pattern: "First Last" or "First Middle Last" or "First Hyphen-Last"
                    // where Last (or Hyphen-Last) contains speakerLabel
                    // Handle hyphenated names (e.g., Earle-Sears)
                    const escapedLabel = speakerLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // Try different patterns:
                    // 1. Full match with hyphens: "Winsome Earle-Sears"
                    const hyphenatedPattern = new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][-a-z]+)*\\s+[A-Z][-a-z]*${escapedLabel}[-a-z]*)\\b`, 'gi');
                    let nameMatches = contextWindow.match(hyphenatedPattern);

                    // 2. If not found, try without hyphen requirements: "Winsome Sears"
                    if (!nameMatches || nameMatches.length === 0) {
                        const simplePattern = new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\s+${escapedLabel})\\b`, 'gi');
                        nameMatches = contextWindow.match(simplePattern);
                    }

                    if (nameMatches && nameMatches.length > 0) {
                        // Use the last (most recent) occurrence
                        const fullName = nameMatches[nameMatches.length - 1].trim();
                        speakerName = fullName;

                        // Try to extract title (Governor, Senator, etc.)
                        speakerTitle = this.extractSpeakerTitle(fullName, text);
                    }
                    // If no full name found, keep the label as-is
                }

                quotes.push({
                    quote_text: quoteText,
                    speaker_name: speakerName,
                    speaker_title: speakerTitle,
                    full_attribution: speakerTitle ? `${speakerName} (${speakerTitle})` : speakerName,
                    position: text.indexOf(trimmed),
                    confidence: 0.9,
                    type: 'ad-transcript'
                });
            }

            lineNum++;
        }

        return quotes;
    }

    /**
     * Extract joint statements (unquoted statement text)
     * Format: "Name(s) released the following [joint] statement:\n\nStatement text..."
     * The statement text has no quotation marks but should be treated as a quote
     */
    extractJointStatements(text) {
        const quotes = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Look for "released the following [joint] statement:" pattern
            const statementMatch = line.match(/released the following (?:joint )?statement:/i);
            if (!statementMatch) continue;

            // Extract speaker name(s) from the line
            // Pattern: "Today, [SPEAKER NAMES] released the following..."
            // or: "[SPEAKER NAMES] released the following..."
            let speaker = '';
            const beforeReleased = line.substring(0, statementMatch.index).trim();

            // Remove "Today," or date prefixes
            let speakerText = beforeReleased
                .replace(/^Today,?\s*/i, '')
                .replace(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+/i, '')
                .replace(/^[A-Z][a-z]+\s+\d{1,2},?\s+\d{4},?\s*/i, '')
                .trim();

            speaker = speakerText;

            // Now collect the statement text (all paragraphs after the pattern)
            let statementParagraphs = [];
            let j = i + 1;

            // Skip empty lines immediately after the statement marker
            while (j < lines.length && lines[j].trim() === '') {
                j++;
            }

            // Collect paragraphs until we hit a stopping condition
            let currentParagraph = '';
            while (j < lines.length) {
                const currentLine = lines[j].trim();

                // Stop conditions
                if (currentLine === '###' ||
                    currentLine === '---' ||
                    currentLine.match(/^Contact:/i) ||
                    currentLine.match(/^For (?:more )?information/i) ||
                    currentLine.match(/^Media (?:Contact|Inquiries)/i) ||
                    currentLine.match(/^\d{3}[.-]\d{3}[.-]\d{4}/) || // Phone number
                    currentLine.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) { // Email
                    break;
                }

                // Empty line indicates paragraph break
                if (currentLine === '') {
                    if (currentParagraph.trim()) {
                        statementParagraphs.push(currentParagraph.trim());
                        currentParagraph = '';
                    }
                } else {
                    // Add line to current paragraph
                    if (currentParagraph) {
                        currentParagraph += ' ' + currentLine;
                    } else {
                        currentParagraph = currentLine;
                    }
                }

                j++;
            }

            // Add last paragraph if exists
            if (currentParagraph.trim()) {
                statementParagraphs.push(currentParagraph.trim());
            }

            // Create quote object if we found statement text
            if (statementParagraphs.length > 0) {
                const quoteText = statementParagraphs.join('\n\n');

                quotes.push({
                    quote_text: quoteText,
                    speaker_name: speaker || 'Unknown',
                    speaker_title: '',
                    full_attribution: speaker ? `Statement from ${speaker}` : 'Statement',
                    position: text.indexOf(line),
                    type: 'joint-statement'
                });

                // Skip ahead past what we've processed
                i = j - 1;
            }
        }

        return quotes;
    }

    /**
     * Extract multi-paragraph journalism-style quotes
     * Format: "Para 1 text\n\n"Para 2 text\n\n"Para 3 text," said Speaker
     * Each paragraph starts with " but only the last has closing "
     */
    extractMultiParagraphQuotes(text) {
        const quotes = [];
        const paragraphs = text.split(/\n\n+/);
        let i = 0;

        const DEBUG = false; // Set to true for debugging

        while (i < paragraphs.length) {
            const para = paragraphs[i].trim();

            // Check if paragraph starts with opening quote
            if (para.match(/^[""]/) && para.length > 20) {
                // Check if this paragraph has a closing quote
                // Count quotes: if only 1 quote (the opening), it's multi-paragraph format
                // If 2+ quotes (opening + closing), it's a complete quote
                const quoteCount = (para.match(/[""]/g) || []).length;
                const hasClosingQuote = quoteCount >= 2;

                if (DEBUG) {
                    console.log(`\nPara ${i}: Starts with quote, length ${para.length}`);
                    console.log(`  Preview: ${para.substring(0, 80)}...`);
                    console.log(`  Last 40: ...${para.substring(para.length - 40)}`);
                    console.log(`  Quote count: ${quoteCount}`);
                    console.log(`  Has closing quote: ${hasClosingQuote ? 'YES' : 'NO'}`);
                }

                if (!hasClosingQuote) {
                    // This might be start of multi-paragraph quote
                    // Collect all consecutive paragraphs that start with "
                    const quoteParagraphs = [para];
                    let j = i + 1;
                    let foundClosing = false;
                    let attribution = '';

                    while (j < paragraphs.length && j < i + 10) { // Max 10 paragraphs
                        const nextPara = paragraphs[j].trim();

                        if (nextPara.match(/^[""]/) && nextPara.length > 20) {
                            quoteParagraphs.push(nextPara);

                            // Check if this paragraph has a closing quote (quote count >= 2)
                            const nextQuoteCount = (nextPara.match(/[""]/g) || []).length;
                            const hasClosing = nextQuoteCount >= 2;
                            if (hasClosing) {
                                // Found the closing paragraph
                                foundClosing = true;

                                // Extract attribution text after the closing quote
                                // Pattern: ..." said Speaker or ..."," said Speaker
                                const attrMatch = nextPara.match(/[""]([^"""]+)$/);
                                if (attrMatch) {
                                    attribution = attrMatch[1].trim();
                                }

                                j++;
                                break;
                            }
                            j++;
                        } else {
                            // Next paragraph doesn't start with quote, not multi-para
                            break;
                        }
                    }

                    // If we found a proper multi-paragraph quote structure
                    if (foundClosing && quoteParagraphs.length > 1) {
                        // Combine paragraphs, removing quote marks
                        let combinedText = quoteParagraphs.map(p => {
                            // Remove opening quote
                            let cleaned = p.replace(/^[""]/, '').trim();
                            // Remove closing quote from last paragraph
                            cleaned = cleaned.replace(/[""]([^"""]*?)$/, '$1').trim();
                            return cleaned;
                        }).join('\n\n');

                        // Extract attribution from the combined attribution text
                        const speaker = this.extractAttributionFromText(attribution, text);

                        // Calculate position in original text
                        const position = text.indexOf(quoteParagraphs[0]);

                        quotes.push({
                            quote_text: combinedText,
                            speaker_name: speaker.name,
                            speaker_title: speaker.title,
                            full_attribution: speaker.attribution,
                            position: position,
                            fullText: quoteParagraphs.join('\n\n'),
                            type: 'multi-paragraph'
                        });

                        // Skip past all the paragraphs we just processed
                        i = j;
                        continue;
                    }
                }
            }
            i++;
        }

        return quotes;
    }

    /**
     * Extract attribution (speaker info) from attribution text
     * Handles patterns like "said Mikie Sherrill", "according to John Smith", etc.
     */
    extractAttributionFromText(attributionText, fullText = '') {
        if (!attributionText) {
            return { name: '', title: '', attribution: 'Unknown Speaker' };
        }

        // Pattern: "said Mikie Sherrill" or "according to John Smith"
        // UPDATED: Support hyphenated names (e.g., "Ocasio-Cortez") and single names
        const patterns = [
            /(?:said|according to|stated|announced|noted|explained|added|continued)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)/i,
            /^([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+(?:said|stated|announced)/i,
            /^([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)/i // Fallback: just extract name
        ];

        for (const pattern of patterns) {
            const match = attributionText.match(pattern);
            if (match) {
                const speakerName = this.extractSpeakerName(match[1], fullText) || match[1].trim();
                const speakerTitle = this.extractSpeakerTitle(speakerName, fullText);

                return {
                    name: speakerName,
                    title: speakerTitle,
                    attribution: attributionText.trim() || speakerName
                };
            }
        }

        return { name: '', title: '', attribution: attributionText.trim() || 'Unknown Speaker' };
    }

    /**
     * Extract regular (non-multi-paragraph) quotes
     * Skip positions that are part of multi-paragraph quotes
     */
    extractRegularQuotes(text, skipPositions = []) {
        const rawQuotes = [];

        // Track the most recent speaker for continuation patterns ("she added", "he continued")
        let previousSpeaker = null;

        // Find all quoted text using quotation marks
        // Supports both straight quotes (") and curly/smart quotes (\u201C \u201D)
        const quotePattern = /"([^"]+?)"|\u201C([^\u201C\u201D]+?)\u201D/g;
        let match;

        while ((match = quotePattern.exec(text)) !== null) {
            const quoteStartPos = match.index;
            const quoteEndPos = quoteStartPos + match[0].length;

            // Check if this position is part of a multi-paragraph quote
            const isPartOfMultiPara = skipPositions.some(range =>
                quoteStartPos >= range.start && quoteStartPos < range.end
            );

            if (isPartOfMultiPara) {
                continue;
            }

            // Get text from whichever group matched (group 1 for straight, group 2 for curly)
            const quoteText = (match[1] || match[2]).trim();

            // Check what character is at the end of the quote text (INSIDE the quotes)
            const lastCharOfQuote = quoteText.slice(-1);
            const isMultiPartQuote = (lastCharOfQuote === ',');
            const isEndOfQuote = (lastCharOfQuote === '.');

            // Extract context after the quote (next ~200 characters)
            const contextAfter = text.substring(quoteEndPos, quoteEndPos + 200);

            // Extract context before the quote (previous ~200 characters)
            const contextBefore = text.substring(Math.max(0, quoteStartPos - 200), quoteStartPos);

            // Look for attribution patterns after the quote
            // Handles: "quote," said Speaker at event
            // Handles: "quote" said Speaker
            // Handles: "quote", according to Speaker
            // NEW: Also handles pronouns and generic titles
            // UPDATED: Allow periods in names for abbreviated titles like "Rep. Dave Min"
            const afterPattern = /^[,\s]*(said|according to|stated|announced|noted|explained|added|continued|emphasized)\s+([A-Z][^,]+?)(?:\s+at\s|\s+in\s|\s+during\s|\s+on\s|\.$|$)/i;
            const afterMatch = contextAfter.match(afterPattern);

            // Also handle reversed attribution: "quote," Name verb.
            // Handles: "quote," Porter continued. or "quote," Smith added.
            // Note: NOT case-insensitive to avoid matching pronouns like "she"/"he"
            // UPDATED: Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
            const reversedPattern = /^[,\s]*([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+(said|stated|announced|noted|explained|added|continued|emphasized|told)/;
            const reversedMatch = contextAfter.match(reversedPattern);

            // Also check for simple pronoun attribution: "quote," she said. or "quote," he said.
            const pronounPattern = /^[,\s]*(she|he|they)\s+(said|stated|announced|noted|explained|added|told)/i;
            const pronounMatch = contextAfter.match(pronounPattern);

            let attribution = null;
            let speaker_name = '';
            let speaker_title = '';

            if (afterMatch) {
                attribution = afterMatch[2].trim();
                speaker_name = this.extractSpeakerName(attribution, text);
                speaker_title = this.extractSpeakerTitle(attribution, text);
            } else if (reversedMatch) {
                // Handle "Name verb" pattern (e.g., "Porter continued" or "Chen said")
                const name = reversedMatch[1].trim();
                const verb = reversedMatch[2].trim();
                attribution = `${name} ${verb}`;

                // If name appears to be just a last name (single word), search backward for full name
                const isSingleWord = !name.includes(' ');
                if (isSingleWord) {
                    // Search backward in the text for a full name containing this last name
                    const contextWindow = text.substring(Math.max(0, quoteStartPos - 1000), quoteStartPos);

                    // Look for "Title FirstName LastName" pattern
                    const titlesPattern = this.titles.map(t => t.replace(/\./g, '\\.')).join('|');
                    const fullNamePattern = new RegExp(`((?:${titlesPattern})\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*\\s+${name})\\b`, 'gi');
                    const fullNameMatch = fullNamePattern.exec(contextWindow);

                    if (fullNameMatch) {
                        // Found full name with title - extract title and name separately
                        const fullNameWithTitle = fullNameMatch[1].trim();
                        speaker_title = this.extractSpeakerTitle(fullNameWithTitle, text);

                        // Strip title from speaker_name to avoid duplication
                        // e.g., "Governor John Chen" -> "John Chen"
                        const titlePattern = new RegExp(`^(${titlesPattern})\\s+`, 'i');
                        speaker_name = fullNameWithTitle.replace(titlePattern, '').trim();
                    } else {
                        // Look for "FirstName LastName" pattern (without title)
                        const namePattern = new RegExp(`\\b([A-Z][a-z]+\\s+${name})\\b`, 'g');
                        const nameMatch = namePattern.exec(contextWindow);

                        if (nameMatch) {
                            speaker_name = nameMatch[1].trim();
                            speaker_title = this.extractSpeakerTitle(speaker_name, text);
                        } else {
                            // Fallback: use the last name only
                            speaker_name = name;
                            speaker_title = this.extractSpeakerTitle(name, text);
                        }
                    }
                } else {
                    // Name already includes first and last name
                    speaker_name = name;
                    speaker_title = this.extractSpeakerTitle(name, text);
                }
            } else if (pronounMatch) {
                // Handle pronoun attribution - try to find the actual speaker from context
                const pronoun = pronounMatch[1];
                const verb = pronounMatch[2];
                attribution = `${pronoun} ${verb}`;

                // If we have a previous speaker, use it for pronoun resolution
                // This handles both continuation verbs (added, continued) and simple verbs (said, stated)
                if (previousSpeaker) {
                    speaker_name = previousSpeaker;
                } else {
                    // Only search for names if we don't have a previous speaker
                    const contextWindow = text.substring(Math.max(0, quoteStartPos - 500), quoteStartPos);
                    // Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
                    const namePattern = /\b([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)+)\b/g;
                    const names = [];
                    let nameMatch;
                    while ((nameMatch = namePattern.exec(contextWindow)) !== null) {
                        // Filter out institutions and role phrases
                        const name = nameMatch[1];
                        const isInstitution = /University|Institute|College|Convention|Convocation|Conference|Summit|Forum|School|Department|Office|Law|Committee|Commission|Association|Foundation|Center|Board/i.test(name);
                        const isRolePhrase = /^As\s+(Governor|President|Senator|Representative|Congressman|Congresswoman|Mayor|Attorney|Secretary|Director|Chief)/i.test(name);
                        if (!isInstitution && !isRolePhrase) {
                            names.push(name);
                        }
                    }
                    // Use the most recent name found before the quote
                    if (names.length > 0) {
                        speaker_name = names[names.length - 1];
                    }
                }
            } else {
                // IMPROVEMENT #007: Check for narrative attribution with colon before quote
                // Pattern: "She told students:" or "He told the audience:" or "Spanberger told attendees:"
                // Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
                const narrativePattern = /(she|he|they|[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+told\s+[^:]+:\s*$/i;
                const narrativeMatch = contextBefore.match(narrativePattern);

                if (narrativeMatch) {
                    const subject = narrativeMatch[1].trim();

                    // If it's a pronoun, try to find the referent
                    if (/^(she|he|they)$/i.test(subject)) {
                        // Look for the most recent proper name before this quote
                        // Prefer names that start with titles or appear in title+name format
                        const contextWindow = text.substring(Math.max(0, quoteStartPos - 500), quoteStartPos);

                        // First try to find title + name pattern (most reliable for person names)
                        const titlesPattern = this.titles.map(t => t.replace(/\./g, '\\.')).join('|');
                        const titleNamePattern = new RegExp(`((?:${titlesPattern})\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)`, 'gi');
                        const titleNames = [];
                        let titleMatch;
                        while ((titleMatch = titleNamePattern.exec(contextWindow)) !== null) {
                            titleNames.push(titleMatch[1]);
                        }

                        if (titleNames.length > 0) {
                            // Found title+name, use the last one
                            const fullName = titleNames[titleNames.length - 1];
                            speaker_name = this.extractSpeakerName(fullName, text) || fullName;
                            speaker_title = this.extractSpeakerTitle(fullName, text);
                            attribution = fullName;
                        } else {
                            // Fallback: look for any capitalized multi-word name
                            const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
                            const names = [];
                            let nameMatch;
                            while ((nameMatch = namePattern.exec(contextWindow)) !== null) {
                                // Filter out likely non-person names (University, Institute, School, Law, etc.)
                                const name = nameMatch[1];
                                if (!/University|Institute|College|Convention|Convocation|Conference|Summit|Forum|School|Department|Office|Law|Committee|Commission|Association|Foundation|Center|Board/i.test(name)) {
                                    names.push(name);
                                }
                            }
                            if (names.length > 0) {
                                speaker_name = names[names.length - 1];
                                speaker_title = this.extractSpeakerTitle(speaker_name, text);
                                attribution = speaker_name;
                            }
                        }
                    } else {
                        // It's a direct name reference
                        speaker_name = this.extractSpeakerName(subject, text) || subject;
                        speaker_title = this.extractSpeakerTitle(subject, text);
                        attribution = subject;
                    }
                } else {
                    // Look for attribution patterns before the quote
                    const beforePattern = /(?:according to|as)\s+([^,]+?)\s+(?:said|stated|noted|explained)[,:\s]*$/i;
                    const beforeMatch = contextBefore.match(beforePattern);

                    if (beforeMatch) {
                        attribution = beforeMatch[1].trim();
                        speaker_name = this.extractSpeakerName(attribution, text);
                        speaker_title = this.extractSpeakerTitle(attribution, text);
                    } else {
                        // Pattern: Speaker Name said "quote"
                        // NEW: More flexible - allows extra words between name and "said" (e.g., "said on Instagram that")
                        // UPDATED: Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
                        const speakerBeforePattern = /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)\s+(?:said|stated|announced|noted|explained)(?:\s+\w+(?:\s+\w+){0,5}?\s+that)?[,:\s]*$/i;
                        const speakerBeforeMatch = contextBefore.match(speakerBeforePattern);

                        if (speakerBeforeMatch) {
                            speaker_name = speakerBeforeMatch[1].trim();
                            speaker_title = this.extractSpeakerTitle(speaker_name, text);
                            attribution = speaker_name;
                            // Try to find full name in document
                            speaker_name = this.extractSpeakerName(speaker_name, text);
                        } else {
                            // NEW: Also try to find ANY speaker name followed by any "said"-like verb within reasonable distance
                            const flexiblePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[^"]{1,100}(?:said|stated|announced|noted|explained|says)[^"]{0,50}$/i;
                            const flexibleMatch = contextBefore.match(flexiblePattern);
                            if (flexibleMatch) {
                                speaker_name = flexibleMatch[1].trim();
                                speaker_title = this.extractSpeakerTitle(speaker_name, text);
                                attribution = speaker_name;
                            }
                        }
                    }
                }
            }

            // Calculate quote confidence
            const quoteConfidence = this.calculateFieldConfidence({
                patternMatch: speaker_name ? 'strong' : attribution ? 'medium' : 'weak',
                completeness: quoteText && quoteText.length > 10 ? 1.0 : 0.5,
                formatValid: quoteText && quoteText.length > 0
            });

            // FILTER OUT: Quoted phrases in descriptive text without proper attribution
            // Skip if:
            // 1. Short quote (1-5 words) without attribution AND in descriptive context
            // 2. Quote in bullet list without attribution
            // 3. Quote in descriptive phrase (titled, calling, saying, etc.)

            const wordCount = quoteText.split(/\s+/).length;
            const hasAttribution = speaker_name || (attribution && attribution !== 'Unknown Speaker');

            // Check for descriptive phrase patterns in context before quote
            // Patterns like: "titled 'X'", "calling X 'Y'", "saying she is 'Y'", "note being 'Y'"
            const descriptivePatterns = [
                /titled\s+$/i,                    // titled "X"
                /calling\s+\w+\s+$/i,             // calling abortion "wicked"
                /saying\s+[\w\s]+\s+$/i,          // saying she is "morally opposed"
                /note\s+being\s+$/i,              // note being "morally opposed"
                /note\s+stating\s+[\w\s]+\s+$/i   // note stating she is "X"
            ];

            const isDescriptivePhrase = descriptivePatterns.some(pattern =>
                contextBefore.match(pattern)
            );

            // Check if quote is in a bullet list (preceded by dash and newline)
            // Fixed: contextBefore ends BEFORE the opening quote, so no quote mark at end
            const bulletPattern = /\n\s*-\s+/;
            const isInBulletList = contextBefore.match(bulletPattern);

            // Check if quote appears after "including:" or "highlights:" (list introduction)
            // Fixed: contextBefore ends BEFORE the opening quote
            const listIntroPattern = /(?:including|highlights|statements|notes that [^:]+):\s*\n/i;
            const isAfterListIntro = contextBefore.match(listIntroPattern);

            // Check if quote is a media/show title reference (e.g., on MSNBC's "The Last Word")
            const mediaTitlePattern = /(?:on|in|from)\s+(?:[A-Z][A-Za-z]*(?:'s)?(?:\s+[A-Z][A-Za-z]*)*'s)\s*$/i;
            const isMediaTitle = contextBefore.match(mediaTitlePattern);

            // Check if quote is immediately followed by "for" or "about" (indicating it's a title/reference, not a spoken quote)
            // Example: on MSNBC's "The Last Word" for refusing...
            const followedByDescriptive = /^\s*(?:for|about|regarding|concerning)\s+/i.test(contextAfter);

            // Check if this is narrative text with embedded quoted phrases (not actual spoken quotes)
            // Patterns: "announced her 'Plan' focused on", "lost its 'Ranking' as"
            // Also: "criticized Trump's 'approach'", "noted that opponent has 'defended'"
            const narrativeWithQuotesPattern = /(?:announced|launched|unveiled|released|introduced|titled|called|named|lost|gained|earned|received|known as|dubbed|criticized|noted that[^'"]+has|described|characterized)\s+(?:her|his|their|its|a|an|the|[A-Z][a-zA-Z-]+'s)\s+$/i;
            const isNarrativeWithQuotes = contextBefore.match(narrativeWithQuotesPattern);

            // Check if quote is immediately followed by text that indicates it's a proper name/title, not speech
            // Patterns: "Plan" focused on, "Ranking" as, "Award" for
            // Also: "approach" and noted, "defended" in response
            const followedByNarrativePattern = /^\s*(?:focused on|as|for|to|that|which|and noted|and said|in response|and added)\s+/i;
            const isFollowedByNarrative = contextAfter.match(followedByNarrativePattern);

            // Skip this quote if it's a descriptive phrase or bullet list item without attribution
            const shouldSkipQuote = !hasAttribution && (
                (wordCount <= 5 && isDescriptivePhrase) ||
                (isInBulletList) ||
                (isAfterListIntro) ||
                (isMediaTitle && followedByDescriptive) ||
                (isNarrativeWithQuotes && isFollowedByNarrative)
            );

            if (!shouldSkipQuote) {
                rawQuotes.push({
                    quote_text: quoteText,
                    speaker_name: speaker_name,
                    speaker_title: speaker_title,
                    full_attribution: attribution || 'Unknown Speaker',
                    position: quoteStartPos,
                    confidence: quoteConfidence,
                    isMultiPart: isMultiPartQuote,
                    isEnd: isEndOfQuote
                });
            }

            // Update previousSpeaker for next quote's continuation verb resolution
            if (speaker_name) {
                previousSpeaker = speaker_name;
            }
        }

        // Combine multi-part quotes from the same speaker
        // A multi-part quote is indicated by ," (comma before closing quote)
        // The sequence ends with ." (period before closing quote)
        const combinedQuotes = [];
        let i = 0;

        while (i < rawQuotes.length) {
            const currentQuote = rawQuotes[i];
            let combinedText = currentQuote.quote_text;
            let j = i + 1;

            // If this quote is part of a multi-part sequence (ends with ",")
            if (currentQuote.isMultiPart) {
                // Remove trailing comma from first part
                combinedText = combinedText.slice(0, -1).trim();

                // Continue adding quotes until we find one that ends with "."
                while (j < rawQuotes.length) {
                    const nextQuote = rawQuotes[j];

                    // Check if quotes are close together (within ~300 characters)
                    const distance = nextQuote.position - (currentQuote.position + 200);

                    // FIXED: Only combine if EXPLICITLY the same speaker
                    // Don't combine if either quote has Unknown Speaker - those should stand alone
                    const bothHaveSpeaker = currentQuote.speaker_name &&
                                          currentQuote.full_attribution !== 'Unknown Speaker' &&
                                          nextQuote.speaker_name &&
                                          nextQuote.full_attribution !== 'Unknown Speaker';

                    const sameSpeaker = bothHaveSpeaker &&
                                       (nextQuote.speaker_name === currentQuote.speaker_name);

                    // Don't combine if next quote has its own separate attribution
                    // (e.g., "Porter continued", "she added" - these are separate quotes)
                    const nextHasSeparateAttribution = nextQuote.full_attribution &&
                                                      nextQuote.full_attribution !== 'Unknown Speaker' &&
                                                      nextQuote.full_attribution !== currentQuote.full_attribution;

                    // Combine if close proximity AND same speaker AND no separate attribution
                    if (distance < 300 && sameSpeaker && !nextHasSeparateAttribution) {
                        // Combine with space (not ellipsis - these are continuous quotes)
                        let nextText = nextQuote.quote_text;

                        // If this is the end quote (ends with "."), keep the period
                        if (nextQuote.isEnd) {
                            combinedText += ' ' + nextText;
                            j++;
                            break;
                        } else if (nextQuote.isMultiPart) {
                            // Strip trailing comma from continuation parts
                            nextText = nextText.slice(0, -1).trim();
                            combinedText += ' ' + nextText;
                        } else {
                            combinedText += ' ' + nextText;
                        }

                        j++;
                    } else {
                        break;
                    }
                }
            }

            combinedQuotes.push({
                quote_text: combinedText,
                speaker_name: currentQuote.speaker_name || '',
                speaker_title: currentQuote.speaker_title || '',
                full_attribution: currentQuote.full_attribution,
                position: currentQuote.position
            });

            i = j;
        }

        // IMPROVEMENT #006: Statement Format Attribution
        // Handle "X released the following statement" pattern where all quotes are implicitly attributed
        // This is a common format in political press releases
        const hasUnattributedQuotes = combinedQuotes.some(q =>
            !q.speaker_name || q.full_attribution === 'Unknown Speaker'
        );

        if (hasUnattributedQuotes) {
            // Look for statement format pattern (general pattern, not release-specific)
            const statementPatterns = [
                /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:released|issued|made)\s+the\s+following\s+statement/i,
                /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+released\s+(?:a|the)\s+statement/i,
                /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+issued\s+(?:a|the)\s+statement/i
            ];

            let statementSpeaker = null;
            let statementSpeakerTitle = '';

            for (const pattern of statementPatterns) {
                const match = text.match(pattern);
                if (match) {
                    const rawSpeaker = match[1].trim();
                    // Extract clean name and title
                    statementSpeaker = this.extractSpeakerName(rawSpeaker, text) || rawSpeaker;
                    statementSpeakerTitle = this.extractSpeakerTitle(rawSpeaker, text);
                    break;
                }
            }

            // If found statement speaker, attribute unattributed quotes to them
            if (statementSpeaker) {
                combinedQuotes.forEach(quote => {
                    if (!quote.speaker_name || quote.full_attribution === 'Unknown Speaker') {
                        quote.speaker_name = statementSpeaker;
                        quote.speaker_title = statementSpeakerTitle;
                        quote.full_attribution = statementSpeaker;
                    }
                });
            }
        }

        return combinedQuotes;
    }

    /**
     * Extract speaker name from attribution text
     * Example: "Mayor Wilson" + full text -> "James Wilson"
     * Searches EARLIER in the document for the first full name reference
     */
    extractSpeakerName(attribution, fullText = '') {
        if (!attribution) return '';

        // Clean up common trailing phrases
        let cleaned = attribution
            .replace(/\s+at\s+.*/i, '')
            .replace(/\s+in\s+.*/i, '')
            .replace(/\s+during\s+.*/i, '')
            .replace(/\s+this\s+.*/i, '')
            .trim();

        // Check for corporate pattern first: "CompanyName CEO FirstName LastName"
        // Example: "ElectricFuture CEO Jennifer Martinez"
        const corpTitlePattern = /([A-Z][a-zA-Z]+)\s+(CEO|CFO|CTO|COO|President|Vice President|Chairman|Director|Manager|Spokesperson)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
        const corpMatch = cleaned.match(corpTitlePattern);
        if (corpMatch) {
            return corpMatch[3]; // Return "FirstName LastName"
        }

        // Build regex pattern from titles list
        const titlesPattern = this.titles.map(t => t.replace(/\./g, '\\.')).join('|');

        // Extract title and full name from attribution
        // Captures one or more capitalized words after title (e.g., "Rep. Dave Min")
        // UPDATED: Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
        const titleLastPattern = new RegExp(`(${titlesPattern})\\s+([A-Z][a-zA-Z'-]+(?:\\s+[A-Z][a-zA-Z'-]+)*)`, 'i');
        const titleLastMatch = cleaned.match(titleLastPattern);

        let lastName = null;
        let title = null;

        if (titleLastMatch) {
            title = titleLastMatch[1];
            lastName = titleLastMatch[2];
        } else {
            // Try to extract any capitalized name (but verify it's not a title)
            // Support hyphenated names (e.g., "Ocasio-Cortez") and apostrophes (e.g., "O'Brien")
            const namePattern = /([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)/;
            const nameMatch = cleaned.match(namePattern);
            if (nameMatch) {
                const name = nameMatch[1];

                // Check if this is actually a title
                if (this.titles.some(t => name.toLowerCase().includes(t.toLowerCase()))) {
                    return cleaned; // It's a title, return as-is
                }

                // If already has first and last name, return it
                if (name.split(' ').length >= 2) {
                    return name;
                }
                lastName = name;
            }
        }

        // If we have a last name, search EARLIER in the document for the full name
        if (lastName && fullText) {
            // IMPROVEMENT: If lastName already contains a hyphen or apostrophe, it's likely complete
            // (e.g., "Ocasio-Cortez", "O'Brien") - return it as-is without searching for first name
            if (/-/.test(lastName) || /'/.test(lastName)) {
                return lastName;
            }

            // Look for "FirstName LastName" pattern
            // Example: find "James Wilson" when we have lastName "Wilson"
            const fullNamePattern = new RegExp(`\\b([A-Z][a-z]+)\\s+${lastName}\\b`, 'g');
            const matches = [];
            let match;

            while ((match = fullNamePattern.exec(fullText)) !== null) {
                const firstName = match[1];

                // Make sure the first name is NOT a title
                if (!this.titles.some(t => t.toLowerCase() === firstName.toLowerCase())) {
                    matches.push({
                        fullName: match[0],
                        position: match.index
                    });
                }
            }

            // Return the FIRST occurrence (earliest in document)
            if (matches.length > 0) {
                matches.sort((a, b) => a.position - b.position);
                return matches[0].fullName;
            }

            // Also try with title: "Title FirstName LastName"
            if (title) {
                const titleFullNamePattern = new RegExp(`${title}\\s+([A-Z][a-z]+)\\s+${lastName}\\b`, 'gi');
                let titleMatch;
                let earliestMatch = null;
                let earliestPosition = Infinity;

                while ((titleMatch = titleFullNamePattern.exec(fullText)) !== null) {
                    if (titleMatch.index < earliestPosition) {
                        earliestPosition = titleMatch.index;
                        earliestMatch = titleMatch[0];
                    }
                }

                if (earliestMatch) {
                    // Extract just the name part (remove title)
                    const nameOnly = earliestMatch.replace(new RegExp(title, 'i'), '').trim();

                    // Verify first name is not a title
                    const firstName = nameOnly.split(' ')[0];
                    if (!this.titles.some(t => t.toLowerCase() === firstName.toLowerCase())) {
                        return nameOnly;
                    }
                }
            }
        }

        // Fallback: return what we have
        if (lastName) {
            return lastName;
        }

        return cleaned;
    }

    /**
     * Expand US state abbreviations to full names
     */
    expandStateAbbreviation(abbr) {
        const stateMap = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        };
        return stateMap[abbr.toUpperCase()] || abbr;
    }

    /**
     * Extract speaker title from attribution text with enhanced context
     * Example: "Mayor Wilson" -> "Mayor of Detroit" (using dateline)
     * Example: "ElectricFuture CEO Martinez" -> "CEO of ElectricFuture"
     */
    extractSpeakerTitle(attribution, fullText = '') {
        if (!attribution) return '';

        // First, check for company name before title (e.g., "ElectricFuture CEO")
        const companyTitlePattern = /([A-Z][a-zA-Z0-9&\s]*?)\s+(CEO|CFO|CTO|COO|President|Vice President|Chairman|Director|Manager|Spokesperson)\b/i;
        const companyMatch = attribution.match(companyTitlePattern);

        if (companyMatch) {
            const company = companyMatch[1].trim();
            const title = companyMatch[2].trim();
            return `${title} of ${company}`;
        }

        // Government/political titles
        const govTitlePatterns = [
            /^(Governor|Lt\. Governor|Lieutenant Governor|Senator|State Senator|U\.S\. Senator|Representative|State Representative|U\.S\. Representative|Rep\.|Congressman|Congresswoman|Mayor|President|Vice President|Secretary|Delegate|Dr\.|Assembly Speaker)\s+/i,
            /\s+(Governor|Lt\. Governor|Lieutenant Governor|Senator|State Senator|U\.S\. Senator|Representative|State Representative|U\.S\. Representative|Mayor|President|Vice President|Secretary)$/i
        ];

        for (const pattern of govTitlePatterns) {
            const match = attribution.match(pattern);
            if (match) {
                const title = match[1].trim();

                // For location-based titles, append dateline location
                const cityTitles = ['Mayor'];
                const stateTitles = ['Governor', 'Lt. Governor', 'Lieutenant Governor'];

                if (fullText) {
                    const dateline = this.extractDatelineEnhanced(fullText);
                    if (dateline.location) {
                        // For state titles (Governor), use STATE from dateline
                        if (stateTitles.some(t => title.toLowerCase() === t.toLowerCase())) {
                            // Extract state abbreviation (e.g., "BOSTON, MA" -> "MA")
                            const stateMatch = dateline.location.match(/,\s*([A-Z]{2})\s*$/);
                            if (stateMatch) {
                                const stateAbbr = stateMatch[1];
                                const stateName = this.expandStateAbbreviation(stateAbbr);
                                return `${title} of ${stateName}`;
                            }
                        }
                        // For city titles (Mayor), use CITY from dateline
                        else if (cityTitles.some(t => title.toLowerCase() === t.toLowerCase())) {
                            // Extract city name from dateline (e.g., "DETROIT, MI" -> "Detroit")
                            const cityMatch = dateline.location.match(/^([A-Z\s]+)(?:,\s*[A-Z]{2})?/);
                            if (cityMatch) {
                                const city = cityMatch[1].trim();
                                // Convert to title case (DETROIT -> Detroit)
                                const titleCaseCity = city.charAt(0) + city.slice(1).toLowerCase();
                                return `${title} of ${titleCaseCity}`;
                            }
                        }
                    }
                }

                return title;
            }
        }

        // Corporate titles without company name
        const corporateTitlePattern = /\b(CEO|CFO|CTO|COO|President|Vice President|Chairman|Director|Manager|Spokesperson)\b/i;
        const corpMatch = attribution.match(corporateTitlePattern);
        if (corpMatch) {
            return corpMatch[1].trim();
        }

        return '';
    }

    /**
     * Extract contact information
     */
    extractContactInfo(text) {
        const contactMatch = text.match(this.releasePatterns.contact_info);
        const paidForMatch = text.match(this.releasePatterns.paid_for);

        // Enhanced media contact extraction to consolidate all contact info
        let mediaContact = contactMatch ? contactMatch[1].trim() : '';

        // If no formal contact section found, look for contact patterns in the text
        if (!mediaContact) {
            // Look for email and phone patterns near the end of the text
            const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
            const phonePattern = /(\d{3}[-.\\s]?\d{3}[-.\\s]?\d{4})/g;
            const websitePattern = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

            const emails = text.match(emailPattern) || [];
            const phones = text.match(phonePattern) || [];
            const websites = text.match(websitePattern) || [];

            // Build consolidated contact info
            let contactParts = [];

            // Try to find a name before contact info
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.toLowerCase().includes('media contact') || line.toLowerCase().includes('contact:')) {
                    // Look at next few lines for name and contact details
                    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                        const nextLine = lines[j].trim();
                        if (nextLine && !nextLine.includes('@') && !nextLine.match(/\d{3}/) && !nextLine.includes('.com')) {
                            contactParts.push(nextLine);
                            break;
                        }
                    }
                    break;
                }
            }

            // Add contact details
            if (emails.length > 0) contactParts.push(emails[0]);
            if (phones.length > 0) contactParts.push(phones[0]);
            if (websites.length > 0 && !websites[0].includes('link') && !websites[0].includes('nky')) {
                contactParts.push(websites[0]);
            }

            mediaContact = contactParts.join('\n');
        }

        // Also extract contact info from boilerplate pattern if found there
        const boilerplatePattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*(\d{3}[-.\\s]?\d{3}[-.\\s]?\d{4})\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
        const boilerplateMatch = text.match(boilerplatePattern);

        if (boilerplateMatch && !mediaContact.includes('@')) {
            // Add the contact details if they're not already in mediaContact
            const fullContact = [
                mediaContact || 'Media Contact',
                boilerplateMatch[1], // email
                boilerplateMatch[2], // phone
                boilerplateMatch[3]  // website
            ].filter(item => item && !item.includes('link') && !item.includes('nky')).join('\n');

            mediaContact = fullContact;
        }

        // Extract individual contact fields
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
        const phonePattern = /(\d{3}[-.\\s]?\d{3}[-.\\s]?\d{4})/;
        const websitePattern = /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.(?:com|org|gov|net|edu)(?:\/[^\s]*)?)/;

        const emailMatch = text.match(emailPattern);
        const phoneMatch = text.match(phonePattern);
        const websiteMatch = text.match(websitePattern);

        return {
            media_contact: mediaContact,
            paid_for: paidForMatch ? paidForMatch[1].trim() : '',
            email: emailMatch ? emailMatch[1] : '',
            phone: phoneMatch ? phoneMatch[1] : '',
            website: websiteMatch ? websiteMatch[1] : ''
        };
    }

    /**
     * Extract metadata and infer press release type
     */
    extractMetadata(text) {
        const wordCount = text.split(/\s+/).length;
        const paragraphCount = text.split(/\n\s*\n/).length;

        // Infer press release type based on content patterns
        const inferredType = this.inferPressReleaseType(text);

        return {
            word_count: wordCount,
            paragraph_count: paragraphCount,
            inferred_type: inferredType,
            has_quotes: this.extractQuotes(text).length > 0,
            has_statistics: /\d+%|\$[\d,]+|\d+\s+million|\d+\s+billion/i.test(text)
        };
    }

    /**
     * Map extracted data to fields canvas format
     */
    mapToFieldsData(text) {
        const structure = this.extractContentStructure(text);
        const quotes = this.extractQuotes(text);
        const contact = this.extractContactInfo(text);
        const releaseInfo = this.extractReleaseInfo(text);

        // Better content distribution - fix the issue where everything goes into lead paragraph
        let leadParagraph = structure.lead_paragraph || '';
        let supportingDetails = '';
        let additionalInfo = '';
        const bodyParagraphs = structure.body_paragraphs || [];

        console.log('Debug - Lead paragraph length:', leadParagraph.length);
        console.log('Debug - Body paragraphs count:', bodyParagraphs.length);

        // If we have a very long lead paragraph and no body paragraphs, the extraction failed
        if (leadParagraph.length > 400 && bodyParagraphs.length === 0) {
            console.log('Debug - Paragraph extraction failed, using fallback method');

            // Direct content splitting as fallback
            // Split by sentences first
            const sentences = leadParagraph.split(/\.\s+(?=[A-Z])/);

            if (sentences.length >= 6) {
                // Take first 2-3 sentences as lead paragraph
                leadParagraph = sentences.slice(0, 3).join('. ').trim() + '.';

                // Next 2-3 sentences go to supporting details
                supportingDetails = sentences.slice(3, 6).join('. ').trim() + '.';

                // Remaining sentences go to additional info
                if (sentences.length > 6) {
                    additionalInfo = sentences.slice(6).join('. ').trim() + '.';
                }
            } else if (sentences.length >= 3) {
                // Split into roughly equal parts
                const mid = Math.ceil(sentences.length / 2);
                leadParagraph = sentences.slice(0, mid).join('. ').trim() + '.';
                supportingDetails = sentences.slice(mid).join('. ').trim() + '.';
            }
        } else {
            // Normal processing with existing body paragraphs
            if (leadParagraph.length > 400) {
                const sentences = leadParagraph.split(/\.\s+(?=[A-Z])/);
                if (sentences.length >= 3) {
                    leadParagraph = sentences.slice(0, 3).join('. ').trim() + '.';
                    if (sentences.length > 3) {
                        const remainingSentences = sentences.slice(3);
                        supportingDetails = remainingSentences.join('. ').trim() + '.';
                    }
                }
            }

            // Use body paragraphs for additional content
            if (!supportingDetails && bodyParagraphs.length > 0) {
                supportingDetails = bodyParagraphs.slice(0, Math.min(2, bodyParagraphs.length)).join('\n\n');
            } else if (supportingDetails && bodyParagraphs.length > 0) {
                additionalInfo = bodyParagraphs.join('\n\n');
            }

            if (bodyParagraphs.length > 2 && !additionalInfo) {
                additionalInfo = bodyParagraphs.slice(2).join('\n\n');
            }
        }

        // Filter out contact information from additionalInfo to prevent duplication
        if (additionalInfo && contact.media_contact) {
            // Remove contact-related content from additionalInfo
            const contactTerms = ['@', 'contact', 'phone', '.com', 'email'];
            const infoLines = additionalInfo.split('\n');
            const filteredLines = infoLines.filter(line => {
                const lowerLine = line.toLowerCase().trim();
                return !contactTerms.some(term => lowerLine.includes(term)) && line.trim().length > 20;
            });
            additionalInfo = filteredLines.join('\n').trim();
        }

        return {
            // Release information
            'release-type': releaseInfo.releaseType.toLowerCase().replace(/\s+/g, '_'),
            'embargo-date': releaseInfo.embargoDate,
            'embargo-time': releaseInfo.embargoTime,
            'release-date': structure.dateline.date,
            'release-location': structure.dateline.location,

            // Headlines - fix extraction from actual content
            'headline': (() => {
                // If the extracted headline is generic like "Press Releases", extract from content
                if (!structure.headline || structure.headline === 'Press Releases' || structure.headline.length < 10) {
                    // Look for the real headline in the extracted content
                    const lines = text.split('\n').filter(line => line.trim());

                    // Find a line that looks like a headline (after FOR IMMEDIATE RELEASE)
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        // Skip headers and look for announcement-style headlines
                        if (line.includes('Announces') || line.includes('announces') ||
                            (line.length > 20 && line.length < 150 &&
                             !line.includes('FOR IMMEDIATE RELEASE') &&
                             !line.includes('CONTACT') &&
                             !line.includes('@') &&
                             !line.includes('Press Releases'))) {

                            // Clean up the headline
                            let headline = line.replace(/\.$/, ''); // Remove trailing period
                            if (headline.length > 20 && headline.length < 150) {
                                return headline;
                            }
                        }
                    }

                    // Fallback: extract from lead paragraph
                    if (leadParagraph && leadParagraph.length > 50) {
                        const sentences = leadParagraph.split(/\.\s+/);
                        const firstSentence = sentences[0].trim();
                        if (firstSentence.length > 20 && firstSentence.length < 150) {
                            return firstSentence;
                        }
                    }
                }

                return structure.headline || '';
            })(),
            'subhead': structure.subhead,

            // Content - maintain paragraph spacing
            'lead-paragraph': leadParagraph,
            'supporting-details': supportingDetails,

            // Quotes
            'spokesperson-1': quotes[0] ? quotes[0].attribution : '',
            'quote-1': quotes[0] ? quotes[0].text : '',
            'spokesperson-2': quotes[1] ? quotes[1].attribution : '',
            'quote-2': quotes[1] ? quotes[1].text : '',

            // Additional info - maintain paragraph spacing
            'additional-info': additionalInfo,
            'boilerplate': this.extractBoilerplate(text),

            // Contact
            'media-contact': contact.media_contact,
            'paid-for': contact.paid_for
        };
    }

    /**
     * Convert to Gutenberg-style blocks
     */
    convertToGutenbergBlocks(text) {
        const structure = this.extractContentStructure(text);
        const quotes = this.extractQuotes(text);
        const blocks = [];

        // Headline block
        if (structure.headline) {
            blocks.push({
                type: 'heading',
                content: structure.headline,
                level: 1
            });
        }

        // Subhead block
        if (structure.subhead) {
            blocks.push({
                type: 'heading',
                content: structure.subhead,
                level: 2
            });
        }

        // Dateline block
        if (structure.dateline.full) {
            blocks.push({
                type: 'paragraph',
                content: structure.dateline.full,
                className: 'dateline'
            });
        }

        // Content paragraphs
        structure.body_paragraphs.forEach((paragraph, index) => {
            // Check if this paragraph contains a quote
            const hasQuote = quotes.some(quote => paragraph.includes(quote.full_context));

            blocks.push({
                type: hasQuote ? 'quote' : 'paragraph',
                content: paragraph.trim(),
                index: index
            });
        });

        return blocks;
    }

    /**
     * Extract clean text without formatting markers
     */
    extractCleanText(text) {
        let result = this.safeRemovePatterns(text, [
            this.releasePatterns.release_type,
            this.releasePatterns.contact_info,
            this.releasePatterns.paid_for,
            this.releasePatterns.end_marker
        ]);

        return result
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
    }

    // ============================================================================
    // TYPE-SPECIFIC PARSING METHODS
    // ============================================================================

    /**
     * Parse STATEMENT type press releases
     * Characteristics: Single speaker, quote-heavy, minimal structure
     */
    parseStatement(text) {
        const content_structure = this.extractContentStructure(text);
        const headline = content_structure.headline;

        // Extract attribution line (e.g., "Senator X released the following statement:")
        const attributionPattern = /(.+?(?:released|issued)\s+(?:the\s+)?(?:following\s+)?statement[s]?[:\s]+)/i;
        const attributionMatch = text.match(attributionPattern);
        let attribution = null;

        if (attributionMatch) {
            const attrText = attributionMatch[1].trim();
            // Extract speaker name from attribution using title patterns
            const speakerPattern = /(?:Senator|Representative|Governor|Mayor|Dr\.|Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)*)/i;
            const speakerMatch = attrText.match(speakerPattern);

            attribution = {
                text: attrText,
                speaker: speakerMatch ? speakerMatch[0].trim() : null
            };
        }

        // Extract main statement (often a single large quote or unquoted text)
        const quotes = this.extractQuotes(text, headline, content_structure.subhead);
        const mainQuote = quotes.length > 0 ? quotes[0] : null;

        // Extract context (what this is responding to)
        const contextPatterns = [
            /in response to\s+(.+?)(?:\.|,|\n)/i,
            /following\s+(.+?)(?:\.|,|\n)/i,
            /reacting to\s+(.+?)(?:\.|,|\n)/i
        ];
        let context = null;
        for (const pattern of contextPatterns) {
            const match = text.match(pattern);
            if (match) {
                context = { response_to: match[1].trim() };
                break;
            }
        }

        // Extract subtype-specific metadata
        const subtype_metadata = this.extractStatementSubtypeMetadata(text);

        return {
            content_structure: content_structure,
            headline: headline,
            attribution: attribution,
            statement: mainQuote && mainQuote.text ? {
                text: mainQuote.text,
                is_quoted: true,
                word_count: mainQuote.text.split(/\s+/).length
            } : null,
            context: context,
            quotes: quotes,
            type_specific_metadata: subtype_metadata
        };
    }

    /**
     * Parse NEWS_RELEASE type press releases
     * Characteristics: Full traditional structure with dateline, multiple speakers
     */
    parseNewsRelease(text) {
        const content_structure = this.extractContentStructure(text);
        const quotes = this.extractQuotes(text, content_structure.headline, content_structure.subhead);

        // Extract subtype-specific metadata based on verified subtypes
        const subtype_metadata = this.extractNewsReleaseSubtypeMetadata(text, quotes);

        // Build unified content flow preserving original document order
        // Lead paragraph is displayed separately, so only include body paragraphs in content flow
        const contentFlow = this.buildContentFlow(text, content_structure.body_paragraphs, quotes);

        return {
            content_structure: content_structure,
            quotes: quotes,
            content_flow: contentFlow,
            type_specific_metadata: subtype_metadata
        };
    }

    /**
     * Parse FACT_SHEET type press releases
     * Characteristics: Bullets, sections, data-heavy
     */
    parseFactSheet(text) {
        const content_structure = this.extractContentStructure(text);

        // Extract sections with headers
        const sections = this.extractFactSheetSections(text);

        // Extract all statistics
        const statistics = this.extractStatistics(text);

        return {
            content_structure: content_structure,
            sections: sections,
            key_figures: statistics,
            type_specific_metadata: {
                section_count: sections.length,
                statistic_count: statistics.length
            }
        };
    }

    /**
     * Parse MEDIA_ADVISORY type press releases
     * Characteristics: WHO/WHAT/WHEN/WHERE event structure
     */
    parseMediaAdvisory(text) {
        const content_structure = this.extractContentStructure(text);

        // Extract event details
        const eventDetails = this.extractEventDetails(text);

        return {
            content_structure: content_structure,
            event_details: eventDetails,
            type_specific_metadata: {
                event_type: eventDetails.what ? 'specified' : 'unspecified',
                has_location: !!eventDetails.where,
                has_datetime: !!eventDetails.when
            }
        };
    }

    /**
     * Parse LETTER type press releases
     * Characteristics: Formal letter format with Dear X, closing, signature
     */
    parseLetter(text) {
        const content_structure = this.extractContentStructure(text);

        // Extract letter components
        const recipient = this.extractLetterRecipient(text);
        const body = this.extractLetterBody(text);
        const closing = this.extractLetterClosing(text);
        const subject = this.extractLetterSubject(text);

        return {
            content_structure: content_structure,
            recipient: recipient,
            subject: subject,
            body: body,
            closing: closing,
            type_specific_metadata: {
                has_recipient: !!recipient,
                has_subject: !!subject,
                paragraph_count: body ? body.length : 0
            }
        };
    }

    /**
     * Parse TRANSCRIPT type press releases
     * Characteristics: Dialogue format with speaker labels
     */
    parseTranscript(text) {
        const content_structure = this.extractContentStructure(text);

        // Extract dialogue
        const dialogue = this.extractTranscriptDialogue(text);

        // Identify speakers
        const speakers = this.identifyTranscriptSpeakers(dialogue);

        return {
            content_structure: content_structure,
            dialogue: dialogue,
            speakers: speakers,
            type_specific_metadata: {
                speaker_count: speakers.length,
                exchange_count: dialogue.length
            }
        };
    }

    // ============================================================================
    // SUBTYPE-SPECIFIC METADATA EXTRACTION
    // ============================================================================

    /**
     * Extract metadata specific to STATEMENT subtypes
     */
    extractStatementSubtypeMetadata(text) {
        const metadata = {};

        // Check for response_statement indicators
        if (this.verified_subtypes.includes('response_statement')) {
            const responsePatterns = [/in response to/i, /following/i, /reacting to/i];
            for (const pattern of responsePatterns) {
                if (pattern.test(text)) {
                    metadata.response_indicators = metadata.response_indicators || [];
                    metadata.response_indicators.push(pattern.source.replace(/\\/g, '').replace(/i/g, ''));
                }
            }
        }

        // Check for condemnation language
        if (this.verified_subtypes.includes('condemnation')) {
            const condemnPatterns = [/condemn/i, /denounce/i, /oppose/i, /reject/i];
            for (const pattern of condemnPatterns) {
                if (pattern.test(text)) {
                    metadata.tone = 'critical';
                    metadata.condemnation_language = metadata.condemnation_language || [];
                    metadata.condemnation_language.push(pattern.source.replace(/\\/g, '').replace(/i/g, ''));
                }
            }
        }

        // Check for support language
        if (this.verified_subtypes.includes('support_statement')) {
            const supportPatterns = [/support/i, /commend/i, /applaud/i, /endorse/i];
            for (const pattern of supportPatterns) {
                if (pattern.test(text)) {
                    metadata.tone = 'supportive';
                    metadata.support_language = metadata.support_language || [];
                    metadata.support_language.push(pattern.source.replace(/\\/g, '').replace(/i/g, ''));
                }
            }
        }

        return metadata;
    }

    /**
     * Extract metadata specific to NEWS_RELEASE subtypes
     */
    extractNewsReleaseSubtypeMetadata(text, quotes) {
        const metadata = {};

        // Endorsement metadata
        if (this.verified_subtypes.includes('endorsement')) {
            metadata.endorsement = this.extractEndorsementMetadata(text, quotes);
        }

        // Attack metadata
        if (this.verified_subtypes.some(st => st.startsWith('attack_'))) {
            metadata.attack = this.extractAttackMetadata(text);
        }

        // Poll results metadata
        if (this.verified_subtypes.includes('poll_results')) {
            metadata.poll = this.extractPollMetadata(text);
        }

        // Funding announcement metadata
        if (this.verified_subtypes.includes('funding_announcement')) {
            metadata.funding = this.extractFundingMetadata(text);
        }

        return metadata;
    }

    /**
     * Extract endorsement-specific metadata
     */
    extractEndorsementMetadata(text, quotes) {
        const metadata = {
            endorser: null,
            endorsee: null,
            reasoning: []
        };

        // Find endorser (usually in headline or first quote)
        const endorserPattern = /(.+?)\s+endorse[sd]?\s+(.+?)(?:\.|for|,)/i;
        const match = text.match(endorserPattern);
        if (match) {
            metadata.endorser = { name: match[1].trim() };
            metadata.endorsee = { name: match[2].trim() };
        }

        // Extract reasoning from quotes
        if (quotes.length > 0) {
            metadata.reasoning = quotes.slice(0, 2).map(q => q.text);
        }

        return metadata;
    }

    /**
     * Extract attack-specific metadata
     */
    extractAttackMetadata(text) {
        const metadata = {
            target: null,
            claims: [],
            tone: 'critical'
        };

        // Find attack target
        const targetPatterns = [
            /attacks?\s+(.+?)(?:'s|for)/i,
            /criticizes?\s+(.+?)(?:'s|for)/i,
            /slams?\s+(.+?)(?:'s|for)/i
        ];

        for (const pattern of targetPatterns) {
            const match = text.match(pattern);
            if (match) {
                metadata.target = match[1].trim();
                break;
            }
        }

        return metadata;
    }

    /**
     * Extract poll-specific metadata
     */
    extractPollMetadata(text) {
        const metadata = {
            numbers: [],
            methodology: null
        };

        // Extract percentages
        const percentPattern = /(\d+(?:\.\d+)?)\s*%/g;
        let match;
        while ((match = percentPattern.exec(text)) !== null) {
            metadata.numbers.push(parseFloat(match[1]));
        }

        // Extract methodology
        const methodPattern = /poll(?:ed)?\s+(.+?(?:voters|respondents|people))/i;
        const methodMatch = text.match(methodPattern);
        if (methodMatch) {
            metadata.methodology = methodMatch[1].trim();
        }

        return metadata;
    }

    /**
     * Extract funding-specific metadata
     */
    extractFundingMetadata(text) {
        const metadata = {
            amounts: [],
            recipients: []
        };

        // Extract dollar amounts
        const dollarPattern = /\$\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(million|billion|thousand)?/gi;
        let match;
        while ((match = dollarPattern.exec(text)) !== null) {
            const amount = match[1].replace(/,/g, '');
            const unit = match[2] || '';
            metadata.amounts.push({ value: parseFloat(amount), unit: unit });
        }

        return metadata;
    }

    // ============================================================================
    // HELPER METHODS FOR TYPE-SPECIFIC PARSING
    // ============================================================================

    /**
     * Extract sections from fact sheet
     */
    extractFactSheetSections(text) {
        const sections = [];
        const lines = text.split('\n');
        let currentSection = null;

        for (const line of lines) {
            // Section header indicators
            if (this.isFactSheetSectionHeader(line)) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    header: line.trim(),
                    content: [],
                    bullets: []
                };
            } else if (currentSection && line.trim()) {
                currentSection.content.push(line.trim());

                // Check if it's a bullet point
                if (/^[-•●○*]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim())) {
                    const bulletText = line.trim().replace(/^[-•●○*]\s+/, '').replace(/^\d+\.\s+/, '');
                    currentSection.bullets.push(bulletText);
                }
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * Check if line is a fact sheet section header
     */
    isFactSheetSectionHeader(line) {
        const trimmed = line.trim();

        // All caps line (but not too long)
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length <= 80) {
            return true;
        }

        // Line ending with colon
        if (trimmed.endsWith(':') && trimmed.length <= 80) {
            return true;
        }

        return false;
    }

    /**
     * Extract statistics from text
     */
    extractStatistics(text) {
        const statistics = [];

        // Dollar amounts
        const dollarPattern = /\$\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(million|billion|thousand)?/gi;
        let match;
        while ((match = dollarPattern.exec(text)) !== null) {
            statistics.push({
                type: 'currency',
                value: parseFloat(match[1].replace(/,/g, '')),
                unit: match[2] || '',
                raw_text: match[0]
            });
        }

        // Percentages
        const percentPattern = /(\d+(?:\.\d+)?)\s*%/g;
        while ((match = percentPattern.exec(text)) !== null) {
            statistics.push({
                type: 'percentage',
                value: parseFloat(match[1]),
                raw_text: match[0]
            });
        }

        return statistics;
    }

    /**
     * Extract WHO/WHAT/WHEN/WHERE event details
     */
    extractEventDetails(text) {
        const details = {
            who: null,
            what: null,
            when: null,
            where: null,
            why: null
        };

        // Look for labeled sections
        const patterns = {
            who: /WHO:\s*(.+?)(?=\n\n|\nWHAT:|\nWHEN:|\nWHERE:|\nWHY:|$)/is,
            what: /WHAT:\s*(.+?)(?=\n\n|\nWHO:|\nWHEN:|\nWHERE:|\nWHY:|$)/is,
            when: /WHEN:\s*(.+?)(?=\n\n|\nWHO:|\nWHAT:|\nWHERE:|\nWHY:|$)/is,
            where: /WHERE:\s*(.+?)(?=\n\n|\nWHO:|\nWHAT:|\nWHEN:|\nWHY:|$)/is,
            why: /WHY:\s*(.+?)(?=\n\n|\nWHO:|\nWHAT:|\nWHEN:|\nWHERE:|$)/is
        };

        for (const [key, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                details[key] = match[1].trim();
            }
        }

        return details;
    }

    /**
     * Extract letter recipient (Dear X)
     */
    extractLetterRecipient(text) {
        const pattern = /Dear\s+(.+?)[:,]/i;
        const match = text.match(pattern);

        if (match) {
            return {
                salutation: match[0].trim(),
                name: match[1].trim()
            };
        }

        return null;
    }

    /**
     * Extract letter body paragraphs
     */
    extractLetterBody(text) {
        const lines = text.split('\n');
        const bodyLines = [];
        let inBody = false;

        for (const line of lines) {
            // Start collecting after "Dear X:"
            if (/Dear\s+.+?[:,]/i.test(line)) {
                inBody = true;
                continue;
            }

            // Stop at closing
            if (/^\s*(Sincerely|Best regards|Respectfully|Cordially),?\s*$/i.test(line)) {
                break;
            }

            if (inBody && line.trim()) {
                bodyLines.push(line.trim());
            }
        }

        // Group into paragraphs
        const paragraphs = [];
        let currentPara = [];

        for (const line of bodyLines) {
            if (line.trim()) {
                currentPara.push(line);
            } else if (currentPara.length > 0) {
                paragraphs.push(currentPara.join(' '));
                currentPara = [];
            }
        }

        if (currentPara.length > 0) {
            paragraphs.push(currentPara.join(' '));
        }

        return paragraphs;
    }

    /**
     * Extract letter closing and signature
     */
    extractLetterClosing(text) {
        const closingPattern = /(Sincerely|Best regards|Respectfully|Cordially),?\s*\n\s*(.+?)(?:\n|$)/i;
        const match = text.match(closingPattern);

        if (match) {
            return {
                closing: match[1].trim(),
                signature: match[2].trim()
            };
        }

        return null;
    }

    /**
     * Extract letter subject line
     */
    extractLetterSubject(text) {
        const patterns = [
            /(?:RE|Subject):\s*(.+?)(?:\n|$)/i,
            /(?:Regarding|In re):\s*(.+?)(?:\n|$)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Extract transcript dialogue with speaker labels
     */
    extractTranscriptDialogue(text) {
        const dialogue = [];
        const lines = text.split('\n');

        const speakerPatterns = [
            /^([A-Z\s.]+):\s*(.+)$/,           // SPEAKER: text
            /^\[([A-Z\s.]+)\]:?\s*(.+)$/,      // [SPEAKER] text
            /^([A-Z\s.]+)\s*[-–—]\s*(.+)$/     // SPEAKER - text
        ];

        let currentSpeaker = null;
        let currentText = [];

        for (const line of lines) {
            let matched = false;

            // Check for speaker label
            for (const pattern of speakerPatterns) {
                const match = line.trim().match(pattern);
                if (match) {
                    // Save previous speaker's text
                    if (currentSpeaker && currentText.length > 0) {
                        dialogue.push({
                            speaker: currentSpeaker,
                            text: currentText.join(' ').trim()
                        });
                    }

                    // Start new speaker
                    currentSpeaker = match[1].trim();
                    currentText = [match[2].trim()];
                    matched = true;
                    break;
                }
            }

            // If no speaker label, add to current speaker's text
            if (!matched && currentSpeaker && line.trim()) {
                currentText.push(line.trim());
            }
        }

        // Save last speaker
        if (currentSpeaker && currentText.length > 0) {
            dialogue.push({
                speaker: currentSpeaker,
                text: currentText.join(' ').trim()
            });
        }

        return dialogue;
    }

    /**
     * Identify unique speakers in transcript
     */
    identifyTranscriptSpeakers(dialogue) {
        const speakerSet = new Set();

        for (const exchange of dialogue) {
            speakerSet.add(exchange.speaker);
        }

        return Array.from(speakerSet).map(name => ({
            name: name,
            exchange_count: dialogue.filter(d => d.speaker === name).length
        }));
    }

    /**
     * Safe pattern removal that handles special characters like $ correctly
     * Generic solution for any text content with special regex characters
     * UNIVERSAL FIX: Never use .replace() with regex patterns that have capture groups
     */
    safeRemovePatterns(text, patterns) {
        let result = text;

        for (const pattern of patterns) {
            // Keep trying to find and remove matches until none remain
            let match;
            while ((match = result.match(pattern)) !== null) {
                const matchedText = match[0];
                const index = result.indexOf(matchedText);
                if (index !== -1) {
                    // Use substring operations to avoid any regex replacement issues
                    result = result.substring(0, index) + result.substring(index + matchedText.length);
                } else {
                    // Prevent infinite loop if indexOf fails
                    break;
                }
            }
        }

        return result.trim();
    }

    /**
     * Safe string replacement that handles $ characters properly
     */
    safeReplace(text, searchValue, replaceValue) {
        if (typeof searchValue === 'string') {
            // For string searches, use split/join to avoid regex issues
            return text.split(searchValue).join(replaceValue);
        } else {
            // For regex searches, use match + substring to avoid backreference issues
            const match = text.match(searchValue);
            if (match) {
                const index = text.indexOf(match[0]);
                if (index !== -1) {
                    return text.substring(0, index) + replaceValue + text.substring(index + match[0].length);
                }
            }
        }
        return text;
    }

    /**
     * Helper methods
     */

    isHeaderLine(line) {
        return (
            this.releasePatterns.release_type.test(line) ||
            this.releasePatterns.contact_info.test(line) ||
            this.releasePatterns.paid_for.test(line) ||
            this.releasePatterns.iso_date.test(line) ||
            line.trim().length < 10
        );
    }

    /**
     * Extract ISO date from text and convert to readable format
     * Example: "Date: 2025-01-16T05:00:00.000Z" -> "January 16, 2025"
     */
    extractISODate(text) {
        const match = text.match(this.releasePatterns.iso_date);
        if (match) {
            const isoString = match[1];
            const date = new Date(isoString);

            // Format as "Month DD, YYYY"
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
        return null;
    }

    findHeadline(lines) {
        for (const line of lines) {
            if (line.trim().length > 20 && !line.includes(':') && !line.includes('@')) {
                return line.trim();
            }
        }
        return '';
    }

    /**
     * IMPROVEMENT #008: Enhanced subhead detection
     * Subheads appear between headline and dateline, often containing key messages/quotes
     * Common in professional campaign communications (e.g., Spanberger releases)
     */
    findSubhead(lines, headline) {
        if (!headline || lines.length < 2) return '';

        // Find headline - try exact match first, then partial match
        let headlineIndex = lines.findIndex(line => line.trim() === headline.trim());
        if (headlineIndex < 0) {
            // Fallback: find line that contains significant portion of headline
            headlineIndex = lines.findIndex(line => {
                const headlineWords = headline.trim().split(/\s+/).slice(0, 5).join(' ');
                return line.includes(headlineWords);
            });
        }
        // If still not found, assume headline is first non-header line (index 0)
        if (headlineIndex < 0) headlineIndex = 0;

        // Look for subhead in lines after headline but before dateline
        // Dateline patterns to avoid
        const datelinePattern = /^[A-Z][A-Z\s,\.]+\s*[–—-]\s*.+\d{4}/;
        const locationOnlyPattern = /^[A-Z][A-Z\s,]+\s*[–—-]\s*$/;

        for (let i = headlineIndex + 1; i < Math.min(headlineIndex + 5, lines.length); i++) {
            const line = lines[i].trim();

            // Skip empty lines
            if (line.length === 0) continue;

            // Skip if it's a dateline
            if (datelinePattern.test(line) || locationOnlyPattern.test(line)) continue;

            // Skip if it starts with boilerplate
            if (/^(FOR IMMEDIATE RELEASE|FOR RELEASE|CONTACT:|MEDIA CONTACT:)/i.test(line)) continue;

            // Skip ISO date lines
            if (this.releasePatterns.iso_date.test(line)) continue;

            // Skip full dates (day + month + year) - these are publication dates, not subheads
            // Patterns: "September 19, 2025", "Oct 02, 2025", "Wednesday, September 17, 2025"
            if (/^(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+)?[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}$/i.test(line)) continue;

            // Skip standalone locations (e.g., "WASHINGTON, D.C." or "Washington, D.C." or "IRVINE, CA") - these are dateline locations, not subheads
            if (/^[A-Z][A-Za-z\s.]+,\s+(?:[A-Z]{2}|D\.C\.|DC)$/i.test(line)) continue;

            // Skip standalone quotes (these are part of body, not subhead)
            if (/^[""]/.test(line) && !/[""].*[""]/.test(line)) continue;

            // Skip complete quoted statements with attribution (these are body quotes, not subheads)
            // If line contains both quotes AND attribution verbs, it's a body quote not a subhead
            if (/"[^"]+"/i.test(line) && /\b(said|stated|announced|noted|explained|added|continued|told)\b/i.test(line)) continue;

            // Valid subhead criteria:
            // - Has reasonable length (15-200 chars)
            // - Not too long (< 2x headline length)
            // - Often contains colons (messaging element)
            if (line.length >= 15 && line.length <= 200) {
                // Prefer lines with colons (common in subheads)
                if (line.includes(':')) {
                    return line;
                }
                // Also accept plain text subheads if they're shorter than headline
                if (line.length < headline.length * 1.2) {
                    return line;
                }
            }
        }

        return '';
    }

    extractDateline(lines) {
        for (const line of lines) {
            const match = line.match(this.releasePatterns.dateline);
            if (match) {
                return {
                    location: match[1].trim(),
                    date: match[2].trim(),
                    full: line.trim()
                };
            }
        }
        return { location: '', date: '', full: '' };
    }

    extractParagraphs(text) {
        // Remove header sections using safe method
        let content = this.safeRemovePatterns(text, [
            this.releasePatterns.release_type,
            this.releasePatterns.contact_info,
            this.releasePatterns.paid_for
        ]);

        // Split into paragraphs
        const paragraphs = content
            .split(/\n\s*\n/)
            .map(p => p.replace(/\n/g, ' ').trim())
            .filter(p => p.length > 20);

        return paragraphs;
    }

    /**
     * Ultra-simple headline detection - no complex processing
     */
    findHeadlineEnhanced(text) {
        // Skip all text cleaning - work with raw text to avoid any processing issues
        const rawText = text.trim();
        const lines = rawText.split('\n');

        // Generic dateline patterns that work for ANY city/state combination
        // Handles both UPPERCASE (DETROIT, MI) and Mixed Case (Detroit, MI)
        // IMPORTANT: Use [ ] (space only) not \s (which includes newlines) to prevent matching across lines
        const datelinePatterns = [
            // Standard dash patterns with various separators (—, –, -)
            // All caps: CITY, ST - Date
            /([A-Z][A-Z ,]+)[ ]*[–—-][ ]*([A-Z][a-z]+ +\d+,? +\d{4})/,
            /([A-Z][A-Z ,]+)[ ]*[–—-][ ]*((?:January|February|March|April|May|June|July|August|September|October|November|December) +\d+,? +\d{4})/,
            /([A-Z][A-Z ,]+)[ ]*[–—-][ ]*(\d{1,2}\/\d{1,2}\/\d{4})/,
            // Mixed case: City, ST - Date
            /([A-Z][a-zA-Z ,\.]+)[ ]*[–—-][ ]*([A-Z][a-z]+ +\d+,? +\d{4})/,
            /([A-Z][a-zA-Z ,\.]+)[ ]*[–—-][ ]*((?:January|February|March|April|May|June|July|August|September|October|November|December) +\d+,? +\d{4})/,
            /([A-Z][a-zA-Z ,\.]+)[ ]*[–—-][ ]*(\d{1,2}\/\d{1,2}\/\d{4})/,
            // Parenthesis patterns like "City, ST (Date)"
            /([A-Z][a-zA-Z\s,\.]+)\s*\(\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})\s*\)/,
            /([A-Z][a-zA-Z\s,\.]+)\s*\(\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\)/,
            // Date-only patterns (no city) - for simpler press releases
            // "Oct 01, 2025" or "October 1, 2025" on its own line
            /^((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d+,?\s+\d{4})$/m,
            /^(\d{1,2}\/\d{1,2}\/\d{4})$/m
        ];

        // Look for dateline anywhere in text
        for (const pattern of datelinePatterns) {
            const match = rawText.match(pattern);
            if (match) {
                const datelineIndex = match.index;
                if (datelineIndex > 0) {
                    const beforeDateline = rawText.substring(0, datelineIndex).trim();

                    // For press releases with formal structure (FOR IMMEDIATE RELEASE, date, headline)
                    // Extract just the headline portion
                    const beforeLines = beforeDateline.split('\n');

                    // Skip "FOR IMMEDIATE RELEASE" and date lines, get the main headline
                    // IMPROVEMENT #009: Collect all candidates, then filter subheads
                    const candidates = [];
                    for (let i = 0; i < beforeLines.length; i++) {
                        const line = beforeLines[i].trim();

                        // Skip empty lines, release type, contact info, and date lines
                        if (!line ||
                            line.includes('FOR IMMEDIATE RELEASE') ||
                            line.includes('FOR RELEASE') ||
                            /^Contact:/i.test(line) || // Contact: lines
                            /^Media Contact:/i.test(line) || // Media Contact: lines
                            /^Press Contact:/i.test(line) || // Press Contact: lines
                            (line.includes('@') && line.length < 50) || // Email addresses
                            /^\w+\s+\d+,?\s+\d{4}$/.test(line) || // Date pattern
                            line.startsWith('"') && line.endsWith('"')) { // Quoted subheads
                            continue;
                        }

                        if (line.length > 10) {
                            candidates.push(line);
                        }
                    }

                    // Prefer longer descriptive headlines over subheads with colon+quotes
                    if (candidates.length > 0) {
                        const headlines = candidates.filter(c => {
                            const hasColon = c.includes(':') && !c.startsWith('ICYMI:') && !c.startsWith('NEW:');
                            const hasQuotes = /[""]/.test(c);
                            return !(hasColon && hasQuotes); // Skip subhead pattern
                        });
                        const best = headlines.length > 0 ? headlines : candidates;
                        return best.sort((a, b) => b.length - a.length)[0];
                    }

                    return beforeDateline;
                }
            }
        }

        // Fallback: look for generic dateline pattern with simple string operations
        // Must have space before dash to avoid matching hyphens in names (e.g., "Earle-Sears")
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if ((line.includes(' — ') || line.includes(' – ') || line.includes(' - ')) && line.match(/[A-Z]{2,}/)) {
                // Found potential dateline, get everything before it
                const beforeLines = lines.slice(0, i);

                // Extract headline from before lines
                // IMPROVEMENT #009: Prefer longer descriptive headlines over punchier subheads
                const candidates = [];
                for (let j = beforeLines.length - 1; j >= 0; j--) {
                    const potentialHeadline = beforeLines[j].trim();
                    if (potentialHeadline.length > 10 &&
                        !potentialHeadline.includes('FOR IMMEDIATE RELEASE') &&
                        !potentialHeadline.includes('FOR RELEASE') &&
                        !/^Contact:/i.test(potentialHeadline) &&
                        !/^Media Contact:/i.test(potentialHeadline) &&
                        !/^Press Contact:/i.test(potentialHeadline) &&
                        !(potentialHeadline.includes('@') && potentialHeadline.length < 50) &&
                        !/^\w+\s+\d+,?\s+\d{4}$/.test(potentialHeadline) &&
                        !(potentialHeadline.startsWith('"') && potentialHeadline.endsWith('"'))) {
                        candidates.push(potentialHeadline);
                    }
                }

                // If we have multiple candidates, prefer the longer, more descriptive one
                // Subheads are typically shorter and contain colons/quotes
                if (candidates.length > 0) {
                    // Filter out likely subheads (contain: or quotes mid-line)
                    const headlines = candidates.filter(c => {
                        const hasColon = c.includes(':') && !c.startsWith('ICYMI:') && !c.startsWith('NEW:');
                        const hasQuotes = /[""]/.test(c);
                        return !(hasColon && hasQuotes); // Skip lines with both colon AND quotes (typical subhead)
                    });

                    // Return longest remaining candidate (headlines are typically more descriptive)
                    const best = headlines.length > 0 ? headlines : candidates;
                    return best.sort((a, b) => b.length - a.length)[0];
                }
            }
        }

        // Ultimate fallback: first meaningful line
        // IMPORTANT: Also skip dateline-formatted lines (Improvement #005)
        const datelinePattern = /^[A-Z][A-Z\s,\.]+\s*[–—-]\s*.+\d{4}/;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 10 &&
                !trimmed.includes('FOR IMMEDIATE RELEASE') &&
                !trimmed.includes('FOR RELEASE') &&
                !/^Contact:/i.test(trimmed) &&
                !/^Media Contact:/i.test(trimmed) &&
                !/^Press Contact:/i.test(trimmed) &&
                !(trimmed.includes('@') && trimmed.length < 50) &&
                !/^\w+\s+\d+,?\s+\d{4}$/.test(trimmed) &&
                !datelinePattern.test(trimmed)) { // Skip dateline-formatted lines
                return trimmed;
            }
        }

        return '';
    }

    /**
     * Enhanced dateline extraction that searches within content
     */
    extractDatelineEnhanced(text) {
        // Look for dateline patterns anywhere in the text
        // IMPORTANT: Use [ ] (space only) not \s (which includes newlines) to prevent matching across lines
        const patterns = [
            // Patterns with dashes - UPDATED to handle mixed case (RICHMOND, Va.)
            // Also handle dates with or without day number (Sep 2025 or Sep 02, 2025)
            /([A-Z][A-Z ,]+(?:[ ]+[A-Z][a-z]*\.?)?)(?:[ ]*[–—-][ ]*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[ ]+\d{4})/g,
            /([A-Z][A-Z ,]+(?:[ ]+[A-Z][a-z]*\.?)?)(?:[ ]*[–—-][ ]*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?[ ]+\d+,?[ ]+\d{4})/g,
            /([A-Z][A-Z ,]+(?:[ ]+[A-Z][a-z]*\.?)?)(?:[ ]*[–—-][ ]*)((?:January|February|March|April|May|June|July|August|September|October|November|December)[ ]+\d{4})/g,
            /([A-Z][A-Z ,]+(?:[ ]+[A-Z][a-z]*\.?)?)(?:[ ]*[–—-][ ]*)((?:January|February|March|April|May|June|July|August|September|October|November|December)[ ]+\d+,?[ ]+\d{4})/g,
            /([A-Z][A-Z ,]+(?:[ ]+[A-Z][a-z]*\.?)?)(?:[ ]*[–—-][ ]*)(\d{1,2}\/\d{1,2}\/\d{4})/g,
            // Patterns with parentheses - like "Independence, Ky. (June 26, 2025)"
            /([A-Z][a-zA-Z\s,\.]+)\s*\(\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})\s*\)/g,
            /([A-Z][a-zA-Z\s,\.]+)\s*\(\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\)/g
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                // Preserve the original separator character from the text
                const originalMatch = match[0];

                // Clean location: remove boilerplate and keep only the last line (Improvement #005)
                // This handles cases where the pattern captures "FOR IMMEDIATE RELEASE\n\nCITY, STATE"
                let location = match[1].trim();
                if (location.includes('\n')) {
                    // Get the last non-empty line (the actual location)
                    const lines = location.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    location = lines[lines.length - 1];
                }

                return {
                    location: location,
                    date: match[2].trim(),
                    full: `${location} — ${match[2].trim()}`
                };
            }
        }

        // Fallback: look for standalone location and date
        const locationMatch = text.match(/\b([A-Z][A-Z\s,]{8,25})\s*[–—-]/);
        const dateMatch = text.match(/\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/);

        if (locationMatch && dateMatch) {
            return {
                location: locationMatch[1].trim(),
                date: dateMatch[1].trim(),
                full: `${locationMatch[1].trim()} — ${dateMatch[1].trim()}`
            };
        }

        // NEW: Handle standalone date (no location) - for press releases with just a date
        // Match patterns like "Oct 02, 2025" or "October 2, 2025" on their own line
        if (dateMatch) {
            return {
                location: '',
                date: dateMatch[1].trim(),
                full: dateMatch[1].trim()
            };
        }

        return { location: '', date: '', full: '' };
    }

    /**
     * Flexible dateline extraction with confidence scoring
     * Returns dateline info even from badly formatted releases
     */
    extractDatelineFlexible(text) {
        const result = {
            location: null,
            date: null,
            full: null,
            confidence: 'none',
            issues: []
        };

        // STRATEGY -1: Check for Porter-style separated lines (after FOR IMMEDIATE RELEASE)
        // Format: Line 1: FOR IMMEDIATE RELEASE
        //         Line 2: March 11, 2025
        //         Line 3: CALIFORNIA or IRVINE, CA
        const lines = text.split('\n');
        let lineIdx = 0;

        // Find FOR IMMEDIATE RELEASE line
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            if (/FOR\s+IMMEDIATE\s+RELEASE/i.test(lines[i])) {
                lineIdx = i;
                break;
            }
        }

        if (lineIdx >= 0 && lineIdx + 1 < lines.length) {
            // Get first non-blank line after FOR IMMEDIATE RELEASE
            let nextNonBlank1 = '';
            let nextNonBlank2 = '';
            let foundLines = 0;

            for (let i = lineIdx + 1; i < Math.min(lines.length, lineIdx + 5); i++) {
                const trimmed = lines[i].trim();
                if (trimmed.length > 0) {
                    if (foundLines === 0) {
                        nextNonBlank1 = trimmed;
                        foundLines++;
                    } else if (foundLines === 1) {
                        nextNonBlank2 = trimmed;
                        break;
                    }
                }
            }

            // Check if first non-blank line after FOR IMMEDIATE RELEASE is a date
            const standaloneDatePattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i;
            const dateMatch = nextNonBlank1.match(standaloneDatePattern);

            if (dateMatch) {
                // Found Porter-style format date
                result.date = nextNonBlank1;

                // Check if second non-blank line is a location (all caps or CITY, ST format)
                if (nextNonBlank2.length > 0) {
                    const locPatterns = [
                        /^([A-Z][A-Z\s]+),\s*([A-Z]{2}|[A-Z][a-z]{1,3}\.?)$/,  // IRVINE, CA
                        /^([A-Z]{3,}[\sA-Z]*)$/  // CALIFORNIA (all caps, at least 3 chars)
                    ];

                    for (const pattern of locPatterns) {
                        const locMatch = nextNonBlank2.match(pattern);
                        if (locMatch) {
                            if (locMatch[2]) {
                                // Has state
                                result.location = `${locMatch[1].trim()}, ${locMatch[2]}`;
                            } else {
                                // All caps location (likely state or city)
                                result.location = locMatch[1].trim();
                            }
                            result.confidence = 'high';
                            result.full = `${result.location} - ${result.date}`;
                            return result;
                        }
                    }
                }

                // If we have date but no location, still return with medium confidence
                result.confidence = 'medium';
                if (result.date) {
                    result.full = result.date;
                }
            }
        }

        // STRATEGY -0.5: Check for AOC-style multi-line format (IMPROVEMENT #009)
        // Format: Line with date (e.g., "September 19, 2025") followed 2 lines later by location
        // Line 1: Headline
        // Line 3: September 19, 2025
        // Line 5: Washington, D.C.
        const datePattern = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}$/i;

        for (let i = 0; i < Math.min(lines.length, 10); i++) {
            const trimmed = lines[i].trim();
            const dateMatch = trimmed.match(datePattern);

            if (dateMatch && trimmed.length < 30) { // Date line should be short
                result.date = trimmed;

                // Look for location 1-3 lines after the date
                for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
                    const locationLine = lines[j].trim();

                    // Match location patterns: "Washington, D.C." or "New York, NY" or "San Francisco"
                    // NOT all caps (distinguishes from Porter-style)
                    const locPatterns = [
                        /^([A-Z][a-zA-Z\s]+),\s*([A-Z]\.?[A-Z]\.?|[A-Z][a-z]{1,20})$/,  // City, ST or City, D.C.
                        /^([A-Z][a-zA-Z\s]{3,20})$/  // Single city name
                    ];

                    for (const pattern of locPatterns) {
                        const locMatch = locationLine.match(pattern);
                        if (locMatch && locationLine.length < 40) { // Location should be short
                            if (locMatch[2]) {
                                result.location = `${locMatch[1].trim()}, ${locMatch[2]}`;
                            } else {
                                result.location = locMatch[1].trim();
                            }
                            result.confidence = 'high';
                            result.full = `${result.location} — ${result.date}`;
                            result.format = 'aoc-multiline';
                            return result;
                        }
                    }
                }

                // If we found date but no location, still return with medium confidence
                if (result.date && !result.location) {
                    result.confidence = 'medium';
                    result.full = result.date;
                    break;
                }
            }
        }

        // STRATEGY 0: Check for ISO date format (Sherrill-style releases)
        const isoDate = this.extractISODate(text);
        if (isoDate) {
            result.date = isoDate;
            result.confidence = 'medium';
        }

        // STRATEGY 1: Try formal dateline extraction (highest confidence)
        const formal = this.extractDatelineEnhanced(text);
        if (formal.location && formal.date) {
            return {
                location: formal.location,
                date: formal.date,
                full: formal.full,
                confidence: 'high',
                issues: []
            };
        }

        // If we have ISO date but no location from formal dateline, look for location
        // This handles cases like: "Date: ISO\n\nBLOOMFIELD — content"
        if (isoDate && !formal.location) {
            // Look for location pattern right after the ISO date line
            const lines = text.split('\n');
            for (let i = 0; i < Math.min(lines.length, 10); i++) {
                const line = lines[i].trim();
                // Look for "CITY, ST — " pattern OR "CITY — " pattern
                const locPatterns = [
                    /^([A-Z][A-Z\s]+),\s*([A-Z]{2}|[A-Z][a-z]{1,3}\.?)\s*[–—-]/,  // CITY, ST —
                    /^([A-Z][A-Z\s]{3,})\s*[–—-]/  // CITY — (at least 4 chars to avoid single words)
                ];

                for (const pattern of locPatterns) {
                    const match = line.match(pattern);
                    if (match) {
                        if (match[2]) {
                            // Has state
                            result.location = `${match[1].trim()}, ${match[2]}`;
                        } else {
                            // City only - try to infer state from context
                            const city = match[1].trim();
                            const inferredState = this.inferStateFromContext(text);
                            if (inferredState) {
                                result.location = `${city}, ${inferredState}`;
                            } else {
                                result.location = city;
                            }
                        }
                        result.confidence = 'high';
                        result.full = `${result.location} — ${result.date}`;
                        return result;
                    }
                }
            }
        }

        // STRATEGY 2: Look for location in first 8 lines (any city, state pattern)
        const firstLines = text.split('\n').slice(0, 8).join(' ');

        // Match patterns like "SPRINGFIELD, IL" or "Detroit, MI" or "RICHMOND, Va."
        const locationPatterns = [
            /\b([A-Z][A-Z\s]+),\s*([A-Z]{2})\b/,  // UPPERCASE CITY, ST (e.g., "DETROIT, MI")
            /\b([A-Z]+),\s*([A-Z][a-z]{1,3})\.?/,  // UPPERCASE CITY, abbreviated state (e.g., "RICHMOND, Va.")
            /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/  // Title Case City, ST
        ];

        for (const pattern of locationPatterns) {
            const locMatch = firstLines.match(pattern);
            if (locMatch) {
                result.location = `${locMatch[1].trim()}, ${locMatch[2]}`;
                result.confidence = 'medium';
                result.issues.push('Location found but not in formal dateline format');
                break;
            }
        }

        // Also check for city-only locations (no state) followed by em dash
        if (!result.location) {
            const cityOnlyMatch = firstLines.match(/\b([A-Z][A-Z\s]{3,}?)\s*[–—-]\s/);
            if (cityOnlyMatch) {
                const city = cityOnlyMatch[1].trim();
                const inferredState = this.inferStateFromContext(text);
                if (inferredState) {
                    result.location = `${city}, ${inferredState}`;
                } else {
                    result.location = city;
                }
                result.confidence = 'medium';
                result.issues.push('Location found but not in formal dateline format');
            }
        }

        // STRATEGY 3: Look for date in first 10 lines
        const first10Lines = text.split('\n').slice(0, 10).join(' ');
        const datePatterns = [
            // Full dates with year (higher priority)
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i,
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}\b/i,
            /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
            /\b\d{4}-\d{2}-\d{2}\b/,
            // Partial dates without year (lower priority)
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?\b/i,
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+\d{1,2}(st|nd|rd|th)?\b/i,
            /\b\d{1,2}\/\d{1,2}\b/
        ];

        for (const pattern of datePatterns) {
            const dateMatch = first10Lines.match(pattern);
            if (dateMatch) {
                result.date = dateMatch[0];
                if (result.confidence === 'none') result.confidence = 'low';
                result.issues.push('Date found but not in formal dateline format');
                break;
            }
        }

        // Build full dateline from found components
        if (result.location || result.date) {
            const parts = [];
            if (result.location) parts.push(result.location);
            if (result.date) parts.push(result.date);
            result.full = parts.join(' - ');
        }

        // Add issue if components missing
        if (!result.location) {
            result.issues.push('No location found in release');
        }
        if (!result.date) {
            result.issues.push('No date found in release');
        }

        return result;
    }

    /**
     * Enhanced paragraph extraction with better segmentation for unformatted content
     */
    extractParagraphsEnhanced(text) {
        // Clean text and remove headers using safe replacement method
        let content = this.safeRemovePatterns(text, [
            this.releasePatterns.release_type,
            this.releasePatterns.contact_info,
            this.releasePatterns.paid_for,
            this.releasePatterns.iso_date
        ]);

        // Remove ad transcript sections to prevent duplication (they're handled by extractAdTranscriptDialogue)
        // Match from "AD TRANSCRIPT:" until we hit a section marker (Background:, Contact:, ###) or end of text
        const adMarkerPattern = /(?:AD|VIDEO|RADIO)\s+(?:TRANSCRIPT|SCRIPT):[\s\S]*?(?=(?:\n\n)?(?:Background:|Contact:|###|$))/gi;
        content = content.replace(adMarkerPattern, '').trim();

        // Remove headline and dateline from content before extracting paragraphs
        const headline = this.findHeadlineEnhanced(content);
        const dateline = this.extractDatelineEnhanced(content);

        // Remove headline first
        // For short releases where headline IS the entire content, preserve it (Improvement #004)
        const originalContent = content;
        if (headline) {
            const headlineIndex = content.indexOf(headline);
            if (headlineIndex >= 0) {
                content = content.substring(headlineIndex + headline.length).trim();
            }
        }

        // Now remove dateline if found
        if (dateline && dateline.full) {
            const datelineIndex = content.indexOf(dateline.full);
            if (datelineIndex >= 0) {
                content = content.substring(datelineIndex + dateline.full.length).trim();
            }
        }

        // Try to split by existing paragraph breaks first
        let paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);

        // If no clear paragraph breaks, try to segment by sentence patterns
        // Lowered threshold from 200 to 50 to handle short releases (Improvement #004)
        if (paragraphs.length <= 1 && content.length > 50) {
            // Look for natural break points in unformatted content

            // First try: Split by quotes (which often mark paragraph boundaries)
            const quoteSegments = content.split(/(?:"[^"]*"[^.]*\.)\s+(?=[A-Z])/);

            if (quoteSegments.length > 1) {
                paragraphs = quoteSegments.filter(seg => seg.trim().length > 50);
            } else {
                // Second try: Split by sentence patterns with better heuristics
                const sentences = content.split(/\.\s+(?=[A-Z])/);
                const groupedParagraphs = [];
                let currentParagraph = '';

                for (let i = 0; i < sentences.length; i++) {
                    const sentence = sentences[i];
                    const nextSentence = sentences[i + 1];

                    // Add current sentence to paragraph
                    currentParagraph += (currentParagraph ? '. ' : '') + sentence;

                    // Decide if this should end the paragraph
                    const shouldBreak = (
                        // Paragraph is getting long (200+ chars) and has substance (100+ chars)
                        (currentParagraph.length > 200 && currentParagraph.length > 100) ||
                        // Next sentence starts with a quote (common paragraph boundary)
                        (nextSentence && nextSentence.trim().startsWith('"')) ||
                        // Current paragraph ends with quote attribution
                        /said\s+[A-Z][a-z]+|according\s+to|stated/.test(sentence) ||
                        // Natural topic shift indicators
                        (nextSentence && /^(The|This|Additionally|Meanwhile|However|Furthermore)/.test(nextSentence.trim()))
                    );

                    if (shouldBreak || i === sentences.length - 1) {
                        const finalParagraph = currentParagraph.trim() + (currentParagraph.endsWith('.') ? '' : '.');
                        if (finalParagraph.length > 50) {
                            groupedParagraphs.push(finalParagraph);
                        }
                        currentParagraph = '';
                    }
                }

                paragraphs = groupedParagraphs;
            }
        }

        // Clean up paragraphs and maintain spacing
        paragraphs = paragraphs
            .map(p => p.replace(/\s+/g, ' ').trim())
            .filter(p => p.length > 20);

        // Fallback: if we still have no paragraphs but have content, use entire content as single paragraph
        // This handles very short releases that don't meet any of the above criteria (Improvement #004)
        if (paragraphs.length === 0 && content.trim().length > 20) {
            paragraphs = [content.replace(/\s+/g, ' ').trim()];
        }

        // Final fallback: if headline consumed all content (single-sentence release), use headline as lead paragraph
        // This ensures single-sentence releases have both headline and lead paragraph (Improvement #004)
        if (paragraphs.length === 0 && headline && originalContent.trim().length > 20) {
            paragraphs = [headline];
        }

        return paragraphs;
    }

    /**
     * Build a unified content flow that preserves the original document order
     * Combines paragraphs and quotes based on their positions in the text
     * Returns: Array of content blocks in document order
     */
    buildContentFlow(text, paragraphs, quotes) {
        const contentBlocks = [];

        // Create a set of quote texts for quick lookup
        const quoteTexts = new Set(quotes.map(q => q.quote_text));

        // Add paragraphs with position tracking
        // Handle embedded quotes: keep paragraph intact if quote is embedded with context
        // Only filter out standalone quote attribution paragraphs (like "Quote," Speaker said.)
        paragraphs.forEach((para, index) => {
            let isStandaloneQuote = false;

            // Check if this paragraph ends with a quote attribution pattern
            // Pattern: ends with ", Speaker said." or '," said Speaker.' or ', Speaker said.'
            // Examples:
            //   - "Quote text," Speaker said. <- Standalone (filter out)
            //   - "Quote text," said Speaker. <- Standalone (filter out)
            //   - "Context. Quote text," Speaker said. <- Standalone (filter out)
            //   - "Context. Org called it 'quote.'" <- Embedded (keep - ends with quote, not attribution)
            const attributionPattern = /["'""][,.]?\s+(?:(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+)?(?:said|stated|continued|added|noted|explained|remarked|commented|declared|announced|told|responded|replied)|(?:said|stated|continued|added|noted|explained|remarked|commented|declared|announced|told|responded|replied)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\.?\s*$/i;

            if (attributionPattern.test(para.trim())) {
                isStandaloneQuote = true;
            }

            // Only add paragraphs that aren't standalone quote attributions
            // Embedded quotes (with substantial context) stay in the paragraph
            if (!isStandaloneQuote) {
                const position = text.indexOf(para);
                if (position >= 0) {
                    contentBlocks.push({
                        type: 'paragraph',
                        content: para,
                        position: position,
                        index: index
                    });
                }
            }
        });

        // Add quotes with position tracking
        // But skip quotes that are embedded in paragraphs (don't end with attribution)
        // Only show quotes that are in standalone attribution paragraphs
        quotes.forEach((quote, index) => {
            let isEmbedded = false;

            // Check if this quote appears in a paragraph that doesn't end with attribution
            const attributionPattern = /["'""][,.]?\s+(?:(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+)?(?:said|stated|continued|added|noted|explained|remarked|commented|declared|announced|told|responded|replied)|(?:said|stated|continued|added|noted|explained|remarked|commented|declared|announced|told|responded|replied)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\.?\s*$/i;

            for (const para of paragraphs) {
                const normalizedPara = para.replace(/["""]/g, '"').replace(/\s+/g, ' ').trim();
                const normalizedQuote = quote.quote_text.replace(/["""]/g, '"').replace(/\s+/g, ' ').trim();

                if (normalizedPara.includes(normalizedQuote)) {
                    // If paragraph contains this quote but doesn't end with attribution pattern,
                    // the quote is embedded (can't be separated without creating a fragment)
                    if (!attributionPattern.test(para.trim())) {
                        isEmbedded = true;
                        break;
                    }
                }
            }

            // Only add standalone quotes (not embedded ones)
            if (!isEmbedded) {
                contentBlocks.push({
                    type: 'quote',
                    content: quote.quote_text,
                    speaker: quote.speaker_name,
                    speaker_title: quote.speaker_title,
                    attribution: quote.full_attribution,
                    confidence: quote.confidence,
                    position: quote.position || 0,
                    index: index,
                    quote_data: quote
                });
            }
        });

        // Sort by position to reconstruct original flow
        contentBlocks.sort((a, b) => a.position - b.position);

        return contentBlocks;
    }

    extractBoilerplate(text) {
        const paragraphs = this.extractParagraphs(text);

        // Look for actual boilerplate (candidate bio) - don't just grab the last paragraph
        // Real boilerplate has biographical indicators
        const bioIndicators = [
            /is\s+(?:running|a\s+candidate)\s+for/i,
            /(?:previously|currently)\s+served/i,
            /(?:earned|graduated|received)\s+(?:a|his|her)\s+degree/i,
            /lives\s+(?:in|with)/i,
            /resides\s+in/i,
            /is\s+(?:a|the)\s+(?:mother|father|parent)/i,
            /native\s+of/i,
            /grew\s+up\s+in/i,
            /worked\s+as\s+a/i,
            /background\s+in/i,
            /experience\s+in/i,
            /career\s+(?:in|as)/i
        ];

        // Check last few paragraphs for biographical content
        for (let i = paragraphs.length - 1; i >= Math.max(0, paragraphs.length - 3); i--) {
            const paragraph = paragraphs[i];

            // Skip if too short or contains quotes
            if (paragraph.length < 100 || paragraph.includes('"')) {
                continue;
            }

            // Check for biographical indicators
            const bioMatches = bioIndicators.filter(pattern => pattern.test(paragraph)).length;

            // Must have at least 2 biographical indicators to be considered boilerplate
            if (bioMatches >= 2) {
                return paragraph;
            }
        }

        // No boilerplate found
        return '';
    }

    inferPressReleaseType(text) {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('announces candidacy') || lowerText.includes('running for')) {
            return 'campaign_launch';
        }
        if (lowerText.includes('endorses') || lowerText.includes('endorsement')) {
            return 'endorsement';
        }
        if (lowerText.includes('raised') && lowerText.includes('donors')) {
            return 'fundraising';
        }
        if (lowerText.includes('town hall') || lowerText.includes('event')) {
            return 'event_promotion';
        }
        if (lowerText.includes('responds to') || lowerText.includes('statement on')) {
            return 'crisis_response';
        }
        if (lowerText.includes('plan') || lowerText.includes('policy')) {
            return 'policy_position';
        }

        return 'general';
    }

    parseDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return null;
        }
    }

    parseTime(timeString) {
        try {
            const cleaned = timeString.replace(/\s+/g, '');
            if (cleaned.includes(':')) {
                return cleaned.toLowerCase();
            }
        } catch {
            return null;
        }
        return null;
    }

    /**
     * Validate technical parseability (structural/encoding issues)
     * This runs BEFORE parsing to catch technical problems
     * @param {string} text - The raw input text
     * @returns {Object} Technical validation result
     */
    validateTechnical(text) {
        const validation = {
            is_parseable: true,
            errors: [],
            warnings: []
        };

        // 1. Check if text exists
        if (!text || typeof text !== 'string') {
            validation.is_parseable = false;
            validation.errors.push({
                type: 'invalid_input',
                message: 'Input is not a valid string',
                suggestion: 'Provide text as a string value'
            });
            return validation;
        }

        // 2. Check for empty or whitespace-only
        const trimmed = text.trim();
        if (trimmed.length === 0) {
            validation.is_parseable = false;
            validation.errors.push({
                type: 'empty_input',
                message: 'Input is empty or contains only whitespace',
                suggestion: 'Provide actual press release text'
            });
            return validation;
        }

        // 3. Check minimum length
        if (trimmed.length < 50) {
            validation.is_parseable = false;
            validation.errors.push({
                type: 'too_short',
                message: `Input is too short (${trimmed.length} chars, minimum 50)`,
                suggestion: 'Press releases should be at least 50 characters long'
            });
            return validation;
        }

        // 4. Check maximum length (prevent DoS)
        const MAX_LENGTH = 1000000; // 1MB
        if (text.length > MAX_LENGTH) {
            validation.is_parseable = false;
            validation.errors.push({
                type: 'too_large',
                message: `Input exceeds maximum size (${text.length} chars, max ${MAX_LENGTH})`,
                suggestion: 'Press releases should be under 1MB'
            });
            return validation;
        }

        // 5. Check for null bytes or binary data
        if (text.includes('\x00') || /[\x01-\x08\x0E-\x1F]/.test(text)) {
            validation.is_parseable = false;
            validation.errors.push({
                type: 'binary_data',
                message: 'Input contains binary or corrupt data',
                suggestion: 'Ensure the file is plain text (UTF-8)'
            });
            return validation;
        }

        // 6. Check for HTML/XML
        if (/<html|<body|<div|<p>|<span|<!DOCTYPE/i.test(text)) {
            validation.warnings.push({
                type: 'html_detected',
                severity: 'high',
                message: 'Input appears to contain HTML markup',
                suggestion: 'Convert HTML to plain text before parsing'
            });
        }

        // 7. Check for JSON
        if ((text.trim().startsWith('{') && text.trim().endsWith('}')) ||
            (text.trim().startsWith('[') && text.trim().endsWith(']'))) {
            validation.warnings.push({
                type: 'json_detected',
                severity: 'high',
                message: 'Input appears to be JSON data',
                suggestion: 'Extract the text content from JSON before parsing'
            });
        }

        // 8. Check for extremely long lines (could cause ReDoS)
        const lines = text.split('\n');
        const longLines = lines.filter(line => line.length > 5000);
        if (longLines.length > 0) {
            validation.warnings.push({
                type: 'extremely_long_lines',
                severity: 'medium',
                message: `Found ${longLines.length} line(s) over 5000 characters`,
                suggestion: 'Press releases should have reasonable line breaks'
            });
        }

        // 9. Check for lack of structure (all one line)
        if (lines.length === 1 && text.length > 100) {
            validation.warnings.push({
                type: 'no_line_breaks',
                severity: 'medium',
                message: 'Input has no line breaks (all one line)',
                suggestion: 'Add line breaks to properly structure the press release'
            });
        }

        // 10. Check for excessive special characters
        const specialCharsCount = (text.match(/[^a-zA-Z0-9\s.,!?;:()\-"']/g) || []).length;
        const specialCharsRatio = specialCharsCount / text.length;
        if (specialCharsRatio > 0.3) {
            validation.warnings.push({
                type: 'excessive_special_chars',
                severity: 'low',
                message: `${(specialCharsRatio * 100).toFixed(0)}% of input is special characters`,
                suggestion: 'Input may not be plain text or may be corrupt'
            });
        }

        // 11. Check for valid text content (not just numbers/punctuation)
        const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
        if (alphaCount < 20) {
            validation.is_parseable = false;
            validation.errors.push({
                type: 'no_text_content',
                message: 'Input contains no meaningful text content',
                suggestion: 'Provide actual press release text with letters and words'
            });
        }

        return validation;
    }

    /**
     * Validate press release quality and provide actionable feedback
     * @param {Object} parseResult - The result from parse()
     * @param {string} originalText - The original press release text
     * @returns {Object} Validation result with quality score, issues, and suggestions
     */
    validateQuality(parseResult, originalText) {
        const validation = {
            quality_score: 100,
            status: 'excellent', // excellent, good, fair, poor, rejected
            errors: [],
            warnings: [],
            suggestions: [],
            should_reject: false,
            metrics: {}
        };

        // Calculate metrics
        const quoteCount = parseResult.quotes.length;
        const unknownSpeakers = parseResult.quotes.filter(q =>
            !q.speaker_name || q.speaker_name === 'UNKNOWN'
        ).length;
        const unknownPct = quoteCount > 0 ? (unknownSpeakers / quoteCount * 100) : 0;
        const bodyLength = parseResult.content_structure.body_paragraphs?.join(' ').length || 0;
        const hasDateline = !!(parseResult.content_structure.dateline?.date ||
                              parseResult.content_structure.dateline?.location);
        const hasHeadline = !!(parseResult.content_structure.headline &&
                              parseResult.content_structure.headline.length > 10);

        validation.metrics = {
            quote_count: quoteCount,
            unknown_speakers: unknownSpeakers,
            unknown_speaker_percentage: Math.round(unknownPct),
            body_length: bodyLength,
            has_dateline: hasDateline,
            has_headline: hasHeadline,
            has_for_immediate_release: originalText.includes('FOR IMMEDIATE RELEASE') ||
                                       originalText.includes('FOR RELEASE')
        };

        // CRITICAL ERRORS (auto-reject)
        if (!validation.metrics.has_for_immediate_release) {
            validation.errors.push({
                type: 'missing_header',
                message: 'Missing "FOR IMMEDIATE RELEASE" header',
                suggestion: 'Add "FOR IMMEDIATE RELEASE" as the first line of the press release'
            });
            validation.quality_score -= 30;
        }

        if (quoteCount === 0) {
            validation.errors.push({
                type: 'no_quotes',
                message: 'No quotes found in press release',
                suggestion: 'Add at least one quote with proper attribution: "Quote text," said FirstName LastName, Title.'
            });
            validation.quality_score -= 40;
        }

        if (!hasHeadline) {
            validation.errors.push({
                type: 'no_headline',
                message: 'No meaningful headline found',
                suggestion: 'Add a clear, descriptive headline after the FOR IMMEDIATE RELEASE line'
            });
            validation.quality_score -= 25;
        }

        if (bodyLength < 100) {
            validation.errors.push({
                type: 'insufficient_content',
                message: `Press release body is too short (${bodyLength} characters)`,
                suggestion: 'Expand the body text to at least 100-200 characters with meaningful content'
            });
            validation.quality_score -= 35;
        }

        // HIGH-PRIORITY WARNINGS
        if (!hasDateline) {
            validation.warnings.push({
                type: 'missing_dateline',
                severity: 'high',
                message: 'Missing dateline (location and date)',
                suggestion: 'Add a dateline in format: CITY, STATE — Month Day, Year'
            });
            validation.quality_score -= 15;
        }

        if (quoteCount > 0 && unknownPct > 75) {
            validation.warnings.push({
                type: 'too_many_unknown_speakers',
                severity: 'high',
                message: `${unknownPct}% of quotes have unknown speakers (${unknownSpeakers}/${quoteCount})`,
                suggestion: 'Add proper attribution to quotes using format: "Quote text," said FirstName LastName, Title.'
            });
            validation.quality_score -= 20;
        } else if (quoteCount > 0 && unknownPct > 50) {
            validation.warnings.push({
                type: 'many_unknown_speakers',
                severity: 'medium',
                message: `${unknownPct}% of quotes have unknown speakers (${unknownSpeakers}/${quoteCount})`,
                suggestion: 'Improve quote attribution by adding speaker names after quotes'
            });
            validation.quality_score -= 10;
        }

        // MEDIUM-PRIORITY WARNINGS
        if (quoteCount === 1) {
            validation.warnings.push({
                type: 'few_quotes',
                severity: 'medium',
                message: 'Only 1 quote found - press releases typically include 2-3 quotes',
                suggestion: 'Consider adding 1-2 more quotes from relevant speakers'
            });
            validation.quality_score -= 5;
        }

        if (unknownSpeakers > 0 && unknownPct <= 50) {
            validation.warnings.push({
                type: 'some_unknown_speakers',
                severity: 'low',
                message: `${unknownSpeakers} quote(s) have unknown speakers`,
                suggestion: 'Review quotes without attribution and add speaker names where possible'
            });
            validation.quality_score -= 5;
        }

        if (bodyLength > 0 && bodyLength < 200) {
            validation.warnings.push({
                type: 'short_content',
                severity: 'low',
                message: `Press release is quite brief (${bodyLength} characters)`,
                suggestion: 'Consider expanding with more context, background, or additional details'
            });
            validation.quality_score -= 5;
        }

        // Determine final status and rejection
        validation.quality_score = Math.max(0, validation.quality_score);

        if (validation.quality_score < 40) {
            validation.status = 'rejected';
            validation.should_reject = true;
        } else if (validation.quality_score < 60) {
            validation.status = 'poor';
        } else if (validation.quality_score < 75) {
            validation.status = 'fair';
        } else if (validation.quality_score < 90) {
            validation.status = 'good';
        } else {
            validation.status = 'excellent';
        }

        // Generate summary suggestions
        if (validation.should_reject) {
            validation.suggestions.push('This press release has critical issues that prevent proper parsing. Please address all errors before resubmitting.');
        } else if (validation.status === 'poor') {
            validation.suggestions.push('This press release has significant quality issues. Please review and address warnings to improve parseability.');
        } else if (validation.status === 'fair') {
            validation.suggestions.push('This press release is parseable but could be improved. Review warnings for specific suggestions.');
        }

        return validation;
    }

    /**
     * Parse press release and include validation results
     * @param {string} text - Press release text
     * @param {boolean} includeValidation - Whether to include validation results (default: true)
     * @returns {Object} Parse result with optional validation
     */
    parseWithValidation(text, includeValidation = true) {
        let parseResult;

        if (includeValidation) {
            // First, check technical parseability
            const technicalValidation = this.validateTechnical(text);

            // If technical validation fails, return early with error
            if (!technicalValidation.is_parseable) {
                return {
                    technical_validation: technicalValidation,
                    error: 'Input failed technical validation',
                    is_parseable: false
                };
            }

            // Technical validation passed, proceed with parsing
            parseResult = this.parse(text);

            // Add both technical and quality validation
            parseResult.technical_validation = technicalValidation;
            parseResult.validation = this.validateQuality(parseResult, text);
        } else {
            // Skip validation, just parse
            parseResult = this.parse(text);
        }

        return parseResult;
    }

    /**
     * ============================================================================
     * FACTUAL CLAIMS EXTRACTION
     * ============================================================================
     * Identifies provable, verifiable statements vs speculative/hedged claims
     */

    /**
     * Extract provable factual claims from text
     * Filters out hedged, speculative, opinion, and conditional statements
     */
    extractProvableFacts(text) {
        const facts = [];

        // Split text into sentences
        const sentences = this.splitIntoSentences(text);

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();

            // Skip very short sentences
            if (sentence.length < 20) continue;

            // Check if claim is based on private/unverifiable data
            const privateDataCheck = this.detectPrivateDataClaim(sentence);
            if (privateDataCheck.is_private) {
                // Still record it but mark as unverifiable
                facts.push({
                    statement: sentence,
                    type: ['private-data-claim'],
                    confidence: 0,
                    verifiable: false,
                    reason_unverifiable: privateDataCheck.reason,
                    private_data_indicators: privateDataCheck.indicators,
                    numeric_claims: this.extractNumericClaims(sentence),
                    note: 'Cannot be verified against public sources'
                });
                continue;
            }

            // Check for plausible deniability patterns
            const deniabilityCheck = this.detectPlausibleDeniability(sentence);
            if (deniabilityCheck.has_deniability) {
                // Record as deniable claim - speaker avoids direct responsibility
                facts.push({
                    statement: sentence,
                    type: ['plausible-deniability', ...deniabilityCheck.labels.map(l => l.toLowerCase())],
                    confidence: 0.3, // Low confidence because not a direct assertion
                    verifiable: true,
                    verification_type: 'extract-underlying-claim',
                    deniability_patterns: deniabilityCheck.matched_patterns,
                    deniability_reason: deniabilityCheck.reason,
                    deniability_score: deniabilityCheck.confidence,
                    numeric_claims: this.extractNumericClaims(sentence),
                    note: 'Speaker uses deniability patterns to avoid direct responsibility for claim'
                });
                continue;
            }

            // Check if this is hearsay/reported speech
            const hearsayCheck = this.detectHearsay(sentence);
            if (hearsayCheck.is_hearsay) {
                // Record as hearsay - requires two-step verification
                facts.push({
                    statement: sentence,
                    type: ['hearsay', 'reported-speech'],
                    confidence: 0.5,
                    verifiable: true,
                    verification_type: 'two-step',
                    original_speaker: hearsayCheck.original_speaker,
                    hearsay_type: hearsayCheck.hearsay_type,
                    verification_notes: hearsayCheck.verification_notes,
                    numeric_claims: this.extractNumericClaims(sentence),
                    note: 'Hearsay requires verifying both the attribution and the claim itself'
                });
                continue;
            }

            // Check for comparative/computational claims (e.g., "deficit is greater than GDP")
            const comparativeClaim = this.detectComparativeClaim(sentence);
            if (comparativeClaim.is_comparative) {
                facts.push({
                    statement: sentence,
                    text: sentence,
                    type: ['comparative-claim', 'computational'],
                    confidence: 0.8,
                    verifiable: true,
                    verification_type: 'multi-step-comparative',
                    comparison_type: comparativeClaim.comparison_type,
                    metrics: comparativeClaim.metrics,
                    verification_steps: comparativeClaim.verification_steps,
                    numeric_claims: this.extractNumericClaims(sentence),
                    note: 'Requires looking up multiple data points and comparing them'
                });
                continue;
            }

            // Check if sentence is hedged/speculative
            const hedging = this.detectHedging(sentence);
            if (hedging.is_hedged && hedging.confidence > 0.6) continue;

            // Check if sentence contains factual elements
            const factualElements = this.identifyFactualElements(sentence);
            if (factualElements.score < 0.3) continue;

            // Classify the type of fact
            const factType = this.classifyFactType(sentence, factualElements);

            // Extract any numeric claims
            const numericClaims = this.extractNumericClaims(sentence);

            // Check for attribution
            const attribution = this.extractAttribution(sentence);

            facts.push({
                statement: sentence,
                text: sentence,
                type: factType,
                confidence: this.calculateFactConfidence(sentence, hedging, factualElements),
                verifiable: true,
                verification_type: 'standard',
                hedging_detected: hedging.is_hedged ? hedging.markers : [],
                numeric_claims: numericClaims,
                has_attribution: attribution.has_attribution,
                attribution_source: attribution.source,
                factual_elements: factualElements.elements,
                requires_verification: factualElements.score > 0.5
            });
        }

        // Sort by confidence (most confident facts first)
        facts.sort((a, b) => b.confidence - a.confidence);

        return facts;
    }

    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        // Split on sentence boundaries
        // Handle abbreviations like "U.S." or "D.C." carefully
        return text
            .replace(/([.!?])\s+(?=[A-Z])/g, '$1|SPLIT|')
            .split('|SPLIT|')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Detect claims based on private/internal data that cannot be verified
     *
     * CONCEPT: A claim is verifiable only if the underlying data source is publicly accessible.
     *
     * Verification requires:
     * 1. PUBLIC ACCESS - Independent parties can access the raw data
     * 2. INDEPENDENT CONFIRMATION - Third parties can validate the claim
     * 3. TRANSPARENT METHODOLOGY - Methods can be reviewed and reproduced
     *
     * Claims are UNVERIFIABLE when:
     * 1. DATA SOURCE IS CONTROLLED BY CLAIMANT - "our internal polling", "my research"
     * 2. DATA IS NOT PUBLICLY RELEASED - "private data", "proprietary analysis"
     * 3. NO INDEPENDENT VALIDATION POSSIBLE - No way for third parties to confirm
     *
     * Examples:
     * - UNVERIFIABLE: "Our internal polling shows we're ahead" (controlled by claimant)
     * - VERIFIABLE: "A Gallup poll shows we're ahead" (public, independent source)
     * - UNVERIFIABLE: "Our campaign data confirms momentum" (not publicly accessible)
     * - VERIFIABLE: "FEC filings show we raised $5M" (public records)
     */
    detectPrivateDataClaim(sentence) {
        const indicators = [];
        const sentenceLower = sentence.toLowerCase();

        /**
         * STEP 1: Check if data source is controlled by the claimant
         * Violates PUBLIC ACCESS principle - the claimant controls the data
         */
        const claimantControlledSources = /\b(?:according to|poll(?:ing)?\s+(?:by|from)|reported by|study by|data from)\s+(?:our|my|internal|private|proprietary|campaign)\b/i.test(sentence);

        if (claimantControlledSources) {
            // Data is controlled by claimant - cannot be independently verified
            // e.g., "according to our internal polling" - we control the data
        } else {
            /**
             * STEP 2: Check for public attribution
             * Satisfies INDEPENDENT CONFIRMATION - third parties produced the data
             */
            const hasPublicAttribution = /\b(?:according to|poll(?:ing)?\s+(?:by|from)|reported by|study by|data from)\s+(?:[A-Z][\w\s,]+|(?:the\s+)?(?:Politico|CNN|Reuters|AP|New York Times|Washington Post|CBS|NBC|ABC|Fox|Pew|Gallup|Rasmussen))/i.test(sentence);

            if (hasPublicAttribution) {
                // Data from independent, public source - can be verified
                return {
                    is_private: false,
                    confidence: 0,
                    indicators: [],
                    reason: 'Claim attributed to public source'
                };
            }
        }

        /**
         * STEP 3: Detect explicit private data patterns
         * Violates PUBLIC ACCESS and INDEPENDENT CONFIRMATION principles
         *
         * These patterns identify data sources that:
         * - Are controlled exclusively by the claimant
         * - Cannot be accessed by independent parties
         * - Have no publicly available methodology
         */
        const privateDataPatterns = [
            // "our/my/internal/private polling" - claimant controls the data
            { pattern: /\b(our|my|internal|private|proprietary)\s+(?:poll(?:ing|s)?|data|research|analysis|survey|study|numbers|metrics)\b/i, type: 'internal-data', weight: 1.0 },

            // "our own campaign data" - explicitly campaign-controlled
            { pattern: /\b(?:our|my)\s+(?:own|campaign)\s+(?:poll(?:ing|s)?|data|research|numbers)\b/i, type: 'campaign-data', weight: 1.0 },

            // "internal polling/data" - not publicly released
            { pattern: /\binternal\s+(?:poll(?:ing|s)?|data|numbers|metrics|analysis)\b/i, type: 'internal', weight: 1.0 },

            // "private polling/research" - explicitly not public
            { pattern: /\bprivate\s+(?:poll(?:ing|s)?|data|research|survey)\b/i, type: 'private', weight: 1.0 },

            // "proprietary analysis" - owned/controlled, not shared
            { pattern: /\bproprietary\s+(?:data|research|analysis)\b/i, type: 'proprietary', weight: 1.0 },

            // "our data shows" - slightly weaker signal but still indicates control
            { pattern: /\bour\s+(?:data|research)\s+(?:shows|confirms|indicates)\b/i, type: 'our-data', weight: 0.9 }
        ];

        let maxWeight = 0;
        let reason = '';

        // Check each pattern and track the strongest indicator found
        for (const {pattern, type, weight} of privateDataPatterns) {
            if (pattern.test(sentence)) {
                const match = sentence.match(pattern);
                indicators.push({
                    type,
                    match: match[0],
                    weight
                });
                if (weight > maxWeight) {
                    maxWeight = weight;
                    reason = `Based on ${type.replace('-', ' ')} which is not publicly verifiable`;
                }
            }
        }

        /**
         * STEP 4: Detect unsourced self-referential claims
         * Violates TRANSPARENT METHODOLOGY - no way to validate the underlying data
         *
         * Example: "We are 20 points ahead" - who measured this? what's the source?
         * Without attribution, we cannot access the methodology or verify the claim
         */
        if (sentenceLower.includes('we are') || sentenceLower.includes('we have')) {
            if (/\b\d+\s*(?:point|percent|%|percentage)\s*(?:ahead|lead|up)\b/i.test(sentence)) {
                // Check if there's NO public attribution
                if (!/\baccording to\b/i.test(sentence) && !/\bpoll(?:ing|s)?\s+(?:by|from)\b/i.test(sentence)) {
                    indicators.push({
                        type: 'unsourced-comparative-claim',
                        match: 'Self-referential claim without public source',
                        weight: 0.7
                    });
                    maxWeight = Math.max(maxWeight, 0.7);
                    reason = reason || 'Self-referential claim without attribution to public source';
                }
            }
        }

        return {
            is_private: maxWeight >= 0.7,
            confidence: maxWeight,
            indicators,
            reason: reason || 'Claim based on publicly verifiable data'
        };
    }

    /**
     * Detect plausible deniability patterns
     *
     * CONCEPT: Plausible deniability is when a speaker makes claims while maintaining
     * the ability to deny responsibility or ownership of those claims.
     *
     * Common techniques:
     * - Anonymous attribution: "People are saying...", "Everybody knows..."
     * - Hedging: "Might be...", "Could be...", "Seems like..."
     * - JAQing off: "I'm not saying it's true, but...", "Just asking questions..."
     * - Passive authority: "It is widely believed..."
     * - Rhetorical questions: "Isn't it interesting that...?"
     *
     * These patterns allow speakers to:
     * 1. Make inflammatory claims without direct responsibility
     * 2. Avoid fact-checking by not making direct assertions
     * 3. Suggest conclusions without stating them explicitly
     */
    detectPlausibleDeniability(sentence) {
        const patterns = [
            // Trump-style attribution to anonymous sources
            { id: 'ATTR_PEOPLE_SAY', label: 'AttributionToAnonymousOthers', weight: 0.40,
              rx: /\b(people|lots of people|a lot of people|many (people|folks)) (are )?(saying|telling|have said)\b/i },
            { id: 'ATTR_EVERYBODY_KNOWS', label: 'AppealToObviousness', weight: 0.40,
              rx: /\b(everybody|everyone)\s+knows\b/i },
            { id: 'ATTR_I_HEARD', label: 'HearsayShield', weight: 0.35,
              rx: /\b(i\s*(just\s*)?heard|i'?ve heard|i(?:\s*do\s*not| don't)\s*know,?\s*but)\b/i },
            { id: 'ATTR_MANY_BELIEVE', label: 'AppealToConsensus', weight: 0.35,
              rx: /\b(many|most)\s+(people\s+)?(believe|think|feel)\b/i },
            { id: 'ATTR_THEY_SAY', label: 'TheySay', weight: 0.35,
              rx: /\b(they|some)\s+(say|are saying|have said)\b/i },

            // Hedging with modality
            { id: 'HEDGE_MODAL', label: 'HedgedModality', weight: 0.20,
              rx: /\b(might|may|could|seems|appears|likely|possibly|perhaps)\b/i },
            { id: 'COND_IF_TRUE', label: 'ConditionalEscape', weight: 0.25,
              rx: /\b(if\s+true|assuming\s+this\s+is\s+the\s+case|suppose\s+for\s+a\s+moment)\b/i },

            // Passive/impersonal authority
            { id: 'PASSIVE_WIDELY_BELIEVED', label: 'PassiveAuthority', weight: 0.30,
              rx: /\b(it\s+is\s+(widely\s+)?believed|it\s+has\s+been\s+suggested|it\s+is\s+said)\b/i },

            // JAQing off (Just Asking Questions)
            { id: 'JAQ', label: 'JustAskingQuestions', weight: 0.35,
              rx: /\b(i'?m\s+not\s+saying\s+it'?s\s+true,?\s*but|not\s+saying\s+it'?s\s+true|just\s+asking|shouldn'?t\s+we\s+ask)\b/i },
            { id: 'RHET_Q_STEMS', label: 'RhetoricalQuestionStem', weight: 0.20,
              rx: /^(isn'?t\s+it\s+interesting|what\s+if|could\s+it\s+be\s+that|can\s+you\s+believe\s+it)\b/i },

            // Equivocation / association without causation
            { id: 'EQUIV_ASSOC', label: 'EquivocalAssociation', weight: 0.25,
              rx: /\b(linked\s+to|connected\s+with|related\s+to)\b/i },

            // Noncommittal future
            { id: 'OVERLAP_WE_LL_SEE', label: 'NoncommittalFuture', weight: 0.25,
              rx: /\b(we'?ll\s+see\s+what\s+happens|could\s+be\s+true,?\s*could\s+be\s+not\s+true|who\s+knows)\b/i },

            // Common sense appeal
            { id: 'COMMON_SENSE', label: 'AppealToCommonSense', weight: 0.30,
              rx: /\b(it'?s)\s+(just\s+)?common\s+sense\b/i },

            // Presupposition
            { id: 'MEDIA_NEVER', label: 'Presupposition', weight: 0.30,
              rx: /\b(the\s+media\s+never\s+talks?\s+about\s+it|nobody\s+talks?\s+about\s+it)\b/i }
        ];

        // Claiminess lexicon - charged terms that suggest serious accusations
        const claimyWords = /\b(rigged|fraud|corrupt|fake|hoax|proof|evidence|massive|unprecedented|disaster|cover[-\s]?up|illegal|crime|scandal|worst|best|biggest|tremendous)\b/i;

        // Rhetorical question stems
        const rhetQuestionStem = /^\s*(isn'?t it|what if|could it be|can you believe|is it possible|how come)\b/i;

        const matched = [];
        let score = 0.0;

        // Check each pattern
        for (const pattern of patterns) {
            if (pattern.rx.test(sentence)) {
                const match = sentence.match(pattern.rx);
                matched.push({
                    id: pattern.id,
                    label: pattern.label,
                    match: match[0],
                    weight: pattern.weight
                });
                score += pattern.weight;
            }
        }

        // Claiminess boost - suggests hedge is attached to serious accusation
        if (claimyWords.test(sentence)) {
            score += 0.10;
        }

        // Rhetorical question boost
        if (sentence.trim().endsWith('?') && rhetQuestionStem.test(sentence)) {
            score += 0.10;
        }

        score = Math.min(1.0, score);

        // Build reason string
        const reasonBits = [];
        if (matched.some(m => m.id.startsWith('ATTR_'))) {
            reasonBits.push('attribution to anonymous or universalized sources');
        }
        if (matched.some(m => ['HEDGE_MODAL', 'COND_IF_TRUE'].includes(m.id))) {
            reasonBits.push('hedged modality / conditional framing');
        }
        if (matched.some(m => ['JAQ', 'RHET_Q_STEMS'].includes(m.id)) || sentence.trim().endsWith('?')) {
            reasonBits.push('rhetorical question / JAQ framing');
        }
        if (matched.some(m => m.id === 'PASSIVE_WIDELY_BELIEVED')) {
            reasonBits.push('passive/impersonal authority');
        }
        if (matched.some(m => m.id === 'EQUIV_ASSOC')) {
            reasonBits.push('equivocal association');
        }
        if (claimyWords.test(sentence)) {
            reasonBits.push('contains charged claim terms');
        }

        return {
            has_deniability: score >= 0.50,
            confidence: score,
            matched_patterns: matched,
            reason: reasonBits.join('; '),
            labels: [...new Set(matched.map(m => m.label))].sort()
        };
    }

    /**
     * Detect hearsay and reported speech
     *
     * CONCEPT: Hearsay is when the speaker reports what someone else said, rather than
     * making a direct claim themselves.
     *
     * Verification of hearsay requires TWO steps:
     * 1. VERIFY THE ATTRIBUTION - Did the person actually say this?
     * 2. VERIFY THE CLAIM - Is what they said factually accurate?
     *
     * Types of reported speech:
     * - Direct hearsay: "As you heard X say..." (referencing audience knowledge)
     * - Indirect report: "X told us that..." (reporting private communication)
     * - Paraphrase: "X mentioned that..." (restating someone's words)
     *
     * This is DIFFERENT from attribution:
     * - Attribution: "According to the CBO, ..." (citing a verifiable source)
     * - Hearsay: "As you heard the President say, ..." (reporting what was said)
     */
    detectHearsay(sentence) {
        const indicators = [];

        // Patterns for hearsay/reported speech
        const hearsayPatterns = [
            // Direct audience reference - "as you heard/saw X say"
            { pattern: /\b(?:as|like)\s+you\s+(?:heard|saw|watched|listened to)\s+([A-Z][\w\s]+?)\s+(?:say|state|mention|claim|tell|explain)/i, type: 'audience-reference', weight: 1.0 },

            // "You heard X say/mention/state"
            { pattern: /\byou\s+heard\s+([A-Z][\w\s]+?)\s+(?:say|state|mention|claim|tell)/i, type: 'audience-reference', weight: 1.0 },

            // "X told us/me that"
            { pattern: /\b([A-Z][\w\s]+?)\s+told\s+(?:us|me|them)\s+(?:that|how)/i, type: 'reported-private-communication', weight: 0.9 },

            // "X mentioned/said that"
            { pattern: /\b([A-Z][\w\s]+?)\s+(?:mentioned|said|stated|claimed|told)\s+(?:that|how)/i, type: 'paraphrase', weight: 0.8 },

            // "As X said/stated"
            { pattern: /\bas\s+([A-Z][\w\s]+?)\s+(?:said|stated|mentioned|claimed|explained)/i, type: 'paraphrase', weight: 0.8 },

            // "You've heard X say" (present perfect)
            { pattern: /\byou(?:'ve|\s+have)\s+heard\s+([A-Z][\w\s]+?)\s+(?:say|state|claim)/i, type: 'audience-reference', weight: 1.0 }
        ];

        let maxWeight = 0;
        let originalSpeaker = null;
        let hearsayType = null;

        for (const {pattern, type, weight} of hearsayPatterns) {
            const match = sentence.match(pattern);
            if (match) {
                const speaker = match[1] ? match[1].trim() : null;
                indicators.push({
                    type,
                    match: match[0],
                    speaker,
                    weight
                });

                if (weight > maxWeight) {
                    maxWeight = weight;
                    originalSpeaker = speaker;
                    hearsayType = type;
                }
            }
        }

        return {
            is_hearsay: maxWeight >= 0.8,
            confidence: maxWeight,
            original_speaker: originalSpeaker,
            hearsay_type: hearsayType,
            indicators,
            verification_notes: maxWeight >= 0.8
                ? `Must verify (1) that ${originalSpeaker || 'the person'} actually said this, and (2) whether the claim is factually accurate`
                : null
        };
    }

    /**
     * Detect hedging language that indicates speculation rather than fact
     */
    detectHedging(sentence) {
        const hedgingMarkers = [];
        let score = 0;

        // Modal verbs indicating uncertainty
        const modalPatterns = [
            { pattern: /\b(could|might|may)\b/i, weight: 0.9, type: 'modal-uncertainty' },
            { pattern: /\b(would|should)\b/i, weight: 0.7, type: 'modal-conditional' },
            { pattern: /\b(can|will)\s+(?!be\s+\d|cost\s+\$)/i, weight: 0.3, type: 'modal-weak' }
        ];

        // Estimation/approximation language
        const estimationPatterns = [
            { pattern: /\b(could be as (?:many|much) as|up to|as (?:many|much) as)\b/i, weight: 0.95, type: 'upper-bound-estimate' },
            { pattern: /\b(approximately|roughly|around|about|nearly|almost)\b/i, weight: 0.7, type: 'approximation' },
            { pattern: /\b(more than|over|less than|under|at least)\b/i, weight: 0.4, type: 'comparative-estimate' }
        ];

        // Uncertainty markers
        const uncertaintyPatterns = [
            { pattern: /\b(appears to|seems to|likely|probably|possibly|potentially)\b/i, weight: 0.9, type: 'uncertainty' },
            { pattern: /\b(expected to|anticipated|projected|estimated)\b/i, weight: 0.6, type: 'projection' },
            { pattern: /\b(suggest|indicate|imply|tend to)\b/i, weight: 0.5, type: 'inference' }
        ];

        // Conditional markers
        const conditionalPatterns = [
            { pattern: /\b(if\s+.*\s+then|in case|assuming|provided that)\b/i, weight: 0.85, type: 'conditional' },
            { pattern: /\b(unless|without|depending on)\b/i, weight: 0.7, type: 'conditional-weak' }
        ];

        // Check all patterns
        const allPatterns = [
            ...modalPatterns,
            ...estimationPatterns,
            ...uncertaintyPatterns,
            ...conditionalPatterns
        ];

        for (const {pattern, weight, type} of allPatterns) {
            if (pattern.test(sentence)) {
                hedgingMarkers.push({
                    type,
                    match: sentence.match(pattern)[0],
                    weight
                });
                score = Math.max(score, weight);
            }
        }

        return {
            is_hedged: score > 0.4,
            confidence: score,
            markers: hedgingMarkers
        };
    }

    /**
     * Identify factual elements in a sentence
     */
    identifyFactualElements(sentence) {
        const elements = [];
        let score = 0;

        // Specific numbers (not vague quantities)
        if (/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/.test(sentence)) {
            elements.push('specific-number');
            score += 0.4;
        }

        // Currency amounts
        if (/\$\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|trillion))?/i.test(sentence)) {
            elements.push('currency-amount');
            score += 0.4;
        }

        // Percentages
        if (/\d+(?:\.\d+)?%/.test(sentence)) {
            elements.push('percentage');
            score += 0.4;
        }

        // Specific dates (more specific = more factual)
        if (/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i.test(sentence)) {
            elements.push('specific-date');
            score += 0.5;
        }

        // Past tense (factual assertions about what happened)
        if (/\b(?:voted|passed|signed|announced|released|introduced|opposed|supported|proposed|enacted|defeated)\b/i.test(sentence)) {
            elements.push('past-action');
            score += 0.3;
        }

        // Definite present tense claims
        if (/\b(?:is|are|has|have|costs|includes|contains|requires)\s+(?:\d|a\s+\$|the\s+\d)/i.test(sentence)) {
            elements.push('definite-present');
            score += 0.3;
        }

        // Named legislation/bills
        if (/\b(?:H\.R\.|S\.|Bill|Act|Resolution)\s+\d+/i.test(sentence)) {
            elements.push('legislation-reference');
            score += 0.4;
        }

        // Specific geographic locations
        if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+(?:[A-Z]{2}|D\.C\.)\b/.test(sentence)) {
            elements.push('specific-location');
            score += 0.2;
        }

        return {
            elements,
            score: Math.min(score, 1.0)
        };
    }

    /**
     * Classify the type of factual claim
     */
    classifyFactType(sentence, factualElements) {
        const types = [];

        if (factualElements.elements.includes('legislation-reference')) {
            types.push('legislative-fact');
        }

        if (factualElements.elements.includes('currency-amount') ||
            factualElements.elements.includes('specific-number')) {
            types.push('statistical-claim');
        }

        if (factualElements.elements.includes('past-action')) {
            types.push('historical-event');
        }

        if (factualElements.elements.includes('specific-date')) {
            types.push('dated-claim');
        }

        if (/\b(?:according to|reported by|study by|data from)\b/i.test(sentence)) {
            types.push('attributed-claim');
        }

        return types.length > 0 ? types : ['general-claim'];
    }

    /**
     * Extract numeric claims from a sentence
     */
    extractNumericClaims(sentence) {
        const claims = [];

        // Currency amounts
        const currencyMatches = sentence.matchAll(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(million|billion|trillion)?/gi);
        for (const match of currencyMatches) {
            claims.push({
                type: 'currency',
                value: match[1],
                magnitude: match[2] || 'dollars',
                text: match[0]
            });
        }

        // Percentages
        const percentMatches = sentence.matchAll(/(\d+(?:\.\d+)?)%/g);
        for (const match of percentMatches) {
            claims.push({
                type: 'percentage',
                value: match[1],
                text: match[0]
            });
        }

        // Population/count numbers
        const countMatches = sentence.matchAll(/(\d{1,3}(?:,\d{3})+)\s+(people|Americans|families|workers|jobs|students)/gi);
        for (const match of countMatches) {
            claims.push({
                type: 'population-count',
                value: match[1],
                unit: match[2],
                text: match[0]
            });
        }

        return claims;
    }

    /**
     * Extract attribution (who is the source of the claim)
     */
    extractAttribution(sentence) {
        const attributionPatterns = [
            /according to ([^,]+)/i,
            /(?:reported|found|showed|revealed)\s+by ([^,]+)/i,
            /([^,]+)\s+(?:said|stated|announced|reported|found)/i,
            /(?:study|report|analysis|data)\s+from ([^,]+)/i
        ];

        for (const pattern of attributionPatterns) {
            const match = sentence.match(pattern);
            if (match) {
                return {
                    has_attribution: true,
                    source: match[1].trim()
                };
            }
        }

        return {
            has_attribution: false,
            source: null
        };
    }

    /**
     * Calculate overall confidence that this is a factual claim
     */
    calculateFactConfidence(sentence, hedging, factualElements) {
        let confidence = factualElements.score;

        // Reduce confidence based on hedging
        if (hedging.is_hedged) {
            confidence *= (1 - hedging.confidence * 0.7);
        }

        // Boost confidence for attribution
        if (/\b(?:according to|reported by|study by|data from)\b/i.test(sentence)) {
            confidence *= 1.2;
        }

        // Cap at 1.0
        return Math.min(confidence, 1.0);
    }

    /**
     * ============================================================================
     * CLAIM VERIFICATION / GROUNDING
     * ============================================================================
     * Search for and validate factual claims against credible sources
     */

    /**
     * Load credible sources configuration
     */
    loadCredibleSources() {
        if (!this.credibleSources) {
            try {
                const fs = require('fs');
                const path = require('path');
                const sourcesPath = path.join(__dirname, '../../cpo_docs/tier1_sources.json');
                this.credibleSources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
            } catch (error) {
                console.error('Failed to load credible sources:', error.message);
                this.credibleSources = { categories: {}, allowed_domains: [] };
            }
        }
        return this.credibleSources;
    }

    /**
     * Score the credibility of a source domain
     */
    scoreSourceCredibility(url) {
        const sources = this.loadCredibleSources();
        const domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '');

        // Check each category
        const categoryScores = {
            'congressional_official': 1.0,
            'federal_agencies': 0.95,
            'fact_checking': 0.90,
            'research_institutions': 0.85,
            'national_news': 0.75,
            'broadcast_news': 0.70,
            'state_local': 0.80
        };

        for (const [category, domains] of Object.entries(sources.categories || {})) {
            if (domains.some(d => domain.includes(d))) {
                return {
                    score: categoryScores[category] || 0.6,
                    tier: category,
                    domain: domain,
                    is_credible: true
                };
            }
        }

        // Not in our credible list
        return {
            score: 0.3,
            tier: 'unknown',
            domain: domain,
            is_credible: false
        };
    }

    /**
     * Generate search queries from a factual claim
     */
    generateSearchQueries(claim) {
        const queries = [];
        const statement = claim.statement;
        const numericClaims = claim.numeric_claims || [];

        // Query 1: Direct statement search (focused on key content)
        let directQuery = statement
            .replace(/^.*?(?:said|stated|announced|released)\s+/i, '')
            .replace(/\b(?:the|a|an|this|that|these|those)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 120);

        queries.push({
            query: directQuery,
            type: 'direct',
            priority: 1
        });

        // Query 2: Attribution-focused (if source mentioned)
        if (claim.has_attribution && claim.attribution_source) {
            queries.push({
                query: `${claim.attribution_source} ${directQuery.substring(0, 80)}`,
                type: 'attributed',
                priority: 1
            });
        }

        // Query 3: Numeric-focused (if numbers present)
        if (numericClaims.length > 0) {
            const numericTerms = numericClaims.map(nc => nc.text).join(' ');
            const contextTerms = statement
                .replace(/\b\d+[%$,.]?\b/g, '')
                .split(/\s+/)
                .filter(w => w.length > 4)
                .slice(0, 8)
                .join(' ');

            queries.push({
                query: `${numericTerms} ${contextTerms}`,
                type: 'numeric-focused',
                priority: 2
            });
        }

        // Query 4: Legislative references
        const billMatch = statement.match(/\b((?:H\.R\.|S\.)\s*\d+|(?:Bill|Act)\s+\d+)/i);
        if (billMatch) {
            queries.push({
                query: `${billMatch[0]} congress.gov`,
                type: 'legislative',
                priority: 1
            });
        }

        return queries;
    }

    /**
     * Check if fetched content supports the claim
     * Returns: supported, contradicted, or insufficient
     */
    doesContentSupportClaim(claim, content) {
        const claimNumbers = claim.numeric_claims || [];
        const claimStatement = claim.statement.toLowerCase();
        const contentLower = content.toLowerCase();

        let matchScore = 0;
        const matchedExcerpts = [];
        const contradictions = [];

        // Check if numeric values appear in content
        for (const numClaim of claimNumbers) {
            const claimValue = parseFloat(numClaim.text.replace(/[,$%]/g, ''));

            // Escape special regex characters for exact match
            const numPattern = numClaim.text.replace(/[.$%,]/g, '\\$&');
            const exactRegex = new RegExp(numPattern, 'i');

            if (exactRegex.test(content)) {
                // Exact match found
                matchScore += 0.4;

                // Extract context around the number
                const contextRegex = new RegExp(`.{0,150}${numPattern}.{0,150}`, 'i');
                const match = content.match(contextRegex);
                if (match) {
                    matchedExcerpts.push(match[0].trim());
                }
            } else if (!isNaN(claimValue)) {
                // Look for similar numbers that might contradict
                // Extract all numbers from the same context
                const numberRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?(?:\s*(?:million|billion|trillion))?\b/gi;
                const contentNumbers = content.match(numberRegex) || [];

                for (const contentNum of contentNumbers) {
                    const contentValue = parseFloat(contentNum.replace(/[,$%]/g, ''));

                    // If numbers are in similar magnitude but different, might be contradiction
                    if (!isNaN(contentValue)) {
                        const ratio = Math.abs(claimValue / contentValue);
                        if (ratio > 0.3 && ratio < 3.0 && Math.abs(claimValue - contentValue) > 0.1) {
                            // Similar magnitude but different value - potential contradiction
                            contradictions.push({
                                type: 'numeric_mismatch',
                                claimed: numClaim.text,
                                found: contentNum,
                                context: content.substring(Math.max(0, content.indexOf(contentNum) - 100),
                                                          Math.min(content.length, content.indexOf(contentNum) + 100))
                            });
                        }
                    }
                }
            }
        }

        // Extract key terms from claim (excluding common words)
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'will', 'has', 'have', 'had']);
        const keyTerms = claimStatement
            .replace(/[^a-z0-9\s]/gi, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()))
            .slice(0, 12);

        const matchedTerms = keyTerms.filter(term => contentLower.includes(term));
        matchScore += (matchedTerms.length / Math.max(keyTerms.length, 1)) * 0.6;

        // Look for explicit contradiction patterns
        const contradictionPatterns = [
            /\b(not|never|no|false|incorrect|inaccurate|misleading|wrong)\b/i,
            /\b(actually|in fact|contrary to|despite claims|however)\b/i
        ];

        let hasContradictionLanguage = false;
        for (const pattern of contradictionPatterns) {
            if (pattern.test(content)) {
                hasContradictionLanguage = true;
                break;
            }
        }

        // Determine verification status
        let status = 'insufficient';
        if (contradictions.length > 0 || (hasContradictionLanguage && matchScore > 0.3)) {
            status = 'contradicted';
        } else if (matchScore > 0.4) {
            status = 'supported';
        }

        return {
            status: status,
            supported: status === 'supported',
            contradicted: status === 'contradicted',
            confidence: Math.min(matchScore, 1.0),
            excerpt: matchedExcerpts.length > 0
                ? matchedExcerpts.slice(0, 2).join(' ... ')
                : content.substring(0, 250) + '...',
            matched_terms: matchedTerms,
            term_match_ratio: matchedTerms.length / Math.max(keyTerms.length, 1),
            contradictions: contradictions,
            has_contradiction_language: hasContradictionLanguage
        };
    }

    /**
     * Map attribution source names to known domains
     * Helps guide web search to authoritative sources
     */
    mapAttributionToDomain(attributionSource) {
        if (!attributionSource) return null;

        const sourceLower = attributionSource.toLowerCase();

        // Common source mappings
        const domainMap = {
            'cbo': 'cbo.gov',
            'congressional budget office': 'cbo.gov',
            'congress.gov': 'congress.gov',
            'fec': 'fec.gov',
            'federal election commission': 'fec.gov',
            'census bureau': 'census.gov',
            'u.s. census': 'census.gov',
            'gao': 'gao.gov',
            'government accountability office': 'gao.gov',
            'politico': 'politico.com',
            'the new york times': 'nytimes.com',
            'new york times': 'nytimes.com',
            'washington post': 'washingtonpost.com',
            'the washington post': 'washingtonpost.com',
            'pew research': 'pewresearch.org',
            'gallup': 'gallup.com',
            'factcheck.org': 'factcheck.org',
            'politifact': 'politifact.com',
            'snopes': 'snopes.com',
            'ap': 'apnews.com',
            'associated press': 'apnews.com',
            'reuters': 'reuters.com',
            'npr': 'npr.org',
            'bls': 'bls.gov',
            'bureau of labor statistics': 'bls.gov',
            'irs': 'irs.gov',
            'brookings': 'brookings.edu',
            'heritage foundation': 'heritage.org',
            'urban institute': 'urban.org'
        };

        for (const [key, domain] of Object.entries(domainMap)) {
            if (sourceLower.includes(key)) {
                return domain;
            }
        }

        return null;
    }

    /**
     * Ground a claim by finding supporting evidence on the web
     *
     * @param {Object} claim - Claim object from extractProvableFacts()
     * @param {Object} options - Options for verification
     *   @param {Function} options.webSearch - Function(query) that returns search results with URLs
     *   @param {Function} options.webFetch - Function(url, prompt) that fetches and analyzes content
     *   @param {number} options.maxResults - Max number of URLs to check (default: 3)
     * @returns {Promise<Object>} Verification result
     */
    async groundClaim(claim, options = {}) {
        const { webSearch, webFetch, maxResults = 3 } = options;

        if (!webSearch || !webFetch) {
            throw new Error('groundClaim requires webSearch and webFetch functions in options');
        }

        try {
            // Generate search queries
            const queries = this.generateSearchQueries(claim);

            // Enhance queries with attribution domain if available
            let searchQuery = queries[0].query;
            if (claim.has_attribution && claim.attribution_source) {
                const domain = this.mapAttributionToDomain(claim.attribution_source);
                if (domain) {
                    // Prioritize attributed query with site restriction
                    searchQuery = `site:${domain} ${queries[0].query}`;
                } else {
                    // Use attribution in query without site restriction
                    searchQuery = `${claim.attribution_source} ${queries[0].query}`;
                }
            }

            // Perform web search
            const searchResults = await webSearch(searchQuery);

            if (!searchResults || !searchResults.length) {
                return {
                    verified: false,
                    confidence: 0,
                    reason: 'no_results',
                    message: 'No search results found',
                    query: searchQuery
                };
            }

            // Check top results
            const verificationAttempts = [];
            for (let i = 0; i < Math.min(searchResults.length, maxResults); i++) {
                const result = searchResults[i];

                try {
                    // Fetch and analyze content
                    const fetchPrompt = `Does this content support the following claim: "${claim.statement}"? ` +
                                      `Look for specific numbers, dates, and facts. Return "YES" or "NO" and explain why.`;

                    const content = await webFetch(result.url, fetchPrompt);

                    // Score source credibility
                    const credibility = this.scoreSourceCredibility(result.url);

                    // Validate content supports claim
                    const validation = this.doesContentSupportClaim(claim, content);

                    const attempt = {
                        url: result.url,
                        domain: credibility.domain,
                        credibility_score: credibility.score,
                        credibility_tier: credibility.tier,
                        status: validation.status,
                        content_match: validation.supported,
                        contradicted: validation.contradicted,
                        match_confidence: validation.confidence,
                        excerpt: validation.excerpt,
                        matched_terms: validation.matched_terms,
                        contradictions: validation.contradictions
                    };

                    verificationAttempts.push(attempt);

                    // If claim is CONTRADICTED by a credible source, flag as likely false
                    if (validation.contradicted && credibility.score >= 0.7) {
                        return {
                            verified: false,
                            contradicted: true,
                            confidence: credibility.score,
                            reason: 'contradicted',
                            message: 'Claim contradicted by credible source',
                            source_url: result.url,
                            source_domain: credibility.domain,
                            source_credibility: credibility.score,
                            source_tier: credibility.tier,
                            content_confidence: validation.confidence,
                            excerpt: validation.excerpt,
                            contradictions: validation.contradictions,
                            has_contradiction_language: validation.has_contradiction_language,
                            flagged_at: new Date().toISOString(),
                            query: searchQuery,
                            all_attempts: verificationAttempts
                        };
                    }

                    // If we found strong support from a credible source, we can return
                    if (validation.supported && credibility.score >= 0.7 && validation.confidence >= 0.6) {
                        return {
                            verified: true,
                            contradicted: false,
                            confidence: Math.min(credibility.score, validation.confidence),
                            source_url: result.url,
                            source_domain: credibility.domain,
                            source_credibility: credibility.score,
                            source_tier: credibility.tier,
                            content_confidence: validation.confidence,
                            excerpt: validation.excerpt,
                            matched_terms: validation.matched_terms,
                            verified_at: new Date().toISOString(),
                            query: searchQuery,
                            all_attempts: verificationAttempts
                        };
                    }
                } catch (err) {
                    verificationAttempts.push({
                        url: result.url,
                        error: err.message
                    });
                }
            }

            // No strong verification found, check for contradictions
            const contradictedAttempt = verificationAttempts
                .filter(a => !a.error && a.contradicted)
                .sort((a, b) => b.credibility_score - a.credibility_score)[0];

            if (contradictedAttempt) {
                return {
                    verified: false,
                    contradicted: true,
                    confidence: contradictedAttempt.credibility_score,
                    reason: 'contradicted',
                    message: 'Claim appears to be contradicted by available sources',
                    source_url: contradictedAttempt.url,
                    source_domain: contradictedAttempt.domain,
                    source_credibility: contradictedAttempt.credibility_score,
                    excerpt: contradictedAttempt.excerpt,
                    contradictions: contradictedAttempt.contradictions,
                    query: searchQuery,
                    all_attempts: verificationAttempts
                };
            }

            // Look for best supportive attempt (even if weak)
            const bestAttempt = verificationAttempts
                .filter(a => !a.error && a.content_match)
                .sort((a, b) => (b.credibility_score * b.match_confidence) - (a.credibility_score * a.match_confidence))[0];

            if (bestAttempt) {
                return {
                    verified: false,
                    contradicted: false,
                    confidence: bestAttempt.credibility_score * bestAttempt.match_confidence,
                    reason: 'weak_support',
                    message: 'Found some support but not strong enough for verification',
                    source_url: bestAttempt.url,
                    source_domain: bestAttempt.domain,
                    source_credibility: bestAttempt.credibility_score,
                    excerpt: bestAttempt.excerpt,
                    query: searchQuery,
                    all_attempts: verificationAttempts
                };
            }

            return {
                verified: false,
                contradicted: false,
                confidence: 0,
                reason: 'insufficient_data',
                message: 'No supporting evidence found - insufficient data to verify or contradict',
                query: searchQuery,
                all_attempts: verificationAttempts
            };

        } catch (error) {
            return {
                verified: false,
                confidence: 0,
                reason: 'error',
                message: error.message,
                error: error.stack
            };
        }
    }

    /**
     * Extract non-factual statements that appear to be facts but cannot be verified
     * Categories: opinions/characterizations, predictions, motivations/intent, value judgments
     */
    extractNonFactualStatements(text) {
        const nonFactualStatements = [];
        const sentences = this.splitIntoSentences(text);

        // Load category patterns from database-seeded categories
        const categories = {
            opinion_characterization: {
                keywords: ['awful', 'terrible', 'great', 'excellent', 'failed', 'successful', 'dangerous', 'extreme', 'radical', 'bad', 'good', 'disastrous', 'harmful', 'beneficial', 'reckless', 'irresponsible', 'shameful', 'disgraceful'],
                patterns: [
                    /\b(awful|terrible|disastrous|failed|dangerous|extreme|radical|reckless|harmful|shameful|disgraceful)\s+(Republican|Democrat|GOP|policy|bill|plan|approach|decision|rhetoric|agenda)\b/i,
                    /\b(great|excellent|successful|beneficial|responsible)\s+(Democratic|Republican|policy|bill|plan|approach|decision)\b/i
                ],
                explanation: (match, keyword) => `This is a subjective ${keyword} that requires judgment and cannot be objectively verified. Different people have different definitions based on their values and perspectives.`
            },
            prediction_future: {
                keywords: ['will', 'may', 'threatens to', 'could', 'is going to', 'are at risk of', 'will lead to', 'may cause', 'will result in', 'going to'],
                patterns: [
                    /\bwill\s+(cost|harm|hurt|damage|destroy|cause|lead|result)/i,
                    /\b(threatens? to|may|could|might)\s+/i,
                    /\b(are|is)\s+(?:at\s+risk|going\s+to|likely\s+to)/i
                ],
                explanation: (match, futureIndicator) => `This is a prediction about the future using "${futureIndicator}". Events that have not occurred cannot be verified. What CAN be verified is if authoritative sources (like CBO, expert analyses) have made such predictions.`
            },
            motivation_intent: {
                keywords: ['wants to', 'intends to', 'refuses to', 'cares about', 'doesn\'t care', 'trying to', 'attempting to', 'seeks to', 'determined to', 'committed to'],
                patterns: [
                    /\b(want|wants|intend|intends|refuse|refuses|seek|seeks|try|tries|attempt|attempts)\s+to\b/i,
                    /\b(care|cares|don't\s+care|doesn't\s+care)\s+about\b/i,
                    /\b(determined|committed|dedicated)\s+to\b/i
                ],
                explanation: (match, intentVerb) => `This claims to know someone's internal mental state ("${intentVerb}"). We cannot verify what someone wants, intends, or cares about - only their actions and statements can be verified.`
            },
            value_judgment: {
                keywords: ['should', 'must', 'ought to', 'need to', 'wrong', 'right', 'unconscionable', 'shameful', 'disgraceful', 'immoral', 'unethical'],
                patterns: [
                    /\b(should|must|ought\s+to|need\s+to)\b/i,
                    /\b(is|are|was|were)\s+(wrong|right|unconscionable|shameful|disgraceful|immoral|unethical)\b/i
                ],
                explanation: (match, normativeTerm) => `This is a normative/moral claim using "${normativeTerm}". Statements about what ought to be or moral judgments cannot be empirically verified - they depend on value systems and ethical frameworks.`
            }
        };

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();

            // Skip very short sentences
            if (sentence.length < 20) continue;

            // Check each category
            for (const [categoryName, category] of Object.entries(categories)) {
                let matched = false;
                let matchedKeyword = null;
                let matchedPattern = null;

                // Check keywords
                for (const keyword of category.keywords) {
                    const regex = new RegExp(`\\b${keyword.replace(/'/g, "\\'")}\\b`, 'i');
                    if (regex.test(sentence)) {
                        matched = true;
                        matchedKeyword = keyword;
                        break;
                    }
                }

                // Check patterns for stronger matches
                if (!matched) {
                    for (const pattern of category.patterns) {
                        const match = sentence.match(pattern);
                        if (match) {
                            matched = true;
                            matchedPattern = match[0];
                            matchedKeyword = match[1] || matchedPattern;
                            break;
                        }
                    }
                }

                if (matched) {
                    // Calculate confidence that this appears factual
                    // (higher score = looks more like a fact at first glance)
                    const appearsFactualConfidence = this.calculateAppearsFactualConfidence(sentence);

                    nonFactualStatements.push({
                        statement: sentence,
                        sentenceIndex: i,
                        reasonCategory: categoryName,
                        detailedExplanation: category.explanation(matchedPattern || sentence, matchedKeyword),
                        matchedKeyword: matchedKeyword,
                        matchedPattern: matchedPattern,
                        appearsFactualConfidence: appearsFactualConfidence,
                        examples: [sentence.substring(0, 100)]
                    });

                    break; // Only categorize into first matching category
                }
            }
        }

        return nonFactualStatements;
    }

    /**
     * Calculate how much a non-factual statement appears to be factual
     * Higher score = looks more like a fact (thus more important to flag)
     */
    calculateAppearsFactualConfidence(sentence) {
        let score = 0.5; // baseline

        // Increase if it contains numbers (looks factual)
        if (/\d+/.test(sentence)) score += 0.2;

        // Increase if it contains proper nouns (looks specific)
        if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(sentence)) score += 0.1;

        // Increase if it contains dates (looks factual)
        if (/\b\d{4}\b|January|February|March|April|May|June|July|August|September|October|November|December/.test(sentence)) score += 0.1;

        // Decrease if it's clearly an opinion word at the start
        if (/^(I think|In my opinion|We believe|It seems|Clearly,|Obviously,)/i.test(sentence)) score -= 0.3;

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Detect comparative/computational claims
     * These require looking up multiple data points and comparing them
     *
     * Examples:
     * - "our deficit is greater than the GDP of the UK"
     * - "unemployment is lower than it was in 2019"
     * - "we've raised more money than any other candidate"
     * - "inflation is higher than the EU average"
     */
    detectComparativeClaim(sentence) {
        // Comparison operators (expanded to include temporal and trend patterns)
        const comparisonPatterns = [
            { pattern: /\b(greater|larger|bigger|higher|more) than\b/i, type: 'greater_than' },
            { pattern: /\b(less|smaller|lower|fewer) than\b/i, type: 'less_than' },
            { pattern: /\b(equal to|same as|as (much|many|high|low) as)\b/i, type: 'equal_to' },
            { pattern: /\b(exceeds?|surpasses?|outpaces?)\b/i, type: 'exceeds' },
            { pattern: /\b(trails?|lags? behind|falls? short of)\b/i, type: 'trails' },
            { pattern: /\b(doubled|tripled|quadrupled)\b/i, type: 'multiple_of' },
            { pattern: /\b(half of|twice|three times|[\d.]+ times)\b/i, type: 'ratio' },

            // Temporal patterns - comparing to past values
            { pattern: /\b(higher|lower|greater|less|more|fewer) than (it was|in) (last year|\d{4}|[\d]+ years? ago|a (year|decade) ago)\b/i, type: 'temporal_comparison' },
            { pattern: /\b(double|triple|quadruple|half|twice|three times) what (it was|we had|they had) (last year|a year ago|(two|three|four|five|[\d]+) years? ago|\d{4})\b/i, type: 'temporal_ratio' },
            { pattern: /\b(up|down|increased|decreased) (from|since) (last year|\d{4}|[\d]+ years? ago)\b/i, type: 'temporal_change' },

            // Trend patterns - ongoing changes
            { pattern: /\b(keeps?|continues?|keeps? on|continuing) (getting|growing|rising|increasing|declining|decreasing|falling)\b/i, type: 'ongoing_trend' },
            { pattern: /\b(rising|increasing|growing|declining|decreasing|falling) (every|each) (year|month|quarter|day)\b/i, type: 'periodic_trend' },
            { pattern: /\b(consistent|steady|continuous) (rise|increase|decline|decrease|growth)\b/i, type: 'sustained_trend' },
            { pattern: /\b(has (risen|increased|grown|declined|decreased|fallen)) (for|over) ([\d]+) (consecutive )?(years?|months?|quarters?)\b/i, type: 'multi_period_trend' }
        ];

        // Economic/political metrics that can be looked up (expanded)
        const metrics = [
            'GDP', 'deficit', 'debt', 'unemployment', 'inflation', 'growth',
            'revenue', 'spending', 'budget', 'income', 'wages', 'poverty',
            'enrollment', 'graduation', 'mortality', 'crime', 'temperature',
            'emissions', 'approval', 'poll', 'votes', 'donations', 'fundraising',
            'price', 'cost', 'rate', 'percentage', 'population', 'jobs', 'employment',
            'sales', 'production', 'output', 'exports', 'imports', 'trade'
        ];

        // Check for comparison pattern
        let comparisonMatch = null;
        let comparisonType = null;

        for (const { pattern, type } of comparisonPatterns) {
            const match = sentence.match(pattern);
            if (match) {
                comparisonMatch = match[0];
                comparisonType = type;
                break;
            }
        }

        if (!comparisonMatch) {
            return { is_comparative: false };
        }

        // Check if sentence contains metrics
        const sentenceLower = sentence.toLowerCase();
        const foundMetrics = metrics.filter(metric =>
            sentenceLower.includes(metric.toLowerCase())
        );

        // Also check for numeric values which suggest quantifiable metrics
        const hasNumbers = /\d+/.test(sentence);

        // If we have a comparison and either metrics or numbers, it's likely comparative
        if (foundMetrics.length > 0 || hasNumbers) {
            // Extract the two things being compared
            const parts = sentence.split(new RegExp(comparisonMatch, 'i'));
            const leftSide = parts[0]?.trim() || '';
            const rightSide = parts[1]?.trim() || '';

            // Extract time references if it's a temporal comparison
            const timeMatch = sentence.match(/\b(last year|\d{4}|[\d]+ years? ago|a (year|decade) ago|every (year|month)|for [\d]+ years?)\b/i);
            const timeReference = timeMatch ? timeMatch[0] : null;

            // Build verification steps based on comparison type
            let verificationSteps = [];

            if (comparisonType.includes('temporal') || comparisonType.includes('trend')) {
                // Temporal or trend comparison - need historical data
                verificationSteps = [
                    {
                        step: 1,
                        action: 'identify_metric_and_timeframe',
                        description: 'Identify the metric and time period(s) to compare',
                        metric: foundMetrics[0] || 'value from sentence',
                        time_reference: timeReference,
                        current_vs_past: comparisonType.includes('temporal')
                    },
                    {
                        step: 2,
                        action: 'lookup_current_value',
                        description: 'Look up the current/recent value of the metric',
                        sources_needed: ['official statistics', 'government data', 'recent reports']
                    },
                    {
                        step: 3,
                        action: 'lookup_historical_value',
                        description: `Look up the value at the referenced time point (${timeReference || 'past'})`,
                        sources_needed: ['historical data', 'archived statistics', 'time series data']
                    },
                    {
                        step: 4,
                        action: 'compare_or_calculate_trend',
                        description: comparisonType.includes('trend')
                            ? 'Calculate trend across time periods and verify direction/magnitude'
                            : `Verify that the relationship "${comparisonType}" holds between current and past values`,
                        comparison_operator: comparisonType
                    }
                ];
            } else {
                // Standard comparison - two contemporary values
                verificationSteps = [
                    {
                        step: 1,
                        action: 'identify_metrics',
                        description: 'Identify the two metrics being compared',
                        left_metric: leftSide.substring(Math.max(0, leftSide.length - 50)),
                        right_metric: rightSide.substring(0, 50)
                    },
                    {
                        step: 2,
                        action: 'lookup_left',
                        description: 'Look up the value of the first metric',
                        sources_needed: ['official statistics', 'government data', 'financial reports']
                    },
                    {
                        step: 3,
                        action: 'lookup_right',
                        description: 'Look up the value of the second metric',
                        sources_needed: ['official statistics', 'government data', 'financial reports']
                    },
                    {
                        step: 4,
                        action: 'compare',
                        description: `Verify that the relationship "${comparisonType}" holds between the two values`,
                        comparison_operator: comparisonType
                    }
                ];
            }

            return {
                is_comparative: true,
                comparison_type: comparisonType,
                comparison_phrase: comparisonMatch,
                metrics: foundMetrics,
                has_numbers: hasNumbers,
                time_reference: timeReference,
                is_temporal: comparisonType.includes('temporal'),
                is_trend: comparisonType.includes('trend'),
                left_side: leftSide.substring(Math.max(0, leftSide.length - 100)),
                right_side: rightSide.substring(0, 100),
                verification_steps: verificationSteps,
                complexity: 'multi-step',
                requires_calculation: foundMetrics.length > 1 || hasNumbers || comparisonType.includes('trend')
            };
        }

        return { is_comparative: false };
    }

    /**
     * Automatically verify a comparative claim using WebSearch
     * This performs the verification steps and returns a verdict
     *
     * NOTE: This is a placeholder for future WebSearch integration
     * In production, this would use the WebSearch tool to look up actual data
     *
     * @param {Object} claim - Claim object from detectComparativeClaim()
     * @param {Function} webSearchFn - Function to perform web searches (optional)
     * @returns {Object} Verification result with verdict and supporting data
     */
    async verifyComparativeClaim(claim, webSearchFn = null) {
        if (!claim.is_comparative) {
            return {
                verified: false,
                error: 'Not a comparative claim'
            };
        }

        const result = {
            claim_text: claim.original_sentence || 'Unknown',
            comparison_type: claim.comparison_type,
            verification_date: new Date().toISOString(),
            steps_completed: [],
            verdict: null,
            confidence: 0,
            supporting_data: {},
            sources: [],
            notes: []
        };

        try {
            // Step 1: Identify what needs to be looked up
            const step1 = claim.verification_steps[0];
            result.steps_completed.push(step1);

            if (claim.is_temporal || claim.is_trend) {
                // Temporal/trend comparison
                const metric = claim.metrics[0];
                const timeRef = claim.time_reference;

                result.notes.push(`Identified metric: ${metric}, time reference: ${timeRef}`);

                // Step 2 & 3: Look up current and historical values
                // In production, would use WebSearch here
                if (webSearchFn) {
                    // Example: await webSearchFn(`current ${metric} value 2025`)
                    // Example: await webSearchFn(`${metric} value ${timeRef}`)
                    result.notes.push('Would use WebSearch to look up current and historical values');
                } else {
                    result.notes.push('WebSearch function not provided - cannot complete automated verification');
                    result.notes.push('Manual verification required using the generated steps');
                }

                result.supporting_data = {
                    current_value: 'Requires WebSearch',
                    historical_value: 'Requires WebSearch',
                    difference: 'Requires calculation after lookup'
                };

            } else {
                // Standard comparison
                const leftMetric = step1.left_metric;
                const rightMetric = step1.right_metric;

                result.notes.push(`Identified left metric: ${leftMetric}`);
                result.notes.push(`Identified right metric: ${rightMetric}`);

                // Step 2 & 3: Look up both values
                if (webSearchFn) {
                    result.notes.push('Would use WebSearch to look up both metric values');
                } else {
                    result.notes.push('WebSearch function not provided - cannot complete automated verification');
                    result.notes.push('Manual verification required using the generated steps');
                }

                result.supporting_data = {
                    left_value: 'Requires WebSearch',
                    right_value: 'Requires WebSearch',
                    comparison_result: 'Requires calculation after lookup'
                };
            }

            // Step 4: Comparison/verdict (would be automated if we had the data)
            result.verdict = 'MANUAL_VERIFICATION_REQUIRED';
            result.confidence = 0;
            result.notes.push('Automated verification requires WebSearch integration');
            result.notes.push('Follow the verification_steps to complete manually');

            return result;

        } catch (error) {
            return {
                verified: false,
                error: error.message,
                claim_text: claim.original_sentence,
                notes: ['Error during verification process']
            };
        }
    }

    /**
     * Generate a search query for looking up a specific metric value
     * Helper function for automated verification
     *
     * @param {string} metric - The metric to look up (e.g., "US deficit")
     * @param {string} timeRef - Optional time reference (e.g., "2019", "last year")
     * @returns {string} Search query optimized for finding official data
     */
    generateSearchQuery(metric, timeRef = null) {
        const currentYear = new Date().getFullYear();

        // Build search query with authoritative source hints
        let query = metric;

        // Add time reference if provided
        if (timeRef) {
            // Convert relative time to absolute
            if (timeRef === 'last year') {
                query += ` ${currentYear - 1}`;
            } else if (timeRef.match(/(\d+) years? ago/)) {
                const yearsAgo = parseInt(timeRef.match(/(\d+)/)[0]);
                query += ` ${currentYear - yearsAgo}`;
            } else if (timeRef.match(/\d{4}/)) {
                query += ` ${timeRef}`;
            }
        } else {
            // Current data
            query += ` ${currentYear}`;
        }

        // Add source hints to get authoritative data
        const metricLower = metric.toLowerCase();

        if (metricLower.includes('gdp')) {
            query += ' site:bea.gov OR site:worldbank.org';
        } else if (metricLower.includes('deficit') || metricLower.includes('debt')) {
            query += ' site:treasury.gov OR site:cbo.gov';
        } else if (metricLower.includes('unemployment')) {
            query += ' site:bls.gov';
        } else if (metricLower.includes('inflation')) {
            query += ' site:bls.gov OR site:federalreserve.gov';
        } else {
            query += ' official statistics';
        }

        return query;
    }
}

module.exports = PressReleaseParser;