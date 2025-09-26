/**
 * Content Quality Checker
 * AI-powered analysis of political content against best practices
 * Extensible system for multiple checker types
 */

const aiService = require('./ai-service');
const qualityCriteria = require('../data/quality-criteria');
const candidateVoiceChecker = require('./candidate-voice-checker');

class ContentQualityChecker {
    constructor() {
        // Legacy rules for backward compatibility - will be phased out
        this.qualityRules = {
            statement: {
                structure: {
                    required_elements: ['opening_position', 'evidence_support', 'call_to_action', 'closing'],
                    optimal_length: { min: 200, max: 600 },
                    paragraph_count: { min: 3, max: 6 }
                },
                messaging: {
                    lead_with_solution: true,
                    active_voice_preference: true,
                    specific_facts_required: true,
                    local_impact_inclusion: true
                },
                tone: {
                    avoid_defensive_language: true,
                    forward_looking: true,
                    confident_authority: true
                }
            },
            talking_points: {
                structure: {
                    motd_length: { max: 150 },
                    priority_messages: { max: 3 },
                    quick_hitters: { min: 5, max: 7 },
                    required_sections: ['header', 'motd', 'priorities', 'quick_hitters', 'opposition_response']
                },
                messaging: {
                    message_discipline: true,
                    pivot_strategies_required: true,
                    surrogate_friendly: true,
                    media_ready: true
                },
                distribution: {
                    tier_appropriate: true,
                    classification_clear: true,
                    update_frequency: true
                }
            },
            speech: {
                structure: {
                    teleprompter_friendly: true,
                    timing_cues: true,
                    audience_engagement: true,
                    applause_lines: true
                },
                delivery: {
                    readable_formatting: true,
                    pause_notations: true,
                    emphasis_markers: true
                }
            },
            press_release: {
                structure: {
                    inverted_pyramid: true,
                    news_value: true,
                    ap_style: true,
                    quote_attribution: true
                },
                content: {
                    newsworthy_angle: true,
                    local_relevance: true,
                    contact_information: true
                }
            }
        };

        this.commonIssues = {
            political_pitfalls: [
                'defensive language patterns',
                'repeating opponent attacks',
                'unclear policy positions',
                'missing local connections',
                'weak call to action',
                'overly complex messaging',
                'off-brand voice',
                'factual inconsistencies'
            ],
            messaging_problems: [
                'buried lede',
                'passive voice overuse',
                'jargon and buzzwords',
                'missing evidence',
                'unclear target audience',
                'mixed messages',
                'poor timing awareness',
                'inadequate contrast'
            ]
        };
    }

    async analyzeContent(content, assignmentType, briefData = null, additionalCheckers = []) {
        try {
            const analysis = {
                overallScore: 0,
                criticalIssues: [],
                improvementOpportunities: [],
                strengths: [],
                specificSuggestions: [],
                readinessLevel: 'draft',
                detailedAnalysis: {},
                checkerResults: {}
            };

            // Run main content quality analysis using specific criteria
            const criteriaAnalysis = await this.analyzeByCriteria(content, assignmentType, briefData);
            analysis.detailedAnalysis = criteriaAnalysis;

            // Run additional checkers (extensible for future checker types)
            for (const checker of additionalCheckers) {
                try {
                    const checkerResult = await this.runAdditionalChecker(content, assignmentType, checker, briefData);
                    analysis.checkerResults[checker.name] = checkerResult;
                } catch (checkerError) {
                    console.error(`Checker ${checker.name} failed:`, checkerError);
                    analysis.checkerResults[checker.name] = { error: checkerError.message };
                }
            }

            // Run AI-powered comprehensive analysis
            const aiAnalysis = await this.runAIAnalysis(content, assignmentType, briefData);

            // Combine all analyses
            analysis.overallScore = this.calculateCombinedScore(criteriaAnalysis, aiAnalysis, analysis.checkerResults);
            analysis.criticalIssues = [
                ...criteriaAnalysis.criticalIssues,
                ...aiAnalysis.criticalIssues,
                ...this.extractAdditionalCheckerIssues(analysis.checkerResults, 'critical')
            ];
            analysis.improvementOpportunities = [
                ...criteriaAnalysis.suggestions,
                ...aiAnalysis.suggestions,
                ...this.extractAdditionalCheckerIssues(analysis.checkerResults, 'suggestion')
            ];
            analysis.strengths = aiAnalysis.strengths || [];

            // Generate specific, actionable suggestions
            analysis.specificSuggestions = await this.generateSpecificSuggestions(content, analysis, assignmentType);

            // Determine readiness level
            analysis.readinessLevel = this.determineReadinessLevel(analysis.overallScore, analysis.criticalIssues);

            return analysis;

        } catch (error) {
            console.error('Content quality analysis error:', error);
            return {
                overallScore: 0,
                criticalIssues: ['Analysis failed - please review manually'],
                improvementOpportunities: [],
                strengths: [],
                specificSuggestions: [],
                readinessLevel: 'needs_review',
                error: error.message
            };
        }
    }

