/**
 * Comprehensive Press Release Typology
 * Based on political campaign strategic communications requirements
 */

const pressReleaseTypology = {
    // Campaign Launch & Entry Releases
    "campaign_launch": {
        title: "Campaign Launch & Entry Releases",
        icon: "🚀",
        strategic_purpose: "Transform candidate from private citizen to public champion, establish credibility and vision",
        narrative_structure: "Hero's Journey",

        narrative_steps: [
            {
                name: "Origin Moment",
                description: "Personal background connecting to district/issues"
            },
            {
                name: "Calling to Service",
                description: "Motivation and decision to run"
            },
            {
                name: "Vision Declaration",
                description: "Platform announcement and key priorities"
            },
            {
                name: "Coalition Building",
                description: "Who supports and why"
            },
            {
                name: "Call to Action",
                description: "How people can get involved"
            }
        ],

        briefing_requirements: [
            "Detailed personal biography and origin story",
            "3-5 core policy positions with specifics",
            "Target voter demographics and geographic focus",
            "Opposition research and vulnerability assessment",
            "Visual assets (photos, videos, graphics)",
            "10-15 pre-approved candidate quotes",
            "Campaign infrastructure details",
            "Initial fundraising goals and strategy",
            "Endorsement pipeline and supporter lists",
            "Media strategy and interview availability"
        ],

        key_questions: [
            "What's the candidate's origin story that connects to this district?",
            "Which 3 issues will define this campaign?",
            "What makes this candidate different from opponents?",
            "What's our day-one narrative beyond 'I'm running'?"
        ],

        example_opening: "Born in a working-class family in Toledo, Sarah Martinez watched her mother choose between paying for insulin and buying groceries. Today, Martinez announces her candidacy for Congress to ensure no family faces that choice again."
    },

    // Crisis Response & Damage Control
    "crisis_response": {
        title: "Crisis Response & Damage Control",
        icon: "⚠️",
        strategic_purpose: "Contain damage while preserving campaign credibility and controlling narrative",
        narrative_structure: "Accountability & Resolution",

        narrative_steps: [
            {
                name: "Direct Acknowledgment",
                description: "Clear statement addressing the situation"
            },
            {
                name: "Context Setting",
                description: "Factual background and circumstances"
            },
            {
                name: "Responsibility Taking",
                description: "Appropriate accountability without admission of guilt"
            },
            {
                name: "Corrective Action",
                description: "Specific steps being taken immediately"
            },
            {
                name: "Recommitment",
                description: "Reaffirm campaign values and mission"
            }
        ],

        briefing_requirements: [
            "Exact incident timeline with timestamps",
            "Legal review and approved language",
            "Confirmed facts vs. rumors/speculation",
            "Key stakeholder and endorser reactions",
            "Current media coverage analysis",
            "Rapid response plan and next steps",
            "Candidate availability for interviews",
            "Internal staff talking points",
            "Precedent research from similar situations",
            "Long-term reputation management strategy"
        ],

        key_questions: [
            "What exactly happened and what can we confirm?",
            "What's our central message and how do we stay on it?",
            "Which facts do we acknowledge vs. dispute?",
            "What's our timeline for follow-up actions?"
        ],

        example_opening: "Campaign Manager Sarah Chen today addressed staff comments that appeared to minimize climate concerns. 'These statements do not reflect our campaign's values or my personal commitment to environmental justice,' Chen said."
    },

    // Policy Position Statements
    "policy_position": {
        title: "Policy Position Statements",
        icon: "📊",
        strategic_purpose: "Establish policy expertise and practical solutions while differentiating from opponents",
        narrative_structure: "Problem-Solution-Proof",

        narrative_steps: [
            {
                name: "Problem Definition",
                description: "Clear issue identification with local impact"
            },
            {
                name: "Solution Introduction",
                description: "Comprehensive plan announcement"
            },
            {
                name: "Evidence Base",
                description: "Research and expert support"
            },
            {
                name: "Implementation Details",
                description: "Specific steps and timeline"
            },
            {
                name: "Stakeholder Support",
                description: "Expert and community endorsements"
            }
        ],

        briefing_requirements: [
            "Academic studies and research reports",
            "Stakeholder input (unions, advocacy groups)",
            "District-specific impact data and statistics",
            "Implementation timeline and legislative pathway",
            "Cost analysis and funding mechanisms",
            "Opposition arguments and responses",
            "Expert endorsements and testimonials",
            "Historical context and precedent analysis",
            "Comparison with opponent positions",
            "Supporting coalition information"
        ],

        key_questions: [
            "What problem are we solving and for whom specifically?",
            "What evidence supports this policy approach?",
            "How does this position differentiate us from opponents?",
            "What are the strongest counter-arguments we need to address?"
        ],

        example_opening: "With housing costs consuming 60% of median income in Congressional District 12, families are being priced out of their own communities. Today, Maria Gonzalez unveiled her 'Homes for All' plan to build 50,000 affordable units over five years."
    },

    // Endorsement Announcements
    "endorsement": {
        title: "Endorsement Announcements",
        icon: "⭐",
        strategic_purpose: "Transfer credibility and demonstrate growing coalition support",
        narrative_structure: "Validation & Coalition",

        narrative_steps: [
            {
                name: "Endorser Introduction",
                description: "Credentials and local relevance"
            },
            {
                name: "Endorsement Declaration",
                description: "Clear statement of support"
            },
            {
                name: "Alignment Explanation",
                description: "Shared values and vision"
            },
            {
                name: "Credibility Transfer",
                description: "What this endorsement demonstrates"
            },
            {
                name: "Coalition Expansion",
                description: "Broader movement context"
            }
        ],

        briefing_requirements: [
            "Endorser biography and local connections",
            "Relationship history with candidate",
            "Pre-approved quotes from endorser",
            "Event logistics and photo opportunities",
            "Media strategy and exclusive access",
            "Endorser's past positions aligning with candidate",
            "Broader endorsement strategy context",
            "Expected opposition response preparation",
            "Coalition building implications",
            "Social media coordination plan"
        ],

        key_questions: [
            "Why is this endorser's voice particularly powerful?",
            "What specific issues bring them together?",
            "How does this endorsement expand our coalition?",
            "What's the visual story we want to tell?"
        ],

        example_opening: "Former NASA Administrator Charles Bolden, who led the agency under President Obama, today endorsed Jennifer Kim for Senate, citing her 'unmatched understanding of science policy and space exploration's economic potential.'"
    },

    // Fundraising Achievement Releases
    "fundraising": {
        title: "Fundraising Achievement Releases",
        icon: "💰",
        strategic_purpose: "Demonstrate viability and grassroots enthusiasm while building momentum",
        narrative_structure: "Momentum & Grassroots Power",

        narrative_steps: [
            {
                name: "Achievement Headline",
                description: "Impressive numbers and timeframe"
            },
            {
                name: "Grassroots Emphasis",
                description: "Average donation and donor diversity"
            },
            {
                name: "Comparative Context",
                description: "Historical and competitive benchmarks"
            },
            {
                name: "Resource Strategy",
                description: "How funds will be deployed"
            },
            {
                name: "Supporter Appreciation",
                description: "Movement building and momentum"
            }
        ],

        briefing_requirements: [
            "Total raised, donor count, average donation",
            "Comparative analysis vs. opponents and previous quarters",
            "Donor demographics and geographic breakdown",
            "Major expenditures and strategic investments",
            "Cash-on-hand and burn rate analysis",
            "Successful events and upcoming opportunities",
            "Digital fundraising metrics and email growth",
            "FEC compliance requirements and deadlines",
            "Grassroots vs. establishment support narrative",
            "Resource deployment strategy"
        ],

        key_questions: [
            "What's the most impressive number in these figures?",
            "How does this demonstrate grassroots vs. establishment support?",
            "What does this funding enable us to do strategically?",
            "How do we frame this competitively without seeming money-obsessed?"
        ],

        example_opening: "Congressional candidate David Park raised $2.1 million in Q3 from over 45,000 individual donors, with an average contribution of $47, demonstrating unprecedented grassroots support in the district's history."
    },

    // Event Promotion Releases
    "event_promotion": {
        title: "Event Promotion Releases",
        icon: "📅",
        strategic_purpose: "Create urgency and drive attendance while advancing campaign narrative",
        narrative_structure: "Community Invitation",

        narrative_steps: [
            {
                name: "Issue Urgency",
                description: "Problem affecting community"
            },
            {
                name: "Event Announcement",
                description: "Solution-focused gathering details"
            },
            {
                name: "Program Details",
                description: "Agenda, speakers, format"
            },
            {
                name: "Accessibility Information",
                description: "How to attend and participate"
            },
            {
                name: "Participation Encouragement",
                description: "Call for community engagement"
            }
        ],

        briefing_requirements: [
            "Complete event logistics (date, time, location, capacity)",
            "Agenda details and format structure",
            "Expert participants and special guests",
            "Community issues to be addressed",
            "Registration process and accessibility information",
            "Media access and interview opportunities",
            "Follow-up communication plan",
            "Contingency plans for weather/overflow",
            "Security and safety protocols",
            "Social media and livestream strategy"
        ],

        key_questions: [
            "What community need does this event address?",
            "Who specifically should attend and why?",
            "What outcomes are we hoping to achieve?",
            "How does this advance our campaign narrative?"
        ],

        example_opening: "As prescription drug costs force seniors to ration medications, Senate candidate Lisa Chen will host a Healthcare Town Hall Thursday to hear directly from affected families and present her Medicare expansion plan."
    },

    // Legislative Achievement Releases
    "legislative_achievement": {
        title: "Legislative Achievement Releases",
        icon: "🏛️",
        strategic_purpose: "Demonstrate effectiveness and constituent service while claiming credit for results",
        narrative_structure: "Delivery & Impact",

        narrative_steps: [
            {
                name: "Achievement Announcement",
                description: "Legislative victory and specifics"
            },
            {
                name: "Local Impact",
                description: "District benefits and affected groups"
            },
            {
                name: "Beneficiary Focus",
                description: "Real people and families helped"
            },
            {
                name: "Process Credit",
                description: "Role in achieving this outcome"
            },
            {
                name: "Future Commitment",
                description: "Continued work and next priorities"
            }
        ],

        briefing_requirements: [
            "Bill specifics (provisions, timeline, funding)",
            "District-specific benefits and affected populations",
            "Coalition partners and co-sponsors",
            "Legislative process and vote margins",
            "Implementation steps and agency roles",
            "Success metrics and progress measurement",
            "Historical context and previous attempts",
            "Appropriate credit sharing with other officials",
            "Opposition arguments and responses",
            "Future legislative priorities"
        ],

        key_questions: [
            "How does this directly help our constituents?",
            "What role did we play in making this happen?",
            "When will people see tangible results?",
            "How does this demonstrate our effectiveness in office?"
        ],

        example_opening: "Rep. Martinez today announced $50 million in federal funding for Metro Rail expansion, bringing direct train service to working-class neighborhoods for the first time and cutting commute times by 45 minutes."
    },

    // Voting Record Highlight Releases
    "voting_record": {
        title: "Voting Record Highlight Releases",
        icon: "📋",
        strategic_purpose: "Establish credibility through documented actions, demonstrate consistency and commitment to constituents",
        narrative_structure: "Proven Track Record",

        narrative_steps: [
            {
                name: "Record Summary",
                description: "Overview of voting history on key issues"
            },
            {
                name: "Specific Votes Highlighted",
                description: "3-5 most important votes with context"
            },
            {
                name: "Constituent Impact",
                description: "How these votes helped real people"
            },
            {
                name: "Consistency Demonstrated",
                description: "Pattern of reliable advocacy"
            },
            {
                name: "Future Commitment",
                description: "Pledge to continue fighting"
            }
        ],

        briefing_requirements: [
            "Complete voting record on relevant issues",
            "Bill numbers, dates, vote margins",
            "Co-sponsorship history and leadership roles",
            "District-specific impact of legislation supported",
            "Testimonials from affected constituents",
            "Comparison data (if contrast intended)",
            "Opponent's voting record (if available)",
            "Independent verification sources",
            "Committee assignments and participation",
            "Attendance and engagement metrics"
        ],

        key_questions: [
            "Which votes best demonstrate our values and effectiveness?",
            "How have these votes tangibly helped our constituents?",
            "What pattern of advocacy does this record show?",
            "Are we prepared to defend every vote highlighted?"
        ],

        example_opening: "Over six years in Congress, Rep. Chen has voted 47 times to expand healthcare access, consistently fighting to lower prescription drug costs and protect coverage for pre-existing conditions—delivering real results for District 12 families."
    },

    // Opposition Attack Releases
    "opposition_attack": {
        title: "Opposition Attack Releases",
        icon: "⚔️",
        strategic_purpose: "Define opponent negatively, disqualify them in voters' minds, create doubt about fitness for office",
        narrative_structure: "Exposure & Disqualification",

        narrative_steps: [
            {
                name: "Credibility Establishment",
                description: "Source credentials and documentation"
            },
            {
                name: "Specific Allegation",
                description: "Clear, verifiable claim with evidence"
            },
            {
                name: "Impact Framework",
                description: "Why this matters to voters/constituents"
            },
            {
                name: "Pattern Building",
                description: "Connect to broader character/judgment issues"
            },
            {
                name: "Disqualifying Conclusion",
                description: "Why opponent is unfit for office"
            }
        ],

        briefing_requirements: [
            "Ironclad documentation and primary sources",
            "Legal review and fact-checking verification",
            "Public records, voting records, court filings",
            "Video/audio evidence when available",
            "Opposition research file with full context",
            "Anticipated opponent responses and rebuttals",
            "Risk assessment and blowback preparation",
            "Surrogate coordination and talking points",
            "Media placement strategy and timing",
            "Rapid response team readiness"
        ],

        key_questions: [
            "Can we prove every single allegation beyond doubt?",
            "What's the worst-case blowback and can we survive it?",
            "Does this genuinely disqualify opponent or just wound them?",
            "Will voters care, or does this look like politics as usual?",
            "Are we prepared for multi-day media cycle on this?"
        ],

        example_opening: "Public records obtained by the Williams campaign reveal that opponent David Park accepted $250,000 from pharmaceutical companies while voting six times against prescription drug price controls—a pattern of putting corporate profits over patients."
    },

    // Contrast Communication Releases
    "contrast_communication": {
        title: "Contrast Communication Releases",
        icon: "⚖️",
        strategic_purpose: "Highlight clear choice for voters through substantive comparison, elevate our strengths while exposing opponent weaknesses",
        narrative_structure: "Clear Choice Framework",

        narrative_steps: [
            {
                name: "Issue Importance",
                description: "Why this issue matters to voters"
            },
            {
                name: "Our Position & Record",
                description: "What we've done, what we'll do"
            },
            {
                name: "Their Position & Record",
                description: "What opponent has done/supports"
            },
            {
                name: "Real-World Impact",
                description: "How this difference affects constituents"
            },
            {
                name: "Choice Crystallized",
                description: "Clear statement of opposing paths"
            }
        ],

        briefing_requirements: [
            "Side-by-side comparison chart with citations",
            "Verified voting records for both candidates",
            "Position papers and public statements",
            "District-specific impact modeling",
            "Demographic analysis of who benefits from each position",
            "Endorser perspectives on the contrast",
            "Visual assets for social media comparison",
            "Fact sheet for media with full sourcing",
            "Q&A anticipating fact-checker scrutiny",
            "Constituent testimonials illustrating impact"
        ],

        key_questions: [
            "Is this a genuine substantive difference voters care about?",
            "Are we presenting opponent's position fairly?",
            "Does this contrast favor us or just clarify opponent's view?",
            "Can we sustain this message through Election Day?"
        ],

        example_opening: "On education funding, the choice is clear: Lisa Thompson has fought for $200 million in new school funding and reduced class sizes to 22 students, while John Reynolds voted three times to cut education budgets and increase class sizes to 35."
    },

    // Accountability Demand Releases
    "accountability_demand": {
        title: "Accountability Demand Releases",
        icon: "❓",
        strategic_purpose: "Force opponent to address uncomfortable issue, create news cycle around their silence/evasion, demonstrate leadership through transparency",
        narrative_structure: "Question & Exposure",

        narrative_steps: [
            {
                name: "Issue Presentation",
                description: "Clear explanation of situation requiring answer"
            },
            {
                name: "Legitimate Questions",
                description: "3-5 specific questions opponent must address"
            },
            {
                name: "Public Interest",
                description: "Why voters deserve answers now"
            },
            {
                name: "Our Transparency",
                description: "How we've already answered similar questions"
            },
            {
                name: "Deadline & Consequences",
                description: "Timeframe and implications of non-response"
            }
        ],

        briefing_requirements: [
            "Full documentation of underlying issue",
            "Specific, answerable questions (not rhetorical)",
            "Timeline of opponent's evasion/silence to date",
            "Our own disclosure on similar issues",
            "Media interest assessment and pitch strategy",
            "Surrogate validators (good government groups, etc.)",
            "Follow-up plan if opponent ignores demand",
            "Prepared responses to likely opponent deflections",
            "Earned media targets and scheduling",
            "Social media amplification strategy"
        ],

        key_questions: [
            "Are these genuinely answerable questions or just attacks?",
            "Have we held ourselves to the same standard?",
            "What if opponent actually provides good answers?",
            "Does this create news cycle or fall flat?",
            "Are we prepared to escalate if they ignore us?"
        ],

        example_opening: "After three weeks of silence, Senate candidate Maria Rodriguez is demanding answers: Why did opponent Tom Wilson accept campaign contributions from the same defense contractor he awarded a $50 million no-bid contract to as County Commissioner?"
    }
};

