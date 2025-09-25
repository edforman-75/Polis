const express = require('express');
const router = express.Router();
const draftGenerator = require('../services/draft-generator');
const { requireAuth } = require('../middleware/auth');

// Generate initial draft from assignment
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { assignmentId, contentType, assignmentData } = req.body;

        if (!assignmentData) {
            return res.status(400).json({ error: 'Assignment data is required' });
        }

        // Generate the structured draft
        const draft = await draftGenerator.generateDraft(assignmentData, contentType);

        // Save the generated draft if assignmentId is provided
        if (assignmentId) {
            // TODO: Save to database with assignmentId
            // This would be implemented with your database layer
        }

        res.json({
            success: true,
            draft,
            assignmentId,
            suggestions: await draftGenerator.generateContentSuggestions(assignmentData, contentType)
        });

    } catch (error) {
        console.error('Draft generation error:', error);
        res.status(500).json({
            error: 'Failed to generate draft',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Generate draft from brief text
router.post('/from-brief', requireAuth, async (req, res) => {
    try {
        const { brief, contentType = 'press-release', additionalContext = {} } = req.body;

        if (!brief || brief.trim().length === 0) {
            return res.status(400).json({ error: 'Brief text is required' });
        }

        // Create assignment-like object from brief
        const assignmentData = {
            title: additionalContext.title || 'Draft Assignment',
            type: contentType,
            brief: brief,
            keyMessages: additionalContext.keyMessages || [],
            targetAudience: additionalContext.targetAudience || 'general public',
            priority: additionalContext.priority || 'normal',
            deadline: additionalContext.deadline || new Date().toISOString(),
            candidateProfile: additionalContext.candidateProfile || {}
        };

        const draft = await draftGenerator.generateDraft(assignmentData, contentType);

        res.json({
            success: true,
            draft,
            originalBrief: brief,
            suggestions: await draftGenerator.generateContentSuggestions(assignmentData, contentType)
        });

    } catch (error) {
        console.error('Brief-to-draft error:', error);
        res.status(500).json({
            error: 'Failed to generate draft from brief',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get content type templates
router.get('/templates/:contentType', requireAuth, async (req, res) => {
    try {
        const { contentType } = req.params;

        const templates = {
            'press-release': {
                name: 'Press Release',
                description: 'Professional media announcement',
                structure: [
                    'Headline',
                    'Dateline and lead paragraph',
                    'Supporting paragraphs',
                    'Quote from candidate',
                    'Background information',
                    'Contact information'
                ],
                estimatedLength: '300-500 words',
                writingTips: [
                    'Lead with the most newsworthy angle',
                    'Include key facts in the first paragraph',
                    'Use active voice and clear language',
                    'Include compelling quotes',
                    'End with clear contact information'
                ]
            },
            'blog-post': {
                name: 'Blog Post',
                description: 'Engaging online content for campaign website',
                structure: [
                    'Catchy title',
                    'Opening hook',
                    'Main content sections',
                    'Personal anecdotes',
                    'Call to action'
                ],
                estimatedLength: '500-800 words',
                writingTips: [
                    'Write in conversational tone',
                    'Use subheadings for easy scanning',
                    'Include personal stories',
                    'End with clear next steps',
                    'Optimize for social sharing'
                ]
            },
            'speech': {
                name: 'Speech',
                description: 'Prepared remarks for public speaking',
                structure: [
                    'Strong opening',
                    'Personal connection',
                    'Main points with evidence',
                    'Audience interaction',
                    'Memorable closing'
                ],
                estimatedLength: '5-10 minutes (750-1500 words)',
                writingTips: [
                    'Write for the ear, not the eye',
                    'Include pauses and emphasis marks',
                    'Practice timing',
                    'Prepare for audience reaction',
                    'End with inspiring call to action'
                ]
            },
            'op-ed': {
                name: 'Opinion Editorial',
                description: 'Persuasive piece for newspaper publication',
                structure: [
                    'Compelling headline',
                    'Strong thesis statement',
                    'Supporting arguments',
                    'Counter-argument acknowledgment',
                    'Solutions-focused conclusion'
                ],
                estimatedLength: '600-800 words',
                writingTips: [
                    'Hook readers with current events',
                    'Establish your credibility early',
                    'Use specific examples and data',
                    'Address opposing viewpoints',
                    'Focus on solutions, not just problems'
                ]
            },
            'newsletter': {
                name: 'Newsletter',
                description: 'Regular communication with supporters',
                structure: [
                    'Personal greeting',
                    'Main story/update',
                    'Additional brief updates',
                    'Community spotlight',
                    'Upcoming events',
                    'Call to action'
                ],
                estimatedLength: '400-600 words',
                writingTips: [
                    'Keep tone personal and friendly',
                    'Include variety of content types',
                    'Highlight community involvement',
                    'Make it easy to take action',
                    'Include social media links'
                ]
            }
        };

        const template = templates[contentType];
        if (!template) {
            return res.status(404).json({ error: 'Content type template not found' });
        }

        res.json(template);

    } catch (error) {
        console.error('Template retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve template' });
    }
});

// Get all available content types
router.get('/content-types', requireAuth, async (req, res) => {
    try {
        const contentTypes = [
            { id: 'press-release', name: 'Press Release', icon: '📰' },
            { id: 'blog-post', name: 'Blog Post', icon: '📝' },
            { id: 'speech', name: 'Speech', icon: '🎤' },
            { id: 'op-ed', name: 'Opinion Editorial', icon: '📄' },
            { id: 'newsletter', name: 'Newsletter', icon: '📧' },
            { id: 'social-media', name: 'Social Media', icon: '📱' }
        ];

        res.json(contentTypes);

    } catch (error) {
        console.error('Content types error:', error);
        res.status(500).json({ error: 'Failed to retrieve content types' });
    }
});

module.exports = router;