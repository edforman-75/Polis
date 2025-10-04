/**
 * Dynamic HTML Generator
 * Creates type-specific HTML layouts based on parsed press release structure
 */

class HtmlGenerator {
    /**
     * Generate HTML based on parsed press release data
     * @param {object} parsedData - Output from PressReleaseParser.parse()
     * @returns {string} HTML string
     */
    generateHtml(parsedData) {
        const releaseType = parsedData.verification_metadata?.verified_type || parsedData.release_type?.type || 'UNKNOWN';

        // Route to type-specific generator
        switch (releaseType) {
            case 'STATEMENT':
                return this.generateStatementHtml(parsedData);
            case 'NEWS_RELEASE':
                return this.generateNewsReleaseHtml(parsedData);
            case 'FACT_SHEET':
                return this.generateFactSheetHtml(parsedData);
            case 'MEDIA_ADVISORY':
                return this.generateMediaAdvisoryHtml(parsedData);
            case 'LETTER':
                return this.generateLetterHtml(parsedData);
            case 'TRANSCRIPT':
                return this.generateTranscriptHtml(parsedData);
            default:
                return this.generateDefaultHtml(parsedData);
        }
    }

    /**
     * Generate HTML for STATEMENT type
     */
    generateStatementHtml(data) {
        const { headline, attribution, statement, quotes, content_structure, type_specific_metadata } = data;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline?.text || content_structure?.headline || 'Statement')}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            max-width: 700px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.8;
            color: #333;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .type-badge {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 32px;
            line-height: 1.3;
            margin: 0 0 20px 0;
            color: #1a1a1a;
        }
        .attribution {
            font-style: italic;
            color: #666;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
        }
        .statement-quote {
            font-size: 20px;
            line-height: 1.6;
            padding: 30px;
            background: #f9fafb;
            border-left: 4px solid #2563eb;
            margin: 30px 0;
            font-style: italic;
        }
        .context {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
        }
        .metadata {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="type-badge">Statement</div>

        <h1>${this.escapeHtml(headline?.text || content_structure?.headline || 'Statement')}</h1>

        ${attribution ? `
        <div class="attribution">
            ${this.escapeHtml(attribution.text)}
            ${attribution.speaker ? `<br><strong>${this.escapeHtml(attribution.speaker)}</strong>` : ''}
        </div>
        ` : ''}

        ${statement && statement.text ? `
        <blockquote class="statement-quote">
            "${this.escapeHtml(statement.text)}"
        </blockquote>
        ` : ''}

        ${data.context && data.context.response_to ? `
        <div class="context">
            <strong>In response to:</strong> ${this.escapeHtml(data.context.response_to)}
        </div>
        ` : ''}

        ${type_specific_metadata && Object.keys(type_specific_metadata).length > 0 ? `
        <div class="metadata">
            ${type_specific_metadata.tone ? `<div><strong>Tone:</strong> ${this.escapeHtml(type_specific_metadata.tone)}</div>` : ''}
            ${type_specific_metadata.response_indicators ? `
            <div><strong>Type:</strong> Response statement</div>
            ` : ''}
        </div>
        ` : ''}

        ${data.contact_info?.primary_contact ? `
        <div class="metadata">
            <strong>Contact:</strong> ${this.escapeHtml(data.contact_info.primary_contact.name || '')}
            ${data.contact_info.primary_contact.email ? ` | ${this.escapeHtml(data.contact_info.primary_contact.email)}` : ''}
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Generate HTML for NEWS_RELEASE type
     */
    generateNewsReleaseHtml(data) {
        const { content_structure, quotes, content_flow, type_specific_metadata, verification_metadata } = data;
        const subtypes = verification_metadata?.verified_subtypes || [];

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content_structure?.headline || 'Press Release')}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.7;
            color: #333;
        }
        .container {
            background: white;
            padding: 50px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        .type-badge {
            background: #059669;
            color: white;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
            display: inline-block;
        }
        ${subtypes.includes('endorsement') ? `.subtype-badge {
            background: #8b5cf6;
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            margin-left: 8px;
            display: inline-block;
        }` : ''}
        h1 {
            font-size: 36px;
            line-height: 1.2;
            margin: 20px 0;
            font-weight: 700;
        }
        .dateline {
            text-transform: uppercase;
            font-weight: bold;
            font-size: 14px;
            margin: 20px 0;
            color: #555;
        }
        .lead {
            font-size: 18px;
            font-weight: 500;
            line-height: 1.6;
            margin: 30px 0;
        }
        .body-text {
            font-size: 16px;
            line-height: 1.8;
            margin: 20px 0;
        }
        .quote {
            margin: 30px 0;
            padding: 25px;
            background: #f8fafc;
            border-left: 4px solid #059669;
        }
        .quote-text {
            font-size: 18px;
            font-style: italic;
            margin-bottom: 10px;
        }
        .quote-attribution {
            font-size: 14px;
            color: #666;
            font-style: normal;
        }
        .endorsement-box {
            background: #f5f3ff;
            border: 2px solid #8b5cf6;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
        }
        .endorsement-title {
            font-size: 14px;
            font-weight: bold;
            color: #6d28d9;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .section-label {
            display: inline-block;
            background: #e5e7eb;
            color: #374151;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
        }
        .section-label.headline { background: #fef3c7; color: #92400e; }
        .section-label.dateline { background: #dbeafe; color: #1e40af; }
        .section-label.lead { background: #dcfce7; color: #166534; }
        .section-label.body { background: #e5e7eb; color: #374151; }
        .section-label.quote { background: #fce7f3; color: #9f1239; }
        .confidence-indicator {
            display: inline-block;
            font-size: 10px;
            margin-left: 8px;
            padding: 2px 6px;
            border-radius: 3px;
            background: #f3f4f6;
            color: #6b7280;
        }
        .confidence-high { background: #d1fae5; color: #065f46; }
        .confidence-medium { background: #fef3c7; color: #92400e; }
        .confidence-low { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="type-badge">News Release
            ${subtypes.includes('endorsement') ? '<span class="subtype-badge">Endorsement</span>' : ''}
            ${subtypes.includes('poll_results') ? '<span class="subtype-badge">Poll Results</span>' : ''}
        </div>

        ${content_structure?.dateline?.full ? `
        <div class="section-label dateline">Dateline</div>
        <div class="dateline">${this.escapeHtml(content_structure.dateline.full)}</div>
        ` : ''}

        <div class="section-label headline">Headline${this.confidenceBadge(content_structure?.headline_confidence)}</div>
        <h1>${this.escapeHtml(content_structure?.headline || 'Press Release')}</h1>

        ${content_structure?.subhead ? `
        <div class="section-label lead">Subheadline</div>
        <div class="lead">${this.escapeHtml(content_structure.subhead)}</div>
        ` : ''}

        ${content_structure?.lead_paragraph ? `
        <div class="section-label lead">Lead Paragraph${this.confidenceBadge(content_structure?.lead_confidence)}</div>
        <div class="lead">${this.escapeHtml(content_structure.lead_paragraph)}</div>
        ` : ''}

        ${type_specific_metadata?.endorsement ? `
        <div class="endorsement-box">
            <div class="endorsement-title">Endorsement Details</div>
            ${type_specific_metadata.endorsement.endorser?.name ? `
            <div><strong>Endorser:</strong> ${this.escapeHtml(type_specific_metadata.endorsement.endorser.name)}</div>
            ` : ''}
            ${type_specific_metadata.endorsement.endorsee?.name ? `
            <div><strong>Endorsee:</strong> ${this.escapeHtml(type_specific_metadata.endorsement.endorsee.name)}</div>
            ` : ''}
        </div>
        ` : ''}

        ${content_flow && content_flow.length > 0 ?
            // Use content_flow to preserve original document order
            content_flow.map((block, idx) => {
                if (block.type === 'quote') {
                    return `
        <div class="section-label quote">Quote ${idx + 1}${block.speaker ? ` - ${this.escapeHtml(block.speaker)}` : ''}${this.confidenceBadge(block.confidence)}</div>
        <div class="quote">
            <div class="quote-text">"${this.escapeHtml(block.content)}"</div>
            ${block.speaker ? `<div class="quote-attribution">— ${this.escapeHtml(block.speaker)}${block.speaker_title ? `, ${this.escapeHtml(block.speaker_title)}` : ''}</div>` : ''}
        </div>`;
                } else {
                    return `
        <div class="section-label body">Body Paragraph ${idx + 1}</div>
        <div class="body-text">${this.escapeHtml(block.content)}</div>`;
                }
            }).join('')
        :
            // Fallback to separate rendering if content_flow not available
            `${content_structure?.body_paragraphs ? content_structure.body_paragraphs.map(para =>
                `<div class="body-text">${this.escapeHtml(para)}</div>`
            ).join('') : ''}

            ${quotes && quotes.length > 0 ? quotes.map(quote => `
            <div class="quote">
                <div class="quote-text">"${this.escapeHtml(quote.quote_text)}"</div>
                ${quote.speaker_name ? `<div class="quote-attribution">— ${this.escapeHtml(quote.speaker_name)}</div>` : ''}
            </div>
            `).join('') : ''}`
        }
    </div>
</body>
</html>`;
    }

    /**
     * Generate HTML for FACT_SHEET type
     */
    generateFactSheetHtml(data) {
        const { sections, key_figures, content_structure } = data;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content_structure?.headline || 'Fact Sheet')}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            color: #1a1a1a;
            background: #fafafa;
        }
        .container {
            background: white;
            padding: 40px;
        }
        .type-badge {
            background: #dc2626;
            color: white;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
            display: inline-block;
        }
        h1 {
            font-size: 36px;
            font-weight: 900;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
        }
        .stat-label {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .section {
            margin: 40px 0;
        }
        .section-header {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            color: #dc2626;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #fee2e2;
        }
        .bullet-list {
            list-style: none;
            padding: 0;
        }
        .bullet-list li {
            padding: 10px 0 10px 25px;
            position: relative;
        }
        .bullet-list li:before {
            content: '▸';
            position: absolute;
            left: 0;
            color: #dc2626;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="type-badge">Fact Sheet</div>

        <h1>${this.escapeHtml(content_structure?.headline || 'Fact Sheet')}</h1>

        ${key_figures && key_figures.length > 0 ? `
        <div class="stats-grid">
            ${key_figures.slice(0, 4).map(stat => `
            <div class="stat-card">
                <div class="stat-value">
                    ${stat.type === 'currency' ? '$' : ''}${stat.value}${stat.type === 'percentage' ? '%' : ''}${stat.unit ? ' ' + stat.unit : ''}
                </div>
                <div class="stat-label">${stat.type}</div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${sections && sections.length > 0 ? sections.map(section => `
        <div class="section">
            <div class="section-header">${this.escapeHtml(section.header)}</div>
            ${section.bullets && section.bullets.length > 0 ? `
            <ul class="bullet-list">
                ${section.bullets.map(bullet => `<li>${this.escapeHtml(bullet)}</li>`).join('')}
            </ul>
            ` : `
            <div>${section.content.map(line => this.escapeHtml(line)).join('<br>')}</div>
            `}
        </div>
        `).join('') : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Generate HTML for MEDIA_ADVISORY type
     */
    generateMediaAdvisoryHtml(data) {
        const { event_details, content_structure } = data;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content_structure?.headline || 'Media Advisory')}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            color: #1a1a1a;
        }
        .container {
            background: white;
            padding: 40px;
            border: 3px solid #f59e0b;
        }
        .type-badge {
            background: #f59e0b;
            color: white;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
            display: inline-block;
        }
        h1 {
            font-size: 28px;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
        }
        .event-grid {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        .event-label {
            font-weight: bold;
            text-transform: uppercase;
            color: #f59e0b;
            font-size: 14px;
        }
        .event-value {
            font-size: 16px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="type-badge">Media Advisory</div>

        <h1>${this.escapeHtml(content_structure?.headline || 'Media Advisory')}</h1>

        ${event_details ? `
        <div class="event-grid">
            ${event_details.who ? `
            <div class="event-label">WHO:</div>
            <div class="event-value">${this.escapeHtml(event_details.who)}</div>
            ` : ''}

            ${event_details.what ? `
            <div class="event-label">WHAT:</div>
            <div class="event-value">${this.escapeHtml(event_details.what)}</div>
            ` : ''}

            ${event_details.when ? `
            <div class="event-label">WHEN:</div>
            <div class="event-value">${this.escapeHtml(event_details.when)}</div>
            ` : ''}

            ${event_details.where ? `
            <div class="event-label">WHERE:</div>
            <div class="event-value">${this.escapeHtml(event_details.where)}</div>
            ` : ''}

            ${event_details.why ? `
            <div class="event-label">WHY:</div>
            <div class="event-value">${this.escapeHtml(event_details.why)}</div>
            ` : ''}
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Generate HTML for LETTER type
     */
    generateLetterHtml(data) {
        const { recipient, subject, body, closing, content_structure } = data;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(subject || content_structure?.headline || 'Letter')}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            max-width: 650px;
            margin: 60px auto;
            padding: 40px;
            color: #000;
            background: #fafafa;
        }
        .container {
            background: white;
            padding: 60px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .letterhead {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .subject {
            font-weight: bold;
            margin: 30px 0 20px 0;
        }
        .salutation {
            margin: 30px 0 20px 0;
        }
        .body-paragraph {
            margin: 15px 0;
            text-align: justify;
            line-height: 1.8;
        }
        .closing-block {
            margin-top: 40px;
        }
        .signature {
            margin-top: 60px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="letterhead">
            <strong>OFFICIAL CORRESPONDENCE</strong>
        </div>

        ${subject ? `
        <div class="subject"><strong>RE:</strong> ${this.escapeHtml(subject)}</div>
        ` : ''}

        ${recipient ? `
        <div class="salutation">${this.escapeHtml(recipient.salutation)}</div>
        ` : ''}

        ${body && body.length > 0 ? body.map(para => `
        <div class="body-paragraph">${this.escapeHtml(para)}</div>
        `).join('') : ''}

        ${closing ? `
        <div class="closing-block">
            <div>${this.escapeHtml(closing.closing)},</div>
            <div class="signature">${this.escapeHtml(closing.signature)}</div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Generate HTML for TRANSCRIPT type
     */
    generateTranscriptHtml(data) {
        const { dialogue, speakers, content_structure } = data;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content_structure?.headline || 'Transcript')}</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            color: #1a1a1a;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
        }
        .type-badge {
            background: #6366f1;
            color: white;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
            display: inline-block;
        }
        h1 {
            font-family: 'Arial', sans-serif;
            font-size: 28px;
            margin: 20px 0;
        }
        .speakers-list {
            background: #f8fafc;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #6366f1;
        }
        .exchange {
            margin: 25px 0;
            padding: 15px;
            background: #fafafa;
        }
        .speaker-label {
            font-weight: bold;
            color: #6366f1;
            text-transform: uppercase;
        }
        .dialogue-text {
            margin-top: 8px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="type-badge">Transcript</div>

        <h1>${this.escapeHtml(content_structure?.headline || 'Transcript')}</h1>

        ${speakers && speakers.length > 0 ? `
        <div class="speakers-list">
            <strong>Participants:</strong> ${speakers.map(s => this.escapeHtml(s.name)).join(', ')}
        </div>
        ` : ''}

        ${dialogue && dialogue.length > 0 ? dialogue.map(exchange => `
        <div class="exchange">
            <div class="speaker-label">${this.escapeHtml(exchange.speaker)}:</div>
            <div class="dialogue-text">${this.escapeHtml(exchange.text)}</div>
        </div>
        `).join('') : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Generate default HTML for unknown types
     */
    generateDefaultHtml(data) {
        const { content_structure } = data;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(content_structure?.headline || 'Press Release')}</title>
    <style>
        body {
            font-family: 'Georgia', serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.7;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 20px;
        }
        .body-text {
            font-size: 16px;
            line-height: 1.8;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(content_structure?.headline || 'Press Release')}</h1>

    ${content_structure?.body_paragraphs ? content_structure.body_paragraphs.map(para => `
    <div class="body-text">${this.escapeHtml(para)}</div>
    `).join('') : ''}
</body>
</html>`;
    }

    /**
     * Generate confidence indicator badge
     */
    confidenceBadge(confidence) {
        if (!confidence && confidence !== 0) return '';

        let level = 'medium';
        let displayValue = confidence;

        if (typeof confidence === 'string') {
            level = confidence === 'high' ? 'high' : confidence === 'low' ? 'low' : 'medium';
            displayValue = confidence;
        } else if (typeof confidence === 'number') {
            if (confidence >= 0.8) level = 'high';
            else if (confidence < 0.5) level = 'low';
            displayValue = Math.round(confidence * 100) + '%';
        }

        return `<span class="confidence-indicator confidence-${level}">${displayValue}</span>`;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

module.exports = HtmlGenerator;
