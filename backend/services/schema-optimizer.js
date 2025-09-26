/**
 * Schema Optimization System
 *
 * Matches assignments to multiple schemas and provides recommendations
 * for content enhancement to improve search discoverability
 */

const PoliticalCampaignSchemas = require('../data/political-campaign-schemas');

class SchemaOptimizer {
    constructor() {
        this.schemaMapping = PoliticalCampaignSchemas.ASSIGNMENT_SCHEMA_MAPPING;
        this.extendedSchemas = PoliticalCampaignSchemas.EXTENDED_SCHEMA_TYPES;
        this.enhancedProperties = PoliticalCampaignSchemas.ENHANCED_PROPERTIES;
        this.campaignValues = PoliticalCampaignSchemas.CAMPAIGN_VALUES;
    }

    /**
     * Match assignment type to available schemas and analyze content coverage
     */
    analyzeSchemaFit(assignmentData, contentData, candidateProfile) {
        const assignmentType = assignmentData.assignmentType;
        const schemaMatch = this.schemaMapping[assignmentType];

        if (!schemaMatch) {
            return this.generateFallbackAnalysis(assignmentData, contentData);
        }

        const analysis = {
            assignment_type: assignmentType,
            matched_schemas: {
                primary: schemaMatch.primary,
                secondary: schemaMatch.secondary,
                policy_context: schemaMatch.policy_context
            },
            schema_coverage: this.analyzePropertyCoverage(schemaMatch, contentData, candidateProfile),
            missing_opportunities: this.identifyMissingOpportunities(schemaMatch, contentData, assignmentData),
            content_recommendations: [],
            seo_impact: this.calculateSEOImpact(schemaMatch, contentData),
            discoverability_score: 0
        };

        // Generate specific content recommendations
        analysis.content_recommendations = this.generateContentRecommendations(analysis);

        // Calculate overall discoverability score
        analysis.discoverability_score = this.calculateDiscoverabilityScore(analysis);

        return analysis;
    }

    /**
     * Analyze how well current content covers required schema properties
     */
    analyzePropertyCoverage(schemaMatch, contentData, candidateProfile) {
        const coverage = {
            primary_schema: this.analyzeSchemaCoverage(schemaMatch.primary, contentData, candidateProfile),
            secondary_schemas: schemaMatch.secondary.map(schema =>
                this.analyzeSchemaCoverage(schema, contentData, candidateProfile)
            ),
            overall_coverage: 0,
            well_covered_properties: [],
            missing_properties: [],
            weak_properties: []
        };

        // Calculate overall coverage
        const allCoverages = [coverage.primary_schema, ...coverage.secondary_schemas];
        coverage.overall_coverage = allCoverages.reduce((sum, c) => sum + c.coverage_percentage, 0) / allCoverages.length;

        // Aggregate properties
        allCoverages.forEach(c => {
            coverage.well_covered_properties.push(...c.well_covered);
            coverage.missing_properties.push(...c.missing);
            coverage.weak_properties.push(...c.weak);
        });

        // Remove duplicates
        coverage.missing_properties = [...new Set(coverage.missing_properties)];
        coverage.weak_properties = [...new Set(coverage.weak_properties)];

        return coverage;
    }

    /**
     * Analyze coverage for a specific schema type
     */
    analyzeSchemaCoverage(schemaType, contentData, candidateProfile) {
        const coverage = {
            schema_type: schemaType,
            coverage_percentage: 0,
            well_covered: [],
            missing: [],
            weak: [],
            required_properties: [],
            optional_properties: []
        };

        // Get expected properties for this schema type
        const expectedProperties = this.getExpectedProperties(schemaType);
        coverage.required_properties = expectedProperties.required;
        coverage.optional_properties = expectedProperties.optional;

        // Analyze each property
        expectedProperties.required.forEach(prop => {
            const analysis = this.analyzePropertyPresence(prop, contentData, candidateProfile);
            if (analysis.present && analysis.quality === 'good') {
                coverage.well_covered.push(prop);
            } else if (analysis.present && analysis.quality === 'weak') {
                coverage.weak.push(prop);
            } else {
                coverage.missing.push(prop);
            }
        });

        // Calculate coverage percentage
        const totalRequired = expectedProperties.required.length;
        const covered = coverage.well_covered.length + (coverage.weak.length * 0.5);
        coverage.coverage_percentage = totalRequired > 0 ? Math.round((covered / totalRequired) * 100) : 100;

        return coverage;
    }

