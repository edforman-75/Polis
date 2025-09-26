/**
 * Brief Questionnaires for Assignment Creation
 * These questionnaires are filled out when assignments are created and provide templates for writers
 */

const briefQuestionnaires = {

    // Political Statement Brief Questionnaire
    statement: {
        title: "Political Statement Brief",
        description: "Comprehensive brief for creating effective political written statements",
        sections: [
            {
                section: "Basic Information",
                fields: [
                    {
                        id: "statement_purpose",
                        label: "Statement Purpose",
                        type: "select",
                        required: true,
                        options: [
                            "Response to Breaking News",
                            "Policy Position Announcement",
                            "Crisis Response/Damage Control",
                            "Opposition Attack Response",
                            "Proactive Issue Messaging",
                            "Event Statement",
                            "Endorsement Response"
                        ],
                        helpText: "Primary reason for issuing this statement"
                    },
                    {
                        id: "urgency_level",
                        label: "Urgency Level",
                        type: "select",
                        required: true,
                        options: [
                            "Standard (24-48 hour timeline)",
                            "Expedited (Same day response needed)",
                            "Critical (Within hours - breaking news)"
                        ]
                    },
                    {
                        id: "target_audience",
                        label: "Primary Target Audience",
                        type: "checkbox",
                        required: true,
                        options: [
                            "General Public/Voters",
                            "Media/Press",
                            "Party Activists",
                            "Donors and Supporters",
                            "Opposition/Critics",
                            "Issue-specific Stakeholders",
                            "Local Community Leaders"
                        ]
                    },
                    {
                        id: "distribution_channels",
                        label: "Planned Distribution Channels",
                        type: "checkbox",
                        options: [
                            "Press Release",
                            "Social Media",
                            "Campaign Website",
                            "Email to Supporters",
                            "Media Interviews",
                            "Surrogates/Spokespersons",
                            "Paid Advertising"
                        ]
                    }
                ]
            },
            {
                section: "Content Strategy",
                fields: [
                    {
                        id: "main_message",
                        label: "Core Message (One sentence)",
                        type: "textarea",
                        required: true,
                        maxLength: 200,
                        helpText: "The single most important point you want to communicate"
                    },
                    {
                        id: "key_points",
                        label: "Key Supporting Points (3-5 bullets)",
                        type: "textarea",
                        required: true,
                        helpText: "Main arguments, evidence, or facts that support your core message"
                    },
                    {
                        id: "desired_outcome",
                        label: "Desired Outcome",
                        type: "textarea",
                        required: true,
                        helpText: "What do you want to happen as a result of this statement?"
                    },
                    {
                        id: "emotional_tone",
                        label: "Emotional Tone",
                        type: "select",
                        required: true,
                        options: [
                            "Measured and Diplomatic",
                            "Strong and Forceful",
                            "Compassionate and Understanding",
                            "Confident and Authoritative",
                            "Urgent and Concerned",
                            "Optimistic and Forward-Looking",
                            "Defensive but Respectful"
                        ]
                    }
                ]
            },
            {
                section: "Context and Background",
                fields: [
                    {
                        id: "background_context",
                        label: "Background Context",
                        type: "textarea",
                        required: true,
                        helpText: "What led to this need for a statement? Provide relevant background."
                    },
                    {
                        id: "opposition_position",
                        label: "Opposition/Critic Positions",
                        type: "textarea",
                        helpText: "What are opponents saying? What attacks do we need to address?"
                    },
                    {
                        id: "stakeholder_interests",
                        label: "Key Stakeholder Interests",
                        type: "textarea",
                        helpText: "Who cares about this issue and what are their specific concerns?"
                    },
                    {
                        id: "timing_considerations",
                        label: "Timing Considerations",
                        type: "textarea",
                        helpText: "Why now? Are there deadlines, events, or news cycles to consider?"
                    }
                ]
            },
            {
                section: "Supporting Evidence",
                fields: [
                    {
                        id: "facts_statistics",
                        label: "Key Facts and Statistics",
                        type: "textarea",
                        helpText: "Specific data points, statistics, or factual claims to include"
                    },
                    {
                        id: "expert_quotes",
                        label: "Expert Sources/Quotes",
                        type: "textarea",
                        helpText: "Credible third-party voices, studies, or endorsements to reference"
                    },
                    {
                        id: "local_examples",
                        label: "Local Examples/Impact",
                        type: "textarea",
                        helpText: "How does this issue affect local communities? Specific examples."
                    },
                    {
                        id: "success_stories",
                        label: "Success Stories/Track Record",
                        type: "textarea",
                        helpText: "Past achievements or examples that support your position"
                    }
                ]
            },
            {
                section: "Messaging Guidelines",
                fields: [
                    {
                        id: "must_include",
                        label: "Must Include Elements",
                        type: "textarea",
                        helpText: "Specific phrases, positions, or points that must be included"
                    },
                    {
                        id: "avoid_language",
                        label: "Language to Avoid",
                        type: "textarea",
                        helpText: "Words, phrases, or topics to avoid for legal, strategic, or political reasons"
                    },
                    {
                        id: "brand_voice",
                        label: "Candidate Voice/Brand",
                        type: "select",
                        options: [
                            "Plain-spoken and Direct",
                            "Policy Expert/Wonk",
                            "Outsider/Change Agent",
                            "Experienced Leader",
                            "Community Advocate",
                            "Fighter/Warrior",
                            "Unifier/Bridge-builder"
                        ]
                    },
                    {
                        id: "length_guidelines",
                        label: "Length Guidelines",
                        type: "select",
                        options: [
                            "Brief (1-2 paragraphs, social media friendly)",
                            "Standard (3-4 paragraphs, typical press statement)",
                            "Comprehensive (5+ paragraphs, detailed policy statement)",
                            "Variable (depends on content needs)"
                        ]
                    }
                ]
            },
            {
                section: "Approval and Review",
                fields: [
                    {
                        id: "review_stakeholders",
                        label: "Required Reviewers",
                        type: "checkbox",
                        options: [
                            "Communications Director",
                            "Campaign Manager",
                            "Policy Director",
                            "Legal Counsel",
                            "Candidate",
                            "Senior Staff",
                            "Issue Experts"
                        ]
                    },
                    {
                        id: "approval_deadline",
                        label: "Final Approval Needed By",
                        type: "datetime-local",
                        helpText: "When must this statement be finalized and approved?"
                    },
                    {
                        id: "release_timing",
                        label: "Planned Release Time",
                        type: "datetime-local",
                        helpText: "When will this statement be released to the public?"
                    },
                    {
                        id: "follow_up_actions",
                        label: "Follow-up Actions Required",
                        type: "textarea",
                        helpText: "What happens after statement release? Media availability? Social media push?"
                    }
                ]
            }
        ],
        template_structure: {
            opening: "Strong opening that frames the issue and positions candidate",
            body: "2-3 paragraphs with evidence, examples, and key messaging points",
            action_call: "Clear next steps or call to action",
            conclusion: "Memorable closing that reinforces core message"
        }
    },

    // Daily Talking Points Brief Questionnaire
    talking_points_daily: {
        title: "Daily Talking Points Brief",
        description: "Standard daily talking points for surrogates and staff",
        sections: [
            {
                section: "Daily Focus",
                fields: [
                    {
                        id: "date_valid",
                        label: "Valid Date",
                        type: "date",
                        required: true
                    },
                    {
                        id: "message_of_day",
                        label: "Message of the Day",
                        type: "textarea",
                        required: true,
                        maxLength: 150,
                        helpText: "Single sentence capturing main campaign message everyone should reinforce today"
                    },
                    {
                        id: "distribution_tiers",
                        label: "Distribution Tiers",
                        type: "checkbox",
                        required: true,
                        options: [
                            "Tier 1: Principal Surrogates (Elected officials, family, celebrities)",
                            "Tier 2: Official Surrogates (Campaign staff, party officials)",
                            "Tier 3: Volunteer Surrogates (Activists, donors, grassroots)",
                            "Tier 4: Allied Organizations (Endorsing groups, unions)"
                        ]
                    }
                ]
            },
            {
                section: "Priority Messages",
                fields: [
                    {
                        id: "primary_focus",
                        label: "Primary Focus",
                        type: "textarea",
                        required: true,
                        helpText: "Main story or initiative to push today"
                    },
                    {
                        id: "secondary_message",
                        label: "Secondary Message",
                        type: "textarea",
                        helpText: "Supporting theme or policy area"
                    },
                    {
                        id: "defensive_position",
                        label: "Defensive Position",
                        type: "textarea",
                        helpText: "Response to opposition attacks (if applicable)"
                    }
                ]
            },
            {
                section: "Context and Strategy",
                fields: [
                    {
                        id: "news_context",
                        label: "News Context",
                        type: "textarea",
                        helpText: "What's happening in the news cycle that impacts messaging?"
                    },
                    {
                        id: "opponent_activities",
                        label: "Opponent Activities",
                        type: "textarea",
                        helpText: "What is the opposition doing that we need to respond to or counter?"
                    },
                    {
                        id: "campaign_events",
                        label: "Campaign Events Today",
                        type: "textarea",
                        helpText: "Events, appearances, or activities that should be coordinated with messaging"
                    },
                    {
                        id: "local_angles",
                        label: "Local Angles/Data",
                        type: "textarea",
                        helpText: "Specific local statistics, examples, or community impacts"
                    }
                ]
            },
            {
                section: "Opposition Response",
                fields: [
                    {
                        id: "likely_attacks",
                        label: "Likely Opposition Attacks",
                        type: "textarea",
                        helpText: "What attacks are opponents likely to make today?"
                    },
                    {
                        id: "pivot_strategies",
                        label: "Pivot Strategies",
                        type: "textarea",
                        required: true,
                        helpText: "How to redirect negative conversations back to positive messaging"
                    },
                    {
                        id: "do_not_say",
                        label: "Do Not Say/Avoid",
                        type: "textarea",
                        helpText: "Words, phrases, topics to avoid for legal, strategic, or political reasons"
                    }
                ]
            }
        ],
        template_structure: {
            header: "Classification, date, distribution timing",
            motd: "Single memorable sentence for all spokespersons",
            priorities: "2-3 priority messages maximum",
            quick_hitters: "5-7 sound bites for media and social",
            detailed_points: "Policy-specific talking points with examples",
            opposition_response: "Defensive strategies and pivot language",
            restrictions: "What not to say or discuss"
        }
    },

    // Crisis Response Talking Points Brief
    talking_points_crisis: {
        title: "Crisis Response Talking Points Brief",
        description: "Urgent reactive messaging for breaking news or crisis situations",
        sections: [
            {
                section: "Crisis Details",
                fields: [
                    {
                        id: "crisis_type",
                        label: "Crisis Type",
                        type: "select",
                        required: true,
                        options: [
                            "Opposition Attack",
                            "Breaking News Response",
                            "Internal Campaign Issue",
                            "External Crisis/Disaster",
                            "Media Controversy",
                            "Social Media Crisis",
                            "Legal/Ethical Issue"
                        ]
                    },
                    {
                        id: "urgency_level",
                        label: "Response Urgency",
                        type: "select",
                        required: true,
                        options: [
                            "Immediate (Within 1 hour)",
                            "Same Day (Within 6 hours)",
                            "Next Day (Within 24 hours)"
                        ]
                    },
                    {
                        id: "crisis_description",
                        label: "Crisis Description",
                        type: "textarea",
                        required: true,
                        helpText: "What exactly happened? Provide factual, objective description."
                    }
                ]
            },
            {
                section: "Response Strategy",
                fields: [
                    {
                        id: "response_approach",
                        label: "Response Approach",
                        type: "select",
                        required: true,
                        options: [
                            "Direct Refutation - Deny and Counter-attack",
                            "Acknowledge and Redirect - Admit issue, pivot to solutions",
                            "Ignore and Pivot - Don't engage, focus on positive",
                            "Clarify and Explain - Provide context and explanation",
                            "Take Responsibility - Accept fault and outline corrective action"
                        ]
                    },
                    {
                        id: "core_response",
                        label: "Core Response Message",
                        type: "textarea",
                        required: true,
                        maxLength: 200,
                        helpText: "The exact message every spokesperson should deliver"
                    },
                    {
                        id: "pivot_message",
                        label: "Pivot to Positive",
                        type: "textarea",
                        required: true,
                        helpText: "How to redirect conversation to positive territory"
                    }
                ]
            },
            {
                section: "Supporting Information",
                fields: [
                    {
                        id: "factual_context",
                        label: "Factual Context",
                        type: "textarea",
                        helpText: "Background facts that support our position"
                    },
                    {
                        id: "third_party_support",
                        label: "Third-Party Support",
                        type: "textarea",
                        helpText: "Allies, experts, or validators who support our position"
                    },
                    {
                        id: "evidence_rebuttal",
                        label: "Evidence for Rebuttal",
                        type: "textarea",
                        helpText: "Facts, data, or evidence that counter the crisis narrative"
                    }
                ]
            },
            {
                section: "Restrictions and Guidelines",
                fields: [
                    {
                        id: "legal_restrictions",
                        label: "Legal Restrictions",
                        type: "textarea",
                        helpText: "Legal counsel guidance on what cannot be said"
                    },
                    {
                        id: "escalation_triggers",
                        label: "When to Escalate",
                        type: "textarea",
                        helpText: "What questions or situations require escalation to senior staff"
                    },
                    {
                        id: "media_strategy",
                        label: "Media Engagement Strategy",
                        type: "select",
                        options: [
                            "Proactive Media Outreach",
                            "Reactive Only - Respond to Inquiries",
                            "Limited Availability",
                            "No Comment Strategy",
                            "Designated Spokesperson Only"
                        ]
                    }
                ]
            }
        ],
        template_structure: {
            immediate_response: "Exact language to use in first response",
            context: "Background information if pressed",
            pivot_strategy: "How to redirect to positive messaging",
            restrictions: "What not to discuss or speculate about",
            escalation: "When to refer questions to designated spokesperson"
        }
    },

    // Event-Specific Talking Points Brief
    talking_points_event: {
        title: "Event-Specific Talking Points Brief",
        description: "Customized messaging for specific events, appearances, or occasions",
        sections: [
            {
                section: "Event Information",
                fields: [
                    {
                        id: "event_name",
                        label: "Event Name",
                        type: "text",
                        required: true
                    },
                    {
                        id: "event_date",
                        label: "Event Date",
                        type: "datetime-local",
                        required: true
                    },
                    {
                        id: "event_location",
                        label: "Event Location",
                        type: "text",
                        required: true
                    },
                    {
                        id: "event_type",
                        label: "Event Type",
                        type: "select",
                        required: true,
                        options: [
                            "Town Hall",
                            "Press Conference",
                            "Rally/Campaign Event",
                            "Policy Announcement",
                            "Community Forum",
                            "Debate/Panel",
                            "Fundraiser",
                            "Endorsement Event"
                        ]
                    },
                    {
                        id: "audience_profile",
                        label: "Audience Profile",
                        type: "textarea",
                        required: true,
                        helpText: "Who will be attending? Demographics, interests, concerns."
                    }
                ]
            },
            {
                section: "Event Messaging",
                fields: [
                    {
                        id: "event_theme",
                        label: "Event Theme/Focus",
                        type: "textarea",
                        required: true,
                        helpText: "Main topic or theme for this event"
                    },
                    {
                        id: "key_announcements",
                        label: "Key Announcements",
                        type: "textarea",
                        helpText: "New policies, endorsements, or announcements to be made"
                    },
                    {
                        id: "local_connections",
                        label: "Local Connections",
                        type: "textarea",
                        required: true,
                        helpText: "How does your message connect to this specific community/location?"
                    },
                    {
                        id: "audience_concerns",
                        label: "Audience-Specific Concerns",
                        type: "textarea",
                        helpText: "What issues matter most to this particular audience?"
                    }
                ]
            },
            {
                section: "Pre-Event Messaging",
                fields: [
                    {
                        id: "pre_event_media",
                        label: "Pre-Event Media Points",
                        type: "textarea",
                        helpText: "Talking points for media availabilities before the event"
                    },
                    {
                        id: "arrival_messaging",
                        label: "Arrival/Setup Messaging",
                        type: "textarea",
                        helpText: "Brief comments for media during arrival or setup"
                    }
                ]
            },
            {
                section: "During Event",
                fields: [
                    {
                        id: "opening_remarks",
                        label: "Opening Remarks Key Points",
                        type: "textarea",
                        helpText: "Main points to cover in opening/prepared remarks"
                    },
                    {
                        id: "qa_preparation",
                        label: "Q&A Preparation",
                        type: "textarea",
                        helpText: "Likely questions and suggested responses"
                    },
                    {
                        id: "local_endorsers",
                        label: "Local Endorsers/Supporters",
                        type: "textarea",
                        helpText: "Key local supporters to recognize or reference"
                    }
                ]
            },
            {
                section: "Post-Event",
                fields: [
                    {
                        id: "post_event_media",
                        label: "Post-Event Media Points",
                        type: "textarea",
                        helpText: "Key takeaways to emphasize in post-event interviews"
                    },
                    {
                        id: "social_media_content",
                        label: "Social Media Content",
                        type: "textarea",
                        helpText: "Suggested social media posts about the event"
                    },
                    {
                        id: "follow_up_commitments",
                        label: "Follow-up Commitments",
                        type: "textarea",
                        helpText: "Any commitments made during event that need follow-up"
                    }
                ]
            }
        ],
        template_structure: {
            pre_event: "Media availability talking points",
            event_focus: "Main messaging during event",
            local_angles: "Community-specific points and examples",
            qa_prep: "Likely questions and responses",
            post_event: "Key takeaways for follow-up media"
        }
    }
};

module.exports = briefQuestionnaires;