class RecommendationsEngine {
    constructor() {
        this.priorityWeights = {
            critical: 100,
            high: 75,
            medium: 50,
            low: 25
        };

        this.recommendationTypes = {
            content_revision: {
                name: 'Content Revision',
                icon: '✏️',
                color: '#ef4444',
                description: 'Direct text changes needed'
            },
            structure_improvement: {
                name: 'Structure Enhancement',
                icon: '🏗️',
                color: '#f59e0b',
                description: 'Organizational and flow improvements'
            },
            compliance_fix: {
                name: 'Compliance Fix',
                icon: '⚖️',
                color: '#dc2626',
                description: 'Legal and regulatory requirements'
            },
            fact_verification: {
                name: 'Fact Verification',
                icon: '🔍',
                color: '#3b82f6',
                description: 'Claims requiring verification'
            },
            messaging_optimization: {
                name: 'Messaging Optimization',
                icon: '🎯',
                color: '#10b981',
                description: 'Strategic messaging improvements'
            },
            technical_enhancement: {
                name: 'Technical Enhancement',
                icon: '⚙️',
                color: '#8b5cf6',
                description: 'AI and readability optimization'
            }
        };
    }

    generateUnifiedRecommendations(analysisResults) {
        const allRecommendations = [];

        // Extract recommendations from each analysis
        if (analysisResults.narrative) {
            allRecommendations.push(...this.extractNarrativeRecommendations(analysisResults.narrative));
        }

        if (analysisResults.aiOptimization) {
            allRecommendations.push(...this.extractAIRecommendations(analysisResults.aiOptimization));
        }

        if (analysisResults.compliance) {
            allRecommendations.push(...this.extractComplianceRecommendations(analysisResults.compliance));
        }

        if (analysisResults.factChecking) {
            allRecommendations.push(...this.extractFactCheckRecommendations(analysisResults.factChecking));
        }

        if (analysisResults.contentFields) {
            allRecommendations.push(...this.extractContentFieldRecommendations(analysisResults.contentFields));
        }

        // Prioritize and deduplicate
        const prioritizedRecommendations = this.prioritizeRecommendations(allRecommendations);
        const groupedRecommendations = this.groupRecommendations(prioritizedRecommendations);

        return {
            total_recommendations: prioritizedRecommendations.length,
            critical_count: prioritizedRecommendations.filter(r => r.priority === 'critical').length,
            high_count: prioritizedRecommendations.filter(r => r.priority === 'high').length,
            overall_priority: this.calculateOverallPriority(prioritizedRecommendations),
            grouped_recommendations: groupedRecommendations,
            action_plan: this.generateActionPlan(groupedRecommendations),
            estimated_time: this.estimateImplementationTime(prioritizedRecommendations)
        };
    }

