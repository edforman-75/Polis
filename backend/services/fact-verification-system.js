/**
 * Fact Verification System
 * Academic-grade fact verification with credible sources and precise documentation
 *
 * CRITICAL: This system ONLY uses verifiable, authoritative sources.
 * NO facts or sources are generated - all must be confirmed through actual verification.
 */

const axios = require('axios');

class FactVerificationSystem {
    constructor() {
        // Tier 1: Primary/Authoritative Sources (Highest credibility)
        this.primarySources = {
            government_statistical: {
                'Bureau of Labor Statistics': {
                    domain: 'bls.gov',
                    apiEndpoint: 'https://api.bls.gov/publicAPI/v2/timeseries/data/',
                    subjects: ['employment', 'unemployment', 'wages', 'inflation', 'labor_force'],
                    citationFormat: 'Bureau of Labor Statistics. "{title}." {date}. {url}',
                    reliability: 'authoritative'
                },
                'U.S. Census Bureau': {
                    domain: 'census.gov',
                    apiEndpoint: 'https://api.census.gov/data/',
                    subjects: ['population', 'demographics', 'income', 'poverty', 'housing'],
                    citationFormat: 'U.S. Census Bureau. "{title}." {date}. {url}',
                    reliability: 'authoritative'
                },
                'Federal Reserve Economic Data (FRED)': {
                    domain: 'fred.stlouisfed.org',
                    apiEndpoint: 'https://api.stlouisfed.org/fred/',
                    subjects: ['economic_indicators', 'gdp', 'interest_rates', 'money_supply'],
                    citationFormat: 'Federal Reserve Bank of St. Louis. "{title}," FRED Economic Data. {date}. {url}',
                    reliability: 'authoritative'
                },
                'Centers for Disease Control': {
                    domain: 'cdc.gov',
                    subjects: ['health_statistics', 'disease_surveillance', 'mortality', 'morbidity'],
                    citationFormat: 'Centers for Disease Control and Prevention. "{title}." {date}. {url}',
                    reliability: 'authoritative'
                },
                'Congressional Budget Office': {
                    domain: 'cbo.gov',
                    subjects: ['budget_analysis', 'economic_projections', 'policy_costs'],
                    citationFormat: 'Congressional Budget Office. "{title}." {date}. {url}',
                    reliability: 'authoritative'
                }
            },

            government_records: {
                'Federal Election Commission': {
                    domain: 'fec.gov',
                    apiEndpoint: 'https://api.open.fec.gov/v1/',
                    subjects: ['campaign_finance', 'election_data', 'candidate_filings'],
                    citationFormat: 'Federal Election Commission. "{title}." {date}. {url}',
                    reliability: 'authoritative'
                },
                'Congress.gov': {
                    domain: 'congress.gov',
                    subjects: ['legislation', 'voting_records', 'congressional_activity'],
                    citationFormat: 'Congress.gov. "{bill_number}: {title}." {date}. {url}',
                    reliability: 'authoritative'
                },
                'GovTrack': {
                    domain: 'govtrack.us',
                    subjects: ['voting_records', 'bill_tracking', 'legislative_analysis'],
                    citationFormat: 'GovTrack.us. "{title}." {date}. {url}',
                    reliability: 'high'
                }
            },

            judicial_legal: {
                'Supreme Court Database': {
                    domain: 'supremecourt.gov',
                    subjects: ['court_decisions', 'legal_precedent'],
                    citationFormat: '{case_name}, {citation} ({year}). {url}',
                    reliability: 'authoritative'
                },
                'Justia': {
                    domain: 'justia.com',
                    subjects: ['case_law', 'legal_documents'],
                    citationFormat: '{case_name}, {citation}, via Justia. {url}',
                    reliability: 'high'
                }
            }
        };

        // Tier 2: Established Research Sources (High credibility)
        this.researchSources = {
            polling_research: {
                'Pew Research Center': {
                    domain: 'pewresearch.org',
                    subjects: ['public_opinion', 'social_trends', 'demographics'],
                    citationFormat: 'Pew Research Center. "{title}." {date}. {url}',
                    reliability: 'high',
                    methodology_required: true
                },
                'Gallup': {
                    domain: 'gallup.com',
                    subjects: ['polling', 'public_opinion', 'workplace_trends'],
                    citationFormat: 'Gallup. "{title}." {date}. {url}',
                    reliability: 'high',
                    methodology_required: true
                }
            },

            academic_research: {
                'National Bureau of Economic Research': {
                    domain: 'nber.org',
                    subjects: ['economic_research', 'policy_analysis'],
                    citationFormat: '{authors}. "{title}." NBER Working Paper {number}. {date}. {url}',
                    reliability: 'high',
                    peer_review_required: true
                },
                'Brookings Institution': {
                    domain: 'brookings.edu',
                    subjects: ['policy_research', 'economic_analysis'],
                    citationFormat: '{authors}. "{title}." Brookings. {date}. {url}',
                    reliability: 'medium-high',
                    bias_check_required: true
                }
            }
        };

        // Tier 3: News/Reporting Sources (Medium credibility, requires verification)
        this.newsSources = {
            wire_services: {
                'Associated Press': {
                    domain: 'apnews.com',
                    reliability: 'high',
                    citationFormat: '{authors}. "{title}." Associated Press. {date}. {url}'
                },
                'Reuters': {
                    domain: 'reuters.com',
                    reliability: 'high',
                    citationFormat: '{authors}. "{title}." Reuters. {date}. {url}'
                }
            },

            fact_checkers: {
                'PolitiFact': {
                    domain: 'politifact.com',
                    reliability: 'high',
                    citationFormat: '{authors}. "{title}." PolitiFact. {date}. {url}',
                    verification_required: true
                },
                'FactCheck.org': {
                    domain: 'factcheck.org',
                    reliability: 'high',
                    citationFormat: '{authors}. "{title}." FactCheck.org. {date}. {url}',
                    verification_required: true
                }
            }
        };

        // PROHIBITED sources (unreliable, biased, or unverifiable)
        this.prohibitedSources = [
            'social media posts',
            'anonymous blogs',
            'unverified websites',
            'partisan advocacy sites',
            'conspiracy theory sites',
            'satirical news sites',
            'user-generated content sites'
        ];

        // Traffic Light Verification System - Simple, intuitive fact-checking scale
        this.VERIFICATION_LEVELS = {
            // 🟢 GREEN LIGHT - Go ahead, safe to use
            GREEN: {
                confidence: 90,
                description: 'Verified and safe - accurate statement with proper context',
                status: 'approved',
                risk_level: 'low',
                action: 'USE_AS_IS',
                examples: [
                    'Factually accurate with authoritative sources',
                    'Includes appropriate context and limitations',
                    'Unlikely to mislead audiences'
                ]
            },

            // 🟡 YELLOW LIGHT - Proceed with caution
            YELLOW: {
                confidence: 60,
                description: 'Caution needed - true but incomplete, speculative, or could mislead',
                status: 'requires_modification',
                risk_level: 'medium',
                action: 'ADD_CONTEXT_OR_DISCLAIMER',
                subcategories: {
                    INCOMPLETE: 'True but missing important context',
                    SPECULATIVE: 'Future projections or estimates',
                    MISLEADING: 'Technically accurate but could mislead',
                    UNVERIFIABLE: 'Cannot be confirmed with available sources'
                },
                required_fixes: [
                    'Add qualifying language ("according to...", "estimated...")',
                    'Include relevant context or limitations',
                    'Provide comparative information',
                    'Add timeline or scope clarifications'
                ]
            },

            // 🔴 RED LIGHT - Stop, do not use
            RED: {
                confidence: 20,
                description: 'Do not use - false, contradicted, or highly problematic',
                status: 'rejected',
                risk_level: 'high',
                action: 'REMOVE_OR_REPLACE',
                subcategories: {
                    FALSE: 'Definitively incorrect',
                    CONTRADICTED: 'Disputes credible sources',
                    HARMFUL: 'Could cause significant political damage'
                },
                recommendations: [
                    'Remove the claim entirely',
                    'Replace with verified alternative',
                    'Acknowledge and correct if already published'
                ]
            }
        };

        // Verification workflow states
        this.verificationStates = {
            PENDING: 'pending_verification',
            IN_PROGRESS: 'verification_in_progress',
            COMPLETED: 'verification_completed',
            REQUIRES_HUMAN_REVIEW: 'requires_human_review',
            ERROR: 'verification_error'
        };
    }

