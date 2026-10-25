import { generateText, generateStructuredJSON } from '../utils/llmService.js';
import businessData from '../models/business.js';
import userData from '../models/user.js';
import AiChat from '../models/aiChat.js';
import MarketingStrategy from '../models/marketingStrategy.js';
import ContentGeneration from '../models/contentGeneration.js';
import SeoAnalysis from '../models/seoAnalysis.js';
import GeneratedImage from '../models/generatedImage.js';

// Helper to get active business context for a user
const getBusinessContext = async (userId) => {
    try {
        if (!userId) return null;
        const user = await userData.findById(userId).select('activeBusinessId');
        if (!user || !user.activeBusinessId) return null;
        const business = await businessData.findById(user.activeBusinessId);
        return business;
    } catch {
        return null;
    }
};

/**
 * 1. AI Chat Assistant (Nexa AI)
 */
export const handleAIChat = async (req, res) => {
    try {
        const { messages, userMessage } = req.body;
        const business = await getBusinessContext(req.user?.id);

        let bizContextPrompt = '';
        if (business) {
            bizContextPrompt = `\nActive Business Context:\n- Business Name: ${business.businessName}\n- Category: ${business.businessCategory}\n- Description: ${business.businessDescription || 'N/A'}\n- Location: ${business.location || 'N/A'}\n- Goal: ${business.businessGoal || 'N/A'}\n- Target Audience: ${business.targetAudience || 'N/A'}`;
        }

        const systemPrompt = `You are Nexa AI, the intelligent, highly capable business growth consultant for GrowthPilot AI.
Your mission is to provide actionable, realistic, high-impact business advice, sales optimization, marketing campaigns, content ideas, and growth strategies.
Keep responses engaging, structured, practical, and well-formatted with markdown (bold headers, bullet points, numbered steps, emojis where appropriate).
Never invent false customer records or data not provided. Be encouraging and concise.${bizContextPrompt}`;

        let history = [];
        let latestUserMessage = userMessage || '';

        if (Array.isArray(messages) && messages.length > 0) {
            history = messages.map(m => ({
                role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content || m.text || ''
            }));
            // Extract the last user message if not separately provided
            if (!latestUserMessage) {
                const lastUser = [...history].reverse().find(m => m.role === 'user');
                latestUserMessage = lastUser?.content || '';
            }
        } else if (userMessage) {
            history = [{ role: 'user', content: userMessage }];
        } else {
            return res.status(400).json({ status: 0, message: 'Message content is required' });
        }

        // 400 tokens = ~300 words — enough for a focused, helpful chat reply
        const reply = await generateText({
            messages: history,
            systemPrompt,
            temperature: 0.7,
            maxTokens: 400
        });

        // Save to MongoDB asynchronously (don't await so response is faster)
        AiChat.create({
            userId: req.user?.id || null,
            businessId: business?._id || null,
            userMessage: latestUserMessage,
            aiReply: reply,
            history: history
        }).catch(err => console.error('AiChat save error:', err.message));

        res.status(200).json({
            status: 1,
            message: 'Response generated successfully',
            data: {
                reply,
                businessUsed: business?.businessName || null
            }
        });
    } catch (err) {
        console.error('handleAIChat error:', err.message);
        res.status(500).json({ status: 0, message: err.message || 'Failed to generate AI chat response' });
    }
};

/**
 * GET: AI Chat history for the current user
 */
export const getAIChatHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 20;
        const query = userId ? { userId } : {};
        const chats = await AiChat.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('userMessage aiReply createdAt businessId');
        res.status(200).json({ status: 1, data: chats });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

/**
 * 2. Marketing Strategy Generator
 */
