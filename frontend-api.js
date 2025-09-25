// Frontend API Service
// This handles all communication with the backend

class CampaignAPI {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.token = localStorage.getItem('campaign_token');
    }

    // Helper method for API calls
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-Dev-User': 'true', // For development bypass
                ...options.headers,
            },
            credentials: 'include', // Include cookies
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.token) {
            this.token = response.token;
            localStorage.setItem('campaign_token', response.token);
        }

        return response;
    }

    async devLogin(role = 'writer') {
        const response = await this.request('/auth/dev-login', {
            method: 'POST',
            body: JSON.stringify({ role }),
        });

        return response;
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.token = null;
        localStorage.removeItem('campaign_token');
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Research and AI
    async performResearch(query, assignmentId = null, context = {}) {
        return this.request('/research/query', {
            method: 'POST',
            body: JSON.stringify({ query, assignmentId, context }),
        });
    }

    async generateContent(type, params) {
        return this.request('/research/generate', {
            method: 'POST',
            body: JSON.stringify({ type, ...params }),
        });
    }

    async analyzeContent(content, context = {}) {
        return this.request('/research/analyze', {
            method: 'POST',
            body: JSON.stringify({ content, context }),
        });
    }

    async getResearchHistory(assignmentId = null, limit = 20) {
        const params = new URLSearchParams();
        if (assignmentId) params.append('assignmentId', assignmentId);
        params.append('limit', limit);

        return this.request(`/research/history?${params}`);
    }

    async getResearchSuggestions(assignmentId, currentContent) {
        return this.request('/research/suggestions', {
            method: 'POST',
            body: JSON.stringify({ assignmentId, currentContent }),
        });
    }

    // Assignments
    async getAssignments(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/assignments?${params}`);
    }

    async getAssignment(id) {
        return this.request(`/assignments/${id}`);
    }

    async updateAssignmentStatus(id, status, notes = '') {
        return this.request(`/assignments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, notes }),
        });
    }

    async getWorkflowHistory(id) {
        return this.request(`/assignments/${id}/workflow`);
    }

    async createAssignment(data) {
        return this.request('/assignments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Content
    async saveBlocks(assignmentId, blocks) {
        return this.request('/content/blocks', {
            method: 'POST',
            body: JSON.stringify({ assignmentId, blocks }),
        });
    }

    async getBlocks(assignmentId) {
        return this.request(`/content/blocks/${assignmentId}`);
    }

    async saveVersion(assignmentId, versionData, message) {
        return this.request('/content/version', {
            method: 'POST',
            body: JSON.stringify({ assignmentId, versionData, message }),
        });
    }

    async getVersionHistory(assignmentId) {
        return this.request(`/content/versions/${assignmentId}`);
    }

    async exportContent(assignmentId, format) {
        return this.request('/content/export', {
            method: 'POST',
            body: JSON.stringify({ assignmentId, format }),
        });
    }

    // Schema
    async generateSchema(assignmentId, blocks) {
        return this.request('/schema/generate', {
            method: 'POST',
            body: JSON.stringify({ assignmentId, blocks }),
        });
    }

    async getSchemaHistory(assignmentId) {
        return this.request(`/schema/history/${assignmentId}`);
    }

    async validateSchema(schema) {
        return this.request('/schema/validate', {
            method: 'POST',
            body: JSON.stringify({ schema }),
        });
    }

    // Content Quality endpoints
    async checkGrammar(text, context = {}) {
        return this.request('/content-quality/grammar-check', {
            method: 'POST',
            body: JSON.stringify({ text, context }),
        });
    }

    async checkCompliance(text, contentType = 'general') {
        return this.request('/content-quality/compliance-check', {
            method: 'POST',
            body: JSON.stringify({ text, contentType }),
        });
    }

    async checkSchemaCompleteness(blocks) {
        return this.request('/content-quality/schema-check', {
            method: 'POST',
            body: JSON.stringify({ blocks }),
        });
    }

    async analyzeContentQuality(text, blocks = [], context = {}) {
        return this.request('/content-quality/analyze', {
            method: 'POST',
            body: JSON.stringify({ text, blocks, context }),
        });
    }

    async factCheckContent(text, claims = []) {
        return this.request('/content-quality/fact-check', {
            method: 'POST',
            body: JSON.stringify({ text, claims }),
        });
    }

    async enhanceContent(text, blocks = [], targetAudience = null, platform = null) {
        return this.request('/content-quality/enhance', {
            method: 'POST',
            body: JSON.stringify({ text, blocks, targetAudience, platform }),
        });
    }

    async checkVoice(text, candidateProfile = {}) {
        return this.request('/content-quality/voice-check', {
            method: 'POST',
            body: JSON.stringify({ text, candidateProfile }),
        });
    }

    // Draft Generation endpoints
    async generateDraft(assignmentData, contentType = 'press-release') {
        return this.request('/draft-generation/generate', {
            method: 'POST',
            body: JSON.stringify({ assignmentData, contentType }),
        });
    }

    async generateDraftFromBrief(brief, contentType = 'press-release', additionalContext = {}) {
        return this.request('/draft-generation/from-brief', {
            method: 'POST',
            body: JSON.stringify({ brief, contentType, additionalContext }),
        });
    }

    async getContentTemplate(contentType) {
        return this.request(`/draft-generation/templates/${contentType}`);
    }

    async getContentTypes() {
        return this.request('/draft-generation/content-types');
    }

    // Photo Search endpoints
    async searchPhotos(query, context = {}) {
        return this.request('/photos/search', {
            method: 'POST',
            body: JSON.stringify({ query, context }),
        });
    }

    async getPhotoSuggestions(contentType, platform = 'general', tone = 'professional', topic = '') {
        return this.request('/photos/suggestions', {
            method: 'POST',
            body: JSON.stringify({ contentType, platform, tone, topic }),
        });
    }

    async getAllPhotos() {
        return this.request('/photos');
    }
}

// Create global instance
window.campaignAPI = new CampaignAPI();

// Auto-login for development
if (window.location.hostname === 'localhost') {
    window.campaignAPI.devLogin('writer').then(response => {
        console.log('Dev login successful:', response.user);
    }).catch(error => {
        console.error('Dev login failed:', error);
    });
}