    /**
     * Main verification function - NEVER generates fake sources
     * Returns verification plan and requirements, not fabricated results
     */
    async initiateFact Verification(claim) {
        const verificationRecord = {
            claim: {
                text: claim.text,
                type: claim.type,
                identified_at: new Date().toISOString(),
                claim_id: this.generateClaimId(claim)
            },
            verification_status: this.verificationStates.PENDING,
            verification_plan: await this.createVerificationPlan(claim),
            sources_to_check: [],
            verification_results: [],
            final_assessment: null,
            verification_metadata: {
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                verifier_notes: []
            }
        };

        return verificationRecord;
    }

    generateClaimId(claim) {
        // Generate unique ID for claim tracking
        const hash = require('crypto').createHash('md5').update(claim.text).digest('hex');
        return `claim_${hash.substring(0, 12)}_${Date.now()}`;
    }

    async createVerificationPlan(claim) {
        const plan = {
            verification_steps: [],
            required_sources: [],
            estimated_complexity: 'medium',
            estimated_time: '30 minutes',
            special_requirements: []
        };

        // Determine verification approach based on claim type
        switch (claim.type) {
            case 'statistical':
                plan.verification_steps = [
                    'Identify official data source for statistic',
                    'Verify current accuracy of numbers',
                    'Check context and methodology',
                    'Confirm date range and scope',
                    'Document exact citation'
                ];
                plan.required_sources = this.identifyStatisticalSources(claim.text);
                plan.estimated_complexity = 'low';
                break;

            case 'attribution':
                plan.verification_steps = [
                    'Locate original source document',
                    'Verify quote accuracy and context',
                    'Check publication date and validity',
                    'Confirm author credentials',
                    'Document complete citation'
                ];
                plan.required_sources = this.identifyAttributionSources(claim.text);
                plan.estimated_complexity = 'medium';
                break;

            case 'historical':
                plan.verification_steps = [
                    'Cross-reference historical records',
                    'Verify dates and timeline accuracy',
                    'Check multiple authoritative sources',
                    'Confirm context and circumstances',
                    'Document historical citations'
                ];
                plan.required_sources = this.identifyHistoricalSources(claim.text);
                plan.estimated_complexity = 'medium-high';
                break;

            case 'policy':
                plan.verification_steps = [
                    'Review actual policy text or voting records',
                    'Verify official positions and statements',
                    'Check for position changes over time',
                    'Confirm implementation details',
                    'Document official sources'
                ];
                plan.required_sources = this.identifyPolicySources(claim.text);
                plan.estimated_complexity = 'medium';
                break;

            default:
                plan.verification_steps = [
                    'Identify claim subject area',
                    'Locate authoritative sources',
                    'Cross-verify with multiple sources',
                    'Check for contradictory evidence',
                    'Document complete verification trail'
                ];
                plan.estimated_complexity = 'high';
        }

        // Add sensitive topic requirements
        if (claim.sensitiveTopics && claim.sensitiveTopics.length > 0) {
            plan.special_requirements.push('Extra verification due to sensitive topic');
            plan.estimated_time = '45 minutes';
        }

        return plan;
    }

