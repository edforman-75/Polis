/**
 * Live Analysis Engine - Re-analyzes content as editor makes manual changes
 * Ensures new issues are caught even when typing independent of suggestions
 */

export class LiveAnalysisEngine {
    constructor(settings) {
        this.settings = settings || {
            real_time_suggestions: true,
            debounce_delay: 500,
            min_confidence_to_show: 0.5
        };

        this.analysisQueue = new Map(); // field -> pending analysis
        this.currentSuggestions = new Map(); // field -> suggestions
        this.appliedSuggestions = []; // List of applied/rejected suggestions
        this.fieldValues = new Map(); // field -> last analyzed value
        this.debounceTimers = new Map(); // field -> timeout
        this.analysisCallbacks = [];
        this.isAnalyzing = false;

        // Undo/Redo stacks
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Register a field for live analysis
     * @param {HTMLElement} fieldElement - The editable field element
     * @param {string} fieldName - The field identifier
     */
    registerField(fieldElement, fieldName) {
        // Store initial value
        this.fieldValues.set(fieldName, this.getFieldValue(fieldElement));

        // Set up event listeners for different input types
        if (fieldElement.tagName === 'TEXTAREA' || fieldElement.tagName === 'INPUT') {
            fieldElement.addEventListener('input', (e) => this.handleFieldChange(fieldName, fieldElement));
            fieldElement.addEventListener('paste', (e) => this.handlePaste(fieldName, fieldElement, e));
        } else if (fieldElement.contentEditable === 'true') {
            fieldElement.addEventListener('input', (e) => this.handleFieldChange(fieldName, fieldElement));
            fieldElement.addEventListener('paste', (e) => this.handlePaste(fieldName, fieldElement, e));
        }

        // Also listen for blur (when field loses focus)
        fieldElement.addEventListener('blur', (e) => this.handleFieldBlur(fieldName, fieldElement));

        console.log(`📝 Registered live analysis for field: ${fieldName}`);
    }

    /**
     * Handle field value change
     */
    handleFieldChange(fieldName, fieldElement) {
        const newValue = this.getFieldValue(fieldElement);
        const oldValue = this.fieldValues.get(fieldName);

        // Check if value actually changed
        if (newValue === oldValue) {
            return;
        }

        // Update stored value
        this.fieldValues.set(fieldName, newValue);

        // Schedule analysis with debounce
        if (this.settings.real_time_suggestions) {
            this.scheduleAnalysis(fieldName, newValue);
        }

        // Emit change event
        this.emitEvent('field-changed', {
            field: fieldName,
            oldValue,
            newValue,
            isManualEdit: true
        });
    }

    /**
     * Handle paste events (analyze immediately after paste)
     */
    handlePaste(fieldName, fieldElement, event) {
        // Get pasted text
        const pastedText = (event.clipboardData || window.clipboardData).getData('text');

        // After paste completes, analyze
        setTimeout(() => {
            const newValue = this.getFieldValue(fieldElement);
            this.fieldValues.set(fieldName, newValue);

            // Analyze paste immediately (don't wait for debounce)
            if (this.settings.real_time_suggestions) {
                this.analyzeField(fieldName, newValue, { reason: 'paste' });
            }

            this.emitEvent('field-pasted', {
                field: fieldName,
                pastedText,
                newValue
            });
        }, 10);
    }

    /**
     * Handle field blur (analyze when user leaves field)
     */
    handleFieldBlur(fieldName, fieldElement) {
        const currentValue = this.getFieldValue(fieldElement);

        // Cancel any pending debounced analysis
        this.cancelScheduledAnalysis(fieldName);

        // Analyze immediately on blur (ensures we catch everything)
        this.analyzeField(fieldName, currentValue, { reason: 'blur' });
    }

    /**
     * Schedule analysis with debounce
     */
    scheduleAnalysis(fieldName, value) {
        // Cancel existing timer for this field
        this.cancelScheduledAnalysis(fieldName);

        // Set new timer
        const timer = setTimeout(() => {
            this.analyzeField(fieldName, value, { reason: 'typing' });
            this.debounceTimers.delete(fieldName);
        }, this.settings.debounce_delay);

        this.debounceTimers.set(fieldName, timer);
    }

    /**
     * Cancel scheduled analysis for a field
     */
    cancelScheduledAnalysis(fieldName) {
        const existingTimer = this.debounceTimers.get(fieldName);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.debounceTimers.delete(fieldName);
        }
    }

