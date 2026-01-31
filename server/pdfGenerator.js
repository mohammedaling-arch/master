const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * Generates an Affidavit PDF on the server side
 * @param {Object} options - PDF generation options
 * @param {Object} options.affidavit - Affidavit data from database
 * @param {Object} options.user - User/Applicant data
 * @param {Object} options.cfoStaff - CFO staff who approved (with signature_path and name)
 * @param {string} options.serverBaseUrl - Base URL for accessing uploads
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateAffidavitPDF({ affidavit, user, cfoStaff, juratName, serverBaseUrl }) {
    let browser;

    try {
        // 1. Prepare Data
        const today = new Date();
        const getOrdinal = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        const dateStr = `${getOrdinal(today.getDate())} day of ${today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

        const deponentName = `${user.first_name || ''} ${user.surname || ''}`.trim() || "DEPONENT";
        const cfoName = cfoStaff?.name || "COMMISSIONER FOR OATHS";
        const divName = cfoStaff?.division || "MAIDUGURI";

        // Generate QR Code
        const qrUrl = `${serverBaseUrl}/verify/${affidavit.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { margin: 0, width: 150 });

        const safePath = (p) => {
            if (!p) return null;
            const cleanPath = p.startsWith('/') || p.startsWith('\\') ? p.substring(1) : p;
            return path.join(__dirname, cleanPath);
        };

        const coatOfArmsPath = path.join(__dirname, '../client/public/assets/coat_of_arms.png');
        const profilePicPath = safePath(user.profile_pic);
        const deponentSignaturePath = safePath(user.signature_path);
        const cfoSignaturePath = safePath(cfoStaff?.signature_path);

        // Convert images to base64
        const getBase64 = async (filePath) => {
            if (!filePath) return null;
            try {
                const data = await fs.readFile(filePath);
                return `data:image/png;base64,${data.toString('base64')}`;
            } catch (err) {
                console.error(`Failed to load image: ${filePath}`, err);
                return null;
            }
        };

        const [coatOfArmsBase64, profilePicBase64, deponentSignatureBase64, cfoSignatureBase64] = await Promise.all([
            getBase64(coatOfArmsPath),
            getBase64(profilePicPath),
            getBase64(deponentSignaturePath),
            getBase64(cfoSignaturePath)
        ]);

        // 2. Create HTML Content
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 10mm 20mm 10mm 20mm;
        }
        body {
            font-family: Calibri, 'Segoe UI', Arial, sans-serif;
            color: #000;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h2 {
            font-size: 16px; 
            text-align: center; 
            margin: 0; 
            padding: 0;
            font-style: italic;
            text-transform: uppercase;
        }
        h3 {
            font-size: 16px; 
            text-align: center; 
            margin: 5px 0 20px;
            font-style: italic;
            text-transform: uppercase;
        }
        .header {
            position: relative;
            text-align: center;
            margin-bottom: 20px;
            min-height: 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .profile-pic {
            position: absolute;
            left: 0;
            top: 0;
            width: 80px;
            height: 95px;
            object-fit: cover;
            border: 1px solid #000;
            padding: 2px;
        }
        .coat-of-arms {
            width: 80px;
            height: auto;
            margin-bottom: 10px;
        }
        .content-box {
            font-size: 13px;
            font-family: Calibri, 'Segoe UI', Arial, sans-serif;
            text-align: justify;
            min-height: 300px;
            margin: 10px;
            margin-bottom: 20px;
            overflow-wrap: break-word;
        }
        .content-box p, .content-box span, .content-box div {
            font-family: Calibri, 'Segoe UI', Arial, sans-serif;
            margin-bottom: 15px;
            font-size: 13px;
        }
        .deponent-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 20px;
        }
        .translation-caption {
            font-size: 11px;
            font-style: italic;
            max-width: 350px;
            text-align: left;
            margin-bottom: 10px;
        }
        .deponent-box {
            text-align: center;
            width: 250px;
        }
        .deponent-line {
            border-bottom: 2px solid #000;
            margin-bottom: 5px;
        }
        .deponent-name {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 14px;
        }
        .sworn-label {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
        }
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end; /* Keep grounded but child is centered */
            min-height: 180px;
            border-top: 1px solid #000;
            padding-top: 15px;
            position: relative;
        }
        .date-qr-section {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            gap: 10px;
        }
        .qr-container {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .qr-code {
            width: 80px;
            height: 80px;
        }
        .commissioner-section {
            text-align: center;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center; /* Center horizontally */
            justify-content: center; /* Center vertically if section has fixed height */
            width: 300px;
        }
        .oval-stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            width: 160px;
            height: 80px;
            border: 4px solid #1e3a8a;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            background: transparent !important;
            padding: 4px;
            pointer-events: none;
            opacity: 0.8;
        }
        .stamp-inner {
            width: 100%;
            height: 100%;
            border: 2px solid #1e3a8a;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            background: transparent !important;
        }
        .commissioner-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .cfo-signature {
            height: 65px;
            width: auto;
            max-width: 250px;
            filter: contrast(1.1);
            margin: 2px auto;
            display: block;
        }
        .signature-line {
            height: 60px;
            border-bottom: 2px solid #000;
            width: 250px;
            margin: 5px auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${profilePicBase64 ? `<img src="${profilePicBase64}" class="profile-pic" />` : ''}
            ${coatOfArmsBase64 ? `<img src="${coatOfArmsBase64}" class="coat-of-arms" />` : ''}
            <h2>IN THE HIGH COURT OF JUSTICE&nbsp;&nbsp;BORNO STATE&nbsp;&nbsp;OF NIGERIA</h2>
            <h3>IN THE ${divName} JUDICIAL DIVISION</h3>
        </div>

        <div class="content-box">
            ${affidavit.content || '<p style="text-align:center; font-style:italic;">[No content provided]</p>'}
        </div>

        <div class="deponent-section">
            <div class="translation-caption">
                ${affidavit.language ? `This affidavit was translated from English to ${affidavit.language} by me: ${juratName || 'JURAT STAFF'} to the Deponent and have understood its contents.` : ''}
            </div>
            <div class="deponent-box">
                ${deponentSignatureBase64 ? `
                <img src="${deponentSignatureBase64}" style="height: 50px; width: auto; max-width: 200px; filter: contrast(1.1); margin-bottom: 2px;" />
                ` : ''}
                <div class="deponent-line"></div>
                <div class="deponent-name">${deponentName}</div>
                <div>DEPONENT</div>
            </div>
        </div>

        <div class="sworn-label">
            Sworn to at High Court of Justice ${divName} 
        </div>

        <div class="footer">
            <div class="date-qr-section">
                <div style="font-size: 14px;">
                    <strong>DATED THIS:</strong> ${dateStr}
                </div>
                <div class="qr-container">
                    <img src="${qrCodeDataUrl}" class="qr-code" />
                    <div>
                        <div style="font-size: 12px; font-weight: bold; font-family: monospace;">UUID: CRMS-${affidavit.id}</div>
                        <div style="font-size: 11px; color: #333;">Digitally Signed & Validated</div>
                    </div>
                </div>
            </div>

            <div class="oval-stamp">
                <div class="stamp-inner">
                    <div style="font-size: 14px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; font-weight: 900;">HIGH COURT OF</div>
                    <div style="font-size: 14px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; font-weight: 900;">JUSTICE</div>
                    <div style="font-size: 10px; margin-bottom: 1px; text-transform: uppercase; color: #1e3a8a; font-weight: 800; letter-spacing: 0.3px;">COMMISSIONER FOR OATHS</div>
                    <div style="font-size: 14px; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px; font-weight: 900;">OADR REGISTRY</div>
                </div>
            </div>

            <div class="commissioner-section">
                <div class="commissioner-content">
                    <div style="font-size: 14px; margin-bottom: 2px; font-weight: bold;">BEFORE ME:</div>
                    ${cfoSignatureBase64 ? `<img src="${cfoSignatureBase64}" class="cfo-signature" />` : '<div class="signature-line"></div>'}
                    <div style="font-weight: bold; font-size: 14px; text-transform: uppercase; margin-top: 2px;">${cfoName}</div>
                    <div style="font-size: 14px; font-weight: bold; margin-top: 2px;">COMMISSIONER FOR OATHS</div>
                    <div style="font-size: 8px; color: #eee; margin-top: 5px;">v2.0.7-certified</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const outputDir = path.join(__dirname, 'uploads/affidavits');
        await fs.mkdir(outputDir, { recursive: true });

        const fileName = `affidavit-${affidavit.id}-${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, fileName);

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '20mm',
                bottom: '10mm',
                left: '20mm'
            }
        });

        await browser.close();
        console.log(`[CERTIFICATION] New PDF compiled (v2.0.5): ${fileName}`);
        return `/uploads/affidavits/${fileName}`;

    } catch (error) {
        if (browser) await browser.close();
        console.error('[PDF Generation Error Details]:', error);
        throw error;
    }
}

const GENERATOR_VERSION = "2.0.7-certified";

/**
 * Generates a Probate Letter of Administration PDF
 * @param {Object} options 
 * @returns {Promise<string>}
 */
async function generateProbateLetterPDF({ application, user, serverBaseUrl }) {
    let browser;
    try {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        const deceasedName = (application.deceased_title ? application.deceased_title + ' ' : '') + application.deceased_name;
        const deceasedDate = new Date(application.date_of_death).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        const qrUrl = `${serverBaseUrl}/verify/probate/${application.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { margin: 0, width: 120 });

        const coatOfArmsPath = path.join(__dirname, '../client/public/assets/coat_of_arms.png');

        const getBase64 = async (filePath) => {
            if (!filePath) return null;
            try {
                const data = await fs.readFile(filePath);
                return `data:image/png;base64,${data.toString('base64')}`;
            } catch (err) {
                console.error(`Failed to load image: ${filePath}`, err);
                return null;
            }
        };

        const coatOfArmsBase64 = await getBase64(coatOfArmsPath);

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #000; }
        .header { text-align: center; margin-bottom: 40px; }
        .coat-of-arms { width: 100px; height: auto; margin-bottom: 15px; }
        .court-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
        .sub-title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 30px; }
        .doc-title { font-size: 22px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; text-transform: uppercase; }
        .content { font-size: 14px; text-align: justify; margin-bottom: 50px; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature-section { text-align: center; width: 200px; }
        .signature-line { border-top: 1px solid #000; margin-top: 50px; margin-bottom: 5px; }
        .qr-section { text-align: right; }
        .ref-number { font-family: monospace; font-size: 12px; margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header">
        ${coatOfArmsBase64 ? `<img src="${coatOfArmsBase64}" class="coat-of-arms" />` : ''}
        <div class="court-title">IN THE HIGH COURT OF JUSTICE</div>
        <div class="court-title">BORNO STATE OF NIGERIA</div>
        <div class="sub-title">PROBATE DIVISION</div>
        
        <div class="doc-title">LETTER OF ADMINISTRATION</div>
        <div class="ref-number">SUIT NO: PRB/${application.id}/${today.getFullYear()}</div>
    </div>

    <div class="content">
        <p><strong>BE IT KNOWN</strong> that on the <strong>${deceasedDate}</strong>, <strong>${deceasedName}</strong>, late of <strong>${application.address || 'Maiduguri'}</strong>, died intestate.</p>

        <p>AND BE IT FURTHER KNOWN that on the <strong>${dateStr}</strong>, Letters of Administration of all the real and personal estate of the said deceased were granted by the High Court of Justice of Borno State to:</p>

        <p style="text-align: center; font-weight: bold; margin: 20px 0; font-size: 16px;">
            ${user.first_name} ${user.surname}
        </p>

        <p>who has been duly sworn to administer the estate of the said deceased according to law, and to render a just and true account of the administration whenever required by law to do so.</p>
    </div>

    <div class="footer">
        <div class="qr-section">
            <img src="${qrCodeDataUrl}" width="100" />
            <div style="font-size: 10px;">Valid: ${application.id}</div>
        </div>
        
        <div class="signature-section">
            <div class="signature-line"></div>
            <strong>CHIEF REGISTRAR</strong><br>
            Probate Division<br>
            High Court of Justice
        </div>
    </div>
</body>
</html>
        `;

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const outputDir = path.join(__dirname, 'uploads/probate_letters');
        await fs.mkdir(outputDir, { recursive: true });

        const fileName = `probate_letter_${application.id}_${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, fileName);

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        await browser.close();
        return `/uploads/probate_letters/${fileName}`;

    } catch (error) {
        if (browser) await browser.close();
        console.error('Probate Letter Generation Error:', error);
        throw error;
    }
}

/**
 * Generates a merged "Prayers" PDF for a probate application
 * @param {Object} options 
 * @returns {Promise<string>}
 */
async function generateProbatePrayersPDF({ application, serverBaseUrl, stampPath }) {
    let browser;
    try {
        const beneficiaries = application.beneficiaries || [];
        const applicantName = `${application.applicant_first_name || ''} ${application.applicant_surname || ''}`.trim();

        // 1. Generate Header Page with Puppeteer
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.5; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; padding-bottom: 5px; text-transform: uppercase; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
        .info-item { display: flex; flex-direction: column; }
        .label { font-weight: bold; color: #64748b; font-size: 11px; text-transform: uppercase; }
        .value { color: #1e293b; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f8fafc; text-align: left; padding: 8px; font-size: 11px; color: #64748b; text-transform: uppercase; border: 1px solid #e2e8f0; }
        td { padding: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Probate Prayers Attachment</div>
        <div class="subtitle">Summary of Application PRB-${application.id}</div>
    </div>

    <div class="section">
        <div class="section-title">Deceased Information</div>
        <div class="info-grid">
            <div class="info-item"><span class="label">Full Name</span><span class="value" style="text-transform: uppercase;">${application.deceased_name}</span></div>
            <div class="info-item"><span class="label">Date of Death</span><span class="value">${new Date(application.date_of_death).toLocaleDateString()}</span></div>
            <div class="info-item"><span class="label">Occupation</span><span class="value">${application.occupation}</span></div>
            <div class="info-item"><span class="label">Place of Death</span><span class="value">${application.death_location_address || 'Not Specified'}</span></div>
            <div class="info-item"><span class="label">Employer</span><span class="value">${application.employer_name || 'N/A'}</span></div>
            <div class="info-item" style="grid-column: span 2;"><span class="label">Home Address</span><span class="value">${application.home_address}</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Applicant / Next of Kin</div>
        <div class="info-grid">
            <div class="info-item"><span class="label">Name</span><span class="value" style="text-transform: uppercase;">${applicantName}</span></div>
            <div class="info-item"><span class="label">Relationship</span><span class="value">${application.relationship_to_nok}</span></div>
            <div class="info-item"><span class="label">Gender / Age</span><span class="value">${application.applicant_gender || 'N/A'} / ${application.applicant_age || 'N/A'} Years</span></div>
            <div class="info-item"><span class="label">NIN Number</span><span class="value">${application.applicant_nin || 'N/A'}</span></div>
            <div class="info-item"><span class="label">Phone</span><span class="value">${application.applicant_phone || application.phone || 'N/A'}</span></div>
            <div class="info-item"><span class="label">Address</span><span class="value">${application.applicant_address || application.address || 'N/A'}</span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Beneficiaries List</div>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Relationship</th>
                    <th>Age/Gender</th>
                    <th>Contact</th>
                </tr>
            </thead>
            <tbody>
                ${beneficiaries.map(b => `
                    <tr>
                        <td>${b.name}</td>
                        <td>${b.relationship}</td>
                        <td>${b.age}Y / ${b.gender}</td>
                        <td>${b.phone || 'N/A'}</td>
                    </tr>
                `).join('')}
                ${beneficiaries.length === 0 ? '<tr><td colspan="4" style="text-align:center">No beneficiaries listed</td></tr>' : ''}
            </tbody>
        </table>
    </div>

    <div style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center;">
        Generated on ${new Date().toLocaleString()} • CRMS Probate Division
    </div>
</body>
</html>`;

        browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const headerPdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

        // 2. Prepare for Merging
        const mergedPdf = await PDFDocument.create();

        // Add Header Page
        const headerDoc = await PDFDocument.load(headerPdfBuffer);
        const [headerPage] = await mergedPdf.copyPages(headerDoc, [0]);
        mergedPdf.addPage(headerPage);

        // 3. Process Attached Documents
        for (const doc of (application.documents || [])) {
            const filePath = path.join(__dirname, doc.document_path);
            if (!await fs.access(filePath).then(() => true).catch(() => false)) continue;

            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.pdf') {
                const docBuffer = await fs.readFile(filePath);
                const pdfToMerge = await PDFDocument.load(docBuffer).catch(e => {
                    console.error("Failed to load PDF:", filePath, e);
                    return null;
                });
                if (pdfToMerge) {
                    const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
                    pages.forEach(p => mergedPdf.addPage(p));
                }
            } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                // Wrap image in a PDF page using Puppeteer
                const imgBase64 = `data:image/${ext.substring(1)};base64,${(await fs.readFile(filePath)).toString('base64')}`;
                await page.setContent(`<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${imgBase64}" style="max-width:100%;max-height:100%;object-fit:contain;"/></body></html>`);
                const imgPdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
                const imgDoc = await PDFDocument.load(imgPdfBuffer);
                const [imgPage] = await mergedPdf.copyPages(imgDoc, [0]);
                mergedPdf.addPage(imgPage);
            }
        }

        await browser.close();
        browser = null;

        // 4. Add Stamp to EVERY page
        if (stampPath) {
            const fullStampPath = path.join(__dirname, stampPath);
            if (await fs.access(fullStampPath).then(() => true).catch(() => false)) {
                const stampBuffer = await fs.readFile(fullStampPath);
                const stampImg = await mergedPdf.embedPng(stampBuffer).catch(() => mergedPdf.embedJpg(stampBuffer));

                const pages = mergedPdf.getPages();
                for (const p of pages) {
                    const { width, height } = p.getSize();
                    const stampWidth = 120;
                    const stampHeight = (stampImg.height / stampImg.width) * stampWidth;

                    p.drawImage(stampImg, {
                        x: width - stampWidth - 30,
                        y: 30,
                        width: stampWidth,
                        height: stampHeight,
                        opacity: 0.8
                    });
                }
            }
        }

        // 5. Save and Return
        const outputDir = path.join(__dirname, 'uploads/probate_prayers');
        await fs.mkdir(outputDir, { recursive: true });
        const fileName = `prayers_${application.id}_${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, fileName);

        const finalPdfBytes = await mergedPdf.save();
        await fs.writeFile(outputPath, finalPdfBytes);

        return `/uploads/probate_prayers/${fileName}`;

    } catch (error) {
        if (browser) await browser.close();
        console.error('Probate Prayers Generation Error:', error);
        throw error;
    }
}

module.exports = { generateAffidavitPDF, generateProbateLetterPDF, generateProbatePrayersPDF, GENERATOR_VERSION };
