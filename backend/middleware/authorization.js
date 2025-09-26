const db = require('../database/init');

// Medium Campaign role hierarchy and permissions (15-50 staff)
const ROLES = {
    // Senior Leadership
    'campaign_manager': {
        level: 100,
        description: 'Campaign Manager - Overall strategic and operational leadership',
        inherits: ['communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'research_director', 'field_organizer', 'volunteer']
    },
    'deputy_campaign_manager': {
        level: 95,
        description: 'Deputy Campaign Manager - Operations and staff management',
        inherits: ['communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'research_director', 'field_organizer']
    },

    // Communications Leadership
    'communications_director': {
        level: 90,
        description: 'Communications Director - Final editorial authority and strategic messaging',
        inherits: ['deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'research_director']
    },
    'deputy_communications_director': {
        level: 85,
        description: 'Deputy Communications Director - Day-to-day editorial lead and content management',
        inherits: ['press_secretary', 'senior_writer', 'writer', 'research_director']
    },
    'press_secretary': {
        level: 80,
        description: 'Press Secretary - Media relations and daily content editing',
        inherits: ['senior_writer', 'writer', 'research_director']
    },

    // Content Creation
    'senior_writer': {
        level: 75,
        description: 'Senior Writer/Speechwriter - Specialized editorial role and peer review',
        inherits: ['writer', 'research_director']
    },
    'writer': {
        level: 70,
        description: 'Communications Writer - Content creation and self-editing',
        inherits: ['research_director']
    },

    // Research and Fact-Checking
    'research_director': {
        level: 78,
        description: 'Research Director - Fact-checking editor and opposition research',
        inherits: ['researcher']
    },
    'researcher': {
        level: 65,
        description: 'Researcher - Data collection and basic fact verification',
        inherits: []
    },

    // Field and Operations
    'field_director': {
        level: 82,
        description: 'Field Director - Organizing and outreach operations',
        inherits: ['field_organizer', 'volunteer_coordinator']
    },
    'field_organizer': {
        level: 60,
        description: 'Field Organizer - Direct voter contact and event coordination',
        inherits: ['volunteer_coordinator']
    },
    'volunteer_coordinator': {
        level: 55,
        description: 'Volunteer Coordinator - Volunteer management and basic outreach',
        inherits: ['volunteer']
    },

    // Support Staff
    'digital_director': {
        level: 77,
        description: 'Digital Director - Online strategy and social media oversight',
        inherits: ['digital_coordinator', 'writer']
    },
    'digital_coordinator': {
        level: 67,
        description: 'Digital Coordinator - Social media and online content management',
        inherits: ['writer']
    },
    'finance_director': {
        level: 83,
        description: 'Finance Director - Fundraising and compliance oversight',
        inherits: ['finance_coordinator']
    },
    'finance_coordinator': {
        level: 62,
        description: 'Finance Coordinator - Daily fundraising and donor management',
        inherits: []
    },

    // Entry Level
    'staff_assistant': {
        level: 45,
        description: 'Staff Assistant - General administrative and support tasks',
        inherits: ['volunteer']
    },
    'volunteer': {
        level: 25,
        description: 'Volunteer - Limited access for volunteer activities',
        inherits: []
    },
    'intern': {
        level: 15,
        description: 'Intern - Supervised learning role with limited access',
        inherits: []
    },

    // System Administration
    'admin': {
        level: 110,
        description: 'System Administrator - Full technical and user management access',
        inherits: ['campaign_manager']
    }
};

// Medium Campaign Editorial Workflow Permissions
const PERMISSIONS = {
    // Assignment operations - Medium Campaign Structure
    'assignments.create': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director'],
    'assignments.read.all': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director'],
    'assignments.read.assigned': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'research_director'],
    'assignments.read.own': ['researcher', 'field_organizer', 'volunteer_coordinator', 'staff_assistant', 'volunteer', 'intern'],
    'assignments.update.all': ['admin', 'campaign_manager', 'deputy_campaign_manager'],
    'assignments.update.assigned': ['communications_director', 'deputy_communications_director', 'press_secretary'],
    'assignments.update.own': ['senior_writer', 'writer'],
    'assignments.delete': ['admin', 'campaign_manager'],
    'assignments.approve': ['communications_director', 'campaign_manager', 'admin'],
    'assignments.assign': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director'],

    // Editorial Content Operations - Medium Campaign Workflow
    'content.create': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'digital_coordinator'],
    'content.read.all': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director'],
    'content.read.assigned': ['press_secretary', 'senior_writer', 'writer', 'research_director', 'digital_coordinator'],
    'content.read.own': ['researcher', 'field_organizer', 'staff_assistant', 'volunteer', 'intern'],
    'content.update.all': ['admin', 'campaign_manager', 'deputy_campaign_manager'],
    'content.update.assigned': ['communications_director', 'deputy_communications_director', 'press_secretary'],
    'content.update.own': ['senior_writer', 'writer', 'digital_coordinator'],
    'content.delete': ['admin', 'campaign_manager', 'communications_director'],
    'content.publish': ['communications_director', 'deputy_communications_director', 'campaign_manager', 'admin'],

    // Major Speech Operations - Requires Senior Editorial Review
    'speeches.create': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'senior_writer'],
    'speeches.read.all': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director'],
    'speeches.read.assigned': ['press_secretary', 'senior_writer', 'writer', 'research_director'],
    'speeches.update.all': ['admin', 'campaign_manager'],
    'speeches.update.assigned': ['communications_director', 'deputy_communications_director', 'senior_writer'],
    'speeches.approve': ['communications_director', 'campaign_manager', 'admin'],
    'speeches.candidate_review': ['admin', 'campaign_manager', 'communications_director'],

    // Social Media and Digital Operations
    'social.create': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'digital_director', 'digital_coordinator', 'press_secretary', 'writer'],
    'social.read.all': ['admin', 'campaign_manager', 'communications_director', 'digital_director'],
    'social.read.assigned': ['deputy_communications_director', 'press_secretary', 'digital_coordinator', 'senior_writer', 'writer'],
    'social.schedule': ['communications_director', 'digital_director', 'deputy_communications_director', 'campaign_manager', 'admin'],
    'social.publish': ['communications_director', 'digital_director', 'campaign_manager', 'admin'],

    // Press Release Operations - AP Style Editorial Workflow
    'press.create': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer'],
    'press.read.all': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director'],
    'press.read.assigned': ['press_secretary', 'senior_writer', 'writer', 'research_director'],
    'press.line_edit': ['deputy_communications_director', 'press_secretary', 'senior_writer'],
    'press.strategic_edit': ['communications_director', 'deputy_communications_director'],
    'press.approve': ['communications_director', 'campaign_manager', 'admin'],
    'press.distribute': ['communications_director', 'press_secretary', 'campaign_manager', 'admin'],

    // Research and Fact-Checking Operations
    'research.access': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director', 'research_director', 'senior_writer', 'press_secretary', 'writer'],
    'research.sensitive': ['admin', 'campaign_manager', 'communications_director', 'research_director'],
    'research.fact_check': ['research_director', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer'],
    'opposition_research.read': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'research_director', 'senior_writer'],
    'opposition_research.create': ['research_director', 'researcher', 'communications_director'],
    'voter_data.access': ['admin', 'campaign_manager', 'field_director', 'communications_director'],

    // AI and Editorial Tools
    'ai.use_basic': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'digital_coordinator'],
    'ai.use_advanced': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'senior_writer', 'research_director'],
    'ai.use_unlimited': ['admin', 'campaign_manager', 'communications_director'],
    'grammar_check.use': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer'],
    'ap_style.enforce': ['communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer'],

    // Quality Control and Editorial Standards
    'quality.run_checks': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer'],
    'quality.editorial_review': ['communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer'],
    'compliance.view_reports': ['admin', 'campaign_manager', 'communications_director', 'finance_director'],
    'fec.access_compliance': ['admin', 'campaign_manager', 'communications_director', 'finance_director'],
    'legal.review_required': ['admin', 'campaign_manager', 'communications_director'],

    // Templates and Editorial Workflows
    'templates.create': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director'],
    'templates.edit': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'senior_writer'],
    'templates.use': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'digital_coordinator'],
    'workflow.manage': ['admin', 'campaign_manager', 'communications_director', 'deputy_communications_director'],
    'editorial.peer_review': ['senior_writer', 'deputy_communications_director', 'press_secretary'],

    // User Management and Administration
    'users.create': ['admin', 'campaign_manager'],
    'users.read': ['admin', 'campaign_manager', 'deputy_campaign_manager'],
    'users.update': ['admin', 'campaign_manager'],
    'users.delete': ['admin'],
    'users.assign_roles': ['admin', 'campaign_manager'],
    'staff.manage': ['admin', 'campaign_manager', 'deputy_campaign_manager'],

    // System Administration
    'system.admin': ['admin'],
    'system.backup': ['admin'],
    'system.logs': ['admin', 'campaign_manager'],
    'system.analytics': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director'],

    // Comment and Collaboration System
    'comments.create': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'research_director', 'digital_coordinator'],
    'comments.read': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'research_director', 'digital_coordinator', 'staff_assistant'],
    'comments.edit_own': ['admin', 'campaign_manager', 'deputy_campaign_manager', 'communications_director', 'deputy_communications_director', 'press_secretary', 'senior_writer', 'writer', 'research_director'],
    'comments.delete_any': ['admin', 'campaign_manager', 'communications_director'],
    'comments.moderate': ['communications_director', 'deputy_communications_director', 'campaign_manager', 'admin']
};