    /**
     * Analyze a field's content
     */
    async analyzeField(fieldName, value, metadata = {}) {
        // Don't analyze empty fields
        if (!value || value.trim().length === 0) {
            this.currentSuggestions.set(fieldName, []);
            this.emitEvent('analysis-complete', {
                field: fieldName,
                suggestions: [],
                metadata
            });
            return;
        }

        console.log(`🔍 Analyzing ${fieldName} (${metadata.reason || 'manual'})...`);

        this.isAnalyzing = true;
        this.emitEvent('analysis-started', { field: fieldName, metadata });

        try {
            // Call analysis API
            const response = await fetch('/api/editor/analyze-field', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    field: fieldName,
                    content: value,
                    settings: this.settings
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const result = await response.json();
            const suggestions = result.suggestions || [];

            // Filter by confidence threshold
            const filtered = suggestions.filter(s =>
                !s.confidence || s.confidence >= this.settings.min_confidence_to_show
            );

            // Store suggestions
            this.currentSuggestions.set(fieldName, filtered);

            console.log(`✅ Analysis complete for ${fieldName}: ${filtered.length} suggestions`);

            // Emit results
            this.emitEvent('analysis-complete', {
                field: fieldName,
                suggestions: filtered,
                metadata
            });

            // Check if manual edit created new issues
            if (metadata.reason === 'typing' || metadata.reason === 'paste') {
                this.checkForNewIssues(fieldName, filtered);
            }

        } catch (error) {
            console.error(`Error analyzing ${fieldName}:`, error);
            this.emitEvent('analysis-error', {
                field: fieldName,
                error: error.message
            });
        } finally {
            this.isAnalyzing = false;
        }
    }

    /**
     * Check if manual edits introduced new errors
     */
    checkForNewIssues(fieldName, newSuggestions) {
        const newErrors = newSuggestions.filter(s => s.severity === 'error');

        if (newErrors.length > 0) {
            // Notify user that their edit created new errors
            this.emitEvent('new-errors-detected', {
                field: fieldName,
                errors: newErrors,
                message: `Your edit introduced ${newErrors.length} new error${newErrors.length > 1 ? 's' : ''}`
            });
        }
    }

    /**
     * Re-analyze all fields
     */
    async analyzeAllFields() {
        console.log('🔄 Re-analyzing all fields...');

        const fields = Array.from(this.fieldValues.keys());

        for (const fieldName of fields) {
            const value = this.fieldValues.get(fieldName);
            await this.analyzeField(fieldName, value, { reason: 'full-reanalysis' });
        }

        this.emitEvent('full-analysis-complete', {
            fieldsAnalyzed: fields.length
        });
    }

    /**
     * Get current suggestions for a field
     */
    getSuggestionsForField(fieldName) {
        return this.currentSuggestions.get(fieldName) || [];
    }

    /**
     * Get all current suggestions
     */
    getAllSuggestions() {
        const all = [];
        this.currentSuggestions.forEach((suggestions, fieldName) => {
            suggestions.forEach(s => {
                all.push({ ...s, field: fieldName });
            });
        });
        return all;
    }

    /**
     * Mark a suggestion as accepted/rejected
     */
    updateSuggestionStatus(fieldName, suggestionId, status) {
        const suggestions = this.currentSuggestions.get(fieldName) || [];
        const suggestion = suggestions.find(s => s.id === suggestionId);

        if (suggestion) {
            suggestion.status = status; // 'accepted', 'rejected', 'pending'
            suggestion.statusChangedAt = new Date().toISOString();

            // If accepted, we should remove it from active suggestions
            if (status === 'accepted') {
                const updated = suggestions.filter(s => s.id !== suggestionId);
                this.currentSuggestions.set(fieldName, updated);

                this.emitEvent('suggestion-accepted', {
                    field: fieldName,
                    suggestion
                });
            } else if (status === 'rejected') {
                const updated = suggestions.filter(s => s.id !== suggestionId);
                this.currentSuggestions.set(fieldName, updated);

                this.emitEvent('suggestion-rejected', {
                    field: fieldName,
                    suggestion
                });
            }
        }
    }

    /**
     * Apply a suggestion to the field
     */
    applySuggestion(fieldName, suggestionId, fieldElement) {
        const suggestions = this.currentSuggestions.get(fieldName) || [];
        const suggestion = suggestions.find(s => s.id === suggestionId);

        if (!suggestion) {
            console.error(`Suggestion ${suggestionId} not found`);
            return;
        }

        // Get current value
        const currentValue = this.getFieldValue(fieldElement);

        // Apply the change (simple text replacement)
        const newValue = currentValue.replace(suggestion.before, suggestion.after);

        // Create undo/redo action
        const action = {
            type: 'suggestion-applied',
            timestamp: new Date().toISOString(),
            fieldName,
            fieldElement,
            suggestionId,
            suggestion: { ...suggestion },
            oldValue: currentValue,
            newValue
        };

        // Push to undo stack and clear redo stack
        this.undoStack.push(action);
        this.redoStack = [];

        // Update field
        this.setFieldValue(fieldElement, newValue);
        this.fieldValues.set(fieldName, newValue);

        // Mark as accepted and move to applied list
        this.updateSuggestionStatus(fieldName, suggestionId, 'accepted');

        // Add to applied suggestions list
        this.appliedSuggestions.unshift({
            ...suggestion,
            appliedAt: new Date().toISOString(),
            oldValue: currentValue,
            newValue
        });

        // Re-analyze the field to check for new issues
        setTimeout(() => {
            this.analyzeField(fieldName, newValue, { reason: 'suggestion-applied' });
        }, 100);

        this.emitEvent('suggestion-applied', {
            field: fieldName,
            suggestion,
            oldValue: currentValue,
            newValue
        });
    }

    /**
     * Get field value (works with input, textarea, contenteditable)
     */
    getFieldValue(element) {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            return element.value;
        } else if (element.contentEditable === 'true') {
            return element.textContent || element.innerText || '';
        }
        return '';
    }

