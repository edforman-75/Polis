import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { SuggestionEngine } from '../components/SuggestionEngine';

export const useLiveAnalysis = (initialContent = {}) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiScore, setAiScore] = useState(50);
    const [content, setContent] = useState(initialContent);
    
    const suggestionEngine = useRef(new SuggestionEngine());
    const analysisTimeout = useRef(null);
    const lastAnalysis = useRef({});

    // Debounced content analysis
    const analyzeContent = useCallback(async (field, newValue, oldValue) => {
        // Clear existing timeout
        if (analysisTimeout.current) {
            clearTimeout(analysisTimeout.current);
        }

        // Don't analyze if content hasn't meaningfully changed
        if (newValue === oldValue || Math.abs(newValue.length - oldValue.length) < 3) {
            return;
        }

        setIsAnalyzing(true);

        // Debounce analysis by 1 second
        analysisTimeout.current = setTimeout(async () => {
            try {
                // Remove suggestions for this field
                setSuggestions(prevSuggestions => 
                    prevSuggestions.filter(s => s.field !== field)
                );

                // Generate new suggestions
                const newSuggestions = await suggestionEngine.current.generateSuggestionsForField(
                    field, 
                    newValue, 
                    content
                );

                // Add new suggestions
                setSuggestions(prevSuggestions => [
                    ...prevSuggestions,
                    ...newSuggestions
                ]);

                // Update last analysis cache
                lastAnalysis.current[field] = {
                    value: newValue,
                    timestamp: Date.now(),
                    suggestions: newSuggestions.length
                };

                // Recalculate AI score
                calculateAIScore();

            } catch (error) {
                console.error('Analysis error:', error);
            } finally {
                setIsAnalyzing(false);
            }
        }, 1000);
    }, [content]);

    // Update content and trigger analysis
    const updateContent = useCallback((field, newValue) => {
        const oldValue = content[field] || '';
        
        setContent(prevContent => ({
            ...prevContent,
            [field]: newValue
        }));

        // Trigger analysis if content changed significantly
        analyzeContent(field, newValue, oldValue);
    }, [content, analyzeContent]);

    // Calculate overall AI optimization score
    const calculateAIScore = useCallback(() => {
        let score = 50; // Base score
        
        // Headline optimization
        const headline = content.headline || '';
        if (headline.length > 0) {
            if (headline.length <= 60) score += 15;
            else score -= 10; // Penalty for long headlines
            
            if (headline.toLowerCase().match(/\b(announces|launches|introduces|reveals|proposes)\b/)) {
                score += 10;
            }
            
            // Location keywords
            if (headline.toLowerCase().match(/\b(texas|austin|houston|dallas|san antonio)\b/)) {
                score += 5;
            }
        }

        // Content quality checks
        const contentText = content.content || '';
        if (contentText.length > 300) score += 10;
        if (contentText.length > 800) score += 5;

        // Quote presence
        if ((content.quote || '').trim() !== '') score += 10;

        // Location field
        if ((content.location || '').trim() !== '') score += 5;

        // Penalties for unresolved suggestions
        const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high').length;
        const mediumPrioritySuggestions = suggestions.filter(s => s.priority === 'medium').length;
        
        score -= highPrioritySuggestions * 8;
        score -= mediumPrioritySuggestions * 3;

        // AI-specific content structure bonuses
        if (contentText.match(/\d+\s*(percent|%|jobs|dollars?|families|people)/gi)) {
            score += 5; // Bonus for specific numbers
        }
        
        if (contentText.match(/•|\d+\./g)) {
            score += 5; // Bonus for lists
        }

        // Voice search optimization
        const sentences = contentText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
        
        if (avgSentenceLength < 20) score += 5; // Bonus for shorter sentences

        // Ensure score is within bounds
        score = Math.max(0, Math.min(100, Math.round(score)));
        setAiScore(score);
        
        return score;
    }, [content, suggestions]);

    // Accept a suggestion
    const acceptSuggestion = useCallback((suggestionId, modifications = null) => {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return false;

        // Apply the suggestion to content
        if (suggestion.suggestedText && suggestion.currentText) {
            const field = suggestion.field;
            const currentValue = content[field] || '';
            const newValue = currentValue.replace(
                suggestion.currentText, 
                modifications || suggestion.suggestedText
            );
            
            setContent(prevContent => ({
                ...prevContent,
                [field]: newValue
            }));
        }

        // Log the acceptance
        suggestionEngine.current.acceptSuggestion(suggestionId, modifications);

        // Remove from suggestions
        setSuggestions(prevSuggestions => 
            prevSuggestions.filter(s => s.id !== suggestionId)
        );

        // Recalculate score
        calculateAIScore();

        return true;
    }, [suggestions, content, calculateAIScore]);

    // Reject a suggestion
    const rejectSuggestion = useCallback((suggestionId, reason = null) => {
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return false;

        // Log the rejection
        suggestionEngine.current.rejectSuggestion(suggestionId, reason);

        // Remove from suggestions
        setSuggestions(prevSuggestions => 
            prevSuggestions.filter(s => s.id !== suggestionId)
        );

        return true;
    }, [suggestions]);

    // Skip a suggestion (remove without feedback)
    const skipSuggestion = useCallback((suggestionId) => {
        // Log the skip
        suggestionEngine.current.skipSuggestion(suggestionId);

        // Remove from suggestions
        setSuggestions(prevSuggestions => 
            prevSuggestions.filter(s => s.id !== suggestionId)
        );

        return true;
    }, [suggestions]);

    // Get suggestions for a specific field
    const getSuggestionsForField = useCallback((field) => {
        return suggestions.filter(s => s.field === field);
    }, [suggestions]);

    // Get suggestions by type
    const getSuggestionsByType = useCallback((type) => {
        return suggestions.filter(s => s.type === type);
    }, [suggestions]);

    // Get suggestions by priority
    const getSuggestionsByPriority = useCallback((priority) => {
        return suggestions.filter(s => s.priority === priority);
    }, [suggestions]);

    // Perform initial analysis on mount
    useEffect(() => {
        const performInitialAnalysis = async () => {
            if (Object.keys(content).length === 0) return;

            setIsAnalyzing(true);
            
            try {
                const allSuggestions = await suggestionEngine.current.generateSuggestions(
                    content,
                    'press_release', // TODO: Make this dynamic
                    { preferredTone: 'professional', targetReadingLevel: 8 }
                );
                
                setSuggestions(allSuggestions);
                calculateAIScore();
            } catch (error) {
                console.error('Initial analysis error:', error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        performInitialAnalysis();
    }, []); // Only run on mount

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (analysisTimeout.current) {
                clearTimeout(analysisTimeout.current);
            }
        };
    }, []);

    // Public API
    return {
        // State
        suggestions,
        isAnalyzing,
        aiScore,
        content,
        
        // Actions
        updateContent,
        acceptSuggestion,
        rejectSuggestion,
        skipSuggestion,
        
        // Queries
        getSuggestionsForField,
        getSuggestionsByType,
        getSuggestionsByPriority,
        
        // Utilities
        calculateAIScore,
        
        // Stats
        totalSuggestions: suggestions.length,
        highPrioritySuggestions: suggestions.filter(s => s.priority === 'high').length,
        mediumPrioritySuggestions: suggestions.filter(s => s.priority === 'medium').length,
        lowPrioritySuggestions: suggestions.filter(s => s.priority === 'low').length,
        
        // Analysis metadata
        lastAnalyzed: Math.max(...Object.values(lastAnalysis.current).map(a => a.timestamp || 0)),
        analysisCache: lastAnalysis.current
    };
};

