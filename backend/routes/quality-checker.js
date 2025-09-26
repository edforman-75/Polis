const express = require('express');
const router = express.Router();
const contentQualityChecker = require('../services/content-quality-checker');

// Analyze content quality
router.post('/analyze', async (req, res) => {
    try {
        const {
            content,
            assignmentType,
            briefData = null,
            additionalCheckers = [],
            options = {}
        } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        if (!assignmentType) {
            return res.status(400).json({ error: 'Assignment type is required' });
        }

        const analysis = await contentQualityChecker.analyzeContent(
            content,
            assignmentType,
            briefData,
            additionalCheckers
        );

        res.json({
            success: true,
            analysis,
            metadata: {
                contentLength: content.length,
                wordCount: content.split(/\s+/).length,
                analysisTime: new Date().toISOString(),
                assignmentType,
                checkersUsed: ['content_quality', ...additionalCheckers.map(c => c.name)]
            }
        });

    } catch (error) {
        console.error('Quality analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze content quality',
            details: error.message
        });
    }
});

// Quick check for real-time feedback
router.post('/quick-check', async (req, res) => {
    try {
        const { content, assignmentType } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const quickAnalysis = await contentQualityChecker.quickCheck(content, assignmentType || 'general');

        res.json({
            success: true,
            quickAnalysis,
            metadata: {
                contentLength: content.length,
                wordCount: content.split(/\s+/).length,
                analysisTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Quick check error:', error);
        res.status(500).json({
            error: 'Failed to perform quick check',
            details: error.message
        });
    }
});

// Get available criteria for assignment type
router.get('/criteria/:assignmentType', (req, res) => {
    try {
        const { assignmentType } = req.params;
        const qualityCriteria = require('../data/quality-criteria');

        const criteria = qualityCriteria[assignmentType];
        if (!criteria) {
            return res.status(404).json({
                error: `No quality criteria found for assignment type: ${assignmentType}`,
                availableTypes: Object.keys(qualityCriteria)
            });
        }

        // Return criteria structure (without the actual check functions)
        const criteriaInfo = {
            critical_requirements: criteria.critical_requirements.map(req => ({
                name: req.name,
                description: req.description,
                weight: req.weight
            })),
            quality_indicators: criteria.quality_indicators ? criteria.quality_indicators.map(ind => ({
                name: ind.name,
                description: ind.description,
                weight: ind.weight
            })) : [],
            length_standards: criteria.length_standards || null
        };

        res.json({
            success: true,
            assignmentType,
            criteria: criteriaInfo
        });

    } catch (error) {
        console.error('Criteria fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch quality criteria',
            details: error.message
        });
    }
});

// Get all available assignment types with criteria
router.get('/assignment-types', (req, res) => {
    try {
        const qualityCriteria = require('../data/quality-criteria');

        const assignmentTypes = Object.keys(qualityCriteria).map(type => {
            const criteria = qualityCriteria[type];
            return {
                type,
                criticalRequirementsCount: criteria.critical_requirements ? criteria.critical_requirements.length : 0,
                qualityIndicatorsCount: criteria.quality_indicators ? criteria.quality_indicators.length : 0,
                hasLengthStandards: !!criteria.length_standards
            };
        });

        res.json({
            success: true,
            assignmentTypes
        });

    } catch (error) {
        console.error('Assignment types fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch assignment types',
            details: error.message
        });
    }
});

// Get available additional checker types
router.get('/checker-types', (req, res) => {
    try {
        const checkerTypes = [
            {
                type: 'voice_consistency',
                name: 'Candidate Voice Checker',
                description: 'Analyzes voice consistency and authenticity against candidate profile',
                status: 'active'
            },
            {
                type: 'fact_sourcing',
                name: 'Fact Sourcing Checker',
                description: 'Identifies factual claims and suggests credible sources for verification',
                status: 'active'
            },
            {
                type: 'fec_compliance',
                name: 'FEC Compliance Checker',
                description: 'Checks for potential Federal Election Commission violations',
                status: 'active'
            },
            {
                type: 'ldjs_markup',
                name: 'LD-JSON Markup Analyzer',
                description: 'Suggests structured data markup for AI chatbot optimization',
                status: 'active'
            },
            {
                type: 'accessibility',
                name: 'Accessibility Checker',
                description: 'Checks content for accessibility compliance',
                status: 'planned'
            },
            {
                type: 'seo',
                name: 'SEO Optimization',
                description: 'Analyzes content for search engine optimization',
                status: 'planned'
            },
            {
                type: 'fact_check',
                name: 'Fact Verification',
                description: 'Verifies factual claims and statistics',
                status: 'planned'
            },
            {
                type: 'tone_analysis',
                name: 'Advanced Tone Analysis',
                description: 'Deep analysis of tone and emotional impact',
                status: 'planned'
            },
            {
                type: 'compliance',
                name: 'Legal/Regulatory Compliance',
                description: 'Checks for legal and regulatory compliance issues',
                status: 'planned'
            }
        ];

        res.json({
            success: true,
            checkerTypes
        });

    } catch (error) {
        console.error('Checker types fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch checker types',
            details: error.message
        });
    }
});

