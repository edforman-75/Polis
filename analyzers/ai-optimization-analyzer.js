class AIOptimizationAnalyzer {
    constructor() {
        this.foundationModels = ['gpt', 'claude', 'gemini', 'palm'];

        this.optimizationCriteria = {
            entity_clarity: {
                name: 'Entity Clarity',
                description: 'Clear identification of people, places, organizations',
                weight: 0.18,
                checks: [
                    'proper_nouns_identified',
                    'roles_clearly_stated',
                    'geographic_context',
                    'organizational_affiliations'
                ]
            },
            temporal_accuracy: {
                name: 'Temporal Accuracy',
                description: 'Precise dates, times, and temporal relationships',
                weight: 0.13,
                checks: [
                    'specific_dates',
                    'temporal_sequence',
                    'deadline_clarity',
                    'event_timing'
                ]
            },
            structured_information: {
                name: 'Structured Information',
                description: 'Information organized for machine parsing',
                weight: 0.13,
                checks: [
                    'hierarchical_organization',
                    'consistent_formatting',
                    'clear_relationships',
                    'logical_flow'
                ]
            },
            schema_markup: {
                name: 'Schema Markup',
                description: 'JSON-LD structured data for AI and search engines',
                weight: 0.15,
                checks: [
                    'schema_present',
                    'schema_validity',
                    'schema_completeness',
                    'schema_relevance'
                ]
            },
            factual_density: {
                name: 'Factual Density',
                description: 'High ratio of verifiable facts to opinion',
                weight: 0.13,
                checks: [
                    'statistics_present',
                    'verifiable_claims',
                    'source_attribution',
                    'objective_statements'
                ]
            },
            semantic_richness: {
                name: 'Semantic Richness',
                description: 'Varied vocabulary and rich context',
                weight: 0.09,
                checks: [
                    'vocabulary_diversity',
                    'contextual_synonyms',
                    'domain_terminology',
                    'descriptive_language'
                ]
            },
            actionable_content: {
                name: 'Actionable Content',
                description: 'Clear actions, processes, and outcomes',
                weight: 0.09,
                checks: [
                    'specific_actions',
                    'measurable_outcomes',
                    'process_clarity',
                    'implementation_details'
                ]
            },
            query_anticipation: {
                name: 'Query Anticipation',
                description: 'Answers likely AI user questions',
                weight: 0.1,
                checks: [
                    'who_what_when_where',
                    'how_and_why',
                    'implications_covered',
                    'related_topics'
                ]
            }
        };

        this.entityPatterns = {
            person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
            title: /\b(Senator|Representative|Governor|Mayor|Commissioner|Director|President|CEO)\s+[A-Z][a-z]+/g,
            organization: /\b(Committee|Commission|Department|Bureau|Agency|Foundation|Association|Corporation|Company)\b/g,
            location: /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/g,
            date: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
            phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            website: /\bhttps?:\/\/[^\s]+\b/g
        };

        this.questionPatterns = [
            { type: 'who', patterns: ['who is', 'who are', 'candidate', 'person', 'individual'] },
            { type: 'what', patterns: ['what is', 'what are', 'announcement', 'policy', 'position'] },
            { type: 'when', patterns: ['when', 'date', 'time', 'schedule', 'timeline'] },
            { type: 'where', patterns: ['where', 'location', 'place', 'venue'] },
            { type: 'why', patterns: ['why', 'reason', 'because', 'motivation'] },
            { type: 'how', patterns: ['how', 'process', 'method', 'approach'] }
        ];
    }

    analyze(text) {
        const entityAnalysis = this.analyzeEntities(text);
        const temporalAnalysis = this.analyzeTemporalAccuracy(text);
        const structureAnalysis = this.analyzeStructure(text);
        const schemaAnalysis = this.analyzeSchemaMarkup(text);
        const factualAnalysis = this.analyzeFactualDensity(text);
        const semanticAnalysis = this.analyzeSemanticRichness(text);
        const actionAnalysis = this.analyzeActionableContent(text);
        const queryAnalysis = this.analyzeQueryAnticipation(text);

        const criteriaScores = this.calculateCriteriaScores({
            entity_clarity: entityAnalysis,
            temporal_accuracy: temporalAnalysis,
            structured_information: structureAnalysis,
            schema_markup: schemaAnalysis,
            factual_density: factualAnalysis,
            semantic_richness: semanticAnalysis,
            actionable_content: actionAnalysis,
            query_anticipation: queryAnalysis
        });

        const overallScore = this.calculateOverallScore(criteriaScores);
        const recommendations = this.generateOptimizationRecommendations(criteriaScores, {
            entityAnalysis,
            temporalAnalysis,
            structureAnalysis,
            schemaAnalysis,
            factualAnalysis,
            semanticAnalysis,
            actionAnalysis,
            queryAnalysis
        });

        return {
            overall_score: overallScore,
            criteria_scores: criteriaScores,
            detailed_analysis: {
                entities: entityAnalysis,
                temporal: temporalAnalysis,
                structure: structureAnalysis,
                schema: schemaAnalysis,
                factual: factualAnalysis,
                semantic: semanticAnalysis,
                actionable: actionAnalysis,
                queries: queryAnalysis
            },
            optimization_recommendations: recommendations,
            foundation_model_readiness: this.assessFoundationModelReadiness(overallScore, criteriaScores)
        };
    }

    analyzeEntities(text) {
        const entities = {};
        let totalEntityScore = 0;
        let maxPossibleScore = 0;

        for (const [type, pattern] of Object.entries(this.entityPatterns)) {
            const matches = [...text.matchAll(pattern)];
            entities[type] = {
                count: matches.length,
                matches: matches.map(m => m[0]).slice(0, 10), // Limit to first 10
                density: matches.length / (text.split(/\s+/).length / 100) // per 100 words
            };

            // Score based on presence and density
            if (matches.length > 0) {
                totalEntityScore += Math.min(matches.length / 2, 1) * this.getEntityWeight(type);
            }
            maxPossibleScore += this.getEntityWeight(type);
        }

        const clarity_score = maxPossibleScore > 0 ? totalEntityScore / maxPossibleScore : 0;

        return {
            entities: entities,
            clarity_score: clarity_score,
            total_entities: Object.values(entities).reduce((sum, e) => sum + e.count, 0),
            recommendations: this.generateEntityRecommendations(entities)
        };
    }

    getEntityWeight(type) {
        const weights = {
            person: 0.25,
            title: 0.2,
            organization: 0.15,
            location: 0.15,
            date: 0.1,
            phone: 0.05,
            email: 0.05,
            website: 0.05
        };
        return weights[type] || 0.1;
    }

    analyzeTemporalAccuracy(text) {
        const dateMatches = [...text.matchAll(this.entityPatterns.date)];
        const timeIndicators = text.match(/\b(today|tomorrow|yesterday|next week|last month|this year|recently|soon|upcoming)\b/gi) || [];
        const sequenceWords = text.match(/\b(first|then|next|finally|before|after|during|while)\b/gi) || [];

        const hasSpecificDates = dateMatches.length > 0;
        const hasTemporalContext = timeIndicators.length > 0;
        const hasSequencing = sequenceWords.length > 0;

        let score = 0;
        if (hasSpecificDates) score += 0.5;
        if (hasTemporalContext) score += 0.3;
        if (hasSequencing) score += 0.2;

        return {
            score: Math.min(score, 1.0),
            specific_dates: dateMatches.map(m => m[0]),
            temporal_indicators: timeIndicators,
            sequence_words: sequenceWords,
            recommendations: this.generateTemporalRecommendations(hasSpecificDates, hasTemporalContext, hasSequencing)
        };
    }

    analyzeStructure(text) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const avgSentencesPerParagraph = sentences.length / paragraphs.length;
        const avgWordsPerSentence = text.split(/\s+/).length / sentences.length;

        // Check for structural elements
        const hasHeaders = /^[A-Z\s]{3,}$/m.test(text);
        const hasBulletPoints = /^\s*[•\-\*]\s+/m.test(text);
        const hasNumberedLists = /^\s*\d+\.\s+/m.test(text);
        const hasQuotes = text.includes('"') && text.split('"').length > 2;

        let structureScore = 0;
        if (paragraphs.length >= 3) structureScore += 0.3;
        if (avgSentencesPerParagraph >= 2 && avgSentencesPerParagraph <= 5) structureScore += 0.2;
        if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 25) structureScore += 0.2;
        if (hasHeaders || hasBulletPoints || hasNumberedLists) structureScore += 0.2;
        if (hasQuotes) structureScore += 0.1;

        return {
            score: Math.min(structureScore, 1.0),
            paragraph_count: paragraphs.length,
            sentence_count: sentences.length,
            avg_sentences_per_paragraph: Math.round(avgSentencesPerParagraph * 10) / 10,
            avg_words_per_sentence: Math.round(avgWordsPerSentence * 10) / 10,
            structural_elements: {
                headers: hasHeaders,
                bullet_points: hasBulletPoints,
                numbered_lists: hasNumberedLists,
                quotes: hasQuotes
            },
            recommendations: this.generateStructureRecommendations(paragraphs.length, avgSentencesPerParagraph, hasHeaders, hasQuotes)
        };
    }

    analyzeSchemaMarkup(text) {
        // Look for JSON-LD schema markup patterns
        const jsonLdMatches = text.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis) || [];
        const schemaOrgReferences = text.match(/schema\.org\/\w+/gi) || [];
        const microdataAttributes = text.match(/(?:itemscope|itemtype|itemprop)\s*=\s*["'][^"']*["']/gi) || [];

        // Check for structured data patterns
        const hasJsonLd = jsonLdMatches.length > 0;
        const hasMicrodata = microdataAttributes.length > 0;
        const hasSchemaOrgReferences = schemaOrgReferences.length > 0;

        // Parse and analyze JSON-LD if present
        const parsedSchemas = [];
        let validSchemas = 0;
        let totalSchemas = jsonLdMatches.length;

        jsonLdMatches.forEach(match => {
            try {
                const content = match.replace(/<script[^>]*>|<\/script>/gi, '').trim();
                const schema = JSON.parse(content);
                parsedSchemas.push(schema);
                validSchemas++;
            } catch (e) {
                // Invalid JSON-LD
            }
        });

        // Analyze schema types and completeness
        const schemaTypes = parsedSchemas.map(schema => schema['@type'] || 'Unknown').filter(Boolean);
        const hasPersonSchema = schemaTypes.some(type => type.includes('Person'));
        const hasOrganizationSchema = schemaTypes.some(type => type.includes('Organization'));
        const hasEventSchema = schemaTypes.some(type => type.includes('Event'));
        const hasArticleSchema = schemaTypes.some(type => type.includes('Article') || type.includes('NewsArticle'));

        // Calculate schema score
        let schemaScore = 0;

        // Base points for having any structured data
        if (hasJsonLd) schemaScore += 0.4;
        else if (hasMicrodata) schemaScore += 0.2;
        else if (hasSchemaOrgReferences) schemaScore += 0.1;

        // Validity bonus
        if (totalSchemas > 0 && validSchemas === totalSchemas) schemaScore += 0.2;
        else if (validSchemas > 0) schemaScore += 0.1;

        // Completeness bonus for relevant schema types
        if (hasPersonSchema) schemaScore += 0.1;
        if (hasOrganizationSchema) schemaScore += 0.1;
        if (hasArticleSchema) schemaScore += 0.1;
        if (hasEventSchema) schemaScore += 0.1;

        // Generate recommendations
        const recommendations = this.generateSchemaRecommendations(
            hasJsonLd,
            validSchemas,
            totalSchemas,
            schemaTypes,
            hasPersonSchema,
            hasOrganizationSchema,
            hasArticleSchema
        );

        return {
            score: Math.min(schemaScore, 1.0),
            has_json_ld: hasJsonLd,
            has_microdata: hasMicrodata,
            has_schema_references: hasSchemaOrgReferences,
            total_schemas: totalSchemas,
            valid_schemas: validSchemas,
            schema_types: schemaTypes,
            schema_coverage: {
                person: hasPersonSchema,
                organization: hasOrganizationSchema,
                event: hasEventSchema,
                article: hasArticleSchema
            },
            recommendations: recommendations
        };
    }

    analyzeFactualDensity(text) {
        const numbers = text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?(?:%|\s*percent)?\b/g) || [];
        const statistics = text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?(?:%|\s*percent)\b/g) || [];
        const sources = text.match(/\b(according to|source:|study by|research shows|data from)\b/gi) || [];
        const attributions = text.match(/\b(said|stated|announced|reported|confirmed)\b/gi) || [];

        const factualIndicators = numbers.length + statistics.length + sources.length + attributions.length;
        const wordCount = text.split(/\s+/).length;
        const factualDensity = factualIndicators / (wordCount / 100); // per 100 words

        let score = Math.min(factualDensity / 3, 1.0); // Normalize to 3 factual indicators per 100 words = 1.0

        return {
            score: score,
            numbers_count: numbers.length,
            statistics_count: statistics.length,
            sources_count: sources.length,
            attributions_count: attributions.length,
            factual_density: Math.round(factualDensity * 10) / 10,
            recommendations: this.generateFactualRecommendations(score, numbers.length, sources.length)
        };
    }

    analyzeSemanticRichness(text) {
        const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const uniqueWords = [...new Set(words)];
        const vocabularyDiversity = uniqueWords.length / words.length;

        // Check for domain-specific terminology
        const politicalTerms = words.filter(word =>
            ['campaign', 'candidate', 'election', 'policy', 'governance', 'constituent', 'voter', 'democracy'].includes(word)
        ).length;

        // Check for descriptive language
        const adjectives = words.filter(word =>
            word.match(/\b(important|significant|crucial|essential|vital|strong|effective|successful|dedicated|experienced)\b/)
        ).length;

        let score = 0;
        score += Math.min(vocabularyDiversity * 2, 0.4); // 40% for diversity
        score += Math.min(politicalTerms / 10, 0.3); // 30% for domain terms
        score += Math.min(adjectives / 5, 0.3); // 30% for descriptive language

        return {
            score: Math.min(score, 1.0),
            total_words: words.length,
            unique_words: uniqueWords.length,
            vocabulary_diversity: Math.round(vocabularyDiversity * 100) / 100,
            political_terms: politicalTerms,
            descriptive_terms: adjectives,
            recommendations: this.generateSemanticRecommendations(vocabularyDiversity, politicalTerms, adjectives)
        };
    }

    analyzeActionableContent(text) {
        const actionVerbs = text.match(/\b(will|plans to|commits to|proposes|supports|opposes|implements|establishes|creates|develops)\b/gi) || [];
        const specificActions = text.match(/\b(vote|support|contact|visit|attend|join|volunteer|donate|register)\b/gi) || [];
        const measurableOutcomes = text.match(/\b(increase|decrease|reduce|improve|achieve|reach|target)\s+\w+\s+by\s+\d+/gi) || [];
        const deadlines = text.match(/\b(by|before|until|deadline|due)\s+[A-Z][a-z]+\s+\d+/gi) || [];

        const actionableElements = actionVerbs.length + specificActions.length + measurableOutcomes.length + deadlines.length;
        const wordCount = text.split(/\s+/).length;
        const actionableDensity = actionableElements / (wordCount / 100);

        let score = Math.min(actionableDensity / 2, 1.0); // Normalize to 2 actionable elements per 100 words = 1.0

        return {
            score: score,
            action_verbs: actionVerbs.length,
            specific_actions: specificActions.length,
            measurable_outcomes: measurableOutcomes.length,
            deadlines: deadlines.length,
            actionable_density: Math.round(actionableDensity * 10) / 10,
            recommendations: this.generateActionableRecommendations(score, actionVerbs.length, specificActions.length)
        };
    }

    analyzeQueryAnticipation(text) {
        const textLower = text.toLowerCase();
        const questionCoverage = {};
        let totalCoverage = 0;

        for (const questionType of this.questionPatterns) {
            let coverage = 0;
            for (const pattern of questionType.patterns) {
                if (textLower.includes(pattern)) {
                    coverage += 1;
                }
            }
            coverage = Math.min(coverage / questionType.patterns.length, 1.0);
            questionCoverage[questionType.type] = coverage;
            totalCoverage += coverage;
        }

        const averageCoverage = totalCoverage / this.questionPatterns.length;

        return {
            score: averageCoverage,
            question_coverage: questionCoverage,
            recommendations: this.generateQueryRecommendations(questionCoverage)
        };
    }

    calculateCriteriaScores(analyses) {
        const scores = {};
        for (const [criterion, analysis] of Object.entries(analyses)) {
            scores[criterion] = {
                score: analysis.score,
                weight: this.optimizationCriteria[criterion].weight,
                weighted_score: analysis.score * this.optimizationCriteria[criterion].weight
            };
        }
        return scores;
    }

    calculateOverallScore(criteriaScores) {
        const totalWeightedScore = Object.values(criteriaScores)
            .reduce((sum, criteria) => sum + criteria.weighted_score, 0);

        const totalWeight = Object.values(this.optimizationCriteria)
            .reduce((sum, criteria) => sum + criteria.weight, 0);

        const normalizedScore = totalWeightedScore / totalWeight;

        return {
            score: Math.round(normalizedScore * 100),
            grade: this.getOptimizationGrade(normalizedScore),
            level: this.getOptimizationLevel(normalizedScore)
        };
    }

    getOptimizationGrade(score) {
        if (score >= 0.9) return 'A+';
        if (score >= 0.8) return 'A';
        if (score >= 0.7) return 'B';
        if (score >= 0.6) return 'C';
        if (score >= 0.5) return 'D';
        return 'F';
    }

    getOptimizationLevel(score) {
        if (score >= 0.8) return 'Highly Optimized';
        if (score >= 0.6) return 'Well Optimized';
        if (score >= 0.4) return 'Moderately Optimized';
        return 'Needs Optimization';
    }

    generateOptimizationRecommendations(criteriaScores, detailedAnalyses) {
        const recommendations = [];

        // Find the lowest scoring criteria for priority recommendations
        const sortedCriteria = Object.entries(criteriaScores)
            .sort((a, b) => a[1].score - b[1].score);

        for (const [criterion, scores] of sortedCriteria.slice(0, 3)) {
            if (scores.score < 0.7) {
                const criteriaInfo = this.optimizationCriteria[criterion];
                recommendations.push({
                    type: 'improvement',
                    priority: scores.score < 0.3 ? 'high' : 'medium',
                    criterion: criterion,
                    title: `Improve ${criteriaInfo.name}`,
                    description: criteriaInfo.description,
                    current_score: Math.round(scores.score * 100),
                    specific_suggestions: this.getSpecificSuggestions(criterion, detailedAnalyses)
                });
            }
        }

        // Add general AI optimization suggestions
        recommendations.push({
            type: 'enhancement',
            priority: 'low',
            title: 'Foundation Model Optimization',
            description: 'Additional improvements for AI understanding',
            suggestions: [
                'Add schema markup for structured data',
                'Include FAQ section for common queries',
                'Use consistent terminology throughout',
                'Add related topic references'
            ]
        });

        return recommendations.slice(0, 5);
    }

    getSpecificSuggestions(criterion, analyses) {
        const suggestions = {
            entity_clarity: [
                'Add full names and titles for all people mentioned',
                'Include complete addresses for locations',
                'Specify organizational affiliations clearly',
                'Use consistent naming throughout the document'
            ],
            temporal_accuracy: [
                'Replace vague time references with specific dates',
                'Add deadlines and timelines for actions',
                'Use clear chronological ordering',
                'Include time zones for events'
            ],
            structured_information: [
                'Break long paragraphs into shorter sections',
                'Add headers and subheaders',
                'Use bullet points for lists',
                'Organize information hierarchically'
            ],
            schema_markup: [
                'Add JSON-LD structured data markup',
                'Include Person schema for candidate information',
                'Add Organization schema for campaign details',
                'Implement NewsArticle schema for press releases',
                'Use Event schema for campaign events'
            ],
            factual_density: [
                'Add statistics and data points',
                'Include source attributions',
                'Provide verifiable claims',
                'Add context for claims made'
            ],
            semantic_richness: [
                'Use varied vocabulary and synonyms',
                'Include domain-specific terminology',
                'Add descriptive language',
                'Expand technical explanations'
            ],
            actionable_content: [
                'Specify concrete actions to take',
                'Add measurable outcomes',
                'Include deadlines and timelines',
                'Provide implementation details'
            ],
            query_anticipation: [
                'Answer who, what, when, where, why, how',
                'Add FAQ section',
                'Include background context',
                'Address potential concerns'
            ]
        };

        return suggestions[criterion] || ['Improve content quality and specificity'];
    }

    generateSchemaRecommendations(hasJsonLd, validSchemas, totalSchemas, schemaTypes, hasPersonSchema, hasOrganizationSchema, hasArticleSchema) {
        const recommendations = [];

        if (!hasJsonLd) {
            recommendations.push('Add JSON-LD structured data markup to improve AI understanding');
        } else if (totalSchemas > validSchemas) {
            recommendations.push('Fix invalid JSON-LD syntax in existing schemas');
        }

        if (!hasPersonSchema) {
            recommendations.push('Add Person schema for candidate and staff information');
        }

        if (!hasOrganizationSchema) {
            recommendations.push('Include Organization schema for campaign and party details');
        }

        if (!hasArticleSchema) {
            recommendations.push('Implement NewsArticle or Article schema for press content');
        }

        if (schemaTypes.length === 0 && hasJsonLd) {
            recommendations.push('Specify @type properties in JSON-LD schemas');
        }

        return recommendations;
    }

    assessFoundationModelReadiness(overallScore, criteriaScores) {
        const readiness = {
            gpt: this.assessGPTReadiness(overallScore, criteriaScores),
            claude: this.assessClaudeReadiness(overallScore, criteriaScores),
            gemini: this.assessGeminiReadiness(overallScore, criteriaScores)
        };

        return {
            readiness_scores: readiness,
            overall_readiness: Math.round((readiness.gpt + readiness.claude + readiness.gemini) / 3),
            best_model_fit: Object.entries(readiness).reduce((a, b) => readiness[a[0]] > readiness[b[0]] ? a : b)[0]
        };
    }

    assessGPTReadiness(overallScore, criteriaScores) {
        // GPT favors structured, factual content with clear entities
        const entityWeight = criteriaScores.entity_clarity?.score || 0;
        const factualWeight = criteriaScores.factual_density?.score || 0;
        const structureWeight = criteriaScores.structured_information?.score || 0;

        return Math.round((entityWeight * 0.4 + factualWeight * 0.3 + structureWeight * 0.3) * 100);
    }

    assessClaudeReadiness(overallScore, criteriaScores) {
        // Claude excels with nuanced, well-structured content
        const semanticWeight = criteriaScores.semantic_richness?.score || 0;
        const queryWeight = criteriaScores.query_anticipation?.score || 0;
        const structureWeight = criteriaScores.structured_information?.score || 0;

        return Math.round((semanticWeight * 0.4 + queryWeight * 0.3 + structureWeight * 0.3) * 100);
    }

    assessGeminiReadiness(overallScore, criteriaScores) {
        // Gemini works well with actionable, temporally accurate content
        const actionableWeight = criteriaScores.actionable_content?.score || 0;
        const temporalWeight = criteriaScores.temporal_accuracy?.score || 0;
        const factualWeight = criteriaScores.factual_density?.score || 0;

        return Math.round((actionableWeight * 0.4 + temporalWeight * 0.3 + factualWeight * 0.3) * 100);
    }

    // Helper methods for generating specific recommendations
    generateEntityRecommendations(entities) {
        const recommendations = [];
        if (entities.person.count === 0) recommendations.push('Add full names and titles');
        if (entities.location.count === 0) recommendations.push('Include specific locations');
        if (entities.date.count === 0) recommendations.push('Add specific dates');
        return recommendations;
    }

    generateTemporalRecommendations(hasSpecificDates, hasTemporalContext, hasSequencing) {
        const recommendations = [];
        if (!hasSpecificDates) recommendations.push('Add specific dates and times');
        if (!hasTemporalContext) recommendations.push('Include temporal context words');
        if (!hasSequencing) recommendations.push('Use sequence words to show order');
        return recommendations;
    }

    generateStructureRecommendations(paragraphCount, avgSentencesPerParagraph, hasHeaders, hasQuotes) {
        const recommendations = [];
        if (paragraphCount < 3) recommendations.push('Break content into more paragraphs');
        if (avgSentencesPerParagraph > 5) recommendations.push('Shorten paragraphs');
        if (!hasHeaders) recommendations.push('Add section headers');
        if (!hasQuotes) recommendations.push('Include direct quotes');
        return recommendations;
    }

    generateFactualRecommendations(score, numbersCount, sourcesCount) {
        const recommendations = [];
        if (score < 0.5) recommendations.push('Add more statistics and data');
        if (sourcesCount === 0) recommendations.push('Include source attributions');
        if (numbersCount < 2) recommendations.push('Add specific numbers and metrics');
        return recommendations;
    }

    generateSemanticRecommendations(vocabularyDiversity, politicalTerms, adjectives) {
        const recommendations = [];
        if (vocabularyDiversity < 0.3) recommendations.push('Use more varied vocabulary');
        if (politicalTerms < 3) recommendations.push('Include relevant political terminology');
        if (adjectives < 3) recommendations.push('Add more descriptive language');
        return recommendations;
    }

    generateActionableRecommendations(score, actionVerbs, specificActions) {
        const recommendations = [];
        if (score < 0.5) recommendations.push('Add more actionable content');
        if (actionVerbs < 2) recommendations.push('Include action verbs and commitments');
        if (specificActions < 2) recommendations.push('Specify concrete actions to take');
        return recommendations;
    }

    generateQueryRecommendations(questionCoverage) {
        const recommendations = [];
        for (const [type, coverage] of Object.entries(questionCoverage)) {
            if (coverage < 0.5) {
                recommendations.push(`Better address "${type}" questions`);
            }
        }
        return recommendations;
    }
}

module.exports = AIOptimizationAnalyzer;