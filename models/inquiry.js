import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'Guest User',
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    businessName: {
        type: String,
        default: '',
        trim: true
    },
    subject: {
        type: String,
        default: 'General Inquiry',
        trim: true
    },
    category: {
        type: String,
        default: 'General Inquiry',
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    source: {
        type: String,
        enum: ['contact', 'support', 'feedback', 'dashboard'],
        default: 'contact'
    },
    rating: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'replied', 'closed'],
        default: 'pending'
    },
    adminReply: {
        message: { type: String, default: '' },
        repliedAt: { type: Date, default: null },
        repliedBy: { type: String, default: '' }
    }
}, {
    timestamps: true,
    collection: 'inquiries'
});

export default mongoose.model('inquiry', inquirySchema);