// Time-based access restrictions
const ACCESS_RESTRICTIONS = {
    'volunteer': {
        hours: '9-17', // 9 AM to 5 PM
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    'intern': {
        hours: '9-17',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        supervision_required: true
    }
};

// Content sensitivity levels
const SENSITIVITY_LEVELS = {
    'public': 0,
    'internal': 10,
    'confidential': 20,
    'restricted': 30,
    'top_secret': 40
};

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role
 * @param {string} permission - Permission to check
 * @param {Object} resource - Optional resource context
 * @returns {boolean}
 */
function hasPermission(user, permission, resource = null) {
    if (!user || !user.role) {
        return false;
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
        return false;
    }

    // Check direct role permission
    if (allowedRoles.includes(user.role)) {
        return true;
    }

    // Check inherited permissions
    const userRole = ROLES[user.role];
    if (userRole && userRole.inherits) {
        for (const inheritedRole of userRole.inherits) {
            if (allowedRoles.includes(inheritedRole)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Check if user can access resource based on assignment/ownership
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @param {Object} resource - Resource with owner/assignee info
 * @returns {boolean}
 */
function hasResourceAccess(user, permission, resource) {
    // Admin and campaign managers have access to everything
    if (['admin', 'campaign_manager'].includes(user.role)) {
        return true;
    }

    // Check if user is assigned to or owns the resource
    if (resource.assignee_id === user.id || resource.created_by === user.id) {
        return hasPermission(user, permission.replace('.all', '.assigned').replace('.assigned', '.own'));
    }

    // Check for team-based access (if implemented)
    if (resource.team_members && resource.team_members.includes(user.id)) {
        return hasPermission(user, permission.replace('.all', '.assigned'));
    }

    return false;
}

/**
 * Check time-based access restrictions
 * @param {Object} user - User object
 * @returns {boolean}
 */
function isAccessTimeValid(user) {
    const restrictions = ACCESS_RESTRICTIONS[user.role];
    if (!restrictions) {
        return true; // No time restrictions
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleLowerCase().slice(0, 3) + now.toLocaleLowerCase().slice(3);

    // Check hour restrictions
    if (restrictions.hours) {
        const [startHour, endHour] = restrictions.hours.split('-').map(Number);
        if (currentHour < startHour || currentHour >= endHour) {
            return false;
        }
    }

    // Check day restrictions
    if (restrictions.days) {
        const currentDayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        if (!restrictions.days.includes(currentDayName)) {
            return false;
        }
    }

    return true;
}

/**
 * Check content sensitivity access
 * @param {Object} user - User object
 * @param {string} sensitivityLevel - Content sensitivity level
 * @returns {boolean}
 */
function canAccessSensitivity(user, sensitivityLevel) {
    const userLevel = ROLES[user.role]?.level || 0;
    const requiredLevel = SENSITIVITY_LEVELS[sensitivityLevel] || 0;

    // Higher role levels can access lower sensitivity content
    return userLevel >= (requiredLevel + 30); // Require significant clearance above content level
}

/**
 * Middleware to require specific permission
 * @param {string} permission - Required permission
 * @param {Object} options - Additional options
 */
function requirePermission(permission, options = {}) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Check time-based access restrictions
            if (!isAccessTimeValid(req.user)) {
                return res.status(403).json({
                    error: 'Access denied outside allowed hours',
                    restrictions: ACCESS_RESTRICTIONS[req.user.role]
                });
            }

            // Check permission
            if (!hasPermission(req.user, permission)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: permission,
                    userRole: req.user.role
                });
            }

            // Check resource-specific access if resource context is provided
            if (options.resourceCheck && req.params) {
                let resource = null;

                // Fetch resource from database based on context
                if (options.resourceType === 'assignment' && req.params.assignmentId) {
                    resource = await db.get(
                        'SELECT * FROM assignments WHERE id = ?',
                        [req.params.assignmentId]
                    );
                } else if (options.resourceType === 'content' && req.params.contentId) {
                    // Check multiple content tables
                    const tables = ['speeches', 'social_posts', 'press_releases', 'policy_documents'];
                    for (const table of tables) {
                        resource = await db.get(
                            `SELECT * FROM ${table} WHERE id = ?`,
                            [req.params.contentId]
                        );
                        if (resource) break;
                    }
                }

                if (resource && !hasResourceAccess(req.user, permission, resource)) {
                    return res.status(403).json({
                        error: 'Access denied to this resource',
                        resourceId: resource.id
                    });
                }

                // Attach resource to request for use in route handler
                req.resource = resource;
            }

            // Check content sensitivity if specified
            if (options.sensitivityCheck && req.body?.sensitivity_level) {
                if (!canAccessSensitivity(req.user, req.body.sensitivity_level)) {
                    return res.status(403).json({
                        error: 'Insufficient clearance for content sensitivity level',
                        required: req.body.sensitivity_level,
                        userLevel: ROLES[req.user.role]?.level
                    });
                }
            }

            next();

        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
}

/**
 * Middleware to filter data based on user permissions
 * @param {Object} options - Filtering options
 */
function filterByPermissions(options = {}) {
    return (req, res, next) => {
        // Add a helper function to filter results based on user permissions
        req.filterResults = (results, resourceType) => {
            if (!results || !Array.isArray(results)) {
                return results;
            }

            // Admin and campaign managers see everything
            if (['admin', 'campaign_manager'].includes(req.user.role)) {
                return results;
            }

            // Filter based on assignment/ownership
            return results.filter(item => {
                return item.assignee_id === req.user.id ||
                       item.created_by === req.user.id ||
                       (item.team_members && item.team_members.includes(req.user.id));
            });
        };

        next();
    };
}

/**
 * Get user's effective permissions
 * @param {Object} user - User object
 * @returns {Array} Array of permissions
 */
function getUserPermissions(user) {
    if (!user || !user.role) {
        return [];
    }

    const userPermissions = [];
    const userRole = ROLES[user.role];
    const rolesToCheck = [user.role, ...(userRole?.inherits || [])];

    Object.entries(PERMISSIONS).forEach(([permission, allowedRoles]) => {
        if (allowedRoles.some(role => rolesToCheck.includes(role))) {
            userPermissions.push(permission);
        }
    });

    return userPermissions;
}

/**
 * API endpoint to check user permissions
 */
function createPermissionCheckEndpoint() {
    return (req, res) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const permissions = getUserPermissions(req.user);
        const restrictions = ACCESS_RESTRICTIONS[req.user.role];
        const roleInfo = ROLES[req.user.role];

        res.json({
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                role: req.user.role,
                roleLevel: roleInfo?.level || 0,
                roleDescription: roleInfo?.description || 'Unknown role'
            },
            permissions,
            restrictions: restrictions || null,
            timeBasedAccess: isAccessTimeValid(req.user),
            sensitivityClearance: {
                public: canAccessSensitivity(req.user, 'public'),
                internal: canAccessSensitivity(req.user, 'internal'),
                confidential: canAccessSensitivity(req.user, 'confidential'),
                restricted: canAccessSensitivity(req.user, 'restricted'),
                top_secret: canAccessSensitivity(req.user, 'top_secret')
            }
        });
    };
}

module.exports = {
    ROLES,
    PERMISSIONS,
    ACCESS_RESTRICTIONS,
    SENSITIVITY_LEVELS,
    hasPermission,
    hasResourceAccess,
    isAccessTimeValid,
    canAccessSensitivity,
    requirePermission,
    filterByPermissions,
    getUserPermissions,
    createPermissionCheckEndpoint
};