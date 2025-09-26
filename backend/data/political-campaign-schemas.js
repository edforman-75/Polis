/**
 * Political Campaign Custom Schema Types
 *
 * These schemas extend schema.org with additional political campaign types
 * that better represent modern campaign content and activities
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
            secondary: ["PressRelease", "campaign:CampaignAnnouncement"],
            policy_context: "policy:CampaignMessage"
        },

        'statement': {
            primary: "Article",
            secondary: ["campaign:CandidateStatement", "PublicStatement"],
            policy_context: "policy:PolicyPosition"
        },

        'op_ed': {
            primary: "OpinionPiece",
            secondary: ["Article", "campaign:ThoughtLeadership"],
            policy_context: "policy:PolicyArgument"
        },

        'policy_announcement': {
            primary: "campaign:PolicyProposal",
            secondary: ["GovernmentService", "Article", "campaign:PolicyDocument"],
            policy_context: "policy:PolicyInitiative"
        },

        'endorsement': {
            primary: "EndorseAction",
            secondary: ["campaign:PoliticalEndorsement", "campaign:CoalitionSupport"],
            policy_context: "policy:CommunityEndorsement"
        },

        'event_announcement': {
            primary: "Event",
            secondary: ["campaign:CampaignEvent", "campaign:CommunityGathering"],
            policy_context: "policy:PublicEngagement"
        },

        'fundraising_appeal': {
            primary: "campaign:FundraisingCampaign",
            secondary: ["DonateAction", "campaign:CampaignFunding"],
            policy_context: "policy:CampaignFinance"
        },

        'volunteer_recruitment': {
            primary: "campaign:VolunteerOpportunity",
            secondary: ["VolunteerAction", "campaign:CommunityOrganizing"],
            policy_context: "policy:CivicEngagement"
        },

        'voter_outreach': {
            primary: "campaign:VoterEngagement",
            secondary: ["CivicAction", "campaign:VoterEducation"],
            policy_context: "policy:VotingRights"
        },

        'coalition_building': {
            primary: "campaign:CoalitionInitiative",
            secondary: ["CollaborativeAction", "campaign:CommunityPartnership"],
            policy_context: "policy:StakeholderEngagement"
        },

        'town_hall': {
            primary: "Event",
            secondary: ["campaign:TownHall", "campaign:CommunityForum"],
            policy_context: "policy:PublicParticipation"
        },

        'issue_advocacy': {
            primary: "campaign:IssueAdvocacy",
            secondary: ["Article", "campaign:PolicyAdvocacy"],
            policy_context: "policy:IssuePosition"
        },

        'candidate_introduction': {
            primary: "Person",
            secondary: ["campaign:CandidateProfile", "campaign:PublicServant"],
            policy_context: "policy:Leadership"
        },

        'debate_preparation': {
            primary: "campaign:DebatePreparation",
            secondary: ["EducationalAction", "campaign:PolicyDiscussion"],
            policy_context: "policy:PublicDebate"
        },

        'get_out_vote': {
            primary: "campaign:GetOutTheVote",
            secondary: ["VoteAction", "CivicAction"],
            policy_context: "policy:ElectoralParticipation"
        },

        'community_organizing': {
            primary: "campaign:CommunityOrganizing",
            secondary: ["OrganizeAction", "campaign:GrassrootsMovement"],
            policy_context: "policy:CommunityEmpowerment"
        },

        'social_justice_statement': {
            primary: "campaign:SocialIssueStatement",
            secondary: ["Article", "campaign:EquityPosition"],
            policy_context: "policy:SocialPolicy"
        },

        'environmental_policy': {
            primary: "campaign:EnvironmentalPolicy",
            secondary: ["campaign:ClimateAction", "campaign:EnvironmentalProtection"],
            policy_context: "policy:EnvironmentalPolicy"
        },

        'healthcare_proposal': {
            primary: "campaign:HealthcareProposal",
            secondary: ["campaign:HealthPolicy", "GovernmentService"],
            policy_context: "policy:HealthcarePolicy"
        },

        'economic_justice': {
            primary: "campaign:EconomicPolicy",
            secondary: ["campaign:WorkersRights", "campaign:EconomicOpportunity"],
            policy_context: "policy:EconomicPolicy"
        },

        'civil_rights_statement': {
            primary: "campaign:CivilRightsStatement",
            secondary: ["campaign:HumanRights", "campaign:EqualityAdvocacy"],
            policy_context: "policy:CivilRightsPolicy"
        },

        'immigration_policy': {
            primary: "campaign:ImmigrationPolicy",
            secondary: ["campaign:ImmigrationReform", "campaign:ImmigrantRights"],
            policy_context: "policy:ImmigrationPolicy"
        }
    },

    // Extended political campaign schema types
    EXTENDED_SCHEMA_TYPES: {
        // Campaign-specific types
        "campaign:CampaignAnnouncement": {
            "@type": "campaign:CampaignAnnouncement",
            description: "Official campaign announcement or major campaign news",
            extends: "NewsArticle",
            properties: {
                "campaign:campaignPhase": "String",
                "campaign:targetDemographic": "String",
                "campaign:callToAction": "String",
                "campaign:fundingGoal": "MonetaryAmount",
                "campaign:voterRegistrationLink": "URL"
            }
        },

        "campaign:PolicyProposal": {
            "@type": "campaign:PolicyProposal",
            description: "Detailed policy proposal or legislative initiative",
            extends: "GovernmentService",
            properties: {
                "campaign:policyArea": "String",
                "campaign:beneficiaries": "String",
                "campaign:estimatedCost": "MonetaryAmount",
                "campaign:implementationTimeline": "String",
                "campaign:supportingData": "Dataset",
                "campaign:bipartisanSupport": "Boolean",
                "campaign:publicSupport": "Number"
            }
        },

        "campaign:CampaignFunding": {
            "@type": "campaign:CampaignFunding",
            description: "Campaign fundraising with transparency metrics",
            extends: "DonateAction",
            properties: {
                "campaign:averageDonation": "MonetaryAmount",
                "campaign:numberOfDonors": "Number",
                "campaign:smallDollarPercentage": "Number",
                "campaign:fundingTransparency": "Boolean",
                "campaign:transparencyReport": "URL"
            }
        },

        "campaign:CommunityOrganizing": {
            "@type": "campaign:CommunityOrganizing",
            description: "Community organizing and voter mobilization",
            extends: "OrganizeAction",
            properties: {
                "campaign:organizingGoal": "String",
                "campaign:communityPartners": "Organization",
                "campaign:mobilizationTactics": "String",
                "campaign:votersReached": "Number",
                "campaign:volunteerSignups": "Number"
            }
        },

        "campaign:VoterEngagement": {
            "@type": "campaign:VoterEngagement",
            description: "Voter registration and engagement activities",
            extends: "CivicAction",
            properties: {
                "campaign:targetVoters": "String",
                "campaign:registrationGoal": "Number",
                "campaign:outreachMethod": "String",
                "campaign:voterGuides": "URL",
                "campaign:votingInfo": "URL",
                "campaign:pollingLocations": "URL"
            }
        },

        "campaign:CoalitionBuilding": {
            "@type": "campaign:CoalitionBuilding",
            description: "Building diverse coalitions and partnerships",
            extends: "CollaborativeAction",
            properties: {
                "campaign:coalitionPartners": ["Organization"],
                "campaign:sharedGoals": ["String"],
                "campaign:stakeholderEngagement": "String",
                "campaign:partnershipAgreements": "Boolean"
            }
        },

        // Policy-focused types
        "policy:HealthcarePolicy": {
            "@type": "policy:HealthcarePolicy",
            description: "Healthcare policy proposals and positions",
            extends: "GovernmentService",
            properties: {
                "policy:coverageExpansion": "Boolean",
                "policy:affordabilityMeasures": "Boolean",
                "policy:prescriptionDrugCosts": "String",
                "policy:mentalHealthCoverage": "Boolean"
            }
        },

        "policy:EnvironmentalPolicy": {
            "@type": "policy:EnvironmentalPolicy",
            description: "Environmental and climate policy initiatives",
            extends: "EnvironmentalPolicy",
            properties: {
                "policy:climateGoals": "String",
                "policy:renewableEnergy": "String",
                "policy:carbonNeutrality": "Date",
                "policy:greenJobs": "Number"
            }
        },

        "policy:EconomicPolicy": {
            "@type": "policy:EconomicPolicy",
            description: "Economic policies and workforce initiatives",
            extends: "GovernmentService",
            properties: {
                "policy:minimumWage": "MonetaryAmount",
                "policy:jobTraining": "Boolean",
                "policy:smallBusinessSupport": "Boolean",
                "policy:workersRights": "Boolean"
            }
        },

        "policy:ImmigrationPolicy": {
            "@type": "policy:ImmigrationPolicy",
            description: "Immigration policy and reform proposals",
            extends: "GovernmentService",
            properties: {
                "policy:pathToCitizenship": "Boolean",
                "policy:familyReunification": "Boolean",
                "policy:refugeeSupport": "Boolean",
                "policy:immigrantRights": "String"
            }
        },

        "policy:CivilRightsPolicy": {
            "@type": "policy:CivilRightsPolicy",
            description: "Civil rights and equality policy positions",
            extends: "GovernmentService",
            properties: {
                "policy:votingRightsProtection": "Boolean",
                "policy:equalityLegislation": "Boolean",
                "policy:discriminationProtection": "Boolean",
                "policy:accessibilityImprovements": "String"
            }
        }
    },

    // Campaign values and principles that can be embedded
    CAMPAIGN_VALUES: {
        "policy:CoreValues": [
            "Transparent Governance",
            "Community Engagement",
            "Policy Innovation",
            "Stakeholder Inclusion",
            "Evidence-Based Policy",
            "Public Service",
            "Electoral Integrity",
            "Civic Participation"
        ],

        "campaign:CampaignPrinciples": [
            "Community-Centered",
            "Transparent Fundraising",
            "Grassroots Organizing",
            "Coalition Building",
            "Evidence-Based Campaigning",
            "Voter Education",
            "Public Accountability",
            "Inclusive Participation"
        ]
    },

    // Enhanced properties for existing schema.org types
    ENHANCED_PROPERTIES: {
        // Enhanced Person for candidates
        "Person": {
            "campaign:candidateExperience": "String",
            "campaign:policyPriorities": ["String"],
            "campaign:endorsements": ["Organization"],
            "campaign:publicSupport": "Number",
            "campaign:communityTies": "String",
            "campaign:endorsedBy": ["Organization"]
        },

        // Enhanced Event for campaign events
        "Event": {
            "campaign:eventType": "String", // rally, town_hall, fundraiser, etc.
            "campaign:expectedAttendance": "Number",
            "campaign:livestreamUrl": "URL",
            "campaign:accessibilityFeatures": ["String"],
            "campaign:childcareProvided": "Boolean",
            "campaign:translationServices": ["String"],
            "campaign:communityPartners": ["Organization"]
        },

        // Enhanced Organization for campaign
        "Organization": {
            "campaign:campaignType": "String", // federal, state, local
            "campaign:electionCycle": "String",
            "campaign:fundraisingGoal": "MonetaryAmount",
            "campaign:volunteerCount": "Number",
            "campaign:transparencyCommitment": "String",
            "campaign:endorsingOrganizations": ["Organization"]
        }
    }
};