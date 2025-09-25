<?php
/**
 * Plugin Name: Campaign AI Editor
 * Description: AI-optimized Gutenberg editor for political campaigns with LD-JSON markup and content coaching
 * Version: 1.0.0
 * Author: Campaign Tech Solutions
 */

// Register custom block categories
add_filter('block_categories_all', function($categories) {
    return array_merge(
        [
            [
                'slug' => 'campaign-core',
                'title' => 'Campaign Core',
                'icon' => 'megaphone'
            ],
            [
                'slug' => 'campaign-schema',
                'title' => 'Schema-Enhanced',
                'icon' => 'code-standards'
            ],
            [
                'slug' => 'campaign-ai',
                'title' => 'AI-Optimized',
                'icon' => 'lightbulb'
            ]
        ],
        $categories
    );
});

// Register custom post types for campaign content
add_action('init', function() {
    // Press Releases
    register_post_type('press_release', [
        'label' => 'Press Releases',
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'custom-fields'],
        'template' => [
            ['campaign/press-release-header'],
            ['campaign/key-points'],
            ['core/paragraph'],
            ['campaign/quote-with-attribution'],
            ['campaign/contact-info']
        ]
    ]);

    // Policy Papers
    register_post_type('policy_paper', [
        'label' => 'Policy Papers',
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'custom-fields'],
        'template' => [
            ['campaign/policy-header'],
            ['campaign/executive-summary'],
            ['campaign/policy-points'],
            ['campaign/implementation-timeline'],
            ['campaign/budget-impact']
        ]
    ]);

    // Events
    register_post_type('campaign_event', [
        'label' => 'Campaign Events',
        'public' => true,
        'show_in_rest' => true,
        'supports' => ['title', 'editor', 'custom-fields'],
        'template' => [
            ['campaign/event-schema'],
            ['campaign/event-details'],
            ['campaign/speaker-bio'],
            ['campaign/rsvp-block']
        ]
    ]);
});

// Enqueue editor scripts and styles
add_action('enqueue_block_editor_assets', function() {
    wp_enqueue_script(
        'campaign-ai-editor',
        plugins_url('build/index.js', __FILE__),
        ['wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-data'],
        '1.0.0'
    );

    wp_enqueue_style(
        'campaign-ai-editor',
        plugins_url('build/editor.css', __FILE__),
        ['wp-edit-blocks'],
        '1.0.0'
    );

    // Pass configuration to JavaScript
    wp_localize_script('campaign-ai-editor', 'campaignAI', [
        'candidateProfile' => get_option('campaign_candidate_profile', []),
        'voiceSettings' => get_option('campaign_voice_settings', []),
        'schemaDefaults' => get_option('campaign_schema_defaults', []),
        'aiOptimizationRules' => get_campaign_ai_rules(),
        'grammarAPI' => get_option('campaign_grammar_api', '')
    ]);
});

// AI Optimization Rules
function get_campaign_ai_rules() {
    return [
        'keywords' => [
            'primary' => get_option('campaign_primary_keywords', []),
            'issues' => get_option('campaign_issue_keywords', []),
            'geo' => get_option('campaign_geo_keywords', [])
        ],
        'voice' => [
            'tone' => get_option('campaign_tone', 'professional'),
            'readingLevel' => get_option('campaign_reading_level', 8),
            'sentenceLength' => get_option('campaign_sentence_length', 20)
        ],
        'seo' => [
            'minWordCount' => 300,
            'maxWordCount' => 2000,
            'keywordDensity' => 0.02,
            'headingStructure' => true
        ],
        'schema' => [
            'required' => ['Person', 'Organization', 'Event'],
            'recommended' => ['FAQPage', 'HowTo', 'NewsArticle']
        ]
    ];
}

// Register REST API endpoints for AI features
add_action('rest_api_init', function() {
    // Voice consistency check
    register_rest_route('campaign-ai/v1', '/check-voice', [
        'methods' => 'POST',
        'callback' => 'check_voice_consistency',
        'permission_callback' => '__return_true'
    ]);

    // Schema validation
    register_rest_route('campaign-ai/v1', '/validate-schema', [
        'methods' => 'POST',
        'callback' => 'validate_schema_markup',
        'permission_callback' => '__return_true'
    ]);

    // AI optimization suggestions
    register_rest_route('campaign-ai/v1', '/optimize', [
        'methods' => 'POST',
        'callback' => 'get_ai_optimization_suggestions',
        'permission_callback' => '__return_true'
    ]);

    // Grammar check
    register_rest_route('campaign-ai/v1', '/grammar', [
        'methods' => 'POST',
        'callback' => 'check_grammar',
        'permission_callback' => '__return_true'
    ]);
});

