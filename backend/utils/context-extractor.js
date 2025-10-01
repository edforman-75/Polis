/**
 * Context Extractor - Extract key metadata before full parsing
 * Identifies candidate name, organization, campaign context to ensure correct parsing
 */

const { getChatCompletion } = require('../openai-client');

class ContextExtractor {
    constructor() {
        this.extractedContext = null;
    }

    /**
     * Extract context metadata from press release text
     * @param {string} text - The original press release text
     * @returns {Promise<Object>} - Extracted context metadata
     */
    async extractContext(text) {
        const prompt = `You are a political press release analyzer. Extract key contextual metadata from this press release to ensure we parse it correctly.

Press Release Text:
${text}

Extract the following information (return JSON only, no other text):

{
  "candidate_name": "Full name of the candidate (if applicable)",
  "candidate_title": "Current title/position (e.g., 'State Senator', 'Former Governor')",
  "organization": "Campaign organization or entity issuing the release",
  "office_sought": "What office they're running for (e.g., 'U.S. Senate', 'Governor of California')",
  "party": "Political party affiliation",
  "race_context": "Brief description of the race/campaign context",
  "release_type": "Type of release (announcement, endorsement, policy, response, event, general)",
  "key_topic": "Main topic or theme of this release",
  "confidence": {
    "candidate_name": 0.0-1.0,
    "organization": 0.0-1.0,
    "office_sought": 0.0-1.0,
    "overall": 0.0-1.0
  }
}

Return null for any field you cannot determine with confidence. Be precise and accurate.`;

        try {
            const response = await getChatCompletion([
                { role: 'system', content: 'You are a political press release context analyzer. Always return valid JSON.' },
                { role: 'user', content: prompt }
            ], {
                temperature: 0.1,
                max_tokens: 1000
            });

            const content = response.choices[0].message.content.trim();

            // Extract JSON from response (handle markdown code blocks)
            let jsonText = content;
            if (content.includes('```json')) {
                jsonText = content.match(/```json\n([\s\S]*?)\n```/)?.[1] || content;
            } else if (content.includes('```')) {
                jsonText = content.match(/```\n([\s\S]*?)\n```/)?.[1] || content;
            }

            this.extractedContext = JSON.parse(jsonText);

            console.log('📋 Context extracted:', {
                candidate: this.extractedContext.candidate_name,
                organization: this.extractedContext.organization,
                office: this.extractedContext.office_sought,
                type: this.extractedContext.release_type,
                confidence: this.extractedContext.confidence?.overall
            });

            return this.extractedContext;

        } catch (error) {
            console.error('Error extracting context:', error);

            // Return minimal context on error
            return {
                candidate_name: null,
                candidate_title: null,
                organization: null,
                office_sought: null,
                party: null,
                race_context: null,
                release_type: 'general',
                key_topic: null,
                confidence: {
                    overall: 0.0
                },
                error: error.message
            };
        }
    }

