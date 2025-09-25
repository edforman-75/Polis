import { useState, useEffect } from '@wordpress/element';
import { Button, Card, CardBody, Modal, TextareaControl } from '@wordpress/components';

export class SuggestionEngine {
    constructor() {
        this.suggestions = [];
        this.logs = [];
        this.userPreferences = {};
        this.rejectionReasons = {};
    }

    // Generate suggestions based on content analysis
    async generateSuggestions(content, documentType, candidateProfile) {
        const suggestions = [];

        // AI Optimization Suggestions
        const aiSuggestions = await this.analyzeForAI(content, documentType);
        suggestions.push(...aiSuggestions);

        // Fact-checking suggestions
        const factSuggestions = await this.checkFacts(content);
        suggestions.push(...factSuggestions);

        // Voice consistency suggestions
        const voiceSuggestions = await this.checkVoiceConsistency(content, candidateProfile);
        suggestions.push(...voiceSuggestions);

        // Grammar and style suggestions
        const grammarSuggestions = await this.checkGrammar(content);
        suggestions.push(...grammarSuggestions);

        // Accessibility suggestions
        const accessibilitySuggestions = await this.checkAccessibility(content, documentType);
        suggestions.push(...accessibilitySuggestions);

        // Prioritize suggestions
        return this.prioritizeSuggestions(suggestions);
    }

    async analyzeForAI(content, documentType) {
        const suggestions = [];

        // Headline optimization
        const headlines = this.extractHeadlines(content);
        headlines.forEach(headline => {
            if (headline.length > 60) {
                suggestions.push({
                    id: this.generateId(),
                    type: 'ai',
                    category: 'seo',
                    priority: 'high',
                    title: 'Shorten headline for AI discovery',
                    description: `Your headline is ${headline.length} characters. AI systems prefer headlines under 60 characters for better featured snippets and voice search results.`,
                    currentText: headline,
                    suggestedText: this.shortenHeadline(headline),
                    reason: 'Headlines under 60 characters are 3x more likely to appear in AI-generated summaries',
                    impact: 'Increases visibility in Google AI Overviews and voice assistants',
                    confidence: 0.9,
                    learnMore: 'AI systems extract shorter headlines more reliably for voice responses and featured snippets.',
                    examples: [
                        'Good: "Smith Announces Healthcare Plan"',
                        'Too long: "Smith Announces Comprehensive Healthcare Reform Plan to Address Rising Costs"'
                    ]
                });
            }
        });

        // Keyword optimization
        const keywordGaps = await this.analyzeKeywords(content);
        if (keywordGaps.length > 0) {
            suggestions.push({
                id: this.generateId(),
                type: 'ai',
                category: 'keywords',
                priority: 'medium',
                title: 'Add location keywords for local discovery',
                description: 'Including location-specific terms helps AI systems connect your content to local searches.',
                currentText: this.extractFirstParagraph(content),
                suggestedText: this.addLocationKeywords(this.extractFirstParagraph(content), keywordGaps),
                reason: 'Local keywords improve discovery by 60% for "near me" searches',
                impact: 'Better visibility in local AI search results',
                confidence: 0.8
            });
        }

        // Structure optimization
        if (!this.hasNumberedLists(content)) {
            suggestions.push({
                id: this.generateId(),
                type: 'ai',
                category: 'structure',
                priority: 'medium',
                title: 'Add numbered lists for better AI extraction',
                description: 'AI systems prefer structured content with clear lists for summarization.',
                reason: 'Numbered lists are 40% more likely to be extracted by AI systems',
                impact: 'Improves chances of appearing in AI-generated answers',
                confidence: 0.7,
                actionType: 'add_structure',
                template: '1. First key point\n2. Second key point\n3. Third key point'
            });
        }

        return suggestions;
    }

    async checkFacts(content) {
        const suggestions = [];
        
        // Check numerical claims
        const numbers = this.extractNumericalClaims(content);
        for (const claim of numbers) {
            const verification = await this.verifyNumericalClaim(claim);
            if (!verification.verified) {
                suggestions.push({
                    id: this.generateId(),
                    type: 'fact',
                    priority: 'high',
                    title: 'Verify numerical claim',
                    description: `The claim "${claim.text}" needs verification against reliable sources.`,
                    currentText: claim.text,
                    reason: 'Unverified numbers can damage credibility',
                    impact: 'Prevents misinformation and builds trust',
                    confidence: 0.95,
                    actionRequired: 'verification',
                    sources: verification.suggestedSources || []
                });
            }
        }

        // Check against campaign database for contradictions
        const contradictions = await this.checkContradictions(content);
        contradictions.forEach(contradiction => {
            suggestions.push({
                id: this.generateId(),
                type: 'fact',
                priority: contradiction.severity === 'high' ? 'high' : 'medium',
                title: 'Potential contradiction detected',
                description: `This statement may contradict previous campaign communications.`,
                currentText: contradiction.currentText,
                conflictsWith: contradiction.previousStatement,
                sourceDocument: contradiction.source,
                reason: 'Consistent messaging builds voter trust',
                impact: 'Prevents voter confusion and maintains credibility',
                confidence: contradiction.confidence
            });
        });

        return suggestions;
    }