    /**
     * Set field value (works with input, textarea, contenteditable)
     */
    setFieldValue(element, value) {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            element.value = value;
        } else if (element.contentEditable === 'true') {
            element.textContent = value;
        }
    }

    /**
     * Register a callback for analysis events
     */
    on(eventName, callback) {
        this.analysisCallbacks.push({ eventName, callback });
    }

    /**
     * Emit an event to all registered callbacks
     */
    emitEvent(eventName, data) {
        this.analysisCallbacks
            .filter(cb => cb.eventName === eventName)
            .forEach(cb => cb.callback(data));
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };

        // If real-time suggestions were turned off, cancel all pending analyses
        if (!this.settings.real_time_suggestions) {
            this.debounceTimers.forEach((timer, fieldName) => {
                clearTimeout(timer);
            });
            this.debounceTimers.clear();
        }
    }

    /**
     * Pause live analysis (e.g., during bulk operations)
     */
    pause() {
        this.settings.real_time_suggestions = false;
        console.log('⏸️  Live analysis paused');
    }

    /**
     * Resume live analysis
     */
    resume() {
        this.settings.real_time_suggestions = true;
        console.log('▶️  Live analysis resumed');
    }

    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length === 0) {
            console.log('Nothing to undo');
            return false;
        }

        const action = this.undoStack.pop();

        if (action.type === 'suggestion-applied') {
            // Revert the field value
            this.setFieldValue(action.fieldElement, action.oldValue);
            this.fieldValues.set(action.fieldName, action.oldValue);

            // Remove from applied suggestions
            this.appliedSuggestions = this.appliedSuggestions.filter(
                s => s.id !== action.suggestionId
            );

            // Add back to current suggestions
            const currentSuggs = this.currentSuggestions.get(action.fieldName) || [];
            currentSuggs.push(action.suggestion);
            this.currentSuggestions.set(action.fieldName, currentSuggs);

            // Push to redo stack
            this.redoStack.push(action);

            this.emitEvent('action-undone', { action });
            return true;
        } else if (action.type === 'suggestion-rejected') {
            // Add back to current suggestions
            const currentSuggs = this.currentSuggestions.get(action.fieldName) || [];
            currentSuggs.push(action.suggestion);
            this.currentSuggestions.set(action.fieldName, currentSuggs);

            // Remove from applied suggestions
            this.appliedSuggestions = this.appliedSuggestions.filter(
                s => s.id !== action.suggestionId
            );

            // Push to redo stack
            this.redoStack.push(action);

            this.emitEvent('action-undone', { action });
            return true;
        }

        return false;
    }

    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) {
            console.log('Nothing to redo');
            return false;
        }

        const action = this.redoStack.pop();

        if (action.type === 'suggestion-applied') {
            // Re-apply the suggestion
            this.setFieldValue(action.fieldElement, action.newValue);
            this.fieldValues.set(action.fieldName, action.newValue);

            // Remove from current suggestions
            const currentSuggs = this.currentSuggestions.get(action.fieldName) || [];
            this.currentSuggestions.set(
                action.fieldName,
                currentSuggs.filter(s => s.id !== action.suggestionId)
            );

            // Add back to applied suggestions
            this.appliedSuggestions.unshift({
                ...action.suggestion,
                appliedAt: new Date().toISOString(),
                oldValue: action.oldValue,
                newValue: action.newValue
            });

            // Push to undo stack
            this.undoStack.push(action);

            this.emitEvent('action-redone', { action });
            return true;
        } else if (action.type === 'suggestion-rejected') {
            // Re-reject the suggestion
            const currentSuggs = this.currentSuggestions.get(action.fieldName) || [];
            this.currentSuggestions.set(
                action.fieldName,
                currentSuggs.filter(s => s.id !== action.suggestionId)
            );

            this.appliedSuggestions.unshift({
                ...action.suggestion,
                rejectedAt: new Date().toISOString()
            });

            // Push to undo stack
            this.undoStack.push(action);

            this.emitEvent('action-redone', { action });
            return true;
        }

        return false;
    }

    /**
     * Reject a suggestion
     */
    rejectSuggestion(fieldName, suggestionId) {
        const suggestions = this.currentSuggestions.get(fieldName) || [];
        const suggestion = suggestions.find(s => s.id === suggestionId);

        if (!suggestion) {
            console.error(`Suggestion ${suggestionId} not found`);
            return;
        }

        // Create undo/redo action
        const action = {
            type: 'suggestion-rejected',
            timestamp: new Date().toISOString(),
            fieldName,
            suggestionId,
            suggestion: { ...suggestion }
        };

        // Push to undo stack and clear redo stack
        this.undoStack.push(action);
        this.redoStack = [];

        // Mark as rejected and remove from current suggestions
        this.updateSuggestionStatus(fieldName, suggestionId, 'rejected');

        // Add to applied suggestions list with rejected status
        this.appliedSuggestions.unshift({
            ...suggestion,
            rejectedAt: new Date().toISOString(),
            status: 'rejected'
        });

        this.emitEvent('suggestion-rejected', {
            field: fieldName,
            suggestion
        });
    }

    /**
     * Get applied/rejected suggestions
     */
    getAppliedSuggestions() {
        return this.appliedSuggestions;
    }

    /**
     * Check if undo/redo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Clean up
     */
    destroy() {
        // Cancel all pending analyses
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.analysisCallbacks = [];
        this.currentSuggestions.clear();
        this.fieldValues.clear();
        this.appliedSuggestions = [];
        this.undoStack = [];
        this.redoStack = [];
    }
}
