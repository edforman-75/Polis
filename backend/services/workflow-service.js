/**
 * Workflow Service
 * Manages multi-user approval workflows with role-based permissions
 */

const Database = require('better-sqlite3');
const path = require('path');

class WorkflowService {
  constructor() {
    const dbPath = path.join(__dirname, '../data/workflow.db');
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  initializeDatabase() {
    const schemaPath = path.join(__dirname, '../data/workflow-collaboration-schema.sql');
    const fs = require('fs');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  // ========================================================================
  // WORKFLOW TEMPLATE MANAGEMENT
  // ========================================================================

  createWorkflowTemplate(templateData, createdBy) {
    const { name, description, content_type, stages } = templateData;

    const insert = this.db.prepare(`
      INSERT INTO workflow_templates (name, description, content_type, created_by)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(name, description, content_type, createdBy);
    const templateId = result.lastInsertRowid;

    // Insert stages
    if (stages && stages.length > 0) {
      const insertStage = this.db.prepare(`
        INSERT INTO workflow_stages
        (template_id, stage_order, stage_name, stage_type, required_role, auto_advance, parallel_review, min_approvals)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stages.forEach((stage, index) => {
        insertStage.run(
          templateId,
          stage.stage_order || index + 1,
          stage.stage_name,
          stage.stage_type,
          stage.required_role || null,
          stage.auto_advance || 0,
          stage.parallel_review || 0,
          stage.min_approvals || 1
        );
      });
    }

    return this.getWorkflowTemplate(templateId);
  }

  getWorkflowTemplate(templateId) {
    const template = this.db.prepare(`
      SELECT * FROM workflow_templates WHERE id = ?
    `).get(templateId);

    if (!template) return null;

    const stages = this.db.prepare(`
      SELECT * FROM workflow_stages
      WHERE template_id = ?
      ORDER BY stage_order
    `).all(templateId);

    return { ...template, stages };
  }

  getWorkflowTemplates(contentType = null) {
    const query = contentType
      ? 'SELECT * FROM workflow_templates WHERE content_type = ? ORDER BY name'
      : 'SELECT * FROM workflow_templates ORDER BY name';

    const templates = contentType
      ? this.db.prepare(query).all(contentType)
      : this.db.prepare(query).all();

    return templates;
  }

  // ========================================================================
  // WORKFLOW INSTANCE MANAGEMENT
  // ========================================================================

  startWorkflow(workflowData, initiatedBy) {
    const { template_id, content_id, content_type, priority, due_date, metadata } = workflowData;

    const template = this.getWorkflowTemplate(template_id);
    if (!template) {
      throw new Error('Workflow template not found');
    }

    // Create workflow instance
    const insert = this.db.prepare(`
      INSERT INTO workflow_instances
      (template_id, content_id, content_type, current_stage_id, priority, initiated_by, due_date, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const firstStage = template.stages[0];
    const result = insert.run(
      template_id,
      content_id,
      content_type,
      firstStage.id,
      priority || 'medium',
      initiatedBy,
      due_date || null,
      metadata ? JSON.stringify(metadata) : null
    );

    const instanceId = result.lastInsertRowid;

    // Auto-assign first stage if configured
    this.autoAssignStage(instanceId, firstStage.id);

    return this.getWorkflowInstance(instanceId);
  }

  getWorkflowInstance(instanceId) {
    const instance = this.db.prepare(`
      SELECT wi.*, wt.name as template_name, u.full_name as initiated_by_name
      FROM workflow_instances wi
      JOIN workflow_templates wt ON wi.template_id = wt.id
      JOIN users u ON wi.initiated_by = u.id
      WHERE wi.id = ?
    `).get(instanceId);

    if (!instance) return null;

    // Get current stage details
    if (instance.current_stage_id) {
      instance.current_stage = this.db.prepare(`
        SELECT * FROM workflow_stages WHERE id = ?
      `).get(instance.current_stage_id);
    }

    // Get all assignments
    instance.assignments = this.db.prepare(`
      SELECT wsa.*, u.full_name as assignee_name, ws.stage_name
      FROM workflow_stage_assignments wsa
      JOIN users u ON wsa.assigned_user_id = u.id
      JOIN workflow_stages ws ON wsa.stage_id = ws.id
      WHERE wsa.workflow_instance_id = ?
      ORDER BY ws.stage_order
    `).all(instanceId);

    // Parse metadata if exists
    if (instance.metadata) {
      try {
        instance.metadata = JSON.parse(instance.metadata);
      } catch (e) {
        instance.metadata = null;
      }
    }

    return instance;
  }

  autoAssignStage(instanceId, stageId) {
    const stage = this.db.prepare('SELECT * FROM workflow_stages WHERE id = ?').get(stageId);
    if (!stage || !stage.required_role) return;

    // Find users with required role
    const users = this.db.prepare(`
      SELECT id FROM users
      WHERE role = ? AND status = 'active'
      ORDER BY RANDOM()
      LIMIT 1
    `).all(stage.required_role);

    if (users.length === 0) return;

    // Assign to first available user
    const insertAssignment = this.db.prepare(`
      INSERT INTO workflow_stage_assignments
      (workflow_instance_id, stage_id, assigned_user_id, assigned_by)
      VALUES (?, ?, ?, ?)
    `);

    users.forEach(user => {
      insertAssignment.run(instanceId, stageId, user.id, 1); // System assigned
    });
  }

  assignStage(instanceId, stageId, userId, assignedBy) {
    const insert = this.db.prepare(`
      INSERT INTO workflow_stage_assignments
      (workflow_instance_id, stage_id, assigned_user_id, assigned_by, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);

    const result = insert.run(instanceId, stageId, userId, assignedBy);
    return result.lastInsertRowid;
  }

  completeStage(assignmentId, userId, action, notes = null) {
    const assignment = this.db.prepare(`
      SELECT * FROM workflow_stage_assignments WHERE id = ?
    `).get(assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.assigned_user_id !== userId) {
      throw new Error('User not authorized to complete this assignment');
    }

    // Update assignment
    const update = this.db.prepare(`
      UPDATE workflow_stage_assignments
      SET status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          action_taken = ?,
          notes = ?,
          started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
      WHERE id = ?
    `);

    update.run(action, notes, assignmentId);

    // Check if stage is fully completed
    const stage = this.db.prepare('SELECT * FROM workflow_stages WHERE id = ?').get(assignment.stage_id);

    const completedCount = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM workflow_stage_assignments
      WHERE workflow_instance_id = ?
        AND stage_id = ?
        AND status = 'completed'
        AND action_taken = 'approved'
    `).get(assignment.workflow_instance_id, assignment.stage_id).count;

    if (completedCount >= stage.min_approvals && action === 'approved') {
      this.advanceToNextStage(assignment.workflow_instance_id);
    } else if (action === 'rejected') {
      // Mark workflow as blocked
      this.db.prepare(`
        UPDATE workflow_instances
        SET status = 'blocked'
        WHERE id = ?
      `).run(assignment.workflow_instance_id);
    }

    return this.getWorkflowInstance(assignment.workflow_instance_id);
  }

  advanceToNextStage(instanceId) {
    const instance = this.getWorkflowInstance(instanceId);
    const template = this.getWorkflowTemplate(instance.template_id);

    const currentStageOrder = instance.current_stage.stage_order;
    const nextStage = template.stages.find(s => s.stage_order === currentStageOrder + 1);

    if (nextStage) {
      // Advance to next stage
      this.db.prepare(`
        UPDATE workflow_instances
        SET current_stage_id = ?
        WHERE id = ?
      `).run(nextStage.id, instanceId);

      // Auto-assign next stage
      this.autoAssignStage(instanceId, nextStage.id);
    } else {
      // Workflow complete
      this.db.prepare(`
        UPDATE workflow_instances
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(instanceId);
    }
  }

  getUserWorkflowTasks(userId, status = 'pending') {
    const query = `
      SELECT
        wsa.*,
        wi.content_id,
        wi.content_type,
        wi.priority,
        wi.due_date,
        ws.stage_name,
        ws.stage_type,
        wt.name as workflow_name
      FROM workflow_stage_assignments wsa
      JOIN workflow_instances wi ON wsa.workflow_instance_id = wi.id
      JOIN workflow_stages ws ON wsa.stage_id = ws.id
      JOIN workflow_templates wt ON wi.template_id = wt.id
      WHERE wsa.assigned_user_id = ? AND wsa.status = ?
      ORDER BY wi.priority DESC, wi.due_date ASC
    `;

    return this.db.prepare(query).all(userId, status);
  }

  // ========================================================================
  // USER MANAGEMENT
  // ========================================================================

  getUser(userId) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  getUserByUsername(username) {
    return this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  getUsers(role = null) {
    const query = role
      ? 'SELECT * FROM users WHERE role = ? AND status = "active" ORDER BY full_name'
      : 'SELECT * FROM users WHERE status = "active" ORDER BY full_name';

    return role
      ? this.db.prepare(query).all(role)
      : this.db.prepare(query).all();
  }

  createUser(userData) {
    const { username, email, full_name, role, department } = userData;

    const insert = this.db.prepare(`
      INSERT INTO users (username, email, full_name, role, department)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = insert.run(username, email, full_name, role, department || null);
    return this.getUser(result.lastInsertRowid);
  }

  // ========================================================================
  // PERMISSIONS
  // ========================================================================

  hasPermission(userId, permissionType, resourceType) {
    const permission = this.db.prepare(`
      SELECT * FROM user_permissions
      WHERE user_id = ? AND permission_type = ? AND resource_type = ?
    `).get(userId, permissionType, resourceType);

    return !!permission;
  }

  grantPermission(userId, permissionType, resourceType, grantedBy) {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO user_permissions (user_id, permission_type, resource_type, granted_by)
      VALUES (?, ?, ?, ?)
    `);

    return insert.run(userId, permissionType, resourceType, grantedBy);
  }
}

module.exports = WorkflowService;
