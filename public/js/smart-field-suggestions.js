/**
 * Smart Field Suggestions
 * Provides autocomplete suggestions based on historical corrections
 */

export class SmartFieldSuggestions {
    constructor(feedbackTracker) {
        this.feedbackTracker = feedbackTracker;
        this.activeSuggestionBox = null;
        this.currentField = null;
        this.debounceTimer = null;
        this.setupStyles();
    }

    /**
     * Setup CSS styles for suggestion box
     */
    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .smart-suggestions {
                position: absolute;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-height: 200px;
                overflow-y: auto;
                z-index: 10000;
                min-width: 300px;
            }

            .smart-suggestion-item {
                padding: 10px 12px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #f3f4f6;
                transition: background 0.1s;
            }

            .smart-suggestion-item:last-child {
                border-bottom: none;
            }

            .smart-suggestion-item:hover {
                background: #f3f4f6;
            }

            .smart-suggestion-item.selected {
                background: #eff6ff;
            }

            .smart-suggestion-text {
                flex: 1;
                font-size: 14px;
                color: #1f2937;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 250px;
            }

            .smart-suggestion-confidence {
                font-size: 11px;
                color: #6b7280;
                background: #f3f4f6;
                padding: 2px 6px;
                border-radius: 4px;
                margin-left: 8px;
            }

            .smart-suggestion-header {
                padding: 8px 12px;
                font-size: 11px;
                color: #6b7280;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
                font-weight: 500;
            }

            .error-prediction-warning {
                border-left: 3px solid #f59e0b !important;
                background: #fffbeb !important;
            }