    async checkVoiceConsistency(content, candidateProfile) {
        const suggestions = [];
        
        // Analyze tone
        const toneAnalysis = await this.analyzeTone(content);
        if (toneAnalysis.score < 0.8) {
            suggestions.push({
                id: this.generateId(),
                type: 'voice',
                priority: 'medium',
                title: 'Adjust tone to match candidate voice',
                description: `The current tone (${toneAnalysis.detected}) doesn't match the candidate's preferred voice (${candidateProfile.preferredTone}).`,
                reason: 'Consistent voice builds candidate recognition',
                impact: 'Strengthens candidate brand identity',
                confidence: toneAnalysis.confidence,
                suggestions: toneAnalysis.improvements
            });
        }

        // Check reading level
        const readingLevel = this.calculateReadingLevel(content);
        if (readingLevel > candidateProfile.targetReadingLevel) {
            suggestions.push({
                id: this.generateId(),
                type: 'voice',
                priority: 'low',
                title: 'Simplify language for broader audience',
                description: `Current reading level is Grade ${readingLevel}. Target is Grade ${candidateProfile.targetReadingLevel}.`,
                reason: 'Accessible language reaches more voters',
                impact: 'Increases comprehension across education levels',
                confidence: 0.9,
                complexSentences: this.identifyComplexSentences(content)
            });
        }

        return suggestions;
    }

    async checkGrammar(content) {
        // Simulate integration with LanguageTool or similar
        const issues = await this.callGrammarAPI(content);
        return issues.map(issue => ({
            id: this.generateId(),
            type: 'grammar',
            priority: issue.severity === 'error' ? 'high' : 'low',
            title: issue.category === 'style' ? 'Style suggestion' : 'Grammar correction',
            description: issue.message,
            currentText: content.substring(issue.offset, issue.offset + issue.length),
            suggestedText: issue.replacements[0]?.value || '',
            reason: issue.category === 'grammar' ? 'Correct grammar builds credibility' : 'Clear writing improves engagement',
            impact: 'Professional presentation builds trust',
            confidence: issue.confidence || 0.8,
            ruleId: issue.rule?.id
        }));
    }

    async checkAccessibility(content, documentType) {
        const suggestions = [];

        // Check for alt text on images
        if (this.hasImages(content) && !this.hasAltText(content)) {
            suggestions.push({
                id: this.generateId(),
                type: 'accessibility',
                priority: 'medium',
                title: 'Add alt text for images',
                description: 'Images need descriptive alt text for screen readers and SEO.',
                reason: 'Makes content accessible to voters with disabilities',
                impact: 'Improves accessibility and search engine optimization',
                confidence: 1.0
            });
        }

        // Check heading structure
        if (!this.hasProperHeadingStructure(content)) {
            suggestions.push({
                id: this.generateId(),
                type: 'accessibility',
                priority: 'low',
                title: 'Improve heading structure',
                description: 'Use proper heading hierarchy (H1, H2, H3) for better navigation.',
                reason: 'Helps screen readers and improves SEO',
                impact: 'Better accessibility and search ranking',
                confidence: 0.9
            });
        }

        return suggestions;
    }

