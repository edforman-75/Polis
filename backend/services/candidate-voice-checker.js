/**
 * Candidate Voice & Tone Consistency Checker
 * Analyzes whether content sounds authentic to the candidate's voice
 */

const aiService = require('./ai-service');

class CandidateVoiceChecker {
    constructor() {
        // Initialize with common voice patterns and characteristics
        this.voicePatterns = {
            // Word choice patterns
            vocabulary: {
                formality_level: ['formal', 'conversational', 'folksy', 'academic', 'street'],
                complexity: ['simple', 'moderate', 'complex', 'variable'],
                jargon_usage: ['none', 'minimal', 'moderate', 'heavy'],
                regional_terms: ['none', 'occasional', 'frequent']
            },

            // Speaking patterns
            rhetoric: {
                sentence_length: ['short', 'medium', 'long', 'varied'],
                repetition_style: ['minimal', 'emphasis', 'rhetorical', 'rally'],
                metaphor_usage: ['literal', 'business', 'sports', 'family', 'military'],
                emotional_appeals: ['logical', 'emotional', 'mixed', 'passionate']
            },

            // Personal characteristics
            personality: {
                directness: ['diplomatic', 'direct', 'blunt'],
                humor_style: ['none', 'dry', 'self-deprecating', 'folksy', 'sarcastic'],
                authority_tone: ['humble', 'confident', 'commanding'],
                empathy_expression: ['reserved', 'warm', 'passionate']
            },

            // Political positioning
            messaging: {
                contrast_style: ['policy-focused', 'character-focused', 'record-focused'],
                solution_framing: ['detailed', 'visionary', 'pragmatic'],
                constituency_address: ['formal', 'personal', 'inclusive'],
                issue_approach: ['comprehensive', 'focused', 'narrative-driven']
            }
        };
    }

    async analyzeVoiceConsistency(content, candidateProfile, assignmentType) {
        try {
            const analysis = {
                overallScore: 0,
                voiceMatch: 0,
                authenticityIssues: [],
                suggestions: [],
                detailedAnalysis: {},
                quotes: []
            };

            // Analyze overall voice consistency
            const voiceAnalysis = await this.analyzeVoiceCharacteristics(content, candidateProfile);
            analysis.detailedAnalysis.voice = voiceAnalysis;

            // Extract and analyze quotes
            const quoteAnalysis = await this.analyzeQuoteAuthenticity(content, candidateProfile);
            analysis.quotes = quoteAnalysis.quotes;
            analysis.detailedAnalysis.quotes = quoteAnalysis;

            // Check assignment-specific voice requirements
            const contextAnalysis = await this.analyzeContextualVoice(content, assignmentType, candidateProfile);
            analysis.detailedAnalysis.context = contextAnalysis;

            // Calculate combined scores
            analysis.voiceMatch = this.calculateVoiceMatch(voiceAnalysis, quoteAnalysis, contextAnalysis);
            analysis.overallScore = analysis.voiceMatch;

            // Generate improvement suggestions
            analysis.suggestions = this.generateVoiceSuggestions(voiceAnalysis, quoteAnalysis, contextAnalysis);
            analysis.authenticityIssues = this.identifyAuthenticityIssues(voiceAnalysis, quoteAnalysis);

            return analysis;

        } catch (error) {
            console.error('Voice analysis error:', error);
            return {
                overallScore: 50,
                voiceMatch: 50,
                authenticityIssues: ['Voice analysis failed - manual review required'],
                suggestions: [],
                error: error.message
            };
        }
    }

    async analyzeVoiceCharacteristics(content, candidateProfile) {
        const characteristics = {
            vocabulary: this.analyzeVocabulary(content, candidateProfile),
            rhetoric: this.analyzeRhetoricalStyle(content, candidateProfile),
            tone: this.analyzeToneConsistency(content, candidateProfile),
            authenticity: 0,
            issues: [],
            strengths: []
        };

        // Use AI to analyze voice authenticity
        const aiAnalysis = await this.runAIVoiceAnalysis(content, candidateProfile);
        characteristics.authenticity = aiAnalysis.score;
        characteristics.issues = aiAnalysis.issues;
        characteristics.strengths = aiAnalysis.strengths;

        return characteristics;
    }