    identifyStatisticalSources(claimText) {
        const sources = [];
        const text = claimText.toLowerCase();

        // Economic statistics
        if (text.match(/(unemployment|employment|jobs|wages|inflation|gdp)/)) {
            sources.push(this.primarySources.government_statistical['Bureau of Labor Statistics']);
            sources.push(this.primarySources.government_statistical['Federal Reserve Economic Data (FRED)']);
        }

        // Demographic statistics
        if (text.match(/(population|census|demographics|income|poverty)/)) {
            sources.push(this.primarySources.government_statistical['U.S. Census Bureau']);
        }

        // Health statistics
        if (text.match(/(disease|mortality|health|covid|vaccine)/)) {
            sources.push(this.primarySources.government_statistical['Centers for Disease Control']);
        }

        // Election statistics
        if (text.match(/(election|voting|campaign|candidate)/)) {
            sources.push(this.primarySources.government_records['Federal Election Commission']);
        }

        return sources;
    }

    identifyAttributionSources(claimText) {
        const sources = [];
        const text = claimText.toLowerCase();

        // Check if specific organization mentioned
        if (text.includes('pew research') || text.includes('pew')) {
            sources.push(this.researchSources.polling_research['Pew Research Center']);
        }

        if (text.includes('gallup')) {
            sources.push(this.researchSources.polling_research['Gallup']);
        }

        if (text.includes('cdc') || text.includes('centers for disease control')) {
            sources.push(this.primarySources.government_statistical['Centers for Disease Control']);
        }

        // Add fact-checking sources for verification
        sources.push(this.newsSources.fact_checkers['PolitiFact']);
        sources.push(this.newsSources.fact_checkers['FactCheck.org']);

        return sources;
    }

