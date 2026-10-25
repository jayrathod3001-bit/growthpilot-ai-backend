import 'dotenv/config';
import { generateText, generateStructuredJSON } from './utils/llmService.js';
import { generateAIImage } from './utils/imageService.js';

async function runTests() {
    console.log('--- 1. Testing Local Qwen Text Generation ---');
    try {
        const text = await generateText({
            messages: [{ role: 'user', content: 'Give 1 marketing tip for a jewellery shop in 1 sentence.' }]
        });
        console.log('Qwen Text Output:\n', text);
    } catch (e) {
        console.error('Qwen Text Generation Failed:', e.message);
    }

    console.log('\n--- 2. Testing Local Qwen Structured JSON Generation ---');
    try {
        const json = await generateStructuredJSON({
            messages: [{ role: 'user', content: 'Generate JSON with keys "title" and "points" (array of 2 strings) for a summer sale.' }]
        });
        console.log('Qwen JSON Output:\n', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Qwen JSON Generation Failed:', e.message);
    }

    console.log('\n--- 3. Testing Image Generation Service ---');
    try {
        const img = await generateAIImage({
            prompt: 'luxury gold bracelet on silk background',
            style: 'Luxury',
            imageType: 'Product Advertisement',
            ratio: '1:1'
        });
        console.log('Image Generation Success! Engine:', img.engine);
        console.log('Image URL/Data prefix:', img.imageUrl ? img.imageUrl.slice(0, 60) : 'none');
    } catch (e) {
        console.error('Image Generation Failed:', e.message);
    }
}

runTests();
