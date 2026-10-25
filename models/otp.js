import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    otp: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'phone', 'reset'],
        default: 'email'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Automatically expires after 5 minutes (TTL index)
    }
}, {
    timestamps: true,
    collection: 'otpData'
});

export default mongoose.model('otpData', otpSchema);