    /**
     * Get expected properties for a schema type
     */
    getExpectedProperties(schemaType) {
        const properties = {
            required: [],
            optional: []
        };

        // Standard schema.org properties
        switch (schemaType) {
            case 'NewsArticle':
            case 'Article':
                properties.required = ['headline', 'author', 'datePublished', 'description'];
                properties.optional = ['image', 'keywords', 'wordCount', 'articleSection'];
                break;

            case 'Event':
                properties.required = ['name', 'startDate', 'location'];
                properties.optional = ['endDate', 'description', 'organizer', 'offers', 'image'];
                break;

            case 'Person':
                properties.required = ['name'];
                properties.optional = ['jobTitle', 'description', 'image', 'url', 'sameAs'];
                break;

            case 'EndorseAction':
                properties.required = ['agent', 'object'];
                properties.optional = ['result', 'startTime', 'description'];
                break;

            default:
                // Extended schema properties
                if (schemaType.startsWith('campaign:')) {
                    properties = this.getExtendedSchemaProperties(schemaType);
                }
                break;
        }

        return properties;
    }

    /**
     * Get properties for extended campaign schemas
     */
    getExtendedSchemaProperties(schemaType) {
        const properties = { required: [], optional: [] };

        switch (schemaType) {
            case 'campaign:PolicyProposal':
                properties.required = ['headline', 'campaign:policyArea', 'campaign:beneficiaries'];
                properties.optional = ['campaign:estimatedCost', 'campaign:implementationTimeline', 'campaign:supportingData'];
                break;

            case 'campaign:CampaignFunding':
                properties.required = ['name', 'campaign:fundingGoal'];
                properties.optional = ['campaign:averageDonation', 'campaign:numberOfDonors', 'campaign:transparencyReport'];
                break;

            case 'campaign:VoterEngagement':
                properties.required = ['name', 'campaign:targetVoters'];
                properties.optional = ['campaign:registrationGoal', 'campaign:voterGuides', 'campaign:pollingLocations'];
                break;

            case 'campaign:CommunityOrganizing':
                properties.required = ['name', 'campaign:organizingGoal'];
                properties.optional = ['campaign:communityPartners', 'campaign:votersReached', 'campaign:volunteerSignups'];
                break;

            default:
                properties.required = ['name', 'description'];
                break;
        }

        return properties;
    }

