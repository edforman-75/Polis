class CampaignContentEditor {
    constructor() {
        this.currentDocument = null;
        this.narrativeAnalysis = null;
        this.aiOptimizationAnalysis = null;
        this.originalText = '';
        this.revisedText = '';

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', this.switchInputTab.bind(this));
        });

        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Surface controls
        document.querySelectorAll('.surface-btn').forEach(btn => {
            btn.addEventListener('click', this.switchSurface.bind(this));
        });

        // Layout controls
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', this.switchLayout.bind(this));
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    switchInputTab(e) {
        const tab = e.target.dataset.tab;

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Show appropriate tab content
        document.querySelectorAll('.input-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${tab}-tab`).style.display = 'block';
    }

    async processFile(file) {
        this.showLoading();
        this.hideError();

        try {
            // Upload and extract text
            const formData = new FormData();
            formData.append('document', file);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
            }

            this.currentDocument = uploadResult;
            this.originalText = uploadResult.text;

            // Perform analyses in parallel
            const [narrativeResult, aiOptimizationResult] = await Promise.all([
                this.analyzeNarrative(uploadResult.text),
                this.analyzeAIOptimization(uploadResult.text)
            ]);

            this.narrativeAnalysis = narrativeResult;
            this.aiOptimizationAnalysis = aiOptimizationResult;

            // Show analysis interface
            this.displayAnalysis();
            this.hideLoading();

        } catch (error) {
            console.error('Error processing file:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    async analyzeNarrative(text) {
        const response = await fetch('/api/analyze/narrative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`Narrative analysis failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Narrative analysis failed');
        }

        return result.analysis;
    }

    async analyzeAIOptimization(text) {
        const response = await fetch('/api/analyze/ai-optimization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error(`AI optimization analysis failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'AI optimization analysis failed');
        }

        return result.analysis;
    }

    async analyzeTone(text = null) {
        const textToAnalyze = text || this.getCurrentText();
        if (!textToAnalyze) {
            alert('Please paste some text to analyze');
            return;
        }

        try {
            this.showLoading();

            const campaignProfile = this.getCampaignProfile();
            const response = await fetch('/api/analyze/tone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToAnalyze,
                    campaignProfile
                })
            });

            if (!response.ok) {
                throw new Error(`Tone analysis failed: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Tone analysis failed');
            }

            this.displayToneAnalysis(result.analysis);
            this.hideLoading();

        } catch (error) {
            console.error('🚨 FRONTEND TONE ANALYSIS ERROR:');
            console.error('Error type:', typeof error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error object:', error);

            // Try to get more detailed error from response
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response text:', await error.response.text());
            }

            this.showError(`Failed to analyze tone: ${error.message}`);
            this.hideLoading();
        }
    }

    async analyzeGrammar(text = null) {
        const textToAnalyze = text || this.getCurrentText();
        if (!textToAnalyze) {
            alert('Please paste some text to analyze');
            return;
        }

        try {
            this.showLoading();

            const response = await fetch('/api/analyze/grammar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToAnalyze })
            });

            if (!response.ok) {
                throw new Error(`Grammar analysis failed: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Grammar analysis failed');
            }

            this.displayGrammarAnalysis(result.analysis);
            this.hideLoading();

        } catch (error) {
            console.error('🚨 FRONTEND GRAMMAR ANALYSIS ERROR:');
            console.error('Error type:', typeof error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error object:', error);

            // Try to get more detailed error from response
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response text:', await error.response.text());
            }

            this.showError(`Failed to analyze grammar: ${error.message}`);
            this.hideLoading();
        }
    }

    async setupToneProfile() {
        try {
            // Get template
            const templateResponse = await fetch('/api/setup/tone-profile/template');
            const templateData = await templateResponse.json();

            if (!templateData.success) {
                throw new Error('Failed to load setup template');
            }

            this.showToneProfileSetup(templateData.template, templateData.options);

        } catch (error) {
            console.error('Setup error:', error);
            this.showError(error.message);
        }
    }

    getCampaignProfile() {
        // Check if profile is stored in localStorage
        const stored = localStorage.getItem('campaignToneProfile');
        return stored ? JSON.parse(stored) : null;
    }

    setCampaignProfile(profile) {
        localStorage.setItem('campaignToneProfile', JSON.stringify(profile));
    }

    displayToneAnalysis(analysis) {
        const content = document.getElementById('tone-content');
        const scoreElement = document.getElementById('tone-score');

        if (scoreElement) {
            scoreElement.textContent = `Score: ${analysis.overall_tone_score}/100`;
        }

        let html = `
            <div class="analysis-result">
                <div class="score-display">
                    <h3>Overall Tone Score: ${analysis.overall_tone_score}/100</h3>
                    <p class="score-description">${this.getScoreDescription(analysis.overall_tone_score)}</p>
                </div>

                <div class="tone-breakdown">
                    <h4>Tone Analysis</h4>
                    ${Object.entries(analysis.tone_scores).map(([tone, score]) => `
                        <div class="tone-item">
                            <span class="tone-name">${tone.charAt(0).toUpperCase() + tone.slice(1)}</span>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${score}%"></div>
                            </div>
                            <span class="score-value">${score}%</span>
                        </div>
                    `).join('')}
                </div>

                <div class="sentiment-analysis">
                    <h4>Sentiment Analysis</h4>
                    <div class="sentiment-item">
                        <strong>Overall Sentiment:</strong> ${analysis.sentiment_analysis.sentiment_label}
                        <span class="sentiment-score">(${analysis.sentiment_analysis.sentiment_score.toFixed(2)})</span>
                    </div>
                </div>

                ${analysis.recommendations.length > 0 ? `
                    <div class="recommendations">
                        <h4>Recommendations</h4>
                        <ul>
                            ${analysis.recommendations.map(rec => `
                                <li class="recommendation ${rec.priority}">
                                    <strong>${rec.title}:</strong> ${rec.description}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        content.innerHTML = html;
    }

    displayGrammarAnalysis(analysis) {
        const content = document.getElementById('grammar-content');
        const scoreElement = document.getElementById('grammar-score');

        if (scoreElement) {
            scoreElement.textContent = `Score: ${analysis.overall_score}/100`;
        }

        let html = `
            <div class="analysis-result">
                <div class="score-display">
                    <h3>Overall Grammar Score: ${analysis.overall_score}/100</h3>
                    <p class="score-description">${this.getScoreDescription(analysis.overall_score)}</p>
                </div>

                <div class="readability-metrics">
                    <h4>Readability Metrics</h4>
                    <div class="metric-grid">
                        <div class="metric-item">
                            <span class="metric-label">Flesch Reading Ease:</span>
                            <span class="metric-value">${analysis.readability_metrics.flesch_reading_ease}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Readability Level:</span>
                            <span class="metric-value">${analysis.readability_metrics.readability_level}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Avg Words per Sentence:</span>
                            <span class="metric-value">${analysis.readability_metrics.avg_words_per_sentence}</span>
                        </div>
                    </div>
                </div>

                ${analysis.grammar_issues.length > 0 ? `
                    <div class="grammar-issues">
                        <h4>Grammar Issues</h4>
                        <div class="issue-summary">
                            <span class="issue-count high">High: ${analysis.issue_summary.by_severity.high}</span>
                            <span class="issue-count medium">Medium: ${analysis.issue_summary.by_severity.medium}</span>
                            <span class="issue-count low">Low: ${analysis.issue_summary.by_severity.low}</span>
                        </div>
                        <ul class="issue-list">
                            ${analysis.grammar_issues.slice(0, 10).map(issue => `
                                <li class="issue-item ${issue.severity}">
                                    <strong>${issue.type.replace(/_/g, ' ')}:</strong> ${issue.message}
                                    ${issue.suggestion ? `<br><em>Suggestion: ${issue.suggestion}</em>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                        ${analysis.grammar_issues.length > 10 ? `<p><em>And ${analysis.grammar_issues.length - 10} more issues...</em></p>` : ''}
                    </div>
                ` : '<div class="no-issues"><p>✅ No significant grammar issues detected!</p></div>'}

                ${analysis.recommendations.length > 0 ? `
                    <div class="recommendations">
                        <h4>Recommendations</h4>
                        <ul>
                            ${analysis.recommendations.map(rec => `
                                <li class="recommendation ${rec.priority}">
                                    <strong>${rec.title}:</strong> ${rec.description}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        content.innerHTML = html;
    }

    getScoreDescription(score) {
        if (score >= 90) return 'Excellent quality';
        if (score >= 80) return 'Good quality';
        if (score >= 70) return 'Acceptable quality';
        if (score >= 60) return 'Needs improvement';
        return 'Significant issues found';
    }

    getCurrentText() {
        const activeTab = document.querySelector('.tab-btn.active');
        if (!activeTab) return '';

        const tabName = activeTab.dataset.tab;
        if (tabName === 'paste') {
            return document.getElementById('paste-input').value;
        } else if (tabName === 'file' && this.originalText) {
            return this.originalText;
        }
        return '';
    }

    displayAnalysis() {
        // Show analysis container
        document.getElementById('analysis-container').style.display = 'block';

        // Display copy surface
        this.displayCopySurface();

        // Display narrative surface
        this.displayNarrativeSurface();

        // Display AI optimization surface
        this.displayAIOptimizationSurface();

        // Update metadata displays
        this.updateMetadataDisplays();

        // Run all analyses automatically
        this.runAllAnalyses();
    }

    displayCopySurface() {
        const copyContent = document.getElementById('copy-content');
        copyContent.textContent = this.originalText;
    }

    displayNarrativeSurface() {
        const narrativeContent = document.getElementById('narrative-content');

        if (!this.narrativeAnalysis) {
            narrativeContent.innerHTML = '<p>No narrative analysis available.</p>';
            return;
        }

        // Create score display
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score-display';
        scoreDisplay.innerHTML = `
            <div class="score-number">${this.narrativeAnalysis.overall_score.score}</div>
            <div class="score-grade">Grade: ${this.narrativeAnalysis.overall_score.grade}</div>
        `;

        // Create narrative blocks
        const blocksContainer = document.createElement('div');
        blocksContainer.className = 'narrative-blocks';

        for (const [blockKey, blockData] of Object.entries(this.narrativeAnalysis.narrative_blocks)) {
            const blockElement = this.createNarrativeBlock(blockKey, blockData);
            blocksContainer.appendChild(blockElement);
        }

        narrativeContent.innerHTML = '';
        narrativeContent.appendChild(scoreDisplay);
        narrativeContent.appendChild(blocksContainer);

        // Add recommendations
        if (this.narrativeAnalysis.recommendations && this.narrativeAnalysis.recommendations.length > 0) {
            const recommendationsSection = document.createElement('div');
            recommendationsSection.style.marginTop = '2rem';
            recommendationsSection.innerHTML = `
                <h3 style="margin-bottom: 1rem; color: #0f172a;">Recommendations</h3>
                ${this.narrativeAnalysis.recommendations.map(rec => `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 0.5rem;">
                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 0.25rem;">${rec.suggestion}</div>
                        <div style="font-size: 0.85rem; color: #64748b;">Priority: ${rec.priority}</div>
                    </div>
                `).join('')}
            `;
            narrativeContent.appendChild(recommendationsSection);
        }
    }

    createNarrativeBlock(blockKey, blockData) {
        const block = document.createElement('div');
        block.className = `narrative-block ${blockData.status}`;

        const header = document.createElement('div');
        header.className = 'block-header';
        header.innerHTML = `
            <div class="block-title">${blockData.name}</div>
            <div class="block-status ${blockData.status}">${blockData.status}</div>
        `;

        const content = document.createElement('div');
        content.className = 'block-content';

        let contentHtml = `<div class="block-description" style="margin-bottom: 0.75rem; font-size: 0.85rem; color: #64748b;">${blockData.description}</div>`;

        if (blockData.relevant_content && blockData.relevant_content.length > 0) {
            contentHtml += '<div class="content">';
            for (const item of blockData.relevant_content) {
                contentHtml += `<div style="margin-bottom: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 4px; font-size: 0.9rem;">${item.content}</div>`;
            }
            contentHtml += '</div>';
        }

        if (blockData.suggestions && blockData.suggestions.length > 0) {
            contentHtml += `<div class="suggestions">${blockData.suggestions.join(' ')}</div>`;
        }

        content.innerHTML = contentHtml;

        block.appendChild(header);
        block.appendChild(content);

        return block;
    }

    displayAIOptimizationSurface() {
        const aiOptimizationContent = document.getElementById('ai-optimization-content');

        if (!this.aiOptimizationAnalysis) {
            aiOptimizationContent.innerHTML = '<p>No AI optimization analysis available.</p>';
            return;
        }

        // Create score display
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score-display';
        scoreDisplay.innerHTML = `
            <div class="score-number">${this.aiOptimizationAnalysis.overall_score.score}</div>
            <div class="score-grade">Grade: ${this.aiOptimizationAnalysis.overall_score.grade}</div>
            <div style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">${this.aiOptimizationAnalysis.overall_score.level}</div>
        `;

        // Create criteria analysis
        const criteriaContainer = document.createElement('div');
        criteriaContainer.className = 'optimization-criteria';

        for (const [criterionKey, criterionData] of Object.entries(this.aiOptimizationAnalysis.criteria_scores)) {
            const criterionElement = this.createOptimizationCriterion(criterionKey, criterionData);
            criteriaContainer.appendChild(criterionElement);
        }

        aiOptimizationContent.innerHTML = '';
        aiOptimizationContent.appendChild(scoreDisplay);
        aiOptimizationContent.appendChild(criteriaContainer);

        // Add foundation model readiness
        if (this.aiOptimizationAnalysis.foundation_model_readiness) {
            const readinessSection = document.createElement('div');
            readinessSection.style.marginTop = '2rem';
            readinessSection.innerHTML = `
                <h3 style="margin-bottom: 1rem; color: #0f172a;">Foundation Model Readiness</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    ${Object.entries(this.aiOptimizationAnalysis.foundation_model_readiness.readiness_scores).map(([model, score]) => `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; text-align: center;">
                            <div style="font-weight: 600; text-transform: uppercase; color: #0f172a; margin-bottom: 0.5rem;">${model}</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${score}%</div>
                        </div>
                    `).join('')}
                </div>
            `;
            aiOptimizationContent.appendChild(readinessSection);
        }

        // Add recommendations
        if (this.aiOptimizationAnalysis.optimization_recommendations && this.aiOptimizationAnalysis.optimization_recommendations.length > 0) {
            const recommendationsSection = document.createElement('div');
            recommendationsSection.style.marginTop = '2rem';
            recommendationsSection.innerHTML = `
                <h3 style="margin-bottom: 1rem; color: #0f172a;">Optimization Recommendations</h3>
                ${this.aiOptimizationAnalysis.optimization_recommendations.map(rec => `
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 0.5rem;">
                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 0.25rem;">${rec.title || rec.suggestion || 'Improvement'}</div>
                        <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem;">${rec.description || ''}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">Priority: ${rec.priority}</div>
                        ${rec.specific_suggestions ? `
                            <ul style="margin-top: 0.5rem; margin-left: 1rem; font-size: 0.8rem; color: #374151;">
                                ${rec.specific_suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            `;
            aiOptimizationContent.appendChild(recommendationsSection);
        }
    }

    createOptimizationCriterion(criterionKey, criterionData) {
        const criterion = document.createElement('div');
        criterion.className = 'criteria-item';

        const score = Math.round(criterionData.score * 100);
        const scoreClass = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

        criterion.innerHTML = `
            <div class="criteria-header">
                <div class="criteria-name">${criterionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div class="criteria-score ${scoreClass}">${score}%</div>
            </div>
            <div class="criteria-description">Weight: ${Math.round(criterionData.weight * 100)}%</div>
        `;

        return criterion;
    }

    updateMetadataDisplays() {
        // Update copy metadata
        const copyMetadata = document.getElementById('copy-metadata');
        if (this.currentDocument && this.currentDocument.metadata) {
            copyMetadata.textContent = `${this.currentDocument.metadata.wordCount} words, ${this.currentDocument.metadata.sentenceCount} sentences`;
        }

        // Update narrative score
        const narrativeScore = document.getElementById('narrative-score');
        if (this.narrativeAnalysis) {
            narrativeScore.textContent = `Score: ${this.narrativeAnalysis.overall_score.score}% (${this.narrativeAnalysis.overall_score.grade})`;
        }

        // Update AI optimization score
        const aiScore = document.getElementById('ai-score');
        if (this.aiOptimizationAnalysis) {
            aiScore.textContent = `Score: ${this.aiOptimizationAnalysis.overall_score.score}% (${this.aiOptimizationAnalysis.overall_score.grade})`;
        }
    }

    switchSurface(e) {
        const surface = e.target.dataset.surface;

        // Update active button
        document.querySelectorAll('.surface-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Show appropriate surface
        document.querySelectorAll('.surface').forEach(s => s.style.display = 'none');
        document.getElementById(surface).style.display = 'block';

        // Auto-run analysis for specific surfaces if content is loaded
        if (this.originalText && this.originalText.trim().length > 50) {
            this.autoRunAnalysisForSurface(surface);
        }
    }

    autoRunAnalysisForSurface(surface) {
        switch (surface) {
            case 'compliance-surface':
                if (!document.getElementById('compliance-content').innerHTML.includes('Score:')) {
                    this.runComplianceAnalysis();
                }
                break;
            case 'fact-checking-surface':
                if (!document.getElementById('fact-check-content').innerHTML.includes('Score:')) {
                    this.runFactCheckAnalysis();
                }
                break;
            case 'content-fields-surface':
                if (!document.getElementById('content-fields-content').innerHTML.includes('field-item')) {
                    this.runContentFieldAnalysis();
                }
                break;
            case 'recommendations-surface':
                if (!document.getElementById('recommendations-content').innerHTML.includes('recommendations-summary')) {
                    this.generateRecommendations();
                }
                break;
        }
    }

    switchLayout(e) {
        const layout = e.target.dataset.layout;

        // Update active button
        document.querySelectorAll('.layout-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Update surfaces layout
        const surfaces = document.getElementById('surfaces');
        surfaces.className = `surfaces ${layout}`;

        if (layout === 'side-by-side') {
            // Show two surfaces side by side
            const activeSurface = document.querySelector('.surface-btn.active').dataset.surface;
            const otherSurfaces = ['copy', 'narrative', 'ai-optimization'].filter(s => s !== activeSurface);

            document.querySelectorAll('.surface').forEach(s => s.style.display = 'none');
            document.getElementById(`${activeSurface}-surface`).style.display = 'block';
            document.getElementById(`${otherSurfaces[0]}-surface`).style.display = 'block';
        } else {
            // Show single surface
            const activeSurface = document.querySelector('.surface-btn.active').dataset.surface;
            document.querySelectorAll('.surface').forEach(s => s.style.display = 'none');
            document.getElementById(`${activeSurface}-surface`).style.display = 'block';
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        document.getElementById('error').style.display = 'none';
    }

    async processText(text, source = 'pasted') {
        this.showLoading();
        this.hideError();

        try {
            // Create mock document data structure similar to file upload
            this.currentDocument = {
                text: text,
                metadata: {
                    source: source,
                    filename: `${source}_content.txt`,
                    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
                    sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
                    uploadedAt: new Date().toISOString()
                }
            };

            this.currentDocument.metadata.avgWordsPerSentence = Math.round(
                this.currentDocument.metadata.wordCount / this.currentDocument.metadata.sentenceCount
            );

            this.originalText = text;

            // Perform analyses in parallel
            const [narrativeResult, aiOptimizationResult] = await Promise.all([
                this.analyzeNarrative(text),
                this.analyzeAIOptimization(text)
            ]);

            this.narrativeAnalysis = narrativeResult;
            this.aiOptimizationAnalysis = aiOptimizationResult;

            // Show analysis interface
            this.displayAnalysis();
            this.hideLoading();

        } catch (error) {
            console.error('Error processing text:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    async analyzeTone() {
        if (!this.originalText) {
            alert('Please load content first');
            return;
        }

        try {
            const response = await fetch('/api/analyze/tone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: this.originalText,
                    campaignProfile: this.campaignProfile || null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayToneAnalysis(result.analysis);
        } catch (error) {
            console.error('Error analyzing tone:', error);
            alert('Failed to analyze tone: ' + error.message);
        }
    }

    async analyzeGrammar() {
        if (!this.originalText) {
            alert('Please load content first');
            return;
        }

        try {
            const response = await fetch('/api/analyze/grammar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: this.originalText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayGrammarAnalysis(result.analysis);
        } catch (error) {
            console.error('Error analyzing grammar:', error);
            alert('Failed to analyze grammar: ' + error.message);
        }
    }

    async setupToneProfile() {
        try {
            const response = await fetch('/api/setup/tone-profile/template');
            const result = await response.json();

            const profileData = this.promptForToneProfile(result.template, result.options);
            if (!profileData) return;

            const setupResponse = await fetch('/api/setup/tone-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const setupResult = await setupResponse.json();
            this.campaignProfile = setupResult.profile;
            alert('Campaign tone profile created successfully!');
        } catch (error) {
            console.error('Error setting up tone profile:', error);
            alert('Failed to setup tone profile: ' + error.message);
        }
    }

    promptForToneProfile(template, options) {
        const candidateName = prompt('Enter candidate name:', template.candidateName);
        if (!candidateName) return null;

        const communicationStyle = prompt(
            `Choose communication style (${options.communicationStyles.join(', ')}):`,
            template.communicationStyle
        );

        const primaryTones = prompt(
            `Choose primary tones (${options.availableTones.join(', ')}):`,
            template.primaryTones.join(', ')
        ).split(',').map(t => t.trim());

        const targetAudience = prompt(
            `Choose target audience (${options.targetAudiences.join(', ')}):`,
            template.targetAudience
        );

        const formalityLevel = prompt(
            `Choose formality level (${options.formalityLevels.join(', ')}):`,
            template.formalityLevel
        );

        return {
            candidateName,
            communicationStyle,
            primaryTones,
            targetAudience,
            formalityLevel,
            customKeywords: [],
            avoidWords: []
        };
    }

    displayToneAnalysis(analysis) {
        const content = document.getElementById('tone-content');

        let html = `
            <div class="score-display">
                <div class="score-number">${analysis.overall_score.score}%</div>
                <div class="score-grade">${analysis.overall_score.grade}</div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; color: #1e293b;">Tone Analysis Results</h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        `;

        // Display detected tones
        Object.entries(analysis.detected_tones).forEach(([tone, data]) => {
            html += `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; text-transform: capitalize;">${tone}</h4>
                    <div style="font-size: 1.2rem; font-weight: 600; color: #3b82f6; margin-bottom: 0.5rem;">${data.confidence}%</div>
                    <p style="margin: 0; font-size: 0.875rem; color: #64748b;">${data.indicators.join(', ')}</p>
                </div>
            `;
        });

        html += `
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Recommendations</h4>
                    <ul style="margin: 0; padding-left: 1.5rem;">
        `;

        analysis.recommendations.forEach(rec => {
            html += `<li style="margin-bottom: 0.5rem; color: #374151;">${rec}</li>`;
        });

        html += `
                    </ul>
                </div>
            </div>
        `;

        content.innerHTML = html;

        // Update score in header
        const scoreElement = document.getElementById('tone-score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${analysis.overall_score.score}% (${analysis.overall_score.grade})`;
        }
    }

    displayGrammarAnalysis(analysis) {
        const content = document.getElementById('grammar-content');

        let html = `
            <div class="score-display">
                <div class="score-number">${analysis.overall_score.score}%</div>
                <div class="score-grade">${analysis.overall_score.grade}</div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; color: #1e293b;">Grammar Analysis Results</h3>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        `;

        // Display metrics
        Object.entries(analysis.metrics).forEach(([metric, data]) => {
            const color = data.status === 'good' ? '#10b981' : data.status === 'warning' ? '#f59e0b' : '#ef4444';
            html += `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: center;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #1e293b; text-transform: capitalize;">${metric.replace('_', ' ')}</h4>
                    <div style="font-size: 1.2rem; font-weight: 600; color: ${color}; margin-bottom: 0.5rem;">${data.value}</div>
                    <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">${data.status}</div>
                </div>
            `;
        });

        html += `
                </div>
        `;

        // Display issues if any
        if (analysis.issues && analysis.issues.length > 0) {
            html += `
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #dc2626;">Grammar Issues Found</h4>
                    <ul style="margin: 0; padding-left: 1.5rem;">
            `;

            analysis.issues.forEach(issue => {
                html += `<li style="margin-bottom: 0.5rem; color: #374151;">${issue}</li>`;
            });

            html += `
                    </ul>
                </div>
            `;
        }

        // Display recommendations
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            html += `
                <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 1.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: #166534;">Recommendations</h4>
                    <ul style="margin: 0; padding-left: 1.5rem;">
            `;

            analysis.recommendations.forEach(rec => {
                html += `<li style="margin-bottom: 0.5rem; color: #374151;">${rec}</li>`;
            });

            html += `
                    </ul>
                </div>
            `;
        }

        html += `</div>`;
        content.innerHTML = html;

        // Update score in header
        const scoreElement = document.getElementById('grammar-score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${analysis.overall_score.score}% (${analysis.overall_score.grade})`;
        }
    }

    async runComplianceAnalysis() {
        try {
            const response = await fetch('/api/analyze/compliance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: this.originalText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            displayComplianceAnalysis(result.analysis);
        } catch (error) {
            console.error('Error running compliance analysis:', error);
            document.getElementById('compliance-content').innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Error: ${error.message}</div>`;
        }
    }

    async runFactCheckAnalysis() {
        try {
            const response = await fetch('/api/analyze/fact-checking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: this.originalText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            displayFactCheckAnalysis(result.analysis);
        } catch (error) {
            console.error('Error running fact-checking analysis:', error);
            document.getElementById('fact-check-content').innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Error: ${error.message}</div>`;
        }
    }

    async runContentFieldAnalysis() {
        try {
            const response = await fetch('/api/analyze/content-fields', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: this.originalText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            displayContentFieldAnalysis(result.analysis);
        } catch (error) {
            console.error('Error running content field analysis:', error);
            document.getElementById('content-fields-content').innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Error: ${error.message}</div>`;
        }
    }

    async generateRecommendations() {
        try {
            const response = await fetch('/api/analyze/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: this.originalText })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            displayRecommendations(result.recommendations);
        } catch (error) {
            console.error('Error generating recommendations:', error);
            document.getElementById('recommendations-content').innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Error: ${error.message}</div>`;
        }
    }

    runAllAnalyses() {
        if (!this.originalText || this.originalText.trim().length < 50) return;

        // Auto-run all analyses when content is loaded
        setTimeout(() => {
            this.runComplianceAnalysis();
            this.runFactCheckAnalysis();
            this.runContentFieldAnalysis();
            this.generateRecommendations();
            this.analyzeTone();
            this.analyzeGrammar();
        }, 1000);
    }
}

// Global functions for paste functionality
function processPastedText() {
    const pasteInput = document.getElementById('paste-input');
    const text = pasteInput.value.trim();

    if (!text) {
        alert('Please paste some text to analyze');
        return;
    }

    if (text.length < 50) {
        alert('Text must be at least 50 characters long for analysis');
        return;
    }

    window.editor.processText(text, 'pasted');
}

function clearPastedText() {
    document.getElementById('paste-input').value = '';
}

// Global functions for compliance analysis
async function runComplianceAnalysis() {
    if (!window.editor || !window.editor.originalText) {
        alert('No content loaded for compliance analysis');
        return;
    }

    try {
        document.getElementById('compliance-content').innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;"><div class="spinner"></div> Analyzing compliance...</div>';

        const response = await fetch('/api/analyze/compliance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: window.editor.originalText })
        });

        if (!response.ok) {
            throw new Error(`Compliance analysis failed: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Compliance analysis failed');
        }

        displayComplianceAnalysis(result.analysis);

    } catch (error) {
        console.error('Error running compliance analysis:', error);
        document.getElementById('compliance-content').innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Error: ${error.message}</div>`;
    }
}

function displayComplianceAnalysis(analysis) {
    const complianceContent = document.getElementById('compliance-content');
    const complianceScore = document.getElementById('compliance-score');

    // Update score in header
    complianceScore.textContent = `Score: ${analysis.overall_compliance.score}% (${analysis.overall_compliance.status})`;

    // Create main compliance display
    let html = `
        <div class="score-display">
            <div class="score-number">${analysis.overall_compliance.score}</div>
            <div class="score-grade">${analysis.overall_compliance.status}</div>
            <div style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Risk Level: ${analysis.overall_compliance.risk_level}</div>
        </div>
    `;

    // Action Items (Critical)
    if (analysis.action_items && analysis.action_items.length > 0) {
        html += `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
                <h3 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Immediate Action Required</h3>
                ${analysis.action_items.map(item => `
                    <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: white; border-radius: 4px;">
                        <div style="font-weight: 600; color: #dc2626; margin-bottom: 0.25rem;">${item.action}</div>
                        <div style="font-size: 0.85rem; color: #374151;">${item.reason}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Compliance Categories
    html += `<h3 style="margin-bottom: 1rem; color: #0f172a;">Compliance Categories</h3>`;
    html += `<div style="display: grid; gap: 1rem; margin-bottom: 2rem;">`;

    for (const [categoryKey, category] of Object.entries(analysis.compliance_checks)) {
        const statusColor = category.issues_found === 0 ? '#10b981' :
                          category.issues_found <= 2 ? '#f59e0b' : '#ef4444';

        html += `
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; background: white;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.75rem;">
                    <div style="font-weight: 600; color: #0f172a;">${category.name}</div>
                    <div style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; background: #f1f5f9; color: #475569;">
                        ${category.category_score}% • ${category.issues_found} issues
                    </div>
                </div>
                <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem;">Priority: ${category.priority}</div>

                <div style="display: grid; gap: 0.5rem;">
                    ${Object.entries(category.checks).map(([checkKey, check]) => `
                        <div style="display: flex; align-items: center; font-size: 0.85rem;">
                            <span style="margin-right: 0.5rem;">
                                ${check.status === 'pass' ? '✅' :
                                  check.status === 'warning' ? '⚠️' :
                                  check.status === 'fail' ? '❌' : 'ℹ️'}
                            </span>
                            <span style="color: #374151;">${check.message || checkKey.replace(/_/g, ' ')}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    html += `</div>`;

    // Legal Risks
    if (analysis.legal_assessment && analysis.legal_assessment.length > 0) {
        html += `
            <h3 style="margin-bottom: 1rem; color: #0f172a;">Legal Risk Assessment</h3>
            <div style="margin-bottom: 2rem;">
                ${analysis.legal_assessment.map(risk => `
                    <div style="border: 1px solid #fed7aa; border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem; background: #fff7ed;">
                        <div style="display: flex; justify-content: between; margin-bottom: 0.5rem;">
                            <div style="font-weight: 600; color: #ea580c; text-transform: capitalize;">${risk.type} Risk</div>
                            <div style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; background: #fed7aa; color: #9a3412;">
                                ${risk.severity}
                            </div>
                        </div>
                        <div style="font-size: 0.85rem; color: #374151; margin-bottom: 0.5rem;">${risk.description}</div>
                        <div style="font-size: 0.8rem; color: #64748b; font-style: italic;">${risk.recommendation}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Recommendations
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        html += `
            <h3 style="margin-bottom: 1rem; color: #0f172a;">Recommendations</h3>
            ${analysis.recommendations.map(rec => `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: between; margin-bottom: 0.25rem;">
                        <div style="font-weight: 600; color: #0f172a;">${rec.action}</div>
                        <div style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; background: ${
                            rec.priority === 'critical' ? '#fecaca' :
                            rec.priority === 'high' ? '#fed7aa' : '#ddd6fe'
                        }; color: ${
                            rec.priority === 'critical' ? '#991b1b' :
                            rec.priority === 'high' ? '#9a3412' : '#5b21b6'
                        };">
                            ${rec.priority}
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: #64748b;">${rec.category}</div>
                </div>
            `).join('')}
        `;
    }

    complianceContent.innerHTML = html;
}

// Global functions for comparison
async function generateComparison() {
    if (!window.editor || !window.editor.originalText) {
        alert('No original document loaded for comparison');
        return;
    }

    const revisedText = prompt('Please paste the revised text for comparison:');
    if (!revisedText) return;

    try {
        const response = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                originalText: window.editor.originalText,
                revisedText: revisedText
            })
        });

        if (!response.ok) {
            throw new Error(`Comparison failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Comparison failed');
        }

        displayComparison(result.comparison);

    } catch (error) {
        console.error('Error generating comparison:', error);
        alert('Failed to generate comparison: ' + error.message);
    }
}

function displayComparison(comparison) {
    const comparisonSection = document.getElementById('comparison-section');
    const comparisonContent = document.getElementById('comparison-content');

    // Display statistics
    const stats = comparison.statistics;
    const statsHtml = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;">${stats.word_count.change > 0 ? '+' : ''}${stats.word_count.change}</div>
                <div style="font-size: 0.8rem; color: #64748b;">Word Change</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;">${stats.total_changes}</div>
                <div style="font-size: 0.8rem; color: #64748b;">Total Changes</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;">${stats.editing_intensity}</div>
                <div style="font-size: 0.8rem; color: #64748b;">Edit Intensity</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; text-align: center;">
                <div style="font-size: 1.5rem; font-weight: 700; color: #0f172a;">${stats.changes_by_significance.high}</div>
                <div style="font-size: 0.8rem; color: #64748b;">High-Impact Changes</div>
            </div>
        </div>
    `;

    // Display editorial summary
    const summary = comparison.editorial_summary;
    const summaryHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1.5rem; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; color: #0f172a;">Editorial Summary</h3>
            <p style="margin-bottom: 1rem; color: #374151;">${summary.overall_assessment}</p>

            ${summary.key_improvements.length > 0 ? `
                <div style="margin-bottom: 1rem;">
                    <h4 style="margin-bottom: 0.5rem; color: #0f172a; font-size: 0.9rem;">Key Improvements:</h4>
                    <ul style="margin-left: 1rem; color: #374151; font-size: 0.85rem;">
                        ${summary.key_improvements.map(imp => `<li>${imp.description} (${imp.location})</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
                ${Object.entries(summary.change_breakdown).map(([type, count]) => `
                    <div style="text-align: center; padding: 0.5rem;">
                        <div style="font-weight: 600; color: #0f172a;">${count}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">${type.replace('_', ' ')}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Display diff
    const diffHtml = `
        <div style="margin-bottom: 1rem;">
            <h3 style="margin-bottom: 1rem; color: #0f172a;">Detailed Changes</h3>
            <div class="diff-html">${comparison.html_diff}</div>
        </div>
    `;

    comparisonContent.innerHTML = statsHtml + summaryHtml + diffHtml;
    comparisonSection.style.display = 'block';
}

// Global functions for fact-checking analysis
async function runFactCheckAnalysis() {
    if (!window.editor || !window.editor.originalText) {
        alert('No content loaded for fact-checking analysis');
        return;
    }

    try {
        const response = await fetch('/api/analyze/fact-checking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: window.editor.originalText
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displayFactCheckAnalysis(result.analysis);

    } catch (error) {
        console.error('Error running fact-checking analysis:', error);
        document.getElementById('fact-check-content').innerHTML = `<div style="text-align: center; padding: 2rem; color: #ef4444;">Error: ${error.message}</div>`;
    }
}

function displayFactCheckAnalysis(analysis) {
    const factCheckContent = document.getElementById('fact-check-content');
    const factCheckScore = document.getElementById('fact-check-score');

    // Update score in header
    factCheckScore.textContent = `Score: ${analysis.overall_assessment.score}% (${analysis.overall_assessment.status})`;

    // Create main fact-check display
    let html = `
        <div class="score-display">
            <div class="score-number">${analysis.overall_assessment.score}</div>
            <div class="score-grade">${analysis.overall_assessment.status}</div>
            <div style="font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">
                ${analysis.overall_assessment.total_claims} claims •
                ${analysis.overall_assessment.high_priority_claims} high priority •
                Verification: ${analysis.overall_assessment.verification_level}
            </div>
        </div>
    `;

    // Action Items (Critical)
    if (analysis.action_items && analysis.action_items.length > 0) {
        html += `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
                <h3 style="color: #dc2626; margin-bottom: 1rem;">⚠️ Immediate Fact-Check Required</h3>
                ${analysis.action_items.map(item => `
                    <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: white; border-radius: 4px;">
                        <div style="font-weight: 600; color: #dc2626; margin-bottom: 0.25rem;">${item.action}</div>
                        <div style="font-size: 0.85rem; color: #374151;">${item.reason}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // High Priority Claims
    if (analysis.fact_check_priorities && analysis.fact_check_priorities.critical.length > 0) {
        html += `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
                <h3 style="color: #dc2626; margin-bottom: 1rem;">🚨 Critical Claims</h3>
                ${analysis.fact_check_priorities.critical.map(claim => `
                    <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: white; border-radius: 4px;">
                        <div style="font-weight: 600; color: #dc2626; margin-bottom: 0.25rem;">"${claim.text}"</div>
                        <div style="font-size: 0.85rem; color: #374151; margin-bottom: 0.5rem;">${claim.reason}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">
                            Verification steps: ${claim.verification_steps.join(', ')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Red Flags
    if (analysis.red_flags && analysis.red_flags.length > 0) {
        const highSeverityFlags = analysis.red_flags.filter(flag => flag.severity === 'high');
        if (highSeverityFlags.length > 0) {
            html += `
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">🚩 Content Quality Issues</h3>
                    ${highSeverityFlags.map(flag => `
                        <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: white; border-radius: 4px;">
                            <div style="font-weight: 600; color: #dc2626; margin-bottom: 0.25rem;">"${flag.text}"</div>
                            <div style="font-size: 0.85rem; color: #374151;">${flag.description}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // Extracted Claims by Category
    html += `<h3 style="margin-bottom: 1rem; color: #0f172a;">Claims Analysis</h3>`;

    const claimsByType = {};
    for (const claim of analysis.extracted_claims) {
        if (!claimsByType[claim.type]) {
            claimsByType[claim.type] = [];
        }
        claimsByType[claim.type].push(claim);
    }

    html += `<div style="display: grid; gap: 1rem; margin-bottom: 2rem;">`;

    for (const [type, claims] of Object.entries(claimsByType)) {
        const typeColors = {
            'statistical': '#3b82f6',
            'factual': '#10b981',
            'comparative': '#f59e0b',
            'predictive': '#8b5cf6'
        };

        html += `
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="font-weight: 600; color: #0f172a;">${claims[0].category}</div>
                    <div style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; background: ${typeColors[type] || '#64748b'}20; color: ${typeColors[type] || '#64748b'};">
                        ${claims.length} claims
                    </div>
                </div>

                <div style="display: grid; gap: 0.5rem;">
                    ${claims.map(claim => `
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 4px; border-left: 3px solid ${typeColors[type] || '#64748b'};">
                            <div style="font-weight: 500; margin-bottom: 0.25rem;">"${claim.text}"</div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">
                                Priority: ${claim.priority} • Verifiability: ${claim.verifiability.level}
                            </div>
                            ${claim.verifiability.reason ? `
                                <div style="font-size: 0.75rem; color: #374151; margin-bottom: 0.5rem;">
                                    ${claim.verifiability.reason}
                                </div>
                            ` : ''}
                            <div style="font-size: 0.75rem; color: #64748b;">
                                Suggested verification: ${claim.suggested_verification.join(', ')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `</div>`;

    // Recommendations
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        html += `
            <h3 style="margin-bottom: 1rem; color: #0f172a;">Recommendations</h3>
            <div style="display: grid; gap: 0.75rem; margin-bottom: 2rem;">
                ${analysis.recommendations.map(rec => {
                    const priorityColors = {
                        'critical': '#dc2626',
                        'high': '#ea580c',
                        'medium': '#ca8a04',
                        'low': '#16a34a'
                    };
                    return `
                        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; border-left: 4px solid ${priorityColors[rec.priority]};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <div style="font-weight: 600; color: #0f172a;">${rec.category}</div>
                                <div style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; background: ${priorityColors[rec.priority]}20; color: ${priorityColors[rec.priority]};">
                                    ${rec.priority}
                                </div>
                            </div>
                            <div style="font-size: 0.9rem; color: #374151; margin-bottom: 0.5rem;">${rec.action}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">${rec.impact}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Suggested Fact-Check Sources
    if (analysis.suggested_sources && analysis.suggested_sources.length > 0) {
        html += `
            <h3 style="margin-bottom: 1rem; color: #0f172a;">Recommended Fact-Checking Sources</h3>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; flex-wrap: gap: 0.5rem;">
                    ${analysis.suggested_sources.map(source => `
                        <span style="padding: 0.25rem 0.75rem; background: white; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; color: #374151;">
                            ${source}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    factCheckContent.innerHTML = html;
}

// Global function for generating unified recommendations
async function generateRecommendations() {
    if (!window.editor || !window.editor.originalText) {
        alert('No content loaded for recommendations analysis');
        return;
    }

    try {
        const response = await fetch('/api/analyze/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: window.editor.originalText
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            displayRecommendations(data.recommendations);
            // Update recommendations score in header
            const scoreElement = document.getElementById('recommendations-score');
            if (scoreElement) {
                const totalRecs = data.recommendations.total_recommendations;
                const criticalCount = data.recommendations.critical_count;
                scoreElement.textContent = `${totalRecs} recommendations (${criticalCount} critical)`;
            }
        } else {
            throw new Error(data.error || 'Failed to generate recommendations');
        }
    } catch (error) {
        console.error('Recommendations error:', error);
        const recommendationsContent = document.getElementById('recommendations-content');
        if (recommendationsContent) {
            recommendationsContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc2626;">
                    <p>❌ Error generating recommendations: ${error.message}</p>
                    <button class="btn" onclick="generateRecommendations()" style="margin-top: 1rem;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

function displayRecommendations(recommendations) {
    const recommendationsContent = document.getElementById('recommendations-content');
    if (!recommendationsContent) return;

    let html = '';

    // Summary cards
    html += `
        <div class="recommendations-summary">
            <div class="summary-card">
                <h3>${recommendations.total_recommendations}</h3>
                <p>Total Recommendations</p>
            </div>
            <div class="summary-card">
                <h3>${recommendations.critical_count}</h3>
                <p>Critical Issues</p>
            </div>
            <div class="summary-card">
                <h3>${recommendations.high_count || 0}</h3>
                <p>High Priority</p>
            </div>
            <div class="summary-card">
                <h3>${recommendations.estimated_time}</h3>
                <p>Total Time</p>
            </div>
        </div>
    `;

    // Recommendations by type
    Object.entries(recommendations.grouped_recommendations).forEach(([type, group]) => {
        html += `
            <div class="recommendations-group">
                <div class="group-header">
                    <span class="group-icon">${group.icon}</span>
                    <div>
                        <h3 class="group-title">${group.name}</h3>
                        <p class="group-description">${group.description}</p>
                    </div>
                    <div class="group-stats">
                        ${group.recommendations.length} items • ${group.total_time}m
                    </div>
                </div>
                ${group.recommendations.map(rec => `
                    <div class="recommendation-item">
                        <div class="recommendation-header">
                            <span class="recommendation-priority ${rec.priority}">${rec.priority.toUpperCase()}</span>
                            <h4 class="recommendation-title">${rec.title}</h4>
                            <span class="recommendation-time">${rec.estimated_time}m</span>
                        </div>
                        <p class="recommendation-description">${rec.description}</p>
                        <div class="recommendation-action">
                            <strong>Action:</strong> ${rec.specific_action}
                        </div>
                        <div class="recommendation-location">
                            📍 ${rec.location} • ${rec.impact}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });

    // Action Plan
    if (recommendations.action_plan) {
        html += `
            <div class="action-plan">
                <div class="action-plan-header">
                    🎯 Recommended Action Plan
                </div>
                ${Object.entries(recommendations.action_plan).map(([phase, data]) => `
                    <div class="action-phase">
                        <div class="phase-header">
                            ${data.name} (${data.time}m total)
                        </div>
                        <div class="phase-items">
                            ${data.items.map(item => `
                                <div class="phase-item">
                                    <strong>${item.title}</strong> - ${item.specific_action}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    recommendationsContent.innerHTML = html;
}

// Global function for content field analysis
async function runContentFieldAnalysis() {
    if (!window.editor || !window.editor.originalText) {
        alert('No content loaded for content field analysis');
        return;
    }

    try {
        const response = await fetch('/api/analyze/content-fields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: window.editor.originalText
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            displayContentFields(data.analysis);
            // Update content fields score in header
            const scoreElement = document.getElementById('content-fields-score');
            if (scoreElement) {
                scoreElement.textContent = `${data.analysis.overall_score}% complete (${data.analysis.completeness_score}% fields found)`;
            }
        } else {
            throw new Error(data.error || 'Failed to analyze content fields');
        }
    } catch (error) {
        console.error('Content field analysis error:', error);
        const contentFieldsContent = document.getElementById('content-fields-content');
        if (contentFieldsContent) {
            contentFieldsContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc2626;">
                    <p>❌ Error analyzing content fields: ${error.message}</p>
                    <button class="btn" onclick="runContentFieldAnalysis()" style="margin-top: 1rem;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

function displayContentFields(analysis) {
    const contentFieldsContent = document.getElementById('content-fields-content');
    if (!contentFieldsContent) return;

    let html = '';

    // Summary cards
    html += `
        <div class="fields-summary">
            <div class="field-summary-card present">
                <div class="count">${analysis.field_summary.present}</div>
                <div class="label">Found</div>
            </div>
            <div class="field-summary-card missing">
                <div class="count">${analysis.field_summary.missing}</div>
                <div class="label">Missing</div>
            </div>
            <div class="field-summary-card warning">
                <div class="count">${analysis.field_summary.warning}</div>
                <div class="label">Needs Review</div>
            </div>
            <div class="field-summary-card error">
                <div class="count">${analysis.field_summary.error}</div>
                <div class="label">Errors</div>
            </div>
            <div class="field-summary-card">
                <div class="count">${analysis.overall_score}%</div>
                <div class="label">Overall Score</div>
            </div>
        </div>
    `;

    // Missing required fields section
    if (analysis.missing_required_fields && analysis.missing_required_fields.length > 0) {
        html += `
            <div class="missing-fields-section">
                <div class="missing-fields-title">⚠️ Missing Required Fields</div>
                ${analysis.missing_required_fields.map(field => `
                    <div class="missing-field">
                        <div class="missing-field-name">${field.field.replace('_', ' ')}</div>
                        <div style="color: #374151; font-size: 0.875rem;">${field.description}</div>
                        <div style="color: #10b981; font-size: 0.875rem; margin-top: 0.25rem;">💡 ${field.suggestion}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Formatting issues section
    if (analysis.formatting_issues && analysis.formatting_issues.length > 0) {
        html += `
            <div class="formatting-issues">
                <div class="formatting-issues-title">📝 Formatting Issues</div>
                ${analysis.formatting_issues.map(issue => `
                    <div class="format-issue">
                        <div style="font-weight: 600; color: #d97706; margin-bottom: 0.25rem;">${issue.field.replace('_', ' ')}: ${issue.issue}</div>
                        <div style="color: #374151; font-size: 0.875rem;">${issue.suggestion}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Individual field results
    Object.entries(analysis.extracted_fields).forEach(([fieldName, results]) => {
        const fieldStatus = analysis.field_statuses[fieldName];
        const fieldConfig = getFieldConfig(fieldName);

        html += `
            <div class="field-item">
                <div class="field-header">
                    <div class="field-name">${fieldName.replace('_', ' ')}</div>
                    <div class="field-status ${fieldStatus.present ? (fieldStatus.quality === 'good' ? 'present' : 'warning') : 'missing'}">
                        ${fieldStatus.present ? (fieldStatus.quality === 'good' ? 'Found' : 'Needs Review') : 'Missing'}
                    </div>
                </div>
                <div class="field-content">
                    <div class="field-description">${fieldConfig.description}</div>

                    ${results.length > 0 ? results.map((result, index) => `
                        <div class="field-extracted">
                            <div class="field-extracted-text">"${result.text}"</div>
                            <div class="field-confidence">
                                Confidence: ${Math.round(result.confidence * 100)}%
                                ${result.position !== undefined ? ` • Position: ${result.position}` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <div style="color: #64748b; font-style: italic; padding: 1rem; background: #f8fafc; border-radius: 4px;">
                            No ${fieldName.replace('_', ' ')} detected in content
                        </div>
                    `}

                    ${fieldStatus.issues.length > 0 ? `
                        <div class="field-issues">
                            ${fieldStatus.issues.map(issue => `
                                <div class="field-issue">⚠️ ${issue}</div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${fieldStatus.suggestions.length > 0 ? `
                        <div class="field-issues">
                            ${fieldStatus.suggestions.map(suggestion => `
                                <div class="field-suggestion">💡 ${suggestion}</div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    contentFieldsContent.innerHTML = html;
}

function getFieldConfig(fieldName) {
    const fieldConfigs = {
        headline: { description: 'Main headline or title of the content' },
        subhead: { description: 'Secondary headline or subtitle' },
        assignment_type: { description: 'Type of press assignment (release, statement, etc.)' },
        assignment_subtype: { description: 'Category or subtype of the assignment' },
        date: { description: 'Release date or publication date' },
        location: { description: 'Geographic location referenced in content' },
        opening_paragraph: { description: 'Opening paragraph with key message' },
        body_text: { description: 'Main body content and details' },
        candidate_quote: { description: 'Direct quotes from the candidate' },
        other_quotes: { description: 'Quotes from other sources or officials' },
        boilerplate: { description: 'Standard candidate or campaign description' },
        media_contact: { description: 'Contact information for media inquiries' },
        paid_for_by: { description: 'Legal disclaimer for campaign materials' }
    };

    return fieldConfigs[fieldName] || { description: 'Content field' };
}


// Initialize the application
window.editor = new CampaignContentEditor();