// Tone Classification Rubric
const toneClassification = {
    "positive_celebratory": {
        label: "Positive/Celebratory",
        description: "Achievements, good news, victories, milestones reached",
        keywords: ["success", "achievement", "proud", "delivered", "accomplished", "victory", "milestone", "celebrate", "thrilled", "pleased"],
        indicators: [
            "Announces accomplishments or wins",
            "Celebrates milestones or victories",
            "Shares good news for constituents",
            "Positive framing throughout"
        ],
        example: "Today we celebrate a major victory for working families..."
    },
    "inspirational_visionary": {
        label: "Inspirational/Visionary",
        description: "Future-focused, hopeful, movement-building, aspirational",
        keywords: ["future", "vision", "together", "movement", "hope", "dream", "imagine", "build", "forward", "believe"],
        indicators: [
            "Paints picture of better future",
            "Calls for collective action",
            "Uses aspirational language",
            "Movement or coalition building"
        ],
        example: "Together, we can build a future where every family has access to..."
    },
    "neutral_informational": {
        label: "Neutral/Informational",
        description: "Factual updates, announcements, procedural information",
        keywords: ["announce", "today", "will", "plans", "schedule", "details", "information", "update", "according"],
        indicators: [
            "Straightforward facts",
            "Procedural or administrative",
            "No emotional appeals",
            "Objective tone"
        ],
        example: "Senator Martinez announced today that the committee will hold hearings on..."
    },
    "critical_concerned": {
        label: "Critical/Concerned",
        description: "Identifying problems, raising concerns (not about opponent)",
        keywords: ["problem", "concern", "challenge", "crisis", "struggle", "difficult", "unfortunately", "troubled", "failing"],
        indicators: [
            "Identifies problems or challenges",
            "Expresses concern about issues",
            "Not attacking opponent",
            "Focus on systemic problems"
        ],
        example: "Our healthcare system is failing families who can't afford..."
    },
    "attack_combative": {
        label: "Attack/Combative",
        description: "Direct criticism of opponent, accusations, exposing failures",
        keywords: ["opponent", "failed", "wrong", "refuses", "dangerous", "lied", "hypocrite", "corrupt", "betrayed", "broken promise"],
        indicators: [
            "Direct opponent criticism",
            "Questions opponent's character/record",
            "Uses accusatory language",
            "Aggressive framing"
        ],
        example: "Opponent Smith has repeatedly voted against the interests of working families..."
    },
    "defensive_responsive": {
        label: "Defensive/Responsive",
        description: "Responding to attacks, clarifying position, damage control",
        keywords: ["response", "clarify", "false", "misleading", "truth", "fact", "record shows", "actually", "contrary"],
        indicators: [
            "Responding to criticism",
            "Correcting misinformation",
            "Defending record or position",
            "Setting record straight"
        ],
        example: "In response to misleading claims, the facts are clear..."
    },
    "urgent_crisis": {
        label: "Urgent/Crisis",
        description: "Time-sensitive, emergency framing, immediate action required",
        keywords: ["urgent", "immediately", "crisis", "emergency", "must act", "cannot wait", "now", "critical", "deadline"],
        indicators: [
            "Time-sensitive language",
            "Sense of urgency or emergency",
            "Calls for immediate action",
            "Crisis framing"
        ],
        example: "We must act immediately to address this urgent crisis..."
    }
};

// Mandatory fields for ALL press releases
const mandatoryFields = [
    {
        name: "Release Status",
        description: "FOR IMMEDIATE RELEASE or EMBARGOED UNTIL [Date/Time]"
    },
    {
        name: "Date & Location",
        description: "Release date and dateline city/state"
    },
    {
        name: "Headline",
        description: "Clear, compelling, under 10 words"
    },
    {
        name: "Lead Paragraph",
        description: "Who, What, When, Where, Why (5 W's)"
    },
    {
        name: "Media Contact",
        description: "Name, title, phone, email"
    },
    {
        name: "Legal Disclaimer",
        description: "Paid for by [Committee Name]"
    },
    {
        name: "End Marker",
        description: "Centered ### or -30-"
    },
    {
        name: "Campaign Boilerplate",
        description: "Standard 2-3 sentence campaign description"
    }
];

module.exports = {
    pressReleaseTypology,
    mandatoryFields,
    toneClassification
};