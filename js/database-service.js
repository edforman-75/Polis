/**
 * Database Service - Client-side service for interacting with server database
 * Replaces localStorage with server-side database storage
 */

class DatabaseService {
    constructor() {
        this.apiUrl = '/api';
        this.cache = new Map();
    }

    // Generic API request helper
    async request(method, url, data = null) {
        try {
            const config = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // Include session cookies
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.apiUrl}${url}`, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Database Service Error (${method} ${url}):`, error);
            throw error;
        }
    }

    // Speech Management
    async getSpeech(id) {
        const cacheKey = `speech_${id}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const speech = await this.request('GET', `/speeches/${id}`);
        this.cache.set(cacheKey, speech);
        return speech;
    }

    async getAllSpeeches(assignmentId = null) {
        const url = assignmentId ? `/speeches?assignment_id=${assignmentId}` : '/speeches';
        const speeches = await this.request('GET', url);

        // Cache individual speeches
        speeches.forEach(speech => {
            this.cache.set(`speech_${speech.id}`, speech);
        });

        return speeches;
    }

    async saveSpeech(speechData) {
        const { id, title, content, metadata, assignment_id, changes_summary } = speechData;

        const data = {
            title: title || this.extractTitle(content),
            content,
            metadata: metadata || {},
            assignment_id,
            changes_summary
        };

        let result;
        if (id) {
            // Update existing speech
            result = await this.request('PUT', `/speeches/${id}`, data);
            this.cache.delete(`speech_${id}`); // Invalidate cache
        } else {
            // Create new speech
            result = await this.request('POST', '/speeches', data);
        }

        this.cache.set(`speech_${result.id}`, result);
        return result;
    }

    async deleteSpeech(id) {
        const result = await this.request('DELETE', `/speeches/${id}`);
        this.cache.delete(`speech_${id}`);
        return result;
    }

    async getSpeechVersions(id) {
        return await this.request('GET', `/speeches/${id}/versions`);
    }

    async searchSpeeches(query) {
        return await this.request('GET', `/speeches/search/${encodeURIComponent(query)}`);
    }

    // Communications Briefs
    async getBriefs() {
        return await this.request('GET', '/speeches/briefs');
    }

    async saveBrief(briefData) {
        const { title, description, audience, tone, key_points, assignment_id, assigned_to } = briefData;

        const data = {
            title,
            description,
            audience,
            tone,
            key_points: Array.isArray(key_points) ? key_points : [],
            assignment_id,
            assigned_to
        };

        return await this.request('POST', '/speeches/briefs', data);
    }

    // Utility methods
    extractTitle(content) {
        if (!content) return 'Untitled Speech';

        // Try to extract title from first line
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            let title = lines[0].replace(/^(transcript:\s*)?/i, '').trim();
            if (title.length > 60) {
                title = title.substring(0, 57) + '...';
            }
            return title || 'Untitled Speech';
        }

        return 'Untitled Speech';
    }

    // Auto-save functionality
    setupAutoSave(speechData, callback, interval = 30000) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(async () => {
            try {
                if (speechData.content && speechData.content.trim()) {
                    const result = await this.saveSpeech({
                        ...speechData,
                        changes_summary: 'Auto-save'
                    });

                    if (callback) {
                        callback(result);
                    }

                    console.log('✅ Speech auto-saved:', result.id);
                }
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
                if (callback) {
                    callback(null, error);
                }
            }
        }, interval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Migration helper - convert localStorage data to database
    async migratePersistentData() {
        try {
            // Migrate speech draft
            const speechDraft = localStorage.getItem('speechDraft');
            if (speechDraft && speechDraft.trim()) {
                await this.saveSpeech({
                    content: speechDraft,
                    metadata: { migrated: true, source: 'localStorage' },
                    changes_summary: 'Migrated from localStorage'
                });
                console.log('✅ Migrated speech draft to database');
            }

            // Migrate speech library
            const speechLibrary = localStorage.getItem('speechLibrary');
            if (speechLibrary) {
                try {
                    const speeches = JSON.parse(speechLibrary);
                    for (const speech of speeches) {
                        await this.saveSpeech({
                            content: speech.content || speech.text,
                            metadata: {
                                migrated: true,
                                source: 'speechLibrary',
                                originalPreview: speech.preview
                            },
                            changes_summary: 'Migrated from speech library'
                        });
                    }
                    console.log(`✅ Migrated ${speeches.length} speeches from library`);
                } catch (e) {
                    console.warn('Failed to parse speech library:', e);
                }
            }

            // Migrate communications briefs
            const briefs = localStorage.getItem('communicationsBriefs');
            if (briefs) {
                try {
                    const briefsData = JSON.parse(briefs);
                    for (const brief of briefsData) {
                        await this.saveBrief({
                            ...brief,
                            key_points: brief.keyPoints || brief.key_points || []
                        });
                    }
                    console.log(`✅ Migrated ${briefsData.length} communications briefs`);
                } catch (e) {
                    console.warn('Failed to parse communications briefs:', e);
                }
            }

            // Clean up localStorage after successful migration
            const keysToRemove = [
                'speechDraft',
                'speechLibrary',
                'communicationsBriefs',
                'currentSpeechId'
            ];

            keysToRemove.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                }
            });

            console.log('✅ Migration completed and localStorage cleaned up');
            return true;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    }

    // Health check
    async healthCheck() {
        try {
            return await this.request('GET', '/health');
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // Cache management
    clearCache() {
        this.cache.clear();
    }

    getCacheSize() {
        return this.cache.size;
    }
}

// Create singleton instance
window.databaseService = new DatabaseService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseService;
}