export const handleMarketingStrategy = async (req, res) => {
    try {
        const {
            marketingGoal,
            budget,
            targetAudience,
            platform,
            duration,
            product,
            occasion,
            additionalInfo
        } = req.body;

        if (!marketingGoal || !budget) {
            return res.status(400).json({ status: 0, message: 'Marketing goal and budget are required' });
        }

        const business = await getBusinessContext(req.user?.id);

        const systemPrompt = `You are an elite Chief Marketing Officer (CMO). Create a comprehensive, realistic marketing campaign strategy.
You must output a strictly valid JSON object matching this schema:
{
  "title": "string (campaign title)",
  "targetAudience": "string (refined audience summary)",
  "platforms": ["string (primary platform)", "string (secondary platform)"],
  "budget": "string (budget allocation description)",
  "goal": "string (primary objective)",
  "weeks": [
    {
      "week": "Week 1",
      "theme": "string (theme name)",
      "activities": ["string (actionable item 1)", "string (actionable item 2)", "string (actionable item 3)"]
    },
    {
      "week": "Week 2",
      "theme": "string (theme name)",
      "activities": ["string (actionable item 1)", "string (actionable item 2)", "string (actionable item 3)"]
    },
    {
      "week": "Week 3",
      "theme": "string (theme name)",
      "activities": ["string (actionable item 1)", "string (actionable item 2)", "string (actionable item 3)"]
    },
    {
      "week": "Week 4",
      "theme": "string (theme name)",
      "activities": ["string (actionable item 1)", "string (actionable item 2)", "string (actionable item 3)"]
    }
  ],
  "contentIdeas": ["string (idea 1)", "string (idea 2)", "string (idea 3)", "string (idea 4)"],
  "kpis": ["string (quantifiable KPI 1)", "string (quantifiable KPI 2)", "string (quantifiable KPI 3)"]
}`;

        const promptContent = `Generate a strategic marketing plan with the following inputs:
- Business: ${business?.businessName || 'General Business'} (${business?.businessCategory || 'Commercial'})
- Marketing Goal: ${marketingGoal}
- Budget: ${budget}
- Target Audience: ${targetAudience || business?.targetAudience || 'General Consumers'}
- Primary Platform: ${platform || 'Instagram'}
- Duration: ${duration || '30 Days'}
- Product / Service: ${product || 'Core Product'}
- Occasion: ${occasion || 'Regular Campaign'}
- Additional Notes: ${additionalInfo || 'None'}`;

        const fallbackStrategy = {
            title: `${duration || '30 Days'} Growth Campaign for ${business?.businessName || product || 'Business'}`,
            targetAudience: targetAudience || 'Target customers and local buyers',
            platforms: [platform || 'Instagram', 'WhatsApp', 'Facebook'],
            budget: budget || '₹10,000',
            goal: marketingGoal,
            weeks: [
                {
                    week: 'Week 1',
                    theme: 'Brand Awareness & Foundations',
                    activities: [
                        `Publish 5 high-converting posts featuring ${product || 'your key offerings'}`,
                        'Optimize business profile bio with clear call-to-action link',
                        'Launch initial engagement campaign with local hashtags'
                    ]
                },
                {
                    week: 'Week 2',
                    theme: 'Audience Engagement & Product Focus',
                    activities: [
                        'Post 3 engaging video reels showcasing craftsmanship or service highlights',
                        'Run an interactive audience poll or Q&A in stories',
                        'Direct message interested prospects with special introductory offers'
                    ]
                },
                {
                    week: 'Week 3',
                    theme: 'Trust Building & Social Proof',
                    activities: [
                        'Share 3 customer testimonials, unboxings, or positive review screenshots',
                        'Collaborate with 1-2 regional micro-influencers or complementary businesses',
                        'Broadcast exclusive mid-campaign perks via WhatsApp Business'
                    ]
                },
                {
                    week: 'Week 4',
                    theme: 'Direct Conversions & Festive Closing',
                    activities: [
                        `Run a 48-hour limited-time promotional offer for ${occasion || 'this season'}`,
                        'Follow up with previous warm leads through personalized messaging',
                        'Analyze campaign metrics and calculate return on ad spend'
                    ]
                }
            ],
            contentIdeas: [
                `5 ${platform || 'Instagram'} product spotlight posts`,
                '3 short-form viral reels showing before & after or client reaction',
                '2 client testimonial graphics with 5-star ratings',
                '1 festive countdown offer banner with WhatsApp direct link'
            ],
            kpis: [
                '500+ organic reach across target audience',
                '35+ direct inquiries via DM or WhatsApp',
                '20% increase in store or catalogue visits',
                '10+ verified new customer orders'
            ]
        };

        let result;
        try {
            result = await generateStructuredJSON({
                messages: [{ role: 'user', content: promptContent }],
                systemPrompt,
                temperature: 0.5,
                maxTokens: 600,
                fallback: fallbackStrategy
            });
        } catch {
            result = fallbackStrategy;
        }

        // Save to MongoDB
        MarketingStrategy.create({
            userId: req.user?.id || null,
            businessId: business?._id || null,
            inputs: { marketingGoal, budget, targetAudience, platform, duration, product, occasion, additionalInfo },
            result
        }).catch(err => console.error('MarketingStrategy save error:', err.message));

        res.status(200).json({
            status: 1,
            message: 'Marketing strategy generated successfully',
            data: result
        });
    } catch (err) {
        console.error('handleMarketingStrategy error:', err.message);
        res.status(500).json({ status: 0, message: err.message || 'Failed to generate marketing strategy' });
    }
};

