// Collaborative Block Editor
// Integrates with the backend block-based collaboration system

class CollaborativeBlockEditor {
    constructor(options = {}) {
        this.container = options.container;
        this.assignmentId = options.assignmentId;
        this.assignmentType = options.assignmentType;
        this.user = options.user;
        this.apiBase = options.apiBase || '/api';

        this.ws = null;
        this.connected = false;

        this.blocks = [];
        this.lockedBlocks = new Map(); // blockId -> lock info
        this.narrativeStructure = null;
        this.technicalBlocks = null;

        this.eventHandlers = new Map();
        this.blockElements = new Map(); // blockId -> DOM element
        this.currentlyEditing = null;

        this.init();
    }

    async init() {
        try {
            await this.loadAssignmentStructure();
            await this.loadContent();
            this.initWebSocket();
            this.renderEditor();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize collaborative editor:', error);
            this.showError('Failed to load editor. Please refresh the page.');
        }
    }

    // Load assignment structure from backend
    async loadAssignmentStructure() {
        const response = await fetch(`${this.apiBase}/collaboration/structure/${this.assignmentType}`);
        if (!response.ok) throw new Error('Failed to load assignment structure');

        const data = await response.json();
        this.narrativeStructure = data.narrative;
        this.technicalBlocks = data.technicalBlocks;
    }

    // Load existing content
    async loadContent() {
        if (!this.assignmentId) return;

        const response = await fetch(`${this.apiBase}/content/${this.assignmentId}`);
        if (response.ok) {
            const data = await response.json();
            this.blocks = data.blocks || this.generateInitialBlocks();
        } else {
            this.blocks = this.generateInitialBlocks();
        }
    }

