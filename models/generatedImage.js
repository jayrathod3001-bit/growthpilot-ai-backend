import mongoose from 'mongoose';

const generatedImageSchema = new mongoose.Schema({
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
        prompt: String,
        style: String,
        imageType: String,
        ratio: String
    },
    imageUrl: { type: String, required: true },
    engine: { type: String, default: '' },
    enhancedPrompt: { type: String, default: '' }
}, {
    timestamps: true,
    collection: 'generatedImages'
});

export default mongoose.model('generatedImage', generatedImageSchema);