/**
 * GET: Marketing strategy history
 */
export const getMarketingHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 10;
        const query = userId ? { userId } : {};
        const items = await MarketingStrategy.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('inputs.marketingGoal inputs.budget result.title createdAt');
        res.status(200).json({ status: 1, data: items });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

/**
 * 3. Content Generator
 */
export const handleContentGenerator = async (req, res) => {
    try {
        const { platform, contentType, product, tone, targetAudience, topic } = req.body;

        if (!product || !product.trim()) {
            return res.status(400).json({ status: 0, message: 'Product or service is required' });
        }

        const business = await getBusinessContext(req.user?.id);

        const systemPrompt = `You are an expert commercial copywriter and viral social media marketer.
Generate high-converting, polished marketing content tailored specifically for the selected platform, content type, and tone.
Include appropriate emojis, call-to-actions (CTAs), and trending, relevant hashtags.
Do not wrap your output in conversational filler like "Here is your caption:". Provide the copy directly.`;

        const userPrompt = `Create ${contentType || 'Caption'} for ${platform || 'Instagram'}:
- Business: ${business?.businessName || 'Brand'}
- Product / Service: ${product}
- Desired Tone: ${tone || 'Professional & Engaging'}
- Target Audience: ${targetAudience || 'Potential Buyers'}
- Topic / Key Highlight: ${topic || 'Feature showcase & offer'}`;

        // 350 tokens = ~260 words — ample for a caption, hashtags, and CTA
        const copy = await generateText({
            messages: [{ role: 'user', content: userPrompt }],
            systemPrompt,
            temperature: 0.7,
            maxTokens: 350
        });

        // Save to MongoDB
        ContentGeneration.create({
            userId: req.user?.id || null,
            businessId: business?._id || null,
            inputs: { platform, contentType, product, tone, targetAudience, topic },
            content: copy
        }).catch(err => console.error('ContentGeneration save error:', err.message));

        res.status(200).json({
            status: 1,
            message: 'Content generated successfully',
            data: {
                content: copy
            }
        });
    } catch (err) {
        console.error('handleContentGenerator error:', err.message);
        res.status(500).json({ status: 0, message: err.message || 'Failed to generate content' });
    }
};

/**
 * GET: Content generation history
 */
export const getContentHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 10;
        const query = userId ? { userId } : {};
        const items = await ContentGeneration.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('inputs content createdAt');
        res.status(200).json({ status: 1, data: items });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

/**
 * 4. SEO Assistant
 */
