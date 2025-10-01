// Block-Based Collaboration Manager
// Implements hierarchical block locking with queue management

const EventEmitter = require('events');

class BlockManager extends EventEmitter {
    constructor() {
        super();
        this.blockSessions = new Map(); // blockId -> lock info
        this.userBlocks = new Map(); // userId -> Set of blockIds
        this.hierarchyOrder = {
            'campaign_manager': 1,
            'communications_director': 2,
            'deputy_communications_director': 3,
            'press_secretary': 4,
            'senior_writer': 5,
            'writer': 6,
            'researcher': 7
        };
    }

    // Request to lock a block for editing
    async requestBlockLock(blockId, userId, userInfo) {
        const { userName, role } = userInfo;

        let blockSession = this.blockSessions.get(blockId);

        // If block is not locked, grant immediate access
        if (!blockSession || !blockSession.isLocked) {
            this.lockBlock(blockId, userId, userInfo);
            return {
                success: true,
                granted: true,
                message: 'Block lock granted immediately'
            };
        }

        // If same user already has lock, return success
        if (blockSession.lockedBy.userId === userId) {
            return {
                success: true,
                granted: true,
                message: 'You already have the lock'
            };
        }

        // Check if user has override authority
        if (this.canOverride(role, blockSession.lockedBy.role)) {
            // Notify current editor of override
            this.emit('lock-override', {
                blockId,
                previousEditor: blockSession.lockedBy,
                newEditor: userInfo,
                reason: 'Hierarchical override'
            });

            // Grant override access
            this.unlockBlock(blockId, blockSession.lockedBy.userId);
            this.lockBlock(blockId, userId, userInfo);

            return {
                success: true,
                granted: true,
                override: true,
                message: 'Lock granted via hierarchical override'
            };
        }

        // Add to priority queue
        this.addToQueue(blockId, userId, userInfo);

        // Notify current editor of queue request
        this.emit('queue-request', {
            blockId,
            currentEditor: blockSession.lockedBy,
            requestingUser: userInfo,
            queuePosition: blockSession.queue.length,
            queueLength: blockSession.queue.length
        });

        return {
            success: true,
            granted: false,
            queued: true,
            queuePosition: blockSession.queue.length,
            currentEditor: blockSession.lockedBy.userName,
            message: `Added to queue at position ${blockSession.queue.length}`
        };
    }

    // Lock a block for a user
    lockBlock(blockId, userId, userInfo) {
        const lockInfo = {
            isLocked: true,
            lockedBy: {
                userId,
                userName: userInfo.userName,
                role: userInfo.role,
                since: new Date().toISOString()
            },
            queue: [],
            lastActivity: new Date().toISOString()
        };

        this.blockSessions.set(blockId, lockInfo);

        // Track user's locked blocks
        if (!this.userBlocks.has(userId)) {
            this.userBlocks.set(userId, new Set());
        }
        this.userBlocks.get(userId).add(blockId);

        // Emit lock event
        this.emit('block-locked', {
            blockId,
            lockedBy: lockInfo.lockedBy
        });

        console.log(`🔒 Block ${blockId} locked by ${userInfo.userName} (${userInfo.role})`);
    }

    // Unlock a block
    unlockBlock(blockId, userId) {
        const blockSession = this.blockSessions.get(blockId);
        if (!blockSession) return false;

        // Verify user has the lock
        if (blockSession.lockedBy.userId !== userId) {
            return false;
        }

        // Remove from user's blocks
        const userBlockSet = this.userBlocks.get(userId);
        if (userBlockSet) {
            userBlockSet.delete(blockId);
        }

        // Process queue - grant to next in line
        if (blockSession.queue.length > 0) {
            const nextUser = blockSession.queue.shift();

            // Lock for next user
            this.lockBlock(blockId, nextUser.userId, nextUser);

            // Notify next user
            this.emit('lock-granted', {
                blockId,
                grantedTo: nextUser,
                previousEditor: blockSession.lockedBy
            });

            console.log(`🔓→🔒 Block ${blockId} transferred from ${blockSession.lockedBy.userName} to ${nextUser.userName}`);
        } else {
            // No one in queue, remove lock entirely
            this.blockSessions.delete(blockId);

            this.emit('block-unlocked', {
                blockId,
                unlockedBy: blockSession.lockedBy
            });

            console.log(`🔓 Block ${blockId} unlocked by ${blockSession.lockedBy.userName}`);
        }

        return true;
    }

    // Add user to block's priority queue
    addToQueue(blockId, userId, userInfo) {
        const blockSession = this.blockSessions.get(blockId);
        if (!blockSession) return;

        // Check if already in queue
        const existingIndex = blockSession.queue.findIndex(u => u.userId === userId);
        if (existingIndex !== -1) return;

        // Add to queue
        const queueEntry = {
            userId,
            userName: userInfo.userName,
            role: userInfo.role,
            requestedAt: new Date().toISOString()
        };

        blockSession.queue.push(queueEntry);

        // Sort by hierarchy (lower number = higher priority)
        blockSession.queue.sort((a, b) => {
            const priorityA = this.hierarchyOrder[a.role] || 999;
            const priorityB = this.hierarchyOrder[b.role] || 999;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Same role level, maintain request order (FIFO)
            return new Date(a.requestedAt) - new Date(b.requestedAt);
        });
    }