// Batch analysis for multiple content pieces
router.post('/batch-analyze', async (req, res) => {
    try {
        const { contentItems, options = {} } = req.body;

        if (!Array.isArray(contentItems) || contentItems.length === 0) {
            return res.status(400).json({ error: 'Content items array is required' });
        }

        const results = [];

        for (const [index, item] of contentItems.entries()) {
            try {
                const analysis = await contentQualityChecker.analyzeContent(
                    item.content,
                    item.assignmentType,
                    item.briefData || null,
                    item.additionalCheckers || []
                );

                results.push({
                    id: item.id || `item_${index}`,
                    success: true,
                    analysis
                });

            } catch (itemError) {
                console.error(`Batch item ${index} analysis failed:`, itemError);
                results.push({
                    id: item.id || `item_${index}`,
                    success: false,
                    error: itemError.message
                });
            }
        }

        // Calculate batch summary
        const successfulAnalyses = results.filter(r => r.success);
        const averageScore = successfulAnalyses.length > 0
            ? Math.round(successfulAnalyses.reduce((sum, r) => sum + r.analysis.overallScore, 0) / successfulAnalyses.length)
            : 0;

        const totalCriticalIssues = successfulAnalyses.reduce((sum, r) => sum + r.analysis.criticalIssues.length, 0);

        res.json({
            success: true,
            results,
            summary: {
                totalItems: contentItems.length,
                successfulAnalyses: successfulAnalyses.length,
                failedAnalyses: results.length - successfulAnalyses.length,
                averageScore,
                totalCriticalIssues,
                analysisTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Batch analysis error:', error);
        res.status(500).json({
            error: 'Failed to perform batch analysis',
            details: error.message
        });
    }
});

// Get quality score interpretation guide
router.get('/score-guide', (req, res) => {
    try {
        const scoreGuide = {
            ranges: [
                {
                    min: 90,
                    max: 100,
                    level: 'Excellent',
                    readiness: 'ready_for_approval',
                    description: 'Content meets all requirements and best practices',
                    color: '#10b981'
                },
                {
                    min: 80,
                    max: 89,
                    level: 'Good',
                    readiness: 'ready_for_review',
                    description: 'Strong content with minor improvement opportunities',
                    color: '#3b82f6'
                },
                {
                    min: 70,
                    max: 79,
                    level: 'Satisfactory',
                    readiness: 'needs_improvement',
                    description: 'Meets basic requirements but has room for improvement',
                    color: '#f59e0b'
                },
                {
                    min: 50,
                    max: 69,
                    level: 'Needs Work',
                    readiness: 'needs_revision',
                    description: 'Content has significant issues that should be addressed',
                    color: '#ef4444'
                },
                {
                    min: 0,
                    max: 49,
                    level: 'Poor',
                    readiness: 'needs_major_revision',
                    description: 'Content requires substantial revision before publication',
                    color: '#dc2626'
                }
            ],
            readinessLevels: {
                ready_for_approval: 'Content is ready for final approval and publication',
                ready_for_review: 'Content is ready for editorial review',
                needs_improvement: 'Content needs targeted improvements',
                needs_revision: 'Content requires significant revision',
                needs_major_revision: 'Content needs to be substantially rewritten'
            }
        };

        res.json({
            success: true,
            scoreGuide
        });

    } catch (error) {
        console.error('Score guide fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch score guide',
            details: error.message
        });
    }
});

// Voice consistency analysis endpoint
router.post('/voice-analysis', async (req, res) => {
    try {
        const {
            content,
            assignmentType,
            candidateProfile = null,
            briefData = null,
            options = {}
        } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        if (!assignmentType) {
            return res.status(400).json({ error: 'Assignment type is required' });
        }

        const candidateVoiceChecker = require('../services/candidate-voice-checker');

        const voiceAnalysis = await candidateVoiceChecker.analyzeVoiceConsistency(
            content,
            assignmentType,
            candidateProfile,
            briefData
        );

        res.json({
            success: true,
            voiceAnalysis,
            metadata: {
                contentLength: content.length,
                wordCount: content.split(/\s+/).length,
                analysisTime: new Date().toISOString(),
                assignmentType,
                candidateProfileUsed: !!candidateProfile
            }
        });

    } catch (error) {
        console.error('Voice analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze voice consistency',
            details: error.message
        });
    }
});

// Quote authenticity analysis endpoint
router.post('/quote-authenticity', async (req, res) => {
    try {
        const {
            quotes,
            candidateProfile = null,
            context = 'general'
        } = req.body;

        if (!Array.isArray(quotes) || quotes.length === 0) {
            return res.status(400).json({ error: 'Quotes array is required' });
        }

        const candidateVoiceChecker = require('../services/candidate-voice-checker');

        const results = [];
        for (const quote of quotes) {
            const analysis = await candidateVoiceChecker.analyzeQuoteAuthenticity(
                quote.text,
                candidateProfile,
                context
            );
            results.push({
                id: quote.id || `quote_${results.length}`,
                text: quote.text,
                analysis
            });
        }

        res.json({
            success: true,
            results,
            summary: {
                totalQuotes: quotes.length,
                averageAuthenticityScore: Math.round(
                    results.reduce((sum, r) => sum + r.analysis.authenticityScore, 0) / results.length
                ),
                flaggedQuotes: results.filter(r => r.analysis.authenticityScore < 70).length,
                analysisTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Quote authenticity analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze quote authenticity',
            details: error.message
        });
    }
});

// Candidate profile management endpoints
router.post('/candidate-profile', async (req, res) => {
    try {
        const {
            candidateId,
            profile
        } = req.body;

        if (!candidateId || !profile) {
            return res.status(400).json({ error: 'Candidate ID and profile are required' });
        }

        // In a real implementation, this would save to a database
        // For now, we'll return a success response
        res.json({
            success: true,
            message: 'Candidate profile saved successfully',
            candidateId,
            profileSummary: {
                vocabularyTermsCount: profile.vocabulary ? profile.vocabulary.length : 0,
                rhetoricPatternsCount: profile.rhetoric ? profile.rhetoric.length : 0,
                toneIndicatorsCount: profile.tone ? profile.tone.length : 0,
                contextualVariationsCount: profile.contextualVariations ? Object.keys(profile.contextualVariations).length : 0
            }
        });

    } catch (error) {
        console.error('Candidate profile save error:', error);
        res.status(500).json({
            error: 'Failed to save candidate profile',
            details: error.message
        });
    }
});

router.get('/candidate-profile/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;

        // In a real implementation, this would fetch from a database
        // For now, we'll return a sample profile structure
        const sampleProfile = {
            candidateId,
            vocabulary: [
                { term: 'working families', frequency: 'high', context: ['statements', 'speeches'] },
                { term: 'common sense solutions', frequency: 'medium', context: ['all'] }
            ],
            rhetoric: [
                { pattern: 'problem-solution-action', usage: 'statements' },
                { pattern: 'local-example-broader-impact', usage: 'speeches' }
            ],
            tone: [
                { indicator: 'optimistic', strength: 'high', contexts: ['all'] },
                { indicator: 'direct', strength: 'medium', contexts: ['press_releases'] }
            ],
            contextualVariations: {
                formal_speech: { tone: 'elevated', complexity: 'high' },
                social_media: { tone: 'conversational', complexity: 'low' },
                press_release: { tone: 'professional', complexity: 'medium' }
            }
        };

        res.json({
            success: true,
            profile: sampleProfile,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Candidate profile fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch candidate profile',
            details: error.message
        });
    }
});

module.exports = router;