    /**
     * Analyze if a property is present and assess its quality
     */
    analyzePropertyPresence(property, contentData, candidateProfile) {
        const analysis = {
            property,
            present: false,
            quality: 'missing', // missing, weak, good
            value: null,
            recommendations: []
        };

        // Check common mappings
        switch (property) {
            case 'headline':
                if (contentData.headline || contentData.title) {
                    analysis.present = true;
                    analysis.value = contentData.headline || contentData.title;
                    analysis.quality = analysis.value.length > 10 ? 'good' : 'weak';
                    if (analysis.quality === 'weak') {
                        analysis.recommendations.push('Headline should be more descriptive (10+ characters)');
                    }
                }
                break;

            case 'description':
                if (contentData.summary || contentData.description || contentData.excerpt) {
                    analysis.present = true;
                    analysis.value = contentData.summary || contentData.description || contentData.excerpt;
                    analysis.quality = analysis.value.length > 50 ? 'good' : 'weak';
                    if (analysis.quality === 'weak') {
                        analysis.recommendations.push('Description should be more comprehensive (50+ characters)');
                    }
                }
                break;

            case 'author':
                if (candidateProfile && candidateProfile.fullName) {
                    analysis.present = true;
                    analysis.value = candidateProfile.fullName;
                    analysis.quality = 'good';
                }
                break;

            case 'datePublished':
                if (contentData.publishDate || contentData.createdAt) {
                    analysis.present = true;
                    analysis.value = contentData.publishDate || contentData.createdAt;
                    analysis.quality = 'good';
                }
                break;

            case 'image':
                if (contentData.featuredImage || contentData.image) {
                    analysis.present = true;
                    analysis.value = contentData.featuredImage || contentData.image;
                    analysis.quality = 'good';
                }
                break;

            case 'keywords':
                if (contentData.tags || contentData.keywords) {
                    analysis.present = true;
                    analysis.value = contentData.tags || contentData.keywords;
                    analysis.quality = Array.isArray(analysis.value) && analysis.value.length >= 3 ? 'good' : 'weak';
                    if (analysis.quality === 'weak') {
                        analysis.recommendations.push('Add more relevant keywords/tags (3+ recommended)');
                    }
                }
                break;

            // Extended schema properties
            case 'campaign:policyArea':
                if (contentData.policyArea || contentData.issueArea) {
                    analysis.present = true;
                    analysis.value = contentData.policyArea || contentData.issueArea;
                    analysis.quality = 'good';
                }
                break;

            case 'campaign:targetVoters':
                if (contentData.targetAudience || contentData.targetVoters) {
                    analysis.present = true;
                    analysis.value = contentData.targetAudience || contentData.targetVoters;
                    analysis.quality = 'good';
                }
                break;

            default:
                // Check if property exists in content data
                if (contentData[property] !== undefined) {
                    analysis.present = true;
                    analysis.value = contentData[property];
                    analysis.quality = 'good';
                }
                break;
        }

        return analysis;
    }

    /**
     * Identify missing opportunities for schema enhancement
     */
    identifyMissingOpportunities(schemaMatch, contentData, assignmentData) {
        const opportunities = [];

        // Check for missing high-impact properties
        const highImpactMissing = this.findMissingHighImpactProperties(schemaMatch, contentData);
        opportunities.push(...highImpactMissing);

        // Check for additional schemas that could apply
        const additionalSchemas = this.suggestAdditionalSchemas(assignmentData, contentData);
        opportunities.push(...additionalSchemas);

        // Check for enhanced properties
        const enhancedProps = this.suggestEnhancedProperties(schemaMatch, contentData);
        opportunities.push(...enhancedProps);

        return opportunities;
    }

    /**
     * Find missing high-impact properties
     */
    findMissingHighImpactProperties(schemaMatch, contentData) {
        const missing = [];
        const highImpactProps = ['image', 'keywords', 'description', 'datePublished'];

        highImpactProps.forEach(prop => {
            const analysis = this.analyzePropertyPresence(prop, contentData);
            if (!analysis.present) {
                missing.push({
                    type: 'missing_high_impact',
                    property: prop,
                    impact: 'high',
                    reason: 'Essential for search visibility and rich snippets'
                });
            }
        });

        return missing;
    }

    /**
     * Suggest additional schemas that could apply
     */
    suggestAdditionalSchemas(assignmentData, contentData) {
        const suggestions = [];
        const assignmentType = assignmentData.assignmentType;

        // Suggest FAQPage if content has Q&A format
        if (this.containsQAFormat(contentData)) {
            suggestions.push({
                type: 'additional_schema',
                schema: 'FAQPage',
                impact: 'high',
                reason: 'Content contains Q&A format - could generate FAQ rich snippets'
            });
        }

        // Suggest HowTo if content has step-by-step instructions
        if (this.containsInstructionalContent(contentData)) {
            suggestions.push({
                type: 'additional_schema',
                schema: 'HowTo',
                impact: 'medium',
                reason: 'Content contains instructional steps'
            });
        }

        // Suggest BreadcrumbList for better navigation
        if (assignmentType !== 'biography') {
            suggestions.push({
                type: 'additional_schema',
                schema: 'BreadcrumbList',
                impact: 'low',
                reason: 'Improves site navigation and structure'
            });
        }

        return suggestions;
    }

