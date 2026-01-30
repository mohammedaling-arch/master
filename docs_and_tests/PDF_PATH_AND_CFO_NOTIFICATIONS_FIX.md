# Affidavit PDF Path and CFO Notifications - Fix Summary

## Issues Fixed

### 1. PDF Path Not Generated for Jurat-Filed Affidavits ✅

**Problem:**
- When Jurat staff filed affidavits, the `pdf_path` was being set to the uploaded file path
- This was incorrect - `pdf_path` should only be set when CFO approves and generates the certified PDF

**Solution:**
- Removed `pdf_path` from INSERT statement when filing affidavits
- Both public users and Jurat staff now file with `pdf_path = NULL`
- PDF path is only set when CFO approves (status = 'completed')

**Changed Files:**
- `server.js` line 857-859 (public user filing)
- `server.js` line 1744-1750 (Jurat staff filing)

**Before:**
```javascript
// Public user filing
INSERT INTO affidavits (user_id, type, content, amount, pdf_path, status) 
VALUES (?, ?, ?, ?, ?, "submitted")
// pdf_path was set to uploaded file

// Jurat filing
INSERT INTO affidavits (applicant_id, filed_by_staff_id, type, content, amount, pdf_path, status) 
VALUES (?, ?, ?, ?, ?, ?, 'submitted')
// pdf_path was set to uploaded file
```

**After:**
```javascript
// Public user filing
INSERT INTO affidavits (user_id, type, content, amount, status) 
VALUES (?, ?, ?, ?, "submitted")
// pdf_path = NULL

// Jurat filing
INSERT INTO affidavits (applicant_id, filed_by_staff_id, type, content, amount, status) 
VALUES (?, ?, ?, ?, ?, 'submitted')
// pdf_path = NULL
```

### 2. CFO Role Notifications ✅

**Verification:**
All affidavit-related events now notify the CFO role (already implemented in previous updates):

| Event | Role Notified | Line in server.js |
|-------|---------------|-------------------|
| New Affidavit Filed (Public) | `cfo` | 888-893 |
| New Affidavit Filed (Jurat) | `cfo` | 1768-1773 |
| Affidavit Resubmitted | `cfo` | 953-958 |
| Virtual Oath Requested | `cfo` | 1436-1441 |

**Notification Messages:**

1. **New Affidavit (Public User)**
   ```
   Title: "New Affidavit Filed"
   Message: "A new {type} affidavit has been filed by {user}. ID: CRMS-{id}"
   Type: info
   ```

2. **New Affidavit (Jurat Staff)**
   ```
   Title: "New Affidavit Filed (Jurat)"
   Message: "A new {type} affidavit has been filed by Jurat staff for {applicant}. ID: CRMS-{id}"
   Type: info
   ```

3. **Affidavit Resubmitted**
   ```
   Title: "Affidavit Updated"
   Message: "Deponent {name} has resubmitted their {type} affidavit. ID: CRMS-{id}"
   Type: info
   ```

4. **Virtual Oath Requested**
   ```
   Title: "Virtual Oath Requested"
   Message: "{name} is waiting for a Virtual Oath session for {type}. ID: CRMS-{id}"
   Type: warning
   ```

## Complete Workflow

### Affidavit Lifecycle

```
1. FILING
   ├─ Public User Files
   │  ├─ status: 'submitted'
   │  ├─ pdf_path: NULL
   │  └─ Notification → CFO role
   │
   └─ Jurat Staff Files for Applicant
      ├─ status: 'submitted'
      ├─ pdf_path: NULL
      ├─ filed_by_staff_id: {jurat_staff_id}
      ├─ Notification → CFO role
      └─ Notification → Filing Jurat staff

2. VIRTUAL OATH (Optional)
   └─ User Requests Virtual Oath
      ├─ virtual_oath_taken: 'requested'
      └─ Notification → CFO role

3. RESUBMISSION (If Rejected)
   └─ User Resubmits
      ├─ status: 'submitted'
      ├─ remarks: NULL (cleared)
      ├─ Notification → CFO role
      └─ Notification → Filing Jurat (if applicable)

4. CFO APPROVAL
   └─ CFO Approves
      ├─ status: 'completed'
      ├─ **PDF GENERATED** ← Only here!
      ├─ pdf_path: '/uploads/affidavits/affidavit_{id}_certified.pdf'
      ├─ Notification → Public user/Applicant
      └─ Notification → Filing Jurat (if applicable)

5. DOWNLOAD
   └─ Anyone Downloads
      ├─ Downloads from pdf_path
      └─ No generation, just file download
```

## Key Points

1. **PDF Path Timeline**
   - Filing: `pdf_path = NULL`
   - Resubmit: `pdf_path = NULL` (still)
   - CFO Approves: `pdf_path = '/uploads/...'` (SET HERE)
   - Download: Uses existing `pdf_path`

2. **Who Gets Notified**
   - **CFO Role**: All affidavit events (filing, resubmit, virtual oath)
   - **Filing Jurat**: Events for affidavits they filed (approval, rejection, resubmit)
   - **Public User**: Their own affidavit events (submission, approval, rejection)

3. **PDF Generation**
   - Only happens when CFO approves
   - Server-side using Puppeteer
   - Includes CFO signature and court stamp
   - Saved to `/uploads/affidavits/`

## Testing Checklist

- [ ] Jurat files affidavit → pdf_path is NULL
- [ ] Public user files affidavit → pdf_path is NULL
- [ ] CFO receives notification for new affidavit
- [ ] User resubmits → CFO receives notification
- [ ] User requests virtual oath → CFO receives notification
- [ ] CFO approves → pdf_path is set to generated PDF
- [ ] Download works after approval
- [ ] Download before approval shows "PDF not generated" error
- [ ] Jurat receives notification when their filed affidavit is approved

## Files Modified

- `server.js` (lines 857-859, 1744-1750) - Removed pdf_path from affidavit filing

## Notes

- No changes needed to notification code (already implemented correctly)
- All CFO notifications already in place from previous updates
- PDF generation logic unchanged (already correct)
- Download endpoint unchanged (already correct)
