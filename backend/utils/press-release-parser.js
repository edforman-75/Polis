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

            // Content patterns
            headline: /^[^\n]*?(?=\n)/m, // First non-empty line
            dateline: /^([A-Z][a-z\s,]+)\s*[–-]\s*(.+?)(?:\n|$)/m,

            // Quotes patterns
            quotes: /"([^"]+)"\s*(?:said|according\s+to|stated)\s+([^.]+)/gim,

            // Structure markers
            paragraph_breaks: /\n\s*\n/g,
            end_marker: /(?:###|---|-30-|END)/im
        };
    }

    /**
     * Parse a complete press release and extract all components
     */
    parse(pressReleaseText) {
        const text = pressReleaseText.trim();

        return {
            release_info: this.extractReleaseInfo(text),
            content_structure: this.extractContentStructure(text),
            quotes: this.extractQuotes(text),
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

        // Enhanced dateline extraction that searches within content
        const dateline = this.extractDatelineEnhanced(text);

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
     * Extract all quotes and their attribution
     */
    extractQuotes(text) {
        const quotes = [];
        let match;

        while ((match = this.releasePatterns.quotes.exec(text)) !== null) {
            quotes.push({
                text: match[1].trim(),
                attribution: match[2].trim(),
                full_context: match[0]
            });
        }

        return quotes;
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
            line.trim().length < 10
        );
    }

    findHeadline(lines) {
        for (const line of lines) {
            if (line.trim().length > 20 && !line.includes(':') && !line.includes('@')) {
                return line.trim();
            }
        }
        return '';
    }

    findSubhead(lines, headline) {
        const headlineIndex = lines.findIndex(line => line.includes(headline));
        if (headlineIndex >= 0 && headlineIndex < lines.length - 1) {
            const nextLine = lines[headlineIndex + 1];
            if (nextLine.length > 15 && nextLine.length < headline.length * 1.5) {
                return nextLine.trim();
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

        // Look for common dateline patterns using indexOf to avoid regex issues
        const datelinePatterns = [
            'OAKLAND, CA —',
            'CHICAGO, IL —',
            'NEW YORK, NY —',
            'WASHINGTON, DC —',
            'LOS ANGELES, CA —',
            'SACRAMENTO, CA —',
            'ALBANY, NY —'
        ];

        // Find any dateline
        let datelineIndex = -1;
        for (const pattern of datelinePatterns) {
            datelineIndex = rawText.indexOf(pattern);
            if (datelineIndex > 0) {
                const beforeDateline = rawText.substring(0, datelineIndex).trim();

                // For press releases with formal structure (FOR IMMEDIATE RELEASE, date, headline)
                // Extract just the headline portion
                const beforeLines = beforeDateline.split('\n');

                // Skip "FOR IMMEDIATE RELEASE" and date lines, get the main headline
                let headlineText = '';
                for (let i = 0; i < beforeLines.length; i++) {
                    const line = beforeLines[i].trim();

                    // Skip empty lines, release type, and date lines
                    if (!line ||
                        line.includes('FOR IMMEDIATE RELEASE') ||
                        line.includes('FOR RELEASE') ||
                        /^\w+\s+\d+,?\s+\d{4}$/.test(line) || // Date pattern
                        line.startsWith('"') && line.endsWith('"')) { // Quoted subheads
                        continue;
                    }

                    // This should be the main headline
                    if (line.length > 10) {
                        headlineText = line;
                        break;
                    }
                }

                return headlineText || beforeDateline;
            }
        }

        // Fallback: look for generic dateline pattern with simple string operations
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes(' — ') && line.match(/[A-Z]{2,}/)) {
                // Found potential dateline, get everything before it
                const beforeLines = lines.slice(0, i);

                // Extract headline from before lines
                for (let j = beforeLines.length - 1; j >= 0; j--) {
                    const potentialHeadline = beforeLines[j].trim();
                    if (potentialHeadline.length > 10 &&
                        !potentialHeadline.includes('FOR IMMEDIATE RELEASE') &&
                        !potentialHeadline.includes('FOR RELEASE') &&
                        !/^\w+\s+\d+,?\s+\d{4}$/.test(potentialHeadline) &&
                        !(potentialHeadline.startsWith('"') && potentialHeadline.endsWith('"'))) {
                        return potentialHeadline;
                    }
                }
            }
        }

        // Ultimate fallback: first meaningful line
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 10 &&
                !trimmed.includes('FOR IMMEDIATE RELEASE') &&
                !trimmed.includes('FOR RELEASE') &&
                !/^\w+\s+\d+,?\s+\d{4}$/.test(trimmed)) {
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
                return {
                    location: match[1].trim(),
                    date: match[2].trim(),
                    full: `${match[1].trim()} — ${match[2].trim()}`
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
     * Enhanced paragraph extraction with better segmentation for unformatted content
     */
    extractParagraphsEnhanced(text) {
        // Clean text and remove headers using safe replacement method
        let content = this.safeRemovePatterns(text, [
            this.releasePatterns.release_type,
            this.releasePatterns.contact_info,
            this.releasePatterns.paid_for
        ]);

        // Remove the headline and dateline from content more carefully
        const headline = this.findHeadlineEnhanced(content);
        const dateline = this.extractDatelineEnhanced(content);

        // More precise removal to avoid breaking content flow
        if (headline && dateline.full) {
            // Find the position after both headline and dateline
            const headlineIndex = content.indexOf(headline);
            const datelineIndex = content.indexOf(dateline.full);

            if (headlineIndex >= 0 && datelineIndex >= 0) {
                const afterDateline = datelineIndex + dateline.full.length;
                content = content.substring(afterDateline).trim();
                // Clean up any leading dashes or separators
                content = content.replace(/^[—–-]\s*/, '').trim();
            }
        } else if (headline) {
            content = this.safeReplace(content, headline, '').trim();
        } else if (dateline.full) {
            content = this.safeReplace(content, dateline.full, '').trim();
            content = content.replace(/^[—–-]\s*/, '').trim();
        }

        // Try to split by existing paragraph breaks first
        let paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);

        // If no clear paragraph breaks, try to segment by sentence patterns
        if (paragraphs.length <= 1 && content.length > 200) {
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
        return paragraphs
            .map(p => p.replace(/\s+/g, ' ').trim())
            .filter(p => p.length > 20);
    }

    extractBoilerplate(text) {
        const paragraphs = this.extractParagraphs(text);
        // Boilerplate is usually the last substantial paragraph before contact info
        for (let i = paragraphs.length - 1; i >= 0; i--) {
            const paragraph = paragraphs[i];
            if (paragraph.length > 100 && !paragraph.includes('"')) {
                return paragraph;
            }
        }
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
}

module.exports = PressReleaseParser;