import axios from 'axios';

export const sendOtpEmail = async (toEmail, otp) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'jayrathod3001@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'GrowthPilot AI';

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables');
    }

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: [
            { email: toEmail }
        ],
        subject: `${otp} is your GrowthPilot AI verification code`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                .logo { font-size: 24px; font-weight: 800; color: #818cf8; text-align: center; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: 700; text-align: center; color: #ffffff; margin-bottom: 8px; }
                .subtitle { font-size: 14px; text-align: center; color: #94a3b8; margin-bottom: 24px; }
                .otp-box { background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15)); border: 1px dashed #6366f1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
                .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #a5b4fc; font-family: monospace; }
                .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">✨ GrowthPilot AI</div>
                <div class="title">Verify Your Email Address</div>
                <p class="subtitle">Please enter the following 6-digit verification code to complete your signup process. This code will expire in 5 minutes.</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p style="font-size: 13px; color: #94a3b8; text-align: center;">If you didn't request this email, please ignore it.</p>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} GrowthPilot AI. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        `
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
        headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'accept': 'application/json'
        }
    });

    return response.data;
};

export const sendPasswordResetOtpEmail = async (toEmail, otp) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'jayrathod3001@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'GrowthPilot AI';

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables');
    }

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: [
            { email: toEmail }
        ],
        subject: `${otp} is your GrowthPilot AI password reset code`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                .logo { font-size: 24px; font-weight: 800; color: #818cf8; text-align: center; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: 700; text-align: center; color: #ffffff; margin-bottom: 8px; }
                .subtitle { font-size: 14px; text-align: center; color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }
                .otp-box { background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(168, 85, 247, 0.15)); border: 1px dashed #f87171; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
                .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #fca5a5; font-family: monospace; }
                .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">✨ GrowthPilot AI</div>
                <div class="title">Reset Your Password</div>
                <p class="subtitle">We received a request to reset your password. Use the verification code below to set a new password. This code will expire in 5 minutes.</p>
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                </div>
                <p style="font-size: 13px; color: #94a3b8; text-align: center;">If you did not request a password reset, you can safely ignore this email.</p>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} GrowthPilot AI. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        `
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
        headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'accept': 'application/json'
        }
    });

    return response.data;
};

export const sendLoginSuccessEmail = async (toEmail, userName) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'jayrathod3001@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'GrowthPilot AI';

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables');
    }

    const loginTime = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
    });

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: [
            { email: toEmail, name: userName || 'User' }
        ],
        subject: `Successful Login to GrowthPilot AI`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                .logo { font-size: 24px; font-weight: 800; color: #818cf8; text-align: center; margin-bottom: 20px; }
                .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 6px 16px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
                .title { font-size: 22px; font-weight: 700; text-align: center; color: #ffffff; margin-bottom: 8px; }
                .subtitle { font-size: 14px; text-align: center; color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }
                .details-box { background: rgba(30, 41, 59, 0.6); border: 1px solid #334155; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
                .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">✨ GrowthPilot AI</div>
                <div style="text-align: center;">
                    <span class="badge">✔ Login Successful</span>
                </div>
                <div class="title">You Logged In Successfully</div>
                <p class="subtitle">
                    Hello <strong>${userName || 'User'}</strong>,<br/>
                    You have successfully logged in to your GrowthPilot AI account.
                </p>
                <div class="details-box">
                    <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #f1f5f9;">
                        <tr>
                            <td style="color: #94a3b8;">Account:</td>
                            <td style="text-align: right; font-weight: 600;">${toEmail}</td>
                        </tr>
                        <tr>
                            <td style="color: #94a3b8;">Time:</td>
                            <td style="text-align: right; font-weight: 600;">${loginTime}</td>
                        </tr>
                        <tr>
                            <td style="color: #94a3b8;">Status:</td>
                            <td style="text-align: right; font-weight: 600; color: #34d399;">Authorized</td>
                        </tr>
                    </table>
                </div>
                <p style="font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5;">
                    If this was you, you can safely ignore this email. If you did not log in, please reset your password immediately.
                </p>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} GrowthPilot AI. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        `
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
        headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'accept': 'application/json'
        }
    });

    return response.data;
};

