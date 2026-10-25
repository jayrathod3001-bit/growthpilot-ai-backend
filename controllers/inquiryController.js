import Inquiry from '../models/inquiry.js';
import { sendInquiryNotificationToAdmin, sendInquiryReplyToUser } from '../utils/emailService.js';

/**
 * POST /api/inquiries
 * Public/User endpoint to submit an inquiry from ContactUs, HelpSupport, Feedback, etc.
 */
export const createInquiry = async (req, res) => {
    try {
        const { name, email, phone, businessName, subject, category, message, source, rating } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ status: 0, message: 'Please provide a valid email address so we can reply to you.' });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ status: 0, message: 'Please provide a message or inquiry description.' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const newInquiry = await Inquiry.create({
            name: name && name.trim() ? name.trim() : 'Guest User',
            email: normalizedEmail,
            phone: phone ? phone.trim() : '',
            businessName: businessName ? businessName.trim() : '',
            subject: subject && subject.trim() ? subject.trim() : (category || 'General Inquiry'),
            category: category || 'General Inquiry',
            message: message.trim(),
            source: source || 'contact',
            rating: Number.isFinite(rating) ? rating : null,
            status: 'pending'
        });

        // Send email alert to admin (jayrathod@yopmail.com)
        try {
            await sendInquiryNotificationToAdmin(newInquiry);
            console.log(`✉️ [Inquiry] Admin email alert sent to jayrathod@yopmail.com for inquiry: ${newInquiry._id}`);
        } catch (emailErr) {
            console.error('⚠️ [Inquiry] Failed to send admin email alert:', emailErr.message);
            // Don't fail client request if email notification has transient network delay
        }

        return res.status(201).json({
            status: 1,
            message: 'Inquiry submitted successfully! Our team has been notified and will reply to your email shortly.',
            data: newInquiry
        });
    } catch (error) {
        console.error('createInquiry error:', error);
        return res.status(500).json({ status: 0, message: error.message || 'Failed to submit inquiry' });
    }
};

/**
 * GET /api/admin/inquiries
 * Admin-only: list all inquiries with summary counts
 */
export const adminGetAllInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();

        const counts = {
            total: inquiries.length,
            pending: inquiries.filter(i => i.status === 'pending').length,
            replied: inquiries.filter(i => i.status === 'replied').length
        };

        return res.status(200).json({
            status: 1,
            data: inquiries,
            counts
        });
    } catch (error) {
        console.error('adminGetAllInquiries error:', error);
        return res.status(500).json({ status: 0, message: error.message });
    }
};

/**
 * POST /api/admin/inquiries/:id/reply
 * Admin-only: send direct email reply to user and mark inquiry as replied
 */
export const adminReplyInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;

        if (!replyMessage || !replyMessage.trim()) {
            return res.status(400).json({ status: 0, message: 'Reply message cannot be empty' });
        }

        const inquiry = await Inquiry.findById(id);
        if (!inquiry) {
            return res.status(404).json({ status: 0, message: 'Inquiry not found' });
        }

        // Send reply email to user via Brevo
        await sendInquiryReplyToUser(
            inquiry.email,
            inquiry.name,
            inquiry.subject,
            replyMessage.trim(),
            inquiry.message
        );

        // Update inquiry in MongoDB
        inquiry.status = 'replied';
        inquiry.adminReply = {
            message: replyMessage.trim(),
            repliedAt: new Date(),
            repliedBy: req.user?.email || 'admin'
        };
        await inquiry.save();

        console.log(`✉️ [Inquiry] Reply successfully sent to user ${inquiry.email} for inquiry ${id}`);

        return res.status(200).json({
            status: 1,
            message: `Reply sent successfully to ${inquiry.email}!`,
            data: inquiry
        });
    } catch (error) {
        console.error('adminReplyInquiry error:', error);
        return res.status(500).json({ status: 0, message: error.message || 'Failed to send reply' });
    }
};

/**
 * DELETE /api/admin/inquiries/:id
 * Admin-only: delete an inquiry
 */
export const adminDeleteInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Inquiry.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ status: 0, message: 'Inquiry not found' });
        }
        return res.status(200).json({ status: 1, message: 'Inquiry deleted successfully' });
    } catch (error) {
        console.error('adminDeleteInquiry error:', error);
        return res.status(500).json({ status: 0, message: error.message });
    }
};
