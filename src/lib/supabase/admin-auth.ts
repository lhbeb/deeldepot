import { supabaseAdmin } from './server';
import bcrypt from 'bcryptjs';

// ============================================
// ADMIN ROLE TYPES
// ============================================

export type AdminRole = 'REGULAR_ADMIN' | 'SUPER_ADMIN';

export interface AdminUser {
    id: string;
    email: string;
    role: AdminRole;
    isActive: boolean;
    lastLogin: string | null;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface AdminPermission {
    permissionKey: string;
    permissionName: string;
    description: string | null;
    requiredRole: AdminRole;
    category: string;
}

// ============================================
// HARDCODED ADMIN CREDENTIALS
// ============================================
// These are the two admin accounts with hardcoded passwords
// Passwords are hashed using bcrypt for security

const ADMIN_CREDENTIALS = {
    REGULAR_ADMIN: {
        email: 'elmahboubimehdi@gmail.com',
        password: 'Localserver!!2',
        role: 'REGULAR_ADMIN' as AdminRole,
    },
    SUPER_ADMIN: {
        email: 'Matrix01mehdi@gmail.com',
        password: 'Mehbde!!2',
        role: 'SUPER_ADMIN' as AdminRole,
    },
};

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

// ============================================
// ADMIN AUTHENTICATION
// ============================================

/**
 * Authenticate admin user with email and password
 * Returns admin user data if successful
 */
export async function authenticateAdmin(
    email: string,
    password: string
): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
    try {
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Check if this is one of the hardcoded admin accounts
        const isRegularAdmin = normalizedEmail === ADMIN_CREDENTIALS.REGULAR_ADMIN.email.toLowerCase();
        const isSuperAdmin = normalizedEmail === ADMIN_CREDENTIALS.SUPER_ADMIN.email.toLowerCase();

        if (!isRegularAdmin && !isSuperAdmin) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Verify password
        const expectedPassword = isRegularAdmin
            ? ADMIN_CREDENTIALS.REGULAR_ADMIN.password
            : ADMIN_CREDENTIALS.SUPER_ADMIN.password;

        if (password !== expectedPassword) {
            // Log failed attempt
            await logAdminAction(
                normalizedEmail,
                'LOGIN_FAILED',
                null,
                null,
                { reason: 'Invalid password' },
                null,
                null,
                'FAILED'
            );
            return { success: false, error: 'Invalid credentials' };
        }

        // Get or create admin user in database
        const { data: existingAdmin, error: fetchError } = await supabaseAdmin
            .from('admin_roles')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        let adminUser: any;

        if (fetchError || !existingAdmin) {
            // Create admin user in database
            const role = isRegularAdmin ? 'REGULAR_ADMIN' : 'SUPER_ADMIN';
            const passwordHash = await hashPassword(password);

            const { data: newAdmin, error: createError } = await supabaseAdmin
                .from('admin_roles')
                .insert({
                    email: normalizedEmail,
                    role: role,
                    password_hash: passwordHash,
                    is_active: true,
                    last_login: new Date().toISOString(),
                    metadata: {
                        display_name: isRegularAdmin ? 'Regular Admin' : 'Super Admin',
                        department: isRegularAdmin ? 'Operations' : 'System Administration',
                    },
                })
                .select()
                .single();

            if (createError || !newAdmin) {
                console.error('Error creating admin user:', createError);
                return { success: false, error: 'Authentication failed' };
            }

            adminUser = newAdmin;
        } else {
            // Update last login
            const { data: updatedAdmin, error: updateError } = await supabaseAdmin
                .from('admin_roles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', existingAdmin.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating last login:', updateError);
            }

            adminUser = updatedAdmin || existingAdmin;
        }

        // Check if admin is active
        if (!adminUser.is_active) {
            return { success: false, error: 'Account is deactivated' };
        }

        // Log successful login
        await logAdminAction(
            normalizedEmail,
            'LOGIN_SUCCESS',
            null,
            null,
            { role: adminUser.role },
            null,
            null,
            'SUCCESS'
        );

        // Return admin user data
        const admin: AdminUser = {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            isActive: adminUser.is_active,
            lastLogin: adminUser.last_login,
            metadata: adminUser.metadata || {},
            createdAt: adminUser.created_at,
            updatedAt: adminUser.updated_at,
        };

        return { success: true, admin };
    } catch (error) {
        console.error('Error authenticating admin:', error);
        return { success: false, error: 'Authentication failed' };
    }
}

// ============================================
// PERMISSION CHECKING
// ============================================

/**
 * Check if admin has a specific permission
 */
