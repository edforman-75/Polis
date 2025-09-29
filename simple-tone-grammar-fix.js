// Simple working tone and grammar analysis functions
// These replace the complex, broken functions in app.js

// Simple tone analysis function
async function simpleToneAnalysis() {
    const textToAnalyze = document.getElementById('paste-input').value;

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
        alert('Please paste some text to analyze');
        return;
    }

    const toneContent = document.getElementById('tone-content');
    toneContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #007cba;">🎭 Analyzing tone...</div>';

    try {
        const response = await fetch('/api/analyze/tone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: textToAnalyze,
                campaignProfile: null
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Tone analysis failed');
        }

        // Display the results
        displayToneResults(result.analysis);

    } catch (error) {
        console.error('Tone analysis error:', error);
        toneContent.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; border: 1px solid #f5c6cb;">
                <h3>❌ Tone Analysis Failed</h3>
                <p><strong>Error:</strong> ${error.message}</p>
            </div>
        `;
    }
}

// Simple grammar analysis function
async function simpleGrammarAnalysis() {
    const textToAnalyze = document.getElementById('paste-input').value;

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
        alert('Please paste some text to analyze');
        return;
    }

    const grammarContent = document.getElementById('grammar-content');
    grammarContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #007cba;">📝 Analyzing grammar...</div>';

    try {
        const response = await fetch('/api/analyze/grammar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToAnalyze })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Grammar analysis failed');
        }

        // Display the results
        displayGrammarResults(result.analysis);

    } catch (error) {
        console.error('Grammar analysis error:', error);
        grammarContent.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; border: 1px solid #f5c6cb;">
                <h3>❌ Grammar Analysis Failed</h3>
                <p><strong>Error:</strong> ${error.message}</p>
            </div>
        `;
    }
}

// Display tone analysis results
function displayToneResults(analysis) {
    const toneContent = document.getElementById('tone-content');

    // Handle different possible data structures
    const overallScore = analysis.overall_score?.score || analysis.overall_score || 'N/A';
    const overallTone = analysis.overall_tone || 'Neutral';
    const toneScores = analysis.tone_scores || {};
    const sentiment = analysis.sentiment_analysis || {};
    const recommendations = analysis.recommendations || [];

    let html = `
        <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 4px; border: 1px solid #c3e6cb; margin-bottom: 1rem;">
            <h3>✅ Tone Analysis Complete!</h3>
            <div style="font-size: 1.2rem; margin: 1rem 0;">
                <strong>Overall Score:</strong> ${overallScore}% | <strong>Tone:</strong> ${overallTone}
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
            <h4>📊 Detailed Results</h4>
            <div style="margin: 0.5rem 0;"><strong>Text Length:</strong> ${analysis.text_length || document.getElementById('paste-input').value.length} characters</div>
    `;

    // Add tone scores if available
    if (Object.keys(toneScores).length > 0) {
        html += '<div style="margin: 1rem 0;"><strong>Tone Breakdown:</strong><ul>';
        for (const [tone, score] of Object.entries(toneScores)) {
            html += `<li>${tone}: ${score}%</li>`;
        }
        html += '</ul></div>';
    }

    // Add sentiment if available
    if (Object.keys(sentiment).length > 0) {
        html += '<div style="margin: 1rem 0;"><strong>Sentiment:</strong><ul>';
        for (const [key, value] of Object.entries(sentiment)) {
            html += `<li>${key}: ${value}</li>`;
        }
        html += '</ul></div>';
    }

    // Add recommendations if available
    if (recommendations.length > 0) {
        html += '<div style="margin: 1rem 0;"><strong>Recommendations:</strong><ul>';
        recommendations.forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        html += '</ul></div>';
    }

    html += `
            <details style="margin-top: 1rem;">
                <summary style="cursor: pointer; color: #007cba;">View Raw Results</summary>
                <pre style="background: #f1f1f1; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.8rem;">${JSON.stringify(analysis, null, 2)}</pre>
            </details>
        </div>
    `;

    toneContent.innerHTML = html;
}

// Display grammar analysis results
function displayGrammarResults(analysis) {
    const grammarContent = document.getElementById('grammar-content');

    // Handle different possible data structures
    const overallScore = analysis.overall_score || 'N/A';
    const grammarIssues = analysis.grammar_issues || [];
    const readabilityMetrics = analysis.readability_metrics || {};
    const recommendations = analysis.recommendations || [];

    let html = `
        <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 4px; border: 1px solid #c3e6cb; margin-bottom: 1rem;">
            <h3>✅ Grammar Analysis Complete!</h3>
            <div style="font-size: 1.2rem; margin: 1rem 0;">
                <strong>Overall Score:</strong> ${overallScore}%
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-bottom: 1rem;">
            <h4>📝 Grammar Results</h4>
            <div style="margin: 0.5rem 0;"><strong>Issues Found:</strong> ${grammarIssues.length}</div>
    `;

    // Add grammar issues if available
    if (grammarIssues.length > 0) {
        html += '<div style="margin: 1rem 0;"><strong>Grammar Issues:</strong><ul>';
        grammarIssues.forEach(issue => {
            if (typeof issue === 'object') {
                html += `<li><strong>${issue.type || 'Issue'}:</strong> ${issue.description || issue.message || JSON.stringify(issue)}</li>`;
            } else {
                html += `<li>${issue}</li>`;
            }
        });
        html += '</ul></div>';
    }

    // Add readability metrics if available
    if (Object.keys(readabilityMetrics).length > 0) {
        html += '<div style="margin: 1rem 0;"><strong>Readability:</strong><ul>';
        for (const [metric, value] of Object.entries(readabilityMetrics)) {
            html += `<li>${metric}: ${value}</li>`;
        }
        html += '</ul></div>';
    }

    // Add recommendations if available
    if (recommendations.length > 0) {
        html += '<div style="margin: 1rem 0;"><strong>Recommendations:</strong><ul>';
        recommendations.forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        html += '</ul></div>';
    }

    html += `
            <details style="margin-top: 1rem;">
                <summary style="cursor: pointer; color: #007cba;">View Raw Results</summary>
                <pre style="background: #f1f1f1; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.8rem;">${JSON.stringify(analysis, null, 2)}</pre>
            </details>
        </div>
    `;

    grammarContent.innerHTML = html;
}

console.log('✅ Simple tone and grammar analysis functions loaded');