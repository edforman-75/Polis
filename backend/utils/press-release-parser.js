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
     */
    parse(pressReleaseText) {
        const text = pressReleaseText.trim();

        // Extract content structure first to get subhead
        const content_structure = this.extractContentStructure(text);

        return {
            release_info: this.extractReleaseInfo(text),
            content_structure: content_structure,
            quotes: this.extractQuotes(text, content_structure.headline, content_structure.subhead),
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

        return {
            releaseType,
            embargoDate,
            embargoTime,
            timing_classification: releaseType === 'FOR EMBARGOED RELEASE' ? 'Embargoed Release' : 'Immediate Release'
        };
    }

    /**
     * Extract content structure (headline, dateline, paragraphs)
     */
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

        // Flexible dateline extraction with confidence scoring
        const dateline = this.extractDatelineFlexible(text);

        // Enhanced paragraph extraction with better segmentation
        const paragraphs = this.extractParagraphsEnhanced(text);

        return {
            headline: headline || '',
            subhead: this.findSubhead(contentLines, headline),
            dateline: dateline,
            lead_paragraph: paragraphs[0] || '',
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

        // STEP 1: Detect and extract multi-paragraph journalism-style quotes first
        // Format: "Para 1...\n\n"Para 2...\n\n"Para 3..." said Speaker
        const multiParaQuotes = this.extractMultiParagraphQuotes(text);

        // Track positions of multi-paragraph quotes to skip them in regular extraction
        const multiParaPositions = multiParaQuotes.map(q => ({
            start: q.position,
            end: q.position + q.fullText.length
        }));

        // STEP 2: Extract regular quotes (single paragraph or properly paired)
        const regularQuotes = this.extractRegularQuotes(text, multiParaPositions);

        // STEP 3: Combine and filter
        const allQuotes = [...multiParaQuotes, ...regularQuotes];

        // Filter out quotes from headline/subhead
        const filteredQuotes = allQuotes.filter(quote => {
            const quoteText = quote.quote_text;
            if ((headline && headline.includes(quoteText)) || (subhead && subhead.includes(quoteText))) {
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
                // Handle "Name verb" pattern (e.g., "Porter continued")
                const name = reversedMatch[1].trim();
                const verb = reversedMatch[2].trim();
                attribution = `${name} ${verb}`;
                speaker_name = name;
                speaker_title = this.extractSpeakerTitle(name, text);
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

            rawQuotes.push({
                quote_text: quoteText,
                speaker_name: speaker_name,
                speaker_title: speaker_title,
                full_attribution: attribution || 'Unknown Speaker',
                position: quoteStartPos,
                isMultiPart: isMultiPartQuote,
                isEnd: isEndOfQuote
            });

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

                    // Only combine if same speaker OR next quote has no attribution (true continuation)
                    const sameSpeaker = nextQuote.speaker_name === currentQuote.speaker_name ||
                                       nextQuote.speaker_name === '' ||
                                       nextQuote.full_attribution === 'Unknown Speaker';

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

        return {
            media_contact: mediaContact,
            paid_for: paidForMatch ? paidForMatch[1].trim() : ''
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
        const datelinePatterns = [
            // Standard dash patterns with various separators (—, –, -)
            // All caps: CITY, ST - Date
            /([A-Z][A-Z\s,]+)\s*[–—-]\s*([A-Z][a-z]+\s+\d+,?\s+\d{4})/,
            /([A-Z][A-Z\s,]+)\s*[–—-]\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})/,
            /([A-Z][A-Z\s,]+)\s*[–—-]\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
            // Mixed case: City, ST - Date
            /([A-Z][a-zA-Z\s,\.]+)\s*[–—-]\s*([A-Z][a-z]+\s+\d+,?\s+\d{4})/,
            /([A-Z][a-zA-Z\s,\.]+)\s*[–—-]\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})/,
            /([A-Z][a-zA-Z\s,\.]+)\s*[–—-]\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
            // Parenthesis patterns like "City, ST (Date)"
            /([A-Z][a-zA-Z\s,\.]+)\s*\(\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})\s*\)/,
            /([A-Z][a-zA-Z\s,\.]+)\s*\(\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\)/
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
        const patterns = [
            // Patterns with dashes
            /([A-Z][A-Z\s,]+)(?:\s*[–—-]\s*)([A-Z][a-z]+\s+\d+,?\s+\d{4})/g,
            /([A-Z][A-Z\s,]+)(?:\s*[–—-]\s*)((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})/g,
            /([A-Z][A-Z\s,]+)(?:\s*[–—-]\s*)(\d{1,2}\/\d{1,2}\/\d{4})/g,
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
        const dateMatch = text.match(/\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/);

        if (locationMatch && dateMatch) {
            return {
                location: locationMatch[1].trim(),
                date: dateMatch[1].trim(),
                full: `${locationMatch[1].trim()} — ${dateMatch[1].trim()}`
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

        // Remove only the headline from content, keep dateline as part of lead paragraph
        const headline = this.findHeadlineEnhanced(content);
        const dateline = this.extractDatelineEnhanced(content);

        // Remove headline but keep everything after it (including dateline)
        // However, for short releases where headline IS the entire content, preserve it (Improvement #004)
        const originalContent = content;
        if (headline) {
            const headlineIndex = content.indexOf(headline);
            if (headlineIndex >= 0) {
                content = content.substring(headlineIndex + headline.length).trim();
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
}

module.exports = PressReleaseParser;