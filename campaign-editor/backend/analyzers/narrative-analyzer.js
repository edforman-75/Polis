class NarrativeAnalyzer {
    constructor() {
        this.campaignTypes = {
            candidacy_announcement: {
                keywords: ['announces', 'candidacy', 'running for', 'seeks office', 'will run', 'campaign for'],
                blocks: [
                    'announcement_statement',
                    'candidate_background',
                    'campaign_motivation',
                    'policy_priorities',
                    'community_connection',
                    'call_to_action',
                    'endorsements_support',
                    'campaign_logistics'
                ]
            },
            policy_position: {
                keywords: ['proposes', 'supports', 'opposes', 'policy', 'legislation', 'bill', 'issue'],
                blocks: [
                    'issue_statement',
                    'position_explanation',
                    'supporting_evidence',
                    'impact_analysis',
                    'stakeholder_quotes',
                    'action_steps',
                    'background_context',
                    'contact_information'
                ]
            },
            event_announcement: {
                keywords: ['event', 'rally', 'town hall', 'meeting', 'conference', 'forum'],
                blocks: [
                    'event_announcement',
                    'event_details',
                    'speaker_information',
                    'agenda_topics',
                    'attendance_info',
                    'background_context',
                    'quote_significance',
                    'contact_registration'
                ]
            }
        };

        this.narrativeBlocks = {
            announcement_statement: {
                name: 'Announcement Statement',
                description: 'Clear declaration of candidacy or decision',
                keywords: ['announces', 'declares', 'today announced', 'officially'],
                importance: 'critical'
            },
            candidate_background: {
                name: 'Candidate Background',
                description: 'Professional experience and qualifications',
                keywords: ['experience', 'served', 'worked', 'background', 'career'],
                importance: 'high'
            },
            campaign_motivation: {
                name: 'Campaign Motivation',
                description: 'Why the candidate is running',
                keywords: ['believes', 'committed to', 'dedicated to', 'fight for'],
                importance: 'high'
            },
            policy_priorities: {
                name: 'Policy Priorities',
                description: 'Key issues and policy positions',
                keywords: ['priorities', 'issues', 'focus on', 'work on'],
                importance: 'medium'
            },
            community_connection: {
                name: 'Community Connection',
                description: 'Local ties and community involvement',
                keywords: ['community', 'local', 'neighbors', 'families'],
                importance: 'medium'
            },
            call_to_action: {
                name: 'Call to Action',
                description: 'What supporters should do',
                keywords: ['join', 'support', 'vote', 'help', 'volunteer'],
                importance: 'medium'
            },
            endorsements_support: {
                name: 'Endorsements & Support',
                description: 'Notable endorsements or supporter quotes',
                keywords: ['endorsed', 'supports', 'backing'],
                importance: 'low'
            },
            campaign_logistics: {
                name: 'Campaign Logistics',
                description: 'Campaign organization and contact info',
                keywords: ['campaign', 'contact', 'information', 'website'],
                importance: 'low'
            }
        };
    }

    analyze(text) {
        const campaignType = this.detectCampaignType(text);
        const blockAnalysis = this.analyzeNarrativeBlocks(text, campaignType);
        const flowAnalysis = this.analyzeNarrativeFlow(text, blockAnalysis);
        const gapAnalysis = this.identifyGaps(blockAnalysis, campaignType);
        const recommendations = this.generateRecommendations(blockAnalysis, gapAnalysis, campaignType);

        return {
            campaign_type: campaignType,
            narrative_blocks: blockAnalysis,
            narrative_flow: flowAnalysis,
            gap_analysis: gapAnalysis,
            recommendations: recommendations,
            overall_score: this.calculateOverallScore(blockAnalysis, campaignType)
        };
    }

    detectCampaignType(text) {
        const textLower = text.toLowerCase();
        let bestMatch = null;
        let highestScore = 0;

        for (const [type, config] of Object.entries(this.campaignTypes)) {
            let score = 0;
            for (const keyword of config.keywords) {
                if (textLower.includes(keyword)) {
                    score += 1;
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                    type: type,
                    confidence: Math.min(score / config.keywords.length, 1.0),
                    matched_keywords: config.keywords.filter(k => textLower.includes(k))
                };
            }
        }

        return bestMatch || {
            type: 'unknown',
            confidence: 0,
            matched_keywords: []
        };
    }

    analyzeNarrativeBlocks(text, campaignType) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

        const blockAnalysis = {};
        const relevantBlocks = campaignType.type !== 'unknown'
            ? this.campaignTypes[campaignType.type].blocks
            : Object.keys(this.narrativeBlocks);

        for (const blockKey of relevantBlocks) {
            const block = this.narrativeBlocks[blockKey];
            if (!block) continue;

            const analysis = this.analyzeBlock(text, paragraphs, sentences, block);
            blockAnalysis[blockKey] = {
                ...block,
                ...analysis,
                block_key: blockKey
            };
        }

        return blockAnalysis;
    }

    analyzeBlock(text, paragraphs, sentences, block) {
        const textLower = text.toLowerCase();
        let keywordMatches = 0;
        let matchedKeywords = [];
        let relevantContent = [];
        let confidence = 0;

        // Find keyword matches
        for (const keyword of block.keywords) {
            if (textLower.includes(keyword)) {
                keywordMatches++;
                matchedKeywords.push(keyword);
            }
        }

        // Find relevant paragraphs/sentences
        for (const paragraph of paragraphs) {
            const paragraphLower = paragraph.toLowerCase();
            let relevanceScore = 0;

            for (const keyword of block.keywords) {
                if (paragraphLower.includes(keyword)) {
                    relevanceScore += 2;
                }
            }

            // Context-based relevance (look for related terms)
            const contextTerms = this.getContextTerms(block.name);
            for (const term of contextTerms) {
                if (paragraphLower.includes(term)) {
                    relevanceScore += 1;
                }
            }

            if (relevanceScore > 0) {
                relevantContent.push({
                    content: paragraph.trim(),
                    relevance_score: relevanceScore,
                    word_count: paragraph.split(/\s+/).length
                });
            }
        }

        // Sort by relevance and take top content
        relevantContent.sort((a, b) => b.relevance_score - a.relevance_score);

        // Calculate confidence based on keyword matches and content relevance
        if (keywordMatches > 0 || relevantContent.length > 0) {
            confidence = Math.min(
                (keywordMatches / block.keywords.length * 0.6) +
                (Math.min(relevantContent.length, 3) / 3 * 0.4),
                1.0
            );
        }

        const status = confidence > 0.7 ? 'strong' :
                      confidence > 0.3 ? 'present' :
                      confidence > 0.1 ? 'weak' : 'missing';

        return {
            status: status,
            confidence: confidence,
            keyword_matches: keywordMatches,
            matched_keywords: matchedKeywords,
            relevant_content: relevantContent.slice(0, 3), // Top 3 most relevant
            word_count: relevantContent.reduce((sum, item) => sum + item.word_count, 0),
            suggestions: this.generateBlockSuggestions(block, status, relevantContent)
        };
    }

    getContextTerms(blockName) {
        const contextMap = {
            'Announcement Statement': ['running', 'candidate', 'election', 'office'],
            'Candidate Background': ['experience', 'qualifications', 'resume', 'history'],
            'Campaign Motivation': ['why', 'reason', 'because', 'motivated'],
            'Policy Priorities': ['plan', 'agenda', 'goals', 'objectives'],
            'Community Connection': ['local', 'community', 'neighborhood', 'residents'],
            'Call to Action': ['support', 'join', 'help', 'volunteer', 'donate'],
            'Endorsements & Support': ['endorsed', 'support', 'backing'],
            'Campaign Logistics': ['contact', 'website', 'information', 'headquarters']
        };
        return contextMap[blockName] || [];
    }

    analyzeNarrativeFlow(text, blockAnalysis) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);

        // Analyze paragraph-by-paragraph flow
        const flowAnalysis = paragraphs.map((paragraph, index) => {
            const matches = [];

            for (const [blockKey, analysis] of Object.entries(blockAnalysis)) {
                for (const content of analysis.relevant_content) {
                    if (paragraph.includes(content.content)) {
                        matches.push({
                            block: blockKey,
                            block_name: analysis.name,
                            relevance: content.relevance_score
                        });
                    }
                }
            }

            return {
                paragraph_index: index,
                paragraph_preview: paragraph.substring(0, 100) + '...',
                word_count: paragraph.split(/\s+/).length,
                narrative_blocks: matches.sort((a, b) => b.relevance - a.relevance)
            };
        });

        // Analyze overall flow quality
        const flowQuality = this.assessFlowQuality(flowAnalysis, blockAnalysis);

        return {
            paragraph_flow: flowAnalysis,
            flow_quality: flowQuality
        };
    }

    assessFlowQuality(flowAnalysis, blockAnalysis) {
        const totalParagraphs = flowAnalysis.length;
        const mappedParagraphs = flowAnalysis.filter(p => p.narrative_blocks.length > 0).length;
        const coverage = mappedParagraphs / totalParagraphs;

        // Check for logical ordering
        const blockOrder = [];
        for (const paragraph of flowAnalysis) {
            if (paragraph.narrative_blocks.length > 0) {
                blockOrder.push(paragraph.narrative_blocks[0].block);
            }
        }

        return {
            coverage_percentage: Math.round(coverage * 100),
            mapped_paragraphs: mappedParagraphs,
            total_paragraphs: totalParagraphs,
            block_sequence: blockOrder,
            flow_score: this.calculateFlowScore(coverage, blockOrder)
        };
    }

    calculateFlowScore(coverage, blockOrder) {
        let score = coverage * 0.6; // 60% weight for coverage

        // Add points for logical flow
        const idealOrder = ['announcement_statement', 'candidate_background', 'campaign_motivation', 'policy_priorities'];
        let orderScore = 0;
        let lastIdealIndex = -1;

        for (const block of blockOrder) {
            const idealIndex = idealOrder.indexOf(block);
            if (idealIndex > lastIdealIndex) {
                orderScore += 0.1;
                lastIdealIndex = idealIndex;
            }
        }

        score += Math.min(orderScore, 0.4); // 40% weight for order

        return Math.min(score, 1.0);
    }

    identifyGaps(blockAnalysis, campaignType) {
        const gaps = [];
        const weakBlocks = [];
        const missingBlocks = [];

        for (const [blockKey, analysis] of Object.entries(blockAnalysis)) {
            if (analysis.status === 'missing') {
                missingBlocks.push({
                    block: blockKey,
                    name: analysis.name,
                    importance: analysis.importance,
                    suggestion: `Add ${analysis.name.toLowerCase()} section`
                });
            } else if (analysis.status === 'weak') {
                weakBlocks.push({
                    block: blockKey,
                    name: analysis.name,
                    confidence: analysis.confidence,
                    suggestion: `Strengthen ${analysis.name.toLowerCase()} with more specific details`
                });
            }
        }

        return {
            missing_blocks: missingBlocks.sort((a, b) =>
                this.getImportanceValue(b.importance) - this.getImportanceValue(a.importance)
            ),
            weak_blocks: weakBlocks.sort((a, b) => a.confidence - b.confidence),
            gap_count: missingBlocks.length + weakBlocks.length
        };
    }

    getImportanceValue(importance) {
        return { critical: 4, high: 3, medium: 2, low: 1 }[importance] || 0;
    }

    generateRecommendations(blockAnalysis, gapAnalysis, campaignType) {
        const recommendations = [];

        // High priority recommendations for missing critical/high importance blocks
        for (const gap of gapAnalysis.missing_blocks) {
            if (gap.importance === 'critical' || gap.importance === 'high') {
                recommendations.push({
                    type: 'critical',
                    priority: 'high',
                    suggestion: `Add ${gap.name}: ${this.getDetailedSuggestion(gap.block)}`,
                    block: gap.block
                });
            }
        }

        // Medium priority for weak blocks
        for (const weak of gapAnalysis.weak_blocks.slice(0, 3)) {
            recommendations.push({
                type: 'improvement',
                priority: 'medium',
                suggestion: `Strengthen ${weak.name}: ${this.getImprovementSuggestion(weak.block)}`,
                block: weak.block
            });
        }

        // Campaign-type specific recommendations
        if (campaignType.type === 'candidacy_announcement') {
            if (!blockAnalysis.call_to_action || blockAnalysis.call_to_action.status === 'weak') {
                recommendations.push({
                    type: 'enhancement',
                    priority: 'medium',
                    suggestion: 'Add a clear call to action for supporters (volunteer, donate, spread the word)',
                    block: 'call_to_action'
                });
            }
        }

        return recommendations.slice(0, 5); // Top 5 recommendations
    }

    getDetailedSuggestion(blockKey) {
        const suggestions = {
            announcement_statement: 'Include a clear, direct statement announcing your candidacy',
            candidate_background: 'Add 2-3 sentences about your relevant experience and qualifications',
            campaign_motivation: 'Explain why you are running and what drives your commitment to serve',
            policy_priorities: 'Outline 2-3 key issues you will focus on as an elected official',
            community_connection: 'Highlight your local ties and understanding of community needs',
            call_to_action: 'Include specific ways supporters can help your campaign',
            endorsements_support: 'Add quotes from notable supporters or endorsers',
            campaign_logistics: 'Provide campaign contact information and website'
        };
        return suggestions[blockKey] || 'Develop this section with relevant content';
    }

    getImprovementSuggestion(blockKey) {
        const suggestions = {
            announcement_statement: 'Make the announcement more prominent and direct',
            candidate_background: 'Add more specific examples of relevant experience',
            campaign_motivation: 'Provide more personal details about your motivation to serve',
            policy_priorities: 'Be more specific about your policy positions and goals',
            community_connection: 'Include more details about your local involvement',
            call_to_action: 'Make the call to action more specific and actionable',
            endorsements_support: 'Add more endorser quotes or supporter testimonials',
            campaign_logistics: 'Ensure all contact information is complete and prominent'
        };
        return suggestions[blockKey] || 'Add more detail and specificity to this section';
    }

    generateBlockSuggestions(block, status, relevantContent) {
        const suggestions = [];

        if (status === 'missing') {
            suggestions.push(`Add a ${block.name.toLowerCase()} section to strengthen your message`);
        } else if (status === 'weak') {
            suggestions.push(`Expand the ${block.name.toLowerCase()} with more specific details`);
            if (relevantContent.length > 0) {
                suggestions.push('Consider developing the existing content further');
            }
        } else if (status === 'present' && relevantContent.length > 0) {
            const wordCount = relevantContent.reduce((sum, item) => sum + item.word_count, 0);
            if (wordCount < 50) {
                suggestions.push('Consider adding more detail to this section');
            }
        }

        return suggestions;
    }

    calculateOverallScore(blockAnalysis, campaignType) {
        let totalWeight = 0;
        let weightedScore = 0;

        for (const [blockKey, analysis] of Object.entries(blockAnalysis)) {
            const weight = this.getImportanceValue(analysis.importance);
            totalWeight += weight;

            let blockScore = 0;
            if (analysis.status === 'strong') blockScore = 1.0;
            else if (analysis.status === 'present') blockScore = 0.7;
            else if (analysis.status === 'weak') blockScore = 0.3;
            // missing = 0

            weightedScore += blockScore * weight;
        }

        const score = totalWeight > 0 ? weightedScore / totalWeight : 0;

        return {
            score: Math.round(score * 100),
            grade: this.getGrade(score),
            confidence: campaignType.confidence
        };
    }

    getGrade(score) {
        if (score >= 0.9) return 'A';
        if (score >= 0.8) return 'B';
        if (score >= 0.7) return 'C';
        if (score >= 0.6) return 'D';
        return 'F';
    }
}

module.exports = NarrativeAnalyzer;