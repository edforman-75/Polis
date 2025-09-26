/**
 * Political Campaign Custom Schema Types
 *
 * These schemas extend schema.org with additional political campaign types
 * that better represent modern campaign content and values
 */

module.exports = {
    // Base context - mixing schema.org with our custom extensions
    CAMPAIGN_CONTEXT: {
        "@context": {
            // Standard schema.org
            "@vocab": "https://schema.org/",
            // Our custom political campaign extensions
            "campaign": "https://politicalcampaigns.org/schema/",
            // Policy-focused concepts
            "policy": "https://campaignpolicy.org/schema/"
        }
    },

    // Enhanced assignment type mappings with multiple schema types
    ASSIGNMENT_SCHEMA_MAPPING: {
        'press_release': {
            primary: "NewsArticle",
            secondary: ["PressRelease", "dem:CampaignAnnouncement"],
            progressive_context: "dem:ProgressiveMessage"
        },

        'statement': {
            primary: "Article",
            secondary: ["dem:CandidateStatement", "PublicStatement"],
            progressive_context: "dem:PolicyPosition"
        },

        'op_ed': {
            primary: "OpinionPiece",
            secondary: ["Article", "dem:ThoughtLeadership"],
            progressive_context: "progressive:PolicyArgument"
        },

        'policy_announcement': {
            primary: "dem:PolicyProposal",
            secondary: ["GovernmentService", "Article", "dem:ProgressivePolicy"],
            progressive_context: "progressive:SocialJusticeInitiative"
        },

        'endorsement': {
            primary: "EndorseAction",
            secondary: ["dem:PoliticalEndorsement", "dem:CoalitionSupport"],
            progressive_context: "progressive:MovementEndorsement"
        },

        'event_announcement': {
            primary: "Event",
            secondary: ["dem:CampaignEvent", "dem:CommunityGathering"],
            progressive_context: "progressive:GrassrootsEvent"
        },

        'fundraising_appeal': {
            primary: "dem:FundraisingCampaign",
            secondary: ["DonateAction", "dem:GrassrootsFundraising"],
            progressive_context: "progressive:PeopleFirst"
        },

        'volunteer_recruitment': {
            primary: "dem:VolunteerOpportunity",
            secondary: ["VolunteerAction", "dem:CommunityOrganizing"],
            progressive_context: "progressive:GrassrootsOrganizing"
        },

        'voter_outreach': {
            primary: "dem:VoterEngagement",
            secondary: ["CivicAction", "dem:DemocracyBuilding"],
            progressive_context: "progressive:VotingRights"
        },

        'coalition_building': {
            primary: "dem:CoalitionInitiative",
            secondary: ["CollaborativeAction", "dem:CommunityPartnership"],
            progressive_context: "progressive:SolidarityMovement"
        },

        'town_hall': {
            primary: "Event",
            secondary: ["dem:TownHall", "dem:CommunityForum"],
            progressive_context: "progressive:DemocraticParticipation"
        },

        'issue_advocacy': {
            primary: "dem:IssueAdvocacy",
            secondary: ["Article", "dem:PolicyAdvocacy"],
            progressive_context: "progressive:SocialJusticeAdvocacy"
        },

        'candidate_introduction': {
            primary: "Person",
            secondary: ["dem:CandidateProfile", "dem:PublicServant"],
            progressive_context: "progressive:PeoplesCampion"
        },

        'debate_preparation': {
            primary: "dem:DebatePreparation",
            secondary: ["EducationalAction", "dem:PolicyDiscussion"],
            progressive_context: "progressive:DemocraticDebate"
        },

        'get_out_vote': {
            primary: "dem:GetOutTheVote",
            secondary: ["VoteAction", "CivicAction"],
            progressive_context: "progressive:DemocracyInAction"
        },

        'community_organizing': {
            primary: "dem:CommunityOrganizing",
            secondary: ["OrganizeAction", "dem:GrassrootsMovement"],
            progressive_context: "progressive:PowerBuilding"
        },

        'social_justice_statement': {
            primary: "dem:SocialJusticeStatement",
            secondary: ["Article", "dem:EquityPosition"],
            progressive_context: "progressive:JusticeDeclaration"
        },

        'environmental_policy': {
            primary: "dem:EnvironmentalPolicy",
            secondary: ["dem:ClimateAction", "dem:GreenNewDeal"],
            progressive_context: "progressive:ClimateJustice"
        },

        'healthcare_proposal': {
            primary: "dem:HealthcareProposal",
            secondary: ["dem:UniversalHealthcare", "GovernmentService"],
            progressive_context: "progressive:HealthcareAsRight"
        },

        'economic_justice': {
            primary: "dem:EconomicJustice",
            secondary: ["dem:WorkersRights", "dem:FairWages"],
            progressive_context: "progressive:EconomicEquality"
        },

        'civil_rights_statement': {
            primary: "dem:CivilRightsStatement",
            secondary: ["dem:HumanRights", "dem:EqualityAdvocacy"],
            progressive_context: "progressive:CivilRightsMovement"
        },

        'immigration_policy': {
            primary: "dem:ImmigrationPolicy",
            secondary: ["dem:ImmigrantRights", "dem:PathToCitizenship"],
            progressive_context: "progressive:ImmigrantJustice"
        }
    },

    // Custom Democratic campaign schema types
    CUSTOM_SCHEMA_TYPES: {
        // Campaign-specific types
        "dem:CampaignAnnouncement": {
            "@type": "dem:CampaignAnnouncement",
            description: "Official campaign announcement or major campaign news",
            extends: "NewsArticle",
            properties: {
                "dem:campaignPhase": "String",
                "dem:targetDemographic": "String",
                "dem:callToAction": "String",
                "dem:fundingGoal": "MonetaryAmount",
                "dem:voterRegistrationLink": "URL"
            }
        },

        "dem:PolicyProposal": {
            "@type": "dem:PolicyProposal",
            description: "Detailed policy proposal or legislative initiative",
            extends: "GovernmentService",
            properties: {
                "dem:policyArea": "String",
                "dem:beneficiaries": "String",
                "dem:estimatedCost": "MonetaryAmount",
                "dem:implementationTimeline": "String",
                "dem:supportingData": "Dataset",
                "dem:bipartisanSupport": "Boolean",
                "dem:grassrootsSupport": "Number"
            }
        },

        "dem:GrassrootsFundraising": {
            "@type": "dem:GrassrootsFundraising",
            description: "People-powered fundraising campaign",
            extends: "DonateAction",
            properties: {
                "dem:averageDonation": "MonetaryAmount",
                "dem:numberOfDonors": "Number",
                "dem:smallDollarPercentage": "Number",
                "dem:corporateDonations": "Boolean",
                "dem:transparencyReport": "URL"
            }
        },

        "dem:CommunityOrganizing": {
            "@type": "dem:CommunityOrganizing",
            description: "Community organizing and grassroots mobilization",
            extends: "OrganizeAction",
            properties: {
                "dem:organizingGoal": "String",
                "dem:communityPartners": "Organization",
                "dem:mobilizationTactics": "String",
                "dem:votersReached": "Number",
                "dem:volunteerSignups": "Number"
            }
        },

        "dem:VoterEngagement": {
            "@type": "dem:VoterEngagement",
            description: "Voter registration and engagement activities",
            extends: "CivicAction",
            properties: {
                "dem:targetVoters": "String",
                "dem:registrationGoal": "Number",
                "dem:outreachMethod": "String",
                "dem:voterGuides": "URL",
                "dem:earlyVotingInfo": "URL",
                "dem:pollingLocations": "URL"
            }
        },

        "dem:CoalitionBuilding": {
            "@type": "dem:CoalitionBuilding",
            description: "Building diverse coalitions and partnerships",
            extends: "CollaborativeAction",
            properties: {
                "dem:coalitionPartners": ["Organization"],
                "dem:sharedGoals": ["String"],
                "dem:diversityCommitment": "String",
                "dem:intersectionalApproach": "Boolean"
            }
        },

        // Progressive issue-specific types
        "progressive:ClimateJustice": {
            "@type": "progressive:ClimateJustice",
            description: "Climate action with environmental justice focus",
            extends: "EnvironmentalPolicy",
            properties: {
                "progressive:frontlineCommunities": "String",
                "progressive:justTransition": "String",
                "progressive:carbonNeutrality": "Date",
                "progressive:greenJobs": "Number"
            }
        },

        "progressive:EconomicEquality": {
            "@type": "progressive:EconomicEquality",
            description: "Economic policies focused on reducing inequality",
            extends: "GovernmentService",
            properties: {
                "progressive:wealthTax": "Boolean",
                "progressive:minimumWage": "MonetaryAmount",
                "progressive:universalBasicIncome": "Boolean",
                "progressive:workerCoops": "Boolean"
            }
        },

        "progressive:HealthcareAsRight": {
            "@type": "progressive:HealthcareAsRight",
            description: "Healthcare policy treating healthcare as human right",
            extends: "GovernmentService",
            properties: {
                "progressive:medicareForAll": "Boolean",
                "progressive:eliminateDeductibles": "Boolean",
                "progressive:prescriptionDrugCosts": "String",
                "progressive:mentalHealthCoverage": "Boolean"
            }
        },

        "progressive:CriminalJusticeReform": {
            "@type": "progressive:CriminalJusticeReform",
            description: "Progressive criminal justice reform initiatives",
            extends: "GovernmentService",
            properties: {
                "progressive:endMassIncarceration": "Boolean",
                "progressive:policeAccountability": "String",
                "progressive:restorative Justice": "Boolean",
                "progressive:drugPolicyReform": "String"
            }
        },

        "progressive:ImmigrantJustice": {
            "@type": "progressive:ImmigrantJustice",
            description: "Immigration policy focused on human rights",
            extends: "GovernmentService",
            properties: {
                "progressive:pathToCitizenship": "Boolean",
                "progressive:familyReunification": "Boolean",
                "progressive:sanctuaryCities": "Boolean",
                "progressive:immigrantRights": "String"
            }
        },

        "progressive:DemocracyReform": {
            "@type": "progressive:DemocracyReform",
            description: "Democratic reform and voting rights expansion",
            extends: "GovernmentService",
            properties: {
                "progressive:votingRightsExpansion": "Boolean",
                "progressive:campaignFinanceReform": "Boolean",
                "progressive:gerrymanderingReform": "Boolean",
                "progressive:dcStatehood": "Boolean"
            }
        }
    },

    // Progressive values and principles that can be embedded
    PROGRESSIVE_VALUES: {
        "progressive:CoreValues": [
            "Economic Justice",
            "Social Justice",
            "Environmental Justice",
            "Racial Equity",
            "Gender Equality",
            "LGBTQ+ Rights",
            "Workers' Rights",
            "Democracy Reform",
            "Healthcare as Human Right",
            "Education Access",
            "Immigration Justice",
            "Criminal Justice Reform"
        ],

        "progressive:CampaignPrinciples": [
            "People-Powered",
            "Grassroots Organizing",
            "No Corporate PAC Money",
            "Transparent Fundraising",
            "Community-Centered",
            "Intersectional Approach",
            "Evidence-Based Policy",
            "Coalition Building"
        ]
    },

    // Democratic Party specific enhancements
    DEMOCRATIC_PARTY_CONTEXT: {
        "dem:PartyPlatform": [
            "Expanding Healthcare Access",
            "Climate Action",
            "Economic Opportunity",
            "Strengthening Democracy",
            "Protecting Civil Rights",
            "Immigration Reform",
            "Education Investment",
            "Infrastructure Investment"
        ],

        "dem:VoterCoalition": [
            "Working Families",
            "Young Voters",
            "Communities of Color",
            "Women",
            "LGBTQ+ Community",
            "Union Members",
            "Environmental Advocates",
            "Healthcare Advocates"
        ]
    },

    // Enhanced properties for existing schema.org types
    ENHANCED_PROPERTIES: {
        // Enhanced Person for candidates
        "Person": {
            "dem:candidateExperience": "String",
            "dem:policyPriorities": ["String"],
            "dem:endorsements": ["Organization"],
            "dem:grassrootsSupport": "Number",
            "dem:communityTies": "String",
            "progressive:endorsedBy": ["Organization"]
        },

        // Enhanced Event for campaign events
        "Event": {
            "dem:eventType": "String", // rally, town_hall, fundraiser, etc.
            "dem:expectedAttendance": "Number",
            "dem:livestreamUrl": "URL",
            "dem:accessibilityFeatures": ["String"],
            "dem:childcareProvided": "Boolean",
            "dem:translationServices": ["String"],
            "progressive:communityPartners": ["Organization"]
        },

        // Enhanced Organization for campaign
        "Organization": {
            "dem:campaignType": "String", // federal, state, local
            "dem:electionCycle": "String",
            "dem:fundraisingGoal": "MonetaryAmount",
            "dem:volunteerCount": "Number",
            "dem:grassrootsCommitment": "String",
            "progressive:endorsingOrganizations": ["Organization"]
        }
    }
};