    extractNarrativeRecommendations(narrativeAnalysis) {
        const recommendations = [];

        // Hook recommendations
        if (narrativeAnalysis?.narrative_structure?.hook?.status === 'weak' ||
            narrativeAnalysis?.narrative_structure?.hook?.status === 'missing') {
            recommendations.push({
                type: 'structure_improvement',
                priority: 'high',
                title: 'Strengthen Opening Hook',
                description: 'Your opening needs more impact to capture attention immediately',
                specific_action: narrativeAnalysis?.narrative_structure?.hook?.suggestions ||
                    'Add a compelling statistic, personal story, or bold statement in the first sentence',
                location: 'Opening paragraph',
                estimated_time: 15,
                impact: 'High - First impressions determine reader engagement'
            });
        }

        // Problem statement
        if (narrativeAnalysis?.narrative_structure?.problem_statement?.status === 'weak' ||
            narrativeAnalysis?.narrative_structure?.problem_statement?.status === 'missing') {
            recommendations.push({
                type: 'messaging_optimization',
                priority: 'high',
                title: 'Clarify Problem Statement',
                description: 'Readers need to understand the specific issue you\'re addressing',
                specific_action: 'Clearly articulate the problem in 1-2 sentences with specific examples',
                location: 'First section after hook',
                estimated_time: 20,
                impact: 'High - Clear problems motivate action'
            });
        }

        // Solution presentation
        if (narrativeAnalysis?.narrative_structure?.solution?.status === 'weak') {
            recommendations.push({
                type: 'messaging_optimization',
                priority: 'medium',
                title: 'Enhance Solution Presentation',
                description: 'Your solution needs to be more compelling and specific',
                specific_action: narrativeAnalysis?.narrative_structure?.solution?.suggestions ||
                    'Provide concrete steps and benefits of your proposed solution',
                location: 'Middle section',
                estimated_time: 25,
                impact: 'Medium - Solutions drive voter confidence'
            });
        }

        // Call to action
        if (narrativeAnalysis?.narrative_structure?.call_to_action?.status === 'weak' ||
            narrativeAnalysis?.narrative_structure?.call_to_action?.status === 'missing') {
            recommendations.push({
                type: 'structure_improvement',
                priority: 'critical',
                title: 'Add Strong Call to Action',
                description: 'Every piece needs a clear next step for readers',
                specific_action: 'End with specific action: vote, volunteer, donate, or share',
                location: 'Final paragraph',
                estimated_time: 10,
                impact: 'Critical - CTAs convert engagement to action'
            });
        }

        // Flow improvements
        if (narrativeAnalysis?.overall_score < 70) {
            recommendations.push({
                type: 'structure_improvement',
                priority: 'medium',
                title: 'Improve Narrative Flow',
                description: 'Content needs better transitions and logical progression',
                specific_action: 'Add transition sentences between paragraphs and ensure logical sequence',
                location: 'Throughout content',
                estimated_time: 30,
                impact: 'Medium - Smooth flow improves comprehension'
            });
        }

        return recommendations;
    }

    extractAIRecommendations(aiAnalysis) {
        const recommendations = [];

        // Readability improvements
        if (aiAnalysis.readability && aiAnalysis.readability.score < 70) {
            recommendations.push({
                type: 'technical_enhancement',
                priority: 'medium',
                title: 'Improve Readability',
                description: `Readability score is ${aiAnalysis.readability.score}% - aim for 70%+`,
                specific_action: 'Shorten sentences, use simpler words, break up long paragraphs',
                location: 'Throughout content',
                estimated_time: 45,
                impact: 'Medium - Better readability reaches more voters'
            });
        }

        // Keyword optimization
        if (aiAnalysis.seo && aiAnalysis.seo.score < 60) {
            recommendations.push({
                type: 'technical_enhancement',
                priority: 'low',
                title: 'Optimize Keywords',
                description: 'Content could be more discoverable online',
                specific_action: 'Include relevant political keywords naturally throughout the text',
                location: 'Throughout content',
                estimated_time: 20,
                impact: 'Low - Helps with online visibility'
            });
        }

        // Engagement improvements
        if (aiAnalysis.engagement && aiAnalysis.engagement.score < 65) {
            recommendations.push({
                type: 'messaging_optimization',
                priority: 'medium',
                title: 'Increase Engagement',
                description: 'Content needs more emotional connection and interaction',
                specific_action: 'Add personal stories, direct questions, or emotional appeals',
                location: 'Middle sections',
                estimated_time: 35,
                impact: 'Medium - Emotional connection drives action'
            });
        }

        return recommendations;
    }

    extractComplianceRecommendations(complianceAnalysis) {
        const recommendations = [];

        // Critical compliance issues
        if (complianceAnalysis.action_items) {
            complianceAnalysis.action_items.forEach(item => {
                recommendations.push({
                    type: 'compliance_fix',
                    priority: item.urgency === 'immediate' ? 'critical' : 'high',
                    title: 'Compliance Requirement',
                    description: item.reason,
                    specific_action: item.action,
                    location: 'Legal disclaimer area',
                    estimated_time: 10,
                    impact: 'Critical - Required by law'
                });
            });
        }

        // General compliance improvements
        if (complianceAnalysis.overall_compliance.score < 80) {
            recommendations.push({
                type: 'compliance_fix',
                priority: 'high',
                title: 'Improve Legal Compliance',
                description: `Compliance score is ${complianceAnalysis.overall_compliance.score}% - aim for 90%+`,
                specific_action: 'Review and address all compliance recommendations',
                location: 'Throughout content',
                estimated_time: 60,
                impact: 'High - Prevents legal issues'
            });
        }

        return recommendations;
    }

