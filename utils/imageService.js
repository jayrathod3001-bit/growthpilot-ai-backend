import axios from 'axios';

/**
 * Generate AI image using Google Gemini as Primary Engine,
 * with Automatic Fallback to Groq + FLUX/High-Resolution AI if Gemini quota/limit is exceeded.
 *
 * @param {Object} params
 * @param {string} params.prompt - Visual concept to render
 * @param {string} [params.style] - Aesthetic style
 * @param {string} [params.imageType] - Type of asset (Product, Social, Banner, etc.)
 * @param {string} [params.ratio] - Aspect ratio string
 */
export const generateAIImage = async ({
    prompt,
    style = 'Modern & Clean',
    imageType = 'Product Advertisement',
    ratio = '1:1 (Square)'
}) => {
    if (!prompt || !prompt.trim()) {
        throw new Error('A valid image prompt is required.');
    }

    // 1. Map aspect ratio
    let aspectRatio = '1:1';
    if (ratio.includes('16:9')) aspectRatio = '16:9';
    else if (ratio.includes('9:16')) aspectRatio = '9:16';
    else if (ratio.includes('4:5') || ratio.includes('3:4')) aspectRatio = '3:4';

    // 2. Build detailed visual prompt
    const enhancedPrompt = `${imageType} of ${prompt}. Style: ${style}. Ultra-detailed, professional studio lighting, 8k resolution, commercial advertising photography, masterpiece quality.`;

    const geminiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    const groqKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
    const useGemini = process.env.USE_GEMINI_IMAGE_GENERATION !== 'false';
    const geminiModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

    // ─────────────────────────────────────────────────────────────
    // PRIMARY ENGINE: Google Gemini Image Generation
    // ─────────────────────────────────────────────────────────────
    if (useGemini && geminiKey) {
        // Try Gemini 2.5 Flash Image / Nano Banana via generateContent
        try {
            console.log(`Attempting image generation via Google Gemini (${geminiModel})...`);
            const geminiRes = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
                {
                    contents: [
                        {
                            parts: [
                                { text: enhancedPrompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseModalities: ['IMAGE']
                    }
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 45000
                }
            );

            const parts = geminiRes.data?.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    const mime = part.inlineData.mimeType || 'image/jpeg';
                    console.log(`Successfully generated image with Google Gemini (${geminiModel})`);
                    return {
                        imageUrl: `data:${mime};base64,${part.inlineData.data}`,
                        engine: `Google Gemini (${geminiModel})`,
                        prompt: enhancedPrompt
                    };
                }
            }
        } catch (geminiError) {
            console.warn('Gemini generateContent error/quota:', geminiError.response?.data?.error?.message || geminiError.message);
        }

        // Try Imagen predict endpoint as secondary Gemini attempt
        try {
            const imagenRes = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict',
                {
                    instances: [{ prompt: enhancedPrompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: aspectRatio,
                        outputMimeType: 'image/jpeg'
                    }
                },
                {
                    headers: {
                        'x-goog-api-key': geminiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 45000
                }
            );

            const base64Data = imagenRes.data?.predictions?.[0]?.bytesBase64Encoded;
            if (base64Data) {
                console.log('Successfully generated image with Google Gemini (Imagen 3)');
                return {
                    imageUrl: `data:image/jpeg;base64,${base64Data}`,
                    engine: 'Google Gemini (Imagen 3)',
                    prompt: enhancedPrompt
                };
            }
        } catch (imagenError) {
            console.warn('Gemini Imagen error:', imagenError.response?.data?.error?.message || imagenError.message);
            console.log('Switching automatically to Backup Engine (Groq + High-Res AI)...');
        }
    } else {
        console.log('Gemini image generation disabled or API key not provided. Proceeding with Backup Engine.');
    }

    // ─────────────────────────────────────────────────────────────
    // BACKUP ENGINE: Groq Prompt Optimization + High-Res Image Engine
    // ─────────────────────────────────────────────────────────────
    try {
        let visualPrompt = enhancedPrompt;

        // Use Groq to refine the visual prompt if key is available
        if (groqKey) {
            try {
                const groqRes = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'qwen/qwen3.8-27b',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert commercial advertising photographer. Convert the user concept into a single concise 1-paragraph visual prompt for photorealistic commercial rendering. Only output the final visual description.'
                            },
                            {
                                role: 'user',
                                content: `Concept: ${prompt}. Type: ${imageType}. Style: ${style}.`
                            }
                        ],
                        max_tokens: 150,
                        temperature: 0.7
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${groqKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );

                const refined = groqRes.data?.choices?.[0]?.message?.content?.trim();
                if (refined) visualPrompt = refined;
            } catch (groqErr) {
                console.warn('Groq prompt enhancement skipped:', groqErr.message);
            }
        }

        // Map dimensions
        let width = 1024;
        let height = 1024;
        if (aspectRatio === '16:9') { width = 1280; height = 720; }
        else if (aspectRatio === '9:16') { width = 720; height = 1280; }
        else if (aspectRatio === '3:4') { width = 768; height = 1024; }

        const seed = Math.floor(Math.random() * 9999999);
        const encoded = encodeURIComponent(visualPrompt);
        // Reliable high-res image generation URL without paid flux token gate
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        // Attempt to fetch as Base64 for instant embedded rendering, with graceful URL fallback
        try {
            const imgResponse = await axios.get(fallbackUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                responseType: 'arraybuffer',
                timeout: 15000
            });
            const imageBase64 = Buffer.from(imgResponse.data, 'binary').toString('base64');
            return {
                imageUrl: `data:image/jpeg;base64,${imageBase64}`,
                engine: groqKey ? 'Groq + AI Diffusion (Backup Engine)' : 'High-Res AI Diffusion (Backup Engine)',
                prompt: visualPrompt
            };
        } catch {
            console.log('Returning direct AI image URL for instant frontend rendering.');
            return {
                imageUrl: fallbackUrl,
                engine: groqKey ? 'Groq + AI Diffusion (Backup Engine)' : 'High-Res AI Diffusion (Backup Engine)',
                prompt: visualPrompt
            };
        }
    } catch (fallbackError) {
        console.error('Backup engine error:', fallbackError.message);
        throw new Error('Image generation failed on both Gemini and Backup engines. Please verify network connectivity.');
    }
};