    /**
     * Suggest enhanced properties for better discoverability
     */
    suggestEnhancedProperties(schemaMatch, contentData) {
        const suggestions = [];

        // Campaign-specific enhancements
        if (schemaMatch.primary.startsWith('campaign:')) {
            suggestions.push({
                type: 'enhanced_property',
                property: 'campaign:communityPartners',
                impact: 'medium',
                reason: 'Highlighting community partnerships improves local search relevance'
            });

            suggestions.push({
                type: 'enhanced_property',
                property: 'campaign:transparencyCommitment',
                impact: 'medium',
                reason: 'Transparency indicators build trust and authority signals'
            });
        }

        // Policy-specific enhancements
        if (schemaMatch.policy_context) {
            suggestions.push({
                type: 'enhanced_property',
                property: 'policy:supportingData',
                impact: 'high',
                reason: 'Supporting data and research improves content authority'
            });
        }

        return suggestions;
    }

    /**
     * Generate specific content recommendations
     */
    generateContentRecommendations(analysis) {
        const recommendations = [];

        // High-priority recommendations for missing required properties
        analysis.schema_coverage.missing_properties.forEach(prop => {
            const rec = this.generatePropertyRecommendation(prop, 'missing');
            if (rec) recommendations.push(rec);
        });

        // Medium-priority recommendations for weak properties
        analysis.schema_coverage.weak_properties.forEach(prop => {
            const rec = this.generatePropertyRecommendation(prop, 'weak');
            if (rec) recommendations.push(rec);
        });

        // Enhancement recommendations from missing opportunities
        analysis.missing_opportunities.forEach(opp => {
            const rec = this.generateOpportunityRecommendation(opp);
            if (rec) recommendations.push(rec);
        });

        // Sort by priority
        return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
    }

    /**
     * Generate recommendation for a specific property
     */
    generatePropertyRecommendation(property, status) {
        const recommendations = {
            'headline': {
                priority: 'high',
                action: 'Add a compelling, descriptive headline',
                benefit: 'Improves click-through rates and search ranking',
                example: 'Instead of "Statement" use "Candidate Announces Plan to Expand Healthcare Access"'
            },
            'description': {
                priority: 'high',
                action: 'Add a comprehensive summary or description',
                benefit: 'Essential for search snippets and social media previews',
                example: 'Write 1-2 sentences summarizing the key points of your content'
            },
            'image': {
                priority: 'medium',
                action: 'Add a relevant featured image',
                benefit: 'Improves social media sharing and visual search results',
                example: 'Use campaign photos, infographics, or event images'
            },
            'keywords': {
                priority: 'medium',
                action: 'Add relevant tags or keywords',
                benefit: 'Helps search engines understand content topic and context',
                example: 'Tags like "healthcare policy", "community organizing", "voter registration"'
            },
            'campaign:policyArea': {
                priority: 'medium',
                action: 'Specify the main policy area this content addresses',
                benefit: 'Improves categorization and policy-focused search results',
                example: 'Healthcare, Environment, Economy, Education, etc.'
            }
        };

        const rec = recommendations[property];
        if (!rec) return null;

        return {
            property,
            status,
            priority: rec.priority,
            action: rec.action,
            benefit: rec.benefit,
            example: rec.example,
            implementation: status === 'missing' ? 'Add this information to your content' : 'Improve the existing information'
        };
    }