export const handleSEOAssistant = async (req, res) => {
    try {
        const { website, businessCategory, targetLocation, keywords } = req.body;

        if (!businessCategory || !targetLocation) {
            return res.status(400).json({ status: 0, message: 'Business category and target location are required' });
        }

        const business = await getBusinessContext(req.user?.id);

        const systemPrompt = `You are a Senior SEO Specialist. Analyze the business details and provide an in-depth SEO audit, target keywords, optimized meta title and description, critical audit issues, and actionable tips.
You must output a strictly valid JSON object matching this schema:
{
  "score": number (realistic SEO health score between 60 and 95),
  "keywords": ["string (keyword 1)", "string (keyword 2)", "string (keyword 3)", "string (keyword 4)", "string (keyword 5)"],
  "metaTitle": "string (strictly under 60 chars with brand and location)",
  "metaDescription": "string (compelling meta description between 140-160 chars)",
  "issues": [
    { "type": "success", "text": "string" },
    { "type": "warning", "text": "string" },
    { "type": "error", "text": "string" },
    { "type": "success", "text": "string" }
  ],
  "tips": ["string (actionable tip 1)", "string (actionable tip 2)", "string (actionable tip 3)", "string (actionable tip 4)"]
}`;

        const userPrompt = `Generate SEO recommendations for:
- Business: ${business?.businessName || 'Business'}
- Category: ${businessCategory}
- Target Location: ${targetLocation}
- Website: ${website || business?.website || 'Not provided'}
- Seed Keywords: ${keywords || 'None provided'}`;

        const fallbackSEO = {
            score: 78,
            keywords: [
                `best ${businessCategory.toLowerCase()} in ${targetLocation}`,
                `${businessCategory.toLowerCase()} near me`,
                `top rated ${businessCategory.toLowerCase()} ${targetLocation}`,
                `affordable ${businessCategory.toLowerCase()} services`,
                `${business?.businessName || businessCategory} ${targetLocation}`
            ],
            metaTitle: `${business?.businessName || businessCategory} | Best in ${targetLocation}`,
            metaDescription: `Discover premier ${businessCategory.toLowerCase()} in ${targetLocation}. Top quality, competitive pricing, and exceptional customer care. Contact us today!`,
            issues: [
                { type: 'success', text: `Primary keyword targeting established for ${targetLocation}` },
                { type: 'warning', text: 'Meta description length should remain between 140-160 characters for maximum CTR' },
                { type: 'error', text: 'Missing structured schema markup (LocalBusiness schema recommended)' },
                { type: 'success', text: 'Mobile responsive meta tags and clean URL structure detected' }
            ],
            tips: [
                `Claim and verify your Google Business Profile for ${targetLocation}`,
                'Collect at least 5 new customer reviews monthly with location keywords',
                'Add localized FAQ section answering top customer search queries',
                'Optimize high-resolution images with descriptive alt-tags'
            ]
        };

        let result;
        try {
            result = await generateStructuredJSON({
                messages: [{ role: 'user', content: userPrompt }],
                systemPrompt,
                temperature: 0.4,
                maxTokens: 500,
                fallback: fallbackSEO
            });
        } catch {
            result = fallbackSEO;
        }

        // Save to MongoDB
        SeoAnalysis.create({
            userId: req.user?.id || null,
            businessId: business?._id || null,
            inputs: { website, businessCategory, targetLocation, keywords },
            result
        }).catch(err => console.error('SeoAnalysis save error:', err.message));

        res.status(200).json({
            status: 1,
            message: 'SEO analysis generated successfully',
            data: result
        });
    } catch (err) {
        console.error('handleSEOAssistant error:', err.message);
        res.status(500).json({ status: 0, message: err.message || 'Failed to run SEO assistant' });
    }
};

/**
 * GET: SEO Analysis history
 */
export const getSeoHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 10;
        const query = userId ? { userId } : {};
        const items = await SeoAnalysis.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('inputs result.score result.metaTitle createdAt');
        res.status(200).json({ status: 1, data: items });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

/**
 * 5. Reports Generator (Live Usage-Driven)
 */
