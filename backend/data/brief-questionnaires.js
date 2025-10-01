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
    },

    // Press Release Brief Questionnaire
    press_release: {
        title: "Press Release Brief",
        description: "Comprehensive brief for creating effective press releases across all campaign scenarios",
        sections: [
            {
                section: "Press Release Type & Category",
                fields: [
                    {
                        id: "press_release_category",
                        label: "Press Release Category",
                        type: "select",
                        required: true,
                        options: [
                            "Campaign Announcements",
                            "Policy Positions",
                            "Event Coverage",
                            "Response & Reaction",
                            "Crisis Management",
                            "Coalition & Endorsements",
                            "Community Engagement"
                        ],
                        helpText: "Primary category for this press release"
                    },
                    {
                        id: "press_release_type",
                        label: "Specific Press Release Type",
                        type: "select",
                        required: true,
                        options: [
                            // Campaign Announcements
                            "Campaign Launch",
                            "Candidacy Declaration",
                            "Campaign Milestone",
                            "Fundraising Announcement",
                            "Staff Announcement",
                            "Campaign Schedule/Tour",
                            // Policy Positions
                            "Policy Platform Release",
                            "Issue Position Statement",
                            "Legislative Proposal",
                            "Voting Record Clarification",
                            "Research/Study Release",
                            // Event Coverage
                            "Event Announcement",
                            "Pre-Event Preview",
                            "Post-Event Summary",
                            "Speech Highlights",
                            "Town Hall Results",
                            // Response & Reaction
                            "Breaking News Response",
                            "Opponent Attack Response",
                            "Third-Party Statement Response",
                            "Media Correction",
                            "Clarification Statement",
                            // Crisis Management
                            "Crisis Response",
                            "Damage Control",
                            "Apology/Correction",
                            "Legal Statement",
                            // Coalition & Endorsements
                            "Endorsement Announcement",
                            "Coalition Formation",
                            "Community Leader Support",
                            "Labor Union Endorsement",
                            "Organization Partnership",
                            // Community Engagement
                            "Community Initiative",
                            "Local Issue Response",
                            "Constituent Services",
                            "Community Event Participation"
                        ],
                        helpText: "Specific type within the selected category"
                    },
                    {
                        id: "timing_classification",
                        label: "Timing Classification",
                        type: "select",
                        required: true,
                        options: [
                            "Immediate Release",
                            "Scheduled Release",
                            "Embargoed Release",
                            "Hold for Release"
                        ]
                    },
                    {
                        id: "embargo_details",
                        label: "Embargo Details",
                        type: "textarea",
                        helpText: "If embargoed, specify exact date, time, and any special conditions"
                    }
                ]
            },
            {
                section: "Core Message & Objectives",
                fields: [
                    {
                        id: "primary_objective",
                        label: "Primary Objective",
                        type: "select",
                        required: true,
                        options: [
                            "Increase Name Recognition",
                            "Position on Issues",
                            "Respond to Attacks",
                            "Generate Media Coverage",
                            "Mobilize Supporters",
                            "Attract New Voters",
                            "Fundraising Support",
                            "Coalition Building",
                            "Damage Control",
                            "Momentum Building"
                        ]
                    },
                    {
                        id: "headline_strategy",
                        label: "Headline Strategy",
                        type: "textarea",
                        required: true,
                        maxLength: 200,
                        helpText: "Draft headline or key message for the press release"
                    },
                    {
                        id: "core_message",
                        label: "Core Message (25 words or less)",
                        type: "textarea",
                        required: true,
                        maxLength: 150,
                        helpText: "The essential message in one concise sentence"
                    },
                    {
                        id: "supporting_points",
                        label: "Key Supporting Points",
                        type: "textarea",
                        required: true,
                        helpText: "3-5 main points that support the core message"
                    },
                    {
                        id: "desired_coverage",
                        label: "Desired Media Coverage",
                        type: "textarea",
                        helpText: "What angle or story do you want media to tell?"
                    }
                ]
            },
            {
                section: "Target Audience & Distribution",
                fields: [
                    {
                        id: "primary_audience",
                        label: "Primary Target Audience",
                        type: "checkbox",
                        required: true,
                        options: [
                            "General Public/All Voters",
                            "Base Voters/Partisans",
                            "Swing/Independent Voters",
                            "Issue-Specific Communities",
                            "Local/Regional Media",
                            "National Media",
                            "Political Reporters",
                            "Donors and Fundraisers",
                            "Party Officials/Electeds",
                            "Community Leaders",
                            "Interest Groups/Advocacy Orgs"
                        ]
                    },
                    {
                        id: "geographic_focus",
                        label: "Geographic Focus",
                        type: "select",
                        required: true,
                        options: [
                            "Statewide/District-wide",
                            "Major Metro Areas",
                            "Specific Cities/Counties",
                            "Rural Communities",
                            "Suburban Areas",
                            "National Reach",
                            "Regional Focus"
                        ]
                    },
                    {
                        id: "distribution_strategy",
                        label: "Distribution Strategy",
                        type: "checkbox",
                        required: true,
                        options: [
                            "Statewide Media List",
                            "Targeted Beat Reporters",
                            "Wire Services (AP, Reuters)",
                            "Local TV Stations",
                            "Radio Stations",
                            "Digital/Online Media",
                            "Political Trade Publications",
                            "Specialty/Niche Publications",
                            "Social Media Amplification",
                            "Email to Supporter List",
                            "Website Publication"
                        ]
                    },
                    {
                        id: "timing_strategy",
                        label: "Release Timing Strategy",
                        type: "select",
                        options: [
                            "Morning Release (6-9 AM)",
                            "Mid-Morning (9-11 AM)",
                            "Pre-Lunch (11 AM-12 PM)",
                            "Afternoon (1-3 PM)",
                            "Late Afternoon (3-5 PM)",
                            "Evening (5-7 PM)",
                            "Coordinate with Event",
                            "Breaking News Response",
                            "Counter-programming"
                        ]
                    }
                ]
            },
            {
                section: "Content Details & Evidence",
                fields: [
                    {
                        id: "key_facts",
                        label: "Key Facts & Statistics",
                        type: "textarea",
                        helpText: "Specific data points, numbers, statistics to include"
                    },
                    {
                        id: "local_impact",
                        label: "Local Impact/Examples",
                        type: "textarea",
                        helpText: "How this affects local communities, specific examples"
                    },
                    {
                        id: "candidate_quote",
                        label: "Primary Candidate Quote",
                        type: "textarea",
                        required: true,
                        helpText: "Key quote from candidate (or draft direction for quote)"
                    },
                    {
                        id: "additional_sources",
                        label: "Additional Quote Sources",
                        type: "textarea",
                        helpText: "Surrogates, experts, supporters who can provide quotes"
                    },
                    {
                        id: "background_context",
                        label: "Background Context",
                        type: "textarea",
                        helpText: "Historical context, previous positions, relevant background"
                    },
                    {
                        id: "supporting_evidence",
                        label: "Supporting Evidence",
                        type: "textarea",
                        helpText: "Studies, reports, endorsements, expert opinions that support the message"
                    }
                ]
            },
            {
                section: "Opposition & Challenges",
                fields: [
                    {
                        id: "anticipated_criticism",
                        label: "Anticipated Criticism",
                        type: "textarea",
                        helpText: "What attacks or criticism might this generate?"
                    },
                    {
                        id: "counter_narratives",
                        label: "Potential Counter-Narratives",
                        type: "textarea",
                        helpText: "How might opponents spin this story?"
                    },
                    {
                        id: "defensive_points",
                        label: "Defensive Points",
                        type: "textarea",
                        helpText: "Key points to address potential criticism"
                    },
                    {
                        id: "avoided_topics",
                        label: "Topics to Avoid",
                        type: "textarea",
                        helpText: "Issues, phrases, or topics to avoid for strategic/legal reasons"
                    }
                ]
            },
            {
                section: "Technical Requirements",
                fields: [
                    {
                        id: "contact_information",
                        label: "Media Contact Information",
                        type: "textarea",
                        required: true,
                        helpText: "Spokesperson name, phone, email for media inquiries"
                    },
                    {
                        id: "follow_up_availability",
                        label: "Follow-up Availability",
                        type: "textarea",
                        helpText: "When is candidate/spokesperson available for interviews?"
                    },
                    {
                        id: "supporting_materials",
                        label: "Supporting Materials",
                        type: "textarea",
                        helpText: "Fact sheets, photos, video, documents to attach or reference"
                    },
                    {
                        id: "length_target",
                        label: "Target Length",
                        type: "select",
                        options: [
                            "Brief (300-500 words)",
                            "Standard (500-800 words)",
                            "Comprehensive (800-1200 words)",
                            "Detailed (1200+ words)"
                        ]
                    },
                    {
                        id: "special_formatting",
                        label: "Special Formatting Needs",
                        type: "textarea",
                        helpText: "Bullet points, quotes highlighting, photo placement, etc."
                    }
                ]
            },
            {
                section: "Approval & Workflow",
                fields: [
                    {
                        id: "required_approvals",
                        label: "Required Approvals",
                        type: "checkbox",
                        options: [
                            "Communications Director",
                            "Campaign Manager",
                            "Press Secretary",
                            "Policy Director",
                            "Legal Counsel",
                            "Candidate",
                            "Senior Staff",
                            "Issue Experts/Advisors"
                        ]
                    },
                    {
                        id: "approval_deadline",
                        label: "Approval Deadline",
                        type: "datetime-local",
                        helpText: "When must all approvals be complete?"
                    },
                    {
                        id: "release_deadline",
                        label: "Release Deadline",
                        type: "datetime-local",
                        required: true,
                        helpText: "Latest time this can be released to be effective"
                    },
                    {
                        id: "follow_up_actions",
                        label: "Post-Release Follow-up",
                        type: "textarea",
                        helpText: "Media calls, social media push, surrogates activation, etc."
                    },
                    {
                        id: "success_metrics",
                        label: "Success Metrics",
                        type: "textarea",
                        helpText: "How will you measure if this press release was successful?"
                    }
                ]
            }
        ],
        template_structure: {
            header: "FOR [RELEASE TYPE] - Contact information",
            headline: "Compelling, newsworthy headline",
            dateline: "Location and date",
            lead: "Who, what, when, where, why in first 1-2 paragraphs",
            body: "Supporting details, evidence, context",
            quotes: "Candidate and supporting source quotes",
            background: "Additional context and candidate biography",
            contact: "Media contact information"
        }
    }
};

module.exports = briefQuestionnaires;