// Collaboration Manager - Phase 2 Implementation
// Role-based real-time collaborative editing for campaign assignments

const WebSocket = require('ws');
const { requirePermission } = require('../middleware/authorization');
const blockManager = require('./block-manager');
const { getEditorialStructure } = require('./block-structures');

class CollaborationManager {
    constructor() {
        this.sessions = new Map(); // assignmentId -> session
        this.userConnections = new Map(); // userId -> { ws, role, assignmentId }
        this.wss = null;
    }

    initialize(server) {
        // Create WebSocket server on port 8080
        this.wss = new WebSocket.Server({
            port: 8080,
            verifyClient: (info) => {
                // Basic verification - in production would verify JWT token
                return true;
            }
        });

        console.log('🔗 Collaboration WebSocket server started on port 8080');

        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        // Set up periodic cleanup of stale blocks (every 2 minutes)
        setInterval(() => {
            blockManager.releaseStaleBlocks();
        }, 2 * 60 * 1000);

        // Set up block manager event listeners
        this.setupBlockManagerEvents();

        return this.wss;
    }

    handleConnection(ws, req) {
        console.log('📡 New collaboration connection');

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await this.handleMessage(ws, data);
            } catch (error) {
                console.error('Collaboration message error:', error);
                this.sendError(ws, 'Invalid message format');
            }
        });

        ws.on('close', () => {
            this.handleDisconnection(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }

    async handleMessage(ws, data) {
        const { type, assignmentId, userId, role } = data;

        switch (type) {
            case 'join':
                await this.handleJoin(ws, data);
                break;
            case 'request-block-lock':
                await this.handleBlockLockRequest(ws, data);
                break;
            case 'release-block-lock':
                await this.handleBlockRelease(ws, data);
                break;
            case 'edit-block':
                await this.handleBlockEdit(ws, data);
                break;
            case 'cursor':
                await this.handleCursor(ws, data);
                break;
            case 'comment':
                await this.handleComment(ws, data);
                break;
            case 'approve':
                await this.handleApproval(ws, data);
                break;
            default:
                this.sendError(ws, `Unknown message type: ${type}`);
        }
    }

    async handleJoin(ws, data) {
        const { assignmentId, userId, role, userName } = data;

        // Verify user has permission to access this assignment
        const canAccess = await this.checkAssignmentAccess(userId, role, assignmentId);
        if (!canAccess) {
            this.sendError(ws, 'Access denied to assignment');
            return;
        }

        // Add user to connections
        this.userConnections.set(userId, {
            ws,
            role,
            assignmentId,
            userName,
            joinedAt: new Date()
        });

        // Get or create session
        let session = this.sessions.get(assignmentId);
        if (!session) {
            session = await this.createSession(assignmentId);
            this.sessions.set(assignmentId, session);
        }

        // Add user to session
        session.activeUsers.set(userId, {
            userId,
            role,
            userName,
            cursor: { line: 0, column: 0 },
            lastActivity: new Date()
        });

        // Send current document state to joining user
        ws.send(JSON.stringify({
            type: 'document_state',
            assignmentId,
            assignmentType: session.assignmentType,
            editorialStructure: {
                narrative: session.editorialStructure.narrative,
                technicalBlocks: Object.keys(session.editorialStructure.technicalBlocks)
            },
            content: session.document.content,
            blocks: Array.from(session.blocks.entries()),
            version: session.document.version,
            activeUsers: Array.from(session.activeUsers.values()),
            permissions: this.getUserPermissions(role, session.document.status),
            blockLocks: this.getBlockLocksForAssignment(assignmentId)
        }));

        // Notify other users of new participant
        this.broadcastToSession(assignmentId, {
            type: 'user_joined',
            user: { userId, role, userName },
            activeUsers: Array.from(session.activeUsers.values())
        }, userId);

        console.log(`👤 User ${userName} (${role}) joined assignment ${assignmentId}`);
    }

    async handleEdit(ws, data) {
        const { assignmentId, userId, operation } = data;

        const session = this.sessions.get(assignmentId);
        if (!session) {
            this.sendError(ws, 'Session not found');
            return;
        }

        const user = session.activeUsers.get(userId);
        if (!user) {
            this.sendError(ws, 'User not in session');
            return;
        }

        // Check if user has edit permissions
        const permissions = this.getUserPermissions(user.role, session.document.status);
        if (!permissions.canEdit) {
            this.sendError(ws, 'No edit permission for current document status');
            return;
        }

        // Apply operational transform
        const transformedOperation = this.transformOperation(operation, session.pendingOperations);

        // Apply to document
        const result = this.applyOperation(session.document, transformedOperation);
        if (result.success) {
            session.document = result.document;
            session.document.version++;
            session.document.lastModified = new Date();
            session.document.lastModifiedBy = userId;

            // Broadcast to all users in session
            this.broadcastToSession(assignmentId, {
                type: 'edit_applied',
                operation: transformedOperation,
                version: session.document.version,
                author: { userId: user.userId, userName: user.userName, role: user.role }
            });

            // Update user activity
            user.lastActivity = new Date();

            console.log(`✏️ Edit applied by ${user.userName} on ${assignmentId}`);
        } else {
            this.sendError(ws, result.error);
        }
    }

    // Handle block lock request
    async handleBlockLockRequest(ws, data) {
        const { assignmentId, userId, blockId, userName, role } = data;

        const session = this.sessions.get(assignmentId);
        if (!session) {
            this.sendError(ws, 'Session not found');
            return;
        }

        // Request block lock through BlockManager
        const result = await blockManager.requestBlockLock(blockId, userId, { userName, role });

        if (result.granted) {
            // Notify all users in session about the lock
            this.broadcastToSession(assignmentId, {
                type: 'block_locked',
                blockId,
                lockedBy: { userId, userName, role }
            });

            // Send confirmation to requester
            ws.send(JSON.stringify({
                type: 'block_lock_granted',
                blockId,
                message: result.message
            }));
        } else if (result.queued) {
            // Notify user they're in queue
            ws.send(JSON.stringify({
                type: 'block_lock_queued',
                blockId,
                queuePosition: result.queuePosition,
                currentEditor: result.currentEditor,
                message: result.message
            }));

            // Notify current editor about the request
            const currentEditorConnection = this.userConnections.get(blockManager.blockSessions.get(blockId)?.lockedBy?.userId);
            if (currentEditorConnection && currentEditorConnection.ws.readyState === WebSocket.OPEN) {
                currentEditorConnection.ws.send(JSON.stringify({
                    type: 'block_access_requested',
                    blockId,
                    requestingUser: { userId, userName, role },
                    queueLength: blockManager.blockSessions.get(blockId)?.queue?.length || 1
                }));
            }
        }

        console.log(`🔒 Block lock request: ${userName} for block ${blockId} - ${result.granted ? 'GRANTED' : 'QUEUED'}`);
    }

    // Handle block release
    async handleBlockRelease(ws, data) {
        const { assignmentId, userId, blockId } = data;

        const session = this.sessions.get(assignmentId);
        if (!session) {
            this.sendError(ws, 'Session not found');
            return;
        }

        // Release block through BlockManager
        const released = blockManager.unlockBlock(blockId, userId);

        if (released) {
            // Notify all users about the release
            this.broadcastToSession(assignmentId, {
                type: 'block_unlocked',
                blockId,
                releasedBy: userId
            });

            console.log(`🔓 Block ${blockId} released by user ${userId}`);
        }
    }

    // Handle block content edit
    async handleBlockEdit(ws, data) {
        const { assignmentId, userId, blockId, content, operation } = data;

        const session = this.sessions.get(assignmentId);
        if (!session) {
            this.sendError(ws, 'Session not found');
            return;
        }

        // Check if user has lock on this block
        const blockStatus = blockManager.getBlockStatus(blockId);
        if (!blockStatus.isLocked || blockStatus.lockedBy.userId !== userId) {
            this.sendError(ws, 'You must lock the block before editing');
            return;
        }

        // Update block activity
        blockManager.updateActivity(blockId, userId);

        // Store block content in session
        if (!session.blocks) {
            session.blocks = new Map();
        }
        session.blocks.set(blockId, {
            content,
            lastModified: new Date(),
            lastModifiedBy: userId,
            version: (session.blocks.get(blockId)?.version || 0) + 1
        });

        // Broadcast block update to all users
        this.broadcastToSession(assignmentId, {
            type: 'block_updated',
            blockId,
            content,
            version: session.blocks.get(blockId).version,
            author: session.activeUsers.get(userId)
        }, userId);

        console.log(`✏️ Block ${blockId} edited by user ${userId}`);
    }

    async handleCursor(ws, data) {
        const { assignmentId, userId, cursor } = data;

        const session = this.sessions.get(assignmentId);
        if (!session) return;

        const user = session.activeUsers.get(userId);
        if (!user) return;

        // Update cursor position
        user.cursor = cursor;
        user.lastActivity = new Date();

        // Broadcast cursor update to other users
        this.broadcastToSession(assignmentId, {
            type: 'cursor_update',
            userId,
            userName: user.userName,
            role: user.role,
            cursor
        }, userId);
    }

    async handleComment(ws, data) {
        const { assignmentId, userId, comment } = data;

        const session = this.sessions.get(assignmentId);
        if (!session) {
            this.sendError(ws, 'Session not found');
            return;
        }

        const user = session.activeUsers.get(userId);
        if (!user) return;

        // Check comment permissions
        const permissions = this.getUserPermissions(user.role, session.document.status);
        if (!permissions.canComment) {
            this.sendError(ws, 'No comment permission');
            return;
        }

        // Add comment to session
        const commentData = {
            id: Date.now().toString(),
            userId,
            userName: user.userName,
            role: user.role,
            text: comment.text,
            position: comment.position,
            timestamp: new Date(),
            resolved: false
        };

        session.comments.push(commentData);

        // Broadcast comment to all users
        this.broadcastToSession(assignmentId, {
            type: 'comment_added',
            comment: commentData
        });

        console.log(`💬 Comment added by ${user.userName} on ${assignmentId}`);
    }

    async handleApproval(ws, data) {
        const { assignmentId, userId, action } = data; // action: 'approve', 'reject', 'request_changes'

        const session = this.sessions.get(assignmentId);
        if (!session) {
            this.sendError(ws, 'Session not found');
            return;
        }

        const user = session.activeUsers.get(userId);
        if (!user) return;

        // Check approval permissions
        const permissions = this.getUserPermissions(user.role, session.document.status);
        if (!permissions.canApprove) {
            this.sendError(ws, 'No approval permission');
            return;
        }

        // Apply approval action
        let newStatus = session.document.status;
        if (action === 'approve') {
            newStatus = this.getNextApprovalStatus(session.document.status, user.role);
        } else if (action === 'reject') {
            newStatus = 'rejected';
        } else if (action === 'request_changes') {
            newStatus = 'revision_requested';
        }

        session.document.status = newStatus;
        session.document.lastModified = new Date();
        session.document.lastModifiedBy = userId;

        // Broadcast status change
        this.broadcastToSession(assignmentId, {
            type: 'status_changed',
            oldStatus: session.document.status,
            newStatus,
            action,
            approver: { userId: user.userId, userName: user.userName, role: user.role },
            timestamp: new Date()
        });

        console.log(`✅ ${action} applied by ${user.userName} (${user.role}) on ${assignmentId}`);
    }

    handleDisconnection(ws) {
        // Find and remove user from connections
        let disconnectedUser = null;
        for (const [userId, connection] of this.userConnections.entries()) {
            if (connection.ws === ws) {
                disconnectedUser = { userId, ...connection };
                this.userConnections.delete(userId);
                break;
            }
        }

        if (disconnectedUser) {
            const { userId, assignmentId, userName, role } = disconnectedUser;
            const session = this.sessions.get(assignmentId);

            if (session) {
                session.activeUsers.delete(userId);

                // Notify remaining users
                this.broadcastToSession(assignmentId, {
                    type: 'user_left',
                    userId,
                    userName,
                    role,
                    activeUsers: Array.from(session.activeUsers.values())
                });

                console.log(`👋 User ${userName} left assignment ${assignmentId}`);

                // Clean up empty sessions
                if (session.activeUsers.size === 0) {
                    this.sessions.delete(assignmentId);
                    console.log(`🧹 Cleaned up empty session for ${assignmentId}`);
                }
            }
        }
    }

    // Set up event listeners for block manager events
    setupBlockManagerEvents() {
        blockManager.on('lock-granted', (data) => {
            // Notify the granted user
            const connection = this.userConnections.get(data.grantedTo.userId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(JSON.stringify({
                    type: 'block_lock_granted',
                    blockId: data.blockId,
                    message: 'Block lock granted from queue'
                }));
            }

            // Broadcast to all users in the session
            const session = this.sessions.get(connection?.assignmentId);
            if (session) {
                this.broadcastToSession(connection.assignmentId, {
                    type: 'block_locked',
                    blockId: data.blockId,
                    lockedBy: data.grantedTo
                });
            }
        });

        blockManager.on('stale-lock-released', (data) => {
            // Find the assignment for this block and notify all users
            for (const [assignmentId, session] of this.sessions.entries()) {
                if (data.blockId.includes(assignmentId)) {
                    this.broadcastToSession(assignmentId, {
                        type: 'block_unlocked',
                        blockId: data.blockId,
                        reason: 'stale_lock_timeout',
                        inactiveTime: data.inactiveTime
                    });
                    break;
                }
            }
        });

        blockManager.on('emergency-unlock', (data) => {
            // Notify all users about emergency unlock
            for (const [assignmentId, session] of this.sessions.entries()) {
                if (data.blockId.includes(assignmentId)) {
                    this.broadcastToSession(assignmentId, {
                        type: 'emergency_unlock',
                        blockId: data.blockId,
                        unlockedBy: data.unlockedBy,
                        previousEditor: data.previousEditor
                    });
                    break;
                }
            }
        });
    }

    // Utility methods
    async createSession(assignmentId) {
        // In a real implementation, load from database
        // For now, assuming assignmentId contains type info (e.g., 'PR-2025-001' for press release)
        let assignmentType = 'press-release'; // Default

        if (assignmentId.startsWith('PR') || assignmentId.includes('press')) {
            assignmentType = 'press-release';
        } else if (assignmentId.startsWith('OP') || assignmentId.includes('op-ed')) {
            assignmentType = 'op-ed';
        } else if (assignmentId.startsWith('SPE') || assignmentId.includes('speech')) {
            assignmentType = 'speech';
        } else if (assignmentId.startsWith('SOC') || assignmentId.includes('social')) {
            assignmentType = 'social-media';
        } else if (assignmentId.startsWith('TP') || assignmentId.includes('talking')) {
            assignmentType = 'talking-points';
        }

        // Get the editorial structure for this assignment type
        const editorialStructure = getEditorialStructure(assignmentType);

        return {
            assignmentId,
            assignmentType,
            editorialStructure,
            document: {
                content: '', // Load from database
                version: 1,
                status: 'draft',
                lastModified: new Date(),
                lastModifiedBy: null
            },
            blocks: new Map(), // blockId -> block content
            activeUsers: new Map(),
            comments: [],
            pendingOperations: []
        };
    }

    async checkAssignmentAccess(userId, role, assignmentId) {
        // Simplified access check - in production would check database
        const allowedRoles = ['senior_writer', 'press_secretary', 'communications_director', 'campaign_manager'];
        return allowedRoles.includes(role);
    }

    getUserPermissions(role, documentStatus) {
        const permissions = {
            canEdit: false,
            canComment: true,
            canApprove: false,
            canOverride: false
        };

        // Role-based permissions
        switch (role) {
            case 'senior_writer':
                permissions.canEdit = documentStatus === 'draft' || documentStatus === 'revision_requested';
                break;
            case 'press_secretary':
                permissions.canEdit = true;
                permissions.canApprove = true;
                permissions.canOverride = true;
                break;
            case 'communications_director':
            case 'campaign_manager':
                permissions.canEdit = true;
                permissions.canApprove = true;
                permissions.canOverride = true;
                break;
        }

        return permissions;
    }

    getNextApprovalStatus(currentStatus, approverRole) {
        // Simplified approval workflow
        if (approverRole === 'press_secretary') {
            return 'approved';
        }
        return currentStatus;
    }

    transformOperation(operation, pendingOps) {
        // Simple operational transform - Phase 2 implementation
        let transformedOp = { ...operation };

        for (const pendingOp of pendingOps) {
            if (pendingOp.type === 'insert' && operation.type === 'insert') {
                if (pendingOp.position <= operation.position) {
                    transformedOp.position += pendingOp.text.length;
                }
            } else if (pendingOp.type === 'delete' && operation.type === 'insert') {
                if (pendingOp.position < operation.position) {
                    transformedOp.position -= pendingOp.length;
                }
            }
        }

        return transformedOp;
    }

    applyOperation(document, operation) {
        try {
            let content = document.content;

            switch (operation.type) {
                case 'insert':
                    content = content.slice(0, operation.position) +
                             operation.text +
                             content.slice(operation.position);
                    break;
                case 'delete':
                    content = content.slice(0, operation.position) +
                             content.slice(operation.position + operation.length);
                    break;
                default:
                    return { success: false, error: 'Unknown operation type' };
            }

            return {
                success: true,
                document: {
                    ...document,
                    content
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    broadcastToSession(assignmentId, message, excludeUserId = null) {
        const session = this.sessions.get(assignmentId);
        if (!session) return;

        for (const [userId, user] of session.activeUsers.entries()) {
            if (excludeUserId && userId === excludeUserId) continue;

            const connection = this.userConnections.get(userId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(JSON.stringify(message));
            }
        }
    }

    sendError(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'error',
                message
            }));
        }
    }

    // Get session info for API endpoints
    getSessionInfo(assignmentId) {
        const session = this.sessions.get(assignmentId);
        if (!session) return null;

        return {
            assignmentId,
            assignmentType: session.assignmentType,
            activeUsers: Array.from(session.activeUsers.values()),
            documentVersion: session.document.version,
            lastModified: session.document.lastModified,
            status: session.document.status,
            blockLocks: this.getBlockLocksForAssignment(assignmentId)
        };
    }

    // Get all block locks for an assignment
    getBlockLocksForAssignment(assignmentId) {
        const locks = [];
        for (const [blockId, blockSession] of blockManager.blockSessions.entries()) {
            // Filter blocks by assignment (simple implementation - could be more sophisticated)
            if (blockId.includes(assignmentId) || blockId.startsWith(assignmentId)) {
                locks.push({
                    blockId,
                    isLocked: blockSession.isLocked,
                    lockedBy: blockSession.lockedBy,
                    queue: blockSession.queue.map(q => ({
                        userId: q.userId,
                        userName: q.userName,
                        role: q.role,
                        requestedAt: q.requestedAt
                    })),
                    lastActivity: blockSession.lastActivity
                });
            }
        }
        return locks;
    }

    // Get statistics including block locks
    getStatistics() {
        const basicStats = blockManager.getStatistics();
        return {
            ...basicStats,
            activeSessions: this.sessions.size,
            totalConnectedUsers: this.userConnections.size,
            sessionTypes: Array.from(this.sessions.values()).reduce((acc, session) => {
                acc[session.assignmentType] = (acc[session.assignmentType] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

module.exports = new CollaborationManager();