    /**
     * Validate extracted context with user
     * Returns HTML for context confirmation dialog
     */
    generateContextConfirmationHTML() {
        if (!this.extractedContext) {
            return null;
        }

        const ctx = this.extractedContext;
        const confidence = ctx.confidence?.overall || 0;
        const confidenceClass = confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low';
        const confidenceColor = confidence > 0.8 ? '#10b981' : confidence > 0.5 ? '#f59e0b' : '#ef4444';

        return `
            <div class="context-confirmation-card">
                <div class="context-header">
                    <h3>📋 Detected Campaign Context</h3>
                    <div class="confidence-badge ${confidenceClass}" style="background: ${confidenceColor}">
                        ${(confidence * 100).toFixed(0)}% Confidence
                    </div>
                </div>

                <div class="context-fields">
                    ${ctx.candidate_name ? `
                        <div class="context-field">
                            <label>Candidate</label>
                            <div class="context-value">${ctx.candidate_name}</div>
                        </div>
                    ` : ''}

                    ${ctx.candidate_title ? `
                        <div class="context-field">
                            <label>Current Title</label>
                            <div class="context-value">${ctx.candidate_title}</div>
                        </div>
                    ` : ''}

                    ${ctx.organization ? `
                        <div class="context-field">
                            <label>Organization</label>
                            <div class="context-value">${ctx.organization}</div>
                        </div>
                    ` : ''}

                    ${ctx.office_sought ? `
                        <div class="context-field">
                            <label>Office Sought</label>
                            <div class="context-value">${ctx.office_sought}</div>
                        </div>
                    ` : ''}

                    ${ctx.party ? `
                        <div class="context-field">
                            <label>Party</label>
                            <div class="context-value">${ctx.party}</div>
                        </div>
                    ` : ''}

                    ${ctx.release_type ? `
                        <div class="context-field">
                            <label>Release Type</label>
                            <div class="context-value">${ctx.release_type}</div>
                        </div>
                    ` : ''}

                    ${ctx.key_topic ? `
                        <div class="context-field">
                            <label>Topic</label>
                            <div class="context-value">${ctx.key_topic}</div>
                        </div>
                    ` : ''}
                </div>

                <div class="context-actions">
                    <button class="context-btn secondary" onclick="editContext()">
                        ✏️ Edit Context
                    </button>
                    <button class="context-btn primary" onclick="confirmContextAndParse()">
                        ✓ Looks Good - Continue Parsing
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate editable context form
     */
    generateContextEditForm() {
        const ctx = this.extractedContext || {};

        return `
            <div class="context-edit-form">
                <h3>Edit Campaign Context</h3>

                <div class="form-group">
                    <label>Candidate Name</label>
                    <input type="text" id="edit-candidate-name" value="${ctx.candidate_name || ''}"
                           placeholder="Full name of candidate">
                </div>

                <div class="form-group">
                    <label>Current Title/Position</label>
                    <input type="text" id="edit-candidate-title" value="${ctx.candidate_title || ''}"
                           placeholder="e.g., State Senator, Former Governor">
                </div>

                <div class="form-group">
                    <label>Organization</label>
                    <input type="text" id="edit-organization" value="${ctx.organization || ''}"
                           placeholder="Campaign organization name">
                </div>

                <div class="form-group">
                    <label>Office Sought</label>
                    <input type="text" id="edit-office-sought" value="${ctx.office_sought || ''}"
                           placeholder="e.g., U.S. Senate, Governor of California">
                </div>

                <div class="form-group">
                    <label>Party Affiliation</label>
                    <select id="edit-party">
                        <option value="">Select party...</option>
                        <option value="Democratic" ${ctx.party === 'Democratic' ? 'selected' : ''}>Democratic</option>
                        <option value="Republican" ${ctx.party === 'Republican' ? 'selected' : ''}>Republican</option>
                        <option value="Independent" ${ctx.party === 'Independent' ? 'selected' : ''}>Independent</option>
                        <option value="Green" ${ctx.party === 'Green' ? 'selected' : ''}>Green</option>
                        <option value="Libertarian" ${ctx.party === 'Libertarian' ? 'selected' : ''}>Libertarian</option>
                        <option value="Other" ${ctx.party === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Release Type</label>
                    <select id="edit-release-type">
                        <option value="announcement" ${ctx.release_type === 'announcement' ? 'selected' : ''}>Campaign Announcement</option>
                        <option value="endorsement" ${ctx.release_type === 'endorsement' ? 'selected' : ''}>Endorsement</option>
                        <option value="policy" ${ctx.release_type === 'policy' ? 'selected' : ''}>Policy Statement</option>
                        <option value="response" ${ctx.release_type === 'response' ? 'selected' : ''}>Response/Rebuttal</option>
                        <option value="event" ${ctx.release_type === 'event' ? 'selected' : ''}>Event Announcement</option>
                        <option value="general" ${ctx.release_type === 'general' ? 'selected' : ''}>General</option>
                    </select>
                </div>

                <div class="form-actions">
                    <button class="context-btn secondary" onclick="cancelContextEdit()">
                        Cancel
                    </button>
                    <button class="context-btn primary" onclick="saveContextAndParse()">
                        Save & Continue Parsing
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Update context from edited form values
     */
    updateContextFromForm(formData) {
        this.extractedContext = {
            ...this.extractedContext,
            candidate_name: formData.candidate_name || null,
            candidate_title: formData.candidate_title || null,
            organization: formData.organization || null,
            office_sought: formData.office_sought || null,
            party: formData.party || null,
            release_type: formData.release_type || 'general',
            confidence: {
                ...this.extractedContext?.confidence,
                overall: 1.0 // User-confirmed context is 100% confident
            }
        };

        return this.extractedContext;
    }

    /**
     * Get context for use in parsing
     */
    getContext() {
        return this.extractedContext;
    }

    /**
     * Check if we have minimum required context
     */
    hasMinimumContext() {
        if (!this.extractedContext) return false;

        // At minimum, we need either candidate name or organization
        return !!(this.extractedContext.candidate_name || this.extractedContext.organization);
    }

    /**
     * Get context summary for display
     */
    getContextSummary() {
        if (!this.extractedContext) return 'No context extracted';

        const parts = [];
        if (this.extractedContext.candidate_name) {
            parts.push(this.extractedContext.candidate_name);
        }
        if (this.extractedContext.office_sought) {
            parts.push(`for ${this.extractedContext.office_sought}`);
        }
        if (this.extractedContext.party) {
            parts.push(`(${this.extractedContext.party})`);
        }

        return parts.length > 0 ? parts.join(' ') : 'General press release';
    }
}

module.exports = ContextExtractor;
