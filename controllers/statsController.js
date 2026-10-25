import AiChat from '../models/aiChat.js';
import MarketingStrategy from '../models/marketingStrategy.js';
import ContentGeneration from '../models/contentGeneration.js';
import SeoAnalysis from '../models/seoAnalysis.js';
import GeneratedImage from '../models/generatedImage.js';
import businessData from '../models/business.js';
import userData from '../models/user.js';

/**
 * Dynamically computes Profile Completion percentage (0-100%)
 * Personal details: 35% total (Name: 15%, Real Email: 10%, Phone: 10%)
 * Business details: 65% total (Business added: 15%, Name: 10%, Category: 10%, Description: 10%, Location: 5%, Audience: 5%, Goal: 5%, Contact: 5%)
 */
export const calculateProfileScore = (userDoc, biz, businessCount = 0) => {
    let score = 0;

    // 1. Personal Details (35 points max)
    const rawName = userDoc?.name?.trim() || '';
    const isGenericUser = rawName.toLowerCase().startsWith('user ') || rawName.toLowerCase().startsWith('user+');
    if (rawName.length >= 2 && !isGenericUser) {
        score += 15;
    }

    const rawEmail = userDoc?.email?.trim() || '';
    const isFakeEmail = rawEmail.includes('@mobile.growthpilot.local') || rawEmail.includes('@google.growthpilot.local');
    if (rawEmail.length >= 5 && !isFakeEmail && rawEmail.includes('@')) {
        score += 10;
    }

    const rawPhone = userDoc?.phone?.trim() || '';
    if (rawPhone.length >= 10) {
        score += 10;
    }

    // 2. Business Details (65 points max)
    const hasBusiness = businessCount > 0 || !!userDoc?.activeBusinessId || !!biz;
    if (hasBusiness) {
        score += 15;
    }

    if (biz) {
        if (biz.businessName && biz.businessName.trim().length >= 2) score += 10;
        if (biz.businessCategory && biz.businessCategory.trim().length >= 2) score += 10;
        if (biz.businessDescription && biz.businessDescription.trim().length >= 5) score += 10;
        if (biz.location && biz.location.trim().length >= 2) score += 5;
        if (biz.targetAudience && biz.targetAudience.trim().length >= 2) score += 5;
        if (biz.businessGoal && biz.businessGoal.trim().length >= 2) score += 5;
        if ((biz.phone && biz.phone.trim().length >= 6) || (biz.email && biz.email.trim().length >= 4)) score += 5;
    }

    return Math.min(100, Math.max(0, score));
};