// Schema generation helper
function generate_campaign_schema($type, $data) {
    $schemas = [
        'Person' => [
            '@context' => 'https://schema.org',
            '@type' => 'Person',
            'name' => $data['name'] ?? '',
            'jobTitle' => $data['title'] ?? 'Candidate',
            'description' => $data['bio'] ?? '',
            'url' => $data['website'] ?? '',
            'sameAs' => $data['social'] ?? [],
            'memberOf' => [
                '@type' => 'Organization',
                'name' => $data['party'] ?? ''
            ]
        ],
        'Event' => [
            '@context' => 'https://schema.org',
            '@type' => 'Event',
            'name' => $data['title'] ?? '',
            'startDate' => $data['startDate'] ?? '',
            'endDate' => $data['endDate'] ?? '',
            'location' => [
                '@type' => 'Place',
                'name' => $data['venue'] ?? '',
                'address' => [
                    '@type' => 'PostalAddress',
                    'streetAddress' => $data['street'] ?? '',
                    'addressLocality' => $data['city'] ?? '',
                    'addressRegion' => $data['state'] ?? '',
                    'postalCode' => $data['zip'] ?? ''
                ]
            ],
            'organizer' => [
                '@type' => 'Organization',
                'name' => $data['campaign'] ?? ''
            ]
        ],
        'NewsArticle' => [
            '@context' => 'https://schema.org',
            '@type' => 'NewsArticle',
            'headline' => $data['title'] ?? '',
            'datePublished' => $data['date'] ?? date('c'),
            'author' => [
                '@type' => 'Person',
                'name' => $data['author'] ?? ''
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => $data['campaign'] ?? '',
                'logo' => [
                    '@type' => 'ImageObject',
                    'url' => $data['logo'] ?? ''
                ]
            ]
        ]
    ];

    return json_encode($schemas[$type] ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}

// Voice consistency checker
function check_voice_consistency($request) {
    $content = $request->get_param('content');
    $voiceProfile = get_option('campaign_voice_profile', []);
    
    // This would connect to an AI service in production
    // For MVP, we'll simulate the analysis
    $analysis = [
        'consistency' => 0.85,
        'suggestions' => [
            'Replace "I think" with stronger statements like "I believe" or "I know"',
            'Use more active voice constructions',
            'Include campaign messaging keywords: "integrity", "community", "progress"'
        ],
        'tone' => [
            'current' => 'casual',
            'target' => 'professional-approachable'
        ]
    ];
    
    return rest_ensure_response($analysis);
}

// AI optimization suggestions
function get_ai_optimization_suggestions($request) {
    $content = $request->get_param('content');
    $type = $request->get_param('type');
    
    // Simulate AI analysis
    $suggestions = [
        'seo' => [
            'score' => 72,
            'improvements' => [
                'Add location-specific keywords for better local search visibility',
                'Include long-tail keywords that match voice search queries',
                'Add FAQ section with common voter questions'
            ]
        ],
        'aiDiscoverability' => [
            'score' => 68,
            'improvements' => [
                'Structure content with clear Q&A format for AI extraction',
                'Add definitive statements that AI can quote',
                'Include numbered lists for better AI summarization',
                'Add context about "why" not just "what" for deeper AI understanding'
            ]
        ],
        'schemaCompleteness' => [
            'score' => 45,
            'missing' => [
                'speakable' => 'Add speakable schema for voice assistants',
                'mentions' => 'Include mentions of key policies and positions',
                'isPartOf' => 'Link to broader campaign narrative'
            ]
        ],
        'readability' => [
            'score' => 82,
            'level' => 'Grade 8',
            'improvements' => [
                'Shorten sentence in paragraph 3 (currently 42 words)',
                'Define technical term "infrastructure investment" on first use'
            ]
        ]
    ];
    
    return rest_ensure_response($suggestions);
}

// Grammar check integration
function check_grammar($request) {
    $content = $request->get_param('content');
    
    // In production, this would connect to LanguageTool or similar API
    $issues = [
        [
            'offset' => 45,
            'length' => 10,
            'message' => 'Consider using "will" instead of "shall" for modern tone',
            'type' => 'style'
        ],
        [
            'offset' => 120,
            'length' => 5,
            'message' => 'Possible subject-verb disagreement',
            'type' => 'grammar'
        ]
    ];
    
    return rest_ensure_response(['issues' => $issues]);
}