export const sendInquiryNotificationToAdmin = async (inquiry) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'jayrathod3001@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'GrowthPilot AI';
    const adminEmail = process.env.ADMIN_INQUIRY_EMAIL || 'jayrathod@yopmail.com';

    if (!apiKey) {
        console.warn('BREVO_API_KEY is missing, skipping admin inquiry email notification');
        return;
    }

    const payload = {
        sender: {
            name: `${inquiry.name || 'Visitor'} via GrowthPilot`,
            email: senderEmail
        },
        to: [
            { email: adminEmail }
        ],
        subject: `[New Inquiry] ${inquiry.subject || inquiry.category || 'User Inquiry'} from ${inquiry.name || inquiry.email}`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }
                .container { max-width: 580px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                .logo { font-size: 20px; font-weight: 800; color: #818cf8; margin-bottom: 20px; }
                .title { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
                .details-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 18px; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
                .label { color: #94a3b8; font-weight: 600; }
                .val { color: #ffffff; font-weight: 500; }
                .msg-box { background: rgba(99,102,241,0.08); border-left: 4px solid #6366f1; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; }
                .footer { font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">📩 GrowthPilot AI — New Inquiry Alert</div>
                <div class="title">You received a new inquiry from ${inquiry.name || 'a user'}</div>
                <div class="details-box">
                    <p style="margin: 0 0 10px 0;"><strong>Sender Name:</strong> ${inquiry.name || 'Not provided'}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Sender Email:</strong> <a href="mailto:${inquiry.email}" style="color: #818cf8;">${inquiry.email}</a></p>
                    ${inquiry.phone ? `<p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${inquiry.phone}</p>` : ''}
                    ${inquiry.businessName ? `<p style="margin: 0 0 10px 0;"><strong>Business:</strong> ${inquiry.businessName}</p>` : ''}
                    <p style="margin: 0 0 10px 0;"><strong>Category / Type:</strong> ${inquiry.category || 'General'}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Source Page:</strong> ${inquiry.source || 'Website'}</p>
                    ${inquiry.rating ? `<p style="margin: 0 0 10px 0;"><strong>Rating Given:</strong> ⭐ ${inquiry.rating}/5</p>` : ''}
                </div>
                <div style="font-weight: 600; color: #94a3b8; font-size: 13px;">User Message:</div>
                <div class="msg-box">${inquiry.message}</div>
                <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 20px;">
                    You can reply to this user directly from your <strong>Admin Dashboard</strong> or by emailing them back.
                </p>
                <div class="footer">
                    GrowthPilot AI System Notification • Sent to ${adminEmail}
                </div>
            </div>
        </body>
        </html>
        `
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
        headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'accept': 'application/json'
        }
    });

    return response.data;
};

export const sendInquiryReplyToUser = async (userEmail, userName, inquirySubject, replyMessage, originalMessage = '') => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'jayrathod3001@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Jay Rathod | GrowthPilot AI';

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables');
    }

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: [
            { email: userEmail, name: userName || 'Valued User' }
        ],
        subject: `Re: ${inquirySubject || 'Your inquiry on GrowthPilot AI'}`,
        htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }
                .container { max-width: 580px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                .logo { font-size: 22px; font-weight: 800; color: #818cf8; margin-bottom: 20px; }
                .greeting { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
                .reply-box { background: rgba(99,102,241,0.1); border-left: 4px solid #818cf8; border-radius: 8px; padding: 18px; margin: 16px 0; font-size: 14px; line-height: 1.7; color: #f1f5f9; white-space: pre-wrap; }
                .quote-box { background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 14px; margin-top: 24px; font-size: 12px; color: #94a3b8; }
                .signature { margin-top: 24px; font-size: 13px; color: #cbd5e1; line-height: 1.5; }
                .footer { font-size: 11px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">✨ GrowthPilot AI Support</div>
                <div class="greeting">Hi ${userName || 'there'},</div>
                <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 12px;">
                    Thank you for reaching out to us. Here is our team's response to your inquiry:
                </p>
                <div class="reply-box">${replyMessage}</div>
                ${originalMessage ? `
                <div class="quote-box">
                    <strong style="color: #e2e8f0;">Your original message:</strong><br/>
                    <em>"${originalMessage}"</em>
                </div>` : ''}
                <div class="signature">
                    Warm regards,<br/>
                    <strong>Jay Rathod</strong><br/>
                    Founder & Engineering Team, GrowthPilot AI
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} GrowthPilot AI. If you have further questions, feel free to reply directly to this email.
                </div>
            </div>
        </body>
        </html>
        `
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
        headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            'accept': 'application/json'
        }
    });

    return response.data;
};

