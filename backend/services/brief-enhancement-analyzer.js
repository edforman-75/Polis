const { generateCompletion } = require('./ai-service');

class BriefEnhancementAnalyzer {

    // Analyze and enhance brief strategic framework
    async analyzeStrategicFramework(briefData) {
        const prompt = `
As an expert political communications strategist, analyze this campaign brief and provide strategic enhancements:

BRIEF DATA:
Title: ${briefData.title || 'Untitled'}
Description: ${briefData.description || 'No description'}
Audience: ${briefData.audience || 'General'}
Tone: ${briefData.tone || 'Professional'}
Context: ${briefData.context || 'No context provided'}

ANALYSIS TASK:
1. PRIMARY MESSAGE: Create a single, memorable sentence that captures the key takeaway
2. SUPPORTING MESSAGES: Develop 2-3 strategic supporting points that reinforce the primary message
3. STRATEGIC PURPOSE: Identify what campaign goal this serves
4. AUDIENCE INSIGHTS: Analyze the target audience and their motivations
5. MESSAGE OPTIMIZATION: Suggest improvements to make the message more compelling

Return a JSON response with this structure:
{
    "primaryMessage": "One clear, memorable sentence",
    "supportingMessages": [
        "First supporting point that reinforces primary message",
        "Second supporting point with evidence/credibility",
        "Third supporting point for emotional appeal"
    ],
    "strategicPurpose": "What campaign goal this achieves",
    "audienceInsights": {
        "primaryConcerns": ["concern1", "concern2"],
        "motivationalFrames": ["frame1", "frame2"],
        "communicationStyle": "How to speak to this audience"
    },
    "messageOptimization": {
        "strengthAreas": ["What works well"],
        "improvementAreas": ["What needs enhancement"],
        "specificSuggestions": ["Concrete improvements"]
    },
    "effectivenessScore": 7.5,
    "recommendations": ["Top 3-5 actionable recommendations"]
}`;

        try {
            const response = await generateCompletion(prompt, {
                temperature: 0.7,
                maxTokens: 1000
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Strategic framework analysis error:', error);
            return this.getFallbackStrategicAnalysis(briefData);
        }
    }

    // Generate content requirements checklist
    async generateContentRequirements(briefData) {
        const prompt = `
As a campaign communications director, create a comprehensive content requirements checklist for this brief:

BRIEF: ${briefData.title}
TYPE: ${briefData.type || 'General'}
AUDIENCE: ${briefData.audience}
CONTEXT: ${briefData.context}

Generate specific, actionable requirements in these categories:

1. MUST INCLUDE ELEMENTS - Essential content that must appear
2. CANDIDATE CREDENTIALS - Which bio elements to highlight
3. POLICY SPECIFICS - Key positions and proposals to mention
4. LOCAL CONNECTIONS - Community-specific references
5. DATA POINTS - Statistics and evidence to include
6. DEFENSIVE ELEMENTS - Weaknesses to address proactively
7. CALL TO ACTION - What audience should do next

Return JSON:
{
    "mustInclude": {
        "candidateElements": ["specific bio points"],
        "policyPositions": ["key policy items"],
        "statistics": ["important numbers"],
        "localConnections": ["community references"],
        "defensivePoints": ["vulnerabilities to address"]
    },
    "callToAction": {
        "primary": "Main action we want",
        "secondary": ["Alternative actions"]
    },
    "qualityChecks": ["verification items"],
    "legalConsiderations": ["compliance requirements"],
    "messageDiscipline": ["staying on message requirements"]
}`;

        try {
            const response = await generateCompletion(prompt, {
                temperature: 0.6,
                maxTokens: 800
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Content requirements generation error:', error);
            return this.getFallbackContentRequirements(briefData);
        }
    }

    // Analyze event context and logistics
    async analyzeEventContext(eventData) {
        const prompt = `
Analyze this event context and provide strategic communications guidance:

EVENT: ${eventData.what || 'Event'}
WHEN: ${eventData.when || 'TBD'}
WHERE: ${eventData.where || 'TBD'}
AUDIENCE: ${eventData.audience || 'General'}
SIZE: ${eventData.audienceSize || 'Unknown'}
PURPOSE: ${eventData.purpose || 'General communications'}

Provide strategic analysis:
{
    "eventAssessment": {
        "newsValue": "Low/Medium/High",
        "mediaOpportunity": "Assessment of press potential",
        "risks": ["potential issues"],
        "opportunities": ["strategic advantages"]
    },
    "audienceStrategy": {
        "primaryTarget": "Who we're really trying to reach",
        "secondaryAudience": "Others who will hear message",
        "communicationStyle": "How to speak to this group",
        "motivationalApproach": "What moves this audience"
    },
    "logisticalConsiderations": {
        "timing": "Strategic timing analysis",
        "venue": "Location implications",
        "format": "Best communication format",
        "followUp": "Next steps planning"
    },
    "messageFraming": {
        "openingHook": "How to start strong",
        "coreNarrative": "Main story to tell",
        "closingCall": "How to end with impact"
    }
}`;

        try {
            const response = await generateCompletion(prompt, {
                temperature: 0.7,
                maxTokens: 900
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Event context analysis error:', error);
            return this.getFallbackEventAnalysis(eventData);
        }
    }

    // Generate professional brief templates
    async generateBriefTemplate(templateType) {
        const templatePrompts = {
            'healthcare-policy': `Create a professional healthcare policy speech brief template with all required fields and strategic guidance.`,
            'crisis-response': `Create a crisis response communications brief template for rapid deployment during campaign emergencies.`,
            'endorsement-announcement': `Create an endorsement announcement brief template for securing and announcing key endorsements.`,
            'debate-prep': `Create a debate preparation brief template for preparing candidates for political debates.`,
            'press-conference': `Create a press conference brief template for major announcements and media events.`,
            'town-hall': `Create a town hall meeting brief template for community engagement events.`,
            'policy-brief': `Create a comprehensive policy brief template for detailed policy analysis, research, and position development.`
        };

        const prompt = `${templatePrompts[templateType]}

Return a comprehensive template with:
{
    "template": {
        "name": "Template name",
        "description": "When to use this template",
        "fields": {
            "header": {
                "title": "Brief title guidance",
                "priority": "Priority level options",
                "deadline": "Deadline considerations",
                "assignee": "Who should handle this type"
            },
            "strategic": {
                "primaryMessage": "Primary message guidance",
                "supportingMessages": "Supporting points structure",
                "strategicPurpose": "Campaign goal alignment"
            },
            "content": {
                "mustInclude": "Essential content elements",
                "tone": "Appropriate tone options",
                "duration": "Length considerations"
            },
            "logistics": {
                "eventDetails": "Event planning requirements",
                "resources": "Required materials",
                "reviewProcess": "Approval workflow"
            }
        },
        "example": "Complete example brief using this template",
        "bestPractices": ["Key tips for this brief type"]
    }
}`;

        try {
            const response = await generateCompletion(prompt, {
                temperature: 0.6,
                maxTokens: 1200
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Template generation error:', error);
            return this.getFallbackTemplate(templateType);
        }
    }

    // Policy brief analysis - specialized for policy documents
    async analyzePolicyBrief(policyData) {
        const prompt = `
As a senior policy advisor and political strategist, analyze this policy brief and provide comprehensive recommendations:

POLICY BRIEF DATA:
Title: ${policyData.title || 'Untitled Policy'}
Issue Area: ${policyData.issueArea || 'General Policy'}
Policy Position: ${policyData.policyPosition || 'No position stated'}
Supporting Evidence: ${policyData.evidence || 'No evidence provided'}
Opposition Arguments: ${policyData.oppositionArgs || 'No opposition analysis'}
Implementation Timeline: ${policyData.timeline || 'No timeline provided'}

ANALYSIS REQUIREMENTS:
1. POLICY STRENGTH ASSESSMENT: Evaluate the policy's viability and political appeal
2. MESSAGING STRATEGY: How to communicate this policy effectively
3. VULNERABILITY ANALYSIS: Where opponents will attack and how to defend
4. STAKEHOLDER MAPPING: Who supports/opposes and why
5. IMPLEMENTATION FEASIBILITY: Real-world challenges and solutions
6. POLITICAL TIMING: When and how to roll out this policy

Return JSON:
{
    "policyStrength": {
        "viabilityScore": 8.5,
        "politicalAppeal": "High appeal to base, moderate crossover potential",
        "strengths": ["Clear benefits", "Precedent exists"],
        "weaknesses": ["Cost concerns", "Implementation complexity"]
    },
    "messagingStrategy": {
        "primaryFrame": "Economic fairness and opportunity",
        "targetAudiences": {
            "base": "Economic justice messaging",
            "swing": "Practical benefits focus",
            "opponents": "Cost savings emphasis"
        },
        "keyTalkingPoints": ["Specific benefits", "Success stories"]
    },
    "vulnerabilityAnalysis": {
        "majorAttackVectors": ["Cost", "Government overreach", "Unintended consequences"],
        "defensiveStrategy": "Proactive cost analysis and local examples",
        "anticipatedQuestions": ["How will you pay for it?", "What if it doesn't work?"]
    },
    "stakeholderMapping": {
        "strongSupport": ["Labor unions", "Progressive groups"],
        "leanSupport": ["Some business groups"],
        "opposition": ["Conservative think tanks", "Competing industries"],
        "persuadable": ["Moderate voters", "Independent groups"]
    },
    "implementationPlan": {
        "phase1": "Pilot program in select areas",
        "phase2": "Statewide rollout with metrics",
        "keyMilestones": ["90-day review", "Annual assessment"],
        "successMetrics": ["Enrollment numbers", "Cost savings", "Satisfaction rates"]
    },
    "politicalTiming": {
        "optimalRelease": "6 months before election",
        "supportingEvents": ["Town halls", "Stakeholder endorsements"],
        "mediaStrategy": "Policy rollout with real people stories",
        "legislativeStrategy": "Build coalition before announcing"
    },
    "overallRecommendation": "Strong policy with clear benefits but needs better cost analysis",
    "nextSteps": ["Conduct cost-benefit analysis", "Build stakeholder coalition"]
}`;

        try {
            const response = await generateCompletion(prompt, {
                temperature: 0.7,
                maxTokens: 1200
            });

            return JSON.parse(response);
        } catch (error) {
            console.error('Policy brief analysis error:', error);
            return this.getFallbackPolicyAnalysis(policyData);
        }
    }

    // Comprehensive brief enhancement that combines all analyses
    async enhanceBrief(briefData) {
        try {
            const isPolicy = briefData.type === 'policy-brief';

            const analyses = await Promise.all([
                this.analyzeStrategicFramework(briefData),
                this.generateContentRequirements(briefData),
                briefData.eventContext ? this.analyzeEventContext(briefData.eventContext) : null,
                isPolicy ? this.analyzePolicyBrief(briefData) : null
            ]);

            const [strategic, requirements, eventAnalysis, policyAnalysis] = analyses;

            return {
                success: true,
                originalBrief: briefData,
                enhancements: {
                    strategic,
                    requirements,
                    eventAnalysis,
                    policyAnalysis
                },
                aiRecommendations: [
                    ...strategic.recommendations || [],
                    ...requirements.qualityChecks || [],
                    ...(policyAnalysis?.nextSteps || [])
                ],
                overallScore: strategic.effectivenessScore || 7.0,
                processingTime: new Date().toISOString()
            };
        } catch (error) {
            console.error('Brief enhancement error:', error);
            throw error;
        }
    }

    // Fallback methods for when AI service fails
    getFallbackStrategicAnalysis(briefData) {
        return {
            primaryMessage: `${briefData.title} - [Primary message needed]`,
            supportingMessages: [
                "Supporting point 1 - [Add specific details]",
                "Supporting point 2 - [Add evidence/credibility]",
                "Supporting point 3 - [Add emotional appeal]"
            ],
            strategicPurpose: "Advance campaign messaging goals",
            audienceInsights: {
                primaryConcerns: ["Economic issues", "Healthcare", "Education"],
                motivationalFrames: ["Personal stories", "Local impact"],
                communicationStyle: "Direct and relatable"
            },
            messageOptimization: {
                strengthAreas: ["Clear topic"],
                improvementAreas: ["More specific details needed"],
                specificSuggestions: ["Add concrete examples", "Include statistics"]
            },
            effectivenessScore: 6.0,
            recommendations: ["Add specific examples", "Include call to action", "Personalize for audience"]
        };
    }

    getFallbackContentRequirements(briefData) {
        return {
            mustInclude: {
                candidateElements: ["Relevant experience", "Local connections"],
                policyPositions: ["Key platform items"],
                statistics: ["Supporting data"],
                localConnections: ["Community references"],
                defensivePoints: ["Address common concerns"]
            },
            callToAction: {
                primary: "Vote on election day",
                secondary: ["Visit campaign website", "Volunteer", "Donate"]
            },
            qualityChecks: ["Fact-check all claims", "Verify statistics"],
            legalConsiderations: ["FEC compliance", "Truthfulness"],
            messageDiscipline: ["Stay on approved talking points"]
        };
    }

    getFallbackEventAnalysis(eventData) {
        return {
            eventAssessment: {
                newsValue: "Medium",
                mediaOpportunity: "Standard coverage expected",
                risks: ["Off-message questions"],
                opportunities: ["Direct voter contact"]
            },
            audienceStrategy: {
                primaryTarget: "Undecided voters",
                secondaryAudience: "Media coverage",
                communicationStyle: "Conversational and authentic",
                motivationalApproach: "Address concerns directly"
            },
            logisticalConsiderations: {
                timing: "Prime time for media attention",
                venue: "Accessible location",
                format: "Prepared remarks + Q&A",
                followUp: "Press availability"
            },
            messageFraming: {
                openingHook: "Personal story or local reference",
                coreNarrative: "Problem, solution, action",
                closingCall: "Clear ask of audience"
            }
        };
    }

    getFallbackPolicyAnalysis(policyData) {
        return {
            policyStrength: {
                viabilityScore: 6.5,
                politicalAppeal: "Moderate appeal, needs more analysis",
                strengths: ["Addresses real problem", "Some precedent exists"],
                weaknesses: ["Needs more research", "Cost analysis required"]
            },
            messagingStrategy: {
                primaryFrame: "Common-sense solutions for working families",
                targetAudiences: {
                    base: "Economic fairness messaging",
                    swing: "Practical benefits focus",
                    opponents: "Fiscal responsibility emphasis"
                },
                keyTalkingPoints: ["Real-world benefits", "Proven solutions"]
            },
            vulnerabilityAnalysis: {
                majorAttackVectors: ["Cost concerns", "Government overreach", "Implementation challenges"],
                defensiveStrategy: "Proactive cost-benefit analysis with local examples",
                anticipatedQuestions: ["How will you pay for it?", "What's the timeline?"]
            },
            stakeholderMapping: {
                strongSupport: ["Base voters"],
                leanSupport: ["Some community groups"],
                opposition: ["Status quo interests"],
                persuadable: ["Independent voters", "Moderate groups"]
            },
            implementationPlan: {
                phase1: "Research and coalition building",
                phase2: "Pilot program development",
                keyMilestones: ["Stakeholder meetings", "Public input"],
                successMetrics: ["Support levels", "Feasibility assessment"]
            },
            politicalTiming: {
                optimalRelease: "After thorough analysis",
                supportingEvents: ["Community forums", "Expert panels"],
                mediaStrategy: "Educational approach with stakeholder voices",
                legislativeStrategy: "Build bipartisan support"
            },
            overallRecommendation: "Promising policy direction but needs deeper analysis",
            nextSteps: ["Conduct comprehensive research", "Build stakeholder coalition", "Develop cost analysis"]
        };
    }

    getFallbackTemplate(templateType) {
        return {
            template: {
                name: `${templateType} Template`,
                description: `Standard template for ${templateType} communications`,
                fields: {
                    header: {
                        title: "Descriptive title that captures the purpose",
                        priority: "High/Medium/Low based on strategic importance",
                        deadline: "Consider event timing and review needs",
                        assignee: "Match writer expertise to content type"
                    }
                },
                example: `Example ${templateType} brief would go here`,
                bestPractices: [`Focus on clear messaging`, `Prepare for likely questions`]
            }
        };
    }
}

module.exports = new BriefEnhancementAnalyzer();