    async analyzeByCriteria(content, assignmentType, briefData) {
        const criteria = qualityCriteria[assignmentType];
        if (!criteria) {
            return {
                criticalIssues: [`No quality criteria found for assignment type: ${assignmentType}`],
                suggestions: [],
                score: 50,
                criteriaResults: []
            };
        }

        const analysis = {
            criticalIssues: [],
            suggestions: [],
            criteriaResults: [],
            totalScore: 0,
            totalWeight: 0
        };

        // Check critical requirements
        for (const requirement of criteria.critical_requirements) {
            const result = requirement.check(content, briefData);
            const criteriaResult = {
                name: requirement.name,
                description: requirement.description,
                passes: result.passes,
                message: result.message,
                weight: requirement.weight,
                type: 'critical'
            };

            analysis.criteriaResults.push(criteriaResult);

            if (!result.passes) {
                analysis.criticalIssues.push(`${requirement.name}: ${result.message}`);
            }

            // Weight contributes to score only if passed
            if (result.passes) {
                analysis.totalScore += requirement.weight;
            }
            analysis.totalWeight += requirement.weight;
        }

        // Check quality indicators (non-critical)
        if (criteria.quality_indicators) {
            for (const indicator of criteria.quality_indicators) {
                const result = indicator.check(content, briefData);
                const criteriaResult = {
                    name: indicator.name,
                    description: indicator.description,
                    score: result.score,
                    message: result.message,
                    weight: indicator.weight,
                    type: 'quality'
                };

                analysis.criteriaResults.push(criteriaResult);

                if (result.score < 70) {
                    analysis.suggestions.push(`${indicator.name}: ${result.message}`);
                }

                // Add weighted score
                analysis.totalScore += (result.score * indicator.weight) / 100;
                analysis.totalWeight += indicator.weight;
            }
        }

        // Calculate final score as percentage
        analysis.score = analysis.totalWeight > 0 ? Math.round((analysis.totalScore / analysis.totalWeight) * 100) : 0;

        return analysis;
    }

    async runAdditionalChecker(content, assignmentType, checker, briefData) {
        // Extensible method for running additional checker types
        // Future checkers can be plugged in here
        switch (checker.type) {
            case 'voice_consistency':
                return await this.runVoiceChecker(content, assignmentType, checker.options, briefData);
            case 'fact_sourcing':
                return await this.runFactSourcingChecker(content, checker.options);
            case 'fec_compliance':
                return await this.runFECComplianceChecker(content, assignmentType, checker.options);
            case 'ldjs_markup':
                return await this.runLDJSMarkupChecker(content, assignmentType, checker.options);
            case 'accessibility':
                return await this.runAccessibilityChecker(content, checker.options);
            case 'seo':
                return await this.runSEOChecker(content, checker.options);
            case 'fact_check':
                return await this.runFactChecker(content, checker.options);
            case 'tone_analysis':
                return await this.runToneChecker(content, checker.options);
            case 'compliance':
                return await this.runComplianceChecker(content, assignmentType, checker.options);
            default:
                throw new Error(`Unknown checker type: ${checker.type}`);
        }
    }

    // Voice consistency checker integration
    async runVoiceChecker(content, assignmentType, options = {}, briefData = null) {
        try {
            const candidateProfile = options.candidateProfile || null;
            const voiceResult = await candidateVoiceChecker.analyzeVoiceConsistency(
                content,
                assignmentType,
                candidateProfile,
                briefData
            );

            return {
                score: voiceResult.overallScore,
                issues: voiceResult.inconsistencies.map(issue => `Voice: ${issue.description}`),
                suggestions: voiceResult.suggestions.map(suggestion => `Voice: ${suggestion.recommendation}`),
                details: {
                    vocabulary: voiceResult.vocabularyAnalysis,
                    rhetoric: voiceResult.rhetoricAnalysis,
                    tone: voiceResult.toneAnalysis,
                    authenticity: voiceResult.authenticityScore
                }
            };
        } catch (error) {
            console.error('Voice checker error:', error);
            return { score: 100, issues: [], suggestions: [], error: error.message };
        }
    }

    // Fact sourcing checker for credible source verification
    async runFactSourcingChecker(content, options = {}) {
        try {
            const facts = this.extractFactualClaims(content);
            const issues = [];
            const suggestions = [];
            const sources = [];
            let score = 100;

            for (const fact of facts) {
                const sourcingResult = await this.findSourceForClaim(fact, options);

                if (!sourcingResult.found) {
                    issues.push(`Unsourced claim: "${fact.text.substring(0, 50)}..."`);
                    score -= 15;
                    suggestions.push(`Verify and source the claim: "${fact.text.substring(0, 50)}..."`);
                } else if (!sourcingResult.credible) {
                    issues.push(`Questionable source for: "${fact.text.substring(0, 50)}..."`);
                    score -= 10;
                    suggestions.push(`Find a more credible source for: "${fact.text.substring(0, 50)}..."`);
                } else {
                    sources.push({
                        claim: fact.text,
                        source: sourcingResult.source,
                        credibilityScore: sourcingResult.credibilityScore
                    });
                }
            }

            return {
                score: Math.max(0, score),
                issues,
                suggestions,
                details: {
                    factsFound: facts.length,
                    sourcedFacts: sources.length,
                    sources: sources
                }
            };
        } catch (error) {
            console.error('Fact sourcing checker error:', error);
            return { score: 100, issues: [], suggestions: [], error: error.message };
        }
    }

