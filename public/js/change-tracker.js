/**
 * Change Tracker Module
 * Tracks all changes made to press release content for generating tracked changes output
 */

export class ChangeTracker {
    constructor() {
        this.originalContent = {};
        this.changes = [];
        this.isTracking = false;
        this.changeId = 0;
    }

    /**
     * Start tracking changes with initial content
     * @param {Object} initialContent - The original parsed content
     */
    startTracking(initialContent) {
        console.log('🔍 Starting change tracking with initial content:', initialContent);

        // Deep clone the initial content
        this.originalContent = JSON.parse(JSON.stringify(initialContent));
        this.changes = [];
        this.isTracking = true;
        this.changeId = 0;

        console.log('✅ Change tracking started');
    }

    /**
     * Record a change to content
     * @param {Object} change - Change details
     * @param {string} change.field - Field name that changed
     * @param {string} change.oldValue - Original value
     * @param {string} change.newValue - New value
     * @param {string} change.changeType - Type: 'ai-suggested', 'editor-manual', 'auto-fix'
     * @param {string} change.category - Category: 'AP Style', 'Grammar', 'Voice', 'Enhancement', etc.
     * @param {string} change.reason - Why the change was made
     * @param {Object} change.textRange - Optional: specific text range that changed {start, end, originalText}
     */
    recordChange(change) {
        if (!this.isTracking) {
            console.warn('⚠️ Change tracking not started');
            return;
        }

        const changeRecord = {
            id: ++this.changeId,
            timestamp: new Date().toISOString(),
            field: change.field,
            oldValue: change.oldValue || '',
            newValue: change.newValue || '',
            changeType: change.changeType || 'editor-manual',
            category: change.category || 'Editorial',
            reason: change.reason || 'Manual edit by editor',
            textRange: change.textRange || null, // For tracking specific text segments
            undone: false // Track if this change has been undone
        };

        this.changes.push(changeRecord);
        console.log('📝 Change recorded:', changeRecord);

        return changeRecord;
    }

    /**
     * Undo a specific change by ID
     * @param {number} changeId - The ID of the change to undo
     * @returns {Object} The change record that was undone
     */
    undoChange(changeId) {
        const change = this.changes.find(c => c.id === changeId);
        if (!change) {
            console.warn('⚠️ Change not found:', changeId);
            return null;
        }

        if (change.undone) {
            console.warn('⚠️ Change already undone:', changeId);
            return null;
        }

        change.undone = true;
        change.undoneAt = new Date().toISOString();
        console.log('↩️ Change undone:', change);

        return {
            field: change.field,
            value: change.oldValue // Return the original value to restore
        };
    }

