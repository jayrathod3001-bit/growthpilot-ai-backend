import mongoose from 'mongoose';

const seoAnalysisSchema = new mongoose.Schema({
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
        website: String,
        businessCategory: String,
        targetLocation: String,
        keywords: String
    },
    result: { type: mongoose.Schema.Types.Mixed, required: true }
}, {
    timestamps: true,
    collection: 'seoAnalyses'
});

export default mongoose.model('seoAnalysis', seoAnalysisSchema);
