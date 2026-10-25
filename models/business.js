import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        required: true
    },
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    businessCategory: {
        type: String,
        required: true
    },
    businessDescription: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    businessGoal: {
        type: String,
        default: ""
    },
    targetAudience: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    collection: 'businessData'
});

export default mongoose.model('businessData', businessSchema);
