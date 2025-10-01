/**
 * Parser Feedback Tracker
 * Automatically tracks user corrections to improve parser accuracy
 */

export class ParserFeedbackTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.originalParsedData = null;
        this.fieldChangeTrackers = new Map();
        this.debounceTimers = new Map();
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize tracking after import
     */
    startTracking(originalText, parsedData) {
        this.originalText = originalText;
        this.originalParsedData = JSON.parse(JSON.stringify(parsedData));

        console.log('📊 Parser feedback tracking started');
        console.log('   Session:', this.sessionId);
        console.log('   Parsed fields:', Object.keys(parsedData.fields_data || {}).length);
    }

    /**
     * Track changes to a specific field
     */
    trackFieldChange(fieldName, element) {
        if (!this.originalParsedData) {
            console.warn('Cannot track field - no original parsed data');
            return;
        }

        // Store original value if not already stored
        if (!this.fieldChangeTrackers.has(fieldName)) {
            const originalValue = this.originalParsedData.fields_data?.[fieldName] || '';
            this.fieldChangeTrackers.set(fieldName, {
                originalValue,
                currentValue: element.value,
                changeCount: 0,
                lastChanged: Date.now()
            });
        }

        // Debounce the change detection
        if (this.debounceTimers.has(fieldName)) {
            clearTimeout(this.debounceTimers.get(fieldName));
        }

        const timer = setTimeout(() => {
            this.detectAndRecordChange(fieldName, element.value);
        }, 2000); // Wait 2 seconds after user stops typing

        this.debounceTimers.set(fieldName, timer);
    }

    /**
     * Detect if field was changed from original
     */
    detectAndRecordChange(fieldName, currentValue) {
        const tracker = this.fieldChangeTrackers.get(fieldName);
        if (!tracker) return;

        const originalValue = tracker.originalValue;

        // Check if value actually changed from original
        if (currentValue !== originalValue && currentValue.trim().length > 0) {
            tracker.changeCount++;
            tracker.currentValue = currentValue;

            console.log(`✏️  Field corrected: ${fieldName}`);
            console.log(`   Original: "${originalValue}"`);
            console.log(`   Corrected: "${currentValue}"`);

            this.recordCorrection(fieldName, originalValue, currentValue);
        }
    }

    /**
     * Record correction to backend
     */
    async recordCorrection(fieldName, originalValue, correctedValue) {
        try {
            const response = await fetch('/api/press-release-parser/feedback/correction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    originalText: this.originalText,
                    parsedResult: this.originalParsedData,
                    correctedResult: this.getCurrentData(),
                    fieldName,
                    originalValue,
                    correctedValue
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Correction recorded:', result.message);

                // Show subtle notification
                this.showFeedbackNotification();
            } else {
                console.warn('Failed to record correction:', response.statusText);
            }
        } catch (error) {
            console.error('Error recording correction:', error);
        }
    }

    /**
     * Get current field data
     */
    getCurrentData() {
        const currentData = {};
        this.fieldChangeTrackers.forEach((tracker, fieldName) => {
            currentData[fieldName] = tracker.currentValue;
        });
        return currentData;
    }

    /**
     * Show subtle notification that feedback was recorded
     */
    showFeedbackNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = '📊 Correction recorded - Thanks for improving the parser!';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Setup auto-tracking for all form fields
     */
    setupAutoTracking() {
        // Find all textareas and inputs in the fields surface
        const fields = document.querySelectorAll('textarea[id], input[id]');

        fields.forEach(field => {
            field.addEventListener('blur', () => {
                this.trackFieldChange(field.id, field);
            });
        });

        console.log(`🔍 Auto-tracking enabled for ${fields.length} fields`);
    }

    /**
     * Get parser accuracy metrics
     */
    async getMetrics() {
        try {
            const response = await fetch('/api/press-release-parser/feedback/metrics');
            if (response.ok) {
                const data = await response.json();
                return data.metrics;
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
        return null;
    }

    /**
     * Display parser accuracy dashboard
     */
    async showAccuracyDashboard() {
        const metrics = await this.getMetrics();
        if (!metrics || metrics.length === 0) {
            console.log('📊 No metrics available yet');
            return;
        }

        console.log('\n📊 Parser Accuracy Dashboard');
        console.log('═══════════════════════════════════════');

        metrics.forEach(metric => {
            const accuracy = (metric.accuracy_rate * 100).toFixed(1);
            const bar = '█'.repeat(Math.floor(accuracy / 5));
            console.log(`${metric.field_type.padEnd(20)} ${bar} ${accuracy}%`);
            console.log(`   Parses: ${metric.total_parses}, Corrections: ${metric.corrections_made}`);
        });

        console.log('═══════════════════════════════════════\n');
    }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    window.ParserFeedbackTracker = ParserFeedbackTracker;
}

// Add CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
