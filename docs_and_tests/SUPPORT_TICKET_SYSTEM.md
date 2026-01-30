# Support Ticket System - Implementation Summary

## Overview
A comprehensive support ticket system has been successfully implemented for the CRMS application, allowing both public users and staff members to create, manage, and communicate through support tickets.

## Database Schema

### Tables Created
1. **support_tickets**
   - `id` - Primary key
   - `ticket_number` - Unique ticket identifier (format: TKT-XXXXXXXX-XXX)
   - `user_id` - Foreign key to users table (nullable)
   - `staff_id` - Foreign key to staff_users table (nullable)
   - `subject` - Ticket subject/title
   - `category` - ENUM('affidavit', 'probate', 'payment', 'technical', 'other')
   - `priority` - ENUM('low', 'medium', 'high', 'urgent')
   - `status` - ENUM('open', 'in_progress', 'resolved', 'closed')
   - `description` - Detailed description of the issue
   - `resolution` - Resolution notes (staff only)
   - `assigned_to` - Staff member assigned to ticket
   - `created_at`, `updated_at`, `resolved_at`, `closed_at` - Timestamps

2. **support_ticket_messages**
   - `id` - Primary key
   - `ticket_id` - Foreign key to support_tickets
   - `sender_type` - ENUM('user', 'staff')
   - `sender_id` - ID of the sender
   - `message` - Message content
   - `attachment_path` - Optional file attachment
   - `created_at` - Timestamp

## Backend API Endpoints

### Public & Staff Endpoints
- `POST /api/support/tickets` - Create new support ticket
- `GET /api/support/tickets` - List tickets (filtered by user/staff role)
- `GET /api/support/tickets/:id` - Get ticket details with messages
- `POST /api/support/tickets/:id/messages` - Add message to ticket

### Staff-Only Endpoints
- `PUT /api/support/tickets/:id/status` - Update ticket status and assignment
- `GET /api/support/stats` - Get ticket statistics
- `GET /api/support/staff-list` - Get all active staff members for assignment (admin only)

## Features

### Ticket Management
- **Create Tickets**: Users and staff can create support tickets
- **Categories**: Affidavit, Probate, Payment, Technical, Other
- **Priority Levels**: Low, Medium, High, Urgent
- **Status Workflow**: Open → In Progress → Resolved → Closed
- **Admin Assignment**: Admins can manually assign tickets to specific staff members
- **Automated Routing**: New tickets are automatically pre-assigned to the least-busy staff member based on the ticket category:
  - **Affidavit** -> Jurat Officer
  - **Probate** -> Probate Registrar
  - **Payment** -> Commissioner For Oaths (CFO)
  - **Technical/Other** -> Administrator

### Communication
- **Two-way Messaging**: Real-time conversation between users and staff
- **Message History**: Complete conversation thread preserved
- **Sender Identification**: Clear distinction between user and staff messages

### Notifications
- **Ticket Creation**: Notifies admins and ticket creator
- **New Messages**: Notifies both parties when messages are added
- **Status Updates**: Notifies ticket creator when status changes
- **Assignment Notifications**: Notifies staff when assigned/unassigned from tickets

### Access Control
- **Public Users**: Can only view their own tickets
- **Staff (Non-Admin)**: Can view tickets they created or are assigned to
- **Admin Staff**: Can view all tickets

### UI Features
- **Search & Filters**: Search by ticket number/subject, filter by status/category
- **Color-Coded Badges**: Visual indicators for status and priority
- **Responsive Design**: Optimized for mobile and desktop
- **Real-time Updates**: Automatic refresh after actions

## Dashboard Integration

### Public Dashboards
✅ **OADR Dashboard** - Support menu added
✅ **Probate Dashboard** - Support menu added

### Staff Dashboards
✅ **Admin Dashboard** - Support Tickets menu added
✅ **CFO Dashboard** - Support menu added
✅ **Jurat Dashboard** - Support menu added (via JuratPortal)
✅ **PR Dashboard** - Support menu added

## File Structure

### Backend
- `server/server.js` - API endpoints (lines 3050-3395)
- `server/migrate_support_tables.js` - Database migration script

### Frontend
- `client/src/components/common/SupportTickets.jsx` - Main component (520 lines)
  - SupportTickets (main list view)
  - NewTicketForm (ticket creation)
  - TicketDetails (ticket view with messaging)

### Integration Points
- OADR Dashboard: `client/src/pages/public/OADRDashboard.jsx`
- Probate Dashboard: `client/src/pages/public/ProbateDashboard.jsx`
- Admin Dashboard: `client/src/pages/staff/AdminDashboard.jsx`
- CFO Dashboard: `client/src/pages/staff/CFODashboard.jsx`
- Jurat Dashboard: `client/src/components/staff/JuratPortal.jsx`
- PR Dashboard: `client/src/pages/staff/PRDashboard.jsx`

## Usage Guide

### For Public Users
1. Navigate to "Support" menu in dashboard
2. Click "New Ticket" button
3. Fill in subject, category, priority, and description
4. Submit ticket
5. View ticket details and add messages
6. Receive notifications on status updates

### For Staff
1. Navigate to "Support" or "Support Tickets" menu
2. View all tickets (admin) or assigned tickets (other roles)
3. Click on ticket to view details
4. Add messages to communicate with user
5. Update ticket status:
   - Mark as "In Progress" when working on it
   - Mark as "Resolved" with resolution notes
   - Close ticket when complete
6. **Assign & Override Tickets** (Admin only):
   - Click "Assign to Staff" or "Change Assignee" button (Purple)
   - Use the **"Filter by Role"** dropdown to narrow down staff members
   - Select a specific staff member or select **"Unassign"** to return it to the general queue
   - The system automatically triggers a notification to the new assignee

## Testing Checklist

- [ ] Create ticket as public user
- [ ] Create ticket as staff member
- [ ] View ticket list with filters
- [ ] Search tickets by number/subject
- [ ] Add messages to ticket
- [ ] Update ticket status (staff)
- [ ] Verify notifications are sent
- [ ] Test on mobile devices
- [ ] Test access control (users see only their tickets)
- [ ] Test admin can see all tickets

## Future Enhancements

Potential improvements:
1. File attachments for messages
2. Email notifications
3. Ticket assignment workflow
4. SLA tracking
5. Ticket templates
6. Bulk actions
7. Export ticket data
8. Advanced analytics dashboard
9. Canned responses for staff
10. Customer satisfaction ratings

## Notes

- Foreign key constraints were omitted for compatibility
- Ticket numbers are auto-generated with format TKT-TIMESTAMP-RANDOM
- All timestamps are in UTC
- Notifications use existing notification system
- Component is fully responsive and mobile-friendly
