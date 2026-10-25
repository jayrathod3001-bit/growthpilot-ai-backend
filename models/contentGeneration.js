import mongoose from 'mongoose';

const contentGenerationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userData',
        default: null
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'businessData',
        default: null
    },
    inputs: {
        platform: String,
        contentType: String,
        product: String,
        tone: String,
        targetAudience: String,
        topic: String
    },
    content: { type: String, required: true }
}, {
    timestamps: true,
    collection: 'contentGenerations'
});

export default mongoose.model('contentGeneration', contentGenerationSchema);
