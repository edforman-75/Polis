/**
 * Comprehensive Input Requirements for Effective Tone Evaluation
 * This defines all the data needed to accurately assess tone in political content
 */

module.exports = {
    // 1. CONTENT INPUTS (Required)
    contentInputs: {
        primaryText: {
            description: 'The actual content to analyze',
            required: true,
            example: 'Full text of statement, speech, email, etc.'
        },
        contentMetadata: {
            wordCount: 'Number of words',
            sentenceCount: 'Number of sentences',
            paragraphCount: 'Number of paragraphs',
            readingTime: 'Estimated reading/speaking time'
        }
    },

    // 2. CONTEXTUAL INPUTS (Critical for accuracy)
    contextualInputs: {
        assignmentType: {
            required: true,
            options: [
                'statement',        // Public statement
                'speech',          // Speech or remarks
                'press_release',   // Media communication
                'social_media',    // Social post
                'email',           // Email to supporters
                'fundraising',     // Fundraising appeal
                'debate',          // Debate response
                'op_ed',           // Opinion piece
                'talking_points',  // Surrogate guidance
                'interview'        // Media interview
            ],
            impact: 'Determines formality expectations and appropriate emotional range'
        },

        targetAudience: {
            required: true,
            options: {
                primary: [
                    'base_supporters',     // Core supporters
                    'swing_voters',        // Undecided/persuadable
                    'opposition_voters',   // Opposing party voters
                    'donors',             // Financial supporters
                    'media',              // Journalists/press
                    'general_public',     // Broad audience
                    'youth',              // Young voters (18-29)
                    'seniors',            // Older voters (65+)
                    'community_leaders',  // Local influencers
                    'party_officials'     // Party leadership
                ],
                secondary: 'Additional audiences who may see content'
            },
            impact: 'Determines appropriate emotional intensity and vocabulary complexity'
        },

        deliveryContext: {
            required: false,
            fields: {
                venue: 'Where content will be delivered (rally, town hall, TV, etc.)',
                timing: 'When in campaign cycle (early, primary, general, final week)',
                precedingEvents: 'Recent news or events affecting tone',
                competitiveContext: 'What opponents are saying/doing'
            },
            impact: 'Influences urgency level and rhetorical approach'
        },

        situationalContext: {
            required: false,
            options: [
                'normal_operations',    // Standard campaign communication
                'crisis_response',      // Responding to crisis/scandal
                'victory_moment',       // Celebrating win/endorsement
                'defensive_position',   // Addressing attacks
                'policy_rollout',      // Announcing new policy
                'coalition_building',  // Building partnerships
                'fundraising_deadline', // End of quarter push
                'debate_prep'          // Preparing for debate
            ],
            impact: 'Determines appropriate emotional tone and urgency'
        }
    },

    // 3. CAMPAIGN INPUTS (Strategic alignment)
    campaignInputs: {
        campaignPhase: {
            required: true,
            options: [
                'exploratory',      // Testing the waters
                'announcement',     // Launching campaign
                'introduction',     // Introducing candidate
                'primary',          // Primary election
                'general',          // General election
                'final_stretch',    // Last 30 days
                'gotv',            // Get out the vote
                'election_day'      // Day of election
            ],
            impact: 'Affects appropriate intensity and messaging focus'
        },

        campaignTheme: {
            required: false,
            examples: [
                'Change',
                'Experience',
                'Unity',
                'Fighting for you',
                'Restoring values',
                'Building back better'
            ],
            impact: 'Should be reflected in tone and word choice'
        },

        messagingPillars: {
            required: false,
            description: 'Core campaign messages that should be reinforced',
            example: ['Economic opportunity', 'Healthcare access', 'Education reform'],
            impact: 'Tone should support these themes'
        }
    },

    // 4. CANDIDATE PROFILE (For consistency)
    candidateProfile: {
        personalityTraits: {
            required: true,
            examples: {
                authentic_style: 'folksy | professional | academic | passionate',
                energy_level: 'high-energy | measured | calm | intense',
                humor_usage: 'frequent | occasional | rare | never',
                formality_preference: 'formal | balanced | informal'
            },
            impact: 'Ensures tone matches candidate personality'
        },

        demographicFactors: {
            required: false,
            fields: {
                age: 'Affects generational references and energy expectations',
                gender: 'May influence tone expectations and language choices',
                background: 'Military/Business/Academic affects vocabulary',
                region: 'Regional speech patterns and colloquialisms'
            },
            impact: 'Influences authentic voice characteristics'
        },

        speechPatterns: {
            required: false,
            fields: {
                signature_phrases: ['Key phrases candidate often uses'],
                vocabulary_level: 'Simple | Moderate | Complex',
                sentence_structure: 'Short and punchy | Balanced | Complex',
                rhetorical_devices: ['Repetition', 'Alliteration', 'Rule of three']
            },
            impact: 'Maintains consistent voice'
        },

        historicalTone: {
            required: false,
            description: 'Analysis of candidate\'s previous content',
            fields: {
                successful_examples: 'Content that resonated well',
                unsuccessful_examples: 'Content that fell flat',
                evolution: 'How tone has evolved over time'
            },
            impact: 'Learns from past performance'
        }
    },

    // 5. BRIEF/ASSIGNMENT INPUTS (Specific requirements)
    briefInputs: {
        emotionalTone: {
            required: true,
            options: [
                'inspiring',      // Uplift and motivate
                'serious',        // Grave and thoughtful
                'urgent',         // Call to immediate action
                'reassuring',     // Calm and confident
                'combative',      // Fighting stance
                'empathetic',     // Understanding and caring
                'celebratory',    // Victory and achievement
                'determined',     // Resolute and focused
                'conversational', // Casual and approachable
                'presidential'    // Authoritative and dignified
            ],
            impact: 'Primary tone directive'
        },

        keyMessages: {
            required: false,
            description: 'Specific points that must be conveyed',
            example: ['Tax plan helps middle class', 'Opponent wrong on healthcare'],
            impact: 'Tone should support these messages'
        },

        avoidanceList: {
            required: false,
            description: 'Topics or tones to avoid',
            example: ['Don\'t sound defensive about X', 'Avoid mentioning Y'],
            impact: 'Prevents tone mistakes'
        },

        successMetrics: {
            required: false,
            description: 'What successful tone looks like for this piece',
            example: {
                primary_goal: 'Energize base voters',
                secondary_goal: 'Appear strong on issue',
                avoid: 'Seeming out of touch'
            },
            impact: 'Defines evaluation criteria'
        }
    },

    // 6. COMPARATIVE INPUTS (For relative assessment)
    comparativeInputs: {
        opponentTone: {
            required: false,
            description: 'How opponents are speaking about same issue',
            fields: {
                opponent_approach: 'Aggressive | Defensive | Ignoring',
                tone_contrast_needed: 'Should we contrast or match?',
                differentiation_points: 'How to stand out'
            },
            impact: 'Helps position tone strategically'
        },

        mediaFraming: {
            required: false,
            description: 'How media is covering the issue',
            fields: {
                current_narrative: 'Prevailing media story',
                tone_expectations: 'What media expects to hear',
                potential_headlines: 'How this might be reported'
            },
            impact: 'Shapes tone for media consumption'
        },

        publicSentiment: {
            required: false,
            description: 'Current public mood on issue',
            fields: {
                polling_data: 'Support/oppose percentages',
                emotional_state: 'Angry | Worried | Hopeful | Apathetic',
                sensitivity_level: 'How carefully to tread'
            },
            impact: 'Calibrates emotional intensity'
        }
    },

    // 7. TECHNICAL INPUTS (For analysis accuracy)
    technicalInputs: {
        languageMetrics: {
            required: false,
            automated: true,
            fields: {
                sentiment_scores: 'Positive/negative/neutral percentages',
                emotion_detection: 'Joy/anger/fear/surprise percentages',
                readability_scores: 'Flesch-Kincaid, SMOG, etc.',
                complexity_analysis: 'Vocabulary and sentence complexity'
            },
            impact: 'Provides objective baseline'
        },

        linguisticFeatures: {
            required: false,
            automated: true,
            fields: {
                pos_tagging: 'Parts of speech distribution',
                dependency_parsing: 'Grammatical structure analysis',
                entity_recognition: 'People, places, organizations mentioned',
                keyword_extraction: 'Most important terms'
            },
            impact: 'Deep linguistic understanding'
        }
    },

    // 8. FEEDBACK LOOPS (For continuous improvement)
    feedbackInputs: {
        performanceHistory: {
            required: false,
            description: 'How similar content has performed',
            fields: {
                engagement_metrics: 'Opens, clicks, shares, comments',
                sentiment_response: 'Positive/negative reactions',
                media_pickup: 'How media reported it',
                opposition_response: 'How opponents responded'
            },
            impact: 'Learns what works'
        },

        focusGroupData: {
            required: false,
            description: 'Qualitative feedback on tone',
            fields: {
                dial_test_results: 'Real-time response to tone',
                memorable_phrases: 'What stuck with people',
                emotional_response: 'How it made them feel',
                authenticity_rating: 'Did it sound genuine?'
            },
            impact: 'Validates tone choices'
        },

        expertReview: {
            required: false,
            description: 'Input from communication professionals',
            fields: {
                speechwriter_notes: 'Professional tone assessment',
                consultant_feedback: 'Strategic tone guidance',
                historian_perspective: 'Historical precedents'
            },
            impact: 'Professional calibration'
        }
    },

    // MINIMUM VIABLE INPUTS for basic tone evaluation
    minimumRequirements: {
        essential: [
            'primaryText',         // The content itself
            'assignmentType',      // What kind of content
            'targetAudience',      // Who it's for
            'campaignPhase',       // When in campaign
            'emotionalTone'        // Desired tone
        ],
        recommended: [
            'situationalContext',  // Current situation
            'candidateProfile',    // For consistency
            'keyMessages',         // Core points
            'publicSentiment'      // Mood to match
        ],
        optimal: [
            'All of the above plus:',
            'opponentTone',        // For differentiation
            'mediaFraming',        // For headlines
            'performanceHistory',  // For learning
            'focusGroupData'       // For validation
        ]
    },

    // TONE EVALUATION FORMULA
    evaluationWeights: {
        contextAlignment: 0.25,      // Does tone match context?
        audienceResonance: 0.20,     // Will audience respond well?
        candidateAuthenticity: 0.20, // Does it sound like candidate?
        messageSupport: 0.15,        // Does tone support message?
        emotionalAppropriateness: 0.10, // Is emotional level right?
        technicalExecution: 0.10     // Grammar, readability, etc.
    }
};