    prioritizeSuggestions(suggestions) {
        // Sort by priority and impact
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        
        return suggestions.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return (b.confidence || 0.5) - (a.confidence || 0.5);
        });
    }

    // User interaction methods
    acceptSuggestion(suggestionId, modifications = null) {
        const suggestion = this.findSuggestion(suggestionId);
        if (!suggestion) return;

        const logEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            action: modifications ? 'modified' : 'accepted',
            suggestionId,
            suggestionType: suggestion.type,
            suggestionTitle: suggestion.title,
            modifications,
            userId: this.getCurrentUserId()
        };

        this.logs.push(logEntry);
        this.removeSuggestion(suggestionId);
        this.updateUserPreferences(suggestion, 'positive');
        
        return logEntry;
    }

    rejectSuggestion(suggestionId, reason = null) {
        const suggestion = this.findSuggestion(suggestionId);
        if (!suggestion) return;

        const logEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            action: 'rejected',
            suggestionId,
            suggestionType: suggestion.type,
            suggestionTitle: suggestion.title,
            rejectionReason: reason,
            userId: this.getCurrentUserId()
        };

        this.logs.push(logEntry);
        this.rejectionReasons[suggestionId] = reason;
        this.removeSuggestion(suggestionId);
        this.updateUserPreferences(suggestion, 'negative');
        
        return logEntry;
    }

    skipSuggestion(suggestionId) {
        const suggestion = this.findSuggestion(suggestionId);
        if (!suggestion) return;

        const logEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            action: 'skipped',
            suggestionId,
            suggestionType: suggestion.type,
            suggestionTitle: suggestion.title,
            userId: this.getCurrentUserId()
        };

        this.logs.push(logEntry);
        this.removeSuggestion(suggestionId);
        
        return logEntry;
    }

    updateUserPreferences(suggestion, feedback) {
        const key = `${suggestion.type}_${suggestion.category}`;
        if (!this.userPreferences[key]) {
            this.userPreferences[key] = { positive: 0, negative: 0, total: 0 };
        }
        
        this.userPreferences[key].total++;
        if (feedback === 'positive') {
            this.userPreferences[key].positive++;
        } else {
            this.userPreferences[key].negative++;
        }
    }

    // Analytics and reporting
    getUserStats(userId = null) {
        const userLogs = userId ? 
            this.logs.filter(log => log.userId === userId) : 
            this.logs;

        const stats = {
            totalSuggestions: userLogs.length,
            accepted: userLogs.filter(log => log.action === 'accepted').length,
            modified: userLogs.filter(log => log.action === 'modified').length,
            rejected: userLogs.filter(log => log.action === 'rejected').length,
            skipped: userLogs.filter(log => log.action === 'skipped').length,
            byType: {}
        };

        // Group by suggestion type
        userLogs.forEach(log => {
            if (!stats.byType[log.suggestionType]) {
                stats.byType[log.suggestionType] = {
                    accepted: 0,
                    modified: 0,
                    rejected: 0,
                    skipped: 0
                };
            }
            stats.byType[log.suggestionType][log.action]++;
        });

        stats.acceptanceRate = stats.totalSuggestions > 0 ? 
            ((stats.accepted + stats.modified) / stats.totalSuggestions * 100).toFixed(1) : 0;

        return stats;
    }

    getTopRejectionReasons() {
        const reasons = {};
        Object.values(this.rejectionReasons).forEach(reason => {
            if (reason) {
                reasons[reason] = (reasons[reason] || 0) + 1;
            }
        });
        
        return Object.entries(reasons)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([reason, count]) => ({ reason, count }));
    }

    // Helper methods
    generateId() {
        return 'sug_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    findSuggestion(id) {
        return this.suggestions.find(s => s.id === id);
    }

    removeSuggestion(id) {
        const index = this.suggestions.findIndex(s => s.id === id);
        if (index > -1) {
            this.suggestions.splice(index, 1);
        }
    }

    getCurrentUserId() {
        // In production, get from WordPress user system
        return 'user_' + Date.now();
    }

    // Content analysis helpers
    extractHeadlines(content) {
        // Extract H1, H2 tags and title attributes
        const headlineRegex = /<h[1-2][^>]*>(.*?)<\/h[1-2]>/gi;
        const matches = [];
        let match;
        
        while ((match = headlineRegex.exec(content)) !== null) {
            matches.push(match[1].replace(/<[^>]*>/g, '').trim());
        }
        
        return matches;
    }

    shortenHeadline(headline) {
        // Simple algorithm to shorten headlines while preserving meaning
        const words = headline.split(' ');
        const important = words.filter(word => 
            word.length > 3 && 
            !['the', 'and', 'for', 'that', 'with', 'will', 'are'].includes(word.toLowerCase())
        );
        
        return important.slice(0, 8).join(' ');
    }

    extractNumericalClaims(content) {
        const numberRegex = /\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:percent|%|million|billion|thousand|jobs|dollars?))/gi;
        const matches = [];
        let match;
        
        while ((match = numberRegex.exec(content)) !== null) {
            matches.push({
                text: match[0],
                value: match[0],
                context: content.substring(Math.max(0, match.index - 50), match.index + 50)
            });
        }
        
        return matches;
    }

    async verifyNumericalClaim(claim) {
        // In production, this would check against fact-checking databases
        return {
            verified: Math.random() > 0.3, // Simulate verification
            confidence: Math.random() * 0.4 + 0.6,
            suggestedSources: [
                'Bureau of Labor Statistics',
                'Census Bureau',
                'Congressional Budget Office'
            ]
        };
    }

    calculateReadingLevel(content) {
        // Simplified Flesch-Kincaid grade level
        const sentences = content.split(/[.!?]+/).length;
        const words = content.split(/\s+/).length;
        const syllables = this.countSyllables(content);
        
        const avgSentenceLength = words / sentences;
        const avgSyllablesPerWord = syllables / words;
        
        return Math.round(0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59);
    }

    countSyllables(text) {
        return text.toLowerCase().split(/\s+/).reduce((total, word) => {
            return total + Math.max(1, word.replace(/[^aeiou]/g, '').length);
        }, 0);
    }

    async callGrammarAPI(content) {
        // Simulate LanguageTool API response
        return [
            {
                offset: 45,
                length: 10,
                message: 'Consider using active voice',
                severity: 'style',
                category: 'style',
                replacements: [{ value: 'we will implement' }],
                confidence: 0.8
            }
        ];
    }
}

