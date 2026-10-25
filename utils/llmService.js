import axios from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

// Persistent agents with keep-alive for fast repeated calls
const keepAliveHttp = new HttpAgent({ keepAlive: true, maxSockets: 5 });
const keepAliveHttps = new HttpsAgent({ keepAlive: true, maxSockets: 5 });

// Axios instance tuned for local & ngrok LLM calls
const localLLMAxios = axios.create({
    httpAgent: keepAliveHttp,
    httpsAgent: keepAliveHttps,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'GrowthPilot-AI'
    }
});

let cachedModel = null;

/**
 * Normalizes user-provided or environment base URLs so paths are clean
 * (e.g. strips trailing slash, ensures /v1 suffix).
 */
export const normalizeBaseUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
        return 'http://127.0.0.1:8080/v1';
    }
    let url = rawUrl.trim();
    // Strip trailing slashes
    url = url.replace(/\/+$/, '');
    // Ensure /v1 endpoint segment
    if (!url.endsWith('/v1')) {
        url = `${url}/v1`;
    }
    return url;
};

/**
 * Common headers for local or ngrok LLM requests, including optional auth.
 */
const getLocalLLMHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'GrowthPilot-AI'
    };
    if (process.env.LOCAL_LLM_API_KEY && process.env.LOCAL_LLM_API_KEY.trim()) {
        headers['Authorization'] = `Bearer ${process.env.LOCAL_LLM_API_KEY.trim()}`;
    }
    return headers;
};

/**
 * Resolves the active model identifier from the local/ngrok OpenAI-compatible server.
 */
export const getLocalModel = async (baseUrl) => {
    if (process.env.LOCAL_LLM_MODEL && process.env.LOCAL_LLM_MODEL.trim()) {
        return process.env.LOCAL_LLM_MODEL.trim();
    }
    if (cachedModel) {
        return cachedModel;
    }

    try {
        const response = await localLLMAxios.get(`${baseUrl}/models`, {
            headers: getLocalLLMHeaders(),
            timeout: 8000
        });
        const modelsList = response.data?.data || response.data?.models || [];
        if (modelsList.length > 0) {
            cachedModel = modelsList[0].id || modelsList[0].name || modelsList[0].model;
            console.log(`[Local LLM] Auto-detected model: ${cachedModel}`);
            return cachedModel;
        }
    } catch (err) {
        console.warn(`[Local LLM] Could not auto-detect model from /models: ${err.message}. Using default.`);
    }

    return 'qwen2.5-coder-3b-instruct-q4_k_m.gguf';
};

/**
 * Core text generation using the locally running Qwen model via OpenAI-compatible endpoint.
 *
 * @param {Object} options
 * @param {Array} options.messages - Array of { role: 'system'|'user'|'assistant', content: string }
 * @param {string} [options.systemPrompt] - Optional system instructions
 * @param {number} [options.temperature] - Generation temperature (default 0.7)
 * @param {number} [options.maxTokens] - Max tokens to generate
 * @param {number} [options.timeout] - Timeout in milliseconds
 * @returns {Promise<string>} Generated text
 */
const getFallbackText = (messages, systemPrompt) => {
    const lastMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const q = (lastMsg + ' ' + (systemPrompt || '')).toLowerCase();

    if (q.includes('sale') || q.includes('revenue') || q.includes('customer') || q.includes('profit')) {
        return `Here are 3 practical, high-impact strategies to increase your business sales:

1. **Urgency & Flash Deals**: Launch 48-hour promotional offers on your best-selling items. Create a sense of urgency via WhatsApp broadcast and Instagram stories with countdown stickers.
2. **Social Proof & Testimonials**: Showcase video reviews, customer unboxing, and real photos to build instant trust.
3. **Targeted Follow-ups**: Retarget previous inquiries with a customized 10-15% courtesy discount voucher.

Focus on direct engagement and quick query resolution to maximize conversion rates!`;
    }

    if (q.includes('market') || q.includes('campaign') || q.includes('grow')) {
        return `Here is a tailored marketing growth plan for your business:

- **Phase 1 (Brand Awareness)**: Post 4-5 high quality visual reels/posts per week targeting local shoppers and enthusiasts.
- **Phase 2 (Community Engagement)**: Run interactive polls, behind-the-scenes stories, and festive giveaways.
- **Phase 3 (Conversion)**: Use WhatsApp Business catalogs and targeted local ads with clear CTA buttons.

Consistent messaging and quick response time will ensure a 30-40% increase in weekly inquiries.`;
    }

    if (q.includes('instagram') || q.includes('social') || q.includes('reel') || q.includes('post')) {
        return `Here is your Instagram Growth Blueprint:

- **Posting Schedule**: 3 Product Spotlight Posts + 2 Reels + Daily Stories.
- **Peak Times**: 1:00 PM - 3:00 PM and 7:30 PM - 9:30 PM.
- **Engagement Hack**: Use question stickers in stories and reply to all DMs within 15 minutes.
- **Trending Strategy**: Highlight customer styling tips and behind-the-scenes creation process.`;
    }

    if (q.includes('seo') || q.includes('google') || q.includes('rank')) {
        return `Here are essential SEO optimizations for your business:

1. **Google My Business**: Complete 100% of your profile, add weekly photos, and request reviews from satisfied clients.
2. **Local Keywords**: Include your city/neighborhood in product titles and webpage headers.
3. **Speed & Mobile**: Ensure fast load times and clean mobile navigation.
4. **Content Hub**: Create helpful buying guides and FAQ sections for top searched queries.`;
    }

    return `Hello! I am **Nexa AI**, your intelligent business growth consultant. 

I can assist you with:
- 📈 Increasing sales, revenue, and customer retention
- 🎯 Marketing campaigns and multi-channel reach
- 📸 Social media, Reels, and engaging content ideas
- 🔍 SEO optimization and local search visibility

How can I help boost your business today?`;
};

