/**
 * Thin Client - Minimal browser-side logic
 * All processing is done on the server, client only handles UI interactions
 */

class ThinSpeechClient {
    constructor() {
        this.currentSpeech = null;
        this.currentSpeechId = null;
        this.unsavedChanges = false;
        this.autoSaveTimer = null;
    }

    // Initialize the client
    async init() {
        try {
            // Check server connection
            await this.healthCheck();

            // Migrate any localStorage data to server
            await this.migrateLocalData();

            // Setup event listeners
            this.setupEventListeners();

            // Load initial speech if ID provided
            const urlParams = new URLSearchParams(window.location.search);
            const speechId = urlParams.get('speech');

            if (speechId) {
                await this.loadSpeech(speechId);
            }

            console.log('✅ Thin client initialized');
        } catch (error) {
            console.error('❌ Failed to initialize client:', error);
            this.showError('Failed to connect to server');
        }
    }

    // Server communication
    async apiCall(method, endpoint, data = null) {
        try {
            const config = {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`/api/speeches${endpoint}`, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${method} ${endpoint}):`, error);
            throw error;
        }
    }

    // Load speech from server
    async loadSpeech(id) {
        try {
            this.currentSpeech = await this.apiCall('GET', `/${id}`);
            this.currentSpeechId = id;
            this.renderSpeech();
            this.updateUI();
        } catch (error) {
            this.showError(`Failed to load speech: ${error.message}`);
        }
    }

    // Save speech to server
    async saveSpeech(content, metadata = {}) {
        try {
            const data = {
                content,
                metadata,
                changes_summary: this.unsavedChanges ? 'Updated content' : 'Auto-save'
            };

            if (this.currentSpeechId) {
                // Update existing
                data.id = this.currentSpeechId;
                this.currentSpeech = await this.apiCall('PUT', `/${this.currentSpeechId}`, data);
            } else {
                // Create new
                this.currentSpeech = await this.apiCall('POST', '', data);
                this.currentSpeechId = this.currentSpeech.id;

                // Update URL without refresh
                const url = new URL(window.location);
                url.searchParams.set('speech', this.currentSpeechId);
                history.replaceState(null, '', url);
            }

            this.unsavedChanges = false;
            this.updateUI();
            return this.currentSpeech;
        } catch (error) {
            this.showError(`Failed to save speech: ${error.message}`);
            throw error;
        }
    }

    // Process content on server (real-time analysis)
    async processContent(content) {
        try {
            return await this.apiCall('POST', '/process', { content });
        } catch (error) {
            console.warn('Processing failed:', error);
            return null;
        }
    }

    // Export speech
    async exportSpeech(format) {
        if (!this.currentSpeechId) {
            this.showError('Please save the speech first');
            return;
        }

        try {
            const url = `/api/speeches/${this.currentSpeechId}/export/${format}`;
            window.open(url, '_blank');
        } catch (error) {
            this.showError(`Export failed: ${error.message}`);
        }
    }

    // UI Methods
    renderSpeech() {
        if (!this.currentSpeech) return;

        const { content, metadata } = this.currentSpeech;

        // Update content area
        const contentArea = document.getElementById('speech-input');
        if (contentArea) {
            contentArea.value = content;
        }

        // Update metadata fields
        if (metadata) {
            this.updateMetadataFields(metadata);
        }

        // Update stats
        this.updateStats(metadata);
    }

    updateMetadataFields(metadata) {
        const fields = {
            'speech-title': metadata.title,
            'speech-date': metadata.date,
            'speech-location': metadata.location,
            'speech-speaker': metadata.speaker,
            'speech-source': metadata.source
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
            }
        });
    }

    updateStats(metadata) {
        if (!metadata) return;

        const updates = {
            'word-count': metadata.wordCount || 0,
            'duration': `${metadata.duration || 0} min`,
            'reading-level': metadata.readingLevel || 'Unknown',
            'tone': metadata.tone?.primary || 'Neutral'
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateUI() {
        // Update save status
        const saveStatus = document.getElementById('save-status');
        if (saveStatus) {
            saveStatus.textContent = this.unsavedChanges ? 'Unsaved changes' : 'All changes saved';
            saveStatus.className = this.unsavedChanges ? 'unsaved' : 'saved';
        }

        // Update title
        if (this.currentSpeech?.metadata?.title) {
            document.title = `${this.currentSpeech.metadata.title} - Speech Editor`;
        }
    }

    // Event handlers
    setupEventListeners() {
        // Content change detection
        const contentArea = document.getElementById('speech-input');
        if (contentArea) {
            let debounceTimer;
            contentArea.addEventListener('input', (e) => {
                this.unsavedChanges = true;
                this.updateUI();

                // Debounced auto-save and processing
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.handleContentChange(e.target.value);
                }, 1000);
            });
        }

        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const content = document.getElementById('speech-input')?.value;
                if (content) {
                    this.saveSpeech(content);
                }
            });
        }

        // Export buttons
        document.querySelectorAll('[data-export-format]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.getAttribute('data-export-format');
                this.exportSpeech(format);
            });
        });

        // View switching
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Auto-save interval
        this.startAutoSave();
    }

    async handleContentChange(content) {
        // Process content on server for real-time feedback
        const processed = await this.processContent(content);

        if (processed) {
            this.updateStats(processed.metadata);
        }

        // Auto-save
        if (this.unsavedChanges) {
            try {
                await this.saveSpeech(content);
                this.showSuccess('Auto-saved');
            } catch (error) {
                console.warn('Auto-save failed:', error);
            }
        }
    }

    switchView(view) {
        // Simple view switching - server handles content processing
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
        });

        document.querySelectorAll(`[data-view="${view}"]`).forEach(el => {
            el.classList.add('active');
        });

        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            viewContainer.className = `view-container ${view}-view`;
        }

        // Request processed content for specific views
        if (view === 'structure' || view === 'analysis') {
            this.loadViewContent(view);
        }
    }

    async loadViewContent(view) {
        const content = document.getElementById('speech-input')?.value;
        if (!content) return;

        try {
            const processed = await this.processContent(content);
            this.renderViewContent(view, processed);
        } catch (error) {
            console.warn(`Failed to load ${view} view:`, error);
        }
    }

    renderViewContent(view, data) {
        const container = document.getElementById('view-container');
        if (!container) return;

        switch (view) {
            case 'structure':
                this.renderStructureView(data.sections, container);
                break;
            case 'analysis':
                this.renderAnalysisView(data.metadata, container);
                break;
        }
    }

    renderStructureView(sections, container) {
        container.innerHTML = `
            <div class="structure-view">
                <h3>Speech Structure</h3>
                ${sections.map(section => `
                    <div class="section">
                        <h4>${section.title}</h4>
                        <p class="section-type">${section.type}</p>
                        <div class="section-content">${section.content}</div>
                        <p class="section-stats">${section.wordCount} words</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderAnalysisView(metadata, container) {
        container.innerHTML = `
            <div class="analysis-view">
                <h3>Speech Analysis</h3>
                <div class="stats">
                    <p>Word Count: ${metadata.wordCount}</p>
                    <p>Duration: ${metadata.duration} minutes</p>
                    <p>Reading Level: ${metadata.readingLevel}</p>
                    <p>Primary Tone: ${metadata.tone?.primary}</p>
                </div>
                <div class="themes">
                    <h4>Themes</h4>
                    ${metadata.themes?.map(theme => `
                        <span class="theme-tag">${theme.name} (${theme.frequency})</span>
                    `).join('') || 'No themes detected'}
                </div>
            </div>
        `;
    }

    // Auto-save functionality
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            if (this.unsavedChanges) {
                const content = document.getElementById('speech-input')?.value;
                if (content) {
                    this.saveSpeech(content).catch(console.warn);
                }
            }
        }, 30000); // 30 seconds
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Utility methods
    async healthCheck() {
        const response = await fetch('/api/health');
        if (!response.ok) {
            throw new Error('Server not available');
        }
        return response.json();
    }

    async migrateLocalData() {
        // Check for localStorage data and migrate to server
        const localData = localStorage.getItem('speechDraft');
        if (localData) {
            try {
                await this.saveSpeech(localData, { migrated: true });
                localStorage.removeItem('speechDraft');
                this.showSuccess('Local data migrated to server');
            } catch (error) {
                console.warn('Migration failed:', error);
            }
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Cleanup
    destroy() {
        this.stopAutoSave();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.speechClient = new ThinSpeechClient();
    window.speechClient.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.speechClient) {
        window.speechClient.destroy();
    }
});