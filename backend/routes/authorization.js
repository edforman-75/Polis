const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');
const {
    requirePermission,
    createPermissionCheckEndpoint,
    getUserPermissions,
    ROLES,
    PERMISSIONS
} = require('../middleware/authorization');

// Get current user's permissions and access info
router.get('/me', requireAuth, createPermissionCheckEndpoint());

// Get user permissions by user ID (admin only)
router.get('/user/:userId/permissions', requireAuth, requirePermission('users.read'), async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await db.get(
            'SELECT id, email, name, role, department, security_clearance, is_active FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const permissions = getUserPermissions(user);

        // Get user-specific permission overrides
        const userOverrides = await db.all(
            'SELECT permission, granted_at, expires_at, is_active FROM user_permissions WHERE user_id = ? AND is_active = TRUE',
            [userId]
        );

        // Get team memberships
        const teamMemberships = await db.all(
            'SELECT team_name, role_in_team FROM team_memberships WHERE user_id = ? AND is_active = TRUE',
            [userId]
        );

        res.json({
            user,
            permissions,
            userOverrides,
            teamMemberships
        });

    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({ error: 'Failed to fetch user permissions' });
    }
});

// Grant permission to user (admin only)
router.post('/user/:userId/grant', requireAuth, requirePermission('users.update'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { permission, expiresAt } = req.body;

        if (!permission) {
            return res.status(400).json({ error: 'Permission is required' });
        }

        // Verify the permission exists
        if (!Object.keys(PERMISSIONS).includes(permission)) {
            return res.status(400).json({ error: 'Invalid permission' });
        }

        // Check if user exists
        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.run(
            `INSERT OR REPLACE INTO user_permissions
             (user_id, permission, granted_by, expires_at)
             VALUES (?, ?, ?, ?)`,
            [userId, permission, req.user.id, expiresAt || null]
        );

        res.json({
            success: true,
            message: 'Permission granted successfully',
            permission,
            userId
        });

    } catch (error) {
        console.error('Error granting permission:', error);
        res.status(500).json({ error: 'Failed to grant permission' });
    }
});

// Revoke permission from user (admin only)
router.delete('/user/:userId/revoke/:permission', requireAuth, requirePermission('users.update'), async (req, res) => {
    try {
        const { userId, permission } = req.params;

        await db.run(
            'UPDATE user_permissions SET is_active = FALSE WHERE user_id = ? AND permission = ?',
            [userId, permission]
        );

        res.json({
            success: true,
            message: 'Permission revoked successfully',
            permission,
            userId
        });

    } catch (error) {
        console.error('Error revoking permission:', error);
        res.status(500).json({ error: 'Failed to revoke permission' });
    }
});

// Add user to team
router.post('/team/:teamName/add/:userId', requireAuth, requirePermission('assignments.assign'), async (req, res) => {
    try {
        const { teamName, userId } = req.params;
        const { roleInTeam = 'member' } = req.body;

        // Check if user exists
        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.run(
            `INSERT OR REPLACE INTO team_memberships
             (user_id, team_name, role_in_team, added_by)
             VALUES (?, ?, ?, ?)`,
            [userId, teamName, roleInTeam, req.user.id]
        );

        res.json({
            success: true,
            message: 'User added to team successfully',
            teamName,
            userId,
            roleInTeam
        });

    } catch (error) {
        console.error('Error adding user to team:', error);
        res.status(500).json({ error: 'Failed to add user to team' });
    }
});

// Remove user from team
router.delete('/team/:teamName/remove/:userId', requireAuth, requirePermission('assignments.assign'), async (req, res) => {
    try {
        const { teamName, userId } = req.params;

        await db.run(
            'UPDATE team_memberships SET is_active = FALSE WHERE user_id = ? AND team_name = ?',
            [userId, teamName]
        );

        res.json({
            success: true,
            message: 'User removed from team successfully',
            teamName,
            userId
        });

    } catch (error) {
        console.error('Error removing user from team:', error);
        res.status(500).json({ error: 'Failed to remove user from team' });
    }
});

