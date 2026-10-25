import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        default: '',
        trim: true
    },
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
    password: {
        type: String,
        required: false,
        default: null
    },
    googleId: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: ''
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'phone'],
        default: 'local'
    },
    activeBusinessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'businessData',
        default: null
    }
}, {
    timestamps: true,
    collection: 'userData'
});

export default mongoose.model('userData', userSchema);