    identifyPolicySources(claimText) {
        const sources = [];

        // Always include voting record sources for policy claims
        sources.push(this.primarySources.government_records['Congress.gov']);
        sources.push(this.primarySources.government_records['GovTrack']);

        // Campaign finance related
        if (claimText.toLowerCase().match(/(campaign|donation|contribution|funding)/)) {
            sources.push(this.primarySources.government_records['Federal Election Commission']);
        }

        return sources;
    }

    identifyHistoricalSources(claimText) {
        const sources = [];

        // Government archives for historical claims
        sources.push({
            name: 'National Archives',
            domain: 'archives.gov',
            reliability: 'authoritative',
            citationFormat: 'National Archives. "{title}." {date}. {url}'
        });

        // Congressional records for political history
        sources.push(this.primarySources.government_records['Congress.gov']);

        return sources;
    }

    /**
     * Create verification task for human fact-checker
     * Does NOT perform automated fact-checking
     */
    createVerificationTask(verificationRecord) {
        const task = {
            task_id: `verify_${verificationRecord.claim.claim_id}`,
            priority: this.calculateVerificationPriority(verificationRecord.claim),
            assigned_to: null, // To be assigned to human fact-checker
            status: 'pending_assignment',

            claim_details: {
                text: verificationRecord.claim.text,
                type: verificationRecord.claim.type,
                context: verificationRecord.claim.context || 'Not specified',
                urgency: verificationRecord.claim.temporalUrgency || 'standard'
            },

            verification_instructions: {
                steps: verificationRecord.verification_plan.verification_steps,
                sources_to_check: verificationRecord.verification_plan.required_sources,
                special_requirements: verificationRecord.verification_plan.special_requirements,
                estimated_time: verificationRecord.verification_plan.estimated_time
            },

            required_documentation: {
                source_verification: 'Document exact URL, title, date, and author for each source',
                citation_format: 'Use academic citation format for all sources',
                evidence_summary: 'Provide clear summary of what sources confirm or refute',
                confidence_level: 'Rate confidence in verification result (1-10)',
                additional_context: 'Note any important context or limitations',
                misleading_assessment: 'Evaluate whether statement could mislead despite being technically true'
            },

            submission_requirements: {
                verification_result: 'One of: SAFE, VERIFIED_BUT_INCOMPLETE, SPECULATIVE, MISLEADING_BUT_TECHNICALLY_TRUE, LACKS_SUFFICIENT_CONTEXT, UNVERIFIABLE, CONTRADICTED, FALSE',
                source_citations: 'Complete academic-style citations for all sources used',
                evidence_analysis: 'Detailed analysis of evidence found',
                confidence_score: 'Numerical confidence rating (1-10)',
                misleading_factors: 'If misleading, specify: selective facts, missing context, cherry picking, etc.',
                improvement_recommendations: 'Suggest specific ways to improve accuracy and context',
                reviewer_notes: 'Any additional context or concerns'
            }
        };

        return task;
    }

    calculateVerificationPriority(claim) {
        let priority = 1; // Base priority

        // Increase for sensitive topics
        if (claim.sensitiveTopics && claim.sensitiveTopics.length > 0) {
            priority += 2;
        }

        // Increase for high-confidence claims that could be impactful
        if (claim.confidence > 0.7) {
            priority += 1;
        }

        // Increase for urgent/recent claims
        if (claim.temporalUrgency === 'urgent') {
            priority += 2;
        }

        // Increase for disputed claims
        if (claim.riskAssessment && claim.riskAssessment.level === 'high') {
            priority += 1;
        }

        return Math.min(5, priority); // Cap at priority 5
    }

