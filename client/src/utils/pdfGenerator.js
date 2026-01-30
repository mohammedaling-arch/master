import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Client-side PDF Generator v2.0.51

export const generateAffidavitPDF = async ({ user, applicationId, templateTitle, content, cfoStaff, juratName, isDraft = false }) => {
    try {
        const container = document.createElement('div');
        container.id = 'pdf-export-container';
        container.style.width = '900px';
        container.style.padding = '20px';
        container.style.backgroundColor = '#ffffff';
        container.style.fontFamily = "Calibri, Arial, sans-serif";
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';

        const serverBaseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '') || window.location.origin;

        // Use COALESCE logic for signature
        const finalSignerName = cfoStaff?.name || "COMMISSIONER FOR OATHS";
        const finalDivision = cfoStaff?.division || "MAIDUGURI";

        const getBase64FromUrl = async (url) => {
            if (!url) return null;
            try {
                const response = await fetch(url.startsWith('http') ? url : `${serverBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.error("Image load failed:", url, err);
                return null;
            }
        };

        const coatOfArmsBase64 = await getBase64FromUrl('/assets/coat_of_arms.png');
        const profilePicBase64 = await getBase64FromUrl(user?.profile_pic || user?.picture_path);
        const deponentSignatureBase64 = await getBase64FromUrl(user?.signature_path);
        const signatureBase64 = await getBase64FromUrl(cfoStaff?.signature_path);

        const today = new Date();
        const getOrdinal = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        const dateStr = `${getOrdinal(today.getDate())} day of ${today.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

        container.innerHTML = `
            <style>
                #pdf-export-body { 
                    color: #000; 
                    line-height: 1.2;
                    font-family: Calibri, Arial, sans-serif;
                }
                #pdf-export-body h2 { 
                    font-size: 16px; 
                    text-align: center; 
                    margin: 0; 
                    padding: 0;
                    font-style: italic;
                    text-transform: uppercase;
                }
                #pdf-export-body h3 { 
                    font-size: 16px; 
                    text-align: center; 
                    margin: 5px 0 20px;
                    font-style: italic;
                    text-transform: uppercase;
                }
                .content-box { 
                    font-size: 13px; 
                     font-family: Calibri, 'Segoe UI', Arial, sans-serif;
                    text-align: justify;
                    min-height: 300px;
                    margin-bottom: 20px;
                    overflow-wrap: break-word;
                }
                .content-box p, .content-box span, .content-box div {
                    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
                    margin-bottom: 15px; 
                }

                .official-stamp-box {
                    position: absolute;
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%) rotate(-15deg);
                    width: 170px; 
                    height: 100px; 
                    border: 4px solid #1e3a8a; 
                    border-radius: 8px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    z-index: 5;
                    opacity: 0.9;
                    pointer-events: none;
                }
                .stamp-inner {
                    width: 100%;
                    height: 100vh;
                    border: 2px solid #1e3a8a;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
            </style>
            <div id="pdf-export-body" style="padding: 40px; background: white;">
                <!-- Court Header -->
                <div style="position: relative; text-align: center; margin-bottom: 20px; min-height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    ${profilePicBase64 ? `
                    <div style="position: absolute; left: 0; top: 0; z-index: 10;">
                        <img src="${profilePicBase64}" style="width: 80px; height: 95px; object-fit: cover; border: 1px solid #000; padding: 2px;" />
                    </div>
                    ` : ''}
                    
                    <img src="${coatOfArmsBase64}" style="width: 80px; height: auto; margin-bottom: 10px;" />
                    <h2>IN THE HIGH COURT OF JUSTICE&nbsp;&nbsp;BORNO STATE&nbsp;&nbsp;OF NIGERIA</h2>
                    <h3>IN THE ${finalDivision} JUDICIAL DIVISION</h3>
                </div>

                <!-- Main Content Area -->
                <div class="content-box">
                    ${content || '<p style="text-align:center; font-style:italic;">[No content provided]</p>'}
                </div>

                <!-- Deponent Selection -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px;">
                    <div style="font-size: 11px; font-style: italic; max-width: 350px; text-align: left; margin-bottom: 10px;">
                        ${juratName ? `This affidavit was translated from English to ${user.language || 'Local Language'} by me: ${juratName} to the Deponent and have understood its contents.` : ''}
                    </div>
                    <div style="text-align: center; width: 250px;">
                        ${deponentSignatureBase64 ? `
                        <img src="${deponentSignatureBase64}" style="height: 50px; width: auto; max-width: 200px; filter: contrast(1.1); margin-bottom: 2px;" />
                        ` : ''}
                        <div style="border-bottom: 2px solid #000; margin-bottom: 5px;"></div>
                        <div style="font-weight: bold; text-transform: uppercase; font-size: 14px;">${user.first_name || ''} ${user.surname || ''}</div>
                        <div style="font-size: 14px;">DEPONENT</div>
                    </div>
                </div>

                <!-- Sworn Label -->
                <div style="text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase;">
                    Sworn to at High Court of Justice ${finalDivision}
                </div>

                <!-- Footer Section -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; min-height: 200px; border-top: 1px solid #000; padding-top: 20px; position: relative;">
                    <!-- Date and QR -->
                    <div style="display: flex; flex-direction: column; justify-content: flex-end; gap: 10px;">
                        <div style="font-size: 14px;">
                            <strong>DATED THIS:</strong> ${dateStr}
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div id="qr-placeholder" style="width: 80px; height: 80px; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666; border: 1px solid #ddd;">
                                QR CODE
                            </div>
                            <div>
                                <div style="font-size: 12px; font-weight: bold; font-family: monospace;">UUID: CRMS-${applicationId}</div>
                                <div style="font-size: 11px; color: #666;">Digitally Signed & Validated</div>
                            </div>
                        </div>
                    </div>

                    <!-- Rectangular Stamp Overlay -->
                    <div class="official-stamp-box">
                        <div class="stamp-inner" style="border: none; background: transparent; height: auto;">
                            <div style="font-size: 14px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; font-weight: 900;">HIGH COURT OF</div>
                            <div style="font-size: 14px; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; font-weight: 900;">JUSTICE</div>
                            <div style="font-size: 12px; margin-bottom: 1px; text-transform: uppercase; color: #1e3a8a; font-weight: 800; letter-spacing: 0.3px;">COMMISSIONER FOR OATHS</div>
                           <div style="font-size: 14px; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px; font-weight: 900;">OADR REGISTRY</div>
                        </div>
                    </div>

                    <!-- Commissioner Side -->
                    <div style="text-align: center; position: relative; display: flex; flex-direction: column; align-items: center;">
                        <!-- Content Below Stamp -->
                        <div style="position: relative; z-index: 2;">
                            <div style="font-size: 14px; margin-bottom: 8px; font-weight: bold;">BEFORE ME:</div>
                            
                            ${signatureBase64 ? `
                            <img src="${signatureBase64}" style="height: 60px; width: auto; max-width: 250px; filter: contrast(1.1); margin: 5px auto; display: block;" />
                            ` : `
                            <div style="height: 60px; width: 250px; margin: 5px auto; border-bottom: 2px solid #000;"></div>
                            `}
                            
                            <div style="font-weight: bold; font-size: 14px; text-transform: uppercase; margin-top: 8px;">${finalSignerName}</div>
                            
                            <div style="font-size: 14px; font-weight: bold; margin-top: 3px;">COMMISSIONER FOR OATHS</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const marginLeft = 20;
        const marginRight = 20;
        const marginTop = 10;
        const marginBottom = 10;

        const targetWidth = pdfWidth - marginLeft - marginRight;
        const targetHeight = (canvas.height * targetWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', marginLeft, marginTop, targetWidth, targetHeight);

        if (isDraft) {
            pdf.setTextColor(200, 200, 200);
            pdf.setFontSize(60);
            pdf.save(`Affidavit_${applicationId}_Draft.pdf`);
        } else {
            pdf.save(`Affidavit_${applicationId}_Certified.pdf`);
        }

        document.body.removeChild(container);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
};

export const generatePaymentReceiptPDF = async ({ user, payment }) => {
    try {
        const container = document.createElement('div');
        container.style.width = '800px';
        container.style.padding = '40px';
        container.style.backgroundColor = '#ffffff';
        container.style.fontFamily = "Calibri, Arial, sans-serif";
        container.style.position = 'absolute';
        container.style.left = '-9999px';

        const serverBaseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '') || window.location.origin;

        const getBase64FromUrl = async (url) => {
            if (!url) return null;
            try {
                const response = await fetch(url.startsWith('http') ? url : `${serverBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                return null;
            }
        };

        const coatOfArmsBase64 = await getBase64FromUrl('/assets/coat_of_arms.png');

        container.innerHTML = `
            <div style="border: 2px solid rgb\(18 37 74\); padding: 30px; position: relative;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${coatOfArmsBase64}" style="width: 80px; height: auto; margin-bottom: 10px;" />
                    <h2 style="margin: 0; color: rgb\(18 37 74\); text-transform: uppercase; font-size: 20px;">High Court of Justice</h2>
                    <h3 style="margin: 5px 0; color: #778eaeff; font-size: 16px;">Official Payment Receipt</h3>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">
                    <div>
                        <p style="margin: 0; color: #778eaeff; font-size: 12px;">PAYER / NEXT OF KIN:</p>
                        <h4 style="margin: 5px 0; font-size: 16px;">${user.applicant_first_name || user.first_name || ''} ${user.applicant_surname || user.surname || ''}</h4>
                        <p style="margin: 0; font-size: 13px;">${user.applicant_email || user.email || ''}</p>
                        <p style="margin: 0; font-size: 13px;">${user.applicant_phone || user.phone || ''}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; color: #778eaeff; font-size: 12px;">RECEIPT DETAILS:</p>
                        <p style="margin: 5px 0; font-weight: bold; color: rgb\(18 37 74\);">REF: ${payment.transaction_id || 'N/A'}</p>
                        <p style="margin: 0; font-size: 13px;">Date: ${new Date(payment.payment_date).toLocaleDateString()}</p>
                        <p style="margin: 0; font-size: 13px;">Status: <span style="color: #10b981; font-weight: bold;">${payment.payment_status?.toUpperCase()}</span></p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 12px; text-align: left; font-size: 13px;">Description</th>
                            <th style="padding: 12px; text-align: right; font-size: 13px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                                <div style="font-weight: bold;">${payment.item_paid}</div>
                                <div style="font-size: 11px; color: #778eaeff;">${payment.affidavit_title || payment.deceased_name || 'CRMS Digital Service'}</div>
                            </td>
                            <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">
                                ₦${parseFloat(payment.amount).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 15px; text-align: right; font-weight: bold;">Total Paid</td>
                            <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: rgb\(18 37 74\);">
                                ₦${parseFloat(payment.amount).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">This is a computer-generated receipt and requires no physical signature.</p>
                    <p style="margin: 5px 0 0; font-size: 10px; color: #cbd5e1;">CRMS - Borno State Judiciary Digital Services</p>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
        pdf.save(`Receipt_${payment.transaction_id}.pdf`);

        document.body.removeChild(container);
    } catch (error) {
        console.error("Receipt PDF Error:", error);
    }
};

export const generateBankRequestLetterPDF = async ({ application, bankInfo }) => {
    console.log("[PDF] Generating Bank Request Letter...", { application, bankInfo });
    if (!application || !bankInfo) {
        console.error("[PDF] Missing required data for letter generation");
        return;
    }
    try {
        const container = document.createElement('div');
        container.style.width = '800px';
        container.style.padding = '60px';
        container.style.backgroundColor = '#ffffff';
        container.style.fontFamily = "Times New Roman, Times, serif";
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.color = '#000';

        const serverBaseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '') || window.location.origin;
        const getBase64FromUrl = async (url) => {
            if (!url) return null;
            try {
                const response = await fetch(url.startsWith('http') ? url : `${serverBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (err) { return null; }
        };

        const coatOfArmsBase64 = await getBase64FromUrl('/assets/coat_of_arms.png');
        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        container.innerHTML = `
            <div style="line-height: 1.6; font-size: 16px;">
                <!-- Official Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="${coatOfArmsBase64}" style="width: 100px; height: auto; margin-bottom: 10px;" />
                    <h2 style="margin: 0; font-size: 22px; text-transform: uppercase;">Borno State Judiciary</h2>
                    <h3 style="margin: 5px 0; font-size: 20px; text-transform: uppercase;">High Court of Justice</h3>
                    <h4 style="margin: 5px 0; font-size: 18px; border-bottom: 2px solid #000; display: inline-block; padding-bottom: 5px;">PROBATE REGISTRY, MAIDUGURI</h4>
                </div>

                <!-- References & Date -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                    <div>Our Ref: <b>BSHC/PR/ADM/${application.id}/${new Date().getFullYear()}</b></div>
                    <div>Date: <b>${today}</b></div>
                </div>

                <!-- Recipient -->
                <div style="margin-bottom: 30px;">
                    <p style="margin: 0;"><b>The Manager,</b></p>
                    <p style="margin: 0;"><b>${bankInfo.bank_name},</b></p>
                    <p style="margin: 0;"><b>Maiduguri Branch, Borno State.</b></p>
                </div>

                <p style="margin-bottom: 30px;">Sir/Madam,</p>

                <!-- Subject -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h3 style="text-transform: uppercase; text-decoration: underline; line-height: 1.4; margin: 0;">
                        REQUEST FOR BANK BALANCE IN RESPECT OF THE ESTATE OF <br/>
                        ${application.deceased_name.toUpperCase()} (DECEASED)
                    </h3>
                </div>

                <!-- Body -->
                <p style="text-align: justify; margin-bottom: 20px;">
                    The above subject matter refers, please.
                </p>
                
                <p style="text-align: justify; margin-bottom: 20px;">
                    I am directed to inform you that the above named person died on the <b>${new Date(application.date_of_death).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</b> and an application for the grant of Letter of Administration has been filed at this Registry.
                </p>

                <p style="text-align: justify; margin-bottom: 20px;">
                    Information reached this Registry that the Deceased maintained an account with your bank with the following details:
                </p>

                <div style="margin-left: 40px; margin-bottom: 30px;">
                    <p style="margin: 5px 0;">ACCOUNT NAME: <b>${bankInfo.bank_account_name.toUpperCase()}</b></p>
                    <p style="margin: 5px 0;">ACCOUNT NUMBER: <b>${bankInfo.bank_account}</b></p>
                </div>

                <p style="text-align: justify; margin-bottom: 40px;">
                    Consequently, you are requested to furnish this Registry with the <b>Current Balance</b> standing in the said account to enable us process the application accordingly.
                </p>

                <p style="margin-bottom: 60px;">Accept the assurances of the Probate Registrar, please.</p>

                <!-- Closing -->
                <div style="text-align: right; margin-right: 50px;">
                    <div style="height: 60px;"></div>
                    <p style="margin: 0; border-top: 1px solid #000; display: inline-block; padding-top: 5px;">
                        <b>FOR: PROBATE REGISTRAR</b>
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
        pdf.save(`Bank_Request_${bankInfo.bank_account}.pdf`);
        document.body.removeChild(container);
    } catch (error) {
        console.error("Bank Request Letter PDF Error:", error);
    }
};

export const generateSuretyFormPDF = async ({ application, sureties }) => {
    console.log("[PDF] Generating Surety Form...", { application, sureties });
    if (!application || !sureties || sureties.length < 2) {
        alert("Two sureties are required to generate this form.");
        return;
    }

    try {
        const serverBaseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '') || window.location.origin;
        const getBase64FromUrl = async (url) => {
            if (!url) return null;
            try {
                const response = await fetch(url.startsWith('http') ? url : `${serverBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (err) { return null; }
        };
        const coatOfArmsBase64 = await getBase64FromUrl('/assets/coat_of_arms.png');
        const surety1Pic = await getBase64FromUrl(sureties[0].picture || sureties[0].picture_path); // handle both cases
        const surety2Pic = await getBase64FromUrl(sureties[1].picture || sureties[1].picture_path);

        // Helpers
        const formatDate = (dateString) => {
            if (!dateString) return '__________';
            const d = new Date(dateString);
            return isNaN(d) ? '__________' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        const formatMoney = (amount) => {
            return amount ? Number(amount).toLocaleString() : '__________';
        };

        const totalWorth = (Number(sureties[0].networth || 0) + Number(sureties[1].networth || 0));

        const applicantName = application.applicant_first_name
            ? `${application.applicant_first_name} ${application.applicant_surname}`
            : (application.first_name ? `${application.first_name} ${application.surname}` : '__________');

        const replacements = {
            '[DECEASED_NAME]': application.deceased_name?.toUpperCase() || '__________',
            '[DECEASED_ADDRESS]': application.home_address || '__________',
            '[DATE_OF_DEATH]': formatDate(application.date_of_death),
            '[PLACE_OF_DEATH]': application.death_location_address || '__________',
            '[APPLICANT_NAME]': applicantName.toUpperCase(),
            '[APPLICANT_ADDRESS]': application.applicant_address || application.address || '__________',
            '[SURETY_1_NAME]': sureties[0].name.toUpperCase(),
            '[SURETY_1_ADDRESS]': sureties[0].address,
            '[SURETY_1_PHONE]': sureties[0].phone || '__________________',
            '[SURETY_1_WORTH]': formatMoney(sureties[0].networth),
            '[SURETY_2_NAME]': sureties[1].name.toUpperCase(),
            '[SURETY_2_ADDRESS]': sureties[1].address,
            '[SURETY_2_PHONE]': sureties[1].phone || '__________________',
            '[SURETY_2_WORTH]': formatMoney(sureties[1].networth),
            '[TOTAL_WORTH]': formatMoney(totalWorth),
            '[YEAR]': new Date().getFullYear(),
        };

        const processTemplate = (tpl) => {
            let content = tpl;
            Object.keys(replacements).forEach(key => {
                content = content.split(key).join(replacements[key]);
            });
            return content;
        };

        // --- PAGE 1 TEMPLATE: Justification ---
        const page1Template = `
            <div style="position: relative; margin-bottom: 20px;">
                <!-- Surety Photos -->
                <div style="position: absolute; top: 0; left: 0;">
                    ${surety1Pic ? `<img src="${surety1Pic}" style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #000;" />` : '<div style="width:80px; height:80px; border:1px solid #000; display:flex; align-items:center; justify-content:center; font-size:10px;">Surety 1 Photo</div>'}
                </div>
                <div style="position: absolute; top: 0; right: 0;">
                    ${surety2Pic ? `<img src="${surety2Pic}" style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #000;" />` : '<div style="width:80px; height:80px; border:1px solid #000; display:flex; align-items:center; justify-content:center; font-size:10px;">Surety 2 Photo</div>'}
                </div>

                <div style="text-align: center; padding-top: 10px;">
                     <h3 style="margin: 0; font-family: 'Times New Roman', serif;">In the High Court of Justice of the Borno State of Nigeria</h3>
                    <h2 style="margin: 20px 0;">Justification of sureties</h2>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                In the matter of <b>[DECEASED_NAME]</b> deceased
            </div>

            <div style="line-height: 1.8; text-align: justify;">
                <div>We <b>[SURETY_1_NAME]</b> &nbsp;&nbsp;&nbsp; Tel: [SURETY_1_PHONE]</div>
                <div>Of [SURETY_1_ADDRESS].</div>
                <div>And <b>[SURETY_2_NAME]</b> &nbsp;&nbsp;&nbsp; Tel: [SURETY_2_PHONE]</div>
                <div>Of [SURETY_2_ADDRESS].</div>
            </div>

            <p style="text-align: justify; line-height: 1.8; margin-top: 20px;">
                Several make Oath and say that we are the proposed sureties in the penal of N<b>[TOTAL_WORTH]</b> on behalf of <b>[APPLICANT_NAME]</b> the intended administration of the personal property of <b>[DECEASED_NAME]</b> late of [DECEASED_ADDRESS] Deceased for his faithful administration thereof.
            </p>

            <p style="text-align: justify; line-height: 1.8;">
                I and the said <b>[SURETY_1_NAME]</b> for myself<br/>
                Make Oath and say that I am, after payment of all debts, well and truly worth in money and effects the sum of N<b>[SURETY_1_WORTH]</b></br>
            </p>
            <div style="text-align: right; margin-top: 20px; margin-bottom: 40px;">(SGD)........................................................</div>

            <p style="text-align: justify; line-height: 1.8;">
                And I the said <b>[SURETY_2_NAME]</b> for myself, make oath and say that I am after payment of all my just debts, we and truly worth in money and effect the sum N<b>[SURETY_2_WORTH]</b></br>
            </p>
            <div style="text-align: right; margin-top: 40px; margin-bottom: 40px;">(SGD)........................................................</div>

            <div style="margin-bottom: 40px; text-align: center">
                Sworn to at the .............................................................................................<br/><br/>
                Before me<br/></br>
                ------------------------------------------------<br/>
                <b>Commissioner for Oath</b>
            </div>

            <div>
                N100.00 paid on R.C.R No.................................................this........................... day of......................20..........
            </div>
        `;

        // --- PAGE 2 TEMPLATE: Letter of Approval ---
        const page2Template = `
            <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin: 0; font-family: 'Times New Roman', serif;">Letter of Approval of Sureties</h2>
            </div>

            <div style="margin-bottom: 30px; font-weight: bold;">
                Probate Registrar,<br/>
                High Court of Justice,<br/>
                P.M.B 1038,<br/>
                Maiduguri
            </div>

            <p style="line-height: 2.0; text-align: justify; margin-bottom: 20px;">
                Having examined <b>[SURETY_1_NAME]</b><br/>
                And <b>[SURETY_2_NAME]</b><br/>
                The proposed sureties for the administrator of the estate of <b>[DECEASED_NAME]</b> deceased
            </p>

            <p style="line-height: 2.0; text-align: justify; margin-bottom: 40px;">
                I am satisfied that the said <b>[SURETY_1_NAME]</b> And <b>[SURETY_2_NAME]</b> are each Good and sufficient value in the sum of Naira <b>[TOTAL_WORTH]</b> Kobo
            </p>
 

            
            <div style="text-align: right; margin-top: 60px;">
                <div style=" display: inline-block; width: 200px; text-align: center; padding-top: 5px;">
                   N................................................K
                </div>
            </div>

            <div style="text-align: right; margin-top: 60px;">
                <div style=" display: inline-block; width: 200px; text-align: center; padding-top: 5px;">
                .......................................................
                    Magistrate/Judge
                </div>
            </div>
        `;

        // Generate PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // Helper to render HTML to canvas then PDF
        const renderPage = async (htmlContent, isFirstPage = true) => {
            const container = document.createElement('div');
            container.style.width = '750px'; // Approx A4 width at 96dpi with margins
            container.style.padding = '50px';
            container.style.backgroundColor = '#ffffff';
            container.style.fontFamily = "Times New Roman, Times, serif";
            container.style.fontSize = "16px";
            container.style.lineHeight = "1.5";
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.color = '#000';

            container.innerHTML = htmlContent;
            document.body.appendChild(container);

            try {
                const canvas = await html2canvas(container, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const imgHeight = (canvas.height * pdfWidth) / canvas.width;

                if (!isFirstPage) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            } finally {
                document.body.removeChild(container);
            }
        };

        // Render Pages
        await renderPage(processTemplate(page1Template), true);
        await renderPage(processTemplate(page2Template), false);

        pdf.save(`Surety_Form_${application.id}.pdf`);

    } catch (error) {
        console.error("Surety PDF Error:", error);
        alert("Error generating PDF. Please check console.");
    }
};