    extractFactCheckRecommendations(factCheckAnalysis) {
        const recommendations = [];

        // Critical fact-checking issues
        if (factCheckAnalysis.action_items) {
            factCheckAnalysis.action_items.forEach(item => {
                recommendations.push({
                    type: 'fact_verification',
                    priority: item.urgency === 'immediate' ? 'critical' : 'high',
                    title: 'Fact Verification Required',
                    description: item.reason,
                    specific_action: item.action,
                    location: 'Specific claims',
                    estimated_time: 30,
                    impact: 'Critical - Credibility depends on accuracy'
                });
            });
        }

        // Source attribution
        if (factCheckAnalysis.overall_assessment.score < 70) {
            recommendations.push({
                type: 'fact_verification',
                priority: 'medium',
                title: 'Add Source Citations',
                description: 'Claims need better source attribution for credibility',
                specific_action: 'Add "according to [source]" for statistics and claims',
                location: 'After key statistics',
                estimated_time: 25,
                impact: 'Medium - Sources build trust'
            });
        }

        return recommendations;
    }

    extractContentFieldRecommendations(contentFieldAnalysis) {
        const recommendations = [];

        // Missing required fields
        if (contentFieldAnalysis.missing_required_fields) {
            contentFieldAnalysis.missing_required_fields.forEach(missingField => {
                recommendations.push({
                    type: 'structure_improvement',
                    priority: 'critical',
                    title: `Add Missing ${missingField.field.replace('_', ' ')}`,
                    description: `Required field "${missingField.description}" is missing from content`,
                    specific_action: missingField.suggestion,
                    location: 'Document structure',
                    estimated_time: this.getFieldAddTime(missingField.field),
                    impact: 'Critical - Required for professional campaign materials'
                });
            });
        }

        // Formatting issues
        if (contentFieldAnalysis.formatting_issues) {
            contentFieldAnalysis.formatting_issues.forEach(issue => {
                recommendations.push({
                    type: 'technical_enhancement',
                    priority: 'medium',
                    title: `Fix ${issue.field.replace('_', ' ')} Format`,
                    description: issue.issue,
                    specific_action: issue.suggestion,
                    location: `${issue.field.replace('_', ' ')} section`,
                    estimated_time: 10,
                    impact: 'Medium - Improves professional appearance'
                });
            });
        }

        // Field quality improvements
        Object.entries(contentFieldAnalysis.field_statuses).forEach(([fieldName, status]) => {
            if (status.present && status.quality !== 'good') {
                recommendations.push({
                    type: 'content_revision',
                    priority: status.quality === 'error' ? 'high' : 'medium',
                    title: `Improve ${fieldName.replace('_', ' ')} Quality`,
                    description: `${fieldName.replace('_', ' ')} needs attention`,
                    specific_action: status.suggestions.length > 0 ? status.suggestions[0] : `Review and improve ${fieldName.replace('_', ' ')} content`,
                    location: `${fieldName.replace('_', ' ')} section`,
                    estimated_time: 15,
                    impact: 'Medium - Enhances content quality'
                });
            }
        });

        // Overall completeness recommendations
        if (contentFieldAnalysis.completeness_score < 70) {
            recommendations.push({
                type: 'structure_improvement',
                priority: 'high',
                title: 'Improve Content Completeness',
                description: `Only ${contentFieldAnalysis.completeness_score}% of expected fields are present`,
                specific_action: 'Add missing content fields to create a complete campaign document',
                location: 'Throughout document',
                estimated_time: 45,
                impact: 'High - Complete documents appear more professional'
            });
        }

        // Suggested improvements
        if (contentFieldAnalysis.suggested_improvements) {
            contentFieldAnalysis.suggested_improvements.forEach(improvement => {
                recommendations.push({
                    type: improvement.type === 'missing_fields' ? 'structure_improvement' : 'content_revision',
                    priority: improvement.priority === 'critical' ? 'critical' :
                             improvement.priority === 'medium' ? 'medium' : 'low',
                    title: this.formatImprovementTitle(improvement.type),
                    description: improvement.description,
                    specific_action: `Address the following fields: ${improvement.fields.join(', ')}`,
                    location: 'Document structure',
                    estimated_time: improvement.fields.length * 10,
                    impact: improvement.priority === 'critical' ? 'Critical - Essential for compliance' :
                           improvement.priority === 'medium' ? 'Medium - Improves quality' :
                           'Low - Nice to have'
                });
            });
        }

        return recommendations;
    }