    /**
     * Process completed verification from human fact-checker
     * Stores results with academic-level documentation
     */
    processVerificationResult(taskId, verificationResult) {
        const verificationLevel = this.VERIFICATION_LEVELS[verificationResult.verification_result];

        const result = {
            task_id: taskId,
            verification_completed_at: new Date().toISOString(),
            verified_by: verificationResult.verifier_id,

            finding: {
                result: verificationResult.verification_result,
                verification_level: verificationLevel,
                confidence_score: verificationResult.confidence_score,
                evidence_summary: verificationResult.evidence_analysis,
                political_risk: verificationLevel ? verificationLevel.political_risk : 'unknown'
            },

            misleading_analysis: {
                is_misleading: verificationResult.verification_result === 'MISLEADING_BUT_TECHNICALLY_TRUE',
                misleading_factors: verificationResult.misleading_factors || [],
                context_gaps: verificationResult.context_gaps || [],
                improvement_recommendations: verificationResult.improvement_recommendations || []
            },

            sources_used: verificationResult.source_citations.map(citation => ({
                citation: citation.formatted_citation,
                url: citation.url,
                access_date: citation.access_date,
                reliability_assessment: citation.reliability_assessment,
                relevance_score: citation.relevance_score
            })),

            verification_notes: {
                methodology: verificationResult.verification_methodology,
                limitations: verificationResult.limitations || [],
                additional_context: verificationResult.additional_context,
                reviewer_concerns: verificationResult.reviewer_concerns || []
            },

            quality_control: {
                sources_verified: verificationResult.sources_verified,
                cross_referenced: verificationResult.cross_referenced,
                bias_assessment: verificationResult.bias_assessment,
                update_needed_date: this.calculateUpdateDate(verificationResult)
            }
        };

        return result;
    }

    calculateUpdateDate(verificationResult) {
        // Determine when this verification should be rechecked
        const now = new Date();

        if (verificationResult.verification_result === 'UNVERIFIABLE') {
            // Recheck unverifiable claims in 30 days
            return new Date(now.setDate(now.getDate() + 30));
        } else if (verificationResult.involves_ongoing_situation) {
            // Recheck ongoing situations in 7 days
            return new Date(now.setDate(now.getDate() + 7));
        } else {
            // Standard recheck in 90 days
            return new Date(now.setDate(now.getDate() + 90));
        }
    }

    /**
     * Generate citation in proper academic format
     */
    formatAcademicCitation(source, accessDate) {
        const citation = {
            apa: '',
            mla: '',
            chicago: ''
        };

        const date = new Date(accessDate);
        const formattedDate = date.toLocaleDateString('en-US');

        // APA Format
        if (source.authors) {
            citation.apa = `${source.authors} (${source.year}). ${source.title}. ${source.publisher}. Retrieved ${formattedDate}, from ${source.url}`;
        } else {
            citation.apa = `${source.organization} (${source.year}). ${source.title}. Retrieved ${formattedDate}, from ${source.url}`;
        }

        // MLA Format
        if (source.authors) {
            citation.mla = `${source.authors}. "${source.title}." ${source.publisher}, ${source.year}, ${source.url}. Accessed ${formattedDate}.`;
        } else {
            citation.mla = `${source.organization}. "${source.title}." ${source.year}, ${source.url}. Accessed ${formattedDate}.`;
        }

        return citation;
    }

    /**
     * Validate that a source meets credibility standards
     */
    validateSourceCredibility(sourceUrl, sourceName) {
        const validation = {
            is_credible: false,
            credibility_tier: null,
            concerns: [],
            approved_for_use: false
        };

        try {
            const domain = new URL(sourceUrl).hostname.toLowerCase();

            // Check against primary sources
            for (const [category, sources] of Object.entries(this.primarySources)) {
                for (const [name, config] of Object.entries(sources)) {
                    if (domain.includes(config.domain)) {
                        validation.is_credible = true;
                        validation.credibility_tier = 'primary';
                        validation.approved_for_use = true;
                        return validation;
                    }
                }
            }

            // Check against research sources
            for (const [category, sources] of Object.entries(this.researchSources)) {
                for (const [name, config] of Object.entries(sources)) {
                    if (domain.includes(config.domain)) {
                        validation.is_credible = true;
                        validation.credibility_tier = 'research';
                        validation.approved_for_use = true;
                        if (config.bias_check_required) {
                            validation.concerns.push('Requires bias assessment due to institutional perspective');
                        }
                        return validation;
                    }
                }
            }

            // Check against news sources
            for (const [category, sources] of Object.entries(this.newsSources)) {
                for (const [name, config] of Object.entries(sources)) {
                    if (domain.includes(config.domain)) {
                        validation.is_credible = true;
                        validation.credibility_tier = 'news';
                        validation.approved_for_use = config.verification_required ? false : true;
                        if (config.verification_required) {
                            validation.concerns.push('Requires independent verification of news claims');
                        }
                        return validation;
                    }
                }
            }

            // If not in approved lists, mark as requiring review
            validation.concerns.push('Source not in pre-approved credible source list');
            validation.approved_for_use = false;

        } catch (error) {
            validation.concerns.push('Invalid URL format');
        }

        return validation;
    }