    // Generate initial blocks based on narrative structure
    generateInitialBlocks() {
        const blocks = [];

        this.narrativeStructure.sections.forEach(section => {
            section.suggestedBlocks.forEach(blockType => {
                const technicalBlock = this.technicalBlocks[blockType];
                if (technicalBlock) {
                    blocks.push({
                        id: `${section.id}-${blockType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        type: blockType,
                        sectionId: section.id,
                        content: this.getDefaultContent(blockType, section),
                        attributes: { ...technicalBlock.attributes },
                        locked: false,
                        lockedBy: null,
                        created: new Date().toISOString(),
                        modified: new Date().toISOString()
                    });
                }
            });
        });

        return blocks;
    }

    // Get default content for block type
    getDefaultContent(blockType, section) {
        const defaults = {
            'text/heading': section.label,
            'text/paragraph': section.guidelines || '',
            'text/subheading': '',
            'text/quote': '',
            'text/list': { items: [], ordered: false },
            'media/image': { src: '', alt: '', caption: '' },
            'campaign/callout': { content: '', style: 'info' },
            'campaign/cta': { text: '', buttonText: 'Learn More', url: '' },
            'press/release-info': {
                releaseType: 'FOR IMMEDIATE RELEASE',
                releaseDate: new Date().toISOString().split('T')[0],
                location: '',
                customReleaseType: '',
                embargoDate: '',
                embargoTime: ''
            },
            'press/about-selector': {
                selectedTemplate: 'campaign-standard',
                customContent: ''
            },
            'press/contact-info': {
                selectedTemplate: 'press-secretary',
                customContent: ''
            },
            'press/paid-for': 'Paid for by [Campaign Name]'
        };

        return defaults[blockType] || '';
    }

    // Initialize WebSocket connection
    initWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8080`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('🔗 Connected to collaboration server');
            this.connected = true;
            this.joinSession();
            this.showConnectionStatus('connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('🔌 Disconnected from collaboration server');
            this.connected = false;
            this.showConnectionStatus('disconnected');

            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.initWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showConnectionStatus('error');
        };
    }

    // Join collaboration session
    joinSession() {
        if (!this.connected || !this.assignmentId) return;

        this.sendMessage({
            type: 'join-session',
            assignmentId: this.assignmentId,
            assignmentType: this.assignmentType,
            user: this.user
        });
    }

    // Send WebSocket message
    sendMessage(message) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    // Handle incoming WebSocket messages
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'block_locked':
                this.handleBlockLocked(message);
                break;
            case 'block_unlocked':
                this.handleBlockUnlocked(message);
                break;
            case 'block_updated':
                this.handleBlockUpdated(message);
                break;
            case 'lock_request_notification':
                this.handleLockRequestNotification(message);
                break;
            case 'lock_granted':
                this.handleLockGranted(message);
                break;
            case 'user_joined':
                this.handleUserJoined(message);
                break;
            case 'user_left':
                this.handleUserLeft(message);
                break;
            case 'session_state':
                this.handleSessionState(message);
                break;
            case 'error':
                this.handleError(message);
                break;
        }
    }

    // Request lock for a block
    async requestBlockLock(blockId) {
        this.sendMessage({
            type: 'request-block-lock',
            blockId,
            assignmentId: this.assignmentId
        });
    }

    // Release lock for a block
    async releaseBlockLock(blockId) {
        this.sendMessage({
            type: 'release-block-lock',
            blockId,
            assignmentId: this.assignmentId
        });
    }

    // Handle block locked event
    handleBlockLocked(message) {
        const { blockId, lockedBy } = message;

        this.lockedBlocks.set(blockId, lockedBy);
        this.updateBlockLockStatus(blockId, true, lockedBy);

        if (lockedBy.userId === this.user.id) {
            this.currentlyEditing = blockId;
            this.enableBlockEditing(blockId);
        } else {
            this.disableBlockEditing(blockId);
        }
    }

    // Handle block unlocked event
    handleBlockUnlocked(message) {
        const { blockId } = message;

        this.lockedBlocks.delete(blockId);
        this.updateBlockLockStatus(blockId, false);

        if (this.currentlyEditing === blockId) {
            this.currentlyEditing = null;
        }
    }

    // Handle block content updated
    handleBlockUpdated(message) {
        const { blockId, content, updatedBy } = message;

        // Don't update if this user made the change
        if (updatedBy.userId === this.user.id) return;

        const block = this.blocks.find(b => b.id === blockId);
        if (block) {
            block.content = content;
            block.modified = new Date().toISOString();
            this.renderBlock(blockId);
        }
    }

    // Handle lock request notification
    handleLockRequestNotification(message) {
        const { blockId, requestingUser, currentEditor, queuePosition } = message;

        if (currentEditor.userId === this.user.id) {
            this.showLockRequestNotification(blockId, requestingUser, queuePosition);
        }
    }

    // Handle lock granted
    handleLockGranted(message) {
        const { blockId, grantedTo } = message;

        if (grantedTo.userId === this.user.id) {
            this.currentlyEditing = blockId;
            this.enableBlockEditing(blockId);
            this.showNotification(`You now have editing access to ${this.getBlockLabel(blockId)}`, 'success');
        }
    }

    // Render the editor
    renderEditor() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="collaborative-editor">
                <div class="editor-header">
                    <div class="assignment-info">
                        <h2>${this.narrativeStructure.name} Editor</h2>
                        <div class="connection-status" id="connection-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Connecting...</span>
                        </div>
                    </div>
                    <div class="editor-actions">
                        <button class="btn btn-secondary" onclick="collaborativeEditor.saveContent()">💾 Save</button>
                        <button class="btn btn-primary" onclick="collaborativeEditor.publishContent()">🚀 Publish</button>
                    </div>
                </div>

                <div class="editor-body">
                    <div class="sections-container" id="sections-container">
                        ${this.renderSections()}
                    </div>

                    <div class="collaboration-sidebar">
                        <div class="active-users" id="active-users">
                            <h3>👥 Active Users</h3>
                            <div class="users-list" id="users-list"></div>
                        </div>

                        <div class="block-queue" id="block-queue">
                            <h3>⏳ Edit Queue</h3>
                            <div class="queue-list" id="queue-list"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="notification-container" id="notification-container"></div>
        `;

        this.setupBlockEventListeners();
    }

    // Render sections based on narrative structure
    renderSections() {
        return this.narrativeStructure.sections.map(section => {
            const sectionBlocks = this.blocks.filter(block => block.sectionId === section.id);

            return `
                <div class="editor-section" data-section-id="${section.id}">
                    <div class="section-header">
                        <h3>${section.label}</h3>
                        ${section.required ? '<span class="required-indicator">*</span>' : ''}
                        ${section.guidelines ? `<p class="section-guidelines">${section.guidelines}</p>` : ''}
                    </div>

                    <div class="section-blocks">
                        ${sectionBlocks.map(block => this.renderBlockHTML(block)).join('')}
                    </div>

                    <div class="section-actions">
                        <button class="btn btn-small btn-secondary" onclick="collaborativeEditor.addBlock('${section.id}')">
                            ➕ Add Block
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render individual block HTML
    renderBlockHTML(block) {
        const technicalBlock = this.technicalBlocks[block.type];
        const isLocked = this.lockedBlocks.has(block.id);
        const lockInfo = this.lockedBlocks.get(block.id);

        return `
            <div class="content-block ${isLocked ? 'locked' : ''}" data-block-id="${block.id}" data-block-type="${block.type}">
                <div class="block-header">
                    <div class="block-type">
                        <span class="block-icon">${technicalBlock.icon}</span>
                        <span class="block-label">${technicalBlock.label}</span>
                    </div>

                    <div class="block-status">
                        ${isLocked ? `
                            <div class="lock-indicator">
                                🔒 ${lockInfo.userId === this.user.id ? 'You' : lockInfo.userName}
                            </div>
                        ` : ''}

                        <button class="btn btn-small btn-secondary block-menu" onclick="collaborativeEditor.showBlockMenu('${block.id}')">
                            ⋮
                        </button>
                    </div>
                </div>

                <div class="block-content">
                    ${this.renderBlockContent(block)}
                </div>
            </div>
        `;
    }

    // Render block content based on type
    renderBlockContent(block) {
        const isEditable = this.currentlyEditing === block.id;
        const isLocked = this.lockedBlocks.has(block.id) && this.currentlyEditing !== block.id;

        switch (block.type) {
            case 'text/heading':
                return `
                    <input type="text"
                           class="block-input heading-input"
                           value="${this.escapeHtml(block.content || '')}"
                           placeholder="Enter heading..."
                           ${isLocked ? 'disabled' : ''}
                           ${isEditable ? 'data-editing="true"' : ''}>
                `;

            case 'text/subheading':
                return `
                    <input type="text"
                           class="block-input subheading-input"
                           value="${this.escapeHtml(block.content || '')}"
                           placeholder="Enter subheading..."
                           ${isLocked ? 'disabled' : ''}
                           ${isEditable ? 'data-editing="true"' : ''}>
                `;

            case 'text/paragraph':
                return `
                    <textarea class="block-textarea paragraph-textarea"
                              placeholder="Enter paragraph content..."
                              ${isLocked ? 'disabled' : ''}
                              ${isEditable ? 'data-editing="true"' : ''}>${this.escapeHtml(block.content || '')}</textarea>
                `;

            case 'text/quote':
                return `
                    <div class="quote-block">
                        <textarea class="block-textarea quote-textarea"
                                  placeholder="Enter quote..."
                                  ${isLocked ? 'disabled' : ''}
                                  ${isEditable ? 'data-editing="true"' : ''}>${this.escapeHtml(block.content?.quote || '')}</textarea>
                        <input type="text"
                               class="block-input citation-input"
                               value="${this.escapeHtml(block.content?.citation || '')}"
                               placeholder="Citation..."
                               ${isLocked ? 'disabled' : ''}
                               ${isEditable ? 'data-editing="true"' : ''}>
                    </div>
                `;

            case 'text/list':
                return this.renderListBlock(block, isLocked, isEditable);

            case 'campaign/callout':
                return `
                    <div class="callout-block">
                        <select class="block-select callout-style" ${isLocked ? 'disabled' : ''}>
                            <option value="info" ${block.content?.style === 'info' ? 'selected' : ''}>Info</option>
                            <option value="warning" ${block.content?.style === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="success" ${block.content?.style === 'success' ? 'selected' : ''}>Success</option>
                        </select>
                        <textarea class="block-textarea callout-content"
                                  placeholder="Callout content..."
                                  ${isLocked ? 'disabled' : ''}
                                  ${isEditable ? 'data-editing="true"' : ''}>${this.escapeHtml(block.content?.content || '')}</textarea>
                    </div>
                `;

            case 'campaign/cta':
                return `
                    <div class="cta-block">
                        <input type="text"
                               class="block-input cta-text"
                               value="${this.escapeHtml(block.content?.text || '')}"
                               placeholder="CTA text..."
                               ${isLocked ? 'disabled' : ''}
                               ${isEditable ? 'data-editing="true"' : ''}>
                        <input type="text"
                               class="block-input cta-button"
                               value="${this.escapeHtml(block.content?.buttonText || '')}"
                               placeholder="Button text..."
                               ${isLocked ? 'disabled' : ''}
                               ${isEditable ? 'data-editing="true"' : ''}>
                        <input type="url"
                               class="block-input cta-url"
                               value="${this.escapeHtml(block.content?.url || '')}"
                               placeholder="URL..."
                               ${isLocked ? 'disabled' : ''}
                               ${isEditable ? 'data-editing="true"' : ''}>
                    </div>
                `;

            case 'press/release-info':
                const releaseTypes = [
                    'FOR IMMEDIATE RELEASE',
                    'FOR RELEASE ON [DATE]',
                    'FOR EMBARGOED RELEASE',
                    'CUSTOM'
                ];
                const showEmbargo = block.content?.releaseType === 'FOR EMBARGOED RELEASE';
                return `
                    <div class="release-info-block">
                        <div class="release-info-row">
                            <label>Release Type:</label>
                            <select class="block-select release-type" ${isLocked ? 'disabled' : ''}>
                                ${releaseTypes.map(type => `
                                    <option value="${type}" ${block.content?.releaseType === type ? 'selected' : ''}>
                                        ${type}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        ${showEmbargo ? `
                            <div class="embargo-section">
                                <div class="release-info-row">
                                    <label>Embargo Date:</label>
                                    <input type="date"
                                           class="block-input embargo-date"
                                           value="${block.content?.embargoDate || ''}"
                                           ${isLocked ? 'disabled' : ''}
                                           ${isEditable ? 'data-editing="true"' : ''}>
                                </div>
                                <div class="release-info-row">
                                    <label>Embargo Time:</label>
                                    <input type="time"
                                           class="block-input embargo-time"
                                           value="${block.content?.embargoTime || ''}"
                                           ${isLocked ? 'disabled' : ''}
                                           ${isEditable ? 'data-editing="true"' : ''}>
                                </div>
                            </div>
                        ` : ''}
                        ${block.content?.releaseType === 'CUSTOM' ? `
                            <div class="release-info-row">
                                <input type="text"
                                       class="block-input custom-release-type"
                                       value="${this.escapeHtml(block.content?.customReleaseType || '')}"
                                       placeholder="Enter custom release type..."
                                       ${isLocked ? 'disabled' : ''}
                                       ${isEditable ? 'data-editing="true"' : ''}>
                            </div>
                        ` : ''}
                        <div class="release-info-row">
                            <label>Location:</label>
                            <input type="text"
                                   class="block-input release-location"
                                   value="${this.escapeHtml(block.content?.location || '')}"
                                   placeholder="City, State"
                                   ${isLocked ? 'disabled' : ''}
                                   ${isEditable ? 'data-editing="true"' : ''}>
                        </div>
                    </div>
                `;

            case 'press/about-selector':
                const aboutTemplates = this.technicalBlocks[block.type]?.attributes?.templates?.default || [];
                return `
                    <div class="about-selector-block">
                        <div class="template-selector">
                            <label>Choose About Template:</label>
                            <select class="block-select about-template" ${isLocked ? 'disabled' : ''}>
                                ${aboutTemplates.map(template => `
                                    <option value="${template.id}" ${block.content?.selectedTemplate === template.id ? 'selected' : ''}>
                                        ${template.name}
                                    </option>
                                `).join('')}
                                <option value="custom" ${block.content?.selectedTemplate === 'custom' ? 'selected' : ''}>
                                    Custom Content
                                </option>
                            </select>
                        </div>
                        <div class="template-preview">
                            ${block.content?.selectedTemplate === 'custom' ? `
                                <textarea class="block-textarea custom-about"
                                          placeholder="Enter custom about section..."
                                          ${isLocked ? 'disabled' : ''}
                                          ${isEditable ? 'data-editing="true"' : ''}>${this.escapeHtml(block.content?.customContent || '')}</textarea>
                            ` : `
                                <div class="template-content">
                                    ${this.getTemplateContent(aboutTemplates, block.content?.selectedTemplate)}
                                </div>
                                <button class="btn btn-small btn-secondary edit-template"
                                        onclick="collaborativeEditor.editTemplate('${block.id}', 'about')"
                                        ${isLocked ? 'disabled' : ''}>
                                    Edit Template
                                </button>
                            `}
                        </div>
                    </div>
                `;

            case 'press/contact-info':
                const contactTemplates = this.technicalBlocks[block.type]?.attributes?.templates?.default || [];
                return `
                    <div class="contact-info-block">
                        <div class="template-selector">
                            <label>Choose Contact Template:</label>
                            <select class="block-select contact-template" ${isLocked ? 'disabled' : ''}>
                                ${contactTemplates.map(template => `
                                    <option value="${template.id}" ${block.content?.selectedTemplate === template.id ? 'selected' : ''}>
                                        ${template.name}
                                    </option>
                                `).join('')}
                                <option value="custom" ${block.content?.selectedTemplate === 'custom' ? 'selected' : ''}>
                                    Custom Content
                                </option>
                            </select>
                        </div>
                        <div class="template-preview">
                            ${block.content?.selectedTemplate === 'custom' ? `
                                <textarea class="block-textarea custom-contact"
                                          placeholder="Enter custom contact information..."
                                          ${isLocked ? 'disabled' : ''}
                                          ${isEditable ? 'data-editing="true"' : ''}>${this.escapeHtml(block.content?.customContent || '')}</textarea>
                            ` : `
                                <div class="template-content">
                                    ${this.getTemplateContent(contactTemplates, block.content?.selectedTemplate)}
                                </div>
                                <button class="btn btn-small btn-secondary edit-template"
                                        onclick="collaborativeEditor.editTemplate('${block.id}', 'contact')"
                                        ${isLocked ? 'disabled' : ''}>
                                    Edit Template
                                </button>
                            `}
                        </div>
                    </div>
                `;

            case 'press/paid-for':
                return `
                    <div class="paid-for-block">
                        <input type="text"
                               class="block-input paid-for-input"
                               value="${this.escapeHtml(block.content || '')}"
                               placeholder="Paid for by [Campaign Name]"
                               ${isLocked ? 'disabled' : ''}
                               ${isEditable ? 'data-editing="true"' : ''}>
                    </div>
                `;

            default:
                return `<p>Unsupported block type: ${block.type}</p>`;
        }
    }

    // Render list block
    renderListBlock(block, isLocked, isEditable) {
        const items = block.content?.items || [];
        const ordered = block.content?.ordered || false;

        return `
            <div class="list-block">
                <div class="list-controls">
                    <label>
                        <input type="checkbox"
                               class="list-ordered"
                               ${ordered ? 'checked' : ''}
                               ${isLocked ? 'disabled' : ''}>
                        Ordered List
                    </label>
                </div>
                <div class="list-items">
                    ${items.map((item, index) => `
                        <div class="list-item">
                            <input type="text"
                                   class="block-input list-item-input"
                                   value="${this.escapeHtml(item)}"
                                   placeholder="List item..."
                                   ${isLocked ? 'disabled' : ''}
                                   ${isEditable ? 'data-editing="true"' : ''}>
                            <button class="btn btn-small btn-secondary remove-item"
                                    onclick="collaborativeEditor.removeListItem('${block.id}', ${index})"
                                    ${isLocked ? 'disabled' : ''}>×</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-small btn-secondary add-item"
                        onclick="collaborativeEditor.addListItem('${block.id}')"
                        ${isLocked ? 'disabled' : ''}>+ Add Item</button>
            </div>
        `;
    }

    // Setup event listeners for blocks
    setupBlockEventListeners() {
        // Block click to request editing
        document.addEventListener('click', (e) => {
            const blockElement = e.target.closest('.content-block');
            if (blockElement && !blockElement.classList.contains('locked')) {
                const blockId = blockElement.dataset.blockId;
                if (this.currentlyEditing !== blockId) {
                    this.requestBlockLock(blockId);
                }
            }
        });

        // Content change events
        document.addEventListener('input', (e) => {
            if (e.target.dataset.editing === 'true') {
                const blockElement = e.target.closest('.content-block');
                if (blockElement) {
                    const blockId = blockElement.dataset.blockId;
                    this.handleBlockContentChange(blockId, e.target);
                }
            }
        });

        // Auto-release lock when user stops editing
        document.addEventListener('focusout', (e) => {
            if (e.target.dataset.editing === 'true') {
                const blockElement = e.target.closest('.content-block');
                if (blockElement) {
                    const blockId = blockElement.dataset.blockId;
                    // Release lock after 5 seconds of inactivity
                    setTimeout(() => {
                        if (this.currentlyEditing === blockId) {
                            this.releaseBlockLock(blockId);
                        }
                    }, 5000);
                }
            }
        });
    }

    // Handle block content changes
    handleBlockContentChange(blockId, element) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        const newContent = this.extractBlockContent(block.type, element.closest('.content-block'));

        // Update local content
        block.content = newContent;
        block.modified = new Date().toISOString();

        // Send update to server
        this.sendMessage({
            type: 'edit-block',
            blockId,
            content: newContent,
            assignmentId: this.assignmentId
        });
    }

    // Extract content from block DOM
    extractBlockContent(blockType, blockElement) {
        switch (blockType) {
            case 'text/heading':
            case 'text/subheading':
            case 'text/paragraph':
                const input = blockElement.querySelector('.block-input, .block-textarea');
                return input ? input.value : '';

            case 'text/quote':
                const quote = blockElement.querySelector('.quote-textarea')?.value || '';
                const citation = blockElement.querySelector('.citation-input')?.value || '';
                return { quote, citation };

            case 'text/list':
                const items = Array.from(blockElement.querySelectorAll('.list-item-input'))
                    .map(input => input.value)
                    .filter(item => item.trim());
                const ordered = blockElement.querySelector('.list-ordered')?.checked || false;
                return { items, ordered };

            case 'campaign/callout':
                const style = blockElement.querySelector('.callout-style')?.value || 'info';
                const content = blockElement.querySelector('.callout-content')?.value || '';
                return { style, content };

            case 'campaign/cta':
                const text = blockElement.querySelector('.cta-text')?.value || '';
                const buttonText = blockElement.querySelector('.cta-button')?.value || '';
                const url = blockElement.querySelector('.cta-url')?.value || '';
                return { text, buttonText, url };

            case 'press/release-info':
                const releaseType = blockElement.querySelector('.release-type')?.value || 'FOR IMMEDIATE RELEASE';
                const customReleaseType = blockElement.querySelector('.custom-release-type')?.value || '';
                const embargoDate = blockElement.querySelector('.embargo-date')?.value || '';
                const embargoTime = blockElement.querySelector('.embargo-time')?.value || '';
                const location = blockElement.querySelector('.release-location')?.value || '';
                return { releaseType, customReleaseType, embargoDate, embargoTime, location };

            case 'press/about-selector':
                const selectedAboutTemplate = blockElement.querySelector('.about-template')?.value || 'campaign-standard';
                const customAboutContent = blockElement.querySelector('.custom-about')?.value || '';
                return { selectedTemplate: selectedAboutTemplate, customContent: customAboutContent };

            case 'press/contact-info':
                const selectedContactTemplate = blockElement.querySelector('.contact-template')?.value || 'press-secretary';
                const customContactContent = blockElement.querySelector('.custom-contact')?.value || '';
                return { selectedTemplate: selectedContactTemplate, customContent: customContactContent };

            case 'press/paid-for':
                const paidForInput = blockElement.querySelector('.paid-for-input');
                return paidForInput ? paidForInput.value : '';

            default:
                return '';
        }
    }

    // Update block lock status in UI
    updateBlockLockStatus(blockId, isLocked, lockInfo = null) {
        const blockElement = this.blockElements.get(blockId) ||
                            document.querySelector(`[data-block-id="${blockId}"]`);

        if (!blockElement) return;

        if (isLocked) {
            blockElement.classList.add('locked');
            const lockIndicator = blockElement.querySelector('.lock-indicator');
            if (lockIndicator && lockInfo) {
                lockIndicator.innerHTML = `🔒 ${lockInfo.userId === this.user.id ? 'You' : lockInfo.userName}`;
            }
        } else {
            blockElement.classList.remove('locked');
        }
    }

    // Enable editing for a block
    enableBlockEditing(blockId) {
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!blockElement) return;

        // Enable all inputs and textareas
        blockElement.querySelectorAll('input, textarea, select').forEach(element => {
            element.disabled = false;
            element.dataset.editing = 'true';
        });

        blockElement.classList.add('editing');
    }

    // Disable editing for a block
    disableBlockEditing(blockId) {
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        if (!blockElement) return;

        // Disable all inputs and textareas
        blockElement.querySelectorAll('input, textarea, select').forEach(element => {
            element.disabled = true;
            delete element.dataset.editing;
        });

        blockElement.classList.remove('editing');
    }

    // Show lock request notification
    showLockRequestNotification(blockId, requestingUser, queuePosition) {
        const blockLabel = this.getBlockLabel(blockId);

        this.showNotification(
            `${requestingUser.userName} (${requestingUser.role}) wants to edit "${blockLabel}". Queue position: ${queuePosition}`,
            'info',
            {
                action: 'Release Lock',
                callback: () => this.releaseBlockLock(blockId)
            }
        );
    }

    // Get human-readable block label
    getBlockLabel(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return 'Unknown Block';

        const technicalBlock = this.technicalBlocks[block.type];
        const section = this.narrativeStructure.sections.find(s => s.id === block.sectionId);

        return `${section?.label || 'Unknown Section'} - ${technicalBlock?.label || block.type}`;
    }

    // Show connection status
    showConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('.status-text');

        statusElement.className = `connection-status ${status}`;

        switch (status) {
            case 'connected':
                statusText.textContent = 'Connected';
                break;
            case 'disconnected':
                statusText.textContent = 'Disconnected - Reconnecting...';
                break;
            case 'error':
                statusText.textContent = 'Connection Error';
                break;
            default:
                statusText.textContent = 'Connecting...';
        }
    }

    // Show notification
    showNotification(message, type = 'info', action = null) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                ${action ? `<button class="notification-action" onclick="${action.callback.toString()}">${action.action}</button>` : ''}
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Show error message
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Get template content by ID
    getTemplateContent(templates, templateId) {
        const template = templates.find(t => t.id === templateId);
        return template ? template.content.replace(/\n/g, '<br>') : '';
    }

    // Edit template method
    editTemplate(blockId, templateType) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        // Switch to custom mode for editing
        block.content.selectedTemplate = 'custom';

        // Get current template content as starting point
        const templates = this.technicalBlocks[block.type]?.attributes?.templates?.default || [];
        const currentTemplate = templates.find(t => t.id === block.content.selectedTemplate);

        if (currentTemplate) {
            block.content.customContent = currentTemplate.content;
        }

        // Re-render the block
        this.renderBlock(blockId);
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // API Methods
    async saveContent() {
        try {
            const response = await fetch(`${this.apiBase}/content/${this.assignmentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blocks: this.blocks,
                    assignmentType: this.assignmentType
                })
            });

            if (response.ok) {
                this.showNotification('Content saved successfully', 'success');
            } else {
                throw new Error('Failed to save content');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showError('Failed to save content');
        }
    }

    async publishContent() {
        if (!confirm('Are you sure you want to publish this content?')) return;

        try {
            const response = await fetch(`${this.apiBase}/content/${this.assignmentId}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blocks: this.blocks
                })
            });

            if (response.ok) {
                this.showNotification('Content published successfully', 'success');
                // Redirect or update UI as needed
            } else {
                throw new Error('Failed to publish content');
            }
        } catch (error) {
            console.error('Publish error:', error);
            this.showError('Failed to publish content');
        }
    }

    // Block management methods
    addBlock(sectionId) {
        const section = this.narrativeStructure.sections.find(s => s.id === sectionId);
        if (!section || !section.suggestedBlocks.length) return;

        // For simplicity, add the first suggested block type
        const blockType = section.suggestedBlocks[0];
        const technicalBlock = this.technicalBlocks[blockType];

        const newBlock = {
            id: `${sectionId}-${blockType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: blockType,
            sectionId: sectionId,
            content: this.getDefaultContent(blockType, section),
            attributes: { ...technicalBlock.attributes },
            locked: false,
            lockedBy: null,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        this.blocks.push(newBlock);
        this.renderEditor(); // Re-render to show new block
    }

    addListItem(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block || block.type !== 'text/list') return;

        if (!block.content) block.content = { items: [], ordered: false };
        if (!block.content.items) block.content.items = [];

        block.content.items.push('');
        this.renderBlock(blockId);
    }

    removeListItem(blockId, index) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block || block.type !== 'text/list' || !block.content?.items) return;

        block.content.items.splice(index, 1);
        this.renderBlock(blockId);
    }

    renderBlock(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);

        if (block && blockElement) {
            const contentContainer = blockElement.querySelector('.block-content');
            contentContainer.innerHTML = this.renderBlockContent(block);
        }
    }

    showBlockMenu(blockId) {
        // Implement block context menu (delete, duplicate, etc.)
        console.log('Show block menu for:', blockId);
    }

    // Handle various WebSocket events
    handleUserJoined(message) {
        console.log('User joined:', message.user);
        this.updateActiveUsers(message.activeUsers);
    }

    handleUserLeft(message) {
        console.log('User left:', message.user);
        this.updateActiveUsers(message.activeUsers);
    }

    handleSessionState(message) {
        console.log('Session state:', message);
        this.updateActiveUsers(message.activeUsers);

        // Update locked blocks
        message.lockedBlocks.forEach(lockInfo => {
            this.lockedBlocks.set(lockInfo.blockId, lockInfo.lockedBy);
            this.updateBlockLockStatus(lockInfo.blockId, true, lockInfo.lockedBy);
        });
    }

    handleError(message) {
        console.error('Collaboration error:', message.error);
        this.showError(message.error);
    }

    updateActiveUsers(users) {
        const usersContainer = document.getElementById('users-list');
        if (!usersContainer) return;

        usersContainer.innerHTML = users.map(user => `
            <div class="active-user ${user.id === this.user.id ? 'current-user' : ''}">
                <span class="user-avatar">${user.userName.charAt(0).toUpperCase()}</span>
                <span class="user-name">${user.userName}</span>
                <span class="user-role">${user.role}</span>
            </div>
        `).join('');
    }
}

// Export for global access
window.CollaborativeBlockEditor = CollaborativeBlockEditor;