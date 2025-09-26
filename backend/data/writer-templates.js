/**
 * Writer Templates for Statements and Talking Points
 * These templates use brief questionnaire data to help writers structure content
 */

const writerTemplates = {

    // Political Statement Templates
    statement: {

        // Response to Breaking News Template
        response_breaking_news: {
            title: "Breaking News Response Statement",
            structure: [
                {
                    section: "Opening/Positioning",
                    template: `[CANDIDATE_NAME] [RESPONSE_VERB: responds to/addresses/comments on] [BREAKING_NEWS_TOPIC].

{if urgency_level === 'Critical'}"This [SITUATION_DESCRIPTOR] demands immediate attention and [ACTION_TYPE]," said [CANDIDATE_NAME].{endif}

{brief_data.main_message}`
                },
                {
                    section: "Evidence/Support",
                    template: `{brief_data.key_points}

{if brief_data.facts_statistics}The facts are clear: {brief_data.facts_statistics}{endif}

{if brief_data.local_examples}In [LOCATION/COMMUNITY], {brief_data.local_examples}{endif}`
                },
                {
                    section: "Call to Action",
                    template: `{brief_data.desired_outcome}

{if brief_data.follow_up_actions}{brief_data.follow_up_actions}{endif}`
                },
                {
                    section: "Closing",
                    template: `{if emotional_tone === 'Urgent and Concerned'}"We cannot wait to act on this critical issue," [CANDIDATE_NAME] concluded.{endif}
{if emotional_tone === 'Confident and Authoritative'}"[CANDIDATE_NAME] has the experience and proven track record to [SOLUTION]," {campaign_spokesperson} said.{endif}
{if emotional_tone === 'Measured and Diplomatic'}"[CANDIDATE_NAME] will continue to work with all stakeholders to find [SOLUTION_TYPE] solutions," the statement concluded.{endif}`
                }
            ],
            style_notes: [
                "Lead with candidate's position, not the controversy",
                "Use active voice and strong verbs",
                "Include specific facts and local impact",
                "End with forward-looking action"
            ],
            length_guide: {
                "Brief": "1-2 paragraphs, 100-200 words",
                "Standard": "3-4 paragraphs, 200-400 words",
                "Comprehensive": "5+ paragraphs, 400-600 words"
            }
        },

        // Policy Position Template
        policy_position: {
            title: "Policy Position Statement",
            structure: [
                {
                    section: "Position Declaration",
                    template: `[CANDIDATE_NAME] today [ANNOUNCED/OUTLINED/UNVEILED] [his/her] comprehensive plan for [POLICY_AREA], [ACTION_DESCRIPTION].

{brief_data.main_message}

"[POLICY_QUOTE_FROM_CANDIDATE]," said [CANDIDATE_NAME].`
                },
                {
                    section: "Problem Definition",
                    template: `{brief_data.background_context}

{if brief_data.stakeholder_interests}This affects [STAKEHOLDER_GROUPS] who [IMPACT_DESCRIPTION].{endif}

{brief_data.facts_statistics}`
                },
                {
                    section: "Solution Details",
                    template: `{brief_data.key_points}

{if brief_data.success_stories}[CANDIDATE_NAME]'s track record includes {brief_data.success_stories}{endif}

{if brief_data.expert_quotes}{brief_data.expert_quotes}{endif}`
                },
                {
                    section: "Local Impact",
                    template: `{brief_data.local_examples}

For [LOCAL_COMMUNITY], this plan means [SPECIFIC_BENEFITS].`
                },
                {
                    section: "Implementation/Next Steps",
                    template: `{brief_data.desired_outcome}

{if brief_data.timing_considerations}{brief_data.timing_considerations}{endif}

[CANDIDATE_NAME] will [IMPLEMENTATION_STEPS] if elected [OFFICE].`
                }
            ],
            style_notes: [
                "Lead with the solution, not the problem",
                "Use specific, measurable outcomes",
                "Include cost/benefit analysis if relevant",
                "Show how it differs from status quo"
            ]
        },

        // Crisis Response Template
        crisis_response: {
            title: "Crisis Response Statement",
            structure: [
                {
                    section: "Acknowledgment",
                    template: `{if response_approach === 'Take Responsibility'}[CANDIDATE_NAME] takes full responsibility for [ISSUE] and [ACTION_TAKEN].{endif}

{if response_approach === 'Direct Refutation'}The allegations against [CANDIDATE_NAME] are [FALSE/INACCURATE/MISLEADING] and [EVIDENCE_OF_REFUTATION].{endif}

{if response_approach === 'Acknowledge and Redirect'}[CANDIDATE_NAME] acknowledges [ISSUE_ASPECT] and is focused on [SOLUTION/CORRECTIVE_ACTION].{endif}`
                },
                {
                    section: "Context/Facts",
                    template: `{brief_data.factual_context}

{if brief_data.evidence_rebuttal}The facts show: {brief_data.evidence_rebuttal}{endif}

{if brief_data.third_party_support}{brief_data.third_party_support}{endif}`
                },
                {
                    section: "Corrective Action",
                    template: `{brief_data.desired_outcome}

{if response_approach === 'Take Responsibility'}[CANDIDATE_NAME] has already [CORRECTIVE_ACTIONS_TAKEN] and will [FUTURE_PREVENTION_MEASURES].{endif}`
                },
                {
                    section: "Forward Focus",
                    template: `{brief_data.pivot_message}

"The real issue facing [CONSTITUENCY] is [MAJOR_ISSUE], and [CANDIDATE_NAME] remains focused on [SOLUTIONS]," {campaign_spokesperson} said.`
                }
            ],
            style_notes: [
                "Be direct and factual",
                "Avoid defensive language",
                "Pivot quickly to positive message",
                "Limit speculation or emotional responses"
            ]
        }
    },

    // Daily Talking Points Template
    talking_points_daily: {
        title: "Daily Talking Points Template",
        structure: [
            {
                section: "Header Section",
                template: `CONFIDENTIAL - CAMPAIGN TALKING POINTS
Date: {brief_data.date_valid} | Valid Through: [END_DATE]
Distribution: {brief_data.distribution_tiers}
Updated: [TIMESTAMP]`
            },
            {
                section: "Message of the Day",
                template: `MESSAGE OF THE DAY:
{brief_data.message_of_day}`
            },
            {
                section: "Today's Priorities",
                template: `TODAY'S PRIORITIES:
1. PRIMARY FOCUS - {brief_data.primary_focus}
{if brief_data.secondary_message}2. SECONDARY MESSAGE - {brief_data.secondary_message}{endif}
{if brief_data.defensive_position}3. DEFENSIVE POSITION - {brief_data.defensive_position}{endif}`
            },
            {
                section: "Quick Hitters",
                template: `QUICK HITTERS:
• {Generated from primary_focus}
• {Generated from key campaign positions}
• {Generated from local_angles}
• {Generated from opponent contrast}
• {Generated from candidate achievements}
• {Generated from policy benefits}
• {Generated from endorsements/support}`
            },
            {
                section: "Detailed Points",
                template: `DETAILED POINTS:

{brief_data.primary_focus}:
{Expanded explanation with examples and statistics}
{if brief_data.local_angles}Local impact: {brief_data.local_angles}{endif}

{if brief_data.news_context}NEWS CONTEXT:
{brief_data.news_context}{endif}

{if brief_data.campaign_events}TODAY'S EVENTS:
{brief_data.campaign_events}{endif}`
            },
            {
                section: "Opposition Response",
                template: `IF ASKED ABOUT {brief_data.likely_attacks}:
{Generated response based on pivot_strategies}

PIVOT STRATEGY:
{brief_data.pivot_strategies}

{if brief_data.do_not_say}DO NOT SAY:
{brief_data.do_not_say}{endif}`
            }
        ],
        customization_by_tier: {
            "Tier 1": {
                additional_content: "Confidential strategic context, internal polling data, advanced notice of announcements"
            },
            "Tier 2": {
                additional_content: "Full defensive messaging, detailed policy explanations"
            },
            "Tier 3": {
                additional_content: "Public-safe messages only, simplified explanations"
            },
            "Tier 4": {
                additional_content: "Issue-specific focus relevant to organization's priorities"
            }
        }
    },

    // Crisis Talking Points Template
    talking_points_crisis: {
        title: "Crisis Response Talking Points Template",
        structure: [
            {
                section: "Header",
                template: `URGENT TALKING POINTS UPDATE
Time: [TIMESTAMP] | Topic: Response to {brief_data.crisis_description}
Distribution: {Based on urgency_level}
Urgency: {brief_data.urgency_level}`
            },
            {
                section: "Immediate Response",
                template: `IMMEDIATE RESPONSE (Use Exactly):
"{brief_data.core_response}"

{if brief_data.factual_context}CONTEXT IF PRESSED:
{brief_data.factual_context}{endif}`
            },
            {
                section: "Pivot Strategy",
                template: `PIVOT STRATEGY:
{brief_data.pivot_message}

{if brief_data.evidence_rebuttal}SUPPORTING EVIDENCE:
{brief_data.evidence_rebuttal}{endif}`
            },
            {
                section: "Restrictions",
                template: `AVOID DISCUSSING:
{if brief_data.legal_restrictions}• {brief_data.legal_restrictions}{endif}
• Speculation about ongoing investigations
• Personal details not relevant to public service

{if brief_data.escalation_triggers}ESCALATION:
{brief_data.escalation_triggers}{endif}`
            }
        ],
        urgency_modifications: {
            "Immediate": {
                distribution: "Senior staff and Tier 1 surrogates only",
                approval: "Communications Director authority",
                updates: "Every 30 minutes as situation develops"
            },
            "Same Day": {
                distribution: "Tier 1 and 2 surrogates",
                approval: "Campaign Manager approval required",
                updates: "Every 2 hours until resolved"
            },
            "Next Day": {
                distribution: "Standard distribution levels",
                approval: "Standard approval process",
                updates: "Once daily until situation stabilizes"
            }
        }
    },

    // Event-Specific Talking Points Template
    talking_points_event: {
        title: "Event-Specific Talking Points Template",
        structure: [
            {
                section: "Event Header",
                template: `EVENT TALKING POINTS: {brief_data.event_name}
Date: {brief_data.event_date} | Location: {brief_data.event_location}
Audience: {brief_data.audience_profile}
Event Type: {brief_data.event_type}`
            },
            {
                section: "Pre-Event Messaging",
                template: `PRE-EVENT MESSAGING (Media Availabilities):
• [CANDIDATE_NAME] is here to discuss {brief_data.event_theme} with {brief_data.audience_profile}
{if brief_data.key_announcements}• Today's announcement of {brief_data.key_announcements} will {impact_description}
{endif}• {brief_data.local_connections}

{if brief_data.pre_event_media}ARRIVAL MESSAGING:
{brief_data.pre_event_media}{endif}`
            },
            {
                section: "During Event",
                template: `DURING EVENT (Key Points to Emphasize):
• {brief_data.event_theme}
• {brief_data.local_connections}
• {Generated contrast points relevant to audience}

{if brief_data.opening_remarks}OPENING REMARKS KEY POINTS:
{brief_data.opening_remarks}{endif}

{if brief_data.qa_preparation}Q&A PREPARATION:
{brief_data.qa_preparation}{endif}

{if brief_data.local_endorsers}LOCAL ENDORSERS TO RECOGNIZE:
{brief_data.local_endorsers}{endif}`
            },
            {
                section: "Post-Event",
                template: `POST-EVENT (Follow-up with Media):
• [CANDIDATE_NAME] heard directly from {brief_data.audience_profile} about {brief_data.audience_concerns}
{if brief_data.key_announcements}• Today's {brief_data.key_announcements} demonstrates [CANDIDATE_VALUE]
{endif}• Next step is {follow_up_action} that will {outcome_timeline}

{if brief_data.social_media_content}SOCIAL MEDIA CONTENT:
{brief_data.social_media_content}{endif}

{if brief_data.follow_up_commitments}FOLLOW-UP COMMITMENTS:
{brief_data.follow_up_commitments}{endif}`
            }
        ],
        event_type_variations: {
            "Town Hall": {
                focus: "Listening and direct responses to constituent questions",
                tone: "Accessible and conversational"
            },
            "Press Conference": {
                focus: "Major announcement with supporting evidence",
                tone: "Authoritative and newsworthy"
            },
            "Rally/Campaign Event": {
                focus: "Energy and mobilization messaging",
                tone: "Inspirational and contrast-heavy"
            },
            "Policy Announcement": {
                focus: "Detailed policy explanation with benefits",
                tone: "Expert and solution-oriented"
            }
        }
    },

    // Template Generation Functions
    generation_rules: {
        variable_replacement: {
            "[CANDIDATE_NAME]": "Pull from campaign configuration",
            "[OFFICE]": "Pull from campaign configuration",
            "[LOCATION/COMMUNITY]": "Use event location or assignment location",
            "[TIMESTAMP]": "Current date/time",
            "[SPOKESPERSON]": "Pull from assignment creator or campaign role"
        },

        conditional_logic: {
            "{if condition}content{endif}": "Include content only if condition is met",
            "{brief_data.field}": "Pull data from completed brief questionnaire",
            "{Generated from X}": "Use AI to generate content based on brief data"
        },

        tone_adaptations: {
            "Plain-spoken and Direct": {
                language: "Simple words, short sentences, clear statements",
                avoid: "Policy jargon, complex explanations"
            },
            "Policy Expert/Wonk": {
                language: "Technical accuracy, detailed explanations, data-driven",
                include: "Statistics, studies, implementation details"
            },
            "Outsider/Change Agent": {
                language: "System critique, reform messaging, anti-establishment",
                include: "Contrast with status quo, change imperatives"
            },
            "Fighter/Warrior": {
                language: "Strong verbs, confrontational, urgent",
                include: "Action words, battle metaphors, urgency"
            }
        },

        length_adaptations: {
            "Brief": {
                paragraphs: "1-2",
                word_count: "100-200",
                focus: "Core message only, no elaboration"
            },
            "Standard": {
                paragraphs: "3-4",
                word_count: "200-400",
                focus: "Core message + key support points + local angle"
            },
            "Comprehensive": {
                paragraphs: "5+",
                word_count: "400-600+",
                focus: "Full argument with evidence, examples, and implementation"
            }
        }
    }
};

module.exports = writerTemplates;