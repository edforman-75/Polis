/**
 * Undo/Redo Manager
 * Handles operational transforms for granular undo/redo functionality
 */

const db = require('../database/init');

class UndoRedoManager {
    constructor() {
        this.MAX_OPERATIONS_PER_SESSION = 1000;
        this.CHECKPOINT_INTERVAL = 50; // Create checkpoint every 50 operations
    }

    // Record an operation for undo/redo
    async recordOperation(sessionId, operationData) {
        const {
            assignmentId,
            contentType,
            contentId,
            operationType,
            positionStart,
            positionEnd,
            contentBefore,
            contentAfter,
            userId,
            isCheckpoint = false
        } = operationData;

        // Get current sequence number for this session
        const lastOp = await db.get(
            'SELECT sequence_number FROM editor_operations WHERE session_id = ? ORDER BY sequence_number DESC LIMIT 1',
            [sessionId]
        );

        const sequenceNumber = (lastOp?.sequence_number || 0) + 1;

        // Prepare operation data JSON
        const opData = {
            type: operationType,
            position: { start: positionStart, end: positionEnd },
            content: { before: contentBefore, after: contentAfter },
            timestamp: new Date().toISOString(),
            sequenceNumber
        };

        // Insert operation record
        const result = await db.run(
            `INSERT INTO editor_operations (
                session_id, assignment_id, content_type, content_id,
                operation_type, operation_data, position_start, position_end,
                content_before, content_after, user_id, is_checkpoint, sequence_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sessionId, assignmentId, contentType, contentId,
                operationType, JSON.stringify(opData), positionStart, positionEnd,
                contentBefore, contentAfter, userId, isCheckpoint, sequenceNumber
            ]
        );

        // Create checkpoint periodically
        if (sequenceNumber % this.CHECKPOINT_INTERVAL === 0) {
            await this.createCheckpoint(sessionId, assignmentId, contentType, contentId, userId);
        }

        // Clean old operations to prevent infinite growth
        await this.cleanOldOperations(sessionId);

        return {
            operationId: result.id,
            sequenceNumber,
            canUndo: true,
            canRedo: false
        };
    }

    // Get operations that can be undone
    async getUndoOperations(sessionId, limit = 1) {
        return await db.all(
            `SELECT * FROM editor_operations
             WHERE session_id = ? AND is_undone = FALSE
             ORDER BY sequence_number DESC
             LIMIT ?`,
            [sessionId, limit]
        );
    }

    // Get operations that can be redone
    async getRedoOperations(sessionId, limit = 1) {
        return await db.all(
            `SELECT * FROM editor_operations
             WHERE session_id = ? AND is_undone = TRUE
             ORDER BY sequence_number ASC
             LIMIT ?`,
            [sessionId, limit]
        );
    }

    // Perform undo operation
    async undo(sessionId, operationCount = 1) {
        const operations = await this.getUndoOperations(sessionId, operationCount);

        if (operations.length === 0) {
            return { success: false, message: 'Nothing to undo' };
        }

        const undoSteps = [];

        for (const operation of operations) {
            // Mark operation as undone
            await db.run(
                'UPDATE editor_operations SET is_undone = TRUE WHERE id = ?',
                [operation.id]
            );

            // Create inverse operation for applying the undo
            const inverseOp = this.createInverseOperation(operation);
            undoSteps.push(inverseOp);
        }

        return {
            success: true,
            undoSteps,
            canUndo: await this.hasUndoOperations(sessionId),
            canRedo: true
        };
    }

    // Perform redo operation
    async redo(sessionId, operationCount = 1) {
        const operations = await this.getRedoOperations(sessionId, operationCount);

        if (operations.length === 0) {
            return { success: false, message: 'Nothing to redo' };
        }

        const redoSteps = [];

        for (const operation of operations) {
            // Mark operation as not undone
            await db.run(
                'UPDATE editor_operations SET is_undone = FALSE WHERE id = ?',
                [operation.id]
            );

            // Create the original operation for applying the redo
            const originalOp = this.createOriginalOperation(operation);
            redoSteps.push(originalOp);
        }

        return {
            success: true,
            redoSteps,
            canUndo: true,
            canRedo: await this.hasRedoOperations(sessionId)
        };
    }

    // Check if session has operations that can be undone
    async hasUndoOperations(sessionId) {
        const result = await db.get(
            'SELECT COUNT(*) as count FROM editor_operations WHERE session_id = ? AND is_undone = FALSE',
            [sessionId]
        );
        return result.count > 0;
    }

    // Check if session has operations that can be redone
    async hasRedoOperations(sessionId) {
        const result = await db.get(
            'SELECT COUNT(*) as count FROM editor_operations WHERE session_id = ? AND is_undone = TRUE',
            [sessionId]
        );
        return result.count > 0;
    }

    // Create inverse operation for undo
    createInverseOperation(operation) {
        const opData = JSON.parse(operation.operation_data);

        switch (operation.operation_type) {
            case 'insert':
                return {
                    type: 'delete',
                    position: opData.position.start,
                    length: operation.content_after.length,
                    content: operation.content_after
                };

            case 'delete':
                return {
                    type: 'insert',
                    position: opData.position.start,
                    content: operation.content_before
                };

            case 'replace':
                return {
                    type: 'replace',
                    position: opData.position,
                    content: operation.content_before
                };

            case 'format':
                return {
                    type: 'format',
                    position: opData.position,
                    formatType: opData.formatType,
                    remove: !opData.remove
                };

            default:
                return {
                    type: 'restore',
                    position: opData.position,
                    content: operation.content_before
                };
        }
    }

    // Create original operation for redo
    createOriginalOperation(operation) {
        const opData = JSON.parse(operation.operation_data);

        switch (operation.operation_type) {
            case 'insert':
                return {
                    type: 'insert',
                    position: opData.position.start,
                    content: operation.content_after
                };

            case 'delete':
                return {
                    type: 'delete',
                    position: opData.position.start,
                    length: operation.content_before.length
                };

            case 'replace':
                return {
                    type: 'replace',
                    position: opData.position,
                    content: operation.content_after
                };

            case 'format':
                return {
                    type: 'format',
                    position: opData.position,
                    formatType: opData.formatType,
                    add: opData.add
                };

            default:
                return opData;
        }
    }

    // Create checkpoint (full content snapshot)
    async createCheckpoint(sessionId, assignmentId, contentType, contentId, userId) {
        // Get current content based on type
        let currentContent = '';
        let table = '';

        switch (contentType) {
            case 'speech':
                table = 'speeches';
                break;
            case 'social-media':
                table = 'social_posts';
                break;
            case 'press-release':
                table = 'press_releases';
                break;
            default:
                table = 'content_blocks';
        }

        if (table && contentId) {
            const content = await db.get(`SELECT content FROM ${table} WHERE id = ?`, [contentId]);
            currentContent = content?.content || '';
        }

        // Record checkpoint operation
        await this.recordOperation(sessionId, {
            assignmentId,
            contentType,
            contentId,
            operationType: 'checkpoint',
            positionStart: 0,
            positionEnd: currentContent.length,
            contentBefore: '',
            contentAfter: currentContent,
            userId,
            isCheckpoint: true
        });

        console.log(`📍 Created checkpoint for session ${sessionId}`);
    }

    // Clean old operations to prevent database bloat
    async cleanOldOperations(sessionId) {
        const totalOps = await db.get(
            'SELECT COUNT(*) as count FROM editor_operations WHERE session_id = ?',
            [sessionId]
        );

        if (totalOps.count > this.MAX_OPERATIONS_PER_SESSION) {
            // Keep only the most recent operations and all checkpoints
            await db.run(
                `DELETE FROM editor_operations
                 WHERE session_id = ?
                 AND is_checkpoint = FALSE
                 AND sequence_number < (
                     SELECT sequence_number
                     FROM editor_operations
                     WHERE session_id = ?
                     ORDER BY sequence_number DESC
                     LIMIT 1 OFFSET ?
                 )`,
                [sessionId, sessionId, this.MAX_OPERATIONS_PER_SESSION * 0.8]
            );

            console.log(`🧹 Cleaned old operations for session ${sessionId}`);
        }
    }

    // Get session status
    async getSessionStatus(sessionId) {
        const canUndo = await this.hasUndoOperations(sessionId);
        const canRedo = await this.hasRedoOperations(sessionId);

        const lastOp = await db.get(
            'SELECT * FROM editor_operations WHERE session_id = ? ORDER BY sequence_number DESC LIMIT 1',
            [sessionId]
        );

        return {
            sessionId,
            canUndo,
            canRedo,
            lastOperation: lastOp?.operation_type || null,
            lastSequence: lastOp?.sequence_number || 0,
            timestamp: new Date().toISOString()
        };
    }

    // Handle collaborative editing conflicts
    async resolveConflict(sessionId, conflictingOps) {
        // Implement operational transform conflict resolution
        // This is a simplified version - real implementation would be more complex

        const resolvedOps = [];

        for (const op of conflictingOps) {
            // Transform operation based on previous operations
            const transformedOp = await this.transformOperation(sessionId, op);
            resolvedOps.push(transformedOp);
        }

        return resolvedOps;
    }

    // Transform operation for collaborative editing
    async transformOperation(sessionId, operation) {
        // Get concurrent operations
        const concurrentOps = await db.all(
            `SELECT * FROM editor_operations
             WHERE session_id != ?
             AND assignment_id = ?
             AND timestamp >= ?
             ORDER BY sequence_number ASC`,
            [sessionId, operation.assignmentId, operation.timestamp]
        );

        // Apply operational transform rules
        let transformedOp = { ...operation };

        for (const concurrentOp of concurrentOps) {
            transformedOp = this.applyTransform(transformedOp, concurrentOp);
        }

        return transformedOp;
    }

    // Apply operational transform between two operations
    applyTransform(op1, op2) {
        // Simplified operational transform - real implementation would handle all cases
        if (op1.positionStart >= op2.positionEnd) {
            // op1 comes after op2, adjust position
            const lengthDelta = op2.contentAfter.length - op2.contentBefore.length;
            op1.positionStart += lengthDelta;
            op1.positionEnd += lengthDelta;
        }

        return op1;
    }
}

module.exports = new UndoRedoManager();