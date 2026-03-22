-- ============================================
-- ADMIN ROLE-BASED ACCESS CONTROL SYSTEM
-- ============================================
-- This schema implements a two-tier admin system:
-- 1. REGULAR_ADMIN: Standard admin access
-- 2. SUPER_ADMIN: Full system access with elevated privileges
-- ============================================

-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('REGULAR_ADMIN', 'SUPER_ADMIN')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_roles(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  description TEXT,
  required_role TEXT NOT NULL CHECK (required_role IN ('REGULAR_ADMIN', 'SUPER_ADMIN')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'DENIED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_is_active ON admin_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_required_role ON admin_permissions(required_role);

-- Insert default permissions
INSERT INTO admin_permissions (permission_key, permission_name, description, required_role, category) VALUES
  -- Product Management (Regular Admin)
  ('products.view', 'View Products', 'View product listings', 'REGULAR_ADMIN', 'products'),
  ('products.create', 'Create Products', 'Create new products', 'REGULAR_ADMIN', 'products'),
  ('products.edit', 'Edit Products', 'Edit existing products', 'REGULAR_ADMIN', 'products'),
  ('products.delete', 'Delete Products', 'Delete products (soft delete)', 'SUPER_ADMIN', 'products'),
  ('products.publish', 'Publish Products', 'Publish/unpublish products', 'REGULAR_ADMIN', 'products'),
  
  -- Order Management (Regular Admin)
  ('orders.view', 'View Orders', 'View order listings', 'REGULAR_ADMIN', 'orders'),
  ('orders.edit', 'Edit Orders', 'Edit order details', 'REGULAR_ADMIN', 'orders'),
  ('orders.cancel', 'Cancel Orders', 'Cancel orders', 'REGULAR_ADMIN', 'orders'),
  ('orders.refund', 'Refund Orders', 'Process refunds', 'SUPER_ADMIN', 'orders'),
  ('orders.delete', 'Delete Orders', 'Permanently delete orders', 'SUPER_ADMIN', 'orders'),
  
  -- User Management (Super Admin Only)
  ('users.view', 'View Users', 'View user listings', 'SUPER_ADMIN', 'users'),
  ('users.edit', 'Edit Users', 'Edit user details', 'SUPER_ADMIN', 'users'),
  ('users.delete', 'Delete Users', 'Delete user accounts', 'SUPER_ADMIN', 'users'),
  ('users.ban', 'Ban Users', 'Ban/unban users', 'SUPER_ADMIN', 'users'),
  
  -- Admin Management (Super Admin Only)
  ('admins.view', 'View Admins', 'View admin listings', 'SUPER_ADMIN', 'admins'),
  ('admins.create', 'Create Admins', 'Create new admin accounts', 'SUPER_ADMIN', 'admins'),
  ('admins.edit', 'Edit Admins', 'Edit admin details', 'SUPER_ADMIN', 'admins'),
  ('admins.delete', 'Delete Admins', 'Delete admin accounts', 'SUPER_ADMIN', 'admins'),
  ('admins.change_role', 'Change Admin Roles', 'Promote/demote admins', 'SUPER_ADMIN', 'admins'),
  
  -- System Settings (Super Admin Only)
  ('settings.view', 'View Settings', 'View system settings', 'SUPER_ADMIN', 'settings'),
  ('settings.edit', 'Edit Settings', 'Edit system settings', 'SUPER_ADMIN', 'settings'),
  ('settings.email', 'Email Settings', 'Configure email settings', 'SUPER_ADMIN', 'settings'),
  ('settings.payment', 'Payment Settings', 'Configure payment settings', 'SUPER_ADMIN', 'settings'),
  
  -- Analytics & Reports (Regular Admin)
  ('analytics.view', 'View Analytics', 'View analytics dashboard', 'REGULAR_ADMIN', 'analytics'),
  ('analytics.export', 'Export Analytics', 'Export analytics data', 'REGULAR_ADMIN', 'analytics'),
  ('reports.view', 'View Reports', 'View reports', 'REGULAR_ADMIN', 'reports'),
  ('reports.export', 'Export Reports', 'Export reports', 'SUPER_ADMIN', 'reports'),
  
  -- Audit Logs (Super Admin Only)
  ('audit.view', 'View Audit Logs', 'View system audit logs', 'SUPER_ADMIN', 'audit'),
  ('audit.export', 'Export Audit Logs', 'Export audit logs', 'SUPER_ADMIN', 'audit'),
  
  -- Database Operations (Super Admin Only)
  ('database.backup', 'Database Backup', 'Create database backups', 'SUPER_ADMIN', 'database'),
  ('database.restore', 'Database Restore', 'Restore database from backup', 'SUPER_ADMIN', 'database'),
  ('database.export', 'Export Data', 'Export database data', 'SUPER_ADMIN', 'database')
ON CONFLICT (permission_key) DO NOTHING;

-- Insert the two admin users
-- Note: Password hashes need to be generated using bcrypt
-- For now, we'll use placeholder hashes that need to be updated
INSERT INTO admin_roles (email, role, password_hash, is_active, metadata) VALUES
  (
    'elmahboubimehdi@gmail.com',
    'REGULAR_ADMIN',
    '$2b$10$placeholder_hash_for_regular_admin', -- This will be replaced by actual hash
    TRUE,
    '{"display_name": "Regular Admin", "department": "Operations"}'::jsonb
  ),
  (
    'Matrix01mehdi@gmail.com',
    'SUPER_ADMIN',
    '$2b$10$placeholder_hash_for_super_admin', -- This will be replaced by actual hash
    TRUE,
    '{"display_name": "Super Admin", "department": "System Administration"}'::jsonb
  )
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_admin_updated_at ON admin_roles;
CREATE TRIGGER trigger_update_admin_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_email TEXT,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'SUCCESS'
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_log_id UUID;
BEGIN
  -- Get admin ID
  SELECT id INTO v_admin_id FROM admin_roles WHERE email = p_admin_email;
  
  -- Insert audit log
  INSERT INTO admin_audit_log (
    admin_id,
    admin_email,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    status
  ) VALUES (
    v_admin_id,
    p_admin_email,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent,
    p_status
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check admin permission
CREATE OR REPLACE FUNCTION check_admin_permission(
  p_admin_email TEXT,
  p_permission_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_role TEXT;
  v_required_role TEXT;
BEGIN
  -- Get admin role
  SELECT role INTO v_admin_role
  FROM admin_roles
  WHERE email = p_admin_email AND is_active = TRUE;
  
  IF v_admin_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get required role for permission
  SELECT required_role INTO v_required_role
  FROM admin_permissions
  WHERE permission_key = p_permission_key;
  
  IF v_required_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Super admin has all permissions
  IF v_admin_role = 'SUPER_ADMIN' THEN
    RETURN TRUE;
  END IF;
  
  -- Regular admin only has permissions that require REGULAR_ADMIN
  IF v_admin_role = 'REGULAR_ADMIN' AND v_required_role = 'REGULAR_ADMIN' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON admin_roles TO authenticated;
GRANT SELECT ON admin_permissions TO authenticated;
GRANT SELECT, INSERT ON admin_audit_log TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE admin_roles IS 'Stores admin user accounts with role-based access control';
COMMENT ON TABLE admin_permissions IS 'Defines available permissions and their required roles';
COMMENT ON TABLE admin_audit_log IS 'Tracks all admin actions for security and compliance';
COMMENT ON FUNCTION check_admin_permission IS 'Checks if an admin has permission to perform an action';
COMMENT ON FUNCTION log_admin_action IS 'Logs an admin action to the audit trail';

-- Display summary
SELECT 'Admin RBAC system created successfully!' AS status;
SELECT 'Total permissions created: ' || COUNT(*)::TEXT FROM admin_permissions;
SELECT 'Admin accounts created: ' || COUNT(*)::TEXT FROM admin_roles;