    /**
     * Determine traffic light rating based on verification results
     * This provides clear guidance to fact-checkers and content creators
     */
    determineTrafficLightRating(verificationResult) {
        const rating = {
            light: null,
            subcategory: null,
            reasoning: '',
            required_actions: [],
            risk_assessment: ''
        };

        const confidence = verificationResult.confidence_score || 0;
        const evidenceStrength = verificationResult.evidence_strength || 'weak';
        const hasMisleadingElements = verificationResult.misleading_factors && verificationResult.misleading_factors.length > 0;
        const isSpeculative = verificationResult.involves_projections || verificationResult.contains_estimates;
        const hasContextGaps = verificationResult.context_gaps && verificationResult.context_gaps.length > 0;

        // RED LIGHT - Stop, do not use
        if (confidence < 30 || verificationResult.verification_result === 'FALSE' || verificationResult.verification_result === 'CONTRADICTED') {
            rating.light = 'RED';
            rating.risk_assessment = 'HIGH RISK - Could cause significant political damage';

            if (verificationResult.verification_result === 'FALSE') {
                rating.subcategory = 'FALSE';
                rating.reasoning = 'Statement is definitively incorrect according to authoritative sources';
                rating.required_actions = ['Remove claim completely', 'Issue correction if already published'];
            } else if (verificationResult.verification_result === 'CONTRADICTED') {
                rating.subcategory = 'CONTRADICTED';
                rating.reasoning = 'Statement contradicted by credible sources';
                rating.required_actions = ['Replace with accurate information', 'Verify alternative claims'];
            } else {
                rating.subcategory = 'HARMFUL';
                rating.reasoning = 'Statement could cause significant political or reputational damage';
                rating.required_actions = ['Do not use', 'Consult senior staff before proceeding'];
            }
        }

        // YELLOW LIGHT - Proceed with caution
        else if (confidence < 75 || hasMisleadingElements || isSpeculative || hasContextGaps || verificationResult.verification_result === 'UNVERIFIABLE') {
            rating.light = 'YELLOW';
            rating.risk_assessment = 'MEDIUM RISK - Needs modification before use';
            rating.required_actions = [];

            if (hasMisleadingElements) {
                rating.subcategory = 'MISLEADING';
                rating.reasoning = 'Statement is technically accurate but presented in a way that could mislead audiences';
                rating.required_actions.push('Add qualifying context');
                rating.required_actions.push('Include relevant counterpoints');
            } else if (isSpeculative) {
                rating.subcategory = 'SPECULATIVE';
                rating.reasoning = 'Statement involves future projections or estimates';
                rating.required_actions.push('Add qualifying language (estimated, projected, expected)');
                rating.required_actions.push('Include uncertainty disclaimers');
            } else if (hasContextGaps) {
                rating.subcategory = 'INCOMPLETE';
                rating.reasoning = 'Statement is true but missing important context';
                rating.required_actions.push('Add necessary context');
                rating.required_actions.push('Clarify scope and limitations');
            } else if (verificationResult.verification_result === 'UNVERIFIABLE') {
                rating.subcategory = 'UNVERIFIABLE';
                rating.reasoning = 'Cannot be confirmed with available authoritative sources';
                rating.required_actions.push('Consider removing claim');
                rating.required_actions.push('Replace with verifiable alternative');
            }
        }

        // GREEN LIGHT - Safe to use as-is
        else {
            rating.light = 'GREEN';
            rating.subcategory = null;
            rating.reasoning = 'Statement is accurate, well-sourced, and provides appropriate context';
            rating.required_actions = ['No changes needed - safe to use'];
            rating.risk_assessment = 'LOW RISK - Safe for publication';
        }

        return rating;
    }

