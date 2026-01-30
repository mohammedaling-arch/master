# Affidavit PDF Generation Enhancement

## Overview
Enhanced the CRMS system to automatically generate professional affidavit PDFs with CFO signature and court stamp when affidavits are approved.

## Changes Made

### 1. Client-Side PDF Generator (`client/src/utils/pdfGenerator.js`)
**Updated Footer Design:**
- Added oval-shaped stamp overlay at footer center
- Stamp contains: "HIGH COURT OF JUSTICE", "COMM FOR OATHS", "OADR REGISTRY"
- Stamp is rotated -15 degrees with semi-transparent overlay effect
- Footer includes:
  - "BEFORE ME:" label
  - CFO signature (uploaded image)
  - CFO name (logged-in staff)
  - "COMMISSIONER FOR OATHS" text
  - Oval stamp overlapping all content

### 2. Server-Side PDF Generator (`server/pdfGenerator.js`)
**New Module Created:**
- Uses Puppeteer for server-side PDF generation
- Generates high-quality A4 PDFs with proper formatting
- Includes:
  - Court header with coat of arms
  - Deponent profile picture
  - Affidavit content
  - Deponent signature section
  - Footer with date, QR code, CFO signature, and oval stamp
- Saves PDFs to `server/uploads/affidavits/` directory

### 3. Server Approval Endpoint (`server/index.js`)
**Enhanced `/api/affidavits/:id/approve` endpoint:**
- Now async to support PDF generation
- When status is set to 'completed':
  1. Fetches complete affidavit data with user and CFO info
  2. Calls server-side PDF generator
  3. Saves PDF path to database
  4. Sends email notification to user
- Gracefully handles PDF generation failures (doesn't block approval)

### 4. Download Endpoint (`server/index.js`)
**New `/api/affidavits/:id/download` endpoint:**
- Allows authenticated users to download their completed affidavits
- Staff can download any affidavit
- Public users can only download their own affidavits
- Returns PDF file with proper filename

### 5. Environment Configuration (`server/.env`)
**Added:**
- `SERVER_BASE_URL=http://localhost:5000` - Used for generating absolute URLs in PDFs

## Dependencies Required

### Server Dependencies (to be installed):
```bash
npm install puppeteer qrcode
```

**Note:** Puppeteer is a large package (~300MB) and may take several minutes to install.

## PDF Features

### Visual Elements:
1. **Header:**
   - Coat of arms
   - Deponent profile picture (if available)
   - Court name and division

2. **Content:**
   - Rich text affidavit content
   - Proper formatting with Times New Roman font

3. **Footer:**
   - Date in ordinal format (e.g., "15th day of January, 2026")
   - QR code for verification
   - UUID reference number
   - CFO signature image
   - CFO name
   - Oval stamp overlay with court details

### Stamp Design:
- Shape: Oval (200px × 140px)
- Border: 4px solid blue (#1e3a8a)
- Rotation: -15 degrees
- Opacity: 0.75 for overlay effect
- Text: 
  - "HIGH COURT OF JUSTICE"
  - "COMM FOR OATHS" (in red)
  - "OADR REGISTRY"

## Usage Flow

### For Public Users:
1. File affidavit through OADR portal
2. Complete payment
3. Attend virtual oath session (if required)
4. CFO approves affidavit
5. **PDF is automatically generated** with CFO signature and stamp
6. User receives email notification
7. User can download PDF from their dashboard

### For Jurat Staff:
1. File affidavit on behalf of applicant
2. CFO approves affidavit
3. **PDF is automatically generated** with CFO signature and stamp
4. Staff can download PDF for applicant

### For CFO Staff:
1. Review pending affidavits
2. Click "Approve" to mark as completed
3. **System automatically generates PDF** with CFO's signature
4. PDF is saved to database
5. User/applicant is notified

## API Endpoints

### Download Affidavit PDF
```
GET /api/affidavits/:id/download
Authorization: Bearer <token>
```

**Response:**
- Success: PDF file download
- Error 404: PDF not yet generated or affidavit not found
- Error 403: Access denied (not authorized to download)

## File Structure
```
server/
├── pdfGenerator.js          # Server-side PDF generation module
├── uploads/
│   └── affidavits/          # Generated PDF storage
│       └── affidavit-{id}-{timestamp}.pdf
└── index.js                 # Updated approval and download endpoints

client/
└── src/
    └── utils/
        └── pdfGenerator.js  # Client-side PDF generator (updated footer)
```

## Testing Checklist

- [ ] Install puppeteer and qrcode packages
- [ ] Restart server to load new environment variables
- [ ] Create test affidavit
- [ ] Approve affidavit as CFO
- [ ] Verify PDF is generated in `server/uploads/affidavits/`
- [ ] Verify PDF path is saved in database
- [ ] Download PDF via API endpoint
- [ ] Verify PDF contains:
  - [ ] CFO signature
  - [ ] CFO name
  - [ ] Oval stamp overlay
  - [ ] All text is readable
  - [ ] Stamp overlaps footer content correctly

## Known Limitations

1. **Puppeteer Installation:** Large download size (~300MB)
2. **Server Resources:** PDF generation requires headless Chrome
3. **Image Paths:** Requires proper file paths for signatures and profile pictures
4. **Async Processing:** PDF generation adds ~2-5 seconds to approval process

## Future Enhancements

1. Add background job queue for PDF generation
2. Implement PDF regeneration endpoint for failed generations
3. Add PDF preview before download
4. Support custom stamp images from settings
5. Add watermark for draft/pending affidavits