    getFieldAddTime(fieldName) {
        const timings = {
            headline: 15,
            date: 5,
            location: 5,
            media_contact: 10,
            paid_for_by: 5,
            opening_paragraph: 30,
            body_text: 60,
            candidate_quote: 20,
            subhead: 10,
            assignment_type: 5,
            assignment_subtype: 5,
            other_quotes: 15,
            boilerplate: 25
        };
        return timings[fieldName] || 15;
    }

    formatImprovementTitle(type) {
        const titles = {
            missing_fields: 'Add Missing Required Fields',
            quality_improvement: 'Improve Field Quality',
            enhancement: 'Add Enhancement Fields'
        };
        return titles[type] || 'Improve Content Structure';
    }

    prioritizeRecommendations(recommendations) {
        return recommendations.sort((a, b) => {
            // Sort by priority weight first, then by impact
            const priorityDiff = this.priorityWeights[b.priority] - this.priorityWeights[a.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Then by estimated impact
            const impactWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            const impactA = impactWeight[a.impact.split(' - ')[0]] || 1;
            const impactB = impactWeight[b.impact.split(' - ')[0]] || 1;
            return impactB - impactA;
        });
    }

    groupRecommendations(recommendations) {
        const grouped = {};

        recommendations.forEach(rec => {
            if (!grouped[rec.type]) {
                grouped[rec.type] = {
                    ...this.recommendationTypes[rec.type],
                    recommendations: [],
                    total_time: 0,
                    priority_counts: { critical: 0, high: 0, medium: 0, low: 0 }
                };
            }

            grouped[rec.type].recommendations.push(rec);
            grouped[rec.type].total_time += rec.estimated_time;
            grouped[rec.type].priority_counts[rec.priority]++;
        });

        return grouped;
    }

    generateActionPlan(groupedRecommendations) {
        const phases = {
            immediate: { name: 'Immediate (Do First)', items: [], time: 0 },
            short_term: { name: 'Short Term (Within 1 Hour)', items: [], time: 0 },
            medium_term: { name: 'Medium Term (Next Session)', items: [], time: 0 }
        };

        Object.values(groupedRecommendations).forEach(group => {
            group.recommendations.forEach(rec => {
                let phase;
                if (rec.priority === 'critical' || rec.estimated_time <= 15) {
                    phase = phases.immediate;
                } else if (rec.priority === 'high' || rec.estimated_time <= 30) {
                    phase = phases.short_term;
                } else {
                    phase = phases.medium_term;
                }

                phase.items.push(rec);
                phase.time += rec.estimated_time;
            });
        });

        return phases;
    }

    calculateOverallPriority(recommendations) {
        if (recommendations.some(r => r.priority === 'critical')) return 'critical';
        if (recommendations.filter(r => r.priority === 'high').length >= 3) return 'high';
        if (recommendations.length >= 5) return 'medium';
        return 'low';
    }

    estimateImplementationTime(recommendations) {
        const totalMinutes = recommendations.reduce((sum, rec) => sum + rec.estimated_time, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    generateEditingSuggestions(recommendations) {
        const suggestions = [];

        // Group by location for easier editing
        const byLocation = {};
        recommendations.forEach(rec => {
            const location = rec.location || 'General';
            if (!byLocation[location]) byLocation[location] = [];
            byLocation[location].push(rec);
        });

        Object.entries(byLocation).forEach(([location, recs]) => {
            suggestions.push({
                location,
                actions: recs.map(rec => ({
                    action: rec.specific_action,
                    priority: rec.priority,
                    time: rec.estimated_time
                })),
                total_time: recs.reduce((sum, rec) => sum + rec.estimated_time, 0)
            });
        });

        return suggestions.sort((a, b) => b.total_time - a.total_time);
    }
}

module.exports = RecommendationsEngine;