# Notification System

This document outlines the notification system implemented for the CRMS application.

## Overview
The system provides in-app notifications for both Public Users (Deponents) and Staff Members (Jurat, CFO, CR, etc.). It uses a polling mechanism on the frontend to fetch real-time updates from the backend.

## Database Tables
1. **public_notifications**
   - Stores notifications for public users.
   - Linked to `public_users` via `user_id`.
   - Fields: `title`, `message`, `type` (info, success, warning, error), `is_read`, `created_at`.
2. **staff_notifications**
   - Stores notifications for staff.
   - Linked to `staff_users` via `staff_id`.
   - Fields: `title`, `message`, `type`, `is_read`, `created_at`.

## Backend API
- **GET /api/notifications/public**: Fetch notifications for logged-in public user.
- **GET /api/notifications/staff**: Fetch notifications for logged-in staff.
- **PUT /api/notifications/public/:id/read**: Mark public notification as read.
- **PUT /api/notifications/staff/:id/read**: Mark staff notification as read.
- **DELETE /api/notifications/public/:id**: Delete public notification.
- **DELETE /api/notifications/staff/:id**: Delete staff notification.

## Notification Triggers
Notifications are automatically generated for the following events:

**For Public Users:**
- **Affidavit Filed**: Confirmation of successful submission.
- **Affidavit Approved**: "Success" alert when status changes to `completed`.
- **Affidavit Rejected**: "Error" alert with remarks when status changes to `rejected`.
- **Affidavit Resubmitted**: Confirmation of resubmission.
- **Probate Application Filed**: Confirmation of successful submission.
- **Probate Application Updated**: Status updates or approvals from CR/Registrar.

**For Staff:**
- **New Affidavit Filed**: Alert for new pending applications.
- **Affidavit Resubmitted**: Alert when a rejected affidavit is fixed and returned.
- **Virtual Oath Requested**: "Warning" alert when a deponent is waiting in the queue.
- **New Probate Application**: Alert for new probate filings (both public and staff-assisted).

## Frontend Implementation
- **Header Component**: Displays a notification bell with an unread count badge. Clicking the bell shows a dropdown list of recent notifications.
- **Dashboards**: Polling logic (`setInterval`) is implemented in `OADRDashboard`, `JuratDashboard`, `CFODashboard`, and `CRDashboard` to fetch notifications every 30 seconds.
- **Interactions**: Users can mark individual items as read or "Mark all read".

## Setup
The database tables are initialized via `server/init_notifications.js`. This script should be run once during deployment.
