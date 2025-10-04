/**
 * Dynamic HTML Generator
 * Creates HTML layouts based on press release type and structure
 */

class DynamicHTMLGenerator {
    /**
     * Generate HTML based on parsed press release data
     * @param {object} parsedData - Output from PressReleaseParser.parse()
     * @returns {string} HTML string
     */
    generate(parsedData) {
        const type = parsedData.verification_metadata?.verified_type || parsedData.release_type?.type;

        // Route to type-specific generator
        switch(type) {
            case 'STATEMENT':
                return this.generateStatementHTML(parsedData);
            case 'NEWS_RELEASE':
                return this.generateNewsReleaseHTML(parsedData);
            case 'FACT_SHEET':
                return this.generateFactSheetHTML(parsedData);
            case 'MEDIA_ADVISORY':
                return this.generateMediaAdvisoryHTML(parsedData);
            case 'LETTER':
                return this.generateLetterHTML(parsedData);
            case 'TRANSCRIPT':
                return this.generateTranscriptHTML(parsedData);
            default:
                return this.generateGenericHTML(parsedData);
        }
    }

    /**
     * Generate HTML for STATEMENT type
     */
    generateStatementHTML(data) {
        const headline = data.headline || data.content_structure?.headline || 'Statement';
        const attribution = data.attribution;
        const statement = data.statement;
        const context = data.context;
        const contact = data.contact_info;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline)}</title>
    <style>
        body {
            font-family: Georgia, 'Times New Roman', serif;
            max-width: 700px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .type-badge {
            display: inline-block;
            background: #e3f2fd;
            color: #1565c0;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 32px;
            margin: 20px 0;
            color: #1a1a1a;
        }
        .attribution {
            font-size: 16px;
            color: #666;
            margin: 20px 0;
            font-style: italic;
        }
        .statement-box {
            background: #f5f5f5;
            border-left: 4px solid #2196f3;
            padding: 20px 24px;
            margin: 30px 0;
            font-size: 18px;
            line-height: 1.8;
        }
        .context {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 16px;
            margin: 20px 0;
            font-size: 14px;
        }
        .context strong {
            color: #856404;
        }
        .contact {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
        }
        .metadata {
            background: #f8f9fa;
            padding: 12px;
            margin-top: 20px;
            border-radius: 4px;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="type-badge">Statement</div>

    <h1>${this.escapeHtml(headline)}</h1>

    ${attribution ? `
        <div class="attribution">
            ${this.escapeHtml(attribution.text)}
        </div>
    ` : ''}

    ${statement ? `
        <div class="statement-box">
            ${statement.is_quoted ? '"' : ''}${this.escapeHtml(statement.text)}${statement.is_quoted ? '"' : ''}
        </div>
    ` : ''}

    ${context ? `
        <div class="context">
            <strong>Context:</strong> ${this.escapeHtml(context.response_to || 'Response statement')}
        </div>
    ` : ''}

    ${contact?.primary_contact ? `
        <div class="contact">
            <strong>Contact:</strong> ${this.escapeHtml(contact.primary_contact.name || '')}<br>
            ${contact.primary_contact.phone ? `Phone: ${this.escapeHtml(contact.primary_contact.phone)}<br>` : ''}
            ${contact.primary_contact.email ? `Email: ${this.escapeHtml(contact.primary_contact.email)}` : ''}
        </div>
    ` : ''}

    <div class="metadata">
        ${data.verification_metadata?.classification_source === 'human_verified' ? '✓ Human Verified' : 'Auto-detected'}
        ${data.verification_metadata?.reviewed_by ? ` by ${this.escapeHtml(data.verification_metadata.reviewed_by)}` : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Generate HTML for NEWS_RELEASE type
     */
    generateNewsReleaseHTML(data) {
        const headline = data.content_structure?.headline || 'News Release';
        const dateline = data.content_structure?.dateline;
        const leadParagraph = data.content_structure?.lead_paragraph;
        const bodyParagraphs = data.content_structure?.body_paragraphs || [];
        const quotes = data.quotes || [];
        const subtypeMetadata = data.type_specific_metadata;
        const contact = data.contact_info;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline)}</title>
    <style>
        body {
            font-family: Georgia, 'Times New Roman', serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.7;
            color: #333;
        }
        .type-badge {
            display: inline-block;
            background: #e8f5e9;
            color: #2e7d32;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 36px;
            margin: 20px 0;
            color: #1a1a1a;
            font-weight: 700;
        }
        .dateline {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 15px 0;
        }
        .lead {
            font-size: 20px;
            font-weight: 500;
            margin: 25px 0;
            color: #2c3e50;
        }
        .body-paragraph {
            font-size: 16px;
            margin: 18px 0;
            text-align: justify;
        }
        .quote {
            background: #f8f9fa;
            border-left: 4px solid #4caf50;
            padding: 16px 20px;
            margin: 24px 0;
            font-style: italic;
        }
        .quote-text {
            font-size: 17px;
            margin-bottom: 8px;
        }
        .quote-attribution {
            font-size: 14px;
            color: #666;
            font-style: normal;
        }
        .subtype-info {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
        }
        .subtype-info h3 {
            margin: 0 0 12px 0;
            color: #1565c0;
            font-size: 16px;
        }
        .endorsement-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 12px;
        }
        .endorsement-item {
            background: white;
            padding: 12px;
            border-radius: 4px;
        }
        .endorsement-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .endorsement-name {
            font-size: 18px;
            font-weight: 600;
            color: #1565c0;
        }
        .contact {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="type-badge">News Release</div>

    <h1>${this.escapeHtml(headline)}</h1>

    ${dateline?.full ? `
        <div class="dateline">${this.escapeHtml(dateline.full)}</div>
    ` : ''}

    ${leadParagraph ? `
        <div class="lead">${this.escapeHtml(leadParagraph)}</div>
    ` : ''}

    ${subtypeMetadata?.endorsement ? `
        <div class="subtype-info">
            <h3>🤝 Endorsement</h3>
            <div class="endorsement-box">
                ${subtypeMetadata.endorsement.endorser ? `
                    <div class="endorsement-item">
                        <div class="endorsement-label">Endorser</div>
                        <div class="endorsement-name">${this.escapeHtml(subtypeMetadata.endorsement.endorser.name || '')}</div>
                    </div>
                ` : ''}
                ${subtypeMetadata.endorsement.endorsee ? `
                    <div class="endorsement-item">
                        <div class="endorsement-label">Endorsee</div>
                        <div class="endorsement-name">${this.escapeHtml(subtypeMetadata.endorsement.endorsee.name || '')}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    ` : ''}

    ${subtypeMetadata?.poll ? `
        <div class="subtype-info">
            <h3>📊 Poll Results</h3>
            ${subtypeMetadata.poll.numbers?.length ? `
                <div style="font-size: 24px; font-weight: 700; color: #1565c0; margin: 8px 0;">
                    ${subtypeMetadata.poll.numbers.map(n => `${n}%`).join(' - ')}
                </div>
            ` : ''}
            ${subtypeMetadata.poll.methodology ? `
                <div style="font-size: 13px; color: #666; margin-top: 8px;">
                    ${this.escapeHtml(subtypeMetadata.poll.methodology)}
                </div>
            ` : ''}
        </div>
    ` : ''}

    ${bodyParagraphs.map(para => `
        <div class="body-paragraph">${this.escapeHtml(para)}</div>
    `).join('')}

    ${quotes.map(quote => `
        <div class="quote">
            <div class="quote-text">"${this.escapeHtml(quote.text || quote.quote)}"</div>
            ${quote.speaker ? `
                <div class="quote-attribution">— ${this.escapeHtml(quote.speaker)}</div>
            ` : ''}
        </div>
    `).join('')}

    ${contact?.primary_contact ? `
        <div class="contact">
            <strong>Media Contact:</strong><br>
            ${this.escapeHtml(contact.primary_contact.name || '')}<br>
            ${contact.primary_contact.phone ? `${this.escapeHtml(contact.primary_contact.phone)}<br>` : ''}
            ${contact.primary_contact.email ? this.escapeHtml(contact.primary_contact.email) : ''}
        </div>
    ` : ''}
</body>
</html>`;
    }

    /**
     * Generate HTML for FACT_SHEET type
     */
    generateFactSheetHTML(data) {
        const headline = data.content_structure?.headline || 'Fact Sheet';
        const sections = data.sections || [];
        const keyFigures = data.key_figures || [];
        const contact = data.contact_info;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .type-badge {
            display: inline-block;
            background: #fff3cd;
            color: #856404;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 36px;
            margin: 20px 0;
            color: #1a1a1a;
            font-weight: 700;
            text-transform: uppercase;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 30px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .section {
            margin: 32px 0;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 24px;
        }
        .section-header {
            font-size: 20px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .bullet-list {
            list-style: none;
            padding: 0;
        }
        .bullet-list li {
            padding: 8px 0 8px 28px;
            position: relative;
            font-size: 16px;
        }
        .bullet-list li:before {
            content: "▸";
            position: absolute;
            left: 8px;
            color: #667eea;
            font-weight: bold;
        }
        .contact {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="type-badge">Fact Sheet</div>

    <h1>${this.escapeHtml(headline)}</h1>

    ${keyFigures.length > 0 ? `
        <div class="stats-grid">
            ${keyFigures.slice(0, 4).map(stat => `
                <div class="stat-card">
                    <div class="stat-value">
                        ${stat.type === 'currency' ? '$' : ''}${stat.value}${stat.type === 'percentage' ? '%' : ''}
                        ${stat.unit ? ` ${stat.unit}` : ''}
                    </div>
                    <div class="stat-label">${stat.type}</div>
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${sections.map(section => `
        <div class="section">
            <div class="section-header">${this.escapeHtml(section.header)}</div>
            ${section.bullets?.length > 0 ? `
                <ul class="bullet-list">
                    ${section.bullets.map(bullet => `
                        <li>${this.escapeHtml(bullet)}</li>
                    `).join('')}
                </ul>
            ` : `
                <div>${section.content?.join(' ') || ''}</div>
            `}
        </div>
    `).join('')}

    ${contact?.primary_contact ? `
        <div class="contact">
            <strong>Contact:</strong> ${this.escapeHtml(contact.primary_contact.name || '')}
            ${contact.primary_contact.phone ? ` | ${this.escapeHtml(contact.primary_contact.phone)}` : ''}
            ${contact.primary_contact.email ? ` | ${this.escapeHtml(contact.primary_contact.email)}` : ''}
        </div>
    ` : ''}
</body>
</html>`;
    }

    /**
     * Generate HTML for MEDIA_ADVISORY type
     */
    generateMediaAdvisoryHTML(data) {
        const headline = data.content_structure?.headline || 'Media Advisory';
        const eventDetails = data.event_details || {};
        const contact = data.contact_info;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .type-badge {
            display: inline-block;
            background: #f3e5f5;
            color: #6a1b9a;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 32px;
            margin: 20px 0;
            color: #1a1a1a;
            font-weight: 700;
        }
        .event-grid {
            display: grid;
            gap: 20px;
            margin: 30px 0;
        }
        .event-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px;
            border-radius: 8px;
        }
        .event-label {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.9;
            margin-bottom: 8px;
        }
        .event-value {
            font-size: 20px;
            font-weight: 400;
        }
        .contact {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="type-badge">Media Advisory</div>

    <h1>${this.escapeHtml(headline)}</h1>

    <div class="event-grid">
        ${eventDetails.who ? `
            <div class="event-item">
                <div class="event-label">👥 WHO</div>
                <div class="event-value">${this.escapeHtml(eventDetails.who)}</div>
            </div>
        ` : ''}

        ${eventDetails.what ? `
            <div class="event-item">
                <div class="event-label">📋 WHAT</div>
                <div class="event-value">${this.escapeHtml(eventDetails.what)}</div>
            </div>
        ` : ''}

        ${eventDetails.when ? `
            <div class="event-item">
                <div class="event-label">🕐 WHEN</div>
                <div class="event-value">${this.escapeHtml(eventDetails.when)}</div>
            </div>
        ` : ''}

        ${eventDetails.where ? `
            <div class="event-item">
                <div class="event-label">📍 WHERE</div>
                <div class="event-value">${this.escapeHtml(eventDetails.where)}</div>
            </div>
        ` : ''}

        ${eventDetails.why ? `
            <div class="event-item">
                <div class="event-label">💡 WHY</div>
                <div class="event-value">${this.escapeHtml(eventDetails.why)}</div>
            </div>
        ` : ''}
    </div>

    ${contact?.primary_contact ? `
        <div class="contact">
            <strong>📞 Media Contact</strong><br><br>
            ${this.escapeHtml(contact.primary_contact.name || '')}<br>
            ${contact.primary_contact.phone ? `${this.escapeHtml(contact.primary_contact.phone)}<br>` : ''}
            ${contact.primary_contact.email ? this.escapeHtml(contact.primary_contact.email) : ''}
        </div>
    ` : ''}
</body>
</html>`;
    }

    /**
     * Generate HTML for LETTER type
     */
    generateLetterHTML(data) {
        const headline = data.content_structure?.headline || 'Letter';
        const recipient = data.recipient;
        const subject = data.subject;
        const body = data.body || [];
        const closing = data.closing;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline)}</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            max-width: 700px;
            margin: 60px auto;
            padding: 40px;
            line-height: 1.8;
            color: #000;
            background: #fafafa;
        }
        .letter-container {
            background: white;
            padding: 60px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .type-badge {
            display: inline-block;
            background: #e1f5fe;
            color: #01579b;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 30px;
        }
        .subject {
            font-weight: 700;
            margin: 20px 0;
        }
        .salutation {
            margin: 30px 0 20px 0;
            font-size: 18px;
        }
        .body-para {
            margin: 20px 0;
            text-align: justify;
            text-indent: 40px;
        }
        .closing {
            margin-top: 40px;
        }
        .signature {
            margin-top: 60px;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="letter-container">
        <div class="type-badge">Letter</div>

        ${subject ? `
            <div class="subject"><strong>RE:</strong> ${this.escapeHtml(subject)}</div>
        ` : ''}

        ${recipient ? `
            <div class="salutation">${this.escapeHtml(recipient.salutation || `Dear ${recipient.name}`)}</div>
        ` : ''}

        ${body.map(para => `
            <div class="body-para">${this.escapeHtml(para)}</div>
        `).join('')}

        ${closing ? `
            <div class="closing">
                ${this.escapeHtml(closing.closing || 'Sincerely')},<br><br>
                ${closing.signature ? this.escapeHtml(closing.signature) : ''}
            </div>
        ` : ''}
    </div>
</body>
</html>`;
    }

    /**
     * Generate HTML for TRANSCRIPT type
     */
    generateTranscriptHTML(data) {
        const headline = data.content_structure?.headline || 'Transcript';
        const dialogue = data.dialogue || [];
        const speakers = data.speakers || [];

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline)}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .type-badge {
            display: inline-block;
            background: #fce4ec;
            color: #c2185b;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 20px;
        }
        h1 {
            font-family: Arial, sans-serif;
            font-size: 28px;
            margin: 20px 0;
            color: #1a1a1a;
        }
        .speakers-list {
            background: white;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
        }
        .dialogue-container {
            background: white;
            padding: 30px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .dialogue-line {
            margin: 20px 0;
            padding: 12px;
            border-left: 3px solid #ddd;
        }
        .speaker-name {
            font-weight: 700;
            color: #1976d2;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .dialogue-text {
            color: #333;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="type-badge">Transcript</div>

    <h1>${this.escapeHtml(headline)}</h1>

    ${speakers.length > 0 ? `
        <div class="speakers-list">
            <strong>Speakers:</strong> ${speakers.map(s => `${s.name} (${s.exchange_count} exchanges)`).join(', ')}
        </div>
    ` : ''}

    <div class="dialogue-container">
        ${dialogue.map((line, idx) => `
            <div class="dialogue-line">
                <div class="speaker-name">${this.escapeHtml(line.speaker)}:</div>
                <div class="dialogue-text">${this.escapeHtml(line.text)}</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    /**
     * Generate generic HTML for unknown types
     */
    generateGenericHTML(data) {
        const headline = data.content_structure?.headline || 'Press Release';
        const bodyParagraphs = data.content_structure?.body_paragraphs || [];
        const contact = data.contact_info;

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(headline)}</title>
    <style>
        body {
            font-family: Georgia, 'Times New Roman', serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.7;
            color: #333;
        }
        h1 {
            font-size: 32px;
            margin: 20px 0;
        }
        .body-paragraph {
            margin: 16px 0;
            text-align: justify;
        }
        .contact {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(headline)}</h1>

    ${bodyParagraphs.map(para => `
        <div class="body-paragraph">${this.escapeHtml(para)}</div>
    `).join('')}

    ${contact?.primary_contact ? `
        <div class="contact">
            <strong>Contact:</strong> ${this.escapeHtml(contact.primary_contact.name || '')}<br>
            ${contact.primary_contact.email || ''}
        </div>
    ` : ''}
</body>
</html>`;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }
}

module.exports = DynamicHTMLGenerator;
