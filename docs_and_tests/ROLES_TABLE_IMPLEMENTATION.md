# Roles Table Implementation - Complete

## Overview
Successfully refactored the staff management system to use a normalized `roles` table instead of hardcoded role strings. This provides a flexible, maintainable role management system with full CRUD capabilities.

## Database Changes

### 1. New Table: `roles`
```sql
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Default Roles Created:**
- `admin` - Administrator (Full system access and management)
- `registrar` - Registrar (Handles registration and initial review)
- `cr` - Court Registrar (Court registry management)
- `cfo` - Chief Filing Officer (Reviews and approves affidavits)
- `jurat` - Jurat Officer (Files affidavits on behalf of applicants)

### 2. Updated Table: `staff_users`
**Added Column:**
- `role_id` (INT, DEFAULT NULL) - Foreign key reference to roles.id
- `role` (VARCHAR) - Kept for backward compatibility, synced with roles.name

**Migration Applied:**
- All existing staff records were updated with `role_id` based on their `role` column
- Foreign key constraint added: `fk_staff_role`

## Backend API Changes

### New Endpoints: `/api/roles`

#### GET `/api/roles`
- **Auth**: Required
- **Returns**: List of all roles
```json
[
  {
    "id": 1,
    "name": "admin",
    "display_name": "Administrator",
    "description": "Full system access and management",
    "created_at": "2026-01-17...",
    "updated_at": "2026-01-17..."
  }
]
```

#### GET `/api/roles/:id`
- **Auth**: Admin only
- **Returns**: Single role details

#### POST `/api/roles`
- **Auth**: Admin only
- **Body**:
```json
{
  "name": "clerk",
  "display_name": "Clerk",
  "description": "Administrative clerk responsibilities"
}
```
- **Validation**: Name must be unique, lowercase, no spaces

#### PUT `/api/roles/:id`
- **Auth**: Admin only
- **Body**: `{ "display_name": "...", "description": "..." }`
- **Note**: `name` cannot be changed (it's the identifier)

#### DELETE `/api/roles/:id`
- **Auth**: Admin only
- **Validation**: Cannot delete roles assigned to staff members

### Updated Endpoints: `/api/staff`

#### GET `/api/staff`
Now returns with JOIN to roles table:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "role_id": 1,
    "role_name": "admin",
    "role_display_name": "Administrator",
    "division": "Main",
    "status": "active",
    "signature_path": "/uploads/...",
    "created_at": "..."
  }
]
```

#### POST `/api/staff`
**Request Body Changed:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret",
  "role_id": 2,  // Changed from "role": "registrar"
  "division": "Registry",
  "status": "active"
}
```

**Backend Process:**
1. Validates `role_id` exists in roles table
2. Gets `name` from roles table
3. Inserts with both `role` (for backward compat) and `role_id`

#### PUT `/api/staff/:id`
**Request Body Changed:**
- Uses `role_id` instead of `role`
- Backend syncs `role` name from roles table

## Frontend Changes

### 1. New Component: `RoleManager.jsx`
**Location:** `client/src/components/staff/RoleManager.jsx`

**Features:**
- Grid display of all roles with visual cards
- Add new role (admin only)
- Edit role display name and description
- Delete role (with validation check)
- Beautiful UI with gradients and animations

**Usage:**
- Accessible from Admin Dashboard → Role Management menu

### 2. Updated Component: `StaffManager.jsx`

**Changes:**
- Fetches roles from `/api/roles` on mount
- Role dropdown now populated dynamically from database
- Displays `role_display_name` in staff table
- Sends `role_id` to backend instead of `role` string

**Before:**
```jsx
<option value="jurat">Jurat Officer</option>
<option value="admin">Super Admin</option>
```

**After:**
```jsx
{roles.map(role => (
  <option key={role.id} value={role.id}>
    {role.display_name}
  </option>
))}
```

### 3. Updated Dashboard: `AdminDashboard.jsx`

**Added:**
- New menu item: "Role Management" with `UserCheck` icon
- Import for `RoleManager` component
- Conditional render for `roles` tab

## Benefits

### 1. **Flexibility**
- Admins can create custom roles without code changes
- Easy to add new roles as organization grows
- No need to redeploy for role changes

### 2. **Maintainability**
- Centralized role definitions
- Consistent role data across system
- Easy to update role descriptions

### 3. **Data Integrity**
- Foreign key constraints ensure data consistency
- Cannot delete roles in use
- Unique name constraint prevents duplicates

### 4. **Better UX**
- Admins see friendly display names (e.g., "Administrator" instead of "admin")
- Role descriptions help clarify responsibilities
- Visual role management interface

### 5. **Scalability**
- Can add role permissions/capabilities in future
- Easy to extend with role-based access control (RBAC)
- Foundation for more complex permission systems

## Migration Notes

### Backward Compatibility
- `staff_users.role` column retained for now
- System syncs `role` with `role_id` automatically
- Existing notifications using `role` string still work

### Future Cleanup (Optional)
After confirming everything works:
1. Update all code references from `role` to `role_id`
2. Remove `role` column from `staff_users`
3. Update notification system to use pure `role_id`

## Testing Checklist

- [x] Database migration completed successfully
- [x] Roles API endpoints working
- [x] Staff creation with role_id works
- [x] Staff editing with role_id works
- [x] Role Manager UI functional
- [ ] Test creating new custom role
- [ ] Test updating role display name
- [ ] Test deleting unused role
- [ ] Test error when deleting role in use
- [ ] Test staff dropdown shows dynamic roles
- [ ] Test role display in staff table
- [ ] Test backward compatibility with existing code

## Files Modified

### Backend
- `server/create_roles_table.js` (new) - Migration script
- `server/server.js` - Added roles endpoints, updated staff endpoints

### Frontend
- `client/src/pages/staff/AdminDashboard.jsx` - Added Role Management menu
- `client/src/components/staff/RoleManager.jsx` (new) - Role management UI
- `client/src/components/staff/StaffManager.jsx` - Updated to use role_id

## Next Steps

1. **Test thoroughly** in development environment
2. **Verify** all existing staff can login
3. **Confirm** notifications still route correctly
4. **Test** creating a new custom role end-to-end
5. **Document** for other developers

## Rollback Plan

If issues arise:
1. Roles table will remain (no harm)
2. Staff endpoints fallback to `role` column
3. Frontend can revert to hardcoded role dropdown
4. No data loss - all original `role` values preserved