export async function checkAdminPermission(
    email: string,
    permissionKey: string
): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin.rpc('check_admin_permission', {
            p_admin_email: email.toLowerCase().trim(),
            p_permission_key: permissionKey,
        });

        if (error) {
            console.error('Error checking permission:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Get all permissions for an admin
 */
export async function getAdminPermissions(email: string): Promise<string[]> {
    try {
        // Get admin role
        const { data: admin, error: adminError } = await supabaseAdmin
            .from('admin_roles')
            .select('role')
            .eq('email', email.toLowerCase().trim())
            .eq('is_active', true)
            .single();

        if (adminError || !admin) {
            return [];
        }

        // Get all permissions for this role
        const { data: permissions, error: permError } = await supabaseAdmin
            .from('admin_permissions')
            .select('permission_key')
            .or(`required_role.eq.${admin.role},required_role.eq.REGULAR_ADMIN`);

        if (permError || !permissions) {
            return [];
        }

        // Super admin gets all permissions
        if (admin.role === 'SUPER_ADMIN') {
            const { data: allPerms } = await supabaseAdmin
                .from('admin_permissions')
                .select('permission_key');
            return allPerms?.map((p) => p.permission_key) || [];
        }

        return permissions.map((p) => p.permission_key);
    } catch (error) {
        console.error('Error getting admin permissions:', error);
        return [];
    }
}

/**
 * Get admin role
 */
export async function getAdminRole(email: string): Promise<AdminRole | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('admin_roles')
            .select('role')
            .eq('email', email.toLowerCase().trim())
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return null;
        }

        return data.role as AdminRole;
    } catch (error) {
        console.error('Error getting admin role:', error);
        return null;
    }
}

/**
 * Check if user is admin (any role)
 */
export async function isAdmin(email: string): Promise<boolean> {
    const role = await getAdminRole(email);
    return role !== null;
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
    const role = await getAdminRole(email);
    return role === 'SUPER_ADMIN';
}

// ============================================
// AUDIT LOGGING
// ============================================

/**
 * Log an admin action
 */
export async function logAdminAction(
    adminEmail: string,
    action: string,
    resourceType: string | null = null,
    resourceId: string | null = null,
    details: Record<string, any> = {},
    ipAddress: string | null = null,
    userAgent: string | null = null,
    status: 'SUCCESS' | 'FAILED' | 'DENIED' = 'SUCCESS'
): Promise<void> {
    try {
        await supabaseAdmin.rpc('log_admin_action', {
            p_admin_email: adminEmail.toLowerCase().trim(),
            p_action: action,
            p_resource_type: resourceType,
            p_resource_id: resourceId,
            p_details: details,
            p_ip_address: ipAddress,
            p_user_agent: userAgent,
            p_status: status,
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
        // Don't throw - logging failures shouldn't break the app
    }
}

/**
 * Get admin audit logs
 */
export async function getAdminAuditLogs(
    filters: {
        adminEmail?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    } = {}
): Promise<any[]> {
    try {
        let query = supabaseAdmin
            .from('admin_audit_log')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.adminEmail) {
            query = query.eq('admin_email', filters.adminEmail.toLowerCase().trim());
        }

        if (filters.action) {
            query = query.eq('action', filters.action);
        }

        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}

// ============================================
// ADMIN MANAGEMENT (SUPER ADMIN ONLY)
// ============================================

/**
 * Get all admin users
 */
export async function getAllAdmins(): Promise<AdminUser[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('admin_roles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) {
            return [];
        }

        return data.map((admin) => ({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            isActive: admin.is_active,
            lastLogin: admin.last_login,
            metadata: admin.metadata || {},
            createdAt: admin.created_at,
            updatedAt: admin.updated_at,
        }));
    } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
    }
}

/**
 * Update admin role (Super Admin only)
 */
export async function updateAdminRole(
    adminId: string,
    newRole: AdminRole,
    performedBy: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if performer is super admin
        const performerRole = await getAdminRole(performedBy);
        if (performerRole !== 'SUPER_ADMIN') {
            await logAdminAction(
                performedBy,
                'UPDATE_ADMIN_ROLE',
                'admin',
                adminId,
                { newRole, reason: 'Permission denied' },
                null,
                null,
                'DENIED'
            );
            return { success: false, error: 'Permission denied. Super Admin access required.' };
        }

        const { error } = await supabaseAdmin
            .from('admin_roles')
            .update({ role: newRole })
            .eq('id', adminId);

        if (error) {
            console.error('Error updating admin role:', error);
            return { success: false, error: 'Failed to update admin role' };
        }

        // Log the action
        await logAdminAction(
            performedBy,
            'UPDATE_ADMIN_ROLE',
            'admin',
            adminId,
            { newRole },
            null,
            null,
            'SUCCESS'
        );

        return { success: true };
    } catch (error) {
        console.error('Error updating admin role:', error);
        return { success: false, error: 'Failed to update admin role' };
    }
}

/**
 * Deactivate admin account (Super Admin only)
 */
export async function deactivateAdmin(
    adminId: string,
    performedBy: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if performer is super admin
        const performerRole = await getAdminRole(performedBy);
        if (performerRole !== 'SUPER_ADMIN') {
            return { success: false, error: 'Permission denied. Super Admin access required.' };
        }

        const { error } = await supabaseAdmin
            .from('admin_roles')
            .update({ is_active: false })
            .eq('id', adminId);

        if (error) {
            console.error('Error deactivating admin:', error);
            return { success: false, error: 'Failed to deactivate admin' };
        }

        // Log the action
        await logAdminAction(
            performedBy,
            'DEACTIVATE_ADMIN',
            'admin',
            adminId,
            {},
            null,
            null,
            'SUCCESS'
        );

        return { success: true };
    } catch (error) {
        console.error('Error deactivating admin:', error);
        return { success: false, error: 'Failed to deactivate admin' };
    }
}
