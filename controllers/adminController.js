import jwt from 'jsonwebtoken'
import secretKey from '../jwtConfig.js'
import userData from '../models/user.js'
import businessData from '../models/business.js'
import AiChat from '../models/aiChat.js'
import MarketingStrategy from '../models/marketingStrategy.js'
import ContentGeneration from '../models/contentGeneration.js'
import SeoAnalysis from '../models/seoAnalysis.js'
import GeneratedImage from '../models/generatedImage.js'

// ── Admin Login ────────────────────────────────────────────────────
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

        if (!email || !password) {
            return res.status(200).json({ message: 'Email and password required', status: 0 })
        }

        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return res.status(200).json({ message: 'Invalid admin credentials', status: 0 })
        }

        const token = jwt.sign(
            { email: ADMIN_EMAIL, isAdmin: true },
            secretKey,
            { expiresIn: '12h' }
        )

        res.status(200).json({ message: 'Admin login successful', status: 1, token })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Dashboard Stats ────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalBusinesses,
            totalChats,
            totalMarketing,
            totalContent,
            totalImages,
            totalSeo
        ] = await Promise.all([
            userData.countDocuments(),
            businessData.countDocuments(),
            AiChat.countDocuments(),
            MarketingStrategy.countDocuments(),
            ContentGeneration.countDocuments(),
            GeneratedImage.countDocuments(),
            SeoAnalysis.countDocuments()
        ])

        const totalAiActions = totalChats + totalMarketing + totalContent + totalImages + totalSeo

        const toolUsage = [
            { label: 'AI Chat', count: totalChats, icon: '🤖', color: '#6366f1' },
            { label: 'Marketing', count: totalMarketing, icon: '🎯', color: '#8b5cf6' },
            { label: 'Content', count: totalContent, icon: '✍️', color: '#06b6d4' },
            { label: 'Image Gen', count: totalImages, icon: '🖼️', color: '#10b981' },
            { label: 'SEO Audit', count: totalSeo, icon: '🔍', color: '#f59e0b' },
        ]

        // Users joined per month (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
        sixMonthsAgo.setDate(1)
        sixMonthsAgo.setHours(0, 0, 0, 0)

        const usersPerMonth = await userData.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])

        // Businesses per category
        const businessByCategory = await businessData.aggregate([
            { $group: { _id: '$businessCategory', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ])

        // Businesses per month (last 6 months)
        const businessesPerMonth = await businessData.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])

        // Business Goals distribution
        const goalDistribution = await businessData.aggregate([
            { $match: { businessGoal: { $ne: '' } } },
            { $group: { _id: '$businessGoal', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])

        // Recent activity feed across platform
        const [recentChats, recentMarketingDocs, recentContentDocs, recentImagesDocs, recentSeoDocs] = await Promise.all([
            AiChat.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name email'),
            MarketingStrategy.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name email'),
            ContentGeneration.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name email'),
            GeneratedImage.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name email'),
            SeoAnalysis.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name email')
        ])

        const activityFeed = []
        recentChats.forEach(c => activityFeed.push({
            user: c.userId?.name || c.userId?.email || 'User',
            action: `AI Chat: "${(c.userMessage || '').slice(0, 35)}..."`,
            type: 'AI Chat',
            icon: '🤖',
            color: '#6366f1',
            createdAt: c.createdAt
        }))
        recentMarketingDocs.forEach(m => activityFeed.push({
            user: m.userId?.name || m.userId?.email || 'User',
            action: `Marketing: ${m.inputs?.marketingGoal || 'Strategy roadmap'}`,
            type: 'Marketing',
            icon: '🎯',
            color: '#8b5cf6',
            createdAt: m.createdAt
        }))
        recentContentDocs.forEach(c => activityFeed.push({
            user: c.userId?.name || c.userId?.email || 'User',
            action: `Content: ${c.inputs?.contentType || 'Copy'} for ${c.inputs?.platform || 'Social'}`,
            type: 'Content',
            icon: '✍️',
            color: '#06b6d4',
            createdAt: c.createdAt
        }))
        recentImagesDocs.forEach(i => activityFeed.push({
            user: i.userId?.name || i.userId?.email || 'User',
            action: `Image: "${(i.inputs?.prompt || '').slice(0, 30)}..."`,
            type: 'Image',
            icon: '🖼️',
            color: '#10b981',
            createdAt: i.createdAt
        }))
        recentSeoDocs.forEach(s => activityFeed.push({
            user: s.userId?.name || s.userId?.email || 'User',
            action: `SEO Audit: ${s.inputs?.businessCategory || 'Website'}`,
            type: 'SEO',
            icon: '🔍',
            color: '#f59e0b',
            createdAt: s.createdAt
        }))

        activityFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        res.status(200).json({
            status: 1,
            data: {
                totalUsers,
                totalBusinesses,
                totalAiActions,
                counts: {
                    chats: totalChats,
                    marketing: totalMarketing,
                    content: totalContent,
                    images: totalImages,
                    seo: totalSeo
                },
                toolUsage,
                usersPerMonth,
                businessesPerMonth,
                businessByCategory,
                goalDistribution,
                recentActivity: activityFeed.slice(0, 6)
            }
        })
    } catch (error) {
        console.error('getDashboardStats error:', error.message)
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Get All Users With Real Usage Breakdown ────────────────────────
export const adminGetAllUsers = async (req, res) => {
    try {
        const users = await userData.find().select('-password').sort({ createdAt: -1 })

        const userUsageMap = {}
        users.forEach(u => {
            userUsageMap[u._id.toString()] = {
                chats: 0,
                marketing: 0,
                content: 0,
                images: 0,
                seo: 0,
                total: 0
            }
        })

        // Fetch counts for all users in parallel using MongoDB aggregation
        const [chatAggr, mktAggr, cntAggr, imgAggr, seoAggr, bizAggr] = await Promise.all([
            AiChat.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }]),
            MarketingStrategy.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }]),
            ContentGeneration.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }]),
            GeneratedImage.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }]),
            SeoAnalysis.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }]),
            businessData.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }])
        ])

        chatAggr.forEach(c => {
            const id = c._id?.toString()
            if (id && userUsageMap[id]) userUsageMap[id].chats = c.count
        })
        mktAggr.forEach(m => {
            const id = m._id?.toString()
            if (id && userUsageMap[id]) userUsageMap[id].marketing = m.count
        })
        cntAggr.forEach(c => {
            const id = c._id?.toString()
            if (id && userUsageMap[id]) userUsageMap[id].content = c.count
        })
        imgAggr.forEach(i => {
            const id = i._id?.toString()
            if (id && userUsageMap[id]) userUsageMap[id].images = i.count
        })
        seoAggr.forEach(s => {
            const id = s._id?.toString()
            if (id && userUsageMap[id]) userUsageMap[id].seo = s.count
        })

        const bizMap = {}
        bizAggr.forEach(b => {
            const id = b._id?.toString()
            if (id) bizMap[id] = b.count
        })

        const enrichedUsers = users.map(u => {
            const id = u._id.toString()
            const usage = userUsageMap[id] || { chats: 0, marketing: 0, content: 0, images: 0, seo: 0, total: 0 }
            usage.total = usage.chats + usage.marketing + usage.content + usage.images + usage.seo
            return {
                ...u.toObject(),
                businessCount: bizMap[id] || 0,
                usage
            }
        })

        res.status(200).json({ message: 'Users fetched', status: 1, data: enrichedUsers })
    } catch (error) {
        console.error('adminGetAllUsers error:', error.message)
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Get Single User + Their Businesses + Usage Detail ─────────────
export const adminGetUserDetail = async (req, res) => {
    try {
        const id = req.params.uid
        const user = await userData.findById(id).select('-password')
        if (!user) return res.status(404).json({ message: 'User not found', status: 0 })

        const query = { userId: id }

        const [
            businesses,
            chatCount,
            marketingCount,
            contentCount,
            imageCount,
            seoCount,
            recentChats,
            recentMarketing,
            recentContent,
            recentImages,
            recentSeo
        ] = await Promise.all([
            businessData.find(query).sort({ createdAt: -1 }),
            AiChat.countDocuments(query),
            MarketingStrategy.countDocuments(query),
            ContentGeneration.countDocuments(query),
            GeneratedImage.countDocuments(query),
            SeoAnalysis.countDocuments(query),
            AiChat.find(query).sort({ createdAt: -1 }).limit(3).select('userMessage createdAt'),
            MarketingStrategy.find(query).sort({ createdAt: -1 }).limit(3).select('inputs createdAt'),
            ContentGeneration.find(query).sort({ createdAt: -1 }).limit(3).select('inputs content createdAt'),
            GeneratedImage.find(query).sort({ createdAt: -1 }).limit(3).select('inputs imageUrl createdAt'),
            SeoAnalysis.find(query).sort({ createdAt: -1 }).limit(3).select('inputs result.score createdAt')
        ])

        const totalActions = chatCount + marketingCount + contentCount + imageCount + seoCount

        const activityList = []
        recentChats.forEach(c => activityList.push({
            icon: '🤖', title: 'AI Chat', text: c.userMessage || 'Chat session',
            color: '#6366f1', createdAt: c.createdAt
        }))
        recentMarketing.forEach(m => activityList.push({
            icon: '🎯', title: 'Marketing Strategy', text: m.inputs?.marketingGoal || 'Strategy',
            color: '#8b5cf6', createdAt: m.createdAt
        }))
        recentContent.forEach(c => activityList.push({
            icon: '✍️', title: 'Content Generation', text: `${c.inputs?.contentType || 'Copy'} for ${c.inputs?.platform || 'Social'}`,
            color: '#06b6d4', createdAt: c.createdAt
        }))
        recentImages.forEach(i => activityList.push({
            icon: '🖼️', title: 'Generated Image', text: i.inputs?.prompt || 'Image generation',
            color: '#10b981', createdAt: i.createdAt
        }))
        recentSeo.forEach(s => activityList.push({
            icon: '🔍', title: 'SEO Audit', text: `${s.inputs?.businessCategory || 'Website'} (Score: ${s.result?.score || 'N/A'})`,
            color: '#f59e0b', createdAt: s.createdAt
        }))

        activityList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        res.status(200).json({
            status: 1,
            data: {
                user,
                businesses,
                usage: {
                    chats: chatCount,
                    marketing: marketingCount,
                    content: contentCount,
                    images: imageCount,
                    seo: seoCount,
                    total: totalActions
                },
                recentActivity: activityList.slice(0, 8)
            }
        })
    } catch (error) {
        console.error('adminGetUserDetail error:', error.message)
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Update User (admin) ────────────────────────────────────────────
export const adminUpdateUser = async (req, res) => {
    try {
        const id = req.params.uid
        const updatedUser = await userData.findByIdAndUpdate(
            id,
            { name: req.body.name, email: req.body.email },
            { new: true, runValidators: true }
        ).select('-password')
        res.status(200).json({ message: 'User updated', status: 1, data: updatedUser })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Delete User + Their Businesses ────────────────────────────────
export const adminDeleteUser = async (req, res) => {
    try {
        const id = req.params.uid
        await businessData.deleteMany({ userId: id })
        const deletedUser = await userData.findByIdAndDelete(id)
        res.status(200).json({ message: 'User and their businesses deleted', status: 1, data: deletedUser })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Get All Businesses ─────────────────────────────────────────────
export const adminGetAllBusinesses = async (req, res) => {
    try {
        const businesses = await businessData.find().sort({ createdAt: -1 }).populate('userId', 'name email')
        res.status(200).json({ message: 'Businesses fetched', status: 1, data: businesses })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Update Business (admin) ────────────────────────────────────────
export const adminUpdateBusiness = async (req, res) => {
    try {
        const id = req.params.bid
        const updated = await businessData.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
        res.status(200).json({ message: 'Business updated', status: 1, data: updated })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// ── Delete Business (admin) ────────────────────────────────────────
export const adminDeleteBusiness = async (req, res) => {
    try {
        const id = req.params.bid
        const deleted = await businessData.findByIdAndDelete(id)
        res.status(200).json({ message: 'Business deleted', status: 1, data: deleted })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}
