import mongoose from 'mongoose';

const marketingStrategySchema = new mongoose.Schema({
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
        marketingGoal: String,
        budget: String,
        targetAudience: String,
        platform: String,
        duration: String,
        product: String,
        occasion: String,
        additionalInfo: String
    },
    result: { type: mongoose.Schema.Types.Mixed, required: true }
}, {
    timestamps: true,
    collection: 'marketingStrategies'
});

export default mongoose.model('marketingStrategy', marketingStrategySchema);
