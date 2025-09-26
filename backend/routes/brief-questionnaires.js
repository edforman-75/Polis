const express = require('express');
const router = express.Router();
const briefQuestionnaires = require('../data/brief-questionnaires');
const writerTemplates = require('../data/writer-templates');

// Get available brief questionnaire types
router.get('/types', (req, res) => {
    try {
        const types = Object.keys(briefQuestionnaires).map(key => ({
            id: key,
            title: briefQuestionnaires[key].title,
            description: briefQuestionnaires[key].description
        }));

        res.json({
            success: true,
            types
        });
    } catch (error) {
        console.error('Error fetching brief types:', error);
        res.status(500).json({ error: 'Failed to fetch brief types' });
    }
});

// Get specific brief questionnaire structure
router.get('/:type', (req, res) => {
    try {
        const { type } = req.params;

        if (!briefQuestionnaires[type]) {
            return res.status(404).json({ error: 'Brief questionnaire type not found' });
        }

        const questionnaire = briefQuestionnaires[type];

        res.json({
            success: true,
            questionnaire
        });
    } catch (error) {
        console.error('Error fetching brief questionnaire:', error);
        res.status(500).json({ error: 'Failed to fetch brief questionnaire' });
    }
});

// Generate writer template based on completed brief
router.post('/:type/generate-template', (req, res) => {
    try {
        const { type } = req.params;
        const briefData = req.body;

        if (!briefQuestionnaires[type]) {
            return res.status(404).json({ error: 'Brief questionnaire type not found' });
        }

        if (!writerTemplates[type]) {
            return res.status(404).json({ error: 'Writer template not found for this type' });
        }

        // Get the appropriate template based on brief data
        let selectedTemplate;

        switch (type) {
            case 'statement':
                // Select template based on statement purpose
                const purpose = briefData.statement_purpose;
                if (purpose === 'Response to Breaking News') {
                    selectedTemplate = writerTemplates.statement.response_breaking_news;
                } else if (purpose === 'Policy Position Announcement') {
                    selectedTemplate = writerTemplates.statement.policy_position;
                } else if (purpose === 'Crisis Response/Damage Control') {
                    selectedTemplate = writerTemplates.statement.crisis_response;
                } else {
                    selectedTemplate = writerTemplates.statement.response_breaking_news; // default
                }
                break;

            case 'talking_points_daily':
                selectedTemplate = writerTemplates.talking_points_daily;
                break;

            case 'talking_points_crisis':
                selectedTemplate = writerTemplates.talking_points_crisis;
                break;

            case 'talking_points_event':
                selectedTemplate = writerTemplates.talking_points_event;
                break;

            default:
                return res.status(400).json({ error: 'Unknown template type' });
        }

        // Process template with brief data
        const processedTemplate = processTemplate(selectedTemplate, briefData);

        res.json({
            success: true,
            template: processedTemplate,
            briefData,
            type
        });

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ error: 'Failed to generate template' });
    }
});

// Validate completed brief questionnaire
router.post('/:type/validate', (req, res) => {
    try {
        const { type } = req.params;
        const briefData = req.body;

        if (!briefQuestionnaires[type]) {
            return res.status(404).json({ error: 'Brief questionnaire type not found' });
        }

        const questionnaire = briefQuestionnaires[type];
        const validation = validateBrief(questionnaire, briefData);

        res.json({
            success: validation.isValid,
            validation
        });

    } catch (error) {
        console.error('Error validating brief:', error);
        res.status(500).json({ error: 'Failed to validate brief' });
    }
});