/**
 * GET /api/user/stats
 * Returns real usage counts from MongoDB for the dashboard performance overview.
 */
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ status: 0, message: 'Authentication required' });
        }

        const query = { userId };

        // Run all counts in parallel for speed
        const [
            chatCount,
            marketingCount,
            contentCount,
            seoCount,
            imageCount,
            businessCount,
            userDoc
        ] = await Promise.all([
            AiChat.countDocuments(query),
            MarketingStrategy.countDocuments(query),
            ContentGeneration.countDocuments(query),
            SeoAnalysis.countDocuments(query),
            GeneratedImage.countDocuments(query),
            businessData.countDocuments({ userId }),
            userData.findById(userId).select('name email phone authProvider activeBusinessId createdAt')
        ]);

        const activeBizId = userDoc?.activeBusinessId;
        const biz = activeBizId 
            ? await businessData.findById(activeBizId) 
            : await businessData.findOne({ userId });

        // Dynamic Profile completion score based on filled fields
        const profileScore = calculateProfileScore(userDoc, biz, businessCount);

        // AI Score: based on total AI interactions (10 pts per action, capped at 100)
        const totalAiActions = chatCount + marketingCount + contentCount + seoCount + imageCount;
        const aiScore = totalAiActions === 0 ? 0 : Math.min(100, Math.round(totalAiActions * 10));

        // Marketing Score: based on marketing strategies (25 pts) + content pieces (15 pts)
        const marketingScore = (marketingCount === 0 && contentCount === 0) 
            ? 0 
            : Math.min(100, Math.round((marketingCount * 25) + (contentCount * 15)));

        // Business Health: composite of profile completeness + marketing + AI activity
        const businessHealth = Math.min(100, Math.round(
            (profileScore * 0.4) + (marketingScore * 0.3) + (aiScore * 0.3)
        ));

        // Recent activity from DB (last 5 actions across all collections)
        const [recentChats, recentContent, recentMarketing, recentSeo, recentImages] = await Promise.all([
            AiChat.find(query).sort({ createdAt: -1 }).limit(2).select('userMessage createdAt'),
            ContentGeneration.find(query).sort({ createdAt: -1 }).limit(1).select('inputs.platform inputs.contentType createdAt'),
            MarketingStrategy.find(query).sort({ createdAt: -1 }).limit(1).select('inputs.marketingGoal createdAt'),
            SeoAnalysis.find(query).sort({ createdAt: -1 }).limit(1).select('inputs.businessCategory createdAt'),
            GeneratedImage.find(query).sort({ createdAt: -1 }).limit(1).select('inputs.prompt createdAt'),
        ]);

        const timeAgo = (date) => {
            const diff = Date.now() - new Date(date).getTime();
            const mins = Math.floor(diff / 60000);
            const hours = Math.floor(mins / 60);
            const days = Math.floor(hours / 24);
            if (mins < 2) return 'Just now';
            if (mins < 60) return `${mins} min ago`;
            if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (days === 1) return 'Yesterday';
            return `${days} days ago`;
        };

        const recentActivity = [];
        recentChats.forEach(c => recentActivity.push({
            icon: '🤖', text: `Nexa AI chat: "${c.userMessage?.slice(0, 40)}..."`,
            time: timeAgo(c.createdAt), color: '#6366f1'
        }));
        recentMarketing.forEach(m => recentActivity.push({
            icon: '🎯', text: `Marketing strategy created for: ${m.inputs?.marketingGoal || 'campaign'}`,
            time: timeAgo(m.createdAt), color: '#8b5cf6'
        }));
        recentContent.forEach(c => recentActivity.push({
            icon: '✍️', text: `${c.inputs?.contentType || 'Content'} generated for ${c.inputs?.platform || 'social'}`,
            time: timeAgo(c.createdAt), color: '#06b6d4'
        }));
        recentSeo.forEach(s => recentActivity.push({
            icon: '🔍', text: `SEO analysis for ${s.inputs?.businessCategory || 'business'}`,
            time: timeAgo(s.createdAt), color: '#f59e0b'
        }));
        recentImages.forEach(img => recentActivity.push({
            icon: '🖼️', text: `Image generated: "${img.inputs?.prompt?.slice(0, 35)}..."`,
            time: timeAgo(img.createdAt), color: '#10b981'
        }));

        recentActivity.sort((a, b) => {
            const order = (t) => t.includes('Just') ? 0 : t.includes('min') ? 1 : t.includes('hour') ? 2 : t.includes('Yesterday') ? 3 : 4;
            return order(a.time) - order(b.time);
        });

        res.status(200).json({
            status: 1,
            data: {
                scores: {
                    aiScore,
                    marketingScore,
                    businessHealth,
                    profileScore
                },
                counts: {
                    chats: chatCount,
                    marketingStrategies: marketingCount,
                    contentPieces: contentCount,
                    seoAnalyses: seoCount,
                    imagesGenerated: imageCount,
                    totalActions: totalAiActions
                },
                recentActivity: recentActivity.slice(0, 5)
            }
        });
    } catch (err) {
        console.error('getUserStats error:', err.message);
        res.status(500).json({ status: 0, message: err.message });
    }
};

/**
 * GET /api/user/analytics-real
 * Returns 100% REAL usage counts from MongoDB for the Analytics page.
 */