    analyzeVocabulary(content, candidateProfile) {
        const analysis = {
            formalityScore: 0,
            complexityScore: 0,
            consistencyScore: 0,
            issues: []
        };

        // Analyze formality level
        const formalWords = content.match(/\b(furthermore|consequently|heretofore|pursuant|aforementioned)\b/gi) || [];
        const casualWords = content.match(/\b(gonna|gotta|kinda|sorta|folks|y'all)\b/gi) || [];
        const formalityRatio = formalWords.length / (formalWords.length + casualWords.length + 1);

        // Check against candidate's typical formality
        const expectedFormality = candidateProfile?.voice?.formality_level || 'conversational';

        switch (expectedFormality) {
            case 'formal':
                analysis.formalityScore = formalityRatio > 0.7 ? 100 : formalityRatio > 0.4 ? 70 : 40;
                break;
            case 'conversational':
                analysis.formalityScore = formalityRatio > 0.3 && formalityRatio < 0.7 ? 100 : 60;
                break;
            case 'folksy':
                analysis.formalityScore = casualWords.length > 0 && formalityRatio < 0.3 ? 100 : 50;
                break;
        }

        // Analyze sentence complexity
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const avgWordsPerSentence = content.split(/\s+/).length / sentences.length;

        analysis.complexityScore = this.scoreComplexityAlignment(avgWordsPerSentence, candidateProfile?.voice?.complexity);

        // Check for out-of-character vocabulary
        if (candidateProfile?.voice?.avoid_words) {
            const avoidWords = candidateProfile.voice.avoid_words;
            for (const word of avoidWords) {
                if (content.toLowerCase().includes(word.toLowerCase())) {
                    analysis.issues.push(`Uses "${word}" which is not typical for this candidate`);
                }
            }
        }

        analysis.consistencyScore = Math.round((analysis.formalityScore + analysis.complexityScore) / 2);
        return analysis;
    }

    analyzeRhetoricalStyle(content, candidateProfile) {
        const analysis = {
            repetitionScore: 0,
            metaphorScore: 0,
            rhetoricalDevicesScore: 0,
            issues: [],
            strengths: []
        };

        // Analyze repetition patterns
        const words = content.toLowerCase().match(/\b\w+\b/g) || [];
        const wordCounts = {};
        words.forEach(word => wordCounts[word] = (wordCounts[word] || 0) + 1);

        const repeatedWords = Object.entries(wordCounts)
            .filter(([word, count]) => count > 2 && word.length > 4)
            .sort((a, b) => b[1] - a[1]);

        // Check if repetition style matches candidate
        const expectedRepetition = candidateProfile?.voice?.repetition_style || 'moderate';
        analysis.repetitionScore = this.scoreRepetitionAlignment(repeatedWords.length, expectedRepetition);

        // Analyze metaphor usage
        const businessMetaphors = content.match(/\b(bottom line|stakeholder|investment|return|partnership)\b/gi) || [];
        const sportsMetaphors = content.match(/\b(team|game plan|touchdown|home run|championship)\b/gi) || [];
        const militaryMetaphors = content.match(/\b(battle|fight|war|defend|victory|defeat)\b/gi) || [];

        const expectedMetaphors = candidateProfile?.voice?.metaphor_style || 'mixed';
        analysis.metaphorScore = this.scoreMetaphorAlignment({business: businessMetaphors.length, sports: sportsMetaphors.length, military: militaryMetaphors.length}, expectedMetaphors);

        return analysis;
    }

    analyzeToneConsistency(content, candidateProfile) {
        const analysis = {
            directnessScore: 0,
            empathyScore: 0,
            authorityScore: 0,
            overallTone: 0,
            issues: []
        };

        // Analyze directness
        const hedgeWords = content.match(/\b(maybe|perhaps|might|could|possibly|potentially)\b/gi) || [];
        const directWords = content.match(/\b(must|will|need to|should|require|demand)\b/gi) || [];
        const directnessRatio = directWords.length / (directWords.length + hedgeWords.length + 1);

        const expectedDirectness = candidateProfile?.voice?.directness || 'direct';
        analysis.directnessScore = this.scoreDirectnessAlignment(directnessRatio, expectedDirectness);

        // Analyze empathy expression
        const empathyWords = content.match(/\b(understand|feel|families|struggling|hardship|concern)\b/gi) || [];
        const empathyRatio = empathyWords.length / content.split(/\s+/).length;

        const expectedEmpathy = candidateProfile?.voice?.empathy_expression || 'warm';
        analysis.empathyScore = this.scoreEmpathyAlignment(empathyRatio, expectedEmpathy);

        // Analyze authority tone
        const authorityWords = content.match(/\b(experience|proven|leadership|delivered|accomplished)\b/gi) || [];
        const authorityRatio = authorityWords.length / content.split(/\s+/).length;

        const expectedAuthority = candidateProfile?.voice?.authority_tone || 'confident';
        analysis.authorityScore = this.scoreAuthorityAlignment(authorityRatio, expectedAuthority);

        analysis.overallTone = Math.round((analysis.directnessScore + analysis.empathyScore + analysis.authorityScore) / 3);
        return analysis;
    }

    async analyzeQuoteAuthenticity(content, candidateProfile) {
        const analysis = {
            quotes: [],
            authenticityScore: 0,
            issues: [],
            suggestions: []
        };

        // Extract quotes from content
        const quoteMatches = content.match(/"([^"]{10,})"/g) || [];

        for (const quoteMatch of quoteMatches) {
            const quote = quoteMatch.slice(1, -1); // Remove quote marks
            const quoteAnalysis = await this.analyzeIndividualQuote(quote, candidateProfile);

            analysis.quotes.push({
                text: quote,
                authenticity: quoteAnalysis.authenticity,
                issues: quoteAnalysis.issues,
                suggestions: quoteAnalysis.suggestions,
                voiceMatch: quoteAnalysis.voiceMatch
            });
        }

        // Calculate overall quote authenticity
        if (analysis.quotes.length > 0) {
            analysis.authenticityScore = Math.round(
                analysis.quotes.reduce((sum, q) => sum + q.authenticity, 0) / analysis.quotes.length
            );

            // Collect all issues and suggestions
            analysis.issues = analysis.quotes.flatMap(q => q.issues);
            analysis.suggestions = analysis.quotes.flatMap(q => q.suggestions);
        } else {
            analysis.authenticityScore = 100; // No quotes to check
        }

        return analysis;
    }

    async analyzeIndividualQuote(quote, candidateProfile) {
        const analysis = {
            authenticity: 0,
            voiceMatch: 0,
            issues: [],
            suggestions: []
        };

        // Basic quote analysis
        const wordCount = quote.split(/\s+/).length;
        const avgSentenceLength = quote.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

        // Check quote length appropriateness
        if (wordCount < 5) {
            analysis.issues.push('Quote too brief - may not sound substantial');
        } else if (wordCount > 50) {
            analysis.issues.push('Quote very long - may not sound natural in speech');
        }

        // Use AI for detailed quote authenticity analysis
        const aiQuoteAnalysis = await this.runAIQuoteAnalysis(quote, candidateProfile);
        analysis.authenticity = aiQuoteAnalysis.score;
        analysis.voiceMatch = aiQuoteAnalysis.voiceMatch;
        analysis.issues.push(...aiQuoteAnalysis.issues);
        analysis.suggestions.push(...aiQuoteAnalysis.suggestions);

        return analysis;
    }

    async analyzeContextualVoice(content, assignmentType, candidateProfile) {
        const analysis = {
            contextScore: 0,
            appropriateness: 0,
            issues: [],
            suggestions: []
        };

        // Different voice requirements by assignment type
        const contextRequirements = this.getContextualVoiceRequirements(assignmentType);

        // Check if content matches contextual expectations
        for (const requirement of contextRequirements) {
            const score = this.checkContextRequirement(content, requirement, candidateProfile);
            if (score < 70) {
                analysis.issues.push(`${requirement.name}: ${requirement.issue}`);
            }
            analysis.contextScore += score * requirement.weight;
        }

        analysis.appropriateness = Math.round(analysis.contextScore / contextRequirements.reduce((sum, req) => sum + req.weight, 1));

        return analysis;
    }

    getContextualVoiceRequirements(assignmentType) {
        const requirements = {
            statement: [
                { name: 'Authoritative Tone', weight: 0.4, issue: 'Statement should sound authoritative and decisive' },
                { name: 'Clear Position', weight: 0.3, issue: 'Voice should clearly convey candidate\'s position' },
                { name: 'Measured Language', weight: 0.3, issue: 'Tone should be measured, not overly emotional' }
            ],
            talking_points: [
                { name: 'Repeatable Phrases', weight: 0.4, issue: 'Language should be easily repeatable by surrogates' },
                { name: 'Message Discipline', weight: 0.3, issue: 'Voice should reinforce consistent messaging' },
                { name: 'Surrogate-Friendly', weight: 0.3, issue: 'Tone should work for multiple speakers' }
            ],
            speech: [
                { name: 'Conversational Tone', weight: 0.3, issue: 'Should sound natural when spoken aloud' },
                { name: 'Audience Connection', weight: 0.3, issue: 'Voice should connect with live audience' },
                { name: 'Inspirational Elements', weight: 0.2, issue: 'Should include uplifting, motivational language' },
                { name: 'Applause Lines', weight: 0.2, issue: 'Should have moments that invite audience response' }
            ],
            social_media: [
                { name: 'Authentic Voice', weight: 0.4, issue: 'Should sound like candidate personally wrote it' },
                { name: 'Platform-Appropriate', weight: 0.3, issue: 'Tone should fit social media context' },
                { name: 'Engaging Style', weight: 0.3, issue: 'Should invite interaction and sharing' }
            ]
        };

        return requirements[assignmentType] || requirements.statement;
    }

    checkContextRequirement(content, requirement, candidateProfile) {
        // This would implement specific checks for each requirement
        // For now, return a baseline score
        return 75;
    }

    async runAIVoiceAnalysis(content, candidateProfile) {
        try {
            const prompt = this.buildVoiceAnalysisPrompt(content, candidateProfile);
            const response = await aiService.generateResponse(prompt, {
                maxLength: 500,
                temperature: 0.3
            });

            return this.parseAIVoiceResponse(response);
        } catch (error) {
            console.error('AI voice analysis failed:', error);
            return { score: 70, issues: [], strengths: [] };
        }
    }

    async runAIQuoteAnalysis(quote, candidateProfile) {
        try {
            const prompt = `Analyze this quote for authenticity to the candidate's voice:

QUOTE: "${quote}"

CANDIDATE PROFILE:
${candidateProfile ? JSON.stringify(candidateProfile.voice || {}, null, 2) : 'No specific profile available'}

ANALYSIS CRITERIA:
- Does this sound like something the candidate would actually say?
- Is the language consistent with their typical speaking style?
- Are the word choices authentic to their vocabulary?
- Does the tone match their personality?

Provide analysis in this format:
AUTHENTICITY SCORE: [0-100]
VOICE MATCH: [0-100]
ISSUES: [List any problems]
SUGGESTIONS: [Improvements to make it sound more authentic]`;

            const response = await aiService.generateResponse(prompt, {
                maxLength: 300,
                temperature: 0.3
            });

            return this.parseAIQuoteResponse(response);
        } catch (error) {
            console.error('AI quote analysis failed:', error);
            return { score: 70, voiceMatch: 70, issues: [], suggestions: [] };
        }
    }

    buildVoiceAnalysisPrompt(content, candidateProfile) {
        let prompt = `Analyze this political content for voice authenticity and consistency:

CONTENT:
${content}

`;

        if (candidateProfile && candidateProfile.voice) {
            prompt += `CANDIDATE VOICE PROFILE:
`;
            if (candidateProfile.voice.formality_level) {
                prompt += `Formality: ${candidateProfile.voice.formality_level}\n`;
            }
            if (candidateProfile.voice.directness) {
                prompt += `Communication Style: ${candidateProfile.voice.directness}\n`;
            }
            if (candidateProfile.voice.typical_phrases) {
                prompt += `Typical Phrases: ${candidateProfile.voice.typical_phrases.join(', ')}\n`;
            }
            if (candidateProfile.voice.avoid_words) {
                prompt += `Avoid: ${candidateProfile.voice.avoid_words.join(', ')}\n`;
            }
        }

        prompt += `
ANALYSIS CRITERIA:
- Voice consistency and authenticity
- Language patterns and word choice
- Tone appropriateness
- Rhetorical style alignment

Provide analysis in this format:
SCORE: [0-100 overall authenticity]
STRENGTHS: [What sounds authentic]
ISSUES: [What sounds off-brand or inauthentic]
SUGGESTIONS: [Specific improvements]`;

        return prompt;
    }

    parseAIVoiceResponse(response) {
        const analysis = {
            score: 70,
            strengths: [],
            issues: [],
            suggestions: []
        };

        try {
            const lines = response.split('\n');
            let currentSection = '';

            for (const line of lines) {
                if (line.startsWith('SCORE:')) {
                    const score = parseInt(line.replace('SCORE:', '').trim());
                    if (!isNaN(score)) analysis.score = score;
                } else if (line.startsWith('STRENGTHS:')) {
                    currentSection = 'strengths';
                    const content = line.replace('STRENGTHS:', '').trim();
                    if (content) analysis.strengths.push(content);
                } else if (line.startsWith('ISSUES:')) {
                    currentSection = 'issues';
                    const content = line.replace('ISSUES:', '').trim();
                    if (content) analysis.issues.push(content);
                } else if (line.startsWith('SUGGESTIONS:')) {
                    currentSection = 'suggestions';
                    const content = line.replace('SUGGESTIONS:', '').trim();
                    if (content) analysis.suggestions.push(content);
                } else if (line.trim() && currentSection) {
                    analysis[currentSection].push(line.trim());
                }
            }
        } catch (error) {
            console.error('Error parsing AI voice response:', error);
        }

        return analysis;
    }

    parseAIQuoteResponse(response) {
        const analysis = {
            score: 70,
            voiceMatch: 70,
            issues: [],
            suggestions: []
        };

        try {
            const lines = response.split('\n');
            let currentSection = '';

            for (const line of lines) {
                if (line.startsWith('AUTHENTICITY SCORE:')) {
                    const score = parseInt(line.replace('AUTHENTICITY SCORE:', '').trim());
                    if (!isNaN(score)) analysis.score = score;
                } else if (line.startsWith('VOICE MATCH:')) {
                    const score = parseInt(line.replace('VOICE MATCH:', '').trim());
                    if (!isNaN(score)) analysis.voiceMatch = score;
                } else if (line.startsWith('ISSUES:')) {
                    currentSection = 'issues';
                    const content = line.replace('ISSUES:', '').trim();
                    if (content) analysis.issues.push(content);
                } else if (line.startsWith('SUGGESTIONS:')) {
                    currentSection = 'suggestions';
                    const content = line.replace('SUGGESTIONS:', '').trim();
                    if (content) analysis.suggestions.push(content);
                } else if (line.trim() && currentSection) {
                    analysis[currentSection].push(line.trim());
                }
            }
        } catch (error) {
            console.error('Error parsing AI quote response:', error);
        }

        return analysis;
    }

    // Helper scoring methods
    scoreComplexityAlignment(avgLength, expectedComplexity) {
        const complexityRanges = {
            simple: { min: 8, max: 15, optimal: 12 },
            moderate: { min: 12, max: 20, optimal: 16 },
            complex: { min: 18, max: 30, optimal: 24 },
            variable: { min: 10, max: 25, optimal: 18 }
        };

        const range = complexityRanges[expectedComplexity] || complexityRanges.moderate;

        if (avgLength >= range.min && avgLength <= range.max) {
            return avgLength === range.optimal ? 100 : 85;
        }
        return 60;
    }

    scoreRepetitionAlignment(repetitionCount, expectedStyle) {
        const styleExpectations = {
            minimal: { max: 2, score: repetitionCount <= 2 ? 100 : 60 },
            emphasis: { optimal: 3, score: Math.abs(repetitionCount - 3) <= 1 ? 100 : 75 },
            rhetorical: { optimal: 5, score: Math.abs(repetitionCount - 5) <= 2 ? 100 : 80 },
            rally: { min: 4, score: repetitionCount >= 4 ? 100 : 70 }
        };

        return styleExpectations[expectedStyle]?.score || 75;
    }

    scoreMetaphorAlignment(metaphors, expectedStyle) {
        const total = metaphors.business + metaphors.sports + metaphors.military;
        if (total === 0) return 70; // Neutral if no metaphors

        const dominant = Object.entries(metaphors).reduce((a, b) => metaphors[a[0]] > metaphors[b[0]] ? a : b)[0];

        if (expectedStyle === 'mixed') return 85;
        if (expectedStyle === dominant) return 100;
        return 60;
    }

    scoreDirectnessAlignment(ratio, expectedDirectness) {
        const expectations = {
            diplomatic: { optimal: 0.3, tolerance: 0.2 },
            direct: { optimal: 0.6, tolerance: 0.2 },
            blunt: { optimal: 0.8, tolerance: 0.15 }
        };

        const expectation = expectations[expectedDirectness] || expectations.direct;
        const difference = Math.abs(ratio - expectation.optimal);

        return difference <= expectation.tolerance ? 100 : Math.max(40, 100 - (difference * 200));
    }

    scoreEmpathyAlignment(ratio, expectedEmpathy) {
        const expectations = {
            reserved: { max: 0.02, score: ratio <= 0.02 ? 100 : 70 },
            warm: { optimal: 0.04, tolerance: 0.02 },
            passionate: { min: 0.06, score: ratio >= 0.06 ? 100 : 80 }
        };

        const expectation = expectations[expectedEmpathy];
        if (expectation.optimal) {
            const difference = Math.abs(ratio - expectation.optimal);
            return difference <= expectation.tolerance ? 100 : 75;
        }

        return expectation.score;
    }

    scoreAuthorityAlignment(ratio, expectedAuthority) {
        const expectations = {
            humble: { max: 0.03, score: ratio <= 0.03 ? 100 : 70 },
            confident: { optimal: 0.05, tolerance: 0.02 },
            commanding: { min: 0.07, score: ratio >= 0.07 ? 100 : 80 }
        };

        const expectation = expectations[expectedAuthority];
        if (expectation.optimal) {
            const difference = Math.abs(ratio - expectation.optimal);
            return difference <= expectation.tolerance ? 100 : 75;
        }

        return expectation.score;
    }

    calculateVoiceMatch(voiceAnalysis, quoteAnalysis, contextAnalysis) {
        const weights = {
            voice: 0.5,
            quotes: 0.3,
            context: 0.2
        };

        const voiceScore = (voiceAnalysis.vocabulary.consistencyScore + voiceAnalysis.rhetoric.repetitionScore + voiceAnalysis.tone.overallTone + voiceAnalysis.authenticity) / 4;
        const quoteScore = quoteAnalysis.authenticityScore;
        const contextScore = contextAnalysis.appropriateness;

        return Math.round(
            voiceScore * weights.voice +
            quoteScore * weights.quotes +
            contextScore * weights.context
        );
    }

    generateVoiceSuggestions(voiceAnalysis, quoteAnalysis, contextAnalysis) {
        const suggestions = [];

        // Voice-specific suggestions
        if (voiceAnalysis.vocabulary.formalityScore < 70) {
            suggestions.push('Adjust formality level to match candidate\'s typical speaking style');
        }
        if (voiceAnalysis.tone.directnessScore < 70) {
            suggestions.push('Modify directness to align with candidate\'s communication style');
        }

        // Quote-specific suggestions
        if (quoteAnalysis.authenticityScore < 70) {
            suggestions.push('Revise quotes to sound more authentic to candidate\'s voice');
        }

        // Context-specific suggestions
        if (contextAnalysis.appropriateness < 70) {
            suggestions.push('Adjust tone to be more appropriate for this type of communication');
        }

        return suggestions;
    }

    identifyAuthenticityIssues(voiceAnalysis, quoteAnalysis) {
        const issues = [];

        issues.push(...voiceAnalysis.issues);
        issues.push(...quoteAnalysis.issues);

        if (voiceAnalysis.authenticity < 60) {
            issues.push('Content does not sound authentic to candidate\'s voice');
        }

        return issues;
    }

    // Quick voice check for real-time feedback
    quickVoiceCheck(content, candidateProfile) {
        const issues = [];
        const suggestions = [];

        // Basic voice consistency checks
        const wordCount = content.split(/\s+/).length;
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
        const avgSentenceLength = wordCount / sentences.length;

        // Check sentence length consistency
        if (candidateProfile?.voice?.typical_sentence_length) {
            const expected = candidateProfile.voice.typical_sentence_length;
            if ((expected === 'short' && avgSentenceLength > 15) ||
                (expected === 'long' && avgSentenceLength < 12)) {
                suggestions.push(`Adjust sentence length to match candidate's typical ${expected} sentences`);
            }
        }

        // Check for avoided words
        if (candidateProfile?.voice?.avoid_words) {
            for (const word of candidateProfile.voice.avoid_words) {
                if (content.toLowerCase().includes(word.toLowerCase())) {
                    issues.push(`Remove "${word}" - not typical for this candidate`);
                }
            }
        }

        // Quick quote check
        const quotes = content.match(/"([^"]{10,})"/g) || [];
        if (quotes.length > 0) {
            quotes.forEach(quote => {
                if (quote.length > 200) {
                    suggestions.push('Consider shortening quotes for more natural speech patterns');
                }
            });
        }

        return {
            issues,
            suggestions,
            voiceScore: Math.max(0, 100 - issues.length * 15 - suggestions.length * 5)
        };
    }
}

module.exports = new CandidateVoiceChecker();