    // FEC compliance checker for campaign law violations
    async runFECComplianceChecker(content, assignmentType, options = {}) {
        try {
            const issues = [];
            const suggestions = [];
            let score = 100;

            // Check for common FEC violations
            const violations = this.checkFECViolations(content, assignmentType);

            for (const violation of violations) {
                if (violation.severity === 'critical') {
                    issues.push(`FEC Violation: ${violation.description}`);
                    score -= 25;
                } else {
                    suggestions.push(`FEC Concern: ${violation.description}`);
                    score -= 10;
                }
            }

            return {
                score: Math.max(0, score),
                issues,
                suggestions,
                details: {
                    violationsFound: violations.length,
                    criticalViolations: violations.filter(v => v.severity === 'critical').length,
                    warnings: violations.filter(v => v.severity === 'warning').length
                }
            };
        } catch (error) {
            console.error('FEC compliance checker error:', error);
            return { score: 100, issues: [], suggestions: [], error: error.message };
        }
    }

    // LD-JSON markup analyzer for AI chatbot optimization
    async runLDJSMarkupChecker(content, assignmentType, options = {}) {
        try {
            const suggestions = [];
            let score = 85; // Start high since this is enhancement, not compliance

            const markupSuggestions = this.generateLDJSONMarkup(content, assignmentType);

            for (const suggestion of markupSuggestions) {
                suggestions.push(`LD-JSON: ${suggestion.description}`);
            }

            return {
                score,
                issues: [],
                suggestions,
                details: {
                    recommendedMarkup: markupSuggestions.map(s => s.markup),
                    seoImpact: this.analyzeSEOImpact(markupSuggestions),
                    chatbotOptimization: this.analyzeChatbotOptimization(markupSuggestions)
                }
            };
        } catch (error) {
            console.error('LD-JSON markup checker error:', error);
            return { score: 100, issues: [], suggestions: [], error: error.message };
        }
    }

    // Placeholder methods for future checkers
    async runAccessibilityChecker(content, options) {
        // Future: Check content for accessibility compliance
        return { score: 100, issues: [], suggestions: [] };
    }

    async runSEOChecker(content, options) {
        // Future: Check content for SEO optimization
        return { score: 100, issues: [], suggestions: [] };
    }

    async runFactChecker(content, options) {
        // Future: Verify facts and claims in content
        return { score: 100, issues: [], suggestions: [] };
    }

    async runToneChecker(content, options) {
        // Future: Analyze tone consistency and appropriateness
        return { score: 100, issues: [], suggestions: [] };
    }

    async runComplianceChecker(content, assignmentType, options) {
        // Future: Check legal/regulatory compliance
        return { score: 100, issues: [], suggestions: [] };
    }

    extractAdditionalCheckerIssues(checkerResults, type) {
        const issues = [];
        for (const [checkerName, result] of Object.entries(checkerResults)) {
            if (result.error) continue;

            if (type === 'critical' && result.issues) {
                issues.push(...result.issues.map(issue => `${checkerName}: ${issue}`));
            } else if (type === 'suggestion' && result.suggestions) {
                issues.push(...result.suggestions.map(suggestion => `${checkerName}: ${suggestion}`));
            }
        }
        return issues;
    }

    calculateCombinedScore(criteriaAnalysis, aiAnalysis, checkerResults) {
        let totalScore = criteriaAnalysis.score * 0.7; // Main criteria weight 70%
        let totalWeight = 0.7;

        // Add AI analysis weight (20%)
        totalScore += (aiAnalysis.score || 70) * 0.2;
        totalWeight += 0.2;

        // Add additional checker scores (10% total, distributed)
        const checkerCount = Object.keys(checkerResults).length;
        if (checkerCount > 0) {
            const checkerWeight = 0.1 / checkerCount;
            for (const result of Object.values(checkerResults)) {
                if (!result.error && typeof result.score === 'number') {
                    totalScore += result.score * checkerWeight;
                    totalWeight += checkerWeight;
                }
            }
        }

        return Math.max(0, Math.min(100, Math.round(totalScore)));
    }

    async analyzeByType(content, assignmentType, briefData) {
        const rules = this.qualityRules[assignmentType];
        if (!rules) {
            return { criticalIssues: [], suggestions: [], score: 50 };
        }

        const analysis = {
            criticalIssues: [],
            suggestions: [],
            structureScore: 0,
            messagingScore: 0,
            toneScore: 0
        };

        // Structure Analysis
        analysis.structureScore = this.analyzeStructure(content, rules.structure, assignmentType);

        // Messaging Analysis
        analysis.messagingScore = this.analyzeMessaging(content, rules.messaging, briefData);

        // Tone Analysis
        analysis.toneScore = this.analyzeTone(content, rules.tone || {});

        // Assignment-specific analysis
        switch (assignmentType) {
            case 'statement':
                this.analyzeStatementSpecifics(content, analysis, briefData);
                break;
            case 'talking_points':
                this.analyzeTalkingPointsSpecifics(content, analysis, briefData);
                break;
            case 'speech':
                this.analyzeSpeechSpecifics(content, analysis);
                break;
            case 'press_release':
                this.analyzePressReleaseSpecifics(content, analysis);
                break;
        }

        return analysis;
    }