export const getRealAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ status: 0, message: 'Authentication required' });

        const query = { userId };
        const [chatCount, marketingCount, contentCount, seoCount, imageCount, businessCount, userDoc] = await Promise.all([
            AiChat.countDocuments(query),
            MarketingStrategy.countDocuments(query),
            ContentGeneration.countDocuments(query),
            SeoAnalysis.countDocuments(query),
            GeneratedImage.countDocuments(query),
            businessData.countDocuments({ userId }),
            userData.findById(userId).select('name email phone authProvider activeBusinessId')
        ]);

        const activeBiz = userDoc?.activeBusinessId 
            ? await businessData.findById(userDoc.activeBusinessId) 
            : await businessData.findOne({ userId });

        // Dynamic Profile completion score based on filled fields
        const profileScore = calculateProfileScore(userDoc, activeBiz, businessCount);

        const totalActions = chatCount + marketingCount + contentCount + seoCount + imageCount;

        // TRUE score calculation: 0 when count is 0, no fake numbers!
        const toScore = (count, target = 20) => count === 0 ? 0 : Math.min(100, Math.round((count / target) * 100));

        const analyticsData = [
            {
                label: 'AI Chat Usage',
                value: toScore(chatCount, 20),
                actualCount: chatCount,
                icon: '🤖',
                color: '#6366f1',
                detail: `${chatCount} chat session${chatCount !== 1 ? 's' : ''} completed`
            },
            {
                label: 'Content Generated',
                value: toScore(contentCount, 20),
                actualCount: contentCount,
                icon: '✍️',
                color: '#06b6d4',
                detail: `${contentCount} content piece${contentCount !== 1 ? 's' : ''} created`
            },
            {
                label: 'Images Generated',
                value: toScore(imageCount, 15),
                actualCount: imageCount,
                icon: '🖼️',
                color: '#10b981',
                detail: `${imageCount} image${imageCount !== 1 ? 's' : ''} generated`
            },
            {
                label: 'Marketing Activity',
                value: toScore(marketingCount, 10),
                actualCount: marketingCount,
                icon: '🎯',
                color: '#8b5cf6',
                detail: `${marketingCount} marketing strateg${marketingCount !== 1 ? 'ies' : 'y'} created`
            },
            {
                label: 'SEO Analyses',
                value: toScore(seoCount, 10),
                actualCount: seoCount,
                icon: '🔍',
                color: '#f59e0b',
                detail: `${seoCount} SEO anal${seoCount !== 1 ? 'yses' : 'ysis'} run`
            }
        ];

        // Real Tool Breakdown for Bar Chart: exactly what user did
        const barChartData = [
            { label: 'AI Chat', count: chatCount, icon: '🤖', color: '#6366f1' },
            { label: 'Content', count: contentCount, icon: '✍️', color: '#06b6d4' },
            { label: 'Images', count: imageCount, icon: '🖼️', color: '#10b981' },
            { label: 'Strategy', count: marketingCount, icon: '🎯', color: '#8b5cf6' },
            { label: 'SEO Audit', count: seoCount, icon: '🔍', color: '#f59e0b' },
        ];

        res.status(200).json({
            status: 1,
            data: {
                analyticsData,
                barChartData,
                counts: {
                    chatCount,
                    marketingCount,
                    contentCount,
                    seoCount,
                    imageCount,
                    totalActions
                }
            }
        });
    } catch (err) {
        console.error('getRealAnalytics error:', err.message);
        res.status(500).json({ status: 0, message: err.message });
    }
};

/**
 * POST /api/user/record-usage
 * Guarantees that any action performed (even via fallback or client-side) is logged in MongoDB.
 */
export const recordUsage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { type, inputs, result, text, prompt, imageUrl } = req.body;
        if (!userId || !type) {
            return res.status(400).json({ status: 0, message: 'User ID and type are required' });
        }

        const user = await userData.findById(userId).select('activeBusinessId');
        const businessId = user?.activeBusinessId || null;

        if (type === 'ai-chat') {
            await AiChat.create({
                userId,
                businessId,
                userMessage: prompt || inputs?.message || 'Chat session',
                aiReply: text || result?.reply || 'Response',
                history: []
            });
        } else if (type === 'marketing-strategy') {
            await MarketingStrategy.create({
                userId,
                businessId,
                inputs: inputs || {},
                result: result || { summary: text || 'Strategy' }
            });
        } else if (type === 'content-generator') {
            await ContentGeneration.create({
                userId,
                businessId,
                inputs: inputs || {},
                content: text || 'Generated content'
            });
        } else if (type === 'image-generator') {
            await GeneratedImage.create({
                userId,
                businessId,
                inputs: inputs || { prompt: prompt || 'AI Image' },
                imageUrl: imageUrl || result?.imageUrl || '',
                engine: 'Gemini'
            });
        } else if (type === 'seo-assistant') {
            await SeoAnalysis.create({
                userId,
                businessId,
                inputs: inputs || {},
                result: result || { score: 75 }
            });
        }

        res.status(200).json({ status: 1, message: 'Usage recorded successfully' });
    } catch (err) {
        console.error('recordUsage error:', err.message);
        res.status(500).json({ status: 0, message: err.message });
    }
};

