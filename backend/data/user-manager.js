/**
 * User Manager - Manages user authentication and profile data
 */

class UserManager {
    constructor(db) {
        this.db = db;
    }

    /**
     * Find user by email address
     * @param {string} email - User email address
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE email = ?',
                [email],
                (err, user) => {
                    if (err) return reject(err);
                    resolve(user || null);
                }
            );
        });
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} User object or null if not found
     */
    async getUserById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE id = ?',
                [id],
                (err, user) => {
                    if (err) return reject(err);
                    resolve(user || null);
                }
            );
        });
    }

    /**
     * Find user by role (typically for dev login)
     * @param {string} role - User role (e.g., 'writer', 'editor', 'admin')
     * @returns {Promise<Object|null>} First user with that role or null if not found
     */
    async getUserByRole(role) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE role = ? LIMIT 1',
                [role],
                (err, user) => {
                    if (err) return reject(err);
                    resolve(user || null);
                }
            );
        });
    }

    /**
     * Update user's last login timestamp
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    async updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [userId],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }

    /**
     * Create a new user
     * @param {Object} userData - User data object
     * @param {string} userData.email - User email
     * @param {string} userData.password - Hashed password
     * @param {string} userData.name - User full name
     * @param {string} userData.role - User role
     * @returns {Promise<Object>} Created user with ID
     */
    async createUser(userData) {
        const { email, password, name, role = 'writer' } = userData;

        if (!email || !password || !name) {
            throw new Error('Email, password, and name are required');
        }

        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO users (email, password, name, role, created_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [email, password, name, role],
                function(err) {
                    if (err) return reject(err);
                    resolve({
                        id: this.lastID,
                        email,
                        name,
                        role
                    });
                }
            );
        });
    }

    /**
     * Update user data
     * @param {number} userId - User ID
     * @param {Object} userData - Fields to update
     * @returns {Promise<void>}
     */
    async updateUser(userId, userData) {
        const allowedFields = ['email', 'password', 'name', 'role', 'profile_data'];
        const fields = Object.keys(userData).filter(field => allowedFields.includes(field));

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...fields.map(field => userData[field]), userId];

        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                values,
                function(err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error('User not found'));
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * Delete a user
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM users WHERE id = ?',
                [userId],
                function(err) {
                    if (err) return reject(err);
                    if (this.changes === 0) {
                        return reject(new Error('User not found'));
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * Get all users with optional role filter
     * @param {string} roleFilter - Optional role to filter by
     * @returns {Promise<Array>} Array of user objects
     */
    async getAllUsers(roleFilter = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT id, email, name, role, created_at, last_login FROM users';
            const params = [];

            if (roleFilter) {
                query += ' WHERE role = ?';
                params.push(roleFilter);
            }

            query += ' ORDER BY created_at DESC';

            this.db.all(query, params, (err, users) => {
                if (err) return reject(err);
                resolve(users || []);
            });
        });
    }

    /**
     * Check if email already exists
     * @param {string} email - Email to check
     * @param {number} excludeUserId - Optional user ID to exclude from check (for updates)
     * @returns {Promise<boolean>} True if email exists
     */
    async emailExists(email, excludeUserId = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
            const params = [email];

            if (excludeUserId) {
                query += ' AND id != ?';
                params.push(excludeUserId);
            }

            this.db.get(query, params, (err, result) => {
                if (err) return reject(err);
                resolve(result.count > 0);
            });
        });
    }
}

module.exports = UserManager;
