/**
 * Suggestion Sorter - Sorts and groups suggestions based on user preferences
 */

export class SuggestionSorter {
    constructor(settings) {
        this.settings = settings || {
            suggestions_sort_order: 'severity',
            group_suggestions_by: 'category',
            show_accepted_suggestions: false,
            collapse_low_priority: true,
            min_confidence_to_show: 0.5
        };
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Filter, sort, and group suggestions based on settings
     * @param {Array} suggestions - Raw suggestions from AI/checks
     * @returns {Object} - Grouped and sorted suggestions
     */
    processSuggestions(suggestions) {
        // Filter by confidence threshold and accepted status
        let filtered = suggestions.filter(s => {
            if (s.accepted && !this.settings.show_accepted_suggestions) {
                return false;
            }
            if (s.confidence !== undefined && s.confidence < this.settings.min_confidence_to_show) {
                return false;
            }
            return true;
        });

        // Sort suggestions
        filtered = this.sortSuggestions(filtered);

        // Group suggestions
        return this.groupSuggestions(filtered);
    }

    /**
     * Sort suggestions based on sort order setting
     */
    sortSuggestions(suggestions) {
        const sortOrder = this.settings.suggestions_sort_order;

        switch (sortOrder) {
            case 'severity':
                return this.sortBySeverity(suggestions);

            case 'field-order':
                return this.sortByFieldOrder(suggestions);

            case 'category':
                return this.sortByCategory(suggestions);

            case 'confidence':
                return this.sortByConfidence(suggestions);

            case 'alphabetical':
                return this.sortAlphabetically(suggestions);

            default:
                return suggestions;
        }
    }

    /**
     * Sort by severity (Error > Warning > Suggestion)
     */
    sortBySeverity(suggestions) {
        const severityOrder = { 'error': 1, 'warning': 2, 'suggestion': 3 };

        return [...suggestions].sort((a, b) => {
            const orderA = severityOrder[a.severity] || 999;
            const orderB = severityOrder[b.severity] || 999;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // Secondary sort by field order
            return this.getFieldOrder(a.field) - this.getFieldOrder(b.field);
        });
    }

    /**
     * Sort by field order (top to bottom in document)
     */
    sortByFieldOrder(suggestions) {
        return [...suggestions].sort((a, b) => {
            const orderA = this.getFieldOrder(a.field);
            const orderB = this.getFieldOrder(b.field);

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // Secondary sort by severity
            const severityOrder = { 'error': 1, 'warning': 2, 'suggestion': 3 };
            return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
        });
    }

    /**
     * Sort by category
     */
    sortByCategory(suggestions) {
        const categoryOrder = {
            'ap-style': 1,
            'grammar': 2,
            'voice': 3,
            'enhancement': 4,
            'political': 5,
            'seo': 6
        };

        return [...suggestions].sort((a, b) => {
            const orderA = categoryOrder[a.category] || 999;
            const orderB = categoryOrder[b.category] || 999;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // Secondary sort by severity
            const severityOrder = { 'error': 1, 'warning': 2, 'suggestion': 3 };
            return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
        });
    }

    /**
     * Sort by confidence (highest first)
     */
    sortByConfidence(suggestions) {
        return [...suggestions].sort((a, b) => {
            const confA = a.confidence !== undefined ? a.confidence : 1.0;
            const confB = b.confidence !== undefined ? b.confidence : 1.0;

            if (confB !== confA) {
                return confB - confA; // Descending
            }

            // Secondary sort by severity
            const severityOrder = { 'error': 1, 'warning': 2, 'suggestion': 3 };
            return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
        });
    }

    /**
     * Sort alphabetically by field name
     */
    sortAlphabetically(suggestions) {
        return [...suggestions].sort((a, b) => {
            const fieldCompare = (a.field || '').localeCompare(b.field || '');

            if (fieldCompare !== 0) {
                return fieldCompare;
            }

            // Secondary sort by severity
            const severityOrder = { 'error': 1, 'warning': 2, 'suggestion': 3 };
            return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
        });
    }

    /**
     * Group suggestions based on grouping setting
     */
    groupSuggestions(suggestions) {
        const groupBy = this.settings.group_suggestions_by;

        switch (groupBy) {
            case 'category':
                return this.groupByCategory(suggestions);

            case 'field':
                return this.groupByField(suggestions);

            case 'severity':
                return this.groupBySeverity(suggestions);

            case 'none':
                return { 'All Suggestions': suggestions };

            default:
                return this.groupByCategory(suggestions);
        }
    }

    /**
     * Group by category
     */
    groupByCategory(suggestions) {
        const grouped = {};

        suggestions.forEach(s => {
            const category = this.formatCategoryName(s.category);
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(s);
        });

        return grouped;
    }

    /**
     * Group by field
     */
    groupByField(suggestions) {
        const grouped = {};

        suggestions.forEach(s => {
            const field = this.formatFieldName(s.field);
            if (!grouped[field]) {
                grouped[field] = [];
            }
            grouped[field].push(s);
        });

        return grouped;
    }

    /**
     * Group by severity
     */
    groupBySeverity(suggestions) {
        const grouped = {
            'Errors': [],
            'Warnings': [],
            'Suggestions': []
        };

        suggestions.forEach(s => {
            if (s.severity === 'error') {
                grouped['Errors'].push(s);
            } else if (s.severity === 'warning') {
                grouped['Warnings'].push(s);
            } else {
                grouped['Suggestions'].push(s);
            }
        });

        // Remove empty groups
        Object.keys(grouped).forEach(key => {
            if (grouped[key].length === 0) {
                delete grouped[key];
            }
        });

        return grouped;
    }

    /**
     * Get field order (for sorting by document position)
     */
    getFieldOrder(fieldName) {
        const fieldOrder = {
            'headline': 1,
            'subheadline': 2,
            'dateline': 3,
            'location': 4,
            'date': 5,
            'lead_paragraph': 6,
            'lead': 7,
            'body_text': 8,
            'body': 9,
            'quote_1': 10,
            'quote_1_attribution': 11,
            'quote_2': 12,
            'quote_2_attribution': 13,
            'quote_3': 14,
            'quote_3_attribution': 15,
            'boilerplate': 16,
            'contact_name': 17,
            'contact_title': 18,
            'contact_email': 19,
            'contact_phone': 20
        };

        return fieldOrder[fieldName] || 999;
    }

    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        const names = {
            'ap-style': '📝 AP Style',
            'grammar': '✍️ Grammar & Spelling',
            'voice': '🎤 Voice & Tone',
            'enhancement': '✨ Content Enhancement',
            'political': '🏛️ Political Content',
            'seo': '🔍 SEO & Distribution'
        };

        return names[category] || category;
    }

    /**
     * Format field name for display
     */
    formatFieldName(field) {
        return field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Check if a group should be collapsed by default
     */
    shouldCollapseGroup(groupName, suggestions) {
        if (!this.settings.collapse_low_priority) {
            return false;
        }

        // Collapse enhancement groups by default
        if (groupName.includes('Enhancement') || groupName.includes('SEO')) {
            return true;
        }

        // Collapse groups with only suggestions (no errors/warnings)
        const hasErrors = suggestions.some(s => s.severity === 'error' || s.severity === 'warning');
        return !hasErrors;
    }

    /**
     * Get summary counts for display
     */
    getSummaryCounts(suggestions) {
        return {
            total: suggestions.length,
            errors: suggestions.filter(s => s.severity === 'error').length,
            warnings: suggestions.filter(s => s.severity === 'warning').length,
            suggestions: suggestions.filter(s => s.severity === 'suggestion').length,
            accepted: suggestions.filter(s => s.accepted).length
        };
    }
}
