/**
 * Validation Panel - Side-by-side interface for parser validation
 * Left pane: Original text (read-only, searchable)
 * Right pane: Parsed fields with validation controls
 */

export class ValidationPanel {
    constructor() {
        this.originalText = '';
        this.parsedFields = {};
        this.fieldValidationStates = {}; // field -> 'pending' | 'validated' | 'has-issue'
        this.validationCorrections = [];
        this.activeFieldId = null;
        this.searchMatches = [];
        this.currentSearchIndex = 0;
    }

    /**
     * Initialize the validation panel
     * @param {string} originalText - The original draft text
     * @param {Object} parsedFields - The parsed field data
     * @param {Object} confidenceScores - Parser confidence scores per field
     */
    initialize(originalText, parsedFields, confidenceScores = {}) {
        this.originalText = originalText;
        this.parsedFields = parsedFields;
        this.confidenceScores = confidenceScores;

        // Initialize all fields as pending
        Object.keys(parsedFields).forEach(field => {
            this.fieldValidationStates[field] = 'pending';
        });

        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the side-by-side validation interface
     */
    render() {
        const container = document.getElementById('validation-container');
        if (!container) {
            console.error('Validation container not found');
            return;
        }

        container.innerHTML = `
            <div class="validation-container">
                <!-- Left pane: Original text -->
                <div class="validation-pane validation-pane-left">
                    <div class="validation-pane-header">
                        <div class="validation-pane-title">
                            📄 Original Draft
                        </div>
                        <div class="validation-pane-subtitle">
                            Use search to find content in the original text
                        </div>
                    </div>

                    <div class="text-search-box">
                        <input
                            type="text"
                            id="original-text-search"
                            class="text-search-input"
                            placeholder="Search in original text..."
                        >
                        <div class="text-search-count" id="search-count">0 matches</div>
                    </div>

                    <div class="original-text-display searchable" id="original-text-display">
                        ${this.escapeHtml(this.originalText)}
                    </div>
                </div>

                <!-- Right pane: Parsed fields -->
                <div class="validation-pane validation-pane-right">
                    <div class="validation-pane-header">
                        <div class="validation-pane-title">
                            🔍 Parsed Fields
                        </div>
                        <div class="validation-pane-subtitle">
                            Validate each field's extraction
                        </div>
                    </div>

                    ${this.renderValidationProgress()}
                    ${this.renderParsedFields()}

                    <div class="submit-validation-container">
                        <button
                            class="submit-validation-btn"
                            id="submit-validation-btn"
                            ${this.canSubmit() ? '' : 'disabled'}
                        >
                            ✓ Complete Validation & Continue to Editing
                        </button>
                    </div>
                </div>
            </div>

            <!-- Move field dialog (hidden by default) -->
            <div id="move-field-dialog" style="display: none;"></div>
            <div id="dialog-overlay" class="dialog-overlay" style="display: none;"></div>
        `;
    }

    /**
     * Render validation progress indicator
     */
    renderValidationProgress() {
        const total = Object.keys(this.parsedFields).length;
        const validated = Object.values(this.fieldValidationStates).filter(s => s === 'validated').length;
        const issues = Object.values(this.fieldValidationStates).filter(s => s === 'has-issue').length;
        const pending = total - validated - issues;
        const percentage = total > 0 ? (validated / total) * 100 : 0;

        return `
            <div class="validation-progress">
                <div class="progress-header">
                    <span class="progress-label">Validation Progress</span>
                    <span class="progress-count">${validated} of ${total} fields</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-stats">
                    <div class="progress-stat">
                        <span class="progress-stat-dot validated"></span>
                        <span>${validated} validated</span>
                    </div>
                    <div class="progress-stat">
                        <span class="progress-stat-dot issues"></span>
                        <span>${issues} issues</span>
                    </div>
                    <div class="progress-stat">
                        <span class="progress-stat-dot pending"></span>
                        <span>${pending} pending</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render all parsed fields with validation controls
     */
    renderParsedFields() {
        return `
            <div class="parsed-fields-list" id="parsed-fields-list">
                ${Object.entries(this.parsedFields).map(([field, value]) =>
                    this.renderFieldItem(field, value)
                ).join('')}
            </div>
        `;
    }

    /**
     * Render a single field item
     */
    renderFieldItem(field, value) {
        const state = this.fieldValidationStates[field];
        const confidence = this.confidenceScores[field] || 1.0;
        const confidenceClass = confidence < 0.5 ? 'low' : confidence < 0.75 ? 'medium' : '';
        const displayValue = Array.isArray(value) ? value.join(', ') : (value || '(empty)');

        return `
            <div class="parsed-field-item ${state}" data-field="${field}" id="field-${field}">
                <div class="parsed-field-header">
                    <div class="parsed-field-label">${this.formatFieldName(field)}</div>
                    <div class="parsed-field-confidence">
                        <span class="confidence-dot ${confidenceClass}"></span>
                        <span>${(confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                </div>

                <div class="parsed-field-value" id="field-value-${field}">
                    ${this.escapeHtml(displayValue)}
                </div>

                <div class="parsed-field-actions">
                    ${state === 'pending' ? `
                        <button class="field-action-btn validate" data-field="${field}" data-action="validate">
                            ✓ Correct
                        </button>
                        <button class="field-action-btn" data-field="${field}" data-action="edit">
                            ✏️ Edit Content
                        </button>
                        <button class="field-action-btn move" data-field="${field}" data-action="move">
                            ↔️ Move to Different Field
                        </button>
                        <button class="field-action-btn issue" data-field="${field}" data-action="delete">
                            ✗ Delete (Not in original)
                        </button>
                    ` : state === 'validated' ? `
                        <button class="field-action-btn" data-field="${field}" data-action="undo">
                            ↶ Undo Validation
                        </button>
                    ` : `
                        <button class="field-action-btn" data-field="${field}" data-action="fix">
                            🔧 Fix Issue
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Search in original text
        const searchInput = document.getElementById('original-text-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Field action buttons
        document.getElementById('parsed-fields-list')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.field-action-btn');
            if (!btn) return;

            const field = btn.dataset.field;
            const action = btn.dataset.action;

            this.handleFieldAction(field, action);
        });

        // Submit validation
        document.getElementById('submit-validation-btn')?.addEventListener('click', () => {
            this.submitValidation();
        });

        // Field click to highlight in original
        document.querySelectorAll('.parsed-field-value').forEach(el => {
            el.addEventListener('click', (e) => {
                const fieldItem = e.target.closest('.parsed-field-item');
                if (fieldItem) {
                    const field = fieldItem.dataset.field;
                    this.highlightInOriginal(this.parsedFields[field]);
                }
            });
        });
    }

    /**
     * Handle field actions (validate, edit, move, delete)
     */
    handleFieldAction(field, action) {
        switch (action) {
            case 'validate':
                this.validateField(field);
                break;
            case 'edit':
                this.editFieldContent(field);
                break;
            case 'move':
                this.showMoveFieldDialog(field);
                break;
            case 'delete':
                this.deleteField(field);
                break;
            case 'undo':
                this.undoValidation(field);
                break;
            case 'fix':
                this.editFieldContent(field);
                break;
        }
    }

    /**
     * Mark field as validated (correct)
     */
    validateField(field) {
        this.fieldValidationStates[field] = 'validated';
        this.recordCorrection(field, 'validated', 'Field extraction is correct');
        this.refreshFieldItem(field);
        this.refreshProgress();
        this.checkSubmitButton();
    }

    /**
     * Edit field content inline
     */
    editFieldContent(field) {
        const valueEl = document.getElementById(`field-value-${field}`);
        if (!valueEl) return;

        const currentValue = this.parsedFields[field];
        valueEl.innerHTML = `
            <textarea id="edit-textarea-${field}">${this.escapeHtml(currentValue)}</textarea>
            <div style="margin-top: 8px; display: flex; gap: 8px;">
                <button class="field-action-btn validate" onclick="window.validationPanel.saveFieldEdit('${field}')">
                    ✓ Save
                </button>
                <button class="field-action-btn" onclick="window.validationPanel.cancelFieldEdit('${field}')">
                    ✗ Cancel
                </button>
            </div>
        `;

        document.getElementById(`edit-textarea-${field}`)?.focus();
    }

    /**
     * Save edited field content
     */
    saveFieldEdit(field) {
        const textarea = document.getElementById(`edit-textarea-${field}`);
        if (!textarea) return;

        const newValue = textarea.value.trim();
        const oldValue = this.parsedFields[field];

        if (newValue !== oldValue) {
            this.parsedFields[field] = newValue;
            this.recordCorrection(field, 'content_edited', `Changed from "${oldValue}" to "${newValue}"`);
        }

        this.fieldValidationStates[field] = 'validated';
        this.refreshFieldItem(field);
        this.refreshProgress();
        this.checkSubmitButton();
    }

    /**
     * Cancel field edit
     */
    cancelFieldEdit(field) {
        this.refreshFieldItem(field);
    }

    /**
     * Show dialog to move field content to different field
     */
    showMoveFieldDialog(fromField) {
        const dialog = document.getElementById('move-field-dialog');
        const overlay = document.getElementById('dialog-overlay');

        const otherFields = Object.keys(this.parsedFields).filter(f => f !== fromField);

        dialog.innerHTML = `
            <div class="move-field-dialog">
                <div class="dialog-header">Move "${this.formatFieldName(fromField)}" to...</div>
                <div class="dialog-content">
                    <select class="field-select" id="move-target-field">
                        <option value="">Select target field...</option>
                        ${otherFields.map(f => `
                            <option value="${f}">${this.formatFieldName(f)}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="dialog-actions">
                    <button class="dialog-btn" onclick="window.validationPanel.closeMoveDialog()">
                        Cancel
                    </button>
                    <button class="dialog-btn primary" onclick="window.validationPanel.confirmMoveField('${fromField}')">
                        Move Content
                    </button>
                </div>
            </div>
        `;

        dialog.style.display = 'block';
        overlay.style.display = 'block';
    }

    /**
     * Confirm moving field content
     */
    confirmMoveField(fromField) {
        const targetField = document.getElementById('move-target-field')?.value;
        if (!targetField) return;

        const content = this.parsedFields[fromField];
        this.parsedFields[targetField] = (this.parsedFields[targetField] || '') + '\n' + content;
        this.parsedFields[fromField] = '';

        this.recordCorrection(fromField, 'field_movement',
            `Moved content from ${fromField} to ${targetField}`);

        this.fieldValidationStates[fromField] = 'validated';
        this.fieldValidationStates[targetField] = 'pending';

        this.closeMoveDialog();
        this.refreshFieldItem(fromField);
        this.refreshFieldItem(targetField);
        this.refreshProgress();
    }

    /**
     * Close move field dialog
     */
    closeMoveDialog() {
        document.getElementById('move-field-dialog').style.display = 'none';
        document.getElementById('dialog-overlay').style.display = 'none';
    }

    /**
     * Delete field (mark as incorrect extraction)
     */
    deleteField(field) {
        if (!confirm(`Delete the content in "${this.formatFieldName(field)}"? This indicates the parser incorrectly extracted this content.`)) {
            return;
        }

        this.parsedFields[field] = '';
        this.fieldValidationStates[field] = 'validated';
        this.recordCorrection(field, 'field_deleted', 'Content not present in original or incorrectly extracted');

        this.refreshFieldItem(field);
        this.refreshProgress();
        this.checkSubmitButton();
    }

    /**
     * Undo validation
     */
    undoValidation(field) {
        this.fieldValidationStates[field] = 'pending';
        this.refreshFieldItem(field);
        this.refreshProgress();
        this.checkSubmitButton();
    }

    /**
     * Search in original text
     */
    handleSearch(query) {
        const display = document.getElementById('original-text-display');
        if (!display) return;

        if (!query.trim()) {
            display.innerHTML = this.escapeHtml(this.originalText);
            document.getElementById('search-count').textContent = '0 matches';
            return;
        }

        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = [...this.originalText.matchAll(regex)];

        let highlightedText = this.originalText;
        let offset = 0;

        matches.forEach((match, index) => {
            const start = match.index + offset;
            const end = start + match[0].length;
            const highlighted = `<span class="original-text-highlight ${index === 0 ? 'active' : ''}">${this.escapeHtml(match[0])}</span>`;
            highlightedText = highlightedText.slice(0, start) + highlighted + highlightedText.slice(end);
            offset += highlighted.length - match[0].length;
        });

        display.innerHTML = highlightedText;
        document.getElementById('search-count').textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;
    }

    /**
     * Highlight text in original pane
     */
    highlightInOriginal(text) {
        if (!text || typeof text !== 'string') return;

        const searchInput = document.getElementById('original-text-search');
        if (searchInput) {
            searchInput.value = text.substring(0, 50); // First 50 chars
            this.handleSearch(text.substring(0, 50));
        }
    }

    /**
     * Record a validation correction for parser learning
     */
    recordCorrection(field, type, description) {
        this.validationCorrections.push({
            field,
            type,
            description,
            timestamp: new Date().toISOString(),
            parserExtracted: this.parsedFields[field],
            parserConfidence: this.confidenceScores[field] || 1.0
        });
    }

    /**
     * Refresh a single field item
     */
    refreshFieldItem(field) {
        const fieldItem = document.getElementById(`field-${field}`);
        if (!fieldItem) return;

        const newHtml = this.renderFieldItem(field, this.parsedFields[field]);
        const temp = document.createElement('div');
        temp.innerHTML = newHtml;
        fieldItem.replaceWith(temp.firstElementChild);
    }

    /**
     * Refresh progress indicator
     */
    refreshProgress() {
        const progressContainer = document.querySelector('.validation-progress');
        if (!progressContainer) return;

        progressContainer.outerHTML = this.renderValidationProgress();
    }

    /**
     * Check if validation can be submitted
     */
    canSubmit() {
        return Object.values(this.fieldValidationStates).every(s => s === 'validated');
    }

    /**
     * Update submit button state
     */
    checkSubmitButton() {
        const btn = document.getElementById('submit-validation-btn');
        if (btn) {
            btn.disabled = !this.canSubmit();
        }
    }

    /**
     * Submit validation and proceed to editing stage
     */
    async submitValidation() {
        if (!this.canSubmit()) {
            alert('Please validate all fields before continuing.');
            return;
        }

        // Show parser quality rating dialog
        this.showParserRatingDialog();
    }

    /**
     * Show parser quality rating dialog
     */
    showParserRatingDialog() {
        const dialog = document.createElement('div');
        dialog.id = 'parser-rating-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        dialog.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 32px; max-width: 500px; width: 90%;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1e293b;">
                    ⭐ Rate Parser Quality
                </h2>
                <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px;">
                    Help us improve! How well did the parser extract fields from this press release?
                </p>

                <div style="margin-bottom: 24px;">
                    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 16px;">
                        ${[1, 2, 3, 4, 5].map(rating => `
                            <button class="rating-star" data-rating="${rating}"
                                    style="font-size: 36px; border: none; background: none; cursor: pointer;
                                           color: #cbd5e1; transition: all 0.2s;">
                                ★
                            </button>
                        `).join('')}
                    </div>
                    <div id="rating-label" style="text-align: center; color: #64748b; font-size: 14px; min-height: 20px;">
                        Click a star to rate
                    </div>
                </div>

                <div id="feedback-section" style="display: none; margin-bottom: 24px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #64748b; font-size: 13px;">
                        What could be improved?
                    </label>
                    <textarea id="parser-feedback" rows="4"
                              style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px;
                                     font-family: inherit; font-size: 14px; resize: vertical;"
                              placeholder="Tell us what went wrong..."></textarea>
                </div>

                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="rating-skip"
                            style="padding: 10px 20px; border: 1px solid #d1d5db; background: white;
                                   border-radius: 6px; cursor: pointer; font-size: 14px;">
                        Skip
                    </button>
                    <button id="rating-submit" disabled
                            style="padding: 10px 20px; border: none; background: #3b82f6; color: white;
                                   border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
                        Submit & Continue
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        let selectedRating = 0;

        // Star hover and click handlers
        const stars = dialog.querySelectorAll('.rating-star');
        const ratingLabel = dialog.getElementById('rating-label');
        const feedbackSection = dialog.getElementById('feedback-section');
        const submitBtn = dialog.getElementById('rating-submit');

        const ratingLabels = {
            1: '⭐ Poor - Major issues',
            2: '⭐⭐ Fair - Significant corrections needed',
            3: '⭐⭐⭐ Good - Some corrections needed',
            4: '⭐⭐⭐⭐ Very Good - Minor corrections',
            5: '⭐⭐⭐⭐⭐ Excellent - Nearly perfect'
        };

        stars.forEach((star, index) => {
            star.addEventListener('mouseenter', () => {
                stars.forEach((s, i) => {
                    s.style.color = i <= index ? '#fbbf24' : '#cbd5e1';
                });
                ratingLabel.textContent = ratingLabels[index + 1];
            });

            star.addEventListener('click', () => {
                selectedRating = index + 1;
                stars.forEach((s, i) => {
                    s.style.color = i < selectedRating ? '#fbbf24' : '#cbd5e1';
                });
                ratingLabel.textContent = ratingLabels[selectedRating];
                submitBtn.disabled = false;
                submitBtn.style.background = '#3b82f6';
                submitBtn.style.cursor = 'pointer';

                // Show feedback section for ratings <= 3
                if (selectedRating <= 3) {
                    feedbackSection.style.display = 'block';
                } else {
                    feedbackSection.style.display = 'none';
                }
            });
        });

        dialog.addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                s.style.color = i < selectedRating ? '#fbbf24' : '#cbd5e1';
            });
            if (selectedRating > 0) {
                ratingLabel.textContent = ratingLabels[selectedRating];
            } else {
                ratingLabel.textContent = 'Click a star to rate';
            }
        });

        // Skip button
        dialog.getElementById('rating-skip').addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.completeValidationWithoutRating();
        });

        // Submit button
        submitBtn.addEventListener('click', () => {
            const feedback = dialog.getElementById('parser-feedback').value.trim();
            document.body.removeChild(dialog);
            this.completeValidationWithRating(selectedRating, feedback);
        });
    }

    /**
     * Complete validation with parser rating
     */
    completeValidationWithRating(rating, feedback) {
        const event = new CustomEvent('validation-complete', {
            detail: {
                validatedFields: this.parsedFields,
                corrections: this.validationCorrections,
                correctionsCount: this.validationCorrections.length,
                parserRating: rating,
                parserFeedback: feedback
            }
        });

        document.dispatchEvent(event);
    }

    /**
     * Complete validation without rating (user skipped)
     */
    completeValidationWithoutRating() {
        const event = new CustomEvent('validation-complete', {
            detail: {
                validatedFields: this.parsedFields,
                corrections: this.validationCorrections,
                correctionsCount: this.validationCorrections.length
            }
        });

        document.dispatchEvent(event);
    }

    /**
     * Get validation results
     */
    getValidationResults() {
        return {
            validatedFields: this.parsedFields,
            corrections: this.validationCorrections,
            correctionsCount: this.validationCorrections.length
        };
    }

    /**
     * Utility: Format field name for display
     */
    formatFieldName(field) {
        return field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make validation panel globally accessible for dialog callbacks
if (typeof window !== 'undefined') {
    window.ValidationPanel = ValidationPanel;
}