    /**
     * Generate user-friendly traffic light report with detailed explanations
     */
    generateTrafficLightReport(verificationResult) {
        const rating = this.determineTrafficLightRating(verificationResult);
        const level = this.VERIFICATION_LEVELS[rating.light];

        return {
            // Visual indicator
            traffic_light: rating.light,
            emoji: rating.light === 'GREEN' ? '🟢' : rating.light === 'YELLOW' ? '🟡' : '🔴',

            // Clear recommendation
            recommendation: level.action,
            confidence: level.confidence,

            // Detailed analysis
            assessment: {
                risk_level: level.risk_level,
                reasoning: rating.reasoning,
                subcategory: rating.subcategory,
                required_actions: rating.required_actions
            },

            // DETAILED EXPLANATION - Why this rating was assigned
            explanation: this.generateDetailedExplanation(verificationResult, rating),

            // Context for decision-makers
            decision_guidance: {
                safe_to_publish: rating.light === 'GREEN',
                needs_modification: rating.light === 'YELLOW',
                must_remove: rating.light === 'RED',
                review_priority: rating.light === 'RED' ? 'URGENT' : rating.light === 'YELLOW' ? 'HIGH' : 'STANDARD'
            },

            // Improvement suggestions for YELLOW items
            improvement_suggestions: rating.light === 'YELLOW' ? level.required_fixes : null,

            // Evidence summary
            evidence_summary: this.generateEvidenceSummary(verificationResult)
        };
    }

    /**
     * Generate detailed explanation for why a statement received its traffic light rating
     */
    generateDetailedExplanation(verificationResult, rating) {
        const explanation = {
            summary: '',
            key_factors: [],
            evidence_analysis: '',
            source_assessment: '',
            specific_concerns: [],
            why_not_green: null,
            why_not_red: null
        };

        // Base explanation by traffic light color
        if (rating.light === 'GREEN') {
            explanation.summary = 'This statement received a GREEN light because it is factually accurate, well-sourced, and provides appropriate context for readers.';
            explanation.key_factors = [
                'Statement verified by authoritative sources',
                'Includes sufficient context to prevent misunderstanding',
                'Low risk of misleading audiences',
                'Sources are credible and current'
            ];
        }

        else if (rating.light === 'YELLOW') {
            explanation.summary = `This statement received a YELLOW light because it has ${rating.subcategory.toLowerCase()} issues that require attention before publication.`;

            // Specific explanations by subcategory
            switch (rating.subcategory) {
                case 'MISLEADING':
                    explanation.key_factors = [
                        'Statement is technically accurate but presentation could mislead',
                        'Missing context that would provide fuller picture',
                        'May lead audiences to incorrect conclusions',
                        'Risk of being taken out of context or misinterpreted'
                    ];
                    explanation.specific_concerns = verificationResult.misleading_factors || [
                        'Selective use of statistics',
                        'Cherry-picking favorable data points',
                        'Correlation presented as causation',
                        'Missing relevant counterinformation'
                    ];
                    explanation.why_not_green = 'Cannot be green due to misleading presentation despite factual accuracy';
                    explanation.why_not_red = 'Not red because the core facts are technically correct';
                    break;

                case 'INCOMPLETE':
                    explanation.key_factors = [
                        'Statement is factually correct but incomplete',
                        'Missing important context or qualifications',
                        'Could be misleading without additional information',
                        'Needs clarification of scope or limitations'
                    ];
                    explanation.specific_concerns = verificationResult.context_gaps || [
                        'Time frame not specified',
                        'Scope of applicability unclear',
                        'Important exceptions not mentioned',
                        'Comparative context missing'
                    ];
                    explanation.why_not_green = 'Lacks sufficient context to be fully accurate';
                    explanation.why_not_red = 'Core facts are correct, just needs more context';
                    break;

                case 'SPECULATIVE':
                    explanation.key_factors = [
                        'Statement involves future projections or estimates',
                        'Based on reasonable assumptions but uncertain outcomes',
                        'May not reflect actual future results',
                        'Needs qualifying language to indicate uncertainty'
                    ];
                    explanation.specific_concerns = [
                        'Future outcomes cannot be guaranteed',
                        'Based on current trends that may change',
                        'Estimates may have significant margin of error',
                        'External factors could affect projections'
                    ];
                    explanation.why_not_green = 'Future predictions cannot be definitively verified';
                    explanation.why_not_red = 'Based on reasonable analysis and credible sources';
                    break;

                case 'UNVERIFIABLE':
                    explanation.key_factors = [
                        'Cannot be confirmed with available authoritative sources',
                        'Sources may be insufficient or inaccessible',
                        'May be true but verification is not possible',
                        'Risk of being challenged without solid documentation'
                    ];
                    explanation.specific_concerns = [
                        'Primary sources not accessible',
                        'Conflicting information from different sources',
                        'Lack of official documentation',
                        'Information too recent for thorough verification'
                    ];
                    explanation.why_not_green = 'Cannot verify accuracy with credible sources';
                    explanation.why_not_red = 'No evidence that statement is false';
                    break;
            }
        }

        else if (rating.light === 'RED') {
            explanation.summary = `This statement received a RED light because it is ${rating.subcategory.toLowerCase()} and poses significant political risk if published.`;

            switch (rating.subcategory) {
                case 'FALSE':
                    explanation.key_factors = [
                        'Statement contradicted by authoritative sources',
                        'Factual claims are definitively incorrect',
                        'Could cause significant credibility damage',
                        'High risk of fact-checker corrections'
                    ];
                    explanation.specific_concerns = [
                        'Direct contradiction by government data',
                        'Multiple credible sources dispute claims',
                        'Easily verifiable as incorrect',
                        'Could become major campaign liability'
                    ];
                    explanation.why_not_green = 'Factually incorrect according to authoritative sources';
                    explanation.why_not_yellow = 'Too inaccurate to fix with context or disclaimers';
                    break;

                case 'CONTRADICTED':
                    explanation.key_factors = [
                        'Statement disputes well-established facts',
                        'Contradicted by multiple credible sources',
                        'Could invite fact-checker scrutiny',
                        'Risk of appearing uninformed or misleading'
                    ];
                    explanation.specific_concerns = [
                        'Goes against expert consensus',
                        'Contradicts official government position',
                        'Disputes documented historical events',
                        'Could be easily challenged by opponents'
                    ];
                    explanation.why_not_green = 'Contradicts established factual record';
                    explanation.why_not_yellow = 'Too problematic to salvage with modifications';
                    break;

                case 'HARMFUL':
                    explanation.key_factors = [
                        'Statement could cause significant political damage',
                        'High risk of negative media coverage',
                        'May alienate key voter groups',
                        'Could become campaign liability'
                    ];
                    explanation.specific_concerns = verificationResult.harm_factors || [
                        'Sensitive topic requiring careful handling',
                        'Could be taken out of context',
                        'May offend important constituencies',
                        'Risk of viral negative coverage'
                    ];
                    explanation.why_not_green = 'Too risky for publication without major revision';
                    explanation.why_not_yellow = 'Risk too high even with modifications';
                    break;
            }
        }

        // Add evidence analysis
        if (verificationResult.source_citations && verificationResult.source_citations.length > 0) {
            explanation.evidence_analysis = `Analysis based on ${verificationResult.source_citations.length} sources including ${verificationResult.source_citations.slice(0, 3).map(s => s.name || 'authoritative source').join(', ')}.`;
        } else {
            explanation.evidence_analysis = 'Analysis based on fact-checker assessment and available information.';
        }

        // Source assessment
        if (verificationResult.sources_verified) {
            explanation.source_assessment = 'Sources have been verified for credibility and relevance.';
        } else {
            explanation.source_assessment = 'Source verification in progress or completed with noted limitations.';
        }

        return explanation;
    }