    analyzeStructure(content, structureRules, assignmentType) {
        let score = 100;
        const issues = [];

        // Length analysis
        if (structureRules.optimal_length) {
            const wordCount = content.split(/\s+/).length;
            if (wordCount < structureRules.optimal_length.min) {
                issues.push(`Content is too brief (${wordCount} words). Consider expanding with more detail and examples.`);
                score -= 15;
            } else if (wordCount > structureRules.optimal_length.max) {
                issues.push(`Content is too lengthy (${wordCount} words). Consider tightening and focusing key messages.`);
                score -= 10;
            }
        }

        // Paragraph analysis
        if (structureRules.paragraph_count) {
            const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
            if (paragraphs.length < structureRules.paragraph_count.min) {
                issues.push(`Too few paragraphs (${paragraphs.length}). Break up content for better readability.`);
                score -= 10;
            }
        }

        return Math.max(0, score);
    }

    analyzeMessaging(content, messagingRules, briefData) {
        let score = 100;
        const issues = [];

        // Active voice check
        if (messagingRules.active_voice_preference) {
            const passiveCount = (content.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/g) || []).length;
            const sentences = content.split(/[.!?]+/).length;
            const passiveRatio = passiveCount / sentences;

            if (passiveRatio > 0.3) {
                issues.push(`Heavy use of passive voice (${Math.round(passiveRatio * 100)}%). Use more active, direct language.`);
                score -= 15;
            }
        }

        // Specific facts check
        if (messagingRules.specific_facts_required) {
            const hasNumbers = /\b\d+([,.]?\d+)*\b/.test(content);
            const hasPercentages = /%/.test(content);
            const hasSpecifics = /\b(million|billion|thousand|percent|dollar|year|day|month)\b/i.test(content);

            if (!hasNumbers && !hasPercentages && !hasSpecifics) {
                issues.push('Missing specific facts, statistics, or concrete details that support your argument.');
                score -= 20;
            }
        }