// Hook for suggestion tracking across the application
export const useSuggestionTracking = () => {
    const [activityLog, setActivityLog] = useState([]);
    const [userStats, setUserStats] = useState({
        totalSuggestions: 0,
        accepted: 0,
        rejected: 0,
        modified: 0,
        skipped: 0,
        acceptanceRate: 0
    });

    const logActivity = useCallback((action, suggestion, metadata = {}) => {
        const entry = {
            id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            action, // 'accepted', 'rejected', 'modified', 'skipped'
            suggestionId: suggestion.id,
            suggestionType: suggestion.type,
            suggestionTitle: suggestion.title,
            field: suggestion.field,
            ...metadata
        };

        setActivityLog(prevLog => [entry, ...prevLog.slice(0, 49)]); // Keep last 50 entries

        // Update stats
        setUserStats(prevStats => {
            const newStats = { ...prevStats };
            newStats.totalSuggestions++;
            newStats[action]++;
            newStats.acceptanceRate = newStats.totalSuggestions > 0 
                ? Math.round(((newStats.accepted + newStats.modified) / newStats.totalSuggestions) * 100)
                : 0;
            return newStats;
        });
    }, []);

    const getTodaysActivity = useCallback(() => {
        const today = new Date().toDateString();
        return activityLog.filter(entry => 
            new Date(entry.timestamp).toDateString() === today
        );
    }, [activityLog]);

    const getActivityByType = useCallback((type) => {
        return activityLog.filter(entry => entry.suggestionType === type);
    }, [activityLog]);

    return {
        activityLog,
        userStats,
        logActivity,
        getTodaysActivity,
        getActivityByType,
        
        // Convenience getters
        todaysActivity: getTodaysActivity(),
        todaysAccepted: getTodaysActivity().filter(a => a.action === 'accepted').length,
        todaysTotal: getTodaysActivity().length
    };
};