export const handleReports = async (req, res) => {
    try {
        const { reportType } = req.body;
        const userId = req.user?.id;
        const query = userId ? { userId } : {};

        // Query real live database counts for this specific user
        const [
            chatCount,
            marketingCount,
            contentCount,
            seoCount,
            imageCount,
            business
        ] = await Promise.all([
            AiChat.countDocuments(query),
            MarketingStrategy.countDocuments(query),
            ContentGeneration.countDocuments(query),
            SeoAnalysis.countDocuments(query),
            GeneratedImage.countDocuments(query),
            getBusinessContext(userId)
        ]);

        const totalActions = chatCount + marketingCount + contentCount + seoCount + imageCount;

        // Build guaranteed live metrics tailored to the specific report type
        let liveMetrics = [];
        const typeStr = (reportType || '').toLowerCase();

        if (typeStr.includes('ai') || typeStr.includes('activity')) {
            liveMetrics = [
                { label: 'Nexa AI Chats', value: `${chatCount}`, positive: true },
                { label: 'Content Generated', value: `${contentCount}`, positive: true },
                { label: 'Marketing Roadmaps', value: `${marketingCount}`, positive: true },
                { label: 'AI Visuals / Images', value: `${imageCount}`, positive: true }
            ];
        } else if (typeStr.includes('marketing') || typeStr.includes('campaign')) {
            liveMetrics = [
                { label: 'Marketing Strategies', value: `${marketingCount}`, positive: true },
                { label: 'Copy & Content Assets', value: `${contentCount}`, positive: true },
                { label: 'Creative Visuals', value: `${imageCount}`, positive: true },
                { label: 'Campaign Velocity', value: marketingCount >= 2 ? 'Accelerated' : marketingCount === 1 ? 'Active' : 'Ready', positive: true }
            ];
        } else if (typeStr.includes('seo') || typeStr.includes('search')) {
            const seoScoreVal = seoCount > 0 ? Math.min(95, 68 + seoCount * 5) : 65;
            liveMetrics = [
                { label: 'SEO Audits Executed', value: `${seoCount}`, positive: true },
                { label: 'SEO Health Index', value: `${seoScoreVal}/100`, positive: true },
                { label: 'Target Category', value: business?.businessCategory || 'Active Business', positive: true },
                { label: 'Search Optimization', value: seoCount > 0 ? 'Active' : 'Audit Advised', positive: true }
            ];
        } else {
            // Business Growth (default)
            const growthIndex = Math.min(98, 45 + Math.min(50, totalActions * 4));
            liveMetrics = [
                { label: 'Total AI Workflows', value: `${totalActions}`, positive: true },
                { label: 'Marketing Strategies', value: `${marketingCount}`, positive: true },
                { label: 'Published Assets', value: `${contentCount + imageCount}`, positive: true },
                { label: 'Growth Health Score', value: `${growthIndex}%`, positive: true }
            ];
        }

        const systemPrompt = `You are a Senior Business Intelligence Analyst for GrowthPilot AI.
Generate a realistic, professional, data-driven report overview grounded in the user's REAL live platform usage.
User's Real Usage Metrics:
- Total Actions: ${totalActions}
- AI Chat Sessions: ${chatCount}
- Marketing Strategies: ${marketingCount}
- Content Pieces Created: ${contentCount}
- SEO Audits Performed: ${seoCount}
- Images Generated: ${imageCount}
- Business Name: ${business?.businessName || 'Your Business'}
- Business Category: ${business?.businessCategory || 'Retail & Services'}

Keep all text concise, punchy, and short (1-2 sentences).
You must output a strictly valid JSON object matching this schema:
{
  "summary": "string (1-2 sentences summarizing their actual live usage metrics and progress)",
  "insights": [
    "string (insight 1 referencing their real activity)",
    "string (insight 2 referencing their assets/strategies)",
    "string (actionable next growth step)"
  ]
}`;

        const userPrompt = `Generate a live ${reportType || 'Business Growth'} report for ${business?.businessName || 'Business'}. Real usage: ${totalActions} total actions (${chatCount} chats, ${marketingCount} strategies, ${contentCount} content, ${seoCount} SEO, ${imageCount} images).`;

        let summary = `Your account has executed ${totalActions} AI growth operations with GrowthPilot AI across marketing, content, and strategy.`;
        let insights = [
            `You have generated ${contentCount} pieces of content and ${imageCount} visual assets.`,
            `Marketing strategy workflows have been run ${marketingCount} times to date.`,
            `Nexa AI consultations have provided intelligence across ${chatCount} interactive sessions.`
        ];

        try {
            const aiData = await generateStructuredJSON({
                messages: [{ role: 'user', content: userPrompt }],
                systemPrompt,
                temperature: 0.4,
                maxTokens: 300
            });
            if (aiData?.summary) summary = aiData.summary;
            if (Array.isArray(aiData?.insights) && aiData.insights.length > 0) insights = aiData.insights;
        } catch (llmErr) {
            console.warn('Live report LLM generation fallback (using real metrics):', llmErr.message);
        }

        res.status(200).json({
            status: 1,
            message: 'Live report generated successfully from user usage',
            data: {
                summary,
                metrics: liveMetrics,
                insights,
                counts: { chatCount, marketingCount, contentCount, seoCount, imageCount, totalActions }
            }
        });
    } catch (err) {
        console.error('handleReports error:', err.message);
        res.status(500).json({ status: 0, message: err.message || 'Failed to generate report' });
    }
};

/**
 * 6. Analytics Insights Generator
 */