            .error-prediction-badge {
                position: absolute;
                top: -10px;
                right: -10px;
                background: #f59e0b;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Enable suggestions for a field
     */
    enableForField(fieldElement) {
        fieldElement.addEventListener('input', (e) => {
            this.onFieldInput(e.target);
        });

        fieldElement.addEventListener('blur', () => {
            // Delay hiding to allow clicking suggestions
            setTimeout(() => this.hideSuggestions(), 200);
        });

        fieldElement.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Check for error prediction on blur
        fieldElement.addEventListener('blur', () => {
            this.checkErrorPrediction(fieldElement);
        });
    }

    /**
     * Handle field input
     */
    onFieldInput(fieldElement) {
        const fieldName = fieldElement.id;
        const value = fieldElement.value;

        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Hide if value too short
        if (value.length < 3) {
            this.hideSuggestions();
            return;
        }

        // Debounce API call
        this.debounceTimer = setTimeout(async () => {
            await this.fetchAndShowSuggestions(fieldName, value, fieldElement);
        }, 300);
    }

    /**
     * Fetch and display suggestions
     */
    async fetchAndShowSuggestions(fieldName, value, fieldElement) {
        try {
            const response = await fetch(
                `/api/press-release-parser/feedback/suggestions/${fieldName}?value=${encodeURIComponent(value)}`
            );

            if (!response.ok) return;

            const data = await response.json();

            if (data.success && data.suggestions && data.suggestions.length > 0) {
                this.showSuggestions(data.suggestions, fieldElement);
            } else {
                this.hideSuggestions();
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    /**
     * Show suggestion box
     */
    showSuggestions(suggestions, fieldElement) {
        this.hideSuggestions();

        const box = document.createElement('div');
        box.className = 'smart-suggestions';

        // Add header
        const header = document.createElement('div');
        header.className = 'smart-suggestion-header';
        header.textContent = '💡 Suggestions based on past corrections';
        box.appendChild(header);

        // Add suggestions
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'smart-suggestion-item';
            if (index === 0) item.classList.add('selected');

            const text = document.createElement('div');
            text.className = 'smart-suggestion-text';
            text.textContent = suggestion.text;

            const confidence = document.createElement('div');
            confidence.className = 'smart-suggestion-confidence';
            confidence.textContent = `${Math.round(suggestion.confidence * 100)}%`;

            item.appendChild(text);
            item.appendChild(confidence);

            item.addEventListener('click', () => {
                this.applySuggestion(suggestion.text, fieldElement);
            });

            box.appendChild(item);
        });

        // Position box
        const rect = fieldElement.getBoundingClientRect();
        box.style.position = 'fixed';
        box.style.left = `${rect.left}px`;
        box.style.top = `${rect.bottom + 5}px`;

        document.body.appendChild(box);
        this.activeSuggestionBox = box;
        this.currentField = fieldElement;
    }

    /**
     * Hide suggestion box
     */
    hideSuggestions() {
        if (this.activeSuggestionBox) {
            this.activeSuggestionBox.remove();
            this.activeSuggestionBox = null;
            this.currentField = null;
        }
    }

    /**
     * Apply suggestion to field
     */
    applySuggestion(text, fieldElement) {
        fieldElement.value = text;
        fieldElement.dispatchEvent(new Event('input', { bubbles: true }));
        this.hideSuggestions();
        fieldElement.focus();
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (!this.activeSuggestionBox) return;

        const items = Array.from(this.activeSuggestionBox.querySelectorAll('.smart-suggestion-item'));
        const selectedIndex = items.findIndex(item => item.classList.contains('selected'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (selectedIndex + 1) % items.length;
            items[selectedIndex]?.classList.remove('selected');
            items[nextIndex]?.classList.add('selected');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = (selectedIndex - 1 + items.length) % items.length;
            items[selectedIndex]?.classList.remove('selected');
            items[prevIndex]?.classList.add('selected');
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selectedText = items[selectedIndex].querySelector('.smart-suggestion-text').textContent;
            this.applySuggestion(selectedText, this.currentField);
        } else if (e.key === 'Escape') {
            this.hideSuggestions();
        } else if (e.key === 'Tab' && selectedIndex >= 0) {
            e.preventDefault();
            const selectedText = items[selectedIndex].querySelector('.smart-suggestion-text').textContent;
            this.applySuggestion(selectedText, this.currentField);
        }
    }

    /**
     * Check if field value is likely wrong
     */
    async checkErrorPrediction(fieldElement) {
        const fieldName = fieldElement.id;
        const value = fieldElement.value;

        if (!value || value.length < 5) return;

        try {
            const response = await fetch(
                `/api/press-release-parser/feedback/predict-error/${fieldName}?value=${encodeURIComponent(value)}`
            );

            if (!response.ok) return;

            const data = await response.json();

            if (data.success && data.likelyWrong) {
                this.showErrorWarning(fieldElement, data);
            } else {
                this.clearErrorWarning(fieldElement);
            }
        } catch (error) {
            console.error('Error predicting error:', error);
        }
    }

    /**
     * Show error warning
     */
    showErrorWarning(fieldElement, prediction) {
        // Add visual indicator
        fieldElement.classList.add('error-prediction-warning');

        // Add badge if high confidence
        if (prediction.confidence > 0.5) {
            const existingBadge = fieldElement.parentElement.querySelector('.error-prediction-badge');
            if (existingBadge) existingBadge.remove();

            const badge = document.createElement('div');
            badge.className = 'error-prediction-badge';
            badge.textContent = '⚠';
            badge.title = `${Math.round(prediction.confidence * 100)}% likely incorrect`;

            const wrapper = fieldElement.parentElement;
            wrapper.style.position = 'relative';
            wrapper.appendChild(badge);

            // Show suggestion if available
            if (prediction.suggestion) {
                console.log(`💡 Suggestion for ${fieldElement.id}:`, prediction.suggestion.text);
            }
        }
    }

    /**
     * Clear error warning
     */
    clearErrorWarning(fieldElement) {
        fieldElement.classList.remove('error-prediction-warning');
        const badge = fieldElement.parentElement.querySelector('.error-prediction-badge');
        if (badge) badge.remove();
    }

    /**
     * Enable auto-suggestions for all fields
     */
    enableAutoSuggestions() {
        const fields = document.querySelectorAll('textarea[id], input[id]');

        fields.forEach(field => {
            this.enableForField(field);
        });

        console.log(`💡 Smart suggestions enabled for ${fields.length} fields`);
    }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.SmartFieldSuggestions = SmartFieldSuggestions;
}
