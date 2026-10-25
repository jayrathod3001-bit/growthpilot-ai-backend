import { generateAIImage } from '../utils/imageService.js';
import GeneratedImage from '../models/generatedImage.js';
import userData from '../models/user.js';
import businessData from '../models/business.js';

// Helper to get active business
const getBusinessContext = async (userId) => {
    try {
        if (!userId) return null;
        const user = await userData.findById(userId).select('activeBusinessId');
        if (!user || !user.activeBusinessId) return null;
        return await businessData.findById(user.activeBusinessId).select('_id');
    } catch {
        return null;
    }
};

export const generateImage = async (req, res) => {
    try {
        const { prompt, style, imageType, ratio } = req.body;
        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ status: 0, message: "Image prompt is required" });
        }

        const result = await generateAIImage({ prompt, style, imageType, ratio });

        // Save to MongoDB (fire-and-forget for speed)
        const business = await getBusinessContext(req.user?.id);
        GeneratedImage.create({
            userId: req.user?.id || null,
            businessId: business?._id || null,
            inputs: { prompt, style, imageType, ratio },
            imageUrl: result.imageUrl,
            engine: result.engine || '',
            enhancedPrompt: result.prompt || ''
        }).catch(err => console.error('GeneratedImage save error:', err.message));

        res.status(200).json({
            status: 1,
            message: "Image generated successfully",
            data: result
        });
    } catch (error) {
        console.error("generateImage error:", error);
        res.status(500).json({ status: 0, message: error.message || "Failed to generate image" });
    }
};

/**
 * GET: History of generated images for the current user
 */
export const getImageHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 20;
        const query = userId ? { userId } : {};
        const images = await GeneratedImage.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('inputs imageUrl engine createdAt');
        res.status(200).json({ status: 1, data: images });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};