    // Remove user from queue
    removeFromQueue(blockId, userId) {
        const blockSession = this.blockSessions.get(blockId);
        if (!blockSession) return;

        blockSession.queue = blockSession.queue.filter(u => u.userId !== userId);
    }

    // Check if a role can override another role's lock
    canOverride(requestingRole, currentRole) {
        const requestingPriority = this.hierarchyOrder[requestingRole] || 999;
        const currentPriority = this.hierarchyOrder[currentRole] || 999;

        // Can override if significantly higher in hierarchy (at least 2 levels)
        return requestingPriority < currentPriority - 1;
    }

    // Update activity timestamp for a locked block
    updateActivity(blockId, userId) {
        const blockSession = this.blockSessions.get(blockId);
        if (!blockSession || blockSession.lockedBy.userId !== userId) return;

        blockSession.lastActivity = new Date().toISOString();
    }

    // Release stale locks (no activity for 5 minutes)
    releaseStaleBlocks() {
        const staleThreshold = 5 * 60 * 1000; // 5 minutes
        const now = new Date();

        for (const [blockId, session] of this.blockSessions.entries()) {
            const lastActivity = new Date(session.lastActivity);
            const timeSinceActivity = now - lastActivity;

            if (timeSinceActivity > staleThreshold) {
                console.log(`⏰ Releasing stale lock on block ${blockId} (inactive for ${Math.round(timeSinceActivity / 1000)}s)`);

                this.emit('stale-lock-released', {
                    blockId,
                    previousEditor: session.lockedBy,
                    inactiveTime: timeSinceActivity
                });

                // Unlock will automatically grant to next in queue
                this.unlockBlock(blockId, session.lockedBy.userId);
            }
        }
    }

    // Get block status
    getBlockStatus(blockId) {
        const blockSession = this.blockSessions.get(blockId);
        if (!blockSession) {
            return { isLocked: false, available: true };
        }

        return {
            isLocked: blockSession.isLocked,
            lockedBy: blockSession.lockedBy,
            queue: blockSession.queue,
            lastActivity: blockSession.lastActivity
        };
    }

    // Get all blocks locked by a user
    getUserBlocks(userId) {
        const userBlockSet = this.userBlocks.get(userId);
        if (!userBlockSet) return [];

        const blocks = [];
        for (const blockId of userBlockSet) {
            const blockSession = this.blockSessions.get(blockId);
            if (blockSession) {
                blocks.push({
                    blockId,
                    lockedSince: blockSession.lockedBy.since,
                    lastActivity: blockSession.lastActivity,
                    queueLength: blockSession.queue.length
                });
            }
        }
        return blocks;
    }

    // Release all blocks held by a user (on disconnect)
    releaseUserBlocks(userId) {
        const userBlockSet = this.userBlocks.get(userId);
        if (!userBlockSet) return;

        for (const blockId of userBlockSet) {
            this.unlockBlock(blockId, userId);
        }

        this.userBlocks.delete(userId);
    }

    // Get queue position for a user on a specific block
    getQueuePosition(blockId, userId) {
        const blockSession = this.blockSessions.get(blockId);
        if (!blockSession) return -1;

        const position = blockSession.queue.findIndex(u => u.userId === userId);
        return position === -1 ? -1 : position + 1; // 1-indexed for display
    }

    // Emergency unlock by admin or high-level role
    emergencyUnlock(blockId, requestingUserId, requestingRole) {
        const allowedRoles = ['campaign_manager', 'communications_director', 'admin'];

        if (!allowedRoles.includes(requestingRole)) {
            return { success: false, message: 'Insufficient privileges for emergency unlock' };
        }

        const blockSession = this.blockSessions.get(blockId);
        if (!blockSession) {
            return { success: false, message: 'Block is not locked' };
        }

        const previousEditor = blockSession.lockedBy;

        // Force unlock
        this.blockSessions.delete(blockId);

        // Remove from user's blocks
        const userBlockSet = this.userBlocks.get(previousEditor.userId);
        if (userBlockSet) {
            userBlockSet.delete(blockId);
        }

        this.emit('emergency-unlock', {
            blockId,
            unlockedBy: { userId: requestingUserId, role: requestingRole },
            previousEditor,
            timestamp: new Date().toISOString()
        });

        console.log(`🚨 Emergency unlock of block ${blockId} by ${requestingRole}`);

        return {
            success: true,
            message: 'Block emergency unlocked',
            previousEditor: previousEditor.userName
        };
    }

    // Get statistics for monitoring
    getStatistics() {
        const stats = {
            totalLockedBlocks: this.blockSessions.size,
            totalUsersWithLocks: this.userBlocks.size,
            totalQueuedRequests: 0,
            blocksByRole: {},
            longestQueue: { blockId: null, length: 0 }
        };

        for (const [blockId, session] of this.blockSessions.entries()) {
            // Count queued requests
            stats.totalQueuedRequests += session.queue.length;

            // Track longest queue
            if (session.queue.length > stats.longestQueue.length) {
                stats.longestQueue = {
                    blockId,
                    length: session.queue.length
                };
            }

            // Count blocks by role
            const role = session.lockedBy.role;
            stats.blocksByRole[role] = (stats.blocksByRole[role] || 0) + 1;
        }

        return stats;
    }
}

module.exports = new BlockManager();