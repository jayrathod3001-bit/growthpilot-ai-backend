import userData from '../models/user.js'
import OTP from '../models/otp.js'
import bcrypt from 'bcrypt'
import generateToken from '../utils/jsonutils.js'
import { sendOtpEmail, sendLoginSuccessEmail, sendPasswordResetOtpEmail } from '../utils/emailService.js'
import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const validatePasswordStrength = (pwd) => {
    if (!pwd || pwd.length < 8) return { valid: false, message: "Password must be at least 8 characters long" };
    if (!/[A-Z]/.test(pwd)) return { valid: false, message: "Password must contain at least one uppercase letter (A-Z)" };
    if (!/[a-z]/.test(pwd)) return { valid: false, message: "Password must contain at least one lowercase letter (a-z)" };
    if (!/[0-9]/.test(pwd)) return { valid: false, message: "Password must contain at least one number (0-9)" };
    if (!/[^a-zA-Z0-9]/.test(pwd)) return { valid: false, message: "Password must contain at least one special character (!@#$%^&*...)" };
    return { valid: true };
};

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 0, message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ status: 0, message: "Please provide a valid email address" });
        }

        // Check if user already exists
        const existingUser = await userData.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ status: 0, message: "An account with this email already exists. Please login." });
        }

        // Generate 6-digit random OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save or update OTP in database with 5 minute TTL
        await OTP.findOneAndUpdate(
            { email: normalizedEmail },
            { otp, createdAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Send email via Brevo
        await sendOtpEmail(normalizedEmail, otp);

        res.status(200).json({ status: 1, message: "Verification OTP sent successfully to your email" });
    } catch (error) {
        console.error("sendOtp error:", error);
        res.status(500).json({ status: 0, message: error.message || "Failed to send OTP email" });
    }
};

export const addUser = async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: 0, message: "Name, email, and password are required" });
        }

        const pwdCheck = validatePasswordStrength(password);
        if (!pwdCheck.valid) {
            return res.status(400).json({ status: 0, message: pwdCheck.message });
        }

        if (!otp) {
            return res.status(400).json({ status: 0, message: "Please enter the verification OTP sent to your email" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        const existingUser = await userData.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ status: 0, message: "User already exists with this email" });
        }

        // Verify OTP from database
        const otpRecord = await OTP.findOne({ email: normalizedEmail });
        if (!otpRecord) {
            return res.status(400).json({ status: 0, message: "OTP has expired or was not requested. Please request a new OTP." });
        }

        if (otpRecord.otp !== otp.toString().trim()) {
            return res.status(400).json({ status: 0, message: "Invalid OTP! Please check the code sent to your email and try again." });
        }

        // Valid OTP -> delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userDataval = {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        };

        const saveUSerData = await userData.create(userDataval);
        res.status(200).json({ status: 1, message: "User registered successfully", data: saveUSerData });
    } catch (error) {
        console.error("addUser error:", error);
        res.status(500).json({ status: 0, errorMessage: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        const getuserData = await userData.find()
        res.status(200).json({ message: "user get successfulyy", data: getuserData })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message })
    }

}

export const getSingleUser = async (req, res) => {
    try {
        const id = req.params.uid
        const getsingleUserdata = await userData.findById(id)
        res.status(200).json({ message: "user get successfully", data: getsingleUserdata })

    } catch (error) {
        res.status(500).json({ errorMessage: error.message })
    }
}

export const deleteUSer = async (req, res) => {
    try {
        const id = req.params.uid
        const deleteuserData = await userData.findByIdAndDelete(id)
        res.status(200).json({ message: "user deleted successfully", data: deleteuserData })

    } catch (error) {
        res.status(500).json({ errorMessage: error.message })
    }
}

