# Affidavit Download & PDF Generation Flow

## Summary
Updated the affidavit approval and download system to ensure proper role-based access and PDF generation workflow.

## Implementation Details

### 1. Download Endpoint (`GET /api/affidavits/:id/download`)

**Current Behavior (No Changes Needed):**
- ✅ All users (public and staff) download from the existing `pdf_path`
- ✅ No PDF generation happens on download
- ✅ Simple file download using `res.download()`

**How it works:**
```javascript
// Line 1437-1488 in server.js
app.get('/api/affidavits/:id/download', authenticateToken, (req, res) => {
    // 1. Fetch affidavit from database
    // 2. Check authorization
    // 3. Verify pdf_path exists
    // 4. Download file from path
    res.download(filePath, fileName);
});
```

**Access Control:**
- **Public users**: Can download their own affidavits only
- **Jurat staff**: Can download any affidavit (including ones they filed)
- **CFO staff**: Can download any affidavit
- **Other staff**: Can download any affidavit

### 2. Approval Endpoint (`PUT /api/affidavits/:id/approve`)

**Updated Behavior:**
- ✅ Added role check: **Only CFO can approve/reject**
- ✅ PDF generation happens **only when CFO approves** (status = 'completed')
- ✅ PDF is generated server-side using Puppeteer
- ✅ PDF saved to `/uploads/affidavits/` directory

**How it works:**
```javascript
// Line 1231 in server.js
app.put('/api/affidavits/:id/approve', authenticateToken, logActivity, async (req, res) => {
    // 1. Check if user is CFO (NEW)
    if (req.user.role !== 'cfo') {
        return res.status(403).json({ 
            error: 'Only Chief Filing Officers (CFO) can approve or reject affidavits'
        });
    }

    // 2. Update affidavit status
    db.query(updateSql, ...);

    // 3. If status = 'completed', generate PDF
    if (nextStatus === 'completed') {
        const pdfPath = await generateAffidavitPDF({
            affidavit: affidavitData,
            user: userData,
            cfoStaff: cfoData,
            serverBaseUrl
        });

        // 4. Save PDF path to database
        db.query('UPDATE affidavits SET pdf_path = ? WHERE id = ?', [pdfPath, id]);
    }

    // 5. Send notifications
});
```

## Workflow Examples

### Example 1: Jurat Files Affidavit
1. Jurat staff files affidavit on behalf of applicant
2. Status: `submitted`
3. PDF path: `NULL` (no PDF yet)
4. **Jurat cannot download** (no PDF exists)

### Example 2: CFO Approves Affidavit
1. CFO reviews affidavit
2. CFO clicks "Approve"
3. Status changes to: `completed`
4. **Server generates PDF** with:
   - Affidavit content
   - Applicant details
   - CFO signature
   - Court stamp
5. PDF saved to: `/uploads/affidavits/affidavit_123_certified.pdf`
6. Database updated: `pdf_path = '/uploads/affidavits/affidavit_123_certified.pdf'`
7. Notifications sent to:
   - Applicant (public user or email)
   - Jurat who filed it (if applicable)

### Example 3: Jurat Downloads Approved Affidavit
1. Jurat navigates to affidavit details
2. Clicks "Download PDF"
3. **Server downloads from `pdf_path`** (no generation)
4. File downloaded: `Affidavit_123_Certified.pdf`

### Example 4: Public User Downloads Their Affidavit
1. Public user logs in
2. Views their OADR dashboard
3. Clicks download on approved affidavit
4. **Server downloads from `pdf_path`** (no generation)
5. Same file as Jurat would get

## Role-Based Access Control

### CFO Role
- ✅ Can approve affidavits (triggers PDF generation)
- ✅ Can reject affidavits (no PDF generation)
- ✅ Can download any affidavit
- ✅ PDF generation includes CFO's signature

### Jurat Role
- ❌ **Cannot approve/reject** affidavits
- ✅ Can file affidavits on behalf of applicants
- ✅ Can download any affidavit (from existing PDF)
- ✅ Receives notification when their filed affidavit is approved/rejected

### Registrar/CR/Admin Roles
- ❌ **Cannot approve/reject** affidavits
- ✅ Can view affidavits
- ✅ Can download affidavits (from existing PDF)
- ❌ Cannot trigger PDF generation

### Public Users
- ❌ Cannot approve/reject
- ❌ Cannot file for others
- ✅ Can download **their own** affidavits only
- ✅ File must be approved (pdf_path exists)

## Error Handling

### Error: 403 - Not CFO
**Triggered when:** Non-CFO staff tries to approve
```json
{
  "error": "Only Chief Filing Officers (CFO) can approve or reject affidavits",
  "required_role": "cfo",
  "your_role": "jurat"
}
```

### Error: 404 - PDF Not Generated
**Triggered when:** Trying to download before approval
```json
{
  "error": "PDF not yet generated"
}
```
**Solution:** Wait for CFO to approve the affidavit

### Error: 403 - Access Denied
**Triggered when:** Public user tries to download another user's affidavit
```json
{
  "error": "Access denied"
}
```

## PDF Generation Details

### When PDF is Generated
- **Only once**: When CFO approves (status → 'completed')
- **Never regenerated**: Download uses existing file

### PDF Contains
1. Court header with logo
2. Affidavit type and content
3. Applicant/Deponent information
4. Applicant photo (if available)
5. Date of approval
6. **CFO's name and signature**
7. **Court stamp/seal**

### PDF Saved Location
- Directory: `/uploads/affidavits/`
- Naming: `affidavit_{id}_certified.pdf`
- Example: `/uploads/affidavits/affidavit_42_certified.pdf`

## Benefits

1. **Efficiency**: 
   - PDF generated once, not on every download
   - Reduces server load
   - Faster downloads

2. **Security**:
   - Only CFO can approve (proper authorization)
   - PDF cannot be regenerated to alter signature
   - Original approved PDF preserved

3. **Consistency**:
   - Everyone downloads the same official PDF
   - CFO signature embedded at approval time
   - No variation between downloads

4. **Clarity**:
   - Clear error messages for role violations
   - User knows why they can't perform action
   - Role requirements explicit

## Testing Checklist

- [ ] CFO can approve affidavit → PDF generates
- [ ] CFO can reject affidavit → No PDF generated
- [ ] Jurat cannot approve → Shows clear error
- [ ] Jurat can download approved affidavit
- [ ] Public user can download own affidavit
- [ ] Public user cannot download others' affidavits
- [ ] Download before approval shows "PDF not generated"
- [ ] PDF includes CFO signature and court stamp
- [ ] Same PDF file for all downloads (not regenerated)

## Files Modified
- `server/server.js` - Added CFO role check to approval endpoint