// Get writer templates for a specific brief type
router.get('/:type/templates', (req, res) => {
    try {
        const { type } = req.params;

        if (!writerTemplates[type]) {
            return res.status(404).json({ error: 'Templates not found for this type' });
        }

        res.json({
            success: true,
            templates: writerTemplates[type]
        });

    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Helper function to process template with brief data
function processTemplate(template, briefData) {
    const processedTemplate = JSON.parse(JSON.stringify(template)); // deep copy

    // Process each section's template string
    if (template.structure) {
        processedTemplate.structure = template.structure.map(section => {
            if (section.template) {
                section.processedTemplate = replaceVariables(section.template, briefData);
            }
            return section;
        });
    }

    // Add customization notes based on brief data
    processedTemplate.customizations = generateCustomizations(briefData);

    return processedTemplate;
}

// Replace variables in template strings
function replaceVariables(template, briefData) {
    let processed = template;

    // Replace direct brief data references
    Object.keys(briefData).forEach(key => {
        const placeholder = `{brief_data.${key}}`;
        const value = briefData[key] || '[TO BE FILLED]';
        processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    // Handle conditional statements
    processed = processed.replace(/{if\s+([^}]+)}(.*?){endif}/g, (match, condition, content) => {
        // Simple condition evaluation
        if (evaluateCondition(condition, briefData)) {
            return content;
        }
        return '';
    });

    return processed;
}

// Simple condition evaluator
function evaluateCondition(condition, briefData) {
    // Handle simple equality checks like "urgency_level === 'Critical'"
    const equalityMatch = condition.match(/(\w+)\s*===\s*'([^']+)'/);
    if (equalityMatch) {
        const [, field, value] = equalityMatch;
        return briefData[field] === value;
    }

    // Handle simple field existence checks
    const fieldMatch = condition.match(/brief_data\.(\w+)/);
    if (fieldMatch) {
        const field = fieldMatch[1];
        return briefData[field] && briefData[field].trim() !== '';
    }

    return false;
}

// Generate customization suggestions based on brief data
function generateCustomizations(briefData) {
    const customizations = [];

    if (briefData.emotional_tone) {
        customizations.push({
            type: 'tone',
            suggestion: `Adapt language and tone for "${briefData.emotional_tone}" approach`
        });
    }

    if (briefData.target_audience) {
        const audiences = Array.isArray(briefData.target_audience)
            ? briefData.target_audience
            : [briefData.target_audience];

        customizations.push({
            type: 'audience',
            suggestion: `Customize examples and language for: ${audiences.join(', ')}`
        });
    }

    if (briefData.length_guidelines) {
        customizations.push({
            type: 'length',
            suggestion: `Target length: ${briefData.length_guidelines}`
        });
    }

    if (briefData.urgency_level && briefData.urgency_level.includes('Critical')) {
        customizations.push({
            type: 'urgency',
            suggestion: 'Use urgent, action-oriented language appropriate for breaking news'
        });
    }

    return customizations;
}

// Validate completed brief questionnaire
function validateBrief(questionnaire, briefData) {
    const errors = [];
    const warnings = [];

    questionnaire.sections.forEach(section => {
        section.fields.forEach(field => {
            const value = briefData[field.id];

            // Check required fields
            if (field.required && (!value || value.trim() === '')) {
                errors.push(`${field.label} is required`);
            }

            // Check max length
            if (field.maxLength && value && value.length > field.maxLength) {
                errors.push(`${field.label} exceeds maximum length of ${field.maxLength} characters`);
            }

            // Type-specific validations
            if (field.type === 'datetime-local' && value) {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    errors.push(`${field.label} is not a valid date/time`);
                }

                // Check if approval/release dates are in the future
                if ((field.id === 'approval_deadline' || field.id === 'release_timing') && date < new Date()) {
                    warnings.push(`${field.label} is in the past`);
                }
            }
        });
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        completeness: calculateCompleteness(questionnaire, briefData)
    };
}

// Calculate brief completeness percentage
function calculateCompleteness(questionnaire, briefData) {
    let totalFields = 0;
    let completedFields = 0;

    questionnaire.sections.forEach(section => {
        section.fields.forEach(field => {
            totalFields++;
            const value = briefData[field.id];
            if (value && value.trim() !== '') {
                completedFields++;
            }
        });
    });

    return Math.round((completedFields / totalFields) * 100);
}

module.exports = router;