    /**
     * Generate evidence summary showing what sources confirm or refute
     */
    generateEvidenceSummary(verificationResult) {
        const summary = {
            supporting_evidence: [],
            contradicting_evidence: [],
            neutral_context: [],
            source_quality: 'unknown'
        };

        // Analyze source citations if available
        if (verificationResult.source_citations) {
            verificationResult.source_citations.forEach(citation => {
                if (citation.supports_claim === true) {
                    summary.supporting_evidence.push({
                        source: citation.name || citation.organization,
                        finding: citation.relevant_finding,
                        reliability: citation.reliability_assessment || 'high'
                    });
                } else if (citation.supports_claim === false) {
                    summary.contradicting_evidence.push({
                        source: citation.name || citation.organization,
                        finding: citation.relevant_finding,
                        reliability: citation.reliability_assessment || 'high'
                    });
                } else {
                    summary.neutral_context.push({
                        source: citation.name || citation.organization,
                        context: citation.relevant_finding,
                        reliability: citation.reliability_assessment || 'medium'
                    });
                }
            });

            // Determine overall source quality
            const reliabilityCounts = verificationResult.source_citations.reduce((counts, citation) => {
                const reliability = citation.reliability_assessment || 'medium';
                counts[reliability] = (counts[reliability] || 0) + 1;
                return counts;
            }, {});

            if (reliabilityCounts.high > reliabilityCounts.medium + reliabilityCounts.low) {
                summary.source_quality = 'high';
            } else if (reliabilityCounts.medium > reliabilityCounts.low) {
                summary.source_quality = 'medium';
            } else {
                summary.source_quality = 'low';
            }
        }

        return summary;
    }
}

module.exports = new FactVerificationSystem();