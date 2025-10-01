/**
 * Readability Analysis Panel Component
 * Displays grade-level analysis and suggestions for text improvement
 */

class ReadabilityPanel {
    constructor(options = {}) {
        this.container = options.container;
        this.apiBase = options.apiBase || '/api';
        this.onAnalyze = options.onAnalyze || (() => {});

        this.currentAnalysis = null;
        this.targetGrade = options.defaultTargetGrade || 8;
        this.contentType = options.defaultContentType || 'press_release';
        this.recommendedLevels = null;

        this.init();
    }

    async init() {
        await this.loadRecommendedLevels();
        this.render();
        this.setupEventListeners();
    }

    async loadRecommendedLevels() {
        try {
            const response = await fetch(`${this.apiBase}/text-analysis/recommended-levels`);
            if (response.ok) {
                const data = await response.json();
                this.recommendedLevels = data.recommendedLevels;
            }
        } catch (error) {
            console.error('Failed to load recommended levels:', error);
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="readability-panel">
                ${this.renderStatusBar()}
                ${this.renderSettings()}
                ${this.renderSummary()}
                ${this.renderMeter()}
                ${this.renderScores()}
                ${this.renderStatistics()}
                ${this.renderSuggestions()}
            </div>
        `;
    }

    renderStatusBar() {
        if (!this.currentAnalysis) {
            return `
                <div class="readability-status-bar">
                    <div class="readability-badge">
                        <span>📚</span>
                        <span style="color: #64748b; font-size: 13px;">No analysis yet</span>
                    </div>
                    <button class="btn-analyze" onclick="readabilityPanel.triggerAnalysis()">
                        Analyze Now
                    </button>
                </div>
            `;
        }

        const { summary } = this.currentAnalysis;
        const statusClass = summary.onTarget ? 'on-target' :
                          (Math.abs(summary.deviation) < 2 ? 'warning' : 'off-target');
        const statusIcon = summary.onTarget ? '✅' : '⚠️';

        return `
            <div class="readability-status-bar">
                <div class="readability-badge">
                    <span>📚</span>
                    <div class="grade-indicator ${statusClass}">
                        ${statusIcon} Grade ${summary.currentGrade.toFixed(1)}
                    </div>
                    <div class="target-display">
                        → Target: ${summary.targetGrade}
                    </div>
                </div>
            </div>
        `;
    }

    renderSettings() {
        const contentTypes = this.recommendedLevels ? Object.keys(this.recommendedLevels) : [];

        return `
            <div class="readability-settings">
                <h3>⚙️ Analysis Settings</h3>

                <div class="setting-group">
                    <label class="setting-label">Content Type</label>
                    <div class="setting-control">
                        <select id="content-type-select" onchange="readabilityPanel.updateContentType(this.value)">
                            ${contentTypes.map(type => `
                                <option value="${type}" ${type === this.contentType ? 'selected' : ''}>
                                    ${this.formatContentType(type)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    ${this.renderRecommendedNote()}
                </div>

                <div class="setting-group">
                    <label class="setting-label">Target Grade Level: <strong id="target-grade-display">${this.targetGrade}</strong></label>
                    <div class="grade-slider">
                        <div class="grade-slider-labels">
                            <span>1st</span>
                            <span>4th</span>
                            <span>8th</span>
                            <span>12th</span>
                            <span>16th</span>
                            <span>18th</span>
                        </div>
                        <input type="range"
                               id="grade-slider"
                               min="1"
                               max="18"
                               value="${this.targetGrade}"
                               oninput="readabilityPanel.updateTargetGrade(this.value)">
                    </div>
                </div>

                <button class="btn-analyze" onclick="readabilityPanel.triggerAnalysis()">
                    🔍 Analyze Readability
                </button>
            </div>
        `;
    }

    renderRecommendedNote() {
        if (!this.recommendedLevels || !this.recommendedLevels[this.contentType]) {
            return '';
        }

        const rec = this.recommendedLevels[this.contentType];
        return `
            <div class="recommended-note">
                💡 Recommended: Grade ${rec.target} (${rec.range[0]}-${rec.range[1]}) - ${rec.note}
            </div>
        `;
    }

    renderSummary() {
        if (!this.currentAnalysis) {
            return '';
        }

        const { summary } = this.currentAnalysis;
        const deviationClass = summary.deviation > 0 ? 'too-difficult' : 'too-simple';
        const deviationText = summary.deviation > 0 ?
            `${Math.abs(summary.deviation).toFixed(1)} grades too difficult` :
            `${Math.abs(summary.deviation).toFixed(1)} grades too simple`;

        return `
            <div class="readability-summary">
                <h3>📊 Summary</h3>
                <div class="summary-grid">
                    <div class="summary-row">
                        <span class="summary-label">Current Level</span>
                        <span class="summary-value">${summary.currentGrade.toFixed(1)} (${summary.gradeLabel})</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Target Level</span>
                        <span class="summary-value">Grade ${summary.targetGrade}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Difficulty</span>
                        <span class="summary-value">${summary.difficulty}</span>
                    </div>
                    ${!summary.onTarget ? `
                        <div class="summary-row">
                            <span class="summary-label">Deviation</span>
                            <div class="deviation-indicator ${deviationClass}">
                                ${summary.deviation > 0 ? '⬆️' : '⬇️'} ${deviationText}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderMeter() {
        if (!this.currentAnalysis) {
            return '';
        }

        const { summary } = this.currentAnalysis;
        const currentPercent = ((summary.currentGrade - 1) / 17) * 100;
        const targetPercent = ((summary.targetGrade - 1) / 17) * 100;

        return `
            <div class="readability-summary">
                <h3>📈 Grade Level Meter</h3>
                <div class="grade-level-meter">
                    <div class="meter-visual">
                        <div class="meter-label">
                            <span>Graduate</span>
                            <span>18</span>
                        </div>
                        <div class="meter-label">
                            <span>College</span>
                            <span>13-16</span>
                        </div>
                        <div class="meter-label">
                            <span>High School</span>
                            <span>9-12</span>
                        </div>
                        <div class="meter-label">
                            <span>Middle School</span>
                            <span>6-8</span>
                        </div>
                        <div class="meter-label">
                            <span>Elementary</span>
                            <span>1-5</span>
                        </div>

                        <div class="current-marker" style="bottom: ${currentPercent}%;">
                            <span class="current-marker-label">${summary.currentGrade.toFixed(1)}</span>
                        </div>

                        <div class="target-marker" style="bottom: ${targetPercent}%;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderScores() {
        if (!this.currentAnalysis) {
            return '';
        }

        const { scores } = this.currentAnalysis;

        return `
            <div class="readability-scores">
                <div class="scores-header" onclick="readabilityPanel.toggleSection('scores')">
                    <h3>🎯 Detailed Scores</h3>
                    <span class="toggle-icon">▼</span>
                </div>
                <div id="scores-content" class="collapsible-content" style="max-height: 500px;">
                    <div class="scores-grid">
                        <div class="score-item">
                            <span class="score-name">Flesch-Kincaid Grade</span>
                            <span class="score-value">${scores.fleschKincaid}</span>
                        </div>
                        <div class="score-item">
                            <span class="score-name">Gunning Fog Index</span>
                            <span class="score-value">${scores.gunningFog}</span>
                        </div>
                        <div class="score-item">
                            <span class="score-name">SMOG Index</span>
                            <span class="score-value">${scores.smog}</span>
                        </div>
                        <div class="score-item">
                            <span class="score-name">Coleman-Liau Index</span>
                            <span class="score-value">${scores.colemanLiau}</span>
                        </div>
                        <div class="score-item">
                            <span class="score-name">Automated Readability</span>
                            <span class="score-value">${scores.automatedReadability}</span>
                        </div>
                        <div class="score-item average">
                            <span class="score-name">Average Grade Level</span>
                            <span class="score-value">${this.currentAnalysis.summary.currentGrade.toFixed(1)}</span>
                        </div>
                    </div>

                    <div class="flesch-ease-score">
                        <div class="score-name">Flesch Reading Ease</div>
                        <div class="flesch-progress">
                            <div class="flesch-progress-bar" style="width: ${scores.fleschReadingEase}%"></div>
                        </div>
                        <div class="score-value">${scores.fleschReadingEase}/100</div>
                        <div class="flesch-interpretation">${this.currentAnalysis.fleschInterpretation}</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStatistics() {
        if (!this.currentAnalysis) {
            return '';
        }

        const { statistics } = this.currentAnalysis;
        const complexPercent = ((statistics.complexWords / statistics.words) * 100).toFixed(1);

        return `
            <div class="readability-statistics">
                <div class="scores-header" onclick="readabilityPanel.toggleSection('statistics')">
                    <h3>📏 Text Statistics</h3>
                    <span class="toggle-icon">▼</span>
                </div>
                <div id="statistics-content" class="collapsible-content" style="max-height: 500px;">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">${statistics.words}</span>
                            <span class="stat-label">Words</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${statistics.sentences}</span>
                            <span class="stat-label">Sentences</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${statistics.avgSentenceLength.toFixed(1)}</span>
                            <span class="stat-label">Avg Sentence</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${statistics.avgWordLength.toFixed(1)}</span>
                            <span class="stat-label">Avg Word Len</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${statistics.avgSyllablesPerWord.toFixed(2)}</span>
                            <span class="stat-label">Syllables/Word</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${complexPercent}%</span>
                            <span class="stat-label">Complex Words</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSuggestions() {
        if (!this.currentAnalysis) {
            return '';
        }

        const { suggestions } = this.currentAnalysis;

        if (suggestions.length === 0) {
            return `
                <div class="readability-suggestions">
                    <h3>💡 Suggestions</h3>
                    <div class="no-suggestions">
                        <div class="no-suggestions-icon">✅</div>
                        <div class="no-suggestions-text">Perfect!</div>
                        <div class="no-suggestions-subtext">Your text is at the target grade level</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="readability-suggestions">
                <h3>💡 Suggestions to Reach Target</h3>
                <div class="suggestions-list">
                    ${suggestions.map((suggestion, idx) => this.renderSuggestion(suggestion, idx)).join('')}
                </div>
            </div>
        `;
    }

    renderSuggestion(suggestion, index) {
        // Use severity instead of priority for consistency
        const severityClass = `severity-${suggestion.severity || 'info'}`;
        const severityIcon = suggestion.severity === 'warning' ? '⚠️' : 'ℹ️';

        // Check if this is a replaceable suggestion
        const isReplaceable = suggestion.replaceable === true;

        return `
            <div class="suggestion-card ${severityClass}">
                <div class="suggestion-header">
                    <span class="severity-badge ${suggestion.severity || 'info'}">${suggestion.severity || 'info'}</span>
                    ${suggestion.location ? `<span class="suggestion-location">${suggestion.location}</span>` : ''}
                </div>
                <div class="suggestion-content">
                    ${suggestion.message ? `<div class="suggestion-message">${severityIcon} ${suggestion.message}</div>` : ''}
                    ${suggestion.details ? `<div class="suggestion-details">${this.escapeHtml(suggestion.details).replace(/\n/g, '<br>')}</div>` : ''}
                    ${suggestion.suggestion ? `<div class="suggestion-action"><strong>Fix:</strong> ${suggestion.suggestion}</div>` : ''}
                </div>
                <div class="suggestion-actions">
                    ${isReplaceable ? `
                        <button class="btn-suggestion primary" onclick="readabilityPanel.applyReplacement(${index})">
                            ✓ ${suggestion.actionLabel || 'Apply'}
                        </button>
                    ` : `
                        <button class="btn-suggestion primary" onclick="readabilityPanel.applySuggestion(${index})">
                            Apply
                        </button>
                    `}
                    <button class="btn-suggestion secondary" onclick="readabilityPanel.dismissSuggestion(${index})">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
    }

    // Event Handlers
    updateContentType(contentType) {
        this.contentType = contentType;

        // Auto-update target grade to recommended level
        if (this.recommendedLevels && this.recommendedLevels[contentType]) {
            this.targetGrade = this.recommendedLevels[contentType].target;
            const slider = document.getElementById('grade-slider');
            if (slider) slider.value = this.targetGrade;
            this.updateTargetGrade(this.targetGrade);
        }

        this.render();
    }

    updateTargetGrade(grade) {
        this.targetGrade = parseInt(grade);
        const display = document.getElementById('target-grade-display');
        if (display) {
            display.textContent = this.targetGrade;
        }
    }

    async triggerAnalysis() {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = '⏳ Analyzing...';

        try {
            await this.onAnalyze();
        } finally {
            btn.disabled = false;
            btn.textContent = '🔍 Analyze Readability';
        }
    }

    async analyzeText(text) {
        if (!text || text.trim().length === 0) {
            this.currentAnalysis = null;
            this.render();
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/text-analysis/readability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    targetGrade: this.targetGrade,
                    contentType: this.contentType
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            this.currentAnalysis = data.readability;
            this.render();
        } catch (error) {
            console.error('Readability analysis error:', error);
            alert('Failed to analyze readability. Please try again.');
        }
    }

    toggleSection(sectionId) {
        const content = document.getElementById(`${sectionId}-content`);
        const header = event.currentTarget;

        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            content.style.maxHeight = content.scrollHeight + 'px';
            header.classList.remove('collapsed');
        } else {
            content.classList.add('collapsed');
            content.style.maxHeight = '0';
            header.classList.add('collapsed');
        }
    }

    applySuggestion(index) {
        // This would integrate with AI suggestions
        console.log('Apply suggestion:', index);
        alert('AI suggestion feature coming soon!');
    }

    applyReplacement(index) {
        const suggestion = this.currentAnalysis?.suggestions[index];
        if (!suggestion || !suggestion.replaceable) {
            console.warn('Suggestion is not replaceable');
            return;
        }

        // Get all editor text fields
        const fieldIds = ['headline', 'dateline', 'lead-paragraph', 'body-text', 'quote', 'closing'];
        let replacementCount = 0;

        // Perform case-insensitive replacement in each field
        const regex = new RegExp(`\\b${this.escapeRegex(suggestion.searchText)}\\b`, 'gi');

        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value) {
                const originalValue = field.value;
                const newValue = originalValue.replace(regex, suggestion.replaceWith);

                // Count replacements made in this field
                const matches = originalValue.match(regex);
                if (matches) {
                    replacementCount += matches.length;
                    field.value = newValue;
                }
            }
        });

        // Show feedback
        if (replacementCount > 0) {
            // Remove this suggestion from the list
            this.currentAnalysis.suggestions.splice(index, 1);

            // Show success message
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = `✓ Replaced ${replacementCount}`;
            btn.disabled = true;
            btn.style.background = '#10b981';

            // Re-render to show updated suggestions
            this.render();

            // Trigger re-analysis after a short delay
            setTimeout(() => {
                this.onAnalyze();
            }, 500);
        } else {
            alert(`No instances of "${suggestion.searchText}" found in your text.`);
        }
    }

    dismissSuggestion(index) {
        if (this.currentAnalysis && this.currentAnalysis.suggestions) {
            this.currentAnalysis.suggestions.splice(index, 1);
            this.render();
        }
    }

    // Utility Methods
    formatContentType(type) {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatCategory(category) {
        return category.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    setupEventListeners() {
        // Additional event listeners if needed
    }
}