export const updateUser = async (req, res) => {
    try {
        const id = req.params.uid
        const updateFields = {}
        if (req.body.name) updateFields.name = req.body.name
        if (req.body.email) updateFields.email = req.body.email
        if (req.body.phone !== undefined) updateFields.phone = req.body.phone
        if (req.body.address !== undefined) updateFields.address = req.body.address

        const updateuserData = await userData.findByIdAndUpdate(id, { $set: updateFields }, {
            new: true
        })
        res.status(200).json({ message: "user updated successfully", data: updateuserData, status: 1 })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

export const setActiveBusiness = async (req, res) => {
    try {
        const { businessId } = req.body
        const updatedUser = await userData.findByIdAndUpdate(
            req.user.id,
            { activeBusinessId: businessId },
            { new: true }
        )
        res.status(200).json({ message: "active business updated successfully", status: 1, activeBusinessId: updatedUser.activeBusinessId })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

export const login = async (req, res) => {
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : ''
        const uData = await userData.findOne({ email })
        if (!uData) {
            return res.status(200).json({ message: "user not found", status: 0 })
        }

        const compass = await bcrypt.compare(req.body.password, uData.password)
        if (!compass) {
            return res.status(200).json({ message: "password not match", status: 0 })
        }

        const token = await generateToken(uData)

        // Send login success notification email asynchronously
        sendLoginSuccessEmail(uData.email, uData.name).catch((err) => {
            console.error("Failed to send login notification email:", err.response?.data || err.message)
        })

        res.status(200).json({ message: "user login successfully", status: 1, data: uData, token: token })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message })
    }
}

export const sendForgotPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 0, message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await userData.findOne({ email: normalizedEmail });
        if (!existingUser) {
            return res.status(400).json({ status: 0, message: "No registered account found with this email" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.findOneAndUpdate(
            { email: normalizedEmail },
            { otp, createdAt: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await sendPasswordResetOtpEmail(normalizedEmail, otp);

        res.status(200).json({ status: 1, message: "Password reset verification code sent to your email" });
    } catch (error) {
        console.error("sendForgotPasswordOtp error:", error);
        res.status(500).json({ status: 0, message: error.message || "Failed to send reset code" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ status: 0, message: "Email and new password are required" });
        }

        const pwdCheck = validatePasswordStrength(newPassword);
        if (!pwdCheck.valid) {
            return res.status(400).json({ status: 0, message: pwdCheck.message });
        }

        if (!otp) {
            return res.status(400).json({ status: 0, message: "Please enter the verification OTP sent to your email" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await userData.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ status: 0, message: "No registered account found with this email" });
        }

        // Verify OTP from database
        const otpRecord = await OTP.findOne({ email: normalizedEmail });
        if (!otpRecord) {
            return res.status(400).json({ status: 0, message: "OTP has expired or was not requested. Please request a new OTP." });
        }

        if (otpRecord.otp !== otp.toString().trim()) {
            return res.status(400).json({ status: 0, message: "Invalid OTP! Please check the code and try again." });
        }

        // OTP verified -> remove OTP from database
        await OTP.deleteOne({ _id: otpRecord._id });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ status: 1, message: "Password updated successfully in database" });
    } catch (error) {
        res.status(500).json({ status: 0, errorMessage: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const id = req.params.uid
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(200).json({ message: "Current and new password are required", status: 0 })
        }

        const pwdCheck = validatePasswordStrength(newPassword);
        if (!pwdCheck.valid) {
            return res.status(200).json({ message: pwdCheck.message, status: 0 });
        }

        const user = await userData.findById(id)
        if (!user) {
            return res.status(200).json({ message: "User not found", status: 0 })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) {
            return res.status(200).json({ message: "Current password is incorrect", status: 0 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        await user.save()

        res.status(200).json({ message: "Password updated successfully in database", status: 1 })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Google OAuth Sign-In & Sign-Up ──────────────────────────────────────────
export const googleAuth = async (req, res) => {
    try {
        const { credential, profile } = req.body;
        let googleUser = null;

        if (credential) {
            try {
                // Verify idToken cryptographically using google-auth-library
                if (process.env.GOOGLE_CLIENT_ID) {
                    const ticket = await googleClient.verifyIdToken({
                        idToken: credential,
                        audience: process.env.GOOGLE_CLIENT_ID,
                    });
                    googleUser = ticket.getPayload();
                } else {
                    const parts = credential.split('.');
                    if (parts.length >= 2) {
                        const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
                        googleUser = JSON.parse(decoded);
                    }
                }
            } catch (verifyErr) {
                console.warn("Google verifyIdToken notice, fallback to payload decode:", verifyErr.message);
                try {
                    const parts = credential.split('.');
                    if (parts.length >= 2) {
                        const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
                        googleUser = JSON.parse(decoded);
                    }
                } catch (decodeErr) {
                    console.error("Error decoding Google credential:", decodeErr);
                }
            }
        }

        // Fallback to directly provided profile
        if (!googleUser && profile) {
            googleUser = profile;
        }

        if (!googleUser || (!googleUser.email && !googleUser.sub)) {
            return res.status(400).json({
                status: 0,
                message: "Invalid Google authentication data received."
            });
        }

        const email = googleUser.email ? googleUser.email.toLowerCase().trim() : null;
        const googleId = googleUser.sub || googleUser.id;
        const name = googleUser.name || googleUser.displayName || 'Google User';
        const avatar = googleUser.picture || googleUser.avatar || '';

        // Check if user exists by googleId or email
        let user = null;
        if (googleId) {
            user = await userData.findOne({ googleId });
        }
        if (!user && email) {
            user = await userData.findOne({ email });
        }

        let isNewUser = false;
        if (user) {
            // Update missing fields if needed
            let updated = false;
            if (!user.googleId && googleId) {
                user.googleId = googleId;
                updated = true;
            }
            if (!user.avatar && avatar) {
                user.avatar = avatar;
                updated = true;
            }
            if (updated) {
                await user.save();
            }
        } else {
            // Create brand new user
            isNewUser = true;
            user = await userData.create({
                name,
                email: email || `user_${googleId || Date.now()}@google.growthpilot.local`,
                googleId,
                avatar,
                authProvider: 'google',
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            status: 1,
            message: isNewUser ? "Welcome! Account created via Google" : "Signed in with Google successfully",
            token,
            data: user,
            isNewUser
        });
    } catch (error) {
        console.error("googleAuth error:", error);
        return res.status(500).json({
            status: 0,
            message: error.message || "Failed to process Google authentication"
        });
    }
};

import Inquiry from '../models/inquiry.js';

export const getUserNotifications = async (req, res) => {
    try {
        const userEmail = req.user?.email?.toLowerCase().trim();
        const notifications = [];

        if (userEmail) {
            // Find replied inquiries
            const userInquiries = await Inquiry.find({ email: userEmail }).sort({ updatedAt: -1 }).lean();
            userInquiries.forEach((inq) => {
                if (inq.status === 'replied' && inq.adminReply?.message) {
                    notifications.push({
                        id: `inq_${inq._id}`,
                        type: 'reply',
                        title: `✉️ Admin Replied: ${inq.subject}`,
                        message: inq.adminReply.message,
                        time: inq.adminReply.repliedAt || inq.updatedAt,
                        unread: true
                    });
                }
            });
        }

        notifications.push({
            id: 'notif_welcome',
            type: 'system',
            title: '🎉 Welcome to GrowthPilot AI!',
            message: 'Your AI-powered business growth copilot is ready. Explore Marketing Strategy and SEO tools.',
            time: new Date(Date.now() - 3600000 * 2),
            unread: false
        });

        notifications.push({
            id: 'notif_features',
            type: 'tip',
            title: '💡 Pro Tip: Generate High-Converting Reels',
            message: 'Use our Content Generator with customized festival occasions to double your audience engagement.',
            time: new Date(Date.now() - 3600000 * 24),
            unread: false
        });

        return res.status(200).json({ status: 1, data: notifications });
    } catch (error) {
        console.error('getUserNotifications error:', error);
        return res.status(500).json({ status: 0, message: error.message });
    }
};