    /**
     * Get the complete change history for a field, showing all intermediate steps
     * @param {string} field - Field name
     * @returns {Array} Array of changes in chronological order
     */
    getChangeHistory(field) {
        return this.changes
            .filter(c => c.field === field)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Compute the diff between original and current value with change annotations
     * Handles multiple sequential edits to the same field
     * @param {string} field - Field name
     * @param {string} currentValue - Current value of the field
     * @returns {Array} Array of text segments with change info
     */
    computeFieldDiff(field, currentValue) {
        const history = this.getChangeHistory(field);

        if (history.length === 0) {
            return [{
                text: currentValue,
                type: 'unchanged',
                changes: []
            }];
        }

        // Build the change sequence
        const segments = [];
        const originalValue = this.originalContent[field] || '';

        // For multiple changes, we show each step
        history.forEach((change, index) => {
            if (change.undone) {
                // Skip undone changes
                return;
            }

            if (change.textRange) {
                // If we have specific text range info, use it for precise tracking
                segments.push({
                    originalText: change.textRange.originalText,
                    newText: change.textRange.newText,
                    type: 'modified',
                    changeInfo: {
                        id: change.id,
                        category: change.category,
                        reason: change.reason,
                        timestamp: change.timestamp,
                        changeType: change.changeType,
                        stepNumber: index + 1,
                        totalSteps: history.filter(c => !c.undone).length
                    }
                });
            } else {
                // Whole-field change
                segments.push({
                    originalText: change.oldValue,
                    newText: change.newValue,
                    type: 'modified',
                    changeInfo: {
                        id: change.id,
                        category: change.category,
                        reason: change.reason,
                        timestamp: change.timestamp,
                        changeType: change.changeType,
                        stepNumber: index + 1,
                        totalSteps: history.filter(c => !c.undone).length
                    }
                });
            }
        });

        return segments;
    }

    /**
     * Get all changes
     */
    getAllChanges() {
        return this.changes;
    }

    /**
     * Get changes for a specific field
     */
    getChangesForField(field) {
        return this.changes.filter(c => c.field === field);
    }

    /**
     * Generate tracked changes HTML file
     * @param {Object} currentContent - Current content from fields
     * @returns {string} HTML markup with tracked changes
     */
    generateTrackedChangesHTML(currentContent) {
        console.log('📄 Generating tracked changes HTML');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Press Release - Tracked Changes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #334155;
            padding: 40px 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 28px;
            color: #1e293b;
            margin-bottom: 8px;
        }

        .header p {
            color: #64748b;
            font-size: 14px;
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-top: 20px;
        }

        .metadata-item {
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        .metadata-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
        }

        .metadata-value {
            font-size: 14px;
            color: #1e293b;
            font-weight: 500;
        }

        .comparison-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .content-panel {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .panel-header {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
        }

        .panel-header.original {
            color: #dc2626;
        }

        .panel-header.final {
            color: #059669;
        }

        .field-section {
            margin-bottom: 24px;
        }

        .field-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 8px;
        }

        .field-content {
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
        }

        /* Tracked changes styling */
        del {
            background-color: #fee;
            color: #c00;
            text-decoration: line-through;
            padding: 2px 4px;
            border-radius: 2px;
        }

        ins {
            background-color: #dfd;
            color: #080;
            text-decoration: underline;
            padding: 2px 4px;
            border-radius: 2px;
        }

        .change-annotation {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            margin-left: 4px;
            cursor: help;
            border: 1px solid #fcd34d;
        }

        .change-annotation:hover {
            background: #fde68a;
        }

        /* Changes legend */
        .changes-legend {
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .legend-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1e293b;
        }

        .legend-items {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .legend-box {
            width: 20px;
            height: 20px;
            border-radius: 4px;
        }

        .legend-box.deletion {
            background-color: #fee;
            border: 1px solid #fcc;
        }

        .legend-box.addition {
            background-color: #dfd;
            border: 1px solid #cfc;
        }

        .legend-box.annotation {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
        }

        /* Changes summary */
        .changes-summary {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .summary-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1e293b;
        }

        .change-item {
            padding: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 12px;
            background: #f8fafc;
        }

        .change-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .change-field {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
        }

        .change-category {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
        }

        .change-category.ap-style { background: #8b5cf6; }
        .change-category.grammar { background: #06b6d4; }
        .change-category.voice { background: #f59e0b; }
        .change-category.enhancement { background: #10b981; }
        .change-category.editorial { background: #6b7280; }

        .change-reason {
            font-size: 13px;
            color: #475569;
            margin-bottom: 8px;
        }

        .change-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 12px;
        }

        .change-before, .change-after {
            padding: 8px;
            border-radius: 4px;
        }

        .change-before {
            background: #fee;
            border: 1px solid #fcc;
        }

        .change-after {
            background: #dfd;
            border: 1px solid #cfc;
        }

        .change-timestamp {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 8px;
        }

        /* Undo functionality styles */
        .undo-btn {
            background: #f97316;
            color: white;
            border: none;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-left: 8px;
        }

        .undo-btn:hover {
            background: #ea580c;
            transform: translateY(-1px);
        }

        .undo-btn:active {
            transform: translateY(0);
        }

        .undone-change {
            opacity: 0.5;
            border-left: 3px solid #f97316;
        }

        .undone-badge {
            background: #f97316;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            margin-left: 8px;
        }

        .field-changes-group {
            margin-bottom: 20px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .full-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .content-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1e293b;
        }

        .press-release {
            font-family: Georgia, serif;
            font-size: 14px;
            line-height: 1.8;
        }

        .press-release h2 {
            font-size: 20px;
            margin-bottom: 12px;
            color: #1e293b;
        }

        .press-release p {
            margin-bottom: 12px;
        }

        @media print {
            body {
                background: white;
            }
            .container {
                max-width: none;
            }
            .content-panel, .changes-summary, .full-content {
                box-shadow: none;
                page-break-inside: avoid;
            }
        }

        @media (max-width: 768px) {
            .comparison-container {
                grid-template-columns: 1fr;
            }
            .change-comparison {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📋 Press Release - Tracked Changes</h1>
            <p>This document shows all changes made to the press release with explanations for each edit.</p>

            <div class="metadata">
                <div class="metadata-item">
                    <div class="metadata-label">Generated</div>
                    <div class="metadata-value">${new Date().toLocaleString()}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Total Changes</div>
                    <div class="metadata-value">${this.changes.length}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Headline</div>
                    <div class="metadata-value">${this.escapeHtml(currentContent.headline || 'Untitled')}</div>
                </div>
            </div>
        </div>

        <!-- Legend -->
        <div class="changes-legend">
            <div class="legend-title">Changes Key</div>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-box deletion"></div>
                    <span>Deletions (strikethrough, red)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box addition"></div>
                    <span>Additions (underline, green)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-box annotation"></div>
                    <span>Change annotations (hover for details)</span>
                </div>
            </div>
        </div>

        <!-- Changes Summary -->
        ${this.generateChangesSummary()}

        <!-- Side-by-side comparison -->
        ${this.generateSideBySideComparison(currentContent)}

        <!-- Full content with tracked changes -->
        ${this.generateFullContentWithTracking(currentContent)}
    </div>

    <script>
        // Undo functionality for tracked changes HTML
        window.undoChangeFromHTML = function(changeId) {
            // Show confirmation
            if (!confirm('Undo this change? Note: This will mark the change as undone in the tracking file. To apply the undo to your document, you need to regenerate the tracked changes file from the editor.')) {
                return;
            }

            // Find the change element
            const changeElement = document.querySelector(\`[data-change-id="\${changeId}"]\`);
            if (!changeElement) {
                alert('Change not found');
                return;
            }

            // Mark as undone visually
            changeElement.classList.add('undone-change');

            // Replace undo button with undone badge
            const undoBtn = changeElement.querySelector('.undo-btn');
            if (undoBtn) {
                const undoneSpan = document.createElement('span');
                undoneSpan.className = 'undone-badge';
                undoneSpan.textContent = 'UNDONE';
                undoBtn.replaceWith(undoneSpan);
            }

            // Add undo timestamp to the change item
            const timestamp = changeElement.querySelector('.change-timestamp');
            if (timestamp) {
                timestamp.textContent += \` • Undone at \${new Date().toLocaleString()}\`;
            }

            // Show info message
            alert('Change marked as undone. To apply this undo to your press release, regenerate the tracked changes file from the editor.');
        };

        // Print functionality
        window.printTrackedChanges = function() {
            window.print();
        };

        // Filter changes by category
        window.filterChangesByCategory = function(category) {
            const items = document.querySelectorAll('.change-item');
            items.forEach(item => {
                const categoryBadge = item.querySelector('.change-category');
                if (!categoryBadge) return;

                if (category === 'all' || categoryBadge.textContent.toLowerCase().includes(category.toLowerCase())) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        };

        // Show/hide undone changes
        window.toggleUndoneChanges = function() {
            const undoneItems = document.querySelectorAll('.undone-change');
            undoneItems.forEach(item => {
                item.style.display = item.style.display === 'none' ? 'block' : 'none';
            });
        };

        console.log('📋 Tracked Changes HTML loaded successfully');
        console.log('💡 Tip: Use browser print (Ctrl/Cmd+P) to print or save as PDF');
    </script>
</body>
</html>`;

        return html;
    }

    /**
     * Generate changes summary section
     */
    generateChangesSummary() {
        if (this.changes.length === 0) {
            return `<div class="changes-summary">
                <div class="summary-title">No Changes Recorded</div>
                <p style="color: #64748b;">No edits have been tracked for this press release.</p>
            </div>`;
        }

        // Group changes by field to show history
        const changesByField = {};
        this.changes.forEach(change => {
            if (!changesByField[change.field]) {
                changesByField[change.field] = [];
            }
            changesByField[change.field].push(change);
        });

        const fieldsHtml = Object.entries(changesByField).map(([field, fieldChanges]) => {
            const changesHtml = fieldChanges.map((change, index) => {
                const categoryClass = this.getCategoryClass(change.category);
                const undoneClass = change.undone ? ' undone-change' : '';
                const stepLabel = fieldChanges.length > 1 ? `Step ${index + 1} of ${fieldChanges.length}` : '';

                return `
            <div class="change-item${undoneClass}" data-change-id="${change.id}">
                <div class="change-header">
                    <div>
                        <span class="change-field">${this.formatFieldName(change.field)}</span>
                        ${stepLabel ? `<span style="color: #64748b; font-size: 12px; margin-left: 8px;">${stepLabel}</span>` : ''}
                    </div>
                    <div>
                        <span class="change-category ${categoryClass}">${change.category}</span>
                        ${change.undone ? '<span class="undone-badge">UNDONE</span>' :
                            '<button class="undo-btn" onclick="window.undoChangeFromHTML(' + change.id + ')">↩️ Undo</button>'}
                    </div>
                </div>
                <div class="change-reason">${this.escapeHtml(change.reason)}</div>
                <div class="change-comparison">
                    <div class="change-before">
                        <strong>Before:</strong><br>
                        ${this.truncateText(this.escapeHtml(change.oldValue), 150)}
                    </div>
                    <div class="change-after">
                        <strong>After:</strong><br>
                        ${this.truncateText(this.escapeHtml(change.newValue), 150)}
                    </div>
                </div>
                <div class="change-timestamp">
                    ${new Date(change.timestamp).toLocaleString()} • ${change.changeType}
                    ${change.undoneAt ? ` • Undone at ${new Date(change.undoneAt).toLocaleString()}` : ''}
                </div>
            </div>`;
            }).join('');

            return `<div class="field-changes-group">
                ${changesHtml}
            </div>`;
        }).join('');

        const activeChanges = this.changes.filter(c => !c.undone).length;
        const undoneChanges = this.changes.filter(c => c.undone).length;

        return `<div class="changes-summary">
            <div class="summary-title">
                Changes Summary
                <span style="font-weight: normal; color: #64748b; font-size: 14px;">
                    (${activeChanges} active${undoneChanges > 0 ? `, ${undoneChanges} undone` : ''})
                </span>
            </div>
            ${fieldsHtml}
        </div>`;
    }

    /**
     * Generate side-by-side comparison
     */
    generateSideBySideComparison(currentContent) {
        return `<div class="comparison-container">
            <!-- Original Content -->
            <div class="content-panel">
                <div class="panel-header original">📄 Original Content</div>
                ${this.renderContentPanel(this.originalContent, false)}
            </div>

            <!-- Final Content -->
            <div class="content-panel">
                <div class="panel-header final">✅ Final Content</div>
                ${this.renderContentPanel(currentContent, false)}
            </div>
        </div>`;
    }

    /**
     * Generate full content with inline tracked changes
     */
    generateFullContentWithTracking(currentContent) {
        return `<div class="full-content">
            <div class="content-title">📝 Full Content with Tracked Changes</div>
            <div class="press-release">
                ${this.renderContentPanel(currentContent, true)}
            </div>
        </div>`;
    }

    /**
     * Render a content panel (either original, final, or with tracking)
     */
    renderContentPanel(content, showTracking) {
        let html = '';

        // Headline
        if (content.headline) {
            html += `<div class="field-section">
                <div class="field-label">Headline</div>
                <div class="field-content">
                    <h2>${this.renderFieldWithTracking('headline', content.headline, showTracking)}</h2>
                </div>
            </div>`;
        }

        // Location and Date
        if (content.location || content.releaseDate) {
            html += `<div class="field-section">
                <div class="field-label">Dateline</div>
                <div class="field-content">
                    ${this.renderFieldWithTracking('release-location', content.location, showTracking)}
                    ${content.releaseDate ? ' – ' + content.releaseDate : ''}
                </div>
            </div>`;
        }

        // Lead Paragraph
        if (content.leadParagraph) {
            html += `<div class="field-section">
                <div class="field-label">Lead Paragraph</div>
                <div class="field-content">
                    <p>${this.renderFieldWithTracking('lead-paragraph', content.leadParagraph, showTracking)}</p>
                </div>
            </div>`;
        }

        // Supporting Details
        if (content.supportingDetails) {
            html += `<div class="field-section">
                <div class="field-label">Supporting Details</div>
                <div class="field-content">
                    <p>${this.renderFieldWithTracking('supporting-details', content.supportingDetails, showTracking)}</p>
                </div>
            </div>`;
        }

        // Quotes
        if (content.quote1 && content.spokesperson1) {
            html += `<div class="field-section">
                <div class="field-label">Quote</div>
                <div class="field-content">
                    <p><em>"${this.renderFieldWithTracking('quote-1', content.quote1, showTracking)}"</em><br>
                    — ${this.renderFieldWithTracking('spokesperson-1', content.spokesperson1, showTracking)}</p>
                </div>
            </div>`;
        }

        // Additional Info
        if (content.additionalInfo) {
            html += `<div class="field-section">
                <div class="field-label">Additional Information</div>
                <div class="field-content">
                    <p>${this.renderFieldWithTracking('additional-info', content.additionalInfo, showTracking)}</p>
                </div>
            </div>`;
        }

        // Contact
        if (content.mediaContact) {
            html += `<div class="field-section">
                <div class="field-label">Media Contact</div>
                <div class="field-content">
                    ${this.renderFieldWithTracking('media-contact', content.mediaContact, showTracking)}
                </div>
            </div>`;
        }

        return html || '<p style="color: #94a3b8;">No content available</p>';
    }

    /**
     * Render a field with tracked changes markup
     */
    renderFieldWithTracking(fieldId, currentValue, showTracking) {
        if (!showTracking) {
            return this.escapeHtml(currentValue || '');
        }

        const fieldChanges = this.getChangesForField(fieldId);
        if (fieldChanges.length === 0) {
            return this.escapeHtml(currentValue || '');
        }

        // For simplicity, show the most recent change
        const latestChange = fieldChanges[fieldChanges.length - 1];

        if (latestChange.oldValue === latestChange.newValue) {
            return this.escapeHtml(currentValue || '');
        }

        // Generate tracked change markup
        const oldText = this.escapeHtml(latestChange.oldValue);
        const newText = this.escapeHtml(latestChange.newValue);
        const annotation = `${latestChange.category}: ${latestChange.reason}`;

        return `<del title="${this.escapeHtml(annotation)}">${oldText}</del> <ins title="${this.escapeHtml(annotation)}">${newText}</ins><span class="change-annotation" title="${this.escapeHtml(annotation)}">${latestChange.category}</span>`;
    }

    /**
     * Helper: Format field name for display
     */
    formatFieldName(fieldId) {
        return fieldId.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Helper: Get CSS class for category
     */
    getCategoryClass(category) {
        const normalized = category.toLowerCase().replace(/\s+/g, '-');
        return normalized;
    }

    /**
     * Helper: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Helper: Truncate text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Export tracked changes as downloadable HTML file
     */
    async exportTrackedChanges(currentContent, filename) {
        const html = this.generateTrackedChangesHTML(currentContent);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `tracked-changes-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('✅ Tracked changes exported:', a.download);
    }

    /**
     * Clear all tracked changes
     */
    clearTracking() {
        this.originalContent = {};
        this.changes = [];
        this.isTracking = false;
        this.changeId = 0;
        console.log('🧹 Change tracking cleared');
    }
}

// Make available globally
window.ChangeTracker = ChangeTracker;
