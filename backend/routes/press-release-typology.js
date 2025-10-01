const express = require('express');
const router = express.Router();
const { pressReleaseTypology, mandatoryFields } = require('../data/press-release-typology');

// Get press release typology data
router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            typology: pressReleaseTypology,
            mandatoryFields: mandatoryFields
        });
    } catch (error) {
        console.error('Error getting press release typology:', error);
        res.status(500).json({ error: 'Failed to get press release typology' });
    }
});

// Get specific press release type details
router.get('/type/:typeId', (req, res) => {
    try {
        const { typeId } = req.params;

        if (!pressReleaseTypology[typeId]) {
            return res.status(404).json({ error: 'Press release type not found' });
        }

        res.json({
            success: true,
            type: pressReleaseTypology[typeId],
            mandatoryFields: mandatoryFields
        });
    } catch (error) {
        console.error('Error getting press release type:', error);
        res.status(500).json({ error: 'Failed to get press release type' });
    }
});

// Generate type-specific briefing form
router.get('/type/:typeId/briefing-form', (req, res) => {
    try {
        const { typeId } = req.params;

        if (!pressReleaseTypology[typeId]) {
            return res.status(404).json({ error: 'Press release type not found' });
        }

        const typeData = pressReleaseTypology[typeId];

        // Generate dynamic form based on type-specific requirements
        const briefingForm = {
            typeId: typeId,
            title: typeData.title,
            strategic_purpose: typeData.strategic_purpose,
            narrative_structure: typeData.narrative_structure,
            sections: [
                {
                    section: "Strategic Overview",
                    fields: [
                        {
                            id: "strategic_purpose_understanding",
                            label: "Strategic Purpose Confirmation",
                            type: "textarea",
                            required: true,
                            helpText: `Confirm understanding: ${typeData.strategic_purpose}`,
                            prefill: typeData.strategic_purpose
                        },
                        {
                            id: "narrative_approach",
                            label: "Narrative Structure Approach",
                            type: "select",
                            required: true,
                            options: [`${typeData.narrative_structure} (Recommended)`, "Custom Approach"],
                            helpText: `This type typically follows the "${typeData.narrative_structure}" structure`
                        }
                    ]
                },
                {
                    section: "Type-Specific Requirements",
                    fields: typeData.briefing_requirements.map((req, index) => ({
                        id: `requirement_${index}`,
                        label: req,
                        type: "textarea",
                        required: index < 5, // First 5 are required
                        helpText: "Provide detailed information for this requirement"
                    }))
                },
                {
                    section: "Key Strategic Questions",
                    fields: typeData.key_questions.map((question, index) => ({
                        id: `key_question_${index}`,
                        label: question,
                        type: "textarea",
                        required: true,
                        helpText: "Provide a comprehensive answer to guide the writing"
                    }))
                },
                {
                    section: "Narrative Structure Planning",
                    fields: typeData.narrative_steps.map((step, index) => ({
                        id: `narrative_step_${index}`,
                        label: `${step.name}`,
                        type: "textarea",
                        required: true,
                        helpText: `${step.description} - Plan the content for this narrative element`
                    }))
                },
                {
                    section: "Technical Requirements",
                    fields: mandatoryFields.map((field, index) => ({
                        id: `mandatory_${index}`,
                        label: field.name,
                        type: field.name === "Headline" ? "text" : "textarea",
                        required: true,
                        helpText: field.description,
                        maxLength: field.name === "Headline" ? 100 : undefined
                    }))
                }
            ]
        };

        res.json({
            success: true,
            briefingForm: briefingForm,
            exampleOpening: typeData.example_opening
        });
    } catch (error) {
        console.error('Error generating briefing form:', error);
        res.status(500).json({ error: 'Failed to generate briefing form' });
    }
});

module.exports = router;