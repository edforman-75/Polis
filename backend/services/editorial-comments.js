/**
 * Editorial Comment System for Campaign Communications
 * Supports collaborative editing with structured feedback and review workflows
 */

const db = require('../database/init');
const { APStyleChecker } = require('./ap-style-checker');

// Comment types for different editorial purposes
const COMMENT_TYPES = {
    'general': 'General feedback or discussion',
    'style': 'AP style, grammar, or formatting issue',
    'fact_check': 'Factual accuracy or source verification needed',
    'legal': 'Legal review or compliance concern',
    'strategy': 'Strategic messaging or positioning feedback',
    'approval': 'Approval workflow decision or request',
    'revision': 'Revision needed with specific guidance',
    'question': 'Question requiring clarification',
    'praise': 'Positive feedback or approval',
    'urgent': 'Urgent issue requiring immediate attention'
};

// Review stages for editorial workflow
const REVIEW_STAGES = {
    'draft': 'Initial draft review',
    'self_edit': 'Writer self-editing phase',
    'peer_review': 'Peer writer review',
    'line_edit': 'Copy editing for style and grammar',
    'fact_check': 'Research verification',
    'strategic_edit': 'Strategic messaging review',
    'legal_review': 'Legal and compliance review',
    'final_approval': 'Final approval for publication',
    'post_publication': 'Post-publication feedback'
};

// Priority levels for comments
const PRIORITY_LEVELS = {
    'low': 'Nice to have, non-blocking',
    'normal': 'Standard feedback',
    'high': 'Important issue that should be addressed',
    'critical': 'Blocking issue that must be resolved',
    'urgent': 'Time-sensitive issue requiring immediate attention'
};

class EditorialCommentService {
    constructor() {
        this.apStyleChecker = new APStyleChecker();
    }