    /**
     * Generate recommendation for missing opportunities
     */
    generateOpportunityRecommendation(opportunity) {
        switch (opportunity.type) {
            case 'additional_schema':
                return {
                    type: 'schema_enhancement',
                    priority: 'medium',
                    action: `Consider structuring content to support ${opportunity.schema} schema`,
                    benefit: opportunity.reason,
                    implementation: 'Restructure content format or add additional markup'
                };

            case 'enhanced_property':
                return {
                    type: 'property_enhancement',
                    priority: opportunity.impact,
                    action: `Add ${opportunity.property} information`,
                    benefit: opportunity.reason,
                    implementation: 'Include this information in content metadata or body'
                };

            default:
                return null;
        }
    }

    /**
     * Calculate SEO impact of current schema implementation
     */
    calculateSEOImpact(schemaMatch, contentData) {
        const impact = {
            search_visibility: 0,
            rich_snippets_potential: 0,
            local_search_boost: 0,
            social_sharing_enhancement: 0,
            overall_score: 0
        };

        // Calculate based on schema types
        const hasNewsArticle = [schemaMatch.primary, ...schemaMatch.secondary].includes('NewsArticle');
        const hasEvent = [schemaMatch.primary, ...schemaMatch.secondary].includes('Event');
        const hasPolicyProposal = [schemaMatch.primary, ...schemaMatch.secondary].some(s => s.includes('Policy'));

        impact.search_visibility = hasNewsArticle ? 85 : 70;
        impact.rich_snippets_potential = hasEvent ? 90 : hasPolicyProposal ? 75 : 60;
        impact.local_search_boost = schemaMatch.secondary.some(s => s.includes('Community')) ? 80 : 50;
        impact.social_sharing_enhancement = contentData.image ? 85 : 60;

        impact.overall_score = Math.round(
            (impact.search_visibility + impact.rich_snippets_potential +
             impact.local_search_boost + impact.social_sharing_enhancement) / 4
        );

        return impact;
    }

    /**
     * Calculate overall discoverability score
     */
    calculateDiscoverabilityScore(analysis) {
        let score = 0;

        // Schema coverage (40% of total)
        score += analysis.schema_coverage.overall_coverage * 0.4;

        // SEO impact (30% of total)
        score += analysis.seo_impact.overall_score * 0.3;

        // Missing opportunities penalty (20% of total)
        const opportunityPenalty = Math.min(analysis.missing_opportunities.length * 5, 20);
        score += (20 - opportunityPenalty);

        // Content quality bonus (10% of total)
        const hasImage = analysis.schema_coverage.well_covered_properties.includes('image');
        const hasKeywords = analysis.schema_coverage.well_covered_properties.includes('keywords');
        const qualityBonus = (hasImage ? 5 : 0) + (hasKeywords ? 5 : 0);
        score += qualityBonus;

        return Math.round(Math.max(0, Math.min(100, score)));
    }

    /**
     * Helper functions
     */
    containsQAFormat(contentData) {
        const text = (contentData.body || contentData.content || '').toLowerCase();
        return text.includes('q:') || text.includes('question:') || text.includes('a:') || text.includes('answer:');
    }

    containsInstructionalContent(contentData) {
        const text = (contentData.body || contentData.content || '').toLowerCase();
        return text.match(/step \d+|first,|second,|next,|then,|finally,/) !== null;
    }

    getPriorityScore(priority) {
        const scores = { high: 3, medium: 2, low: 1 };
        return scores[priority] || 1;
    }

    generateFallbackAnalysis(assignmentData, contentData) {
        return {
            assignment_type: assignmentData.assignmentType,
            matched_schemas: {
                primary: 'Article',
                secondary: ['WebPage'],
                policy_context: null
            },
            schema_coverage: { overall_coverage: 50, missing_properties: ['keywords', 'image'] },
            missing_opportunities: [],
            content_recommendations: [
                {
                    priority: 'medium',
                    action: 'Consider using a more specific assignment type for better schema matching',
                    benefit: 'Improved search engine understanding and discoverability'
                }
            ],
            seo_impact: { overall_score: 50 },
            discoverability_score: 50
        };
    }
}

module.exports = new SchemaOptimizer();