export const handleAnalytics = async (req, res) => {
    try {
        const business = await getBusinessContext(req.user?.id);

        const systemPrompt = `You are an AI Analytics Specialist. Generate realistic performance analytics.
Be very concise. Keep recommendations to 1 brief sentence each.
You must output a strictly valid JSON object matching this schema:
{
  "analyticsData": [
    { "label": "AI Usage", "value": 78, "icon": "🤖", "color": "#6366f1", "detail": "string" },
    { "label": "Content Generated", "value": 65, "icon": "✍️", "color": "#06b6d4", "detail": "string" },
    { "label": "Images Generated", "value": 52, "icon": "🖼️", "color": "#10b981", "detail": "string" },
    { "label": "Marketing Activity", "value": 82, "icon": "🎯", "color": "#8b5cf6", "detail": "string" },
    { "label": "SEO Analyses", "value": 70, "icon": "🔍", "color": "#f59e0b", "detail": "string" },
    { "label": "Profile Completion", "value": 85, "icon": "✅", "color": "#ec4899", "detail": "string" }
  ],
  "platformPerformance": [
    { "platform": "Instagram", "score": 82, "color": "#ec4899" },
    { "platform": "Facebook", "score": 64, "color": "#6366f1" },
    { "platform": "WhatsApp", "score": 91, "color": "#10b981" },
    { "platform": "Google", "score": 70, "color": "#f59e0b" }
  ],
  "recommendations": [
    "string (tip 1)",
    "string (tip 2)",
    "string (tip 3)"
  ]
}`;
        const userPrompt = `Generate analytics metrics for:
- Business: ${business?.businessName || 'Active Business'} (${business?.businessCategory || 'Commercial'})`;

        // 350 tokens = enough for 6 analytics bars + 4 platform scores + 3 tips JSON
        const fallbackAnalytics = {
            analyticsData: [
                { label: 'AI Usage', value: 20, icon: '🤖', color: '#6366f1', detail: 'Use Nexa AI to boost your score' },
                { label: 'Content Generated', value: 20, icon: '✍️', color: '#06b6d4', detail: 'Generate content to increase this' },
                { label: 'Images Generated', value: 20, icon: '🖼️', color: '#10b981', detail: 'Create images to see real stats' },
                { label: 'Marketing Activity', value: 20, icon: '🎯', color: '#8b5cf6', detail: 'Run campaigns to grow this metric' },
                { label: 'SEO Analyses', value: 20, icon: '🔍', color: '#f59e0b', detail: 'Run SEO audits to track progress' },
                { label: 'Profile Completion', value: 60, icon: '✅', color: '#ec4899', detail: 'Complete your business profile' }
            ],
            platformPerformance: [
                { platform: 'Instagram', score: 70, color: '#ec4899' },
                { platform: 'Facebook', score: 55, color: '#6366f1' },
                { platform: 'WhatsApp', score: 80, color: '#10b981' },
                { platform: 'Google', score: 60, color: '#f59e0b' }
            ],
            recommendations: [
                'Use Nexa AI chat to generate customized business growth plans.',
                'Create more marketing strategies to improve your campaign health score.',
                'Run regular SEO audits to boost your local search visibility.'
            ]
        };

        const result = await generateStructuredJSON({
            messages: [{ role: 'user', content: userPrompt }],
            systemPrompt,
            temperature: 0.4,
            maxTokens: 350,
            fallback: fallbackAnalytics
        });

        res.status(200).json({
            status: 1,
            message: 'Analytics generated successfully',
            data: result ?? fallbackAnalytics
        });
    } catch (err) {
        console.error('handleAnalytics error:', err.message);
        res.status(500).json({ status: 0, message: err.message || 'Failed to generate analytics' });
    }
};

/**
 * 7. Notifications Generator
 */
export const handleNotifications = async (req, res) => {
    try {
        const business = await getBusinessContext(req.user?.id);

        const systemPrompt = `You are a proactive Business Advisor AI. Generate 4 short, actionable notifications.
Each notification text must be 1 concise sentence.
You must output a strictly valid JSON array of objects matching this schema:
[
  {
    "id": 1,
    "icon": "🎯",
    "title": "string (short headline)",
    "text": "string (1 sentence)",
    "time": "Just now",
    "color": "#6366f1",
    "unread": true
  }
]`;

        const userPrompt = `Generate 4 notifications for:
- Business: ${business?.businessName || 'My Business'} (${business?.businessCategory || 'General'})`;

        // 250 tokens = exactly enough for 4 notification objects JSON array
        const rawList = await generateStructuredJSON({
            messages: [{ role: 'user', content: userPrompt }],
            systemPrompt,
            temperature: 0.4,
            maxTokens: 250,
            fallback: []
        });

        const notifications = Array.isArray(rawList) ? rawList : (rawList?.notifications || []);

        res.status(200).json({
            status: 1,
            message: 'Notifications generated successfully',
            data: notifications
        });
    } catch (err) {
        console.error('handleNotifications error:', err.message);
        res.status(500).json({ status: 0, message: err.message || 'Failed to generate notifications' });
    }
};