/**
 * NVIDIA API Text Generation
 */
/**
 * NVIDIA API Text Generation (build.nvidia.com)
 */
const callNvidiaApi = async ({ fullMessages, temperature, maxTokens, timeout }) => {
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey || !nvidiaKey.trim()) return null;

    const rawBaseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    let baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
    if (!baseUrl.endsWith('/v1')) {
        baseUrl = `${baseUrl}/v1`;
    }
    const endpoint = `${baseUrl}/chat/completions`;
    const model = process.env.NVIDIA_MODEL || 'minimaxai/minimax-m3.1-flash';
    // Keep timeout reasonable (15-20s) so rate limits or queue delays fail over quickly
    const requestTimeout = parseInt(process.env.NVIDIA_TIMEOUT, 10) || timeout || 20000;

    try {
        const res = await axios.post(endpoint, {
            model,
            messages: fullMessages,
            temperature: typeof temperature === 'number' ? temperature : 0.6,
            max_tokens: Math.max(maxTokens || 1024, 600),
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${nvidiaKey.trim()}`,
                'Content-Type': 'application/json'
            },
            timeout: requestTimeout
        });

        const choice = res.data?.choices?.[0];
        if (!choice) return null;

        let output = choice.message?.content;
        if (!output && choice.message?.reasoning_content) {
            output = choice.message.reasoning_content;
        }

        if (output && typeof output === 'string' && output.trim()) {
            return output.trim();
        }
        return null;
    } catch (nvidiaErr) {
        const status = nvidiaErr.response?.status;
        const errMsg = nvidiaErr.response?.data?.message || nvidiaErr.response?.data?.error?.message || nvidiaErr.message;
        console.warn(`[NVIDIA API] Notice (HTTP ${status || 'timeout'}): ${errMsg}. Failover to backup provider.`);
        return null;
    }
};

/**
 * Groq Cloud AI Generation (Lightning fast 120B / 20B models)
 */
const callGroqApi = async ({ fullMessages, temperature, maxTokens, timeout, jsonMode = false }) => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || !groqKey.trim()) return null;

    const model = jsonMode ? 'openai/gpt-oss-20b' : (process.env.GROQ_MODEL || 'openai/gpt-oss-120b');
    const requestTimeout = timeout || 25000;

    try {
        const payload = {
            model,
            messages: fullMessages,
            temperature: typeof temperature === 'number' ? temperature : 0.7,
            max_tokens: maxTokens || 2048,
            stream: false
        };

        if (jsonMode) {
            payload.response_format = { type: 'json_object' };
        }

        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
            headers: {
                'Authorization': `Bearer ${groqKey.trim()}`,
                'Content-Type': 'application/json'
            },
            timeout: requestTimeout
        });

        const content = res.data?.choices?.[0]?.message?.content;
        if (content && typeof content === 'string' && content.trim()) {
            return content.trim();
        }
        return null;
    } catch (groqErr) {
        const errMsg = groqErr.response?.data?.error?.message || groqErr.message;
        console.warn(`[Groq Cloud] API notice: ${errMsg}.`);
        return null;
    }
};

export const generateText = async ({
    messages = [],
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = 2048,
    timeout = 90000,
    jsonMode = false
}) => {
    const fullMessages = [];
    if (systemPrompt && systemPrompt.trim()) {
        fullMessages.push({ role: 'system', content: systemPrompt.trim() });
    }
    for (const msg of messages) {
        if (msg && msg.role && msg.content) {
            fullMessages.push({ role: msg.role === 'ai' ? 'assistant' : msg.role, content: String(msg.content) });
        }
    }

    const preferredProvider = process.env.AI_PROVIDER || (process.env.USE_GROQ_API === 'true' ? 'groq' : 'nvidia');

    // Strategy 1: If Groq is preferred or configured as primary
    if (preferredProvider === 'groq') {
        const groqResult = await callGroqApi({ fullMessages, temperature, maxTokens, timeout, jsonMode });
        if (groqResult) return groqResult;

        const nvidiaResult = await callNvidiaApi({ fullMessages, temperature, maxTokens, timeout });
        if (nvidiaResult) return nvidiaResult;
    } else {
        // Strategy 2: Primary NVIDIA, with instant Groq failover
        const useNvidia = process.env.USE_NVIDIA_API !== 'false' && Boolean(process.env.NVIDIA_API_KEY);
        if (useNvidia) {
            const nvidiaResult = await callNvidiaApi({ fullMessages, temperature, maxTokens, timeout });
            if (nvidiaResult) return nvidiaResult;
        }

        // Groq High-Speed Cloud Fallback (openai/gpt-oss-120b)
        const groqResult = await callGroqApi({ fullMessages, temperature, maxTokens, timeout, jsonMode });
        if (groqResult) return groqResult;
    }

    // Strategy 3: Local LLM (if enabled)
    const useLocalLLM = process.env.USE_LOCAL_LLM === 'true';
    if (useLocalLLM) {
        const rawBaseUrl = process.env.LOCAL_LLM_BASE_URL || 'http://127.0.0.1:8080/v1';
        const baseUrl = normalizeBaseUrl(rawBaseUrl);
        const configuredTimeout = parseInt(process.env.LOCAL_LLM_TIMEOUT, 10) || timeout || 90000;

        try {
            const model = await getLocalModel(baseUrl);
            const localRes = await localLLMAxios.post(`${baseUrl}/chat/completions`, {
                model,
                messages: fullMessages,
                temperature: typeof temperature === 'number' ? temperature : (parseFloat(process.env.LOCAL_LLM_TEMPERATURE) || 0.7),
                max_tokens: maxTokens || parseInt(process.env.LOCAL_LLM_MAX_TOKENS, 10) || 2048,
                stream: false
            }, {
                headers: getLocalLLMHeaders(),
                timeout: configuredTimeout
            });

            const localContent = localRes.data?.choices?.[0]?.message?.content;
            if (localContent && typeof localContent === 'string' && localContent.trim()) {
                return localContent.trim();
            }
        } catch (localErr) {
            const endpointType = baseUrl.includes('ngrok') ? 'ngrok tunnel' : 'local server';
            console.warn(`[Local LLM] ${endpointType} notice: ${localErr.message}.`);
        }
    }

    // Ultimate fallback template: Never break production for the end user!
    return getFallbackText(messages, systemPrompt);
};

/**
 * Helper to generate and safely extract structured JSON.
 * Includes auto-repair for truncated outputs, native JSON mode, and graceful fallback.
 */
export const generateStructuredJSON = async ({
    messages = [],
    systemPrompt = '',
    temperature = 0.3,
    maxTokens = 800,   // safety default
    fallback = null
}) => {
    const jsonInstruction = `\nCRITICAL: Respond ONLY with a valid JSON object matching the requested structure. No markdown backticks, no preamble, no "Here is", no thinking text, no explanations. Start directly with { and end with }.`;
    const enrichedSystemPrompt = (systemPrompt || '') + jsonInstruction;

    const rawText = await generateText({
        messages,
        systemPrompt: enrichedSystemPrompt,
        temperature,
        maxTokens,
        jsonMode: true
    });

    const repairJSON = (text) => {
        let cleaned = text.trim();
        // Strip markdown fences
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/i, '');
        }
        cleaned = cleaned.trim();

        // Extract JSON substring if surrounded by extra commentary
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');

        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            const lastBracket = cleaned.lastIndexOf(']');
            if (lastBracket !== -1 && lastBracket > firstBracket) {
                cleaned = cleaned.slice(firstBracket, lastBracket + 1);
            }
        } else if (firstBrace !== -1) {
            const lastBrace = cleaned.lastIndexOf('}');
            if (lastBrace !== -1 && lastBrace > firstBrace) {
                cleaned = cleaned.slice(firstBrace, lastBrace + 1);
            }
        }

        // Attempt direct parse first
        try {
            return JSON.parse(cleaned);
        } catch { }

        // Attempt repair: balance open brackets and braces
        try {
            const repaired = balanceJSON(cleaned);
            return JSON.parse(repaired);
        } catch { }

        return null;
    };

    const balanceJSON = (str) => {
        // Remove trailing commas before closing brackets
        let s = str.replace(/,\s*([\]}])/g, '$1');
        // Remove any characters after the last complete value
        const openBraces = (s.match(/\{/g) || []).length;
        const closeBraces = (s.match(/\}/g) || []).length;
        const openBrackets = (s.match(/\[/g) || []).length;
        const closeBrackets = (s.match(/\]/g) || []).length;
        // Close unclosed strings (trailing incomplete string in last array item)
        if ((s.match(/"/g) || []).length % 2 !== 0) {
            s += '"';
        }
        // Close unclosed arrays
        for (let i = 0; i < openBrackets - closeBrackets; i++) s += ']';
        // Close unclosed objects
        for (let i = 0; i < openBraces - closeBraces; i++) s += '}';
        return s;
    };

    const result = repairJSON(rawText);
    if (result !== null) return result;

    console.warn('Could not parse JSON from LLM output, using fallback');
    if (fallback !== null) return fallback;
    throw new Error(`Failed to parse structured JSON from model output`);
};
