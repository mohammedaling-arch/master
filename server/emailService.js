const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Create a transporter using environment variables or fallback to Ethereal
const createTransporter = async () => {
    // If we have SMTP credentials in .env, use them
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // Fallback for development if no credentials are provided
    console.warn("Using Ethereal (test) email account. Set EMAIL_USER and EMAIL_PASS in .env for real emails.");
    let testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

const sendAffidavitNotification = async (userEmail, userName, applicationId, status, pdfAttachmentPath = null) => {
    try {
        const transporter = await createTransporter();

        let subject = '';
        let text = '';
        let html = '';

        if (status === 'submitted') {
            subject = 'Affidavit Application Received';
            text = `Dear ${userName}, Your affidavit application (ID: CRMS-${applicationId}) has been received and is now under review.`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #3b82f6;">Application Received</h2>
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>Your affidavit application <strong>CRMS-${applicationId}</strong> has been successfully submitted and payment received.</p>
                    <div style="margin: 20px 0; padding: 15px; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px;">
                        <strong>Current Status:</strong> PENDING REGISTRY REVIEW
                    </div>
                    <p>Our officers will review your submission shortly. You will be notified of the next steps via email.</p>
                    <p>Thank you for using CRMS Borno.</p>
                </div>
            `;
        } else if (status === 'completed') {
            subject = 'Your Affidavit has been Issued & Sealed';
            text = `Dear ${userName}, Your affidavit (ID: CRMS-${applicationId}) has been successfully verified, issued and sealed by the OADR Registry. You can now download it from your dashboard.`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #10b981;">Affidavit Issued Successfully!</h2>
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>We are pleased to inform you that your affidavit application <strong>CRMS-${applicationId}</strong> has been successfully verified and sealed by the High Court of Justice, Borno State.</p>
                    <div style="margin: 20px 0; padding: 15px; background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px;">
                        <strong>Status:</strong> ISSUED & SEALED
                    </div>
                    <p>You can now log in to your dashboard to download your official document. ${pdfAttachmentPath ? 'A copy of your signed document is also attached to this email.' : ''}</p>
                    <p>Thank you for using the Court Registry Management System (CRMS).</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated notification. Please do not reply.</p>
                </div>
            `;
        } else if (status === 'rejected') {
            subject = 'Update on your Affidavit Application';
            text = `Dear ${userName}, Your affidavit application (ID: CRMS-${applicationId}) was not approved. Please check your dashboard for details.`;
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #ef4444;">Application Update</h2>
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>There is an update regarding your affidavit application <strong>CRMS-${applicationId}</strong>.</p>
                    <p>Unfortunately, your application was not approved during the review stage. This may be due to missing information or incorrect documentation.</p>
                    <p>Please log in to your dashboard to view the feedback and resubmit your application.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">High Court of Justice OADR Registry</p>
                </div>
            `;
        } else {
            return; // No notification for intermediate statuses
        }

        const mailOptions = {
            from: '"CRMS Registry" <no-reply@crms-borno.gov.ng>',
            to: userEmail,
            subject: subject,
            text: text,
            html: html,
        };

        if (pdfAttachmentPath) {
            const fileName = path.basename(pdfAttachmentPath);
            // Ensure path doesn't start with / for path.join to work correctly relative to __dirname
            const relativePath = pdfAttachmentPath.startsWith('/') ? pdfAttachmentPath.substring(1) : pdfAttachmentPath;
            const absolutePath = path.isAbsolute(pdfAttachmentPath) ? pdfAttachmentPath : path.join(__dirname, relativePath);

            mailOptions.attachments = [
                {
                    filename: fileName,
                    path: absolutePath
                }
            ];
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Email sending failed:", error);
    }
};

const sendVerificationEmail = async (userEmail, userName, token) => {
    try {
        const transporter = await createTransporter();
        const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/confirm-email?token=${token}`;

        const info = await transporter.sendMail({
            from: '"CRMS Registry" <no-reply@crms-borno.gov.ng>',
            to: userEmail,
            subject: 'Confirm Your Email Address',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #3b82f6; text-align: center;">Welcome to CRMS Borno!</h2>
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>Thank you for registering on the Borno State High Court Management System. To activate your account, please click the button below to verify your email address:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; borderRadius: 30px; font-weight: bold; display: inline-block;">Verify Email Address</a>
                    </div>
                    <p style="font-size: 13px; color: #778eaeff;">If you didn't create an account, you can safely ignore this email.</p>
                    <p style="font-size: 13px; color: #778eaeff; margin-top: 20px; border-top: 1px solid #eee; pt-4">Borno State High Court Portal</p>
                </div>
            `,
        });

        console.log("Verification email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Verification email failed:", error);
    }
};

const sendResetPasswordEmail = async (userEmail, userName, token) => {
    try {
        const transporter = await createTransporter();
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        const info = await transporter.sendMail({
            from: '"CRMS Registry" <no-reply@crms-borno.gov.ng>',
            to: userEmail,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #fd4b1d; text-align: center;">Reset Your Password</h2>
                    <p>Dear <strong>${userName}</strong>,</p>
                    <p>We received a request to reset your password for your CRMS account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: #fd4b1d; color: white; padding: 14px 28px; text-decoration: none; borderRadius: 30px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="font-size: 13px; color: #778eaeff;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
                    <p style="font-size: 13px; color: #778eaeff; margin-top: 20px; border-top: 1px solid #eee; pt-4">Borno State High Court Portal</p>
                </div>
            `,
        });

        console.log("Reset password email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Reset password email failed:", error);
    }
};

const sendEmailNotification = async (to, subject, title, message) => {
    try {
        const transporter = await createTransporter();
        const info = await transporter.sendMail({
            from: '"CRMS Registry" <no-reply@crms-borno.gov.ng>',
            to: to,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #3b82f6; text-align: center;">${title}</h2>
                    <p>${message}</p>
                    <p style="font-size: 13px; color: #778eaeff; margin-top: 20px; border-top: 1px solid #eee; pt-4">Borno State High Court Portal</p>
                </div>
            `,
        });
        return info;
    } catch (error) {
        console.error("General email notification failed:", error);
    }
};

const sendStaffCredentialsEmail = async (staffEmail, staffName, tempPassword) => {
    try {
        const transporter = await createTransporter();
        const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/staff/login`;

        const info = await transporter.sendMail({
            from: '"CRMS Registry" <no-reply@crms-borno.gov.ng>',
            to: staffEmail,
            subject: 'Staff Portal Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #3b82f6; text-align: center;">Staff Portal Access</h2>
                    <p>Dear <strong>${staffName}</strong>,</p>
                    <p>Your staff account has been created/reset. Please use the following credentials to log in to the CRMS Staff Portal:</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 10px 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                        <p style="margin: 0 0 10px 0;"><strong>Username/Email:</strong> ${staffEmail}</p>
                        <p style="margin: 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-size: 18px; color: #3b82f6; font-weight: bold;">${tempPassword}</span></p>
                    </div>
                    <p style="color: #ef4444; font-weight: bold;">Note: You will be required to change this password upon your first login.</p>
                    <p style="font-size: 13px; color: #778eaeff; margin-top: 20px; border-top: 1px solid #eee; pt-4">Borno State High Court Management System</p>
                </div>
            `,
        });

        console.log("Staff credentials email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Staff credentials email failed:", error);
    }
};

module.exports = {
    sendAffidavitNotification,
    sendVerificationEmail,
    sendResetPasswordEmail,
    sendEmailNotification,
    sendStaffCredentialsEmail
};