        return Math.max(0, score);
    }

    analyzeTone(content, toneRules) {
        let score = 100;
        const issues = [];

        // Defensive language check
        if (toneRules.avoid_defensive_language) {
            const defensiveWords = ['deny', 'refute', 'false', 'untrue', 'incorrect', 'wrong'];
            const defensiveCount = defensiveWords.reduce((count, word) => {
                return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
            }, 0);

            if (defensiveCount > 2) {
                issues.push('Consider reducing defensive language. Focus on positive messaging and solutions.');
                score -= 15;
            }
        }

        // Forward-looking check
        if (toneRules.forward_looking) {
            const futureWords = ['will', 'plan', 'future', 'next', 'ahead', 'forward', 'continue'];
            const hasFutureOrientation = futureWords.some(word =>
                content.toLowerCase().includes(word)
            );

            if (!hasFutureOrientation) {
                issues.push('Add more forward-looking language about plans and future action.');
                score -= 10;
            }
        }

        return Math.max(0, score);
    }

    analyzeStatementSpecifics(content, analysis, briefData) {
        // Check for clear position statement
        const firstParagraph = content.split('\n')[0];
        if (!firstParagraph || firstParagraph.length < 50) {
            analysis.criticalIssues.push('Opening paragraph should clearly state your position upfront');
        }

        // Check for call to action
        const lastParagraph = content.split('\n').slice(-1)[0];
        const actionWords = ['must', 'should', 'will', 'call on', 'urge', 'demand', 'support'];
        const hasCallToAction = actionWords.some(word =>
            lastParagraph.toLowerCase().includes(word)
        );

        if (!hasCallToAction) {
            analysis.suggestions.push('Add a clear call to action in your conclusion');
        }

        // Check brief alignment
        if (briefData) {
            if (briefData.main_message && !content.toLowerCase().includes(briefData.main_message.toLowerCase().substring(0, 30))) {
                analysis.criticalIssues.push('Content should clearly reflect the core message from the brief');
            }
        }
    }

    analyzeTalkingPointsSpecifics(content, analysis, briefData) {
        // Check for MOTD
        if (!content.includes('MESSAGE OF THE DAY') && !content.includes('MOTD')) {
            analysis.criticalIssues.push('Missing Message of the Day section - essential for talking points');
        }

        // Check for priority structure
        if (!content.includes('PRIORIT') && !content.includes('FOCUS')) {
            analysis.criticalIssues.push('Missing priority messages structure');
        }

        // Check for opposition response
        if (!content.includes('OPPOSITION') && !content.includes('IF ASKED') && !content.includes('RESPONSE')) {
            analysis.suggestions.push('Include opposition response guidance for surrogates');
        }

        // Classification check
        if (!content.includes('CONFIDENTIAL') && !content.includes('RESTRICTED')) {
            analysis.suggestions.push('Add appropriate classification header');
        }
    }

    analyzeSpeechSpecifics(content, analysis) {
        // Check for audience engagement
        const engagementElements = ['applause', 'pause', 'emphasis', 'thank you'];
        const hasEngagement = engagementElements.some(element =>
            content.toLowerCase().includes(element)
        );

        if (!hasEngagement) {
            analysis.suggestions.push('Add audience engagement cues like [APPLAUSE] or [PAUSE]');
        }

        // Check for teleprompter formatting
        if (!content.includes('[') && !content.includes('(')) {
            analysis.suggestions.push('Consider adding delivery cues for teleprompter use');
        }
    }

    analyzePressReleaseSpecifics(content, analysis) {
        // Check for inverted pyramid structure
        const firstSentence = content.split('.')[0];
        if (!firstSentence || firstSentence.length > 200) {
            analysis.suggestions.push('Lead sentence should be concise and contain the most newsworthy information');
        }

        // Check for quote attribution
        if (!content.includes('"') || !content.includes('said')) {
            analysis.criticalIssues.push('Press releases should include attributed quotes');
        }

        // Check for contact information
        if (!content.toLowerCase().includes('contact') && !content.toLowerCase().includes('media')) {
            analysis.suggestions.push('Add media contact information at the end');
        }
    }

    async runAIAnalysis(content, assignmentType, briefData) {
        try {
            const prompt = this.buildAnalysisPrompt(content, assignmentType, briefData);

            const aiResponse = await aiService.generateResponse(prompt, {
                maxLength: 1000,
                temperature: 0.3 // Lower temperature for more consistent analysis
            });

            return this.parseAIResponse(aiResponse);

        } catch (error) {
            console.error('AI analysis failed:', error);
            return {
                criticalIssues: [],
                suggestions: [],
                strengths: [],
                score: 50
            };
        }
    }

    buildAnalysisPrompt(content, assignmentType, briefData) {
        let prompt = `Analyze this ${assignmentType} for political communication effectiveness and best practices:\n\n`;

        prompt += `CONTENT:\n${content}\n\n`;

        if (briefData) {
            prompt += `BRIEF CONTEXT:\n`;
            if (briefData.main_message) prompt += `Main Message: ${briefData.main_message}\n`;
            if (briefData.target_audience) prompt += `Target Audience: ${briefData.target_audience}\n`;
            if (briefData.emotional_tone) prompt += `Desired Tone: ${briefData.emotional_tone}\n`;
            prompt += `\n`;
        }

        prompt += `ANALYSIS CRITERIA:\n`;

        switch (assignmentType) {
            case 'statement':
                prompt += `- Clear position statement in opening\n`;
                prompt += `- Evidence and supporting facts\n`;
                prompt += `- Local impact and examples\n`;
                prompt += `- Strong call to action\n`;
                prompt += `- Avoids defensive language\n`;
                prompt += `- Forward-looking and solution-oriented\n`;
                break;

            case 'talking_points':
                prompt += `- Message discipline and consistency\n`;
                prompt += `- Surrogate-friendly language\n`;
                prompt += `- Media-ready sound bites\n`;
                prompt += `- Opposition response strategies\n`;
                prompt += `- Clear pivot points\n`;
                break;

            case 'speech':
                prompt += `- Audience engagement elements\n`;
                prompt += `- Teleprompter-friendly formatting\n`;
                prompt += `- Applause lines and timing\n`;
                prompt += `- Clear delivery cues\n`;
                break;

            case 'press_release':
                prompt += `- Inverted pyramid structure\n`;
                prompt += `- News value and timeliness\n`;
                prompt += `- Proper quote attribution\n`;
                prompt += `- AP style compliance\n`;
                break;
        }

        prompt += `\nProvide analysis in this format:\n`;
        prompt += `STRENGTHS: [List 2-3 specific strengths]\n`;
        prompt += `CRITICAL ISSUES: [List any major problems that must be fixed]\n`;
        prompt += `SUGGESTIONS: [List 3-5 specific improvements]\n`;
        prompt += `SCORE: [Rate 0-100 for overall effectiveness]\n`;

        return prompt;
    }

    parseAIResponse(response) {
        const analysis = {
            strengths: [],
            criticalIssues: [],
            suggestions: [],
            score: 70 // default
        };

        try {
            const lines = response.split('\n');
            let currentSection = '';

            for (const line of lines) {
                if (line.startsWith('STRENGTHS:')) {
                    currentSection = 'strengths';
                    const content = line.replace('STRENGTHS:', '').trim();
                    if (content) analysis.strengths.push(content);
                } else if (line.startsWith('CRITICAL ISSUES:')) {
                    currentSection = 'criticalIssues';
                    const content = line.replace('CRITICAL ISSUES:', '').trim();
                    if (content) analysis.criticalIssues.push(content);
                } else if (line.startsWith('SUGGESTIONS:')) {
                    currentSection = 'suggestions';
                    const content = line.replace('SUGGESTIONS:', '').trim();
                    if (content) analysis.suggestions.push(content);
                } else if (line.startsWith('SCORE:')) {
                    const score = parseInt(line.replace('SCORE:', '').trim());
                    if (!isNaN(score)) analysis.score = Math.max(0, Math.min(100, score));
                } else if (line.trim() && currentSection) {
                    // Continuation of current section
                    analysis[currentSection].push(line.trim());
                }
            }

        } catch (error) {
            console.error('Error parsing AI response:', error);
        }

        return analysis;
    }

    async generateSpecificSuggestions(content, analysis, assignmentType) {
        const suggestions = [];

        // Generate line-specific suggestions
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length < 10) continue; // Skip short lines

            // Check for common issues in specific lines
            if (line.includes('I deny') || line.includes('That\'s false')) {
                suggestions.push({
                    line: i + 1,
                    issue: 'Defensive language',
                    suggestion: `Instead of "${line.substring(0, 30)}...", try leading with your positive position`,
                    severity: 'medium'
                });
            }

            if (line.split(' ').length > 40) {
                suggestions.push({
                    line: i + 1,
                    issue: 'Sentence too long',
                    suggestion: 'Consider breaking this sentence into two for better readability',
                    severity: 'low'
                });
            }
        }

        // Add general suggestions based on analysis
        if (analysis.overallScore < 60) {
            suggestions.push({
                issue: 'Overall effectiveness',
                suggestion: 'This content needs significant revision before publication',
                severity: 'high'
            });
        }

        return suggestions;
    }

    calculateOverallScore(typeAnalysis, aiAnalysis) {
        const structureWeight = 0.3;
        const messagingWeight = 0.4;
        const toneWeight = 0.2;
        const aiWeight = 0.1;

        const typeScore = (
            (typeAnalysis.structureScore || 0) * structureWeight +
            (typeAnalysis.messagingScore || 0) * messagingWeight +
            (typeAnalysis.toneScore || 0) * toneWeight
        );

        const finalScore = typeScore * 0.9 + (aiAnalysis.score || 50) * aiWeight;

        // Deduct points for critical issues
        const criticalDeduction = (typeAnalysis.criticalIssues.length + aiAnalysis.criticalIssues.length) * 10;

        return Math.max(0, Math.min(100, Math.round(finalScore - criticalDeduction)));
    }

    determineReadinessLevel(score, criticalIssues) {
        if (criticalIssues.length > 0) {
            return 'needs_revision';
        } else if (score >= 85) {
            return 'ready_for_approval';
        } else if (score >= 70) {
            return 'ready_for_review';
        } else if (score >= 50) {
            return 'needs_improvement';
        } else {
            return 'needs_major_revision';
        }
    }

    // Quick analysis for real-time feedback
    async quickCheck(content, assignmentType) {
        const issues = [];
        const suggestions = [];

        // Basic checks that can run quickly
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 50) {
            issues.push('Content appears incomplete - consider adding more detail');
        }

        // Check for placeholder text
        const placeholders = ['[TO BE FILLED]', '[INSERT]', '[ADD]', 'TODO', 'TBD'];
        for (const placeholder of placeholders) {
            if (content.includes(placeholder)) {
                issues.push(`Contains placeholder text: ${placeholder}`);
            }
        }

        // Basic tone check
        const defensiveWords = ['deny', 'false', 'untrue', 'wrong'];
        const defensiveCount = defensiveWords.reduce((count, word) => {
            return count + (content.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);

        if (defensiveCount > 3) {
            suggestions.push('Consider reducing defensive language for more positive messaging');
        }

        return {
            issues,
            suggestions,
            wordCount,
            readableScore: Math.max(0, 100 - issues.length * 15 - defensiveCount * 5)
        };
    }

    // Helper methods for new checkers

    extractFactualClaims(content) {
        const facts = [];
        const sentences = content.split(/[.!?]+/);

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (sentence.length === 0) continue;

            // Identify potential factual claims
            const hasNumbers = /\b\d+([,.]?\d+)*\b/.test(sentence);
            const hasPercentages = /%/.test(sentence);
            const hasStatistics = /\b(million|billion|thousand|percent|increase|decrease|according to|study|report)\b/i.test(sentence);
            const hasDefinitiveStatements = /\b(is|are|will|has|have|shows|proves|demonstrates)\b/i.test(sentence);

            if (hasNumbers || hasPercentages || hasStatistics || hasDefinitiveStatements) {
                facts.push({
                    text: sentence,
                    position: i,
                    type: this.classifyClaimType(sentence),
                    confidence: this.calculateClaimConfidence(sentence)
                });
            }
        }

        return facts;
    }

    classifyClaimType(sentence) {
        if (/%/.test(sentence) || /\b(percent|percentage)\b/i.test(sentence)) return 'percentage';
        if (/\b\d+([,.]?\d+)*\s*(million|billion|thousand)\b/i.test(sentence)) return 'statistic';
        if (/\b(according to|study|report|research)\b/i.test(sentence)) return 'research_based';
        if (/\b(will|plan|intend|propose)\b/i.test(sentence)) return 'policy_claim';
        return 'general_fact';
    }

    calculateClaimConfidence(sentence) {
        let confidence = 0.5;
        if (/\b(according to|study|report)\b/i.test(sentence)) confidence += 0.3;
        if (/\b\d+([,.]?\d+)*\b/.test(sentence)) confidence += 0.2;
        if (/%/.test(sentence)) confidence += 0.1;
        return Math.min(1, confidence);
    }

    async findSourceForClaim(fact, options) {
        // This would ideally integrate with fact-checking APIs or databases
        // For now, we'll do basic validation and suggest source types
        const sourceTypes = this.suggestSourceTypes(fact);

        return {
            found: false, // Would be true if we found an actual source
            credible: false,
            source: null,
            credibilityScore: 0,
            suggestedSources: sourceTypes,
            needsVerification: true
        };
    }

    suggestSourceTypes(fact) {
        const sources = [];

        if (fact.type === 'research_based') {
            sources.push('Academic journals', 'Government research', 'Think tank reports');
        }
        if (fact.type === 'statistic') {
            sources.push('Bureau of Labor Statistics', 'Census Bureau', 'Federal agencies');
        }
        if (fact.type === 'percentage') {
            sources.push('Official surveys', 'Government statistics', 'Reputable polling');
        }
        if (fact.type === 'policy_claim') {
            sources.push('Official policy documents', 'Legislative records', 'Government websites');
        }

        return sources.length > 0 ? sources : ['Official government sources', 'Reputable news outlets', 'Academic institutions'];
    }

    checkFECViolations(content, assignmentType) {
        const fecRules = require('../data/fec-compliance-rules');
        const violations = [];
        const contentLower = content.toLowerCase();

        // Check for express advocacy (magic words)
        const hasExpressAdvocacy = this.checkExpressAdvocacy(content, fecRules);
        if (hasExpressAdvocacy.found) {
            const contentTypeRules = fecRules.contentTypeRules[assignmentType];
            const requiresDisclaimer = contentTypeRules?.requiresDisclaimer || false;

            if (requiresDisclaimer && !this.hasValidDisclaimer(content, fecRules)) {
                violations.push({
                    type: 'express_advocacy_no_disclaimer',
                    severity: 'critical',
                    description: `Express advocacy detected ("${hasExpressAdvocacy.words.join('", "')}") requires "Paid for by" disclaimer`,
                    citation: fecRules.citations.express_advocacy,
                    legalReview: 'critical',
                    recommendation: 'Add proper disclaimer: "Paid for by [Committee Name]"'
                });
            }
        }

        // Check for coordination indicators
        const coordinationCheck = this.checkCoordination(content, fecRules);
        if (coordinationCheck.violations.length > 0) {
            coordinationCheck.violations.forEach(violation => {
                violations.push({
                    ...violation,
                    citation: fecRules.citations.coordination,
                    legalReview: violation.severity === 'critical' ? 'critical' : 'warning'
                });
            });
        }

        // Check for foreign national prohibitions
        const foreignNationalCheck = this.checkForeignNationalViolations(content, fecRules);
        if (foreignNationalCheck.violations.length > 0) {
            foreignNationalCheck.violations.forEach(violation => {
                violations.push({
                    ...violation,
                    citation: fecRules.citations.foreign_national,
                    legalReview: 'critical'
                });
            });
        }

        // Check for corporate/union restrictions
        const corporateCheck = this.checkCorporateRestrictions(content, fecRules);
        if (corporateCheck.violations.length > 0) {
            corporateCheck.violations.forEach(violation => {
                violations.push({
                    ...violation,
                    citation: fecRules.citations.corporate,
                    legalReview: violation.severity === 'critical' ? 'critical' : 'warning'
                });
            });
        }

        // Check contribution limit references
        const contributionCheck = this.checkContributionLimitReferences(content, fecRules);
        if (contributionCheck.violations.length > 0) {
            contributionCheck.violations.forEach(violation => {
                violations.push({
                    ...violation,
                    citation: fecRules.citations.contribution_limits,
                    legalReview: 'warning'
                });
            });
        }

        return violations;
    }

    checkExpressAdvocacy(content, fecRules) {
        const contentLower = content.toLowerCase();
        const foundWords = [];

        // Check explicit magic words
        for (const word of fecRules.magicWords.explicit) {
            if (contentLower.includes(word)) {
                foundWords.push(word);
            }
        }

        // Check contextual magic words
        for (const phrase of fecRules.magicWords.contextual) {
            if (contentLower.includes(phrase.toLowerCase())) {
                foundWords.push(phrase);
            }
        }

        return {
            found: foundWords.length > 0,
            words: foundWords
        };
    }

    hasValidDisclaimer(content, fecRules) {
        for (const disclaimer of fecRules.disclaimerRequirements.paidFor) {
            if (content.toLowerCase().includes(disclaimer.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    checkCoordination(content, fecRules) {
        const violations = [];
        const contentLower = content.toLowerCase();

        // Check for direct coordination language
        for (const indicator of fecRules.coordinationIndicators.direct) {
            if (contentLower.includes(indicator)) {
                violations.push({
                    type: 'coordination_violation',
                    severity: 'critical',
                    description: `Direct coordination language detected: "${indicator}" - may violate coordination rules`,
                    recommendation: 'Remove coordination language or ensure proper independent expenditure compliance',
                    phrase: indicator
                });
                break; // One critical violation is enough
            }
        }

        // Check for indirect coordination indicators (only if no direct found)
        if (violations.length === 0) {
            for (const indicator of fecRules.coordinationIndicators.indirect) {
                if (contentLower.includes(indicator)) {
                    violations.push({
                        type: 'coordination_indicators',
                        severity: 'warning',
                        description: `Indirect coordination indicator: "${indicator}" - review for compliance`,
                        recommendation: 'Verify independence and document lack of coordination',
                        phrase: indicator
                    });
                }
            }
        }

        // Check for safe harbor language that might mitigate concerns
        const hasSafeHarbor = fecRules.coordinationIndicators.safeHarbor.some(phrase =>
            contentLower.includes(phrase)
        );

        if (hasSafeHarbor && violations.length > 0) {
            violations.forEach(violation => {
                violation.severity = 'info';
                violation.description += ' - Safe harbor language detected, may be compliant';
            });
        }

        return { violations };
    }

    checkForeignNationalViolations(content, fecRules) {
        const violations = [];
        const contentLower = content.toLowerCase();

        // Check for foreign national references
        const foreignReferences = [];
        for (const prohibited of fecRules.foreignNationalProhibitions.prohibited) {
            if (contentLower.includes(prohibited)) {
                foreignReferences.push(prohibited);
            }
        }

        if (foreignReferences.length > 0) {
            // Check if it's in the context of prohibited activities
            const hasProhibitedContext = fecRules.foreignNationalProhibitions.contexts.some(context =>
                contentLower.includes(context)
            );

            if (hasProhibitedContext) {
                violations.push({
                    type: 'foreign_national_violation',
                    severity: 'critical',
                    description: `Content references foreign national involvement in prohibited activities: ${foreignReferences.join(', ')}`,
                    recommendation: 'Remove all references to foreign national contributions or involvement',
                    phrases: foreignReferences
                });
            } else {
                violations.push({
                    type: 'foreign_national_mention',
                    severity: 'warning',
                    description: `Content mentions foreign nationals: ${foreignReferences.join(', ')} - review context for compliance`,
                    recommendation: 'Ensure no prohibited foreign national activities are referenced',
                    phrases: foreignReferences
                });
            }
        }

        return { violations };
    }

    checkCorporateRestrictions(content, fecRules) {
        const violations = [];
        const contentLower = content.toLowerCase();

        // Check for prohibited corporate activities
        for (const prohibited of fecRules.corporateRestrictions.prohibited) {
            if (contentLower.includes(prohibited)) {
                violations.push({
                    type: 'corporate_treasury_violation',
                    severity: 'critical',
                    description: `Prohibited corporate treasury use referenced: "${prohibited}"`,
                    recommendation: 'Remove references to corporate treasury funds or ensure proper PAC structure',
                    phrase: prohibited
                });
            }
        }

        return { violations };
    }

    checkContributionLimitReferences(content, fecRules) {
        const violations = [];

        // Check for large dollar amounts that might indicate limit violations
        const dollarMatches = content.match(/\$[\d,]+/g);
        if (dollarMatches) {
            for (const match of dollarMatches) {
                const amount = parseInt(match.replace(/[\$,]/g, ''));
                if (amount > fecRules.contributionLimits.individual.candidate) {
                    violations.push({
                        type: 'large_contribution_reference',
                        severity: 'warning',
                        description: `Large contribution amount referenced (${match}) - verify compliance with contribution limits`,
                        recommendation: 'Review contribution limits and ensure compliance',
                        amount: amount
                    });
                }
            }
        }

        return { violations };
    }

    generateLDJSONMarkup(content, assignmentType) {
        const suggestions = [];

        // Base schema suggestions
        suggestions.push({
            type: 'Organization',
            description: 'Add Organization schema for campaign entity',
            markup: {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                'name': '[Campaign Name]',
                'url': '[Campaign Website]',
                'sameAs': ['[Social Media URLs]'],
                'description': '[Campaign Description]'
            }
        });

        // Content-specific schemas
        if (assignmentType === 'press_release') {
            suggestions.push({
                type: 'NewsArticle',
                description: 'Structure as NewsArticle for better news visibility',
                markup: {
                    '@context': 'https://schema.org',
                    '@type': 'NewsArticle',
                    'headline': '[Extract from content]',
                    'datePublished': '[Publication Date]',
                    'author': {
                        '@type': 'Organization',
                        'name': '[Campaign Name]'
                    },
                    'publisher': {
                        '@type': 'Organization',
                        'name': '[Campaign Name]'
                    }
                }
            });
        }

        if (assignmentType === 'statement') {
            suggestions.push({
                type: 'Article',
                description: 'Mark as Article for political statement indexing',
                markup: {
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    'headline': '[Statement Title]',
                    'author': {
                        '@type': 'Person',
                        'name': '[Candidate Name]',
                        'jobTitle': '[Position/Title]'
                    },
                    'about': ['[Policy Topics]'],
                    'keywords': '[Extract key terms]'
                }
            });
        }

        if (assignmentType === 'speech') {
            suggestions.push({
                type: 'Event',
                description: 'Structure speech as Event for better discovery',
                markup: {
                    '@context': 'https://schema.org',
                    '@type': 'Event',
                    'name': '[Speech Title]',
                    'performer': {
                        '@type': 'Person',
                        'name': '[Speaker Name]'
                    },
                    'eventStatus': 'EventScheduled',
                    'eventAttendanceMode': '[Physical/Virtual]',
                    'description': '[Speech Summary]'
                }
            });
        }

        return suggestions;
    }

    analyzeSEOImpact(markupSuggestions) {
        return {
            searchVisibility: 'High - structured data improves search result appearance',
            richSnippets: 'Likely to generate rich snippets in search results',
            voiceSearch: 'Enhanced compatibility with voice search queries',
            featuredSnippets: 'Increased chances of appearing in featured snippets'
        };
    }

    analyzeChatbotOptimization(markupSuggestions) {
        return {
            aiCrawlability: 'Improved - structured data helps AI understand content context',
            semanticClarity: 'Enhanced - schema provides clear semantic meaning',
            contextualRelevance: 'Better entity recognition for political content',
            knowledgeGraphPotential: 'Higher likelihood of inclusion in knowledge graphs'
        };
    }
}

module.exports = new ContentQualityChecker();