// React component for suggestion interaction
export const SuggestionInteractionPanel = ({ suggestion, onAccept, onReject, onModify, onSkip }) => {
    const [showModifyModal, setShowModifyModal] = useState(false);
    const [modifiedText, setModifiedText] = useState(suggestion.suggestedText || '');
    const [showDetails, setShowDetails] = useState(false);

    const handleModify = () => {
        if (modifiedText.trim() !== suggestion.suggestedText) {
            onModify(suggestion.id, modifiedText);
            setShowModifyModal(false);
        }
    };

    return (
        <div className={`suggestion-item ${suggestion.type}`}>
            <div className="suggestion-header">
                <div className="suggestion-type-badge">
                    {suggestion.type.toUpperCase()}
                </div>
                <div className={`suggestion-priority ${suggestion.priority}`}>
                    {suggestion.priority}
                </div>
            </div>

            <div className="suggestion-content">
                <h4 className="suggestion-title">{suggestion.title}</h4>
                <p className="suggestion-description">{suggestion.description}</p>

                {suggestion.currentText && (
                    <div className="text-comparison">
                        <div className="current-text">
                            <strong>Current:</strong>
                            <div className="text-sample">{suggestion.currentText}</div>
                        </div>
                        {suggestion.suggestedText && (
                            <div className="suggested-text">
                                <strong>Suggested:</strong>
                                <div className="text-sample">{suggestion.suggestedText}</div>
                            </div>
                        )}
                    </div>
                )}

                <div className="suggestion-reason">
                    <strong>Why this helps:</strong> {suggestion.reason}
                </div>

                {showDetails && (
                    <div className="suggestion-details">
                        <div><strong>Impact:</strong> {suggestion.impact}</div>
                        <div><strong>Confidence:</strong> {Math.round((suggestion.confidence || 0.5) * 100)}%</div>
                        {suggestion.examples && (
                            <div>
                                <strong>Examples:</strong>
                                <ul>
                                    {suggestion.examples.map((example, i) => (
                                        <li key={i}>{example}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="suggestion-actions">
                <Button isPrimary onClick={() => onAccept(suggestion.id)}>
                    ✅ Apply
                </Button>
                
                {suggestion.suggestedText && (
                    <Button isSecondary onClick={() => setShowModifyModal(true)}>
                        ✏️ Modify
                    </Button>
                )}
                
                <Button onClick={() => setShowDetails(!showDetails)}>
                    {showDetails ? 'Less' : 'More'} Info
                </Button>
                
                <Button isDestructive onClick={() => onReject(suggestion.id)}>
                    ❌ Not Helpful
                </Button>
                
                <Button isTertiary onClick={() => onSkip(suggestion.id)}>
                    Skip
                </Button>
            </div>

            {showModifyModal && (
                <Modal
                    title="Modify Suggestion"
                    onRequestClose={() => setShowModifyModal(false)}
                >
                    <div className="modify-modal-content">
                        <p>Edit the suggestion to better fit your needs:</p>
                        <TextareaControl
                            value={modifiedText}
                            onChange={setModifiedText}
                            rows={4}
                        />
                        <div className="modal-actions">
                            <Button isPrimary onClick={handleModify}>
                                Apply Modified Version
                            </Button>
                            <Button isSecondary onClick={() => setShowModifyModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};