    /**
     * Add a comment to a piece of content
     * @param {Object} commentData - Comment information
     * @returns {Object} Created comment with metadata
     */
    async addComment(commentData) {
        const {
            resourceType,
            resourceId,
            userId,
            commentText,
            commentType = 'general',
            selectionStart = null,
            selectionEnd = null,
            selectedText = null,
            priority = 'normal',
            parentCommentId = null
        } = commentData;

        // Validate comment type
        if (!Object.keys(COMMENT_TYPES).includes(commentType)) {
            throw new Error(`Invalid comment type: ${commentType}`);
        }

        // Validate priority
        if (!Object.keys(PRIORITY_LEVELS).includes(priority)) {
            throw new Error(`Invalid priority level: ${priority}`);
        }

        // Insert comment
        const result = await db.run(`
            INSERT INTO editorial_comments (
                resource_type, resource_id, parent_comment_id, user_id,
                comment_text, comment_type, selection_start, selection_end,
                selected_text, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            resourceType, resourceId, parentCommentId, userId,
            commentText, commentType, selectionStart, selectionEnd,
            selectedText, priority
        ]);

        // Get the complete comment with user information
        const comment = await this.getCommentById(result.id);

        // If this is a style comment, automatically run style checks
        if (commentType === 'style' && selectedText) {
            await this.runStyleCheckOnSelection(resourceType, resourceId, selectedText, userId);
        }

        // Trigger notifications for relevant users
        await this.notifyRelevantUsers(comment);

        return comment;
    }

    /**
     * Get a comment by ID with user information
     */
    async getCommentById(commentId) {
        const comment = await db.get(`
            SELECT
                c.*,
                u.name as user_name,
                u.role as user_role,
                r.name as resolver_name
            FROM editorial_comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN users r ON c.resolved_by = r.id
            WHERE c.id = ?
        `, [commentId]);

        if (comment) {
            // Get replies if this is a parent comment
            comment.replies = await this.getCommentReplies(commentId);

            // Get reactions
            comment.reactions = await this.getCommentReactions(commentId);
        }

        return comment;
    }

    /**
     * Get all comments for a resource
     * @param {string} resourceType - Type of resource
     * @param {string} resourceId - ID of resource
     * @param {Object} options - Filtering options
     */
    async getCommentsForResource(resourceType, resourceId, options = {}) {
        const {
            status = 'active',
            commentType = null,
            resolved = null,
            userId = null,
            includeReplies = true
        } = options;

        let query = `
            SELECT
                c.*,
                u.name as user_name,
                u.role as user_role,
                r.name as resolver_name
            FROM editorial_comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN users r ON c.resolved_by = r.id
            WHERE c.resource_type = ? AND c.resource_id = ?
              AND c.parent_comment_id IS NULL
        `;

        const params = [resourceType, resourceId];

        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }

        if (commentType) {
            query += ' AND c.comment_type = ?';
            params.push(commentType);
        }

        if (resolved !== null) {
            if (resolved) {
                query += ' AND c.resolved_at IS NOT NULL';
            } else {
                query += ' AND c.resolved_at IS NULL';
            }
        }

        if (userId) {
            query += ' AND c.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY c.priority DESC, c.created_at ASC';

        const comments = await db.all(query, params);

        // Get replies and reactions for each comment
        if (includeReplies) {
            for (let comment of comments) {
                comment.replies = await this.getCommentReplies(comment.id);
                comment.reactions = await this.getCommentReactions(comment.id);
            }
        }

        return comments;
    }

    /**
     * Get replies to a comment
     */
    async getCommentReplies(parentCommentId) {
        const replies = await db.all(`
            SELECT
                c.*,
                u.name as user_name,
                u.role as user_role
            FROM editorial_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.parent_comment_id = ?
            ORDER BY c.created_at ASC
        `, [parentCommentId]);

        // Get reactions for each reply
        for (let reply of replies) {
            reply.reactions = await this.getCommentReactions(reply.id);
        }

        return replies;
    }

    /**
     * Get reactions for a comment
     */
    async getCommentReactions(commentId) {
        const reactions = await db.all(`
            SELECT
                r.reaction_type,
                COUNT(*) as count,
                GROUP_CONCAT(u.name) as user_names
            FROM comment_reactions r
            JOIN users u ON r.user_id = u.id
            WHERE r.comment_id = ?
            GROUP BY r.reaction_type
        `, [commentId]);

        return reactions.reduce((acc, reaction) => {
            acc[reaction.reaction_type] = {
                count: reaction.count,
                users: reaction.user_names ? reaction.user_names.split(',') : []
            };
            return acc;
        }, {});
    }

    /**
     * Add reaction to a comment
     */
    async addReaction(commentId, userId, reactionType) {
        const validReactions = ['like', 'agree', 'disagree', 'important', 'resolved', 'question'];
        if (!validReactions.includes(reactionType)) {
            throw new Error(`Invalid reaction type: ${reactionType}`);
        }

        try {
            await db.run(`
                INSERT INTO comment_reactions (comment_id, user_id, reaction_type)
                VALUES (?, ?, ?)
            `, [commentId, userId, reactionType]);

            return { success: true };
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                // User already reacted with this type, remove it instead
                await db.run(`
                    DELETE FROM comment_reactions
                    WHERE comment_id = ? AND user_id = ? AND reaction_type = ?
                `, [commentId, userId, reactionType]);

                return { success: true, action: 'removed' };
            }
            throw error;
        }
    }

    /**
     * Resolve a comment
     */
    async resolveComment(commentId, userId, resolutionNote = null) {
        await db.run(`
            UPDATE editorial_comments
            SET resolved_at = CURRENT_TIMESTAMP,
                resolved_by = ?,
                status = 'resolved'
            WHERE id = ?
        `, [userId, commentId]);

        // Add resolution note as a reply if provided
        if (resolutionNote) {
            await this.addComment({
                resourceType: 'comment',
                resourceId: commentId.toString(),
                userId: userId,
                commentText: resolutionNote,
                commentType: 'general',
                parentCommentId: commentId
            });
        }

        return await this.getCommentById(commentId);
    }

    /**
     * Update a comment
     */
    async updateComment(commentId, userId, updateData) {
        const { commentText, priority, commentType } = updateData;

        // Verify user owns the comment or has permission to edit
        const comment = await db.get(
            'SELECT user_id FROM editorial_comments WHERE id = ?',
            [commentId]
        );

        if (!comment) {
            throw new Error('Comment not found');
        }

        // For now, only allow user to edit their own comments
        // TODO: Add permission checking for editors/admins
        if (comment.user_id !== userId) {
            throw new Error('Permission denied');
        }

        await db.run(`
            UPDATE editorial_comments
            SET comment_text = COALESCE(?, comment_text),
                priority = COALESCE(?, priority),
                comment_type = COALESCE(?, comment_type),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [commentText, priority, commentType, commentId]);

        return await this.getCommentById(commentId);
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId, userId) {
        // Check permissions (admin, campaign manager, or comment owner)
        const comment = await db.get(
            'SELECT c.user_id, u.role FROM editorial_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?',
            [commentId]
        );

        if (!comment) {
            throw new Error('Comment not found');
        }

        const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
        const canDelete = comment.user_id === userId ||
                         ['admin', 'campaign_manager', 'communications_director'].includes(user.role);

        if (!canDelete) {
            throw new Error('Permission denied');
        }

        // Soft delete - mark as inactive rather than actually deleting
        await db.run(`
            UPDATE editorial_comments
            SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? OR parent_comment_id = ?
        `, [commentId, commentId]);

        return { success: true, message: 'Comment deleted successfully' };
    }

