import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true }
}, { _id: false });

const aiChatSchema = new mongoose.Schema({
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
    userMessage: { type: String, required: true },
    aiReply: { type: String, required: true },
    history: [messageSchema]
}, {
    timestamps: true,
    collection: 'aiChats'
});

export default mongoose.model('aiChat', aiChatSchema);