// Get all teams
router.get('/teams', requireAuth, async (req, res) => {
    try {
        const teams = await db.all(`
            SELECT
                team_name,
                COUNT(*) as member_count,
                GROUP_CONCAT(u.name || ' (' || tm.role_in_team || ')') as members
            FROM team_memberships tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.is_active = TRUE
            GROUP BY team_name
            ORDER BY team_name
        `);

        res.json({ teams });

    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Get team members
router.get('/team/:teamName/members', requireAuth, async (req, res) => {
    try {
        const { teamName } = req.params;

        const members = await db.all(`
            SELECT
                u.id, u.name, u.email, u.role, u.department,
                tm.role_in_team, tm.added_at
            FROM team_memberships tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_name = ? AND tm.is_active = TRUE
            ORDER BY tm.role_in_team, u.name
        `, [teamName]);

        res.json({
            teamName,
            members
        });

    } catch (error) {
        console.error('Error fetching team members:', error);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// Grant resource access to user
router.post('/resource/:resourceType/:resourceId/grant/:userId', requireAuth, requirePermission('assignments.assign'), async (req, res) => {
    try {
        const { resourceType, resourceId, userId } = req.params;
        const { permissionType = 'read', expiresAt } = req.body;

        // Check if user exists
        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.run(
            `INSERT OR REPLACE INTO resource_access
             (user_id, resource_type, resource_id, permission_type, granted_by, expires_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, resourceType, resourceId, permissionType, req.user.id, expiresAt || null]
        );

        res.json({
            success: true,
            message: 'Resource access granted successfully',
            resourceType,
            resourceId,
            userId,
            permissionType
        });

    } catch (error) {
        console.error('Error granting resource access:', error);
        res.status(500).json({ error: 'Failed to grant resource access' });
    }
});

// Get available roles and their permissions
router.get('/roles', requireAuth, (req, res) => {
    try {
        const rolesInfo = Object.entries(ROLES).map(([roleName, roleData]) => {
            const rolePermissions = Object.entries(PERMISSIONS)
                .filter(([, allowedRoles]) => allowedRoles.includes(roleName))
                .map(([permission]) => permission);

            return {
                name: roleName,
                level: roleData.level,
                description: roleData.description,
                inherits: roleData.inherits,
                permissions: rolePermissions
            };
        });

        res.json({
            roles: rolesInfo,
            totalRoles: rolesInfo.length
        });

    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

// Get all available permissions
router.get('/permissions', requireAuth, (req, res) => {
    try {
        const permissionsInfo = Object.entries(PERMISSIONS).map(([permission, allowedRoles]) => ({
            permission,
            allowedRoles,
            category: permission.split('.')[0]
        }));

        // Group by category
        const categories = permissionsInfo.reduce((acc, perm) => {
            if (!acc[perm.category]) {
                acc[perm.category] = [];
            }
            acc[perm.category].push(perm);
            return acc;
        }, {});

        res.json({
            permissions: permissionsInfo,
            categories,
            totalPermissions: permissionsInfo.length
        });

    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
});

// Update user role (admin only)
router.put('/user/:userId/role', requireAuth, requirePermission('users.update'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        // Verify role exists
        if (!ROLES[role]) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if user exists
        const user = await db.get('SELECT id, name FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.run(
            'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [role, userId]
        );

        res.json({
            success: true,
            message: 'User role updated successfully',
            userId,
            userName: user.name,
            newRole: role
        });

    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Check if user has specific permission
router.get('/check/:permission', requireAuth, (req, res) => {
    try {
        const { permission } = req.params;
        const { resourceType, resourceId } = req.query;

        let hasAccess = getUserPermissions(req.user).includes(permission);

        // If checking resource-specific access, we'd need to implement
        // additional logic here based on the resourceType and resourceId

        res.json({
            permission,
            hasAccess,
            user: {
                id: req.user.id,
                role: req.user.role
            }
        });

    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ error: 'Failed to check permission' });
    }
});

module.exports = router;