    /**
     * Record an editorial review
     */
    async recordEditorialReview(reviewData) {
        const {
            resourceType,
            resourceId,
            reviewerId,
            reviewStage,
            reviewStatus,
            reviewNotes = null,
            issuesFound = 0,
            timeSpentMinutes = null,
            nextReviewerId = null
        } = reviewData;

        const result = await db.run(`
            INSERT INTO editorial_reviews (
                resource_type, resource_id, reviewer_id, review_stage,
                review_status, review_notes, issues_found, time_spent_minutes,
                next_reviewer_id, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            resourceType, resourceId, reviewerId, reviewStage,
            reviewStatus, reviewNotes, issuesFound, timeSpentMinutes,
            nextReviewerId
        ]);

        return result;
    }

    /**
     * Get editorial review history for a resource
     */
    async getEditorialHistory(resourceType, resourceId) {
        const reviews = await db.all(`
            SELECT
                r.*,
                u.name as reviewer_name,
                u.role as reviewer_role,
                n.name as next_reviewer_name
            FROM editorial_reviews r
            JOIN users u ON r.reviewer_id = u.id
            LEFT JOIN users n ON r.next_reviewer_id = n.id
            WHERE r.resource_type = ? AND r.resource_id = ?
            ORDER BY r.created_at DESC
        `, [resourceType, resourceId]);

        return reviews;
    }

    /**
     * Run style check and save results
     */
    async runStyleCheckOnSelection(resourceType, resourceId, text, userId) {
        try {
            const styleResults = this.apStyleChecker.comprehensiveCheck(text, resourceType);

            await db.run(`
                INSERT INTO style_check_results (
                    resource_type, resource_id, check_type, overall_score,
                    violations_count, suggestions_count, detailed_results, checked_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                resourceType, resourceId, 'ap_style_grammar',
                styleResults.overallAssessment.combinedScore,
                styleResults.apStyle.summary.totalViolations + styleResults.grammar.summary.totalIssues,
                styleResults.apStyle.summary.totalSuggestions + styleResults.grammar.suggestions?.length || 0,
                JSON.stringify(styleResults),
                userId
            ]);

            return styleResults;
        } catch (error) {
            console.error('Error running style check:', error);
            return null;
        }
    }

    /**
     * Get style check results for a resource
     */
    async getStyleCheckResults(resourceType, resourceId) {
        const results = await db.all(`
            SELECT
                s.*,
                u.name as checked_by_name
            FROM style_check_results s
            JOIN users u ON s.checked_by = u.id
            WHERE s.resource_type = ? AND s.resource_id = ?
            ORDER BY s.created_at DESC
        `, [resourceType, resourceId]);

        return results.map(result => ({
            ...result,
            detailed_results: JSON.parse(result.detailed_results)
        }));
    }

    /**
     * Get comment statistics for a resource
     */
    async getCommentStatistics(resourceType, resourceId) {
        const stats = await db.get(`
            SELECT
                COUNT(*) as total_comments,
                COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as unresolved_comments,
                COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_comments,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_comments,
                COUNT(CASE WHEN comment_type = 'style' THEN 1 END) as style_comments,
                COUNT(CASE WHEN comment_type = 'fact_check' THEN 1 END) as fact_check_comments,
                COUNT(CASE WHEN comment_type = 'legal' THEN 1 END) as legal_comments
            FROM editorial_comments
            WHERE resource_type = ? AND resource_id = ? AND status = 'active'
        `, [resourceType, resourceId]);

        return stats;
    }

    /**
     * Notify relevant users about new comments
     */
    async notifyRelevantUsers(comment) {
        // TODO: Implement notification system
        // This would typically integrate with email, Slack, or in-app notifications
        console.log(`New comment notification: ${comment.comment_type} comment by ${comment.user_name}`);
    }

    /**
     * Get available comment types
     */
    getCommentTypes() {
        return COMMENT_TYPES;
    }

    /**
     * Get available review stages
     */
    getReviewStages() {
        return REVIEW_STAGES;
    }

    /**
     * Get available priority levels
     */
    getPriorityLevels() {
        return PRIORITY_LEVELS;
    }
}

module.exports = {
    EditorialCommentService,
    COMMENT_TYPES,
    REVIEW_STAGES,
    PRIORITY_LEVELS
};