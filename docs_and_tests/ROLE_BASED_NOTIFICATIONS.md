# Role-Based Staff Notifications Enhancement

## Overview
Enhanced the staff notification system to support role-based notifications, allowing notifications to be targeted to specific staff roles (e.g., registrar, cfo, jurat) instead of broadcasting to all staff members.

## Database Changes

### Table: `staff_notifications`
Added two columns:
- **`role_id`** (VARCHAR(50), DEFAULT NULL): Stores the role identifier for role-based notifications
- **`staff_id`** (INT, DEFAULT NULL): Modified to be nullable to support role-only notifications

### Migration Applied
```sql
ALTER TABLE staff_notifications 
ADD COLUMN role_id VARCHAR(50) DEFAULT NULL AFTER staff_id,
MODIFY COLUMN staff_id INT NULL;
```

## Backend Changes

### 1. Updated Notification Functions (`server.js`)

#### `createStaffNotification()`
- **Before**: `createStaffNotification(staffId, title, message, type = 'info')`
- **After**: `createStaffNotification(staffId, title, message, type = 'info', roleId = null)`
- Now accepts an optional `roleId` parameter

#### New Function: `notifyStaffByRole()`
```javascript
const notifyStaffByRole = (role, title, message, type = 'info') => {
    // Creates a single notification with role_id
    // More efficient than creating individual notifications per staff member
    const sql = 'INSERT INTO staff_notifications (staff_id, title, message, type, role_id) VALUES (NULL, ?, ?, ?, ?)';
    db.query(sql, [title, message, type, role], (err) => {
        if (err) console.error('[Notification Error] Role-based:', err);
    });
};
```

### 2. Updated Notification Endpoint

**GET `/api/notifications/staff`**
- **Before**: Fetched notifications only for the specific staff member
- **After**: Fetches notifications for the staff member OR their role
```javascript
SELECT * FROM staff_notifications 
WHERE (staff_id = ? OR role_id = ?) 
ORDER BY created_at DESC LIMIT 50
```

### 3. Updated Notification Calls

Implemented a dual notification system combining role-based and individual notifications:

| Event | CFO Role (Role-based) | Jurat Staff (Individual) | Public User |
|-------|----------------------|--------------------------|-------------|
| **New Affidavit Filed (Public)** | ✅ Notified | ❌ N/A | ✅ Notified |
| **New Affidavit Filed (Jurat)** | ✅ Notified | ✅ Filing staff notified | ❌ N/A (Applicant emailed) |
| **Affidavit Resubmitted** | ✅ Notified | ✅ Original filing staff notified (if Jurat) | ✅ Notified (if exists) |
| **Virtual Oath Requested** | ✅ Notified | ❌ N/A | ❌ N/A |
| **Affidavit Approved** | ❌ N/A | ✅ Filing staff notified (if Jurat) | ✅ Notified |
| **Affidavit Rejected** | ❌ N/A | ✅ Filing staff notified (if Jurat) | ✅ Notified |
| **New Probate Application** | ❌ N/A | ❌ N/A | ✅ Notified |
| **New Probate (Registrar)** | Role: `registrar` | ❌ N/A | ✅ Notified |

### Key Points:
- **CFO Role**: Receives ALL affidavit-related notifications (new filings, resubmissions, virtual oath requests)
- **Jurat Staff**: Only receives notifications for affidavits THEY filed (via `filed_by_staff_id`)
- **Public Users**: Receive notifications for their own affidavits

## Benefits

1. **Reduced Notification Noise**: Staff only see notifications relevant to their role
2. **Better Workflow Management**: Notifications route to the appropriate team
3. **Scalability**: Adding new staff doesn't create notification spam
4. **Efficiency**: Single database insert per role instead of one per staff member

## Example Usage

```javascript
// Notify all CFOs about a new affidavit
notifyStaffByRole(
    'cfo',
    'New Affidavit Filed',
    `A new affidavit has been filed. ID: CRMS-123`,
    'info'
);

// Notify all CFOs about a virtual oath request
notifyStaffByRole(
    'cfo',
    'Virtual Oath Requested',
    `User is waiting for virtual oath session. ID: CRMS-456`,
    'warning'
);

// Notify specific staff member who filed the affidavit (Jurat workflow)
if (affidavit.filed_by_staff_id) {
    createStaffNotification(
        affidavit.filed_by_staff_id,
        'Affidavit Approved',
        `The affidavit you filed has been approved. ID: CRMS-789`,
        'success'
    );
}
```

## Testing Checklist

- [ ] Verify registrar staff receive new affidavit notifications
- [ ] Verify CFO staff receive virtual oath request notifications
- [ ] Verify staff don't receive notifications for other roles
- [ ] Verify individual staff notifications still work (staff_id not null)
- [ ] Verify notification read/unread status works correctly
- [ ] Test with multiple staff members in same role
- [ ] Test with staff members in different roles

## Future Enhancements

- Add admin UI to configure which roles receive which notification types
- Add notification preferences per staff member
- Implement notification batching for high-volume events
- Add email digest for unread notifications by role
