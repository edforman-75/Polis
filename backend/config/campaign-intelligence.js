// CAMPAIGN INTELLIGENCE MODULE
// All sensitive campaign data and strategies are kept server-side only
// This file should NEVER be exposed to the client

module.exports = {
    // Campaign messaging strategies
    messagingFrameworks: {
        veterans: {
            primaryThemes: [
                'Service and sacrifice',
                'Community support',
                'Healthcare access',
                'Job opportunities',
                'Mental health resources'
            ],
            emotionalTriggers: [
                'Pride in service',
                'Belonging and brotherhood',
                'Recognition and respect',
                'Security for families'
            ],
            avoidTopics: [
                'Partisan military decisions',
                'Specific combat operations',
                'Individual medical details'
            ]
        },

        healthcare: {
            primaryThemes: [
                'Affordable access',
                'Quality of care',
                'Preventive services',
                'Mental health parity',
                'Prescription drug costs'
            ],
            targetAudiences: {
                seniors: ['Medicare improvements', 'Drug pricing', 'Home care'],
                families: ['Children\'s health', 'Maternal care', 'Insurance coverage'],
                workers: ['Employer coverage', 'Job flexibility', 'Sick leave']
            }
        },

        economy: {
            primaryThemes: [
                'Job creation',
                'Small business support',
                'Fair wages',
                'Worker protections',
                'Infrastructure investment'
            ],
            regionalFocus: {
                urban: ['Tech jobs', 'Public transit', 'Affordable housing'],
                suburban: ['School funding', 'Property taxes', 'Commute times'],
                rural: ['Agriculture support', 'Broadband access', 'Main street revival']
            }
        }
    },

    // Platform-specific content optimization
    platformStrategies: {
        twitter: {
            maxLength: 280,
            threadStrategy: true,
            hashtagLimit: 2,
            optimalPostTime: ['9am', '12pm', '5pm', '8pm'],
            engagement: {
                replyQuickly: true,
                quoteRetweet: true,
                usePolls: true
            }
        },

        facebook: {
            optimalLength: 400,
            useImages: true,
            targetedAds: true,
            groupEngagement: ['Veterans groups', 'Local community', 'Issue-based groups'],
            videoStrategy: {
                liveStreams: true,
                shortForm: true,
                testimonials: true
            }
        },

        instagram: {
            visualFirst: true,
            stories: true,
            reels: true,
            hashtagLimit: 10,
            aesthetics: 'Authentic, community-focused, behind-the-scenes'
        },

        email: {
            segmentation: true,
            personalization: true,
            optimalLength: 150,
            callToAction: 'Always include clear CTA',
            subjectLineFormulas: [
                'Urgency + Personal',
                'Question + Benefit',
                'Number + Value'
            ]
        }
    },

    // Content tone and voice guidelines
    voiceGuidelines: {
        tone: 'Empathetic, confident, solutions-focused',
        readingLevel: 'Grade 8-10',
        sentenceStructure: 'Mix short and medium, avoid complex',
        personalPronouns: 'Use "we" and "our" for unity',
        activeVoice: true,

        emotionalFramework: {
            hope: 'Future-focused positive change',
            urgency: 'Time-sensitive but not alarmist',
            empowerment: 'You can make a difference',
            community: 'We\'re in this together'
        }
    },

    // Opposition research and response
    oppositionResponse: {
        attackVectors: {
            policy: 'Redirect to positive alternative',
            personal: 'Stay above, focus on issues',
            record: 'Context and accomplishments'
        },

        rapidResponse: {
            timeframe: '2 hours max',
            approval: 'Communications director',
            channels: ['Twitter first', 'Email supporters', 'Press release']
        },

        prebuttals: {
            anticipate: true,
            preemptiveFraming: true,
            strengthsMessaging: true
        }
    },

    // Audience segmentation
    audienceSegments: {
        baseVoters: {
            messaging: 'Reinforce and mobilize',
            frequency: 'High',
            channels: ['Email', 'Text', 'Social']
        },

        persuadableVoters: {
            messaging: 'Issue-focused, testimonials',
            frequency: 'Medium',
            channels: ['Facebook', 'Direct mail', 'Targeted ads']
        },

        oppositionVoters: {
            messaging: 'Common ground issues only',
            frequency: 'Low',
            channels: ['Broad media', 'Community events']
        },

        newVoters: {
            messaging: 'Education and empowerment',
            frequency: 'Medium-High',
            channels: ['Instagram', 'TikTok', 'Campus outreach']
        }
    },

    // Compliance and legal guidelines
    compliance: {
        disclaimers: {
            political: 'Paid for by [Campaign Committee]',
            nonprofit: '501(c)(4) regulations apply',
            coordination: 'No coordination with candidate'
        },

        recordKeeping: {
            donations: true,
            expenses: true,
            communications: true
        },

        ethicalGuidelines: [
            'Truthfulness in all communications',
            'Respect for all individuals',
            'Transparency in funding',
            'Privacy protection'
        ]
    },

    // AI prompting strategies
    aiPromptTemplates: {
        policyBrief: `You are a policy advisor. Create a brief on [TOPIC] that:
            - Uses grade 8-10 reading level
            - Focuses on local impact
            - Includes 2-3 specific examples
            - Ends with clear action items
            - Maintains hopeful, solutions-focused tone`,

        socialPost: `Create a social media post about [TOPIC] that:
            - Fits platform constraints
            - Uses emotional hook
            - Includes call-to-action
            - Avoids partisan triggers
            - Emphasizes community benefit`,

        speechDraft: `Draft remarks about [TOPIC] that:
            - Opens with personal story
            - Connects to audience values
            - Provides 3 clear points
            - Includes memorable soundbite
            - Closes with vision for future`,

        responseStatement: `Respond to [ISSUE] by:
            - Acknowledging concern respectfully
            - Redirecting to our strengths
            - Providing factual context
            - Offering positive alternative
            - Maintaining dignified tone`
    },

    // Performance metrics
    successMetrics: {
        engagement: {
            minClickRate: 0.02,
            minOpenRate: 0.20,
            minShareRate: 0.01
        },

        conversion: {
            emailSignup: 0.05,
            donation: 0.02,
            volunteer: 0.01
        },

        reach: {
            organic: 'Maximize through timing',
            paid: 'Target efficiently',
            earned: 'News coverage multiplier'
        }
    },

    // Security protocols
    security: {
        dataHandling: 'All PII encrypted',
        accessControl: 'Role-based permissions',
        audit: 'All actions logged',
        backup: 'Daily encrypted backups',
        breach: 'Immediate notification protocol'
    }
};