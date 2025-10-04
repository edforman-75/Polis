/**
 * Workflow API Routes
 * Handles approval workflows, user management, and permissions
 */

const express = require('express');
const router = express.Router();
const WorkflowService = require('../services/workflow-service');

const workflowService = new WorkflowService();

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

// Get all workflow templates
router.get('/templates', (req, res) => {
  try {
    const { content_type } = req.query;
    const templates = workflowService.getWorkflowTemplates(content_type);
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific workflow template
router.get('/templates/:id', (req, res) => {
  try {
    const template = workflowService.getWorkflowTemplate(parseInt(req.params.id));
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create workflow template
router.post('/templates', (req, res) => {
  try {
    const { created_by = 1 } = req.body; // TODO: Get from session
    const template = workflowService.createWorkflowTemplate(req.body, created_by);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// WORKFLOW INSTANCES
// ============================================================================

// Start new workflow
router.post('/instances', (req, res) => {
  try {
    const { initiated_by = 1 } = req.body; // TODO: Get from session
    const instance = workflowService.startWorkflow(req.body, initiated_by);
    res.json({ success: true, instance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get workflow instance
router.get('/instances/:id', (req, res) => {
  try {
    const instance = workflowService.getWorkflowInstance(parseInt(req.params.id));
    if (!instance) {
      return res.status(404).json({ success: false, error: 'Workflow instance not found' });
    }
    res.json({ success: true, instance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign stage to user
router.post('/instances/:id/assign', (req, res) => {
  try {
    const { stage_id, user_id, assigned_by = 1 } = req.body;
    const assignmentId = workflowService.assignStage(
      parseInt(req.params.id),
      stage_id,
      user_id,
      assigned_by
    );
    res.json({ success: true, assignment_id: assignmentId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete stage
router.post('/assignments/:id/complete', (req, res) => {
  try {
    const { user_id = 1, action, notes } = req.body; // TODO: Get from session
    const instance = workflowService.completeStage(
      parseInt(req.params.id),
      user_id,
      action,
      notes
    );
    res.json({ success: true, instance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's workflow tasks
router.get('/users/:userId/tasks', (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const tasks = workflowService.getUserWorkflowTasks(parseInt(req.params.userId), status);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

// Get all users
router.get('/users', (req, res) => {
  try {
    const { role } = req.query;
    const users = workflowService.getUsers(role);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific user
router.get('/users/:id', (req, res) => {
  try {
    const user = workflowService.getUser(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user
router.post('/users', (req, res) => {
  try {
    const user = workflowService.createUser(req.body);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PERMISSIONS
// ============================================================================

// Check permission
router.get('/users/:userId/permissions/:permissionType/:resourceType', (req, res) => {
  try {
    const hasPermission = workflowService.hasPermission(
      parseInt(req.params.userId),
      req.params.permissionType,
      req.params.resourceType
    );
    res.json({ success: true, has_permission: hasPermission });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Grant permission
router.post('/users/:userId/permissions', (req, res) => {
  try {
    const { permission_type, resource_type, granted_by = 1 } = req.body;
    workflowService.grantPermission(
      parseInt(req.params.userId),
      permission_type